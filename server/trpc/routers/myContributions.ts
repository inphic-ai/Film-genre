import { router, protectedProcedure } from "../../_core/trpc";
import { z } from "zod";
import { getDb } from "../../db";
import { videos, timelineNotes, users } from "../../../drizzle/schema";
import { desc, eq, and, count } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const myContributionsRouter = router({
  // 取得我提交的影片
  getMyVideos: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    // 取得當前使用者提交的影片
    const myVideos = await db
      .select()
      .from(videos)
      .where(eq(videos.uploadedBy, ctx.user.id))
      .orderBy(desc(videos.createdAt));
    
    return myVideos;
  }),

  // 取得我提交的時間軸筆記
  getMyNotes: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    // 取得當前使用者提交的筆記
    const myNotes = await db
      .select()
      .from(timelineNotes)
      .where(eq(timelineNotes.userId, ctx.user.id))
      .orderBy(desc(timelineNotes.createdAt));
    
    return myNotes;
  }),

  // 取得我的貢獻統計
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    // 總影片數
    const totalVideos = await db
      .select({ count: count() })
      .from(videos)
      .where(eq(videos.uploadedBy, ctx.user.id));
    
    // 總筆記數
    const totalNotes = await db
      .select({ count: count() })
      .from(timelineNotes)
      .where(eq(timelineNotes.userId, ctx.user.id));
    
    // 已通過的筆記數
    const approvedNotes = await db
      .select({ count: count() })
      .from(timelineNotes)
      .where(
        and(
          eq(timelineNotes.userId, ctx.user.id),
          eq(timelineNotes.status, "APPROVED")
        )
      );
    
    // 待審核的筆記數
    const pendingNotes = await db
      .select({ count: count() })
      .from(timelineNotes)
      .where(
        and(
          eq(timelineNotes.userId, ctx.user.id),
          eq(timelineNotes.status, "PENDING")
        )
      );
    
    // 被拒絕的筆記數
    const rejectedNotes = await db
      .select({ count: count() })
      .from(timelineNotes)
      .where(
        and(
          eq(timelineNotes.userId, ctx.user.id),
          eq(timelineNotes.status, "REJECTED")
        )
      );
    
    return {
      totalVideos: totalVideos[0]?.count || 0,
      totalNotes: totalNotes[0]?.count || 0,
      approvedNotes: approvedNotes[0]?.count || 0,
      pendingNotes: pendingNotes[0]?.count || 0,
      rejectedNotes: rejectedNotes[0]?.count || 0,
    };
  }),

  // Admin 專屬：列出所有使用者
  listUsers: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "僅管理員可存取" });
    }
    
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const allUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      })
      .from(users);
    
    return allUsers;
  }),

  // Admin 專屬：取得指定使用者的影片
  getUserVideos: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "僅管理員可存取" });
      }
      
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const userVideos = await db
        .select()
        .from(videos)
        .where(eq(videos.uploadedBy, input.userId))
        .orderBy(desc(videos.createdAt));
      
      return userVideos;
    }),

  // Admin 專屬：取得指定使用者的筆記
  getUserNotes: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "僅管理員可存取" });
      }
      
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const userNotes = await db
        .select()
        .from(timelineNotes)
        .where(eq(timelineNotes.userId, input.userId))
        .orderBy(desc(timelineNotes.createdAt));
      
      return userNotes;
    }),

  // Admin 專屬：取得指定使用者的統計
  getUserStats: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "僅管理員可存取" });
      }
      
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // 總影片數
      const totalVideos = await db
        .select({ count: count() })
        .from(videos)
        .where(eq(videos.uploadedBy, input.userId));
      
      // 總筆記數
      const totalNotes = await db
        .select({ count: count() })
        .from(timelineNotes)
        .where(eq(timelineNotes.userId, input.userId));
      
      // 已通過的筆記數
      const approvedNotes = await db
        .select({ count: count() })
        .from(timelineNotes)
        .where(
          and(
            eq(timelineNotes.userId, input.userId),
            eq(timelineNotes.status, "APPROVED")
          )
        );
      
      // 待審核的筆記數
      const pendingNotes = await db
        .select({ count: count() })
        .from(timelineNotes)
        .where(
          and(
            eq(timelineNotes.userId, input.userId),
            eq(timelineNotes.status, "PENDING")
          )
        );
      
      // 被拒絕的筆記數
      const rejectedNotes = await db
        .select({ count: count() })
        .from(timelineNotes)
        .where(
          and(
            eq(timelineNotes.userId, input.userId),
            eq(timelineNotes.status, "REJECTED")
          )
        );
      
      return {
        totalVideos: totalVideos[0]?.count || 0,
        totalNotes: totalNotes[0]?.count || 0,
        approvedNotes: approvedNotes[0]?.count || 0,
        pendingNotes: pendingNotes[0]?.count || 0,
        rejectedNotes: rejectedNotes[0]?.count || 0,
      };
    }),
});
