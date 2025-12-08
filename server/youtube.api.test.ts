import { describe, it, expect } from "vitest";
import { extractYouTubeVideoId, getYouTubeVideoDetails, getYouTubeCreator } from "./_core/youtube";

describe("YouTube API Integration", () => {
  it("should extract video ID from standard YouTube URL", () => {
    const url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
    const videoId = extractYouTubeVideoId(url);
    expect(videoId).toBe("dQw4w9WgXcQ");
  });

  it("should extract video ID from short YouTube URL", () => {
    const url = "https://youtu.be/dQw4w9WgXcQ";
    const videoId = extractYouTubeVideoId(url);
    expect(videoId).toBe("dQw4w9WgXcQ");
  });

  it("should extract video ID from embed YouTube URL", () => {
    const url = "https://www.youtube.com/embed/dQw4w9WgXcQ";
    const videoId = extractYouTubeVideoId(url);
    expect(videoId).toBe("dQw4w9WgXcQ");
  });

  it("should return null for invalid YouTube URL", () => {
    const url = "https://example.com/video";
    const videoId = extractYouTubeVideoId(url);
    expect(videoId).toBeNull();
  });

  it("should fetch video details from YouTube API", async () => {
    // Use a well-known video ID (Rick Astley - Never Gonna Give You Up)
    const videoId = "dQw4w9WgXcQ";
    const details = await getYouTubeVideoDetails(videoId);
    
    expect(details).toBeDefined();
    expect(details?.title).toBeTruthy();
    expect(details?.channelTitle).toBeTruthy();
    expect(details?.channelId).toBeTruthy();
    expect(details?.duration).toBeGreaterThan(0);
  }, 10000); // 10 second timeout for API call

  it("should get creator name from YouTube video URL", async () => {
    const url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
    const creator = await getYouTubeCreator(url);
    
    expect(creator).toBeTruthy();
    expect(typeof creator).toBe("string");
  }, 10000); // 10 second timeout for API call
});
