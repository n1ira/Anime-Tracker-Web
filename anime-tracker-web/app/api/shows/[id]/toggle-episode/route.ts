import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../../db/db";
import { shows } from "../../../../../db/schema/shows";
import { eq } from "drizzle-orm";
import { activityLogs } from "../../../../../db/schema/activity_logs";

// POST /api/shows/[id]/toggle-episode - Toggle episode status between needed and downloaded
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const showId = parseInt(params.id);
    if (isNaN(showId)) {
      return NextResponse.json(
        { error: "Invalid show ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { season, episode } = body;

    if (typeof season !== 'number' || typeof episode !== 'number') {
      return NextResponse.json(
        { error: "Season and episode must be numbers" },
        { status: 400 }
      );
    }

    // Get the current show data
    const show = await db.query.shows.findFirst({
      where: eq(shows.id, showId),
    });

    if (!show) {
      return NextResponse.json(
        { error: "Show not found" },
        { status: 404 }
      );
    }

    // Check if the episode is in downloaded_episodes
    const isDownloaded = show.downloaded_episodes.some(
      ([s, e]) => s === season && e === episode
    );

    let updatedDownloadedEpisodes = [...show.downloaded_episodes];
    let updatedNeededEpisodes = [...show.needed_episodes];

    if (isDownloaded) {
      // Move from downloaded to needed
      updatedDownloadedEpisodes = updatedDownloadedEpisodes.filter(
        ([s, e]) => !(s === season && e === episode)
      );
      updatedNeededEpisodes.push([season, episode]);
    } else {
      // Check if the episode is in needed_episodes
      const isNeeded = show.needed_episodes.some(
        ([s, e]) => s === season && e === episode
      );

      if (isNeeded) {
        // Move from needed to downloaded
        updatedNeededEpisodes = updatedNeededEpisodes.filter(
          ([s, e]) => !(s === season && e === episode)
        );
        updatedDownloadedEpisodes.push([season, episode]);
      } else {
        return NextResponse.json(
          { error: "Episode not found in either needed or downloaded lists" },
          { status: 404 }
        );
      }
    }

    // Update the show with the new episode lists
    await db
      .update(shows)
      .set({
        downloaded_episodes: updatedDownloadedEpisodes,
        needed_episodes: updatedNeededEpisodes,
      })
      .where(eq(shows.id, showId));

    // Log the action
    await db.insert(activityLogs).values({
      message: `${isDownloaded ? "Unmarked" : "Marked"} ${show.names[0]} S${season}E${episode} as ${isDownloaded ? "needed" : "downloaded"}`,
      level: "info",
    });

    return NextResponse.json({
      success: true,
      isDownloaded: !isDownloaded,
      downloadedEpisodes: updatedDownloadedEpisodes,
      neededEpisodes: updatedNeededEpisodes,
    });
  } catch (error) {
    console.error("Error toggling episode status:", error);
    return NextResponse.json(
      { error: "Failed to toggle episode status" },
      { status: 500 }
    );
  }
} 