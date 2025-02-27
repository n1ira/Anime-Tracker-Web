import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../../db/db";
import { shows } from "../../../../../db/schema/shows";
import { activityLogs } from "../../../../../db/schema/activity_logs";
import { eq } from "drizzle-orm";
import { recalculateNeededEpisodes } from "../../../../../lib/utils";
import { Show } from "../../../../../lib/types";

// PATCH /api/shows/:id/recalculate - Recalculate needed episodes for a show
export async function PATCH(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid show ID" },
        { status: 400 }
      );
    }

    // Get the show
    const showResult = await db
      .select()
      .from(shows)
      .where(eq(shows.id, id));

    if (showResult.length === 0) {
      return NextResponse.json(
        { error: "Show not found" },
        { status: 404 }
      );
    }

    const show = showResult[0] as Show;

    // Get known shows for recalculation
    const knownShowsResult = await db.query.knownShows.findMany();

    // Recalculate needed episodes
    const neededEpisodes = recalculateNeededEpisodes(show, knownShowsResult);

    // Update the show
    const result = await db
      .update(shows)
      .set({
        needed_episodes: neededEpisodes,
        last_checked: new Date(),
      })
      .where(eq(shows.id, id))
      .returning();

    // Log the activity
    await db.insert(activityLogs).values({
      message: `Recalculated needed episodes for: ${show.names[0]}`,
      level: "info",
    });

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Error recalculating needed episodes:", error);
    return NextResponse.json(
      { error: "Failed to recalculate needed episodes" },
      { status: 500 }
    );
  }
} 