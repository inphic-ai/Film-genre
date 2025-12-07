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
      .input(z.object({ category: z.string() }))
      .query(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized');
        }
        return await db.getVideosByCategory(input.category);
      }),

    // Get YouTube videos by category (client portal - public)
    listYouTubeByCategory: publicProcedure
      .input(z.object({ category: z.string() }))
      .query(async ({ input }) => {
        return await db.getYouTubeVideosByCategory(input.category);
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

    // Create video (admin only)
    create: protectedProcedure
      .input(z.object({
        title: z.string(),
        description: z.string().optional(),
        platform: z.enum(['youtube', 'tiktok', 'redbook']),
        videoUrl: z.string().url(),
        thumbnailUrl: z.string().url().optional(),
        category: z.enum(['product_intro', 'maintenance', 'case_study', 'faq', 'other']),
        productId: z.string().optional(),
        shareStatus: z.enum(['private', 'public']).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized');
        }
        return await db.createVideo({
          ...input,
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
        productId: z.string().optional(),
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
});

export type AppRouter = typeof appRouter;
