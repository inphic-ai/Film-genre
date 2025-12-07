import { integer, pgEnum, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

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
 * Videos table - stores all video resources with platform filtering support
 */
export const videos = pgTable("videos", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  platform: platformEnum("platform").notNull(),
  videoUrl: text("videoUrl").notNull(),
  thumbnailUrl: text("thumbnailUrl"),
  category: categoryEnum("category").notNull(),
  // New fields for enhanced functionality
  productId: varchar("productId", { length: 100 }),
  shareStatus: shareStatusEnum("shareStatus").default("private").notNull(),
  viewCount: integer("viewCount").default(0).notNull(),
  notes: text("notes"), // JSON string for timeline notes
  duration: integer("duration"), // Video duration in seconds
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  uploadedBy: integer("uploadedBy").references(() => users.id),
});

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
