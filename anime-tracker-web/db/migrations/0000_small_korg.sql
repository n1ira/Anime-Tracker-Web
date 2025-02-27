CREATE TABLE "shows" (
	"id" serial PRIMARY KEY NOT NULL,
	"names" json NOT NULL,
	"start_season" serial NOT NULL,
	"start_episode" serial NOT NULL,
	"end_season" serial NOT NULL,
	"end_episode" serial NOT NULL,
	"quality" text NOT NULL,
	"downloaded_episodes" json NOT NULL,
	"needed_episodes" json NOT NULL,
	"last_checked" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "known_shows" (
	"id" serial PRIMARY KEY NOT NULL,
	"show_name" text NOT NULL,
	"episodes_per_season" json NOT NULL,
	CONSTRAINT "known_shows_show_name_unique" UNIQUE("show_name")
);
--> statement-breakpoint
CREATE TABLE "episodes" (
	"id" serial PRIMARY KEY NOT NULL,
	"show_id" integer NOT NULL,
	"season" integer NOT NULL,
	"episode" integer NOT NULL,
	"is_downloaded" boolean DEFAULT false NOT NULL,
	"download_date" timestamp
);
--> statement-breakpoint
CREATE TABLE "activity_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"message" text NOT NULL,
	"level" text DEFAULT 'info' NOT NULL,
	"timestamp" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "episodes" ADD CONSTRAINT "episodes_show_id_shows_id_fk" FOREIGN KEY ("show_id") REFERENCES "public"."shows"("id") ON DELETE no action ON UPDATE no action;