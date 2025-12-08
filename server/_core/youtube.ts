import { google } from 'googleapis';

const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY,
});

/**
 * Extract video ID from YouTube URL
 * Supports formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 */
export function extractYouTubeVideoId(url: string): string | null {
  try {
    const urlObj = new URL(url);
    
    // Format: https://www.youtube.com/watch?v=VIDEO_ID
    if (urlObj.hostname.includes('youtube.com') && urlObj.searchParams.has('v')) {
      return urlObj.searchParams.get('v');
    }
    
    // Format: https://youtu.be/VIDEO_ID
    if (urlObj.hostname === 'youtu.be') {
      return urlObj.pathname.slice(1);
    }
    
    // Format: https://www.youtube.com/embed/VIDEO_ID
    if (urlObj.pathname.startsWith('/embed/')) {
      return urlObj.pathname.split('/')[2];
    }
    
    return null;
  } catch (error) {
    console.error('[YouTube] Failed to extract video ID:', error);
    return null;
  }
}

/**
 * Get video details from YouTube Data API v3
 * Returns video title, channel title, channel ID, and custom URL
 */
export async function getYouTubeVideoDetails(videoId: string): Promise<{
  title: string;
  channelTitle: string;
  channelId: string;
  channelCustomUrl?: string;
  duration?: number; // Duration in seconds
  thumbnailUrl?: string;
} | null> {
  try {
    const response = await youtube.videos.list({
      part: ['snippet', 'contentDetails'],
      id: [videoId],
    });
    
    if (!response.data.items || response.data.items.length === 0) {
      console.warn(`[YouTube] Video not found: ${videoId}`);
      return null;
    }
    
    const video = response.data.items[0];
    const snippet = video.snippet!;
    const contentDetails = video.contentDetails!;
    
    // Parse ISO 8601 duration (e.g., PT1H2M10S -> 3730 seconds)
    const duration = parseDuration(contentDetails.duration || '');
    
    // Get channel custom URL (e.g., @心灵之音)
    const channelResponse = await youtube.channels.list({
      part: ['snippet'],
      id: [snippet.channelId!],
    });
    
    const channelCustomUrl = channelResponse.data.items?.[0]?.snippet?.customUrl;
    
    return {
      title: snippet.title || '',
      channelTitle: snippet.channelTitle || '',
      channelId: snippet.channelId || '',
      channelCustomUrl: channelCustomUrl ? `@${channelCustomUrl.replace(/^@/, '')}` : undefined,
      duration,
      thumbnailUrl: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url,
    };
  } catch (error: any) {
    console.error('[YouTube] API error:', error.message);
    throw new Error(`YouTube API error: ${error.message}`);
  }
}

/**
 * Parse ISO 8601 duration to seconds
 * Example: PT1H2M10S -> 3730 seconds
 */
function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  
  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Get creator name from YouTube video URL
 * Returns channel custom URL (e.g., @心灵之音) or channel title
 */
export async function getYouTubeCreator(videoUrl: string): Promise<string | null> {
  const videoId = extractYouTubeVideoId(videoUrl);
  if (!videoId) {
    console.warn('[YouTube] Invalid video URL:', videoUrl);
    return null;
  }
  
  const details = await getYouTubeVideoDetails(videoId);
  if (!details) return null;
  
  // Prefer custom URL (e.g., @心灵之音), fallback to channel title
  return details.channelCustomUrl || details.channelTitle;
}
