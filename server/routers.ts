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
        description: z.string().optional(),
        color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized');
        }
        return await db.createTag(input);
      }),

    // Update tag (admin only)
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).max(100).optional(),
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
});

export type AppRouter = typeof appRouter;
