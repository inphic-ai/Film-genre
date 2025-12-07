/**
 * YouTube 縮圖抓取輔助函數
 * 支援 YouTube URL 解析與縮圖抓取
 */

/**
 * 從 YouTube URL 解析 videoId
 * 支援格式：
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/v/VIDEO_ID
 */
export function extractYouTubeVideoId(url: string): string | null {
  try {
    const urlObj = new URL(url);
    
    // 標準 URL: youtube.com/watch?v=VIDEO_ID
    if (urlObj.hostname.includes('youtube.com') && urlObj.pathname === '/watch') {
      return urlObj.searchParams.get('v');
    }
    
    // 短網址: youtu.be/VIDEO_ID
    if (urlObj.hostname === 'youtu.be') {
      return urlObj.pathname.slice(1); // 移除前導斜線
    }
    
    // 嵌入 URL: youtube.com/embed/VIDEO_ID
    if (urlObj.hostname.includes('youtube.com') && urlObj.pathname.startsWith('/embed/')) {
      return urlObj.pathname.split('/')[2];
    }
    
    // 舊版 URL: youtube.com/v/VIDEO_ID
    if (urlObj.hostname.includes('youtube.com') && urlObj.pathname.startsWith('/v/')) {
      return urlObj.pathname.split('/')[2];
    }
    
    return null;
  } catch (error) {
    console.error('[YouTube] Failed to parse URL:', error);
    return null;
  }
}

/**
 * 生成 YouTube 縮圖 URL
 * 優先使用 maxresdefault (1280x720)，備用 hqdefault (480x360)
 */
export function getYouTubeThumbnailUrl(videoId: string, quality: 'maxres' | 'hq' = 'maxres'): string {
  const qualityMap = {
    maxres: 'maxresdefault.jpg', // 1280x720
    hq: 'hqdefault.jpg',         // 480x360
  };
  
  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}`;
}

/**
 * 驗證圖片 URL 是否有效（檢查是否可訪問）
 */
export async function validateImageUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    const contentType = response.headers.get('content-type');
    return response.ok && (contentType?.startsWith('image/') ?? false);
  } catch (error) {
    console.error('[YouTube] Failed to validate image URL:', error);
    return false;
  }
}

/**
 * 使用 YouTube oEmbed API 取得影片資訊
 * 文檔：https://oembed.com/providers.json
 */
export async function fetchYouTubeOEmbed(videoUrl: string): Promise<{
  thumbnailUrl: string;
  title: string;
  authorName: string;
} | null> {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`;
    const response = await fetch(oembedUrl);
    
    if (!response.ok) {
      console.error('[YouTube] oEmbed API failed:', response.status, response.statusText);
      return null;
    }
    
    const data = await response.json();
    
    return {
      thumbnailUrl: data.thumbnail_url,
      title: data.title,
      authorName: data.author_name,
    };
  } catch (error) {
    console.error('[YouTube] Failed to fetch oEmbed data:', error);
    return null;
  }
}

/**
 * 抓取 YouTube 影片 metadata（標題、作者、縮圖）
 * 使用 YouTube oEmbed API
 */
export async function fetchYouTubeMetadata(videoUrl: string): Promise<{
  title: string;
  authorName: string;
  thumbnailUrl: string;
  platform: 'youtube';
} | null> {
  const oembedData = await fetchYouTubeOEmbed(videoUrl);
  if (!oembedData) {
    return null;
  }
  
  return {
    title: oembedData.title,
    authorName: oembedData.authorName,
    thumbnailUrl: oembedData.thumbnailUrl,
    platform: 'youtube',
  };
}

/**
 * 抓取 YouTube 影片縮圖（主函數）
 * 策略：
 * 1. 優先使用 URL 模式（maxresdefault）
 * 2. 若失敗則嘗試 hqdefault
 * 3. 若仍失敗則使用 oEmbed API
 */
export async function fetchYouTubeThumbnail(videoUrl: string): Promise<{
  thumbnailUrl: string;
  title?: string;
  platform: 'youtube';
} | null> {
  // 1. 解析 videoId
  const videoId = extractYouTubeVideoId(videoUrl);
  if (!videoId) {
    console.error('[YouTube] Invalid YouTube URL:', videoUrl);
    return null;
  }
  
  // 2. 嘗試使用 URL 模式（maxresdefault）
  const maxresThumbnailUrl = getYouTubeThumbnailUrl(videoId, 'maxres');
  const isMaxresValid = await validateImageUrl(maxresThumbnailUrl);
  
  if (isMaxresValid) {
    console.log('[YouTube] Thumbnail fetched (maxres):', maxresThumbnailUrl);
    return {
      thumbnailUrl: maxresThumbnailUrl,
      platform: 'youtube',
    };
  }
  
  // 3. 嘗試使用 hqdefault
  const hqThumbnailUrl = getYouTubeThumbnailUrl(videoId, 'hq');
  const isHqValid = await validateImageUrl(hqThumbnailUrl);
  
  if (isHqValid) {
    console.log('[YouTube] Thumbnail fetched (hq):', hqThumbnailUrl);
    return {
      thumbnailUrl: hqThumbnailUrl,
      platform: 'youtube',
    };
  }
  
  // 4. 使用 oEmbed API（備用方案）
  const oembedData = await fetchYouTubeOEmbed(videoUrl);
  if (oembedData) {
    console.log('[YouTube] Thumbnail fetched (oEmbed):', oembedData.thumbnailUrl);
    return {
      thumbnailUrl: oembedData.thumbnailUrl,
      title: oembedData.title,
      platform: 'youtube',
    };
  }
  
  console.error('[YouTube] Failed to fetch thumbnail for:', videoUrl);
  return null;
}

/**
 * 從 YouTube URL 解析 playlistId
 * 支援格式：
 * - https://www.youtube.com/playlist?list=PLAYLIST_ID
 * - https://www.youtube.com/watch?v=VIDEO_ID&list=PLAYLIST_ID
 */
export function extractPlaylistId(url: string): string | null {
  try {
    const urlObj = new URL(url);
    
    // 檢查是否為 YouTube URL
    if (!urlObj.hostname.includes('youtube.com')) {
      return null;
    }
    
    // 從 query string 取得 list 參數
    return urlObj.searchParams.get('list');
  } catch (error) {
    console.error('[YouTube] Failed to parse playlist URL:', error);
    return null;
  }
}

/**
 * 使用 YouTube Data API v3 取得播放清單影片列表
 * 文檔：https://developers.google.com/youtube/v3/docs/playlistItems/list
 */
export async function fetchPlaylistVideos(
  playlistId: string,
  apiKey: string,
  maxResults: number = 50
): Promise<Array<{
  videoId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  publishedAt: string;
}> | null> {
  try {
    const apiUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&key=${apiKey}&maxResults=${maxResults}`;
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[YouTube] Playlist API failed:', response.status, response.statusText, errorData);
      return null;
    }
    
    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      console.log('[YouTube] Playlist is empty:', playlistId);
      return [];
    }
    
    return data.items.map((item: any) => ({
      videoId: item.snippet.resourceId.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnailUrl: item.snippet.thumbnails.maxres?.url || item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
      publishedAt: item.snippet.publishedAt,
    }));
  } catch (error) {
    console.error('[YouTube] Failed to fetch playlist videos:', error);
    return null;
  }
}

/**
 * 驗證 YouTube Data API v3 Key 是否有效
 */
export async function validateYouTubeApiKey(apiKey: string): Promise<boolean> {
  try {
    // 使用簡單的 API 呼叫測試 API Key（取得 YouTube 頻道資訊）
    const testUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=UC_x5XG1OV2P6uZZ5FSM9Ttw&key=${apiKey}`;
    const response = await fetch(testUrl);
    
    return response.ok;
  } catch (error) {
    console.error('[YouTube] Failed to validate API key:', error);
    return false;
  }
}
