CREATE TYPE "public"."search_engine" AS ENUM('fulltext', 'tags', 'ai', 'hybrid');--> statement-breakpoint
CREATE TYPE "public"."trigger_mode" AS ENUM('realtime', 'debounce', 'manual');--> statement-breakpoint
CREATE TABLE "search_settings" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "search_settings_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"triggerMode" "trigger_mode" DEFAULT 'debounce' NOT NULL,
	"debounceDelay" integer DEFAULT 500 NOT NULL,
	"searchEngine" "search_engine" DEFAULT 'hybrid' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
