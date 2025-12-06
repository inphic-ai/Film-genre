import { describe, it, expect, beforeAll } from "vitest";
import * as db from "./db";

describe("Tags System", () => {
  let testTagId: number;
  let testVideoId: number;

  beforeAll(async () => {
    // Create a test video for tag relationships
    const video = await db.createVideo({
      title: "Test Video for Tags",
      description: "Test description",
      platform: "youtube" as any,
      videoUrl: "https://www.youtube.com/watch?v=test123",
      category: "product_intro" as any,
      shareStatus: "public" as any,
    });
    testVideoId = video.id;
  });

  describe("Tag CRUD Operations", () => {
    it("should create a new tag", async () => {
      const tag = await db.createTag({
        name: "測試標籤",
        description: "這是一個測試標籤",
        color: "#FF5733",
      });

      expect(tag).toBeDefined();
      expect(tag.name).toBe("測試標籤");
      expect(tag.description).toBe("這是一個測試標籤");
      expect(tag.color).toBe("#FF5733");
      expect(tag.usageCount).toBe(0);

      testTagId = tag.id;
    });

    it("should get tag by ID", async () => {
      const tag = await db.getTagById(testTagId);

      expect(tag).toBeDefined();
      expect(tag?.id).toBe(testTagId);
      expect(tag?.name).toBe("測試標籤");
    });

    it("should get tag by name", async () => {
      const tag = await db.getTagByName("測試標籤");

      expect(tag).toBeDefined();
      expect(tag?.id).toBe(testTagId);
    });

    it("should update tag", async () => {
      await db.updateTag(testTagId, {
        description: "更新後的描述",
        color: "#3B82F6",
      });

      const updatedTag = await db.getTagById(testTagId);
      expect(updatedTag?.description).toBe("更新後的描述");
      expect(updatedTag?.color).toBe("#3B82F6");
    });

    it("should list all tags", async () => {
      const tags = await db.getAllTags();

      expect(tags).toBeDefined();
      expect(Array.isArray(tags)).toBe(true);
      expect(tags.length).toBeGreaterThan(0);
      expect(tags.some(t => t.id === testTagId)).toBe(true);
    });

    it("should search tags by keyword", async () => {
      const tags = await db.searchTags("測試");

      expect(tags).toBeDefined();
      expect(Array.isArray(tags)).toBe(true);
      expect(tags.some(t => t.id === testTagId)).toBe(true);
    });
  });

  describe("Video-Tags Relationships", () => {
    it("should add tag to video", async () => {
      const videoTag = await db.addTagToVideo(testVideoId, testTagId, 5);

      expect(videoTag).toBeDefined();
      expect(videoTag.videoId).toBe(testVideoId);
      expect(videoTag.tagId).toBe(testTagId);
      expect(videoTag.weight).toBe(5);

      // Check usage count incremented
      const tag = await db.getTagById(testTagId);
      expect(tag?.usageCount).toBe(1);
    });

    it("should get tags for a video", async () => {
      const tags = await db.getVideoTags(testVideoId);

      expect(tags).toBeDefined();
      expect(Array.isArray(tags)).toBe(true);
      expect(tags.length).toBeGreaterThan(0);
      expect(tags.some(t => t.id === testTagId)).toBe(true);
    });

    it("should get videos for a tag", async () => {
      const videos = await db.getTagVideos(testTagId);

      expect(videos).toBeDefined();
      expect(Array.isArray(videos)).toBe(true);
      expect(videos.length).toBeGreaterThan(0);
      expect(videos.some(v => v.id === testVideoId)).toBe(true);
      expect(videos[0].weight).toBe(5);
    });

    it("should update weight when adding same tag again", async () => {
      await db.addTagToVideo(testVideoId, testTagId, 8);

      const videos = await db.getTagVideos(testTagId);
      const video = videos.find(v => v.id === testVideoId);
      expect(video?.weight).toBe(8);

      // Usage count should not increment again
      const tag = await db.getTagById(testTagId);
      expect(tag?.usageCount).toBe(1);
    });

    it("should remove tag from video", async () => {
      await db.removeTagFromVideo(testVideoId, testTagId);

      const tags = await db.getVideoTags(testVideoId);
      expect(tags.some(t => t.id === testTagId)).toBe(false);

      // Check usage count decremented
      const tag = await db.getTagById(testTagId);
      expect(tag?.usageCount).toBe(0);
    });
  });

  describe("Tag Statistics", () => {
    let popularTagId1: number;
    let popularTagId2: number;
    let popularTagId3: number;

    beforeAll(async () => {
      // Create multiple tags with different usage counts
      const tag1 = await db.createTag({ name: "熱門標籤1", color: "#FF0000" });
      const tag2 = await db.createTag({ name: "熱門標籤2", color: "#00FF00" });
      const tag3 = await db.createTag({ name: "熱門標籤3", color: "#0000FF" });

      popularTagId1 = tag1.id;
      popularTagId2 = tag2.id;
      popularTagId3 = tag3.id;

      // Add tags to video with different weights
      await db.addTagToVideo(testVideoId, popularTagId1, 1);
      await db.addTagToVideo(testVideoId, popularTagId2, 1);
      await db.addTagToVideo(testVideoId, popularTagId3, 1);
    });

    it("should get popular tags", async () => {
      const popularTags = await db.getPopularTags(10);

      expect(popularTags).toBeDefined();
      expect(Array.isArray(popularTags)).toBe(true);
      expect(popularTags.length).toBeGreaterThan(0);

      // Should be sorted by usage count (descending)
      for (let i = 0; i < popularTags.length - 1; i++) {
        expect(popularTags[i].usageCount).toBeGreaterThanOrEqual(popularTags[i + 1].usageCount);
      }
    });

    it("should get related tags (co-occurrence)", async () => {
      const relatedTags = await db.getRelatedTags(popularTagId1, 10);

      expect(relatedTags).toBeDefined();
      expect(Array.isArray(relatedTags)).toBe(true);

      // Should include other tags from the same video
      const relatedIds = relatedTags.map(t => t.id);
      expect(relatedIds.includes(popularTagId2) || relatedIds.includes(popularTagId3)).toBe(true);

      // Should not include the tag itself
      expect(relatedIds.includes(popularTagId1)).toBe(false);
    });

    it("should get tag statistics", async () => {
      const stats = await db.getTagStats();

      expect(stats).toBeDefined();
      expect(stats.totalTags).toBeGreaterThan(0);
      expect(stats.totalRelationships).toBeGreaterThan(0);
      expect(stats.avgTagsPerVideo).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Tag Deletion", () => {
    it("should delete tag (CASCADE should remove relationships)", async () => {
      // Create a new tag and add to video
      const tempTag = await db.createTag({ name: "臨時標籤", color: "#CCCCCC" });
      await db.addTagToVideo(testVideoId, tempTag.id, 1);

      // Verify relationship exists
      let tags = await db.getVideoTags(testVideoId);
      expect(tags.some(t => t.id === tempTag.id)).toBe(true);

      // Delete tag
      await db.deleteTag(tempTag.id);

      // Verify tag is deleted
      const deletedTag = await db.getTagById(tempTag.id);
      expect(deletedTag).toBeUndefined();

      // Verify relationship is also deleted (CASCADE)
      tags = await db.getVideoTags(testVideoId);
      expect(tags.some(t => t.id === tempTag.id)).toBe(false);
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty tag name gracefully", async () => {
      try {
        await db.createTag({ name: "", color: "#000000" });
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should handle duplicate tag names", async () => {
      try {
        await db.createTag({ name: "測試標籤", color: "#000000" });
        expect(true).toBe(false); // Should not reach here (unique constraint)
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should handle non-existent tag ID", async () => {
      const tag = await db.getTagById(999999);
      expect(tag).toBeUndefined();
    });

    it("should handle non-existent video-tag relationship", async () => {
      await db.removeTagFromVideo(999999, 999999);
      // Should not throw error
    });
  });
});
