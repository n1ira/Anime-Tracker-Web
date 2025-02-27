import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../db/db";
import { shows } from "../../../db/schema/shows";
import { activityLogs } from "../../../db/schema/activity_logs";
import { eq } from "drizzle-orm";
import { searchNyaa, parseTorrentTitle, matchesTorrent } from "../../../lib/nyaa";
import { Show } from "../../../lib/types";
import { updateFoundMagnetLinks, clearFoundMagnetLinks } from "./magnets/route";

// Global state to track ongoing scans
let isScanning = false;
let currentScanJob: {
  showId: number | null;
  progress: {
    current: number;
    total: number;
    currentShow: string | null;
  };
} = {
  showId: null,
  progress: {
    current: 0,
    total: 0,
    currentShow: null,
  },
};

// GET /api/scan/status - Get current scan status
export async function GET() {
  return NextResponse.json({
    isScanning,
    progress: currentScanJob.progress,
    showId: currentScanJob.showId,
  });
}

// POST /api/scan - Start a scan for a specific show or all shows
export async function POST(request: NextRequest) {
  try {
    // Check if a scan is already in progress
    if (isScanning) {
      return NextResponse.json(
        { error: "A scan is already in progress" },
        { status: 409 }
      );
    }

    // Clear any previous magnet links
    clearFoundMagnetLinks();

    const body = await request.json();
    const showId = body.showId ? parseInt(body.showId) : null;

    // Get shows to scan
    let showsToScan: Show[] = [];
    if (showId) {
      // Scan a specific show
      const result = await db
        .select()
        .from(shows)
        .where(eq(shows.id, showId));

      if (result.length === 0) {
        return NextResponse.json(
          { error: "Show not found" },
          { status: 404 }
        );
      }

      showsToScan = result as Show[];
    } else {
      // Scan all shows
      showsToScan = (await db.select().from(shows)) as Show[];
    }

    if (showsToScan.length === 0) {
      return NextResponse.json(
        { error: "No shows to scan" },
        { status: 400 }
      );
    }

    // Start the scan in the background
    isScanning = true;
    currentScanJob = {
      showId,
      progress: {
        current: 0,
        total: showsToScan.reduce((sum, show) => sum + show.needed_episodes.length, 0),
        currentShow: showsToScan[0].names[0],
      },
    };

    // Log the start of the scan
    await db.insert(activityLogs).values({
      message: showId
        ? `Started scanning for show: ${showsToScan[0].names[0]}`
        : `Started scanning all shows (${showsToScan.length} shows)`,
      level: "info",
    });

    // Start the scan process asynchronously
    scanShows(showsToScan).then(magnetLinks => {
      // Store the found magnet links when scan completes
      updateFoundMagnetLinks(magnetLinks);
    }).catch((error) => {
      console.error("Error during scan:", error);
    });

    return NextResponse.json({
      success: true,
      message: "Scan started",
      showCount: showsToScan.length,
      episodeCount: currentScanJob.progress.total,
    });
  } catch (error) {
    console.error("Error starting scan:", error);
    return NextResponse.json(
      { error: "Failed to start scan" },
      { status: 500 }
    );
  }
}

// DELETE /api/scan - Cancel the current scan
export async function DELETE() {
  if (!isScanning) {
    return NextResponse.json(
      { error: "No scan is currently in progress" },
      { status: 400 }
    );
  }

  isScanning = false;
  
  // Log the cancellation
  await db.insert(activityLogs).values({
    message: "Scan cancelled by user",
    level: "info",
  });

  return NextResponse.json({
    success: true,
    message: "Scan cancelled",
  });
}

// Helper function to perform the scan
async function scanShows(showsToScan: Show[]) {
  try {
    // Get known shows for episode calculation
    const knownShowsResult = await db.query.knownShows.findMany();
    
    let totalProcessed = 0;
    const foundMagnetLinks: { showId: number; showName: string; season: number; episode: number; magnetLink: string }[] = [];

    // Process each show
    for (let i = 0; i < showsToScan.length; i++) {
      if (!isScanning) {
        // Scan was cancelled
        break;
      }

      const show = showsToScan[i];
      
      // Update progress
      currentScanJob.progress.currentShow = show.names[0];
      
      // Log that we're starting to scan this show
      await db.insert(activityLogs).values({
        message: `Scanning show: ${show.names[0]}`,
        level: "info",
      });

      // Sort needed episodes to process in order
      const sortedNeededEpisodes = [...show.needed_episodes].sort((a, b) => {
        if (a[0] !== b[0]) return a[0] - b[0]; // Sort by season first
        return a[1] - b[1]; // Then by episode
      });

      // Process each needed episode
      for (let j = 0; j < sortedNeededEpisodes.length; j++) {
        if (!isScanning) {
          // Scan was cancelled
          break;
        }

        const [season, episode] = sortedNeededEpisodes[j];
        
        // Update progress
        totalProcessed++;
        currentScanJob.progress.current = totalProcessed;
        
        // Log that we're searching for this episode
        await db.insert(activityLogs).values({
          message: `Searching for ${show.names[0]} S${season}E${episode}`,
          level: "info",
        });

        // Try each alternative name for the show
        let found = false;
        for (const name of show.names) {
          if (found) break;

          // Create search queries
          const queries = [
            `${name} ${season > 1 ? `S${season} ` : ""}E${episode} ${show.quality}`,
            `${name} ${season > 1 ? `Season ${season} ` : ""}Episode ${episode} ${show.quality}`,
            `${name} ${episode} ${show.quality}`,
          ];

          // Try each query
          for (const query of queries) {
            if (found) break;

            try {
              // Search Nyaa.si
              const results = await searchNyaa(query);
              
              // Process results
              for (const result of results) {
                // Parse the torrent title
                const { data: parsedTorrent } = await parseTorrentTitle(result.title);
                
                if (!parsedTorrent) continue;
                
                // Check if this torrent matches what we're looking for
                if (matchesTorrent(parsedTorrent, show, season, episode, knownShowsResult)) {
                  // Found a match!
                  found = true;
                  
                  // Log the match
                  await db.insert(activityLogs).values({
                    message: `Found match for ${show.names[0]} S${season}E${episode}: ${result.title}`,
                    level: "success",
                  });
                  
                  // Update the show's downloaded episodes
                  const updatedDownloadedEpisodes = [
                    ...show.downloaded_episodes,
                    [season, episode] as [number, number],
                  ];
                  
                  // Remove this episode from needed episodes
                  const updatedNeededEpisodes = show.needed_episodes.filter(
                    ([s, e]) => !(s === season && e === episode)
                  );
                  
                  // Update the show in the database
                  await db
                    .update(shows)
                    .set({
                      downloaded_episodes: updatedDownloadedEpisodes,
                      needed_episodes: updatedNeededEpisodes,
                      last_checked: new Date(),
                    })
                    .where(eq(shows.id, show.id));
                  
                  // Store the magnet link to be opened by the client
                  foundMagnetLinks.push({
                    showId: show.id,
                    showName: show.names[0],
                    season,
                    episode,
                    magnetLink: result.magnetLink
                  });
                  
                  // Continue to the next episode for this show
                  break;
                }
              }
            } catch (error) {
              console.error(`Error searching Nyaa for ${query}:`, error);
              await db.insert(activityLogs).values({
                message: `Error searching for ${show.names[0]} S${season}E${episode}: ${(error as Error).message}`,
                level: "error",
              });
            }
          }
        }

        if (!found) {
          // If not found, stop searching for this show (assume later episodes aren't available yet)
          await db.insert(activityLogs).values({
            message: `No match found for ${show.names[0]} S${season}E${episode}, stopping search for this show`,
            level: "info",
          });
          break;
        }
      }

      // Update last checked timestamp
      await db.update(shows)
        .set({ last_checked: new Date() })
        .where(eq(shows.id, show.id));
    }

    // Complete the scan
    isScanning = false;
    
    // Store the found magnet links in the job status
    currentScanJob.progress.current = currentScanJob.progress.total;
    
    // Log completion
    await db.insert(activityLogs).values({
      message: `Scan completed with ${foundMagnetLinks.length} episodes found`,
      level: "success",
    });
    
    return foundMagnetLinks;
  } catch (error) {
    console.error("Error during scan:", error);
    
    // Log the error
    await db.insert(activityLogs).values({
      message: `Error during scan: ${(error as Error).message}`,
      level: "error",
    });
    
    // Reset scanning state
    isScanning = false;
    
    throw error;
  }
} 