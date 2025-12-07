CREATE TYPE "public"."relation_type" AS ENUM('SYNONYM', 'FAMILY', 'PART');--> statement-breakpoint
CREATE TYPE "public"."suggestion_priority" AS ENUM('LOW', 'MEDIUM', 'HIGH');--> statement-breakpoint
CREATE TYPE "public"."suggestion_status" AS ENUM('PENDING', 'READ', 'RESOLVED');--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "audit_logs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer,
	"action" varchar(100) NOT NULL,
	"resourceType" varchar(50),
	"resourceId" integer,
	"details" text,
	"ipAddress" varchar(50),
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_relations" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "product_relations_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"productAId" integer NOT NULL,
	"productBId" integer NOT NULL,
	"relationType" "relation_type" NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "products_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"sku" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"familyCode" varchar(20),
	"variant" varchar(1),
	"description" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "products_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "share_logs" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "share_logs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"videoId" integer NOT NULL,
	"sharedByUserId" integer,
	"clickedAt" timestamp DEFAULT now() NOT NULL,
	"ipAddress" varchar(50),
	"userAgent" text
);
--> statement-breakpoint
CREATE TABLE "suggestions" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "suggestions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"videoId" integer NOT NULL,
	"userId" integer NOT NULL,
	"content" text NOT NULL,
	"priority" "suggestion_priority" DEFAULT 'MEDIUM' NOT NULL,
	"status" "suggestion_status" DEFAULT 'PENDING' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "duration" integer;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_relations" ADD CONSTRAINT "product_relations_productAId_products_id_fk" FOREIGN KEY ("productAId") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_relations" ADD CONSTRAINT "product_relations_productBId_products_id_fk" FOREIGN KEY ("productBId") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "share_logs" ADD CONSTRAINT "share_logs_videoId_videos_id_fk" FOREIGN KEY ("videoId") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "share_logs" ADD CONSTRAINT "share_logs_sharedByUserId_users_id_fk" FOREIGN KEY ("sharedByUserId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suggestions" ADD CONSTRAINT "suggestions_videoId_videos_id_fk" FOREIGN KEY ("videoId") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suggestions" ADD CONSTRAINT "suggestions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;