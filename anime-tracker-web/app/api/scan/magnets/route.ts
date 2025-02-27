import { NextResponse } from "next/server";

// Global state to store magnet links found during scans
// This will be updated by the scan process
let foundMagnetLinks: {
  showId: number;
  showName: string;
  season: number;
  episode: number;
  magnetLink: string;
}[] = [];

// Function to update the magnet links (called from the scan process)
export function updateFoundMagnetLinks(links: typeof foundMagnetLinks) {
  foundMagnetLinks = links;
}

// Function to clear the magnet links
export function clearFoundMagnetLinks() {
  foundMagnetLinks = [];
}

// GET /api/scan/magnets - Get magnet links found during the most recent scan
export async function GET() {
  return NextResponse.json({
    magnetLinks: foundMagnetLinks,
  });
} 