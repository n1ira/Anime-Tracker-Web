import { NextRequest, NextResponse } from "next/server";
import { parseTorrentTitle } from "../../../lib/nyaa";

/**
 * POST /api/parse-title - Parse a torrent title using OpenAI
 * 
 * Request body:
 * {
 *   "title": "string" // The torrent title to parse
 * }
 * 
 * Response:
 * {
 *   "parsed": { ... } // The parsed torrent data or null if parsing failed
 *   "fromCache": boolean // Whether the result came from cache
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title } = body;
    
    if (!title || typeof title !== 'string') {
      return NextResponse.json(
        { error: "Title is required and must be a string" },
        { status: 400 }
      );
    }
    
    const { data: parsed, fromCache } = await parseTorrentTitle(title);
    
    return NextResponse.json({
      parsed,
      fromCache,
    });
  } catch (error) {
    console.error("Error parsing title:", error);
    return NextResponse.json(
      { error: "Failed to parse title" },
      { status: 500 }
    );
  }
} 