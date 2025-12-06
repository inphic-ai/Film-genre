import { integer, pgEnum, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */

export const roleEnum = pgEnum("role", ["user", "admin"]);

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
  role: roleEnum("role").default("user").notNull(),
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
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  uploadedBy: integer("uploadedBy").references(() => users.id),
});

export type Video = typeof videos.$inferSelect;
export type InsertVideo = typeof videos.$inferInsert;

/**
 * Tags table - stores all tags for video classification and organization
 */
export const tags = pgTable("tags", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 100 }).notNull().unique(),
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
