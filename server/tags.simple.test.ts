import { describe, it, expect } from "vitest";
import * as db from "./db";

describe("Tags System - Simple Tests", () => {
  it("should create and retrieve tags", async () => {
    const tag = await db.createTag({
      name: `測試標籤_${Date.now()}`,
      description: "測試描述",
      color: "#FF5733",
    });

    expect(tag).toBeDefined();
    expect(tag.name).toContain("測試標籤");
    expect(tag.usageCount).toBe(0);

    const retrieved = await db.getTagById(tag.id);
    expect(retrieved?.id).toBe(tag.id);
  });

  it("should add and remove tags from videos", async () => {
    // Create test data
    const video = await db.createVideo({
      title: `Test Video ${Date.now()}`,
      platform: "youtube" as any,
      videoUrl: "https://www.youtube.com/watch?v=test",
      category: "product_intro" as any,
      shareStatus: "public" as any,
    });

    const tag = await db.createTag({
      name: `Tag_${Date.now()}`,
      color: "#3B82F6",
    });

    // Add tag to video
    const videoTag = await db.addTagToVideo(video.id, tag.id, 5);
    expect(videoTag.videoId).toBe(video.id);
    expect(videoTag.tagId).toBe(tag.id);
    expect(videoTag.weight).toBe(5);

    // Check usage count
    const tagAfterAdd = await db.getTagById(tag.id);
    expect(tagAfterAdd?.usageCount).toBe(1);

    // Get video tags
    const videoTags = await db.getVideoTags(video.id);
    expect(videoTags.some(t => t.id === tag.id)).toBe(true);

    // Remove tag from video
    await db.removeTagFromVideo(video.id, tag.id);
    const tagsAfterRemove = await db.getVideoTags(video.id);
    expect(tagsAfterRemove.some(t => t.id === tag.id)).toBe(false);

    // Check usage count decremented
    const tagAfterRemove = await db.getTagById(tag.id);
    expect(tagAfterRemove?.usageCount).toBe(0);
  });

  it("should get popular tags and statistics", async () => {
    const popularTags = await db.getPopularTags(5);
    expect(Array.isArray(popularTags)).toBe(true);

    const stats = await db.getTagStats();
    expect(stats.totalTags).toBeGreaterThanOrEqual(0);
    expect(stats.totalRelationships).toBeGreaterThanOrEqual(0);
    expect(stats.avgTagsPerVideo).toBeGreaterThanOrEqual(0);
  });

  it("should handle tag deletion with CASCADE", async () => {
    // Create test data
    const video = await db.createVideo({
      title: `Test Video for Delete ${Date.now()}`,
      platform: "youtube" as any,
      videoUrl: "https://www.youtube.com/watch?v=delete",
      category: "other" as any,
      shareStatus: "private" as any,
    });

    const tag = await db.createTag({
      name: `DeleteTag_${Date.now()}`,
      color: "#FF0000",
    });

    // Add tag to video
    await db.addTagToVideo(video.id, tag.id, 1);

    // Verify relationship exists
    let videoTags = await db.getVideoTags(video.id);
    expect(videoTags.some(t => t.id === tag.id)).toBe(true);

    // Delete tag
    await db.deleteTag(tag.id);

    // Verify tag is deleted
    const deletedTag = await db.getTagById(tag.id);
    expect(deletedTag).toBeUndefined();

    // Verify relationship is also deleted (CASCADE)
    videoTags = await db.getVideoTags(video.id);
    expect(videoTags.some(t => t.id === tag.id)).toBe(false);
  });
});
