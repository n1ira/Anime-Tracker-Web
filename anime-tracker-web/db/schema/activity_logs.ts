import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  message: text("message").notNull(),
  level: text("level").notNull().default("info"),
  timestamp: timestamp("timestamp").defaultNow()
}); 