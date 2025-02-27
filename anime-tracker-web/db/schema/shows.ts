import { pgTable, serial, text, timestamp, json } from "drizzle-orm/pg-core";

export const shows = pgTable("shows", {
  id: serial("id").primaryKey(),
  names: json("names").$type<string[]>().notNull(),
  start_season: serial("start_season").notNull(),
  start_episode: serial("start_episode").notNull(),
  end_season: serial("end_season").notNull(),
  end_episode: serial("end_episode").notNull(),
  quality: text("quality").notNull(),
  downloaded_episodes: json("downloaded_episodes").$type<[number, number][]>().notNull(),
  needed_episodes: json("needed_episodes").$type<[number, number][]>().notNull(),
  last_checked: timestamp("last_checked").defaultNow()
}); 