import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../../_core/trpc";
import * as db from "../../db";

/**
 * Video Suggestions Router
 * Handles CRUD operations for video suggestions/feedback
 */
export const videoSuggestionsRouter = router({
  /**
   * List suggestions by video ID
   * Public access - anyone can view suggestions
   */
  listByVideo: publicProcedure
    .input(
      z.object({
        videoId: z.number().int().positive(),
        limit: z.number().int().min(1).max(100).default(20),
        offset: z.number().int().min(0).default(0),
        priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
        status: z.enum(["PENDING", "READ", "RESOLVED"]).optional(),
      })
    )
    .query(async ({ input }) => {
      const suggestions = await db.getSuggestionsByVideo(
        input.videoId,
        input.limit,
        input.offset,
        input.priority,
        input.status
      );
      const total = await db.getSuggestionsCountByVideo(
        input.videoId,
        input.priority,
        input.status
      );
      return { suggestions, total };
    }),

  /**
   * Get suggestion count by video ID
   * Public access - anyone can view count
   */
  getCount: publicProcedure
    .input(
      z.object({
        videoId: z.number().int().positive(),
        priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
        status: z.enum(["PENDING", "READ", "RESOLVED"]).optional(),
      })
    )
    .query(async ({ input }) => {
      const total = await db.getSuggestionsCountByVideo(
        input.videoId,
        input.priority,
        input.status
      );
      return { total };
    }),

  /**
   * Create a new suggestion
   * Protected - requires authentication
   */
  create: protectedProcedure
    .input(
      z.object({
        videoId: z.number().int().positive(),
        title: z.string().min(1).max(255),
        content: z.string().min(1),
        priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const suggestion = await db.createSuggestion({
        videoId: input.videoId,
        userId: ctx.user.id,
        title: input.title,
        content: input.content,
        priority: input.priority,
      });
      return suggestion;
    }),

  /**
   * Update suggestion
   * Protected - only creator or admin can update
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        title: z.string().min(1).max(255).optional(),
        content: z.string().min(1).optional(),
        priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
        status: z.enum(["PENDING", "READ", "RESOLVED"]).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Check if user is creator or admin
      const suggestion = await db.getSuggestionById(input.id);
      if (!suggestion) {
        throw new Error("Suggestion not found");
      }
      if (suggestion.userId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new Error("Unauthorized: You can only update your own suggestions");
      }

      const updated = await db.updateSuggestion(input.id, {
        title: input.title,
        content: input.content,
        priority: input.priority,
        status: input.status,
      });
      return updated;
    }),

  /**
   * Delete suggestion
   * Protected - only creator or admin can delete
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      // Check if user is creator or admin
      const suggestion = await db.getSuggestionById(input.id);
      if (!suggestion) {
        throw new Error("Suggestion not found");
      }
      if (suggestion.userId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new Error("Unauthorized: You can only delete your own suggestions");
      }

      await db.deleteSuggestion(input.id);
      return { success: true };
    }),

  /**
   * Update suggestion status (Admin only)
   * Used to mark suggestions as READ or RESOLVED
   */
  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        status: z.enum(["PENDING", "READ", "RESOLVED"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized: Admin only");
      }

      const updated = await db.updateSuggestion(input.id, {
        status: input.status,
      });
      return updated;
    }),
});
