import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../db/db";
import { activityLogs } from "../../../db/schema/activity_logs";

// POST /api/magnet - Handle a magnet link
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.magnetLink) {
      return NextResponse.json(
        { error: "Magnet link is required" },
        { status: 400 }
      );
    }

    // Log the magnet link usage
    await db.insert(activityLogs).values({
      message: `Magnet link opened: ${body.title || 'Unknown title'}`,
      level: "info",
    });

    // Return the magnet link to be opened by the client
    return NextResponse.json({
      success: true,
      magnetLink: body.magnetLink,
    });
  } catch (error) {
    console.error("Error handling magnet link:", error);
    return NextResponse.json(
      { error: "Failed to handle magnet link" },
      { status: 500 }
    );
  }
} 