import { z } from "zod";
import { router, protectedProcedure } from "../../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../../db";
import { users, auditLogs } from "../../../drizzle/schema";
import { eq, desc, sql, and, gte } from "drizzle-orm";

export const adminSettingsRouter = router({
  // ========== 使用者管理 ==========
  
  // 取得所有使用者
  listUsers: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "僅管理員可查看使用者列表" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "資料庫連線失敗" });

      const userList = await db
        .select({
          id: users.id,
          openId: users.openId,
          name: users.name,
          email: users.email,
          role: users.role,
          loginMethod: users.loginMethod,
          createdAt: users.createdAt,
          lastSignedIn: users.lastSignedIn,
        })
        .from(users)
        .orderBy(desc(users.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(users);

      return {
        users: userList,
        total: Number(count),
      };
    }),

  // 更新使用者角色
  updateUserRole: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
        role: z.enum(["admin", "staff", "viewer"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "僅管理員可修改使用者角色" });
      }

      // 防止管理員修改自己的角色
      if (ctx.user.id === input.userId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "無法修改自己的角色" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "資料庫連線失敗" });

      await db
        .update(users)
        .set({ role: input.role, updatedAt: new Date() })
        .where(eq(users.id, input.userId));

      // 記錄操作日誌
      await db.insert(auditLogs).values({
        userId: ctx.user.id,
        action: "UPDATE_USER_ROLE",
        resourceType: "USER",
        resourceId: input.userId,
        details: `Changed role to ${input.role}`,
      });

      return { success: true };
    }),

  // 更新使用者資訊
  updateUser: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
        name: z.string().optional(),
        email: z.string().email().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "僅管理員可修改使用者資訊" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "資料庫連線失敗" });

      const updateData: any = { updatedAt: new Date() };
      if (input.name !== undefined) updateData.name = input.name;
      if (input.email !== undefined) updateData.email = input.email;

      await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, input.userId));

      // 記錄操作日誌
      await db.insert(auditLogs).values({
        userId: ctx.user.id,
        action: "UPDATE_USER",
        resourceType: "USER",
        resourceId: input.userId,
        details: JSON.stringify(updateData),
      });

      return { success: true };
    }),

  // 刪除使用者（軟刪除 - 實際上是將角色改為 viewer 並清空敏感資訊）
  deleteUser: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "僅管理員可刪除使用者" });
      }

      // 防止管理員刪除自己
      if (ctx.user.id === input.userId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "無法刪除自己的帳號" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "資料庫連線失敗" });

      // 軟刪除：將角色改為 viewer 並清空敏感資訊
      await db
        .update(users)
        .set({
          role: "viewer",
          name: "[已刪除]",
          email: null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, input.userId));

      // 記錄操作日誌
      await db.insert(auditLogs).values({
        userId: ctx.user.id,
        action: "DELETE_USER",
        resourceType: "USER",
        resourceId: input.userId,
        details: "User soft deleted",
      });

      return { success: true };
    }),

  // ========== 操作日誌查詢 ==========

  // 取得操作日誌
  getAuditLogs: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
        action: z.string().optional(),
        resourceType: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "僅管理員可查看操作日誌" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "資料庫連線失敗" });

      // 建立查詢條件
      const conditions: any[] = [];
      if (input.action) {
        conditions.push(eq(auditLogs.action, input.action));
      }
      if (input.resourceType) {
        conditions.push(eq(auditLogs.resourceType, input.resourceType));
      }
      if (input.startDate) {
        conditions.push(gte(auditLogs.createdAt, input.startDate));
      }
      if (input.endDate) {
        const endOfDay = new Date(input.endDate);
        endOfDay.setHours(23, 59, 59, 999);
        conditions.push(sql`${auditLogs.createdAt} <= ${endOfDay}`);
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const logs = await db
        .select({
          id: auditLogs.id,
          userId: auditLogs.userId,
          userName: users.name,
          action: auditLogs.action,
          resourceType: auditLogs.resourceType,
          resourceId: auditLogs.resourceId,
          details: auditLogs.details,
          ipAddress: auditLogs.ipAddress,
          createdAt: auditLogs.createdAt,
        })
        .from(auditLogs)
        .leftJoin(users, eq(auditLogs.userId, users.id))
        .where(whereClause)
        .orderBy(desc(auditLogs.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(auditLogs)
        .where(whereClause);

      return {
        logs,
        total: Number(count),
      };
    }),

  // 取得操作日誌統計
  getAuditStats: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "僅管理員可查看操作日誌統計" });
    }

    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "資料庫連線失敗" });

    // 總操作數
    const [{ total }] = await db
      .select({ total: sql<number>`count(*)` })
      .from(auditLogs);

    // 最近 7 天操作趨勢
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentLogs = await db
      .select({
        date: sql<string>`DATE(${auditLogs.createdAt})`,
        count: sql<number>`count(*)`,
      })
      .from(auditLogs)
      .where(gte(auditLogs.createdAt, sevenDaysAgo))
      .groupBy(sql`DATE(${auditLogs.createdAt})`)
      .orderBy(sql`DATE(${auditLogs.createdAt})`);

    // 操作類型分佈（前 10 名）
    const actionDistribution = await db
      .select({
        action: auditLogs.action,
        count: sql<number>`count(*)`,
      })
      .from(auditLogs)
      .groupBy(auditLogs.action)
      .orderBy(desc(sql`count(*)`))
      .limit(10);

    return {
      total: Number(total),
      recentTrend: recentLogs.map((r) => ({
        date: r.date,
        count: Number(r.count),
      })),
      actionDistribution: actionDistribution.map((a) => ({
        action: a.action,
        count: Number(a.count),
      })),
    };
  }),
});
