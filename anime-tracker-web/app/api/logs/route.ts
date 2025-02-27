import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../db/db";
import { activityLogs } from "../../../db/schema/activity_logs";
import { desc } from "drizzle-orm";

// GET /api/logs - Get activity logs with optional limit
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 100;
    
    // Get logs ordered by timestamp (newest first)
    const logs = await db
      .select()
      .from(activityLogs)
      .orderBy(desc(activityLogs.timestamp))
      .limit(limit);
    
    return NextResponse.json(logs);
  } catch (error) {
    console.error("Error fetching logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch logs" },
      { status: 500 }
    );
  }
}

// POST /api/logs - Create a new log entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.message) {
      return NextResponse.json(
        { error: "Log message is required" },
        { status: 400 }
      );
    }

    // Set default values for optional fields
    const newLog = {
      message: body.message,
      level: body.level || "info",
      timestamp: body.timestamp ? new Date(body.timestamp) : new Date(),
    };

    // Insert the new log
    const result = await db.insert(activityLogs).values(newLog).returning();
    
    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Error creating log:", error);
    return NextResponse.json(
      { error: "Failed to create log" },
      { status: 500 }
    );
  }
}

// DELETE /api/logs - Clear all logs
export async function DELETE() {
  try {
    await db.delete(activityLogs);
    
    // Add a log entry about clearing logs
    await db.insert(activityLogs).values({
      message: "All logs cleared",
      level: "info",
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error clearing logs:", error);
    return NextResponse.json(
      { error: "Failed to clear logs" },
      { status: 500 }
    );
  }
} 