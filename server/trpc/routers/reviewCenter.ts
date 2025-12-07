import { z } from "zod";
import { router, protectedProcedure } from "../../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../../db";
import { timelineNotes, auditLogs, users } from "../../../drizzle/schema";
import { eq, desc, and, gte, sql } from "drizzle-orm";

export const reviewCenterRouter = router({
  // 取得審核歷史記錄
  getAuditHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "僅管理員可查看審核歷史" });
      }

      const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "資料庫連線失敗" });
      
      // 取得審核日誌（僅包含審核相關操作）
      const logs = await db
        .select({
          id: auditLogs.id,
          action: auditLogs.action,
          resourceType: auditLogs.resourceType,
          resourceId: auditLogs.resourceId,
          details: auditLogs.details,
          createdAt: auditLogs.createdAt,
          userId: auditLogs.userId,
          userName: users.name,
        })
        .from(auditLogs)
        .leftJoin(users, eq(auditLogs.userId, users.id))
        .where(
          sql`${auditLogs.action} IN ('approve_note', 'reject_note', 'batch_approve', 'batch_reject')`
        )
        .orderBy(desc(auditLogs.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      // 取得總數
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(auditLogs)
        .where(
          sql`${auditLogs.action} IN ('approve_note', 'reject_note', 'batch_approve', 'batch_reject')`
        );

      return {
        logs,
        total: Number(count),
      };
    }),

  // 取得審核統計
  getReviewStats: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "僅管理員可查看審核統計" });
    }

    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "資料庫連線失敗" });

    // 總筆記數
    const [{ total }] = await db
      .select({ total: sql<number>`count(*)` })
      .from(timelineNotes);

    // 各狀態筆記數
    const [{ pending }] = await db
      .select({ pending: sql<number>`count(*)` })
      .from(timelineNotes)
      .where(eq(timelineNotes.status, "PENDING"));

    const [{ approved }] = await db
      .select({ approved: sql<number>`count(*)` })
      .from(timelineNotes)
      .where(eq(timelineNotes.status, "APPROVED"));

    const [{ rejected }] = await db
      .select({ rejected: sql<number>`count(*)` })
      .from(timelineNotes)
      .where(eq(timelineNotes.status, "REJECTED"));

    // 通過率
    const approvalRate = Number(total) > 0 ? (Number(approved) / Number(total)) * 100 : 0;

    // 最近 7 天審核趨勢
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentApprovals = await db
      .select({
        date: sql<string>`DATE(${timelineNotes.updatedAt})`,
        count: sql<number>`count(*)`,
      })
      .from(timelineNotes)
      .where(
        and(
          eq(timelineNotes.status, "APPROVED"),
          gte(timelineNotes.updatedAt, sevenDaysAgo)
        )
      )
      .groupBy(sql`DATE(${timelineNotes.updatedAt})`)
      .orderBy(sql`DATE(${timelineNotes.updatedAt})`);

    const recentRejections = await db
      .select({
        date: sql<string>`DATE(${timelineNotes.updatedAt})`,
        count: sql<number>`count(*)`,
      })
      .from(timelineNotes)
      .where(
        and(
          eq(timelineNotes.status, "REJECTED"),
          gte(timelineNotes.updatedAt, sevenDaysAgo)
        )
      )
      .groupBy(sql`DATE(${timelineNotes.updatedAt})`)
      .orderBy(sql`DATE(${timelineNotes.updatedAt})`);

    // 拒絕原因分析（取得最常見的拒絕原因關鍵字）
    const rejectedNotes = await db
      .select({ rejectReason: timelineNotes.rejectReason })
      .from(timelineNotes)
      .where(eq(timelineNotes.status, "REJECTED"));

    // 簡單的關鍵字統計（實際應用中可以使用更複雜的 NLP 分析）
    const reasonKeywords: Record<string, number> = {};
    rejectedNotes.forEach((note) => {
      if (note.rejectReason) {
        // 簡單分詞（以空格分隔）
        const words = note.rejectReason.split(/\s+/);
        words.forEach((word) => {
          if (word.length > 2) {
            // 過濾太短的詞
            reasonKeywords[word] = (reasonKeywords[word] || 0) + 1;
          }
        });
      }
    });

    // 取得前 10 個最常見的拒絕原因關鍵字
    const topRejectReasons = Object.entries(reasonKeywords)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([keyword, count]) => ({ keyword, count }));

    return {
      total: Number(total),
      pending: Number(pending),
      approved: Number(approved),
      rejected: Number(rejected),
      approvalRate: Math.round(approvalRate * 10) / 10, // 保留一位小數
      recentTrend: {
        approvals: recentApprovals.map((r) => ({
          date: r.date,
          count: Number(r.count),
        })),
        rejections: recentRejections.map((r) => ({
          date: r.date,
          count: Number(r.count),
        })),
      },
      topRejectReasons,
    };
  }),
});
