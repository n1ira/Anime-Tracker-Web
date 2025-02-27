import { pgTable, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { shows } from "./shows";

export const episodes = pgTable("episodes", {
  id: serial("id").primaryKey(),
  show_id: integer("show_id").notNull().references(() => shows.id),
  season: integer("season").notNull(),
  episode: integer("episode").notNull(),
  is_downloaded: boolean("is_downloaded").notNull().default(false),
  download_date: timestamp("download_date")
}); 