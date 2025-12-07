CREATE TYPE "public"."document_type" AS ENUM('manual', 'sop', 'other');--> statement-breakpoint
CREATE TABLE "knowledge_nodes" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "knowledge_nodes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"sku" varchar(50) NOT NULL,
	"problem" text NOT NULL,
	"cause" text,
	"solution" text NOT NULL,
	"createdBy" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "video_documents" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "video_documents_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"videoId" integer NOT NULL,
	"type" "document_type" NOT NULL,
	"title" varchar(255) NOT NULL,
	"fileUrl" text NOT NULL,
	"fileKey" varchar(500) NOT NULL,
	"fileSize" integer,
	"mimeType" varchar(100),
	"uploadedBy" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "knowledge_nodes" ADD CONSTRAINT "knowledge_nodes_createdBy_users_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_documents" ADD CONSTRAINT "video_documents_videoId_videos_id_fk" FOREIGN KEY ("videoId") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_documents" ADD CONSTRAINT "video_documents_uploadedBy_users_id_fk" FOREIGN KEY ("uploadedBy") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;