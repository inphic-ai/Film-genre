import { z } from "zod";
import { router, protectedProcedure } from "../../_core/trpc";
import { TRPCError } from "@trpc/server";
import * as db from "../../db";
import Papa from "papaparse";

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

      // 1. 解析 CSV 內容（使用 papaparse 正確處理含逗號的欄位）
      const parseResult = Papa.parse<string[]>(input.csvContent, {
        skipEmptyLines: true,
      });

      const videoEntries: Array<{ title: string; url: string }> = [];

      console.log('[CSV Import] 解析結果：', parseResult.data.length, '行');

      // 跳過標題列（第一行）
      for (let i = 1; i < parseResult.data.length; i++) {
        const row = parseResult.data[i];
        if (row.length >= 2) {
          const title = row[0]?.trim();
          const url = row[1]?.trim();
          if (title && url) {
            videoEntries.push({ title, url });
          }
        }
      }

      console.log('[CSV Import] 解析出', videoEntries.length, '個有效影片');

      if (videoEntries.length === 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'CSV 檔案格式錯誤或無有效資料',
        });
      }

      // 1.5 查詢分類資訊以取得 type (slug)
      const category = await db.getVideoCategoryById(input.categoryId);
      if (!category) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: '無效的分類 ID',
        });
      }
      
      // 將 type 映射到舊的 category enum 值
      const categoryEnumValue = category.type as 'product_intro' | 'maintenance' | 'case_study' | 'faq' | 'other';
      console.log('[CSV Import] 分類資訊：', category.name, '(type:', category.type, ')');

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
        console.log('[CSV Import] 處理影片：', entry.title);
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
            title: (snippet.title || entry.title).substring(0, 255), // 截斷標題至 255 字元
            description: (snippet.description || '').substring(0, 5000), // 截斷描述至 5000 字元
            thumbnailUrl: snippet.thumbnails?.maxresdefault?.url || snippet.thumbnails?.high?.url || '',
            creator: (snippet.channelTitle || '').substring(0, 255), // 截斷創作者名稱至 255 字元
            duration,
          };

          // 2.4 建立影片記錄
          await db.createVideo({
            title: videoDetails.title,
            description: videoDetails.description,
            videoUrl: entry.url,
            platform: 'youtube',
            category: categoryEnumValue, // 根據 categoryId 動態設定
            categoryId: input.categoryId,
            thumbnailUrl: videoDetails.thumbnailUrl,
            creator: videoDetails.creator,
            duration: videoDetails.duration,
            shareStatus: input.shareStatus,
            uploadedBy: ctx.user.id,
            // productId 省略（而不是傳 null）
          });

          results.imported++;
          results.videos.push({
            videoId,
            title: videoDetails.title || entry.title,
            status: 'imported',
          });
          console.log('[CSV Import] 成功匯入：', videoDetails.title);
        } catch (error) {
          console.error('[CSV Import] 匯入失敗：', entry.title);
          console.error('[CSV Import] 錯誤詳情：', error);
          console.error('[CSV Import] 錯誤堆疊：', error instanceof Error ? error.stack : 'N/A');
          results.failed++;
          
          // 提取更詳細的錯誤訊息
          let errorMessage = '未知錯誤';
          if (error instanceof Error) {
            errorMessage = error.message;
            // 如果是資料庫錯誤，嘗試提取具體原因
            if (error.message.includes('Failed query')) {
              errorMessage = '資料庫插入失敗：' + error.message.substring(0, 200);
            }
          }
          
          console.error('[CSV Import] 錯誤訊息：', errorMessage);
          results.videos.push({
            videoId: '',
            title: entry.title,
            status: 'failed',
            reason: errorMessage,
          });
        }
      }

      console.log('[CSV Import] 匯入完成：', results);
      return results;
    }),
});
