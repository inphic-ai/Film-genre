import { boolean, index, integer, jsonb, pgEnum, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */

export const roleEnum = pgEnum("role", ["admin", "staff", "viewer"]);

export const users = pgTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("staff").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Video platform enum - supports YouTube, TikTok (抖音), and RedBook (小紅書)
 */
export const platformEnum = pgEnum("platform", ["youtube", "tiktok", "redbook"]);

/**
 * Share status enum - controls video visibility in client portal
 */
export const shareStatusEnum = pgEnum("share_status", ["private", "public"]);

/**
 * Video category enum - 5 main categories for organizing videos
 */
export const categoryEnum = pgEnum("category", [
  "product_intro",    // 使用介紹
  "maintenance",      // 維修
  "case_study",       // 案例
  "faq",              // 常見問題
  "other"             // 其他
]);

/**
 * Categories table - allows customization of category names
 * ⚠️ DEPRECATED: This table is for the old category system (categoryEnum)
 * Use video_categories for the new flexible category system
 */
export const categories = pgTable("categories", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  key: categoryEnum("key").notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

/**
 * Video Categories table - NEW flexible category system for organizing videos
 * Replaces the old categoryEnum system for better flexibility
 */
export const videoCategories = pgTable("video_categories", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // product / vendor / repair / teaching / internal / misc
  description: text("description"),
  color: varchar("color", { length: 7 }), // Hex color code (e.g., #3b82f6)
  icon: varchar("icon", { length: 50 }), // Lucide icon name
  sortOrder: integer("sortOrder").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type VideoCategory = typeof videoCategories.$inferSelect;
export type InsertVideoCategory = typeof videoCategories.$inferInsert;

/**
 * Knowledge Entries table - unified content layer for video timeline content
 * Stores all time-stamped content (text, images, notes, highlights) for videos
 */
export const knowledgeEntries = pgTable("knowledge_entries", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  videoId: integer("videoId").notNull().references(() => videos.id, { onDelete: "cascade" }),
  entryType: varchar("entryType", { length: 50 }).notNull(), // text / image / note / highlight
  timestamp: integer("timestamp"), // Video timestamp in seconds
  content: text("content"), // Text content
  imageUrls: jsonb("imageUrls").$type<string[]>(), // Array of image URLs
  tags: jsonb("tags").$type<string[]>(), // Array of tags
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type KnowledgeEntry = typeof knowledgeEntries.$inferSelect;
export type InsertKnowledgeEntry = typeof knowledgeEntries.$inferInsert;

/**
 * Videos table - stores all video resources with platform filtering support
 */
export const videos = pgTable("videos", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  platform: platformEnum("platform").notNull(),
  videoUrl: text("videoUrl").notNull(),
  thumbnailUrl: text("thumbnailUrl"),
  customThumbnailUrl: text("customThumbnailUrl"), // User-uploaded custom thumbnail (S3 URL)
  category: categoryEnum("category").notNull(), // ⚠️ DEPRECATED: Use categoryId instead
  categoryId: integer("categoryId").references(() => videoCategories.id, { onDelete: "set null" }), // NEW: Foreign key to video_categories
  // New fields for enhanced functionality
  productId: varchar("productId", { length: 100 }),
  creator: varchar("creator", { length: 255 }), // Creator name (e.g., @心灵之音 for YouTube)
  shareStatus: shareStatusEnum("shareStatus").default("private").notNull(),
  viewCount: integer("viewCount").default(0).notNull(),
  notes: text("notes"), // JSON string for timeline notes
  duration: integer("duration"), // Video duration in seconds
  searchVector: text("searchVector"), // tsvector for full-text search (PostgreSQL specific)
  rating: integer("rating"), // 1-5 star rating, NULL means not rated yet
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  uploadedBy: integer("uploadedBy").references(() => users.id),
}, (table) => ({
  // Performance indexes for Dashboard queries
  createdAtIdx: index("videos_created_at_idx").on(table.createdAt),
  categoryIdx: index("videos_category_idx").on(table.category),
  platformIdx: index("videos_platform_idx").on(table.platform),
  creatorIdx: index("videos_creator_idx").on(table.creator),
  categoryIdIdx: index("videos_category_id_idx").on(table.categoryId),
}));

export type Video = typeof videos.$inferSelect;
export type InsertVideo = typeof videos.$inferInsert;

/**
 * Tag type enum - distinguishes between keyword tags and product code tags
 */
export const tagTypeEnum = pgEnum("tag_type", ["KEYWORD", "PRODUCT_CODE"]);

/**
 * Tags table - stores all tags for video classification and organization
 */
export const tags = pgTable("tags", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  tagType: tagTypeEnum("tagType").default("KEYWORD").notNull(), // Tag type for smart sorting
  description: text("description"),
  color: varchar("color", { length: 7 }), // Hex color code (e.g., #FF5733)
  usageCount: integer("usageCount").default(0).notNull(), // Redundant field for quick queries
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Tag = typeof tags.$inferSelect;
export type InsertTag = typeof tags.$inferInsert;

/**
 * Video-Tags junction table - many-to-many relationship between videos and tags
 */
export const videoTags = pgTable("video_tags", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  videoId: integer("videoId").notNull().references(() => videos.id, { onDelete: "cascade" }),
  tagId: integer("tagId").notNull().references(() => tags.id, { onDelete: "cascade" }),
  weight: integer("weight").default(1).notNull(), // Relationship weight (1-10) for sorting relevance
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VideoTag = typeof videoTags.$inferSelect;
export type InsertVideoTag = typeof videoTags.$inferInsert;

/**
 * Timeline note status enum - controls note approval workflow
 */
export const noteStatusEnum = pgEnum("note_status", ["PENDING", "APPROVED", "REJECTED"]);

/**
 * Timeline Notes table - stores time-stamped notes for videos with image support
 */
export const timelineNotes = pgTable("timeline_notes", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  videoId: integer("videoId").notNull().references(() => videos.id, { onDelete: "cascade" }),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  timeSeconds: integer("timeSeconds").notNull(), // Video timestamp in seconds
  content: text("content").notNull(), // Note text content
  imageUrls: text("imageUrls").array(), // Array of Cloudflare R2 image URLs (max 5)
  status: noteStatusEnum("status").default("PENDING").notNull(), // Approval status
  rejectReason: text("rejectReason"), // Reason for rejection (only for REJECTED status)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type TimelineNote = typeof timelineNotes.$inferSelect;
export type InsertTimelineNote = typeof timelineNotes.$inferInsert;

/**
 * Products table - stores product information with SKU management
 */
export const products = pgTable("products", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  sku: varchar("sku", { length: 50 }).notNull().unique(), // PM6123456A
  name: varchar("name", { length: 255 }).notNull(),
  familyCode: varchar("familyCode", { length: 20 }), // First 6 digits (PM612345)
  variant: varchar("variant", { length: 1 }), // Last digit (A/B/C)
  description: text("description"),
  thumbnailUrl: text("thumbnailUrl"), // Product thumbnail image URL (Cloudflare R2)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

/**
 * Product relation type enum - defines relationship types between products
 */
export const relationTypeEnum = pgEnum("relation_type", ["SYNONYM", "FAMILY", "PART"]);

/**
 * Product Relations table - stores relationships between products
 */
export const productRelations = pgTable("product_relations", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  productAId: integer("productAId").notNull().references(() => products.id, { onDelete: "cascade" }),
  productBId: integer("productBId").notNull().references(() => products.id, { onDelete: "cascade" }),
  relationType: relationTypeEnum("relationType").notNull(), // SYNONYM / FAMILY / PART
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProductRelation = typeof productRelations.$inferSelect;
export type InsertProductRelation = typeof productRelations.$inferInsert;

/**
 * Suggestion priority enum - defines priority levels for video suggestions
 */
export const suggestionPriorityEnum = pgEnum("suggestion_priority", ["LOW", "MEDIUM", "HIGH"]);

/**
 * Suggestion status enum - tracks suggestion processing status
 */
export const suggestionStatusEnum = pgEnum("suggestion_status", ["PENDING", "READ", "RESOLVED"]);

/**
 * Suggestions table - stores user-submitted video suggestions
 */
export const suggestions = pgTable("suggestions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  videoId: integer("videoId").notNull().references(() => videos.id, { onDelete: "cascade" }),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  priority: suggestionPriorityEnum("priority").default("MEDIUM").notNull(),
  status: suggestionStatusEnum("status").default("PENDING").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Suggestion = typeof suggestions.$inferSelect;
export type InsertSuggestion = typeof suggestions.$inferInsert;

/**
 * Audit Logs table - tracks all system operations for security and compliance
 */
export const auditLogs = pgTable("audit_logs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("userId").references(() => users.id, { onDelete: "set null" }),
  action: varchar("action", { length: 100 }).notNull(), // CREATE_VIDEO / APPROVE_NOTE / etc.
  resourceType: varchar("resourceType", { length: 50 }), // VIDEO / NOTE / PRODUCT
  resourceId: integer("resourceId"),
  details: text("details"), // JSON string for additional details
  ipAddress: varchar("ipAddress", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

/**
 * Share Logs table - tracks external sharing clicks for analytics
 */
export const shareLogs = pgTable("share_logs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  videoId: integer("videoId").notNull().references(() => videos.id, { onDelete: "cascade" }),
  sharedByUserId: integer("sharedByUserId").references(() => users.id, { onDelete: "set null" }),
  clickedAt: timestamp("clickedAt").defaultNow().notNull(),
  ipAddress: varchar("ipAddress", { length: 50 }),
  userAgent: text("userAgent"),
});

export type ShareLog = typeof shareLogs.$inferSelect;
export type InsertShareLog = typeof shareLogs.$inferInsert;

/**
 * Notification type enum - defines different types of notifications
 */
export const notificationTypeEnum = pgEnum("notification_type", [
  "REVIEW_APPROVED",
  "REVIEW_REJECTED",
  "SYSTEM_ANNOUNCEMENT",
  "MENTION"
]);

/**
 * Notifications table - stores user notifications for various system events
 */
export const notifications = pgTable("notifications", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: notificationTypeEnum("type").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content"),
  relatedResourceType: varchar("relatedResourceType", { length: 50 }), // VIDEO / TIMELINE_NOTE / PRODUCT
  relatedResourceId: integer("relatedResourceId"),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Video document type enum - categorizes different document types
 */
export const documentTypeEnum = pgEnum("document_type", ["manual", "sop", "other"]);

/**
 * Video Documents table - stores PDF manuals, SOPs, and other documents
 * Files are stored in Cloudflare R2
 */
export const videoDocuments = pgTable("video_documents", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  videoId: integer("videoId").notNull().references(() => videos.id, { onDelete: "cascade" }),
  type: documentTypeEnum("type").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  fileUrl: text("fileUrl").notNull(), // Cloudflare R2 URL
  fileKey: varchar("fileKey", { length: 500 }).notNull(), // R2 file key
  fileSize: integer("fileSize"), // File size in bytes
  mimeType: varchar("mimeType", { length: 100 }), // e.g., application/pdf
  uploadedBy: integer("uploadedBy").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VideoDocument = typeof videoDocuments.$inferSelect;
export type InsertVideoDocument = typeof videoDocuments.$inferInsert;

/**
 * Knowledge Nodes table - stores structured knowledge (problem/cause/solution)
 * Linked to SKU for product-specific troubleshooting
 */
export const knowledgeNodes = pgTable("knowledge_nodes", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  sku: varchar("sku", { length: 50 }).notNull(),
  problem: text("problem").notNull(),
  cause: text("cause"),
  solution: text("solution").notNull(),
  createdBy: integer("createdBy").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type KnowledgeNode = typeof knowledgeNodes.$inferSelect;
export type InsertKnowledgeNode = typeof knowledgeNodes.$inferInsert;


/**
 * Log type enum - categorizes different log types
 */
export const logTypeEnum = pgEnum("log_type", ["API", "DB_QUERY"]);

/**
 * Performance Logs table - tracks API response times and database query performance
 */
export const performanceLogs = pgTable("performance_logs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  logType: logTypeEnum("logType").notNull(),
  endpoint: varchar("endpoint", { length: 255 }),
  method: varchar("method", { length: 10 }),
  responseTime: integer("responseTime").notNull(), // in milliseconds
  statusCode: integer("statusCode"),
  userId: integer("userId").references(() => users.id, { onDelete: "set null" }),
  errorMessage: text("errorMessage"),
  metadata: jsonb("metadata"), // Additional info (request params, SQL query, etc.)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PerformanceLog = typeof performanceLogs.$inferSelect;
export type InsertPerformanceLog = typeof performanceLogs.$inferInsert;

/**
 * User Activity Logs table - tracks user actions and behaviors
 */
export const userActivityLogs = pgTable("user_activity_logs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  action: varchar("action", { length: 100 }).notNull(), // VIDEO_CREATE, NOTE_SUBMIT, SEARCH, REVIEW_APPROVE, etc.
  targetType: varchar("targetType", { length: 50 }), // VIDEO, NOTE, TAG, PRODUCT
  targetId: integer("targetId"),
  details: text("details"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: varchar("userAgent", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserActivityLog = typeof userActivityLogs.$inferSelect;
export type InsertUserActivityLog = typeof userActivityLogs.$inferInsert;

/**
 * Import Logs table - tracks all CSV batch import operations
 * Used for audit trail and troubleshooting (Phase 71)
 */
export const importLogs = pgTable("import_logs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  importedBy: varchar("importedBy", { length: 255 }).notNull(), // API Key name or User ID
  importedAt: timestamp("importedAt").notNull().defaultNow(),
  batchSize: integer("batchSize").notNull(), // Total rows in CSV
  successCount: integer("successCount").notNull().default(0),
  failedCount: integer("failedCount").notNull().default(0),
  skippedCount: integer("skippedCount").notNull().default(0), // Duplicate videos
  errorDetails: text("errorDetails"), // JSON string with error details
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type ImportLog = typeof importLogs.$inferSelect;
export type InsertImportLog = typeof importLogs.$inferInsert;
