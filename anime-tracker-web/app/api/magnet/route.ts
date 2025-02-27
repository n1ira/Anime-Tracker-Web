import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../db/db";
import { activityLogs } from "../../../db/schema/activity_logs";

// POST /api/magnet - Store and return a magnet link to be opened by the client
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { magnetLink, showName, season, episode } = body;

    if (!magnetLink) {
      return NextResponse.json(
        { error: "Magnet link is required" },
        { status: 400 }
      );
    }

    // Log the magnet link action
    await db.insert(activityLogs).values({
      message: `Magnet link ready for ${showName ? `${showName} S${season}E${episode}` : 'episode'}`,
      level: "success",
    });

    return NextResponse.json({
      success: true,
      magnetLink,
    });
  } catch (error) {
    console.error("Error handling magnet link:", error);
    return NextResponse.json(
      { error: "Failed to process magnet link" },
      { status: 500 }
    );
  }
} 