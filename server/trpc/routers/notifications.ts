import { z } from "zod";
import { router, protectedProcedure } from "../../_core/trpc";
import * as db from "../../db";

export const notificationsRouter = router({
  /**
   * Get user's notifications (paginated)
   */
  list: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
      isRead: z.boolean().optional(), // Filter by read status
    }))
    .query(async ({ ctx, input }) => {
      const notifications = await db.getNotifications(
        ctx.user.id,
        input.limit,
        input.offset,
        input.isRead
      );
      const total = await db.getNotificationsCount(ctx.user.id, input.isRead);
      
      return {
        notifications,
        total,
        hasMore: input.offset + input.limit < total,
      };
    }),

  /**
   * Get unread notification count
   */
  getUnreadCount: protectedProcedure
    .query(async ({ ctx }: { ctx: any }) => {
      const count = await db.getUnreadNotificationsCount(ctx.user.id);
      return { count };
    }),

  /**
   * Mark a notification as read
   */
  markAsRead: protectedProcedure
    .input(z.object({
      notificationId: z.number(),
    }))
    .mutation(async ({ ctx, input }: { ctx: any; input: any }) => {
      await db.markNotificationAsRead(input.notificationId, ctx.user.id);
      return { success: true };
    }),

  /**
   * Mark all notifications as read
   */
  markAllAsRead: protectedProcedure
    .mutation(async ({ ctx }: { ctx: any }) => {
      await db.markAllNotificationsAsRead(ctx.user.id);
      return { success: true };
    }),

  /**
   * Create a notification (internal use - admin only)
   */
  create: protectedProcedure
    .input(z.object({
      userId: z.number(),
      type: z.enum(["REVIEW_APPROVED", "REVIEW_REJECTED", "SYSTEM_ANNOUNCEMENT", "MENTION"]),
      title: z.string().max(200),
      content: z.string().optional(),
      relatedResourceType: z.enum(["VIDEO", "TIMELINE_NOTE", "PRODUCT"]).optional(),
      relatedResourceId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }: { ctx: any; input: any }) => {
      // Only admin can create notifications
      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized: Only admins can create notifications");
      }

      const notification = await db.createNotification({
        userId: input.userId,
        type: input.type,
        title: input.title,
        content: input.content,
        relatedResourceType: input.relatedResourceType,
        relatedResourceId: input.relatedResourceId,
      });

      return { notification };
    }),

  /**
   * Delete a notification
   */
  delete: protectedProcedure
    .input(z.object({
      notificationId: z.number(),
    }))
    .mutation(async ({ ctx, input }: { ctx: any; input: any }) => {
      await db.deleteNotification(input.notificationId, ctx.user.id);
      return { success: true };
    }),
});
