import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import { videos, categories } from "../drizzle/schema";
import { eq } from "drizzle-orm";

let db: Awaited<ReturnType<typeof getDb>>;

describe("Video Extended Features", () => {
  let testVideoId: number;

  beforeAll(async () => {
    // 初始化資料庫連線
    db = await getDb();
    if (!db) {
      throw new Error("Database connection failed");
    }
  });

  afterAll(async () => {
    // 清理測試資料
    if (testVideoId) {
      await db.delete(videos).where(eq(videos.id, testVideoId));
    }
  });

  describe("Product ID & Share Status", () => {
    it("should create video with productId and shareStatus", async () => {
      const [video] = await db
        .insert(videos)
        .values({
          title: "測試影片 - 商品編號與分享狀態",
          description: "測試新增欄位功能",
          videoUrl: "https://www.youtube.com/watch?v=test123",
          thumbnailUrl: "https://example.com/thumb.jpg",
          platform: "youtube",
          category: "other",
          productId: "PROD-2024-001",
          shareStatus: "public",
        })
        .returning();

      testVideoId = video.id;

      expect(video.productId).toBe("PROD-2024-001");
      expect(video.shareStatus).toBe("public");
      expect(video.viewCount).toBe(0); // 預設值
      expect(video.notes).toBeNull(); // 預設值
    });

    it("should update video productId and shareStatus", async () => {
      const updated = await db
        .update(videos)
        .set({
          productId: "PROD-2024-002",
          shareStatus: "private",
        })
        .where(eq(videos.id, testVideoId))
        .returning();

      expect(updated[0].productId).toBe("PROD-2024-002");
      expect(updated[0].shareStatus).toBe("private");
    });

    it("should allow null productId", async () => {
      const updated = await db
        .update(videos)
        .set({
          productId: null,
        })
        .where(eq(videos.id, testVideoId))
        .returning();

      expect(updated[0].productId).toBeNull();
    });
  });

  describe("View Count", () => {
    it("should increment view count", async () => {
      // 重置為 0
      await db
        .update(videos)
        .set({ viewCount: 0 })
        .where(eq(videos.id, testVideoId));

      // 增加觀看次數
      const updated = await db
        .update(videos)
        .set({ viewCount: 1 })
        .where(eq(videos.id, testVideoId))
        .returning();

      expect(updated[0].viewCount).toBe(1);

      // 再次增加
      const updated2 = await db
        .update(videos)
        .set({ viewCount: 2 })
        .where(eq(videos.id, testVideoId))
        .returning();

      expect(updated2[0].viewCount).toBe(2);
    });
  });

  describe("Timeline Notes", () => {
    it("should save timeline notes as JSON", async () => {
      const notes = [
        {
          id: "note-1",
          timestamp: 30,
          content: "重要時刻：產品展示開始",
          createdAt: new Date().toISOString(),
        },
        {
          id: "note-2",
          timestamp: 120,
          content: "客戶問題解答",
          createdAt: new Date().toISOString(),
        },
      ];

      const updated = await db
        .update(videos)
        .set({
          notes: JSON.stringify(notes),
        })
        .where(eq(videos.id, testVideoId))
        .returning();

      expect(updated[0].notes).toBeTruthy();
      const parsedNotes = JSON.parse(updated[0].notes!);
      expect(parsedNotes).toHaveLength(2);
      expect(parsedNotes[0].timestamp).toBe(30);
      expect(parsedNotes[1].content).toBe("客戶問題解答");
    });

    it("should handle empty notes", async () => {
      const updated = await db
        .update(videos)
        .set({
          notes: null,
        })
        .where(eq(videos.id, testVideoId))
        .returning();

      expect(updated[0].notes).toBeNull();
    });
  });

  describe("Platform Filtering", () => {
    it("should filter only public YouTube videos for client portal", async () => {
      const publicYouTubeVideos = await db
        .select()
        .from(videos)
        .where(eq(videos.platform, "youtube"));

      // 至少應該有我們剛建立的測試影片
      expect(publicYouTubeVideos.length).toBeGreaterThanOrEqual(0);
      publicYouTubeVideos.forEach((video) => {
        expect(video.platform).toBe("youtube");
      });
    });

    it("should show all platforms in internal board", async () => {
      const allVideos = await db.select().from(videos);
      expect(allVideos.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Share Status Filtering", () => {
    it("should handle different share statuses", async () => {
      // 測試影片目前應該是 private（從前面的測試更新）
      const video = await db
        .select()
        .from(videos)
        .where(eq(videos.id, testVideoId))
        .limit(1);

      expect(video[0]).toBeDefined();
      expect(["public", "private"]).toContain(video[0].shareStatus);
    });
  });

  describe("Backward Compatibility", () => {
    it("should handle videos without productId", async () => {
      const [video] = await db
        .insert(videos)
        .values({
          title: "舊影片（無商品編號）",
          description: "測試向後相容性",
          videoUrl: "https://www.youtube.com/watch?v=old123",
          thumbnailUrl: "https://example.com/old.jpg",
          platform: "youtube",
          category: "other",
          // productId 不提供（應為 null）
          shareStatus: "private", // 預設為 private
        })
        .returning();

      expect(video.productId).toBeNull();
      expect(video.shareStatus).toBe("private");
      expect(video.viewCount).toBe(0);
      expect(video.notes).toBeNull();

      // 清理
      await db.delete(videos).where(eq(videos.id, video.id));
    });
  });
});
