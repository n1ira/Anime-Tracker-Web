import { pgTable, serial, text, json } from "drizzle-orm/pg-core";

export const knownShows = pgTable("known_shows", {
  id: serial("id").primaryKey(),
  show_name: text("show_name").notNull().unique(),
  episodes_per_season: json("episodes_per_season").$type<number[]>().notNull()
}); 