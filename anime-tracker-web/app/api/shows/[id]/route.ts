import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../db/db";
import { shows } from "../../../../db/schema/shows";
import { activityLogs } from "../../../../db/schema/activity_logs";
import { eq } from "drizzle-orm";
import { recalculateNeededEpisodes } from "../../../../lib/utils";
import { Show } from "../../../../lib/types";

// GET /api/shows/:id - Get a specific show
export async function GET(
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

    const result = await db
      .select()
      .from(shows)
      .where(eq(shows.id, id));

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Show not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Error fetching show:", error);
    return NextResponse.json(
      { error: "Failed to fetch show" },
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