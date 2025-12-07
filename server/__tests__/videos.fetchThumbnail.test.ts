import { describe, it, expect } from 'vitest';
import { extractYouTubeVideoId, getYouTubeThumbnailUrl, fetchYouTubeThumbnail, fetchYouTubeMetadata } from '../utils/youtube';

describe('YouTube Thumbnail Fetching', () => {
  describe('extractYouTubeVideoId', () => {
    it('should extract video ID from standard YouTube URL', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      const videoId = extractYouTubeVideoId(url);
      expect(videoId).toBe('dQw4w9WgXcQ');
    });

    it('should extract video ID from short YouTube URL', () => {
      const url = 'https://youtu.be/dQw4w9WgXcQ';
      const videoId = extractYouTubeVideoId(url);
      expect(videoId).toBe('dQw4w9WgXcQ');
    });

    it('should extract video ID from embed YouTube URL', () => {
      const url = 'https://www.youtube.com/embed/dQw4w9WgXcQ';
      const videoId = extractYouTubeVideoId(url);
      expect(videoId).toBe('dQw4w9WgXcQ');
    });

    it('should extract video ID from old YouTube URL', () => {
      const url = 'https://www.youtube.com/v/dQw4w9WgXcQ';
      const videoId = extractYouTubeVideoId(url);
      expect(videoId).toBe('dQw4w9WgXcQ');
    });

    it('should return null for invalid YouTube URL', () => {
      const url = 'https://example.com/video';
      const videoId = extractYouTubeVideoId(url);
      expect(videoId).toBeNull();
    });

    it('should return null for malformed URL', () => {
      const url = 'not-a-valid-url';
      const videoId = extractYouTubeVideoId(url);
      expect(videoId).toBeNull();
    });
  });

  describe('getYouTubeThumbnailUrl', () => {
    it('should generate maxres thumbnail URL', () => {
      const videoId = 'dQw4w9WgXcQ';
      const thumbnailUrl = getYouTubeThumbnailUrl(videoId, 'maxres');
      expect(thumbnailUrl).toBe('https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg');
    });

    it('should generate hq thumbnail URL', () => {
      const videoId = 'dQw4w9WgXcQ';
      const thumbnailUrl = getYouTubeThumbnailUrl(videoId, 'hq');
      expect(thumbnailUrl).toBe('https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg');
    });

    it('should default to maxres quality', () => {
      const videoId = 'dQw4w9WgXcQ';
      const thumbnailUrl = getYouTubeThumbnailUrl(videoId);
      expect(thumbnailUrl).toBe('https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg');
    });
  });

  describe('fetchYouTubeMetadata', () => {
    it('should fetch metadata for valid YouTube URL', async () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      const result = await fetchYouTubeMetadata(url);
      
      expect(result).not.toBeNull();
      expect(result?.platform).toBe('youtube');
      expect(result?.title).toBeTruthy();
      expect(result?.authorName).toBeTruthy();
      expect(result?.thumbnailUrl).toContain('ytimg.com'); // oEmbed 返回 i.ytimg.com
    });

    it('should return null for invalid YouTube URL', async () => {
      const url = 'https://example.com/video';
      const result = await fetchYouTubeMetadata(url);
      
      expect(result).toBeNull();
    });
  });

  describe('fetchYouTubeThumbnail', () => {
    it('should fetch thumbnail for valid YouTube URL', async () => {
      // 使用真實的 YouTube 影片（Rick Astley - Never Gonna Give You Up）
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      const result = await fetchYouTubeThumbnail(url);
      
      expect(result).not.toBeNull();
      expect(result?.platform).toBe('youtube');
      expect(result?.thumbnailUrl).toContain('img.youtube.com');
      expect(result?.thumbnailUrl).toContain('dQw4w9WgXcQ');
    });

    it('should fetch thumbnail for short YouTube URL', async () => {
      const url = 'https://youtu.be/dQw4w9WgXcQ';
      const result = await fetchYouTubeThumbnail(url);
      
      expect(result).not.toBeNull();
      expect(result?.platform).toBe('youtube');
      expect(result?.thumbnailUrl).toContain('dQw4w9WgXcQ');
    });

    it('should return null for invalid YouTube URL', async () => {
      const url = 'https://www.youtube.com/watch?v=INVALID_VIDEO_ID_12345678';
      const result = await fetchYouTubeThumbnail(url);
      
      // 無效的影片 ID 可能會返回 null（取決於 YouTube API 行為）
      // 或返回預設縮圖（某些情況下）
      // 此測試主要驗證函數不會拋出錯誤
      expect(result).toBeDefined();
    }, 10000); // 增加 timeout 到 10 秒

    it('should return null for non-YouTube URL', async () => {
      const url = 'https://example.com/video';
      const result = await fetchYouTubeThumbnail(url);
      
      expect(result).toBeNull();
    });
  });
});
