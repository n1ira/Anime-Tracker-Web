import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../db/db";
import { knownShows } from "../../../db/schema/known_shows";
import { activityLogs } from "../../../db/schema/activity_logs";
import { eq } from "drizzle-orm";

// GET /api/known-shows - Get all known shows
export async function GET() {
  try {
    const allKnownShows = await db.select().from(knownShows);
    return NextResponse.json(allKnownShows);
  } catch (error) {
    console.error("Error fetching known shows:", error);
    return NextResponse.json(
      { error: "Failed to fetch known shows" },
      { status: 500 }
    );
  }
}

// POST /api/known-shows - Create a new known show
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.show_name) {
      return NextResponse.json(
        { error: "Show name is required" },
        { status: 400 }
      );
    }

    if (!body.episodes_per_season || !Array.isArray(body.episodes_per_season)) {
      return NextResponse.json(
        { error: "Episodes per season must be an array" },
        { status: 400 }
      );
    }

    // Insert the new known show
    const result = await db.insert(knownShows).values({
      show_name: body.show_name,
      episodes_per_season: body.episodes_per_season,
    }).returning();
    
    // Log the activity
    await db.insert(activityLogs).values({
      message: `Added known show: ${body.show_name}`,
      level: "info",
    });

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Error creating known show:", error);
    
    // Check for unique constraint violation
    if (error instanceof Error && error.message.includes("unique constraint")) {
      return NextResponse.json(
        { error: "A show with this name already exists" },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to create known show" },
      { status: 500 }
    );
  }
}

// PUT /api/known-shows/:id - Update a known show
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid known show ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    // Validate required fields
    if (body.show_name === "") {
      return NextResponse.json(
        { error: "Show name cannot be empty" },
        { status: 400 }
      );
    }

    if (body.episodes_per_season && !Array.isArray(body.episodes_per_season)) {
      return NextResponse.json(
        { error: "Episodes per season must be an array" },
        { status: 400 }
      );
    }

    // Update the known show
    const result = await db
      .update(knownShows)
      .set({
        show_name: body.show_name,
        episodes_per_season: body.episodes_per_season,
      })
      .where(eq(knownShows.id, id))
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Known show not found" },
        { status: 404 }
      );
    }

    // Log the activity
    await db.insert(activityLogs).values({
      message: `Updated known show: ${result[0].show_name}`,
      level: "info",
    });

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Error updating known show:", error);
    
    // Check for unique constraint violation
    if (error instanceof Error && error.message.includes("unique constraint")) {
      return NextResponse.json(
        { error: "A show with this name already exists" },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to update known show" },
      { status: 500 }
    );
  }
}

// DELETE /api/known-shows/:id - Delete a known show
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid known show ID" },
        { status: 400 }
      );
    }

    // Get the show name before deleting
    const showToDelete = await db
      .select()
      .from(knownShows)
      .where(eq(knownShows.id, id));

    if (showToDelete.length === 0) {
      return NextResponse.json(
        { error: "Known show not found" },
        { status: 404 }
      );
    }

    // Delete the known show
    await db.delete(knownShows).where(eq(knownShows.id, id));

    // Log the activity
    await db.insert(activityLogs).values({
      message: `Deleted known show: ${showToDelete[0].show_name}`,
      level: "info",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting known show:", error);
    return NextResponse.json(
      { error: "Failed to delete known show" },
      { status: 500 }
    );
  }
} 