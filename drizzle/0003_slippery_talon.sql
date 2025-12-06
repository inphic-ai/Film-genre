CREATE TYPE "public"."tag_type" AS ENUM('KEYWORD', 'PRODUCT_CODE');--> statement-breakpoint
ALTER TABLE "tags" ADD COLUMN "tagType" "tag_type" DEFAULT 'KEYWORD' NOT NULL;