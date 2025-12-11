import { z } from "zod";
import { router, protectedProcedure } from "../../_core/trpc";
import { TRPCError } from "@trpc/server";
import * as db from "../../db";

/**
 * CSV 批次匯入 Router
 * 
 * 功能：
 * - 解析 CSV 檔案（標題,YouTube URL）
 * - 批次匯入影片到資料庫
 * - 自動抓取 YouTube 影片資訊（標題、描述、縮圖、創作者、影片長度）
 * - 自動跳過重複影片
 * - 回傳匯入結果統計
 */

export const csvImportRouter = router({
  /**
   * 從 CSV 匯入影片
   * 
   * 輸入格式：
   * - csvContent: CSV 檔案內容（標題,YouTube URL）
   * - categoryId: 分類 ID（必填）
   * - shareStatus: 分享狀態（選填，預設 private）
   * - apiKey: YouTube API Key（必填）
   * 
   * 回傳：
   * - total: 總影片數
   * - imported: 成功匯入數
   * - skipped: 跳過數（重複）
   * - failed: 失敗數
   * - videos: 詳細結果列表
   */
  importFromCSV: protectedProcedure
    .input(z.object({
      csvContent: z.string(),
      categoryId: z.number(),
      shareStatus: z.enum(['private', 'public']).optional().default('private'),
      apiKey: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      // 權限檢查：僅 Admin 可執行
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: '僅管理員可執行批次匯入',
        });
      }

      const { extractYouTubeVideoId, fetchYouTubeMetadata, fetchPlaylistVideos } = await import('../../utils/youtube');

      // 1. 解析 CSV 內容
      const lines = input.csvContent.split('\n').filter(line => line.trim());
      const videoEntries: Array<{ title: string; url: string }> = [];

      for (const line of lines) {
        const [title, url] = line.split(',').map(s => s.trim());
        if (title && url) {
          videoEntries.push({ title, url });
        }
      }

      if (videoEntries.length === 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'CSV 檔案格式錯誤或無有效資料',
        });
      }

      // 2. 批次匯入影片
      const results = {
        total: videoEntries.length,
        imported: 0,
        skipped: 0,
        failed: 0,
        videos: [] as Array<{
          videoId: string;
          title: string;
          status: 'imported' | 'skipped' | 'failed';
          reason?: string;
        }>,
      };

      for (const entry of videoEntries) {
        try {
          // 2.1 解析 YouTube Video ID
          const videoId = extractYouTubeVideoId(entry.url);
          if (!videoId) {
            results.failed++;
            results.videos.push({
              videoId: '',
              title: entry.title,
              status: 'failed',
              reason: '無效的 YouTube URL',
            });
            continue;
          }

          // 2.2 檢查是否已存在
          const existingVideo = await db.getVideoByUrl(entry.url);
          if (existingVideo) {
            results.skipped++;
            results.videos.push({
              videoId,
              title: entry.title,
              status: 'skipped',
              reason: '影片已存在',
            });
            continue;
          }

          // 2.3 取得 YouTube 影片詳細資訊（使用 YouTube Data API v3）
          const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${input.apiKey}`;
          const response = await fetch(apiUrl);
          const data = await response.json();
          
          if (!data.items || data.items.length === 0) {
            results.failed++;
            results.videos.push({
              videoId,
              title: entry.title,
              status: 'failed',
              reason: '無法取得影片資訊（API Key 可能無效或影片不存在）',
            });
            continue;
          }
          
          const videoData = data.items[0];
          const snippet = videoData.snippet;
          const contentDetails = videoData.contentDetails;
          
          // 解析影片長度（ISO 8601 duration 格式，例如 PT1H2M10S）
          let duration = 0;
          if (contentDetails?.duration) {
            const match = contentDetails.duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
            if (match) {
              const hours = parseInt(match[1] || '0');
              const minutes = parseInt(match[2] || '0');
              const seconds = parseInt(match[3] || '0');
              duration = hours * 3600 + minutes * 60 + seconds;
            }
          }
          
          const videoDetails = {
            title: snippet.title || entry.title,
            description: snippet.description || '',
            thumbnailUrl: snippet.thumbnails?.maxresdefault?.url || snippet.thumbnails?.high?.url || '',
            creator: snippet.channelTitle || '',
            duration,
          };

          // 2.4 建立影片記錄
          await db.createVideo({
            title: videoDetails.title,
            description: videoDetails.description,
            videoUrl: entry.url,
            platform: 'youtube',
            category: 'other', // ⚠️ DEPRECATED: 使用預設值 'other'，實際分類由 categoryId 決定
            categoryId: input.categoryId,
            thumbnailUrl: videoDetails.thumbnailUrl,
            creator: videoDetails.creator,
            duration: videoDetails.duration,
            shareStatus: input.shareStatus,
            uploadedBy: ctx.user.id,
            productId: null,
          });

          results.imported++;
          results.videos.push({
            videoId,
            title: videoDetails.title || entry.title,
            status: 'imported',
          });
        } catch (error) {
          results.failed++;
          results.videos.push({
            videoId: '',
            title: entry.title,
            status: 'failed',
            reason: error instanceof Error ? error.message : '未知錯誤',
          });
        }
      }

      return results;
    }),
});
