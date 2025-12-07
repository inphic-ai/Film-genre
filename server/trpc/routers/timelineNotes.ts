import { router, protectedProcedure } from "../../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../../db";
import { timelineNotes, noteStatusEnum } from "../../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

/**
 * Timeline Notes Router
 * Handles CRUD operations for video timeline notes with approval workflow
 */
export const timelineNotesRouter = router({
  /**
   * List timeline notes for a specific video
   * Filters by status if provided (admin can see all, users see only approved)
   */
  list: protectedProcedure
    .input(
      z.object({
        videoId: z.number(),
        status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      const { videoId, status } = input;
      const isAdmin = ctx.user.role === "admin";

      // Build query conditions
      const conditions = [eq(timelineNotes.videoId, videoId)];
      
      // Non-admin users can only see approved notes
      if (!isAdmin) {
        conditions.push(eq(timelineNotes.status, "APPROVED"));
      } else if (status) {
        conditions.push(eq(timelineNotes.status, status));
      }

      const notes = await db
        .select()
        .from(timelineNotes)
        .where(and(...conditions))
        .orderBy(timelineNotes.timeSeconds);

      return notes;
    }),

  /**
   * Create a new timeline note
   * Staff notes default to PENDING status
   */
  create: protectedProcedure
    .input(
      z.object({
        videoId: z.number(),
        timeSeconds: z.number().min(0),
        content: z.string().min(1).max(5000),
        imageUrls: z.array(z.string().url()).max(5).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      const { videoId, timeSeconds, content, imageUrls } = input;

      // Determine initial status based on user role
      const status = ctx.user.role === "admin" ? "APPROVED" : "PENDING";

      const [note] = await db
        .insert(timelineNotes)
        .values({
          videoId,
          userId: ctx.user.id,
          timeSeconds,
          content,
          imageUrls: imageUrls || [],
          status,
        })
        .returning();

      return note;
    }),

  /**
   * Update an existing timeline note
   * Users can only update their own notes
   * Admins can update any note
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        content: z.string().min(1).max(5000).optional(),
        imageUrls: z.array(z.string().url()).max(5).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      const { id, content, imageUrls } = input;

      // Check ownership
      const [existingNote] = await db
        .select()
        .from(timelineNotes)
        .where(eq(timelineNotes.id, id))
        .limit(1);

      if (!existingNote) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Timeline note not found",
        });
      }

      // Only owner or admin can update
      if (existingNote.userId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only update your own notes",
        });
      }

      // Build update object
      const updates: any = {
        updatedAt: new Date(),
      };
      if (content !== undefined) updates.content = content;
      if (imageUrls !== undefined) updates.imageUrls = imageUrls;

      const [updatedNote] = await db
        .update(timelineNotes)
        .set(updates)
        .where(eq(timelineNotes.id, id))
        .returning();

      return updatedNote;
    }),

  /**
   * Delete a timeline note
   * Users can only delete their own notes
   * Admins can delete any note
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      const { id } = input;

      // Check ownership
      const [existingNote] = await db
        .select()
        .from(timelineNotes)
        .where(eq(timelineNotes.id, id))
        .limit(1);

      if (!existingNote) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Timeline note not found",
        });
      }

      // Only owner or admin can delete
      if (existingNote.userId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only delete your own notes",
        });
      }

      await db.delete(timelineNotes).where(eq(timelineNotes.id, id));

      return { success: true };
    }),

  /**
   * Approve a timeline note (Admin only)
   */
  approve: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      // Only admin can approve
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can approve notes",
        });
      }

      const [updatedNote] = await db
        .update(timelineNotes)
        .set({
          status: "APPROVED",
          rejectReason: null,
          updatedAt: new Date(),
        })
        .where(eq(timelineNotes.id, input.id))
        .returning();

      if (!updatedNote) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Timeline note not found",
        });
      }

      return updatedNote;
    }),

  /**
   * Reject a timeline note (Admin only)
   */
  reject: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        reason: z.string().min(1).max(500),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      // Only admin can reject
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can reject notes",
        });
      }

      const [updatedNote] = await db
        .update(timelineNotes)
        .set({
          status: "REJECTED",
          rejectReason: input.reason,
          updatedAt: new Date(),
        })
        .where(eq(timelineNotes.id, input.id))
        .returning();

      if (!updatedNote) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Timeline note not found",
        });
      }

      return updatedNote;
    }),
});
