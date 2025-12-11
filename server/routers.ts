import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { sdk } from "./_core/sdk";
import { ENV } from "./_core/env";
import { TRPCError } from "@trpc/server";
import * as db from "./db";
import * as ai from "./ai";
import { productsRouter } from "./trpc/routers/products";
import { dashboardRouter } from "./trpc/routers/dashboard";
import { myContributionsRouter } from "./trpc/routers/myContributions";
import { reviewCenterRouter } from "./trpc/routers/reviewCenter";
import { adminSettingsRouter } from "./trpc/routers/adminSettings";
import { fullTextSearchRouter } from "./trpc/routers/fullTextSearch";
import { notificationsRouter } from "./trpc/routers/notifications";
import { videoSuggestionsRouter } from "./trpc/routers/videoSuggestions";
import { aiSearchRouter } from "./trpc/routers/aiSearch";
import { performanceMonitorRouter } from "./trpc/routers/performanceMonitor";
import { videoCategoriesRouter } from "./trpc/routers/videoCategories";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    login: publicProcedure
      .input(z.object({
        password: z.string().min(1, "Password is required"),
      }))
      .mutation(async ({ input, ctx }) => {
        // Verify password
        if (!ENV.adminPassword) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Admin password not configured",
          });
        }

        if (input.password !== ENV.adminPassword) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid password",
          });
        }

        // Create session
        const sessionToken = await sdk.createSessionToken(ENV.adminEmail, {
          name: "Admin",
          role: "admin",
        });

        // Set cookie
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, cookieOptions);

        return {
          success: true,
          user: {
            email: ENV.adminEmail,
            name: "Admin",
            role: "admin",
          },
        };
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Category management
  categories: router({
    list: publicProcedure.query(async () => {
      return await db.getAllCategories();
    }),
    
    update: protectedProcedure
      .input(z.object({
        key: z.string(),
        name: z.string(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.updateCategory(input.key, input.name, input.description);
        return { success: true };
      }),
  }),

  // Video management
  videos: router({
    // Get all videos (for internal board - admin only)
    listAll: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Unauthorized');
      }
      return await db.getAllVideos();
    }),

    // Get YouTube videos only (for client portal - public)
    listYouTube: publicProcedure.query(async () => {
      return await db.getYouTubeVideos();
    }),

    // Get videos by category (internal - admin only)
    listByCategory: protectedProcedure
      .input(z.object({ 
        category: z.string().optional(),
        categoryId: z.number().optional(),
      }))
      .query(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized');
        }
        // 優先使用 categoryId，如果沒有則使用 category
        if (input.categoryId) {
          return await db.getVideosByCategoryId(input.categoryId);
        } else if (input.category) {
          return await db.getVideosByCategory(input.category);
        }
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: '請提供 category 或 categoryId',
        });
      }),

    // Get YouTube videos by category (client portal - public)
    listYouTubeByCategory: publicProcedure
      .input(z.object({ 
        category: z.string().optional(),
        categoryId: z.number().optional(),
      }))
      .query(async ({ input }) => {
        // 優先使用 categoryId，如果沒有則使用 category
        if (input.categoryId) {
          return await db.getYouTubeVideosByCategoryId(input.categoryId);
        } else if (input.category) {
          return await db.getYouTubeVideosByCategory(input.category);
        }
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: '請提供 category 或 categoryId',
        });
      }),

    // Search videos (internal - admin only)
    search: protectedProcedure
      .input(z.object({
        keyword: z.string(),
        platform: z.string().optional(),
      }))
      .query(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized');
        }
        return await db.searchVideos(input.keyword, input.platform);
      }),

    // Global search (supports title, product ID, tags)
    globalSearch: publicProcedure
      .input(z.object({
        query: z.string().min(1),
        limit: z.number().min(1).max(50).default(20),
      }))
      .query(async ({ input }) => {
        return await db.globalSearchVideos(input.query, input.limit);
      }),

    // Get video by ID (allow public access for client portal)
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getVideoById(input.id);
      }),

    // Increment view count
    incrementViewCount: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.incrementViewCount(input.id);
        return { success: true };
      }),

    // Get videos sorted by smart tag score (admin only)
    listBySmartScore: protectedProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized');
        }
        return await db.getVideosBySmartScore(input.limit);
      }),

    // Search videos by tags with smart sorting (admin only)
    searchByTags: protectedProcedure
      .input(z.object({
        tagIds: z.array(z.number()),
        matchAll: z.boolean().optional(),
        limit: z.number().optional(),
      }))
      .query(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized');
        }
        return await db.searchVideosByTags(input.tagIds, input.matchAll, input.limit);
      }),

    // Update video notes
    updateNotes: protectedProcedure
      .input(z.object({
        id: z.number(),
        notes: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized');
        }
        await db.updateVideoNotes(input.id, input.notes);
        return { success: true };
      }),

    // Upload images to R2 (staff/admin only)
    uploadImagesToR2: protectedProcedure
      .input(z.object({
        images: z.array(z.string()),
        folder: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role === 'viewer') {
          throw new Error('Viewers cannot upload images');
        }
        const { uploadImagesToR2 } = await import('./r2');
        const urls = await uploadImagesToR2(input.images, input.folder);
        return { urls };
      }),

    // Check duplicate video by URL (admin only)
    checkDuplicate: protectedProcedure
      .input(z.object({
        videoUrl: z.string().url(),
      }))
      .query(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized');
        }
        const existingVideo = await db.getVideoByUrl(input.videoUrl);
        if (existingVideo) {
          return {
            isDuplicate: true,
            video: existingVideo,
          };
        }
        return {
          isDuplicate: false,
          video: null,
        };
      }),

    // Fetch thumbnail from video URL (admin only)
    fetchThumbnail: protectedProcedure
      .input(z.object({
        videoUrl: z.string().url(),
      }))
      .query(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized');
        }
        
        const { fetchYouTubeThumbnail } = await import('./utils/youtube');
        
        // 目前僅支援 YouTube，未來可擴充抖音與小紅書
        const result = await fetchYouTubeThumbnail(input.videoUrl);
        
        if (!result) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Failed to fetch thumbnail. Please upload manually.',
          });
        }
        
        return result;
      }),

    // Fetch video metadata from URL (admin only)
    fetchMetadata: protectedProcedure
      .input(z.object({
        videoUrl: z.string().url(),
      }))
      .query(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized');
        }
        
        const { fetchYouTubeMetadata } = await import('./utils/youtube');
        
        // 目前僅支援 YouTube，未來可擴充抖音與小紅書
        const result = await fetchYouTubeMetadata(input.videoUrl);
        
        if (!result) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Failed to fetch video metadata. Please enter manually.',
          });
        }
        
        return result;
      }),

    // Suggest tags using AI (admin only)
    suggestTags: protectedProcedure
      .input(z.object({
        title: z.string(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized');
        }
        
        // Get all existing tags
        const allTags = await db.getAllTags();
        
        if (allTags.length === 0) {
          return { suggestedTags: [] };
        }
        
        // Build prompt for LLM
        const tagsListText = allTags.map(tag => `- ${tag.name} (${tag.tagType}, ID: ${tag.id})`).join('\n');
        
        const prompt = `你是一個影片標籤分析專家。根據影片標題與描述，從現有標籤列表中選擇最相關的標籤（最多 5 個）。

影片標題：${input.title}
${input.description ? `影片描述：${input.description}` : ''}

現有標籤列表：
${tagsListText}

請返回 JSON 格式的標籤建議：
[
  { "tagId": 1, "confidence": 0.95 },
  ...
]

注意：
1. 僅從現有標籤列表中選擇
2. 優先選擇與影片內容高度相關的標籤
3. confidence 範圍：0.0 - 1.0
4. 最多返回 5 個標籤
5. 必須返回有效的 JSON 陣列`;
        
        try {
          const { invokeLLM } = await import('./_core/llm');
          const response = await invokeLLM({
            messages: [
              { role: 'system', content: '你是一個影片標籤分析專家，擅長根據影片內容選擇相關標籤。' },
              { role: 'user', content: prompt },
            ],
            response_format: {
              type: 'json_schema',
              json_schema: {
                name: 'tag_suggestions',
                strict: true,
                schema: {
                  type: 'object',
                  properties: {
                    tags: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          tagId: { type: 'number' },
                          confidence: { type: 'number' },
                        },
                        required: ['tagId', 'confidence'],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ['tags'],
                  additionalProperties: false,
                },
              },
            },
          });
          
          const content = response.choices[0].message.content;
          if (typeof content !== 'string') {
            throw new Error('Unexpected response format from LLM');
          }
          const parsed = JSON.parse(content);
          const suggestedTagIds = parsed.tags.map((t: { tagId: number; confidence: number }) => ({
            tagId: t.tagId,
            confidence: t.confidence,
          }));
          
          // Map tag IDs to tag objects
          const suggestedTags = suggestedTagIds
            .map((st: { tagId: number; confidence: number }) => {
              const tag = allTags.find(t => t.id === st.tagId);
              if (!tag) return null;
              return {
                id: tag.id,
                name: tag.name,
                tagType: tag.tagType,
                confidence: st.confidence,
              };
            })
            .filter((t: any): t is { id: number; name: string; tagType: string; confidence: number } => t !== null);
          
          return { suggestedTags };
        } catch (error) {
          console.error('Failed to suggest tags:', error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to generate tag suggestions. Please try again.',
          });
        }
      }),

    // Validate YouTube API Key
    validateYouTubeApiKey: protectedProcedure
      .input(z.object({
        apiKey: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized');
        }
        
        const { validateYouTubeApiKey } = await import('./utils/youtube');
        const isValid = await validateYouTubeApiKey(input.apiKey);
        
        return { valid: isValid };
      }),

    // Import playlist (admin only)
    importPlaylist: protectedProcedure
      .input(z.object({
        playlistUrl: z.string().url(),
        apiKey: z.string(),
        category: z.enum(['product_intro', 'maintenance', 'case_study', 'faq', 'other']).optional(),
        categoryId: z.number().optional(),
        shareStatus: z.enum(['private', 'public']).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized');
        }
        
        const { extractPlaylistId, fetchPlaylistVideos } = await import('./utils/youtube');
        
        // 1. 解析 playlistId
        const playlistId = extractPlaylistId(input.playlistUrl);
        if (!playlistId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: '無效的 YouTube 播放清單 URL',
          });
        }
        
        // 2. 取得播放清單影片列表（最多 100 部）
        const videos = await fetchPlaylistVideos(playlistId, input.apiKey, 100);
        if (!videos) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: '無法取得播放清單影片列表，請檢查 API Key 是否有效',
          });
        }
        
        // 3. 批次匯入影片
        const results = {
          total: videos.length,
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
        
        for (const video of videos) {
          try {
            const videoUrl = `https://www.youtube.com/watch?v=${video.videoId}`;
            
            // 檢查是否已存在
            const existing = await db.getVideoByUrl(videoUrl);
            if (existing) {
              results.skipped++;
              results.videos.push({
                videoId: video.videoId,
                title: video.title,
                status: 'skipped',
                reason: '影片已存在',
              });
              continue;
            }
            
            // 建立影片記錄
            // 向後相容：如果沒有提供 category 也沒有 categoryId，預設使用 'other'
            const category = input.category || 'other';
            await db.createVideo({
              title: video.title,
              description: video.description || undefined,
              platform: 'youtube',
              videoUrl,
              thumbnailUrl: video.thumbnailUrl,
              category,
              categoryId: input.categoryId,
              shareStatus: input.shareStatus || 'private',
              uploadedBy: ctx.user.id,
            });
            
            results.imported++;
            results.videos.push({
              videoId: video.videoId,
              title: video.title,
              status: 'imported',
            });
          } catch (error) {
            console.error('[ImportPlaylist] Failed to import video:', video.videoId, error);
            results.failed++;
            results.videos.push({
              videoId: video.videoId,
              title: video.title,
              status: 'failed',
              reason: error instanceof Error ? error.message : '未知錯誤',
            });
          }
        }
        
        return results;
      }),

    // Create video (admin only)
    create: protectedProcedure
      .input(z.object({
        title: z.string(),
        description: z.string().optional(),
        platform: z.enum(['youtube', 'tiktok', 'redbook']),
        videoUrl: z.string().url(),
        thumbnailUrl: z.string().url().optional(),
        category: z.enum(['product_intro', 'maintenance', 'case_study', 'faq', 'other']).optional(),
        categoryId: z.number().optional(),
        productId: z.string().optional(),
        creator: z.string().optional(),
        shareStatus: z.enum(['private', 'public']).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized');
        }
        // 向後相容：如果沒有提供 category 也沒有 categoryId，預設使用 'other'
        const category = input.category || 'other';
        return await db.createVideo({
          ...input,
          category,
          uploadedBy: ctx.user.id,
        });
      }),

    // Update video (admin only)
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        platform: z.enum(['youtube', 'tiktok', 'redbook']).optional(),
        videoUrl: z.string().url().optional(),
        thumbnailUrl: z.string().url().optional(),
        category: z.enum(['product_intro', 'maintenance', 'case_study', 'faq', 'other']).optional(),
        categoryId: z.number().optional(),
        productId: z.string().optional(),
        creator: z.string().optional(),
        shareStatus: z.enum(['private', 'public']).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized');
        }
        const { id, ...data } = input;
        await db.updateVideo(id, data);
        return { success: true };
      }),

    // Update video rating (admin and staff only)
    updateRating: protectedProcedure
      .input(z.object({
        id: z.number(),
        rating: z.number().min(1).max(5).nullable(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role === 'viewer') {
          throw new Error('Viewers cannot rate videos');
        }
        await db.updateVideo(input.id, { rating: input.rating });
        return { success: true };
      }),

    // Delete video (admin only)
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized');
        }
        await db.deleteVideo(input.id);
        return { success: true };
      }),

    // Upload custom thumbnail (admin only)
    uploadThumbnail: protectedProcedure
      .input(z.object({
        videoId: z.number(),
        imageData: z.string(), // Base64 encoded image
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized');
        }
        
        try {
          console.log('[Upload Thumbnail] Starting upload for video:', input.videoId);
          
          const { storagePut } = await import('./storage');
          
          // Convert base64 to buffer
          const base64Data = input.imageData.replace(/^data:image\/\w+;base64,/, '');
          const buffer = Buffer.from(base64Data, 'base64');
          
          console.log('[Upload Thumbnail] Image buffer size:', buffer.length, 'bytes');
          
          // Generate unique file key
          const timestamp = Date.now();
          const fileKey = `thumbnails/video-${input.videoId}-${timestamp}.jpg`;
          
          // Upload to R2
          const { url } = await storagePut(fileKey, buffer, 'image/jpeg');
          
          console.log('[Upload Thumbnail] R2 upload successful, URL:', url);
          
          // Update video record
          await db.updateVideo(input.videoId, { thumbnailUrl: url });
          
          console.log('[Upload Thumbnail] Database updated for video:', input.videoId);
          
          return { url };
        } catch (error) {
          console.error('[Upload Thumbnail] Upload failed:', {
            videoId: input.videoId,
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
          });
          throw error;
        }
      }),

    // Delete custom thumbnail (admin only)
    deleteThumbnail: protectedProcedure
      .input(z.object({ videoId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized');
        }
        // Remove custom thumbnail URL from database
        await db.updateVideo(input.videoId, { thumbnailUrl: null });
        return { success: true };
      }),

    // Detect creator from YouTube URL (admin only)
    detectCreator: protectedProcedure
      .input(z.object({ videoUrl: z.string().url() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized');
        }
        
        const { getYouTubeCreator } = await import('./_core/youtube');
        const creator = await getYouTubeCreator(input.videoUrl);
        
        if (!creator) {
          throw new Error('無法偵測創作者（僅支援 YouTube 影片）');
        }
        
        return { creator };
      }),

    // Batch delete videos (admin only)
    batchDelete: protectedProcedure
      .input(z.object({ ids: z.array(z.number()) }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized');
        }
        
        let successCount = 0;
        let failedCount = 0;
        
        for (const id of input.ids) {
          try {
            await db.deleteVideo(id);
            successCount++;
          } catch (error) {
            console.error(`Failed to delete video ${id}:`, error);
            failedCount++;
          }
        }
        
        return { successCount, failedCount, total: input.ids.length };
      }),

    // Batch update category (admin only)
    batchUpdateCategory: protectedProcedure
      .input(z.object({
        ids: z.array(z.number()),
        category: z.enum(['product_intro', 'maintenance', 'case_study', 'faq', 'other']).optional(),
        categoryId: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized');
        }
        
        // 向後相容：如果沒有提供 category 也沒有 categoryId，拋錯
        if (!input.category && !input.categoryId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: '請提供 category 或 categoryId',
          });
        }
        
        let successCount = 0;
        let failedCount = 0;
        
        for (const id of input.ids) {
          try {
            const updateData: any = {};
            if (input.categoryId) {
              updateData.categoryId = input.categoryId;
            }
            if (input.category) {
              updateData.category = input.category;
            }
            await db.updateVideo(id, updateData);
            successCount++;
          } catch (error) {
            console.error(`Failed to update video ${id}:`, error);
            failedCount++;
          }
        }
        
        return { successCount, failedCount, total: input.ids.length };
      }),

    // Batch update share status (admin only)
    batchUpdateShareStatus: protectedProcedure
      .input(z.object({
        ids: z.array(z.number()),
        shareStatus: z.enum(['private', 'public']),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized');
        }
        
        let successCount = 0;
        let failedCount = 0;
        
        for (const id of input.ids) {
          try {
            await db.updateVideo(id, { shareStatus: input.shareStatus });
            successCount++;
          } catch (error) {
            console.error(`Failed to update video ${id}:`, error);
            failedCount++;
          }
        }
        
        return { successCount, failedCount, total: input.ids.length };
      }),
  }),

  // Tags management
  tags: router({
    // Get all tags (public)
    list: publicProcedure.query(async () => {
      return await db.getAllTags();
    }),

    // Get tag by ID (public)
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getTagById(input.id);
      }),

    // Get popular tags (public)
    getPopular: publicProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ input }) => {
        return await db.getPopularTags(input.limit);
      }),

    // Search tags (public)
    search: publicProcedure
      .input(z.object({ keyword: z.string() }))
      .query(async ({ input }) => {
        return await db.searchTags(input.keyword);
      }),

    // Get tag statistics (public)
    getStats: publicProcedure.query(async () => {
      return await db.getTagStats();
    }),

    // Get related tags (public)
    getRelated: publicProcedure
      .input(z.object({
        tagId: z.number(),
        limit: z.number().optional(),
      }))
      .query(async ({ input }) => {
        return await db.getRelatedTags(input.tagId, input.limit);
      }),

    // Create tag (admin only)
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(100),
        tagType: z.enum(['KEYWORD', 'PRODUCT_CODE']).optional(),
        description: z.string().optional(),
        color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized');
        }
        // Auto-detect product code format if tagType not specified
        const tagType = input.tagType || (db.isProductCode(input.name) ? 'PRODUCT_CODE' : 'KEYWORD');
        return await db.createTag({ ...input, tagType });
      }),

    // Update tag (admin only)
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).max(100).optional(),
        tagType: z.enum(['KEYWORD', 'PRODUCT_CODE']).optional(),
        description: z.string().optional(),
        color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized');
        }
        const { id, ...data } = input;
        await db.updateTag(id, data);
        return { success: true };
      }),

    // Delete tag (admin only)
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized');
        }
        await db.deleteTag(input.id);
        return { success: true };
      }),

    // Get tags by type (public)
    getByType: publicProcedure
      .input(z.object({ tagType: z.enum(['KEYWORD', 'PRODUCT_CODE']) }))
      .query(async ({ input }) => {
        return await db.getTagsByType(input.tagType);
      }),
  }),

  // Video-Tags relationships
  videoTags: router({
    // Get tags for a video (public)
    getVideoTags: publicProcedure
      .input(z.object({ videoId: z.number() }))
      .query(async ({ input }) => {
        return await db.getVideoTags(input.videoId);
      }),

    // Get videos for a tag (public)
    getTagVideos: publicProcedure
      .input(z.object({ tagId: z.number() }))
      .query(async ({ input }) => {
        return await db.getTagVideos(input.tagId);
      }),

    // Add tag to video (admin only)
    addTag: protectedProcedure
      .input(z.object({
        videoId: z.number(),
        tagId: z.number(),
        weight: z.number().min(1).max(10).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized');
        }
        return await db.addTagToVideo(input.videoId, input.tagId, input.weight);
      }),

    // Remove tag from video (admin only)
    removeTag: protectedProcedure
      .input(z.object({
        videoId: z.number(),
        tagId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized');
        }
        await db.removeTagFromVideo(input.videoId, input.tagId);
        return { success: true };
      }),
  }),

  // Timeline Notes
  timelineNotes: router({
    // Get all notes for a video
    getByVideoId: publicProcedure
      .input(z.object({ videoId: z.number() }))
      .query(async ({ input }) => {
        return await db.getTimelineNotesByVideoId(input.videoId);
      }),

    // Get note by ID
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getTimelineNoteById(input.id);
      }),

    // Create new note (staff/admin only)
    create: protectedProcedure
      .input(z.object({
        videoId: z.number(),
        timeSeconds: z.number(),
        content: z.string(),
        imageUrls: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role === 'viewer') {
          throw new Error('Viewers cannot create notes');
        }
        // Staff notes are PENDING by default, admin notes are APPROVED
        const status = ctx.user.role === 'admin' ? 'APPROVED' : 'PENDING';
        return await db.createTimelineNote({
          ...input,
          userId: ctx.user.id,
          status: status as 'PENDING' | 'APPROVED',
        });
      }),

    // Update note (owner or admin only)
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        content: z.string().optional(),
        imageUrls: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const note = await db.getTimelineNoteById(input.id);
        if (!note) {
          throw new Error('Note not found');
        }
        if (note.userId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new Error('Unauthorized');
        }
        return await db.updateTimelineNote(input.id, {
          content: input.content,
          imageUrls: input.imageUrls,
        });
      }),

    // Delete note (owner or admin only)
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const note = await db.getTimelineNoteById(input.id);
        if (!note) {
          throw new Error('Note not found');
        }
        if (note.userId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new Error('Unauthorized');
        }
        await db.deleteTimelineNote(input.id);
        return { success: true };
      }),

    // Get pending notes (admin only)
    getPending: protectedProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized');
        }
        return await db.getPendingTimelineNotes(input.limit);
      }),

    // Get my notes
    getMyNotes: protectedProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        return await db.getTimelineNotesByUserId(ctx.user.id, input.limit);
      }),

    // Approve note (admin only)
    approve: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized');
        }
        return await db.approveTimelineNote(input.id);
      }),

    // Reject note (admin only)
    reject: protectedProcedure
      .input(z.object({
        id: z.number(),
        reason: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized');
        }
        return await db.rejectTimelineNote(input.id, input.reason);
      }),

    // List pending notes with filters (admin/staff)
    listPendingNotes: protectedProcedure
      .input(z.object({
        status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'ALL']).optional(),
        userId: z.number().optional(),
        sortBy: z.enum(['createdAt_desc', 'createdAt_asc']).optional(),
        limit: z.number().optional(),
      }))
      .query(async ({ ctx, input }) => {
        // Staff can only see their own notes
        const userId = ctx.user.role === 'staff' ? ctx.user.id : input.userId;
        return await db.listTimelineNotes({
          status: input.status === 'ALL' ? undefined : input.status,
          userId,
          sortBy: input.sortBy || 'createdAt_desc',
          limit: input.limit,
        });
      }),

    // Batch approve notes (admin only)
    batchApprove: protectedProcedure
      .input(z.object({ ids: z.array(z.number()) }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized');
        }
        return await db.batchApproveTimelineNotes(input.ids);
      }),

    // Batch reject notes (admin only)
    batchReject: protectedProcedure
      .input(z.object({
        ids: z.array(z.number()),
        reason: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized');
        }
        return await db.batchRejectTimelineNotes(input.ids, input.reason);
      }),
  }),

  // AI assistance
  ai: router({
    // Generate thumbnail for video
    generateThumbnail: protectedProcedure
      .input(z.object({ title: z.string() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized');
        }
        const thumbnailUrl = await ai.generateThumbnail(input.title);
        return { thumbnailUrl };
      }),

    // Suggest category based on title and description
    suggestCategory: protectedProcedure
      .input(z.object({
        title: z.string(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized');
        }
        const category = await ai.suggestCategory(input.title, input.description);
        return { category };
      }),
  }),
  // Products knowledge hub
  products: productsRouter,
  // Dashboard statistics
  dashboard: dashboardRouter,
  // My contributions
  myContributions: myContributionsRouter,
  reviewCenter: reviewCenterRouter,
  adminSettings: adminSettingsRouter,
  fullTextSearch: fullTextSearchRouter,
  notifications: notificationsRouter,
  videoSuggestions: videoSuggestionsRouter,
  // AI Smart Search
  aiSearch: aiSearchRouter,
  performanceMonitor: performanceMonitorRouter,
  videoCategories: videoCategoriesRouter,
});

export type AppRouter = typeof appRouter;
