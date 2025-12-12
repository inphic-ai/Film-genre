CREATE TABLE "import_logs" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "import_logs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"importedBy" varchar(255) NOT NULL,
	"importedAt" timestamp DEFAULT now() NOT NULL,
	"batchSize" integer NOT NULL,
	"successCount" integer DEFAULT 0 NOT NULL,
	"failedCount" integer DEFAULT 0 NOT NULL,
	"skippedCount" integer DEFAULT 0 NOT NULL,
	"errorDetails" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
