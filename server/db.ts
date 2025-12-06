import { eq, desc, and, or, like, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { InsertUser, users, categories, videos, Category, Video, InsertVideo, InsertCategory } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;
let _pool: Pool | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
      });
      _db = drizzle(_pool);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const existingUser = await db.select().from(users).where(eq(users.openId, user.openId)).limit(1);

    const values: InsertUser = {
      openId: user.openId,
    };

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      values[field] = value ?? null;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
    } else if (user.email === ENV.adminEmail) {
      values.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (existingUser.length > 0) {
      // Update existing user
      const updateValues: Partial<InsertUser> = {};
      if (values.name !== undefined) updateValues.name = values.name;
      if (values.email !== undefined) updateValues.email = values.email;
      if (values.loginMethod !== undefined) updateValues.loginMethod = values.loginMethod;
      if (values.role !== undefined) updateValues.role = values.role;
      if (values.lastSignedIn !== undefined) updateValues.lastSignedIn = values.lastSignedIn;
      updateValues.updatedAt = new Date();

      await db.update(users).set(updateValues).where(eq(users.openId, user.openId));
    } else {
      // Insert new user
      await db.insert(users).values(values);
    }
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Video and Category queries

/**
 * Get all categories
 */
export async function getAllCategories(): Promise<Category[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(categories).orderBy(categories.id);
}

/**
 * Get category by key
 */
export async function getCategoryByKey(key: string): Promise<Category | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(categories).where(eq(categories.key, key as any)).limit(1);
  return result[0];
}

/**
 * Update category name
 */
export async function updateCategory(key: string, name: string, description?: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(categories)
    .set({ name, description, updatedAt: new Date() })
    .where(eq(categories.key, key as any));
}

/**
 * Get all videos (for internal board)
 */
export async function getAllVideos(): Promise<Video[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(videos).orderBy(desc(videos.createdAt));
}

/**
 * Get YouTube videos only (for client portal)
 */
export async function getYouTubeVideos(): Promise<Video[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(videos)
    .where(eq(videos.platform, 'youtube' as any))
    .orderBy(desc(videos.createdAt));
}

/**
 * Get public YouTube videos (for client portal with share filter)
 */
export async function getPublicYouTubeVideos(): Promise<Video[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(videos)
    .where(and(
      eq(videos.platform, 'youtube' as any),
      eq(videos.shareStatus, 'public' as any)
    ))
    .orderBy(desc(videos.createdAt));
}

/**
 * Get videos by category
 */
export async function getVideosByCategory(category: string): Promise<Video[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(videos)
    .where(eq(videos.category, category as any))
    .orderBy(desc(videos.createdAt));
}

/**
 * Get YouTube videos by category (for client portal)
 */
export async function getYouTubeVideosByCategory(category: string): Promise<Video[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(videos)
    .where(and(
      eq(videos.platform, 'youtube' as any),
      eq(videos.category, category as any)
    ))
    .orderBy(desc(videos.createdAt));
}

/**
 * Search videos by keyword (title or description)
 */
export async function searchVideos(keyword: string, platformFilter?: string): Promise<Video[]> {
  const db = await getDb();
  if (!db) return [];
  
  const searchPattern = `%${keyword}%`;
  const searchCondition = or(
    like(videos.title, searchPattern),
    like(videos.description, searchPattern)
  );
  
  if (platformFilter) {
    return db.select().from(videos)
      .where(and(
        searchCondition,
        eq(videos.platform, platformFilter as any)
      ))
      .orderBy(desc(videos.createdAt));
  }
  
  return db.select().from(videos)
    .where(searchCondition)
    .orderBy(desc(videos.createdAt));
}

/**
 * Get video by ID
 */
export async function getVideoById(id: number): Promise<Video | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(videos).where(eq(videos.id, id)).limit(1);
  return result[0];
}

/**
 * Create new video
 */
export async function createVideo(video: InsertVideo): Promise<Video> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(videos).values(video).returning();
  return result[0]!;
}

/**
 * Update video
 */
export async function updateVideo(id: number, video: Partial<InsertVideo>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.update(videos)
    .set({ ...video, updatedAt: new Date() })
    .where(eq(videos.id, id));
}

/**
 * Delete video
 */
export async function deleteVideo(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(videos).where(eq(videos.id, id));
}

/**
 * Increment view count
 */
export async function incrementViewCount(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  const video = await getVideoById(id);
  if (!video) return;
  
  await db.update(videos)
    .set({ viewCount: video.viewCount + 1 })
    .where(eq(videos.id, id));
}

/**
 * Update video notes (timeline notes in JSON format)
 */
export async function updateVideoNotes(id: number, notes: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.update(videos)
    .set({ notes, updatedAt: new Date() })
    .where(eq(videos.id, id));
}
