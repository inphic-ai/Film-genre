import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as db from "./db";
import { isProductCode } from "./db";

describe("Tag Management Integration Tests", () => {
  let testVideoId: number;
  let testKeywordTagId: number;
  let testProductCodeTagId: number;

  beforeAll(async () => {
    // Create a test video
    const video = await db.createVideo({
      title: "Test Video for Tag Management",
      description: "Testing tag management features",
      videoUrl: "https://youtube.com/watch?v=test123",
      thumbnailUrl: "https://img.youtube.com/vi/test123/default.jpg",
      platform: "youtube",
      category: "maintenance",
      shareStatus: "private",
      productId: "QJD002001A",
    });
    testVideoId = video.id;

    // Create test tags
    const keywordTag = await db.createTag({
      name: "維修",
      description: "維修相關影片",
      color: "#FF5733",
      tagType: "KEYWORD",
    });
    testKeywordTagId = keywordTag.id;

    const productCodeTag = await db.createTag({
      name: "QJD002001A",
      description: "商品編號 QJD002001A",
      color: "#3498DB",
      tagType: "PRODUCT_CODE",
    });
    testProductCodeTagId = productCodeTag.id;
  });

  afterAll(async () => {
    // Cleanup: delete test data
    if (testVideoId) {
      await db.deleteVideo(testVideoId);
    }
    if (testKeywordTagId) {
      await db.deleteTag(testKeywordTagId);
    }
    if (testProductCodeTagId) {
      await db.deleteTag(testProductCodeTagId);
    }
  });

  describe("Product Code Detection", () => {
    it("should correctly identify valid product codes", () => {
      expect(isProductCode("QJD002001A")).toBe(true);
      expect(isProductCode("ABC123456a")).toBe(true);
      expect(isProductCode("XYZ999999C")).toBe(true);
    });

    it("should reject invalid product codes", () => {
      expect(isProductCode("QJD002001")).toBe(false); // Missing letter
      expect(isProductCode("QJ002001A")).toBe(false); // Only 2 letters
      expect(isProductCode("QJDA02001A")).toBe(false); // 4 letters
      expect(isProductCode("QJD02001A")).toBe(false); // Only 5 digits
      expect(isProductCode("QJD0020010A")).toBe(false); // 7 digits
      expect(isProductCode("QJD002001D")).toBe(false); // Invalid letter (not a/b/c)
    });
  });

  describe("Tag Type Management", () => {
    it("should create and retrieve tags by type", async () => {
      const keywordTags = await db.getTagsByType("KEYWORD");
      const productCodeTags = await db.getTagsByType("PRODUCT_CODE");

      expect(keywordTags.some(t => t.id === testKeywordTagId)).toBe(true);
      expect(productCodeTags.some(t => t.id === testProductCodeTagId)).toBe(true);
    });

    it("should update tag type", async () => {
      const updatedTag = await db.updateTag(testKeywordTagId, {
        tagType: "PRODUCT_CODE",
      });

      expect(updatedTag.tagType).toBe("PRODUCT_CODE");

      // Revert back
      await db.updateTag(testKeywordTagId, {
        tagType: "KEYWORD",
      });
    });
  });

  describe("Video Tag Management with 5-tag Limit", () => {
    it("should add tags to video (respecting 5-tag limit)", async () => {
      // Add first tag
      const relation1 = await db.addTagToVideo(testVideoId, testKeywordTagId, 1);
      expect(relation1.videoId).toBe(testVideoId);
      expect(relation1.tagId).toBe(testKeywordTagId);

      // Add second tag
      const relation2 = await db.addTagToVideo(testVideoId, testProductCodeTagId, 10);
      expect(relation2.tagId).toBe(testProductCodeTagId);

      // Verify tags
      const videoTags = await db.getVideoTags(testVideoId);
      expect(videoTags.length).toBe(2);
      expect(videoTags.some(t => t.id === testKeywordTagId)).toBe(true);
      expect(videoTags.some(t => t.id === testProductCodeTagId)).toBe(true);
    });

    it("should remove tags from video", async () => {
      await db.removeTagFromVideo(testVideoId, testKeywordTagId);

      const videoTags = await db.getVideoTags(testVideoId);
      expect(videoTags.some(t => t.id === testKeywordTagId)).toBe(false);
      expect(videoTags.some(t => t.id === testProductCodeTagId)).toBe(true);
    });

    it("should get videos by tag", async () => {
      const videos = await db.getTagVideos(testProductCodeTagId);
      expect(videos.some(v => v.id === testVideoId)).toBe(true);
    });
  });

  describe("Smart Score Calculation", () => {
    it("should calculate video score with PRODUCT_CODE priority", async () => {
      // Re-add keyword tag
      await db.addTagToVideo(testVideoId, testKeywordTagId, 1);

      // Calculate score
      const score = await db.calculateVideoScore(testVideoId);

      // Score should be high due to PRODUCT_CODE tag (weight * 10000)
      // Assuming both tags have usageCount = 1:
      // KEYWORD: 1 * 1 * 1 = 1
      // PRODUCT_CODE: 1 * 10000 * 10 = 100000
      // Total: 100001
      expect(score).toBeGreaterThan(10000);
    });

    it("should sort videos by smart score", async () => {
      const videos = await db.getVideosBySmartScore();
      expect(videos.length).toBeGreaterThan(0);
      
      // Verify videos are sorted (higher scores first)
      for (let i = 0; i < videos.length - 1; i++) {
        expect(videos[i].smartScore).toBeGreaterThanOrEqual(videos[i + 1].smartScore);
      }
    });

    it("should search videos by tags with smart sorting", async () => {
      const results = await db.searchVideosByTags([testProductCodeTagId, testKeywordTagId]);
      
      expect(results.some(v => v.id === testVideoId)).toBe(true);
      
      // Verify results are sorted by smart score
      for (let i = 0; i < results.length - 1; i++) {
        expect(results[i].smartScore).toBeGreaterThanOrEqual(results[i + 1].smartScore);
      }
    });
  });

  describe("Tag Statistics", () => {
    it("should get global tag statistics", async () => {
      const stats = await db.getTagStats();
      
      expect(stats.totalTags).toBeGreaterThan(0);
      expect(stats.totalRelationships).toBeGreaterThan(0);
    });

    it("should get videos for a specific tag", async () => {
      const videos = await db.getTagVideos(testProductCodeTagId);
      expect(videos.length).toBeGreaterThan(0);
    });
  });
});
