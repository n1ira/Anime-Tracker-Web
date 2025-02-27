import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../db/db";
import { shows } from "../../../db/schema/shows";
import { activityLogs } from "../../../db/schema/activity_logs";
import { eq } from "drizzle-orm";
import { recalculateNeededEpisodes } from "../../../lib/utils";
import { Show } from "../../../lib/types";

// GET /api/shows - Get all shows
export async function GET() {
  try {
    const allShows = await db.select().from(shows);
    return NextResponse.json(allShows);
  } catch (error) {
    console.error("Error fetching shows:", error);
    return NextResponse.json(
      { error: "Failed to fetch shows" },
      { status: 500 }
    );
  }
}

// POST /api/shows - Create a new show
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.names || !Array.isArray(body.names) || body.names.length === 0) {
      return NextResponse.json(
        { error: "Show must have at least one name" },
        { status: 400 }
      );
    }

    // Set default values for optional fields
    const newShow = {
      names: body.names,
      start_season: body.start_season || 1,
      start_episode: body.start_episode || 1,
      end_season: body.end_season || 1,
      end_episode: body.end_episode || 12,
      quality: body.quality || "1080p",
      downloaded_episodes: body.downloaded_episodes || [],
      needed_episodes: body.needed_episodes || [],
      last_checked: new Date(),
    };

    // Insert the new show
    const result = await db.insert(shows).values(newShow).returning();
    
    // Log the activity
    await db.insert(activityLogs).values({
      message: `Added show: ${newShow.names[0]}`,
      level: "info",
    });

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Error creating show:", error);
    return NextResponse.json(
      { error: "Failed to create show" },
      { status: 500 }
    );
  }
}

// PUT /api/shows/:id - Update a show
export async function PUT(
  request: NextRequest,
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

    const body = await request.json();
    
    // Validate required fields
    if (body.names && (!Array.isArray(body.names) || body.names.length === 0)) {
      return NextResponse.json(
        { error: "Show must have at least one name" },
        { status: 400 }
      );
    }

    // Update the show
    const result = await db
      .update(shows)
      .set({
        ...body,
        last_checked: new Date(),
      })
      .where(eq(shows.id, id))
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Show not found" },
        { status: 404 }
      );
    }

    // Log the activity
    await db.insert(activityLogs).values({
      message: `Updated show: ${result[0].names[0]}`,
      level: "info",
    });

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Error updating show:", error);
    return NextResponse.json(
      { error: "Failed to update show" },
      { status: 500 }
    );
  }
}

// DELETE /api/shows/:id - Delete a show
export async function DELETE(
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

    // Get the show name before deleting
    const showToDelete = await db
      .select()
      .from(shows)
      .where(eq(shows.id, id));

    if (showToDelete.length === 0) {
      return NextResponse.json(
        { error: "Show not found" },
        { status: 404 }
      );
    }

    // Delete the show
    await db.delete(shows).where(eq(shows.id, id));

    // Log the activity
    await db.insert(activityLogs).values({
      message: `Deleted show: ${showToDelete[0].names[0]}`,
      level: "info",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting show:", error);
    return NextResponse.json(
      { error: "Failed to delete show" },
      { status: 500 }
    );
  }
}

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