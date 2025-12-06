import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import * as ai from "./ai";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
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

    // Get video by ID
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized');
        }
        return await db.getVideoById(input.id);
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
