import { db } from "./db";
import { shows, knownShows, episodes, activityLogs } from "./schema";
import { sql } from "drizzle-orm";

async function verifySchema() {
  try {
    console.log("Verifying database connection and schema...");
    
    // Check shows table
    const showsCount = await db.select({ count: sql<number>`count(*)` }).from(shows);
    console.log(`Shows table exists. Row count: ${showsCount[0].count}`);
    
    // Check known_shows table
    const knownShowsCount = await db.select({ count: sql<number>`count(*)` }).from(knownShows);
    console.log(`Known shows table exists. Row count: ${knownShowsCount[0].count}`);
    
    // Check episodes table
    const episodesCount = await db.select({ count: sql<number>`count(*)` }).from(episodes);
    console.log(`Episodes table exists. Row count: ${episodesCount[0].count}`);
    
    // Check activity_logs table
    const logsCount = await db.select({ count: sql<number>`count(*)` }).from(activityLogs);
    console.log(`Activity logs table exists. Row count: ${logsCount[0].count}`);
    
    console.log("Database schema verification completed successfully!");
  } catch (error) {
    console.error("Error verifying database schema:", error);
  } finally {
    process.exit(0);
  }
}

verifySchema(); 