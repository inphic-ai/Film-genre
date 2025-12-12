import { publicProcedure, protectedProcedure, router } from "../../_core/trpc";
import { z } from "zod";
import * as db from "../../db";

/**
 * Search Settings Router
 * Manages global search configuration (trigger mode, debounce delay, search engine)
 */
export const searchSettingsRouter = router({
  /**
   * Get search settings (public - needed for Board.tsx)
   */
  get: publicProcedure.query(async () => {
    return await db.getSearchSettings();
  }),

  /**
   * Update search settings (admin only)
   */
  update: protectedProcedure
    .input(
      z.object({
        triggerMode: z.enum(["realtime", "debounce", "manual"]).optional(),
        debounceDelay: z.number().min(0).optional(),
        searchEngine: z.enum(["fulltext", "tags", "ai", "hybrid"]).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Only admin can update search settings
      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized: Only admin can update search settings");
      }

      return await db.updateSearchSettings(input);
    }),
});
