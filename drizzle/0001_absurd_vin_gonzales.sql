CREATE TYPE "public"."share_status" AS ENUM('private', 'public');--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "productId" varchar(100);--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "shareStatus" "share_status" DEFAULT 'private' NOT NULL;--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "viewCount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "notes" text;