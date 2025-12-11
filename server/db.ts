import { eq, desc, asc, and, or, like, sql, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { InsertUser, users, categories, videos, tags, videoTags, timelineNotes, notifications, suggestions, Category, Video, InsertVideo, InsertCategory, Tag, InsertTag, VideoTag, InsertVideoTag, TimelineNote, InsertTimelineNote, Notification, InsertNotification, Suggestion, InsertSuggestion } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;
let _pool: Pool | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  // Prioritize CUSTOM_DATABASE_URL (Railway PostgreSQL) over default DATABASE_URL (TiDB)
  const databaseUrl = process.env.CUSTOM_DATABASE_URL || process.env.DATABASE_URL;
  
  if (!_db && databaseUrl) {
    try {
      // Check if it's PostgreSQL
      if (!databaseUrl.startsWith('postgresql://')) {
        console.error('[Database] ❌ Only PostgreSQL is supported. Current URL starts with:', databaseUrl.split(':')[0]);
        console.error('[Database] Please set CUSTOM_DATABASE_URL to Railway PostgreSQL connection string.');
        return null;
      }
      
      _pool = new Pool({
        connectionString: databaseUrl,
        ssl: { rejectUnauthorized: false }, // Railway PostgreSQL requires SSL
      });
      _db = drizzle(_pool);
      console.log('[Database] ✅ Connected to PostgreSQL:', databaseUrl.split('@')[1]?.split('/')[0] || 'unknown');
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
 * Get video by URL (for duplicate detection)
 */
export async function getVideoByUrl(videoUrl: string): Promise<Video | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(videos).where(eq(videos.videoUrl, videoUrl)).limit(1);
  return result[0];
}

/**
 * Create new video
 */
export async function createVideo(video: InsertVideo): Promise<Video> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(videos).values(video).returning();
  const createdVideo = result[0]!;
  
  // Auto-create PRODUCT_CODE tag if productId exists
  if (video.productId) {
    await ensureProductCodeTag(video.productId);
  }
  
  return createdVideo;
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
  
  // Auto-create PRODUCT_CODE tag if productId exists
  if (video.productId) {
    await ensureProductCodeTag(video.productId);
  }
}

/**
 * Delete video and associated S3 thumbnail
 */
export async function deleteVideo(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  // Get video data before deletion to retrieve customThumbnailUrl
  const [video] = await db.select().from(videos).where(eq(videos.id, id)).limit(1);
  
  if (!video) {
    console.warn(`[deleteVideo] Video ${id} not found`);
    return;
  }

  // Delete custom thumbnail from S3 if exists
  if (video.customThumbnailUrl) {
    try {
      // Extract key from URL (assuming format: https://domain/bucket/key)
      const url = new URL(video.customThumbnailUrl);
      const key = url.pathname.split('/').slice(2).join('/'); // Remove leading /bucket/
      
      console.log(`[deleteVideo] Deleting custom thumbnail: ${key}`);
      
      const { storageDelete } = await import('./storage');
      await storageDelete(key);
      
      console.log(`[deleteVideo] Custom thumbnail deleted successfully: ${key}`);
    } catch (error) {
      console.error(`[deleteVideo] Failed to delete custom thumbnail:`, error);
      // Continue with video deletion even if thumbnail deletion fails
    }
  }

  // Delete video record from database
  await db.delete(videos).where(eq(videos.id, id));
  console.log(`[deleteVideo] Video ${id} deleted successfully`);
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

// ==================== Tags Management ====================

/**
 * Get all tags
 */
/**
 * Ensure a PRODUCT_CODE tag exists for the given product ID
 * Auto-creates the tag if it doesn't exist
 */
export async function ensureProductCodeTag(productId: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  try {
    // Check if tag already exists
    const existingTag = await db.select()
      .from(tags)
      .where(and(eq(tags.name, productId), eq(tags.tagType, 'PRODUCT_CODE')))
      .limit(1);
    
    if (existingTag.length === 0) {
      // Create new PRODUCT_CODE tag
      await db.insert(tags).values({
        name: productId,
        tagType: 'PRODUCT_CODE',
        description: `商品編號：${productId}`,
        usageCount: 0,
      });
      console.log(`[Tags] ✅ Auto-created PRODUCT_CODE tag: ${productId}`);
    }
  } catch (error) {
    console.error(`[Tags] ❌ Failed to ensure PRODUCT_CODE tag: ${productId}`, error);
  }
}

export async function getAllTags(): Promise<Tag[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tags).orderBy(desc(tags.usageCount));
}

/**
 * Get tag by ID
 */
export async function getTagById(id: number): Promise<Tag | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(tags).where(eq(tags.id, id)).limit(1);
  return result[0];
}

/**
 * Get tag by name
 */
export async function getTagByName(name: string): Promise<Tag | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(tags).where(eq(tags.name, name)).limit(1);
  return result[0];
}

/**
 * Create new tag
 */
export async function createTag(tag: InsertTag): Promise<Tag> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(tags).values(tag).returning();
  return result[0]!;
}

/**
 * Update tag
 */
export async function updateTag(id: number, tag: Partial<InsertTag>): Promise<Tag | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.update(tags)
    .set({ ...tag, updatedAt: new Date() })
    .where(eq(tags.id, id))
    .returning();
  
  return result[0];
}

/**
 * Delete tag
 */
export async function deleteTag(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(tags).where(eq(tags.id, id));
}

/**
 * Get popular tags (by usage count)
 */
export async function getPopularTags(limit: number = 20): Promise<Tag[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tags)
    .orderBy(desc(tags.usageCount))
    .limit(limit);
}

/**
 * Search tags by name
 */
export async function searchTags(keyword: string): Promise<Tag[]> {
  const db = await getDb();
  if (!db) return [];
  
  const searchPattern = `%${keyword}%`;
  return db.select().from(tags)
    .where(like(tags.name, searchPattern))
    .orderBy(desc(tags.usageCount));
}

// ==================== Video-Tags Relationships ====================

/**
 * Add tag to video
 */
export async function addTagToVideo(videoId: number, tagId: number, weight: number = 1): Promise<VideoTag> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Check if relationship already exists
  const existing = await db.select().from(videoTags)
    .where(and(
      eq(videoTags.videoId, videoId),
      eq(videoTags.tagId, tagId)
    ))
    .limit(1);
  
  if (existing.length > 0) {
    // Update weight if already exists
    const updated = await db.update(videoTags)
      .set({ weight })
      .where(eq(videoTags.id, existing[0].id))
      .returning();
    return updated[0];
  }
  
  // Create new relationship
  const result = await db.insert(videoTags)
    .values({ videoId, tagId, weight })
    .returning();
  
  // Increment tag usage count
  const tag = await getTagById(tagId);
  if (tag) {
    await db.update(tags)
      .set({ usageCount: tag.usageCount + 1 })
      .where(eq(tags.id, tagId));
  }
  
  return result[0]!;
}

/**
 * Remove tag from video
 */
export async function removeTagFromVideo(videoId: number, tagId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.delete(videoTags)
    .where(and(
      eq(videoTags.videoId, videoId),
      eq(videoTags.tagId, tagId)
    ));
  
  // Decrement tag usage count
  const tag = await getTagById(tagId);
  if (tag && tag.usageCount > 0) {
    await db.update(tags)
      .set({ usageCount: tag.usageCount - 1 })
      .where(eq(tags.id, tagId));
  }
}

/**
 * Get all tags for a video
 */
export async function getVideoTags(videoId: number): Promise<Tag[]> {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select({
      id: tags.id,
      name: tags.name,
      tagType: tags.tagType,
      description: tags.description,
      color: tags.color,
      usageCount: tags.usageCount,
      createdAt: tags.createdAt,
      updatedAt: tags.updatedAt,
    })
    .from(videoTags)
    .innerJoin(tags, eq(videoTags.tagId, tags.id))
    .where(eq(videoTags.videoId, videoId))
    .orderBy(desc(videoTags.weight));
  
  return result;
}

/**
 * Get all videos for a tag (with weight)
 */
export async function getTagVideos(tagId: number): Promise<(Video & { weight: number })[]> {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select({
      id: videos.id,
      title: videos.title,
      description: videos.description,
      platform: videos.platform,
      videoUrl: videos.videoUrl,
      thumbnailUrl: videos.thumbnailUrl,
      customThumbnailUrl: videos.customThumbnailUrl,
      category: videos.category,
      categoryId: videos.categoryId,
      productId: videos.productId,
      creator: videos.creator,
      shareStatus: videos.shareStatus,
      viewCount: videos.viewCount,
      notes: videos.notes,
      duration: videos.duration,
      searchVector: videos.searchVector,
      rating: videos.rating,
      createdAt: videos.createdAt,
      updatedAt: videos.updatedAt,
      uploadedBy: videos.uploadedBy,
      weight: videoTags.weight,
    })
    .from(videoTags)
    .innerJoin(videos, eq(videoTags.videoId, videos.id))
    .where(eq(videoTags.tagId, tagId))
    .orderBy(desc(videoTags.weight), desc(videos.createdAt));
  
  return result;
}

/**
 * Get related tags (tags that appear together with the given tag)
 */
export async function getRelatedTags(tagId: number, limit: number = 10): Promise<(Tag & { coOccurrence: number })[]> {
  const db = await getDb();
  if (!db) return [];
  
  // Get all videos with this tag
  const videosWithTag = await db
    .select({ videoId: videoTags.videoId })
    .from(videoTags)
    .where(eq(videoTags.tagId, tagId));
  
  if (videosWithTag.length === 0) return [];
  
  const videoIds = videosWithTag.map(v => v.videoId);
  
  // Find other tags that appear in these videos
  const relatedTagsResult = await db
    .select({
      id: tags.id,
      name: tags.name,
      tagType: tags.tagType,
      description: tags.description,
      color: tags.color,
      usageCount: tags.usageCount,
      createdAt: tags.createdAt,
      updatedAt: tags.updatedAt,
      coOccurrence: sql<number>`COUNT(DISTINCT ${videoTags.videoId})`,
    })
    .from(videoTags)
    .innerJoin(tags, eq(videoTags.tagId, tags.id))
    .where(and(
      sql`${videoTags.videoId} IN (${sql.join(videoIds.map(id => sql`${id}`), sql`, `)})`,
      sql`${tags.id} != ${tagId}`
    ))
    .groupBy(tags.id, tags.name, tags.tagType, tags.description, tags.color, tags.usageCount, tags.createdAt, tags.updatedAt)
    .orderBy(desc(sql`COUNT(DISTINCT ${videoTags.videoId})`))
    .limit(limit);
  
  return relatedTagsResult;
}

/**
 * Get tag statistics
 */
export async function getTagStats() {
  const db = await getDb();
  if (!db) return { 
    totalTags: 0, 
    productCodeTagsCount: 0, 
    keywordTagsCount: 0, 
    totalRelationships: 0, 
    avgTagsPerVideo: 0 
  };
  
  const totalTags = await db.select({ count: sql<number>`COUNT(*)::int` }).from(tags);
  const productCodeTags = await db.select({ count: sql<number>`COUNT(*)::int` }).from(tags).where(eq(tags.tagType, 'PRODUCT_CODE'));
  const keywordTags = await db.select({ count: sql<number>`COUNT(*)::int` }).from(tags).where(eq(tags.tagType, 'KEYWORD'));
  const totalRelationships = await db.select({ count: sql<number>`COUNT(*)::int` }).from(videoTags);
  const totalVideos = await db.select({ count: sql<number>`COUNT(*)::int` }).from(videos);
  
  const tagsCount = Number(totalTags[0].count);
  const productCodeTagsCount = Number(productCodeTags[0].count);
  const keywordTagsCount = Number(keywordTags[0].count);
  const relationshipsCount = Number(totalRelationships[0].count);
  const videosCount = Number(totalVideos[0].count);
  
  const avgTagsPerVideo = videosCount > 0 
    ? relationshipsCount / videosCount 
    : 0;
  
  return {
    totalTags: tagsCount,
    productCodeTagsCount,
    keywordTagsCount,
    totalRelationships: relationshipsCount,
    avgTagsPerVideo: Math.round(avgTagsPerVideo * 10) / 10,
  };
}

/**
 * Check if a tag name matches product code format (3 letters + 6 digits + a/b/c)
 * Example: QJD0020010A
 */
export function isProductCode(tagName: string): boolean {
  return /^[A-Z]{3}\d{6}[a-cA-C]$/.test(tagName);
}

/**
 * Get tags by type (KEYWORD or PRODUCT_CODE)
 */
export async function getTagsByType(tagType: 'KEYWORD' | 'PRODUCT_CODE'): Promise<Tag[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(tags)
    .where(eq(tags.tagType, tagType))
    .orderBy(desc(tags.usageCount));
}

/**
 * Calculate smart score for a video based on its tags
 * Formula: Σ (tag.usageCount × tag.weight)
 * - KEYWORD: weight = 1
 * - PRODUCT_CODE: weight = 10000
 */
export async function calculateVideoScore(videoId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  
  const videoTagsWithInfo = await db
    .select({
      tagType: tags.tagType,
      usageCount: tags.usageCount,
      weight: videoTags.weight,
    })
    .from(videoTags)
    .innerJoin(tags, eq(videoTags.tagId, tags.id))
    .where(eq(videoTags.videoId, videoId));
  
  let totalScore = 0;
  for (const tag of videoTagsWithInfo) {
    const typeWeight = tag.tagType === 'PRODUCT_CODE' ? 10000 : 1;
    totalScore += tag.usageCount * typeWeight * tag.weight;
  }
  
  return totalScore;
}

/**
 * Get videos sorted by smart tag score
 * Videos with PRODUCT_CODE tags will rank higher
 */
export async function getVideosBySmartScore(limit: number = 50): Promise<(Video & { smartScore: number })[]> {
  const db = await getDb();
  if (!db) return [];
  
  // Get all videos with their tag scores
  const videosWithScores = await db
    .select({
      video: videos,
      smartScore: sql<number>`
        COALESCE(
          SUM(
            ${tags.usageCount} * 
            CASE 
              WHEN ${tags.tagType} = 'PRODUCT_CODE' THEN 10000 
              ELSE 1 
            END * 
            ${videoTags.weight}
          ), 
          0
        )
      `,
    })
    .from(videos)
    .leftJoin(videoTags, eq(videos.id, videoTags.videoId))
    .leftJoin(tags, eq(videoTags.tagId, tags.id))
    .groupBy(
      videos.id,
      videos.title,
      videos.description,
      videos.videoUrl,
      videos.thumbnailUrl,
      videos.customThumbnailUrl,
      videos.platform,
      videos.category,
      videos.categoryId,
      videos.productId,
      videos.creator,
      videos.shareStatus,
      videos.viewCount,
      videos.notes,
      videos.duration,
      videos.searchVector,
      videos.rating,
      videos.createdAt,
      videos.updatedAt,
      videos.uploadedBy
    )
    .orderBy(desc(sql`
      COALESCE(
        SUM(
          ${tags.usageCount} * 
          CASE 
            WHEN ${tags.tagType} = 'PRODUCT_CODE' THEN 10000 
            ELSE 1 
          END * 
          ${videoTags.weight}
        ), 
        0
      )
    `))
    .limit(limit);
  
  return videosWithScores.map(row => ({
    ...row.video,
    smartScore: Number(row.smartScore),
  }));
}

/**
 * Search videos by tags with smart sorting
 * @param tagIds - Array of tag IDs to search for
 * @param matchAll - If true, video must have ALL tags; if false, video must have ANY tag
 */
export async function searchVideosByTags(
  tagIds: number[],
  matchAll: boolean = false,
  limit: number = 50
): Promise<(Video & { smartScore: number; matchedTagCount: number })[]> {
  const db = await getDb();
  if (!db) return [];
  if (tagIds.length === 0) return [];
  
  const videosWithScores = await db
    .select({
      video: videos,
      smartScore: sql<number>`
        COALESCE(
          SUM(
            ${tags.usageCount} * 
            CASE 
              WHEN ${tags.tagType} = 'PRODUCT_CODE' THEN 10000 
              ELSE 1 
            END * 
            ${videoTags.weight}
          ), 
          0
        )
      `,
      matchedTagCount: sql<number>`COUNT(DISTINCT ${videoTags.tagId})`,
    })
    .from(videos)
    .innerJoin(videoTags, eq(videos.id, videoTags.videoId))
    .innerJoin(tags, eq(videoTags.tagId, tags.id))
    .where(sql`${videoTags.tagId} IN (${sql.join(tagIds.map(id => sql`${id}`), sql`, `)})`)
    .groupBy(
      videos.id,
      videos.title,
      videos.description,
      videos.videoUrl,
      videos.thumbnailUrl,
      videos.customThumbnailUrl,
      videos.platform,
      videos.category,
      videos.categoryId,
      videos.productId,
      videos.creator,
      videos.shareStatus,
      videos.viewCount,
      videos.notes,
      videos.duration,
      videos.searchVector,
      videos.rating,
      videos.createdAt,
      videos.updatedAt,
      videos.uploadedBy
    )
    .having(matchAll ? sql`COUNT(DISTINCT ${videoTags.tagId}) = ${tagIds.length}` : sql`COUNT(DISTINCT ${videoTags.tagId}) > 0`)
    .orderBy(desc(sql`
      COALESCE(
        SUM(
          ${tags.usageCount} * 
          CASE 
            WHEN ${tags.tagType} = 'PRODUCT_CODE' THEN 10000 
            ELSE 1 
          END * 
          ${videoTags.weight}
        ), 
        0
      )
    `))
    .limit(limit);
  
  return videosWithScores.map(row => ({
    ...row.video,
    smartScore: Number(row.smartScore),
    matchedTagCount: Number(row.matchedTagCount),
  }));
}

// ============================================================================
// Timeline Notes Functions
// ============================================================================

/**
 * Get all timeline notes for a video
 */
export async function getTimelineNotesByVideoId(videoId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: timelineNotes.id,
      videoId: timelineNotes.videoId,
      userId: timelineNotes.userId,
      timeSeconds: timelineNotes.timeSeconds,
      content: timelineNotes.content,
      imageUrls: timelineNotes.imageUrls,
      status: timelineNotes.status,
      rejectReason: timelineNotes.rejectReason,
      createdAt: timelineNotes.createdAt,
      updatedAt: timelineNotes.updatedAt,
      userName: users.name,
      userEmail: users.email,
    })
    .from(timelineNotes)
    .innerJoin(users, eq(timelineNotes.userId, users.id))
    .where(eq(timelineNotes.videoId, videoId))
    .orderBy(asc(timelineNotes.timeSeconds));
}

/**
 * Get timeline note by ID
 */
export async function getTimelineNoteById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(timelineNotes)
    .where(eq(timelineNotes.id, id))
    .limit(1);
  return result[0];
}

/**
 * Create a new timeline note
 */
export async function createTimelineNote(data: {
  videoId: number;
  userId: number;
  timeSeconds: number;
  content: string;
  imageUrls?: string[];
  status?: "PENDING" | "APPROVED" | "REJECTED";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [note] = await db
    .insert(timelineNotes)
    .values({
      videoId: data.videoId,
      userId: data.userId,
      timeSeconds: data.timeSeconds,
      content: data.content,
      imageUrls: data.imageUrls || [],
      status: data.status || "PENDING",
    })
    .returning();
  return note;
}

/**
 * Update timeline note
 */
export async function updateTimelineNote(
  id: number,
  data: {
    content?: string;
    imageUrls?: string[];
    status?: "PENDING" | "APPROVED" | "REJECTED";
    rejectReason?: string;
  }
) {
  const db = await getDb();
  if (!db) return undefined;
  const [updated] = await db
    .update(timelineNotes)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(timelineNotes.id, id))
    .returning();
  return updated;
}

/**
 * Delete timeline note
 */
export async function deleteTimelineNote(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(timelineNotes).where(eq(timelineNotes.id, id));
}

/**
 * Get pending timeline notes (for review)
 */
export async function getPendingTimelineNotes(limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: timelineNotes.id,
      videoId: timelineNotes.videoId,
      userId: timelineNotes.userId,
      timeSeconds: timelineNotes.timeSeconds,
      content: timelineNotes.content,
      imageUrls: timelineNotes.imageUrls,
      status: timelineNotes.status,
      createdAt: timelineNotes.createdAt,
      userName: users.name,
      userEmail: users.email,
      videoTitle: videos.title,
    })
    .from(timelineNotes)
    .innerJoin(users, eq(timelineNotes.userId, users.id))
    .innerJoin(videos, eq(timelineNotes.videoId, videos.id))
    .where(eq(timelineNotes.status, "PENDING"))
    .orderBy(desc(timelineNotes.createdAt))
    .limit(limit);
}

/**
 * Get timeline notes by user
 */
export async function getTimelineNotesByUserId(userId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: timelineNotes.id,
      videoId: timelineNotes.videoId,
      timeSeconds: timelineNotes.timeSeconds,
      content: timelineNotes.content,
      imageUrls: timelineNotes.imageUrls,
      status: timelineNotes.status,
      rejectReason: timelineNotes.rejectReason,
      createdAt: timelineNotes.createdAt,
      videoTitle: videos.title,
    })
    .from(timelineNotes)
    .innerJoin(videos, eq(timelineNotes.videoId, videos.id))
    .where(eq(timelineNotes.userId, userId))
    .orderBy(desc(timelineNotes.createdAt))
    .limit(limit);
}

/**
 * Approve timeline note (Admin only)
 */
export async function approveTimelineNote(id: number) {
  const note = await getTimelineNoteById(id);
  if (!note) throw new Error("Note not found");
  
  const result = await updateTimelineNote(id, { status: "APPROVED" });
  
  // Send notification to the note author
  try {
    await createNotification({
      userId: note.userId,
      type: "REVIEW_APPROVED",
      title: "您的時間軸筆記已通過審核",
      content: `您在影片「${note.videoId}」的時間軸筆記已通過審核並發布。`,
      relatedResourceType: "TIMELINE_NOTE",
      relatedResourceId: id,
    });
  } catch (error) {
    console.error("[Notification] Failed to create approval notification:", error);
  }
  
  return result;
}

/**
 * Reject timeline note (Admin only)
 */
export async function rejectTimelineNote(id: number, reason: string) {
  const note = await getTimelineNoteById(id);
  if (!note) throw new Error("Note not found");
  
  const result = await updateTimelineNote(id, { status: "REJECTED", rejectReason: reason });
  
  // Send notification to the note author
  try {
    await createNotification({
      userId: note.userId,
      type: "REVIEW_REJECTED",
      title: "您的時間軸筆記未通過審核",
      content: `您在影片「${note.videoId}」的時間軸筆記未通過審核。原因：${reason}`,
      relatedResourceType: "TIMELINE_NOTE",
      relatedResourceId: id,
    });
  } catch (error) {
    console.error("[Notification] Failed to create rejection notification:", error);
  }
  
  return result;
}

// List timeline notes with filters
export async function listTimelineNotes(options: {
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  userId?: number;
  sortBy?: 'createdAt_desc' | 'createdAt_asc';
  limit?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  try {
    let query = db
      .select({
        id: timelineNotes.id,
        videoId: timelineNotes.videoId,
        userId: timelineNotes.userId,
        timeSeconds: timelineNotes.timeSeconds,
        content: timelineNotes.content,
        imageUrls: timelineNotes.imageUrls,
        status: timelineNotes.status,
        rejectReason: timelineNotes.rejectReason,
        createdAt: timelineNotes.createdAt,
        updatedAt: timelineNotes.updatedAt,
        // Join with users to get creator info
        userName: users.name,
        userRole: users.role,
        // Join with videos to get video title
        videoTitle: videos.title,
      })
      .from(timelineNotes)
      .leftJoin(users, eq(timelineNotes.userId, users.id))
      .leftJoin(videos, eq(timelineNotes.videoId, videos.id));

    // Apply filters
    const conditions = [];
    if (options.status) {
      conditions.push(eq(timelineNotes.status, options.status));
    }
    if (options.userId) {
      conditions.push(eq(timelineNotes.userId, options.userId));
    }
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    // Apply sorting
    if (options.sortBy === 'createdAt_asc') {
      query = query.orderBy(asc(timelineNotes.createdAt)) as any;
    } else {
      query = query.orderBy(desc(timelineNotes.createdAt)) as any;
    }

    // Apply limit
    if (options.limit) {
      query = query.limit(options.limit) as any;
    }

    return await query;
  } catch (error) {
    console.error("[Database] Error listing timeline notes:", error);
    return [];
  }
}

// Batch approve timeline notes
export async function batchApproveTimelineNotes(ids: number[]) {
  const db = await getDb();
  if (!db) return { success: false, count: 0 };

  try {
    const result = await db
      .update(timelineNotes)
      .set({ status: "APPROVED", updatedAt: new Date() })
      .where(inArray(timelineNotes.id, ids));

    return { success: true, count: ids.length };
  } catch (error) {
    console.error("[Database] Error batch approving timeline notes:", error);
    throw error;
  }
}

// Batch reject timeline notes
export async function batchRejectTimelineNotes(ids: number[], reason: string) {
  const db = await getDb();
  if (!db) return { success: false, count: 0 };

  try {
    const result = await db
      .update(timelineNotes)
      .set({ status: "REJECTED", rejectReason: reason, updatedAt: new Date() })
      .where(inArray(timelineNotes.id, ids));

    return { success: true, count: ids.length };
  } catch (error) {
    console.error("[Database] Error batch rejecting timeline notes:", error);
    throw error;
  }
}

/**
 * Global search for videos (supports title, product ID, tags)
 */
export async function globalSearchVideos(query: string, limit: number = 20): Promise<Video[]> {
  const db = await getDb();
  if (!db) return [];
  
  const searchPattern = `%${query}%`;
  
  try {
    // Search in title, description, and productId
    const results = await db
      .select()
      .from(videos)
      .where(
        or(
          like(videos.title, searchPattern),
          like(videos.description, searchPattern),
          like(videos.productId, searchPattern)
        )
      )
      .orderBy(desc(videos.createdAt))
      .limit(limit);
    
    return results;
  } catch (error) {
    console.error("[Database] Error in global search:", error);
    return [];
  }
}


// ============================================================
// Notifications
// ============================================================

/**
 * Get user's notifications with pagination and optional filtering
 */
export async function getNotifications(
  userId: number,
  limit: number,
  offset: number,
  isRead?: boolean
) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [eq(notifications.userId, userId)];
  
  if (isRead !== undefined) {
    conditions.push(eq(notifications.isRead, isRead));
  }

  return db
    .select()
    .from(notifications)
    .where(and(...conditions))
    .orderBy(desc(notifications.createdAt))
    .limit(limit)
    .offset(offset);
}

/**
 * Get total count of user's notifications
 */
export async function getNotificationsCount(userId: number, isRead?: boolean) {
  const db = await getDb();
  if (!db) return 0;
  
  const conditions = [eq(notifications.userId, userId)];
  
  if (isRead !== undefined) {
    conditions.push(eq(notifications.isRead, isRead));
  }

  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notifications)
    .where(and(...conditions));

  return result[0]?.count || 0;
}

/**
 * Get unread notifications count
 */
export async function getUnreadNotificationsCount(userId: number) {
  return getNotificationsCount(userId, false);
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(notificationId: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  
  await db
    .update(notifications)
    .set({ 
      isRead: true,
    })
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId)
      )
    );
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: number) {
  const db = await getDb();
  if (!db) return;
  
  await db
    .update(notifications)
    .set({ 
      isRead: true,
    })
    .where(eq(notifications.userId, userId));
}

/**
 * Create a new notification
 */
export async function createNotification(data: {
  userId: number;
  type: "REVIEW_APPROVED" | "REVIEW_REJECTED" | "SYSTEM_ANNOUNCEMENT" | "MENTION";
  title: string;
  content?: string;
  relatedResourceType?: "VIDEO" | "TIMELINE_NOTE" | "PRODUCT";
  relatedResourceId?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db
    .insert(notifications)
    .values({
      userId: data.userId,
      type: data.type,
      title: data.title,
      content: data.content,
      relatedResourceType: data.relatedResourceType,
      relatedResourceId: data.relatedResourceId,
      isRead: false,
    })
    .returning();

  return result[0];
}

/**
 * Delete a notification (user can only delete their own notifications)
 */
export async function deleteNotification(notificationId: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  
  await db
    .delete(notifications)
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId)
      )
    );
}

// ==================== Video Suggestions ====================

export async function getSuggestionsByVideo(
  videoId: number,
  limit: number = 20,
  offset: number = 0,
  priority?: "LOW" | "MEDIUM" | "HIGH",
  status?: "PENDING" | "READ" | "RESOLVED"
) {
  const db = await getDb();
  if (!db) return [];

  let conditions = [eq(suggestions.videoId, videoId)];
  
  if (priority) {
    conditions.push(eq(suggestions.priority, priority as any));
  }
  if (status) {
    conditions.push(eq(suggestions.status, status as any));
  }

  return await db
    .select()
    .from(suggestions)
    .where(and(...conditions))
    .limit(limit)
    .offset(offset)
    .orderBy(desc(suggestions.createdAt));
}

export async function getSuggestionsCountByVideo(
  videoId: number,
  priority?: "LOW" | "MEDIUM" | "HIGH",
  status?: "PENDING" | "READ" | "RESOLVED"
) {
  const db = await getDb();
  if (!db) return 0;

  let conditions = [eq(suggestions.videoId, videoId)];
  
  if (priority) {
    conditions.push(eq(suggestions.priority, priority as any));
  }
  if (status) {
    conditions.push(eq(suggestions.status, status as any));
  }

  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(suggestions)
    .where(and(...conditions));
    
  return Number(result[0]?.count) || 0;
}

export async function getSuggestionById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(suggestions)
    .where(eq(suggestions.id, id))
    .limit(1);
  return result[0] || null;
}

export async function createSuggestion(data: {
  videoId: number;
  userId: number;
  title: string;
  content: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(suggestions).values(data).returning();
  return result[0];
}

export async function updateSuggestion(
  id: number,
  data: {
    title?: string;
    content?: string;
    priority?: "LOW" | "MEDIUM" | "HIGH";
    status?: "PENDING" | "READ" | "RESOLVED";
  }
) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .update(suggestions)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(suggestions.id, id))
    .returning();
  return result[0];
}

export async function deleteSuggestion(id: number) {
  const db = await getDb();
  if (!db) return;

  await db.delete(suggestions).where(eq(suggestions.id, id));
}
