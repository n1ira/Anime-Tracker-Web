import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../db/db";
import { shows } from "../../../db/schema/shows";
import { activityLogs } from "../../../db/schema/activity_logs";
import { eq } from "drizzle-orm";
import { searchNyaa, parseTorrentTitle, matchesTorrent } from "../../../lib/nyaa";
import { Show } from "../../../lib/types";

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
    scanShows(showsToScan).catch((error) => {
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

      // Process each needed episode
      for (let j = 0; j < show.needed_episodes.length; j++) {
        if (!isScanning) {
          // Scan was cancelled
          break;
        }

        const [season, episode] = show.needed_episodes[j];
        
        // Update progress
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
                const parsedTorrent = await parseTorrentTitle(result.title);
                
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
                  
                  // Return the magnet link
                  return {
                    success: true,
                    magnetLink: result.magnetLink,
                  };
                }
              }
            } catch (error) {
              console.error(`Error searching for ${query}:`, error);
              
              // Log the error
              await db.insert(activityLogs).values({
                message: `Error searching for ${query}: ${(error as Error).message}`,
                level: "error",
              });
              
              // Wait a bit before trying the next query to avoid rate limiting
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          }
        }

        if (!found) {
          // Log that we couldn't find this episode
          await db.insert(activityLogs).values({
            message: `No match found for ${show.names[0]} S${season}E${episode}`,
            level: "warning",
          });
        }

        totalProcessed++;
        
        // Wait a bit before processing the next episode to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Update the show's last checked timestamp
      await db
        .update(shows)
        .set({
          last_checked: new Date(),
        })
        .where(eq(shows.id, show.id));
    }

    // Log completion
    await db.insert(activityLogs).values({
      message: `Scan completed. Processed ${totalProcessed} episodes.`,
      level: "info",
    });
  } catch (error) {
    console.error("Error during scan:", error);
    
    // Log the error
    await db.insert(activityLogs).values({
      message: `Scan error: ${(error as Error).message}`,
      level: "error",
    });
  } finally {
    // Reset scan state
    isScanning = false;
    currentScanJob = {
      showId: null,
      progress: {
        current: 0,
        total: 0,
        currentShow: null,
      },
    };
  }
} 