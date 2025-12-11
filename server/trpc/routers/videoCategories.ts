import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../../db";
import { videoCategories } from "../../../drizzle/schema";
import { eq, sql } from "drizzle-orm";

/**
 * videoCategories router
 * 
 * 分類管理 API，支援 CRUD 操作與排序功能
 */
export const videoCategoriesRouter = router({
  /**
   * list - 取得所有分類
   * 
   * 公開 API，支援排序與篩選
   */
  list: publicProcedure
    .input(
      z.object({
        includeDisabled: z.boolean().optional().default(false),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "資料庫連線失敗",
        });
      }

      const { includeDisabled } = input;

      // 查詢分類（依 sortOrder 排序）
      const categories = await db
        .select()
        .from(videoCategories)
        .where(includeDisabled ? undefined : eq(videoCategories.isActive, true))
        .orderBy(videoCategories.sortOrder);

      return categories;
    }),

  /**
   * create - 新增分類
   * 
   * Admin 專用，需提供 name, type, description, color, icon
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        type: z.string().min(1).max(50),
        description: z.string().optional(),
        color: z.string().optional(),
        icon: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "資料庫連線失敗",
        });
      }

      // 權限檢查：僅 Admin 可新增分類
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "僅管理員可新增分類",
        });
      }

      const { name, type, description, color, icon } = input;

      // 檢查 type 是否已存在
      const existing = await db
        .select()
        .from(videoCategories)
        .where(eq(videoCategories.type, type))
        .limit(1);

      if (existing.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `分類 type「${type}」已存在`,
        });
      }

      // 取得目前最大的 sortOrder
      const maxOrderResult = await db
        .select({ maxOrder: sql<number>`MAX(${videoCategories.sortOrder})` })
        .from(videoCategories);

      const maxOrder = maxOrderResult[0]?.maxOrder ?? 0;

      // 新增分類
      const [newCategory] = await db
        .insert(videoCategories)
        .values({
          name,
          type,
          description: description ?? null,
          color: color ?? null,
          icon: icon ?? null,
          sortOrder: maxOrder + 1,
          isActive: true,
        })
        .returning();

      return newCategory;
    }),

  /**
   * update - 更新分類
   * 
   * Admin 專用，可更新 name, description, color, icon, isActive
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
        color: z.string().optional(),
        icon: z.string().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "資料庫連線失敗",
        });
      }

      // 權限檢查：僅 Admin 可更新分類
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "僅管理員可更新分類",
        });
      }

      const { id, name, description, color, icon, isActive } = input;

      // 檢查分類是否存在
      const existing = await db
        .select()
        .from(videoCategories)
        .where(eq(videoCategories.id, id))
        .limit(1);

      if (existing.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `分類 ID ${id} 不存在`,
        });
      }

      // 更新分類
      const [updated] = await db
        .update(videoCategories)
        .set({
          ...(name !== undefined && { name }),
          ...(description !== undefined && { description }),
          ...(color !== undefined && { color }),
          ...(icon !== undefined && { icon }),
          ...(isActive !== undefined && { isActive }),
          updatedAt: new Date(),
        })
        .where(eq(videoCategories.id, id))
        .returning();

      return updated;
    }),

  /**
   * delete - 刪除分類
   * 
   * Admin 專用，軟刪除（設定 isActive = false）
   */
  delete: protectedProcedure
    .input(
      z.object({
        id: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "資料庫連線失敗",
        });
      }

      // 權限檢查：僅 Admin 可刪除分類
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "僅管理員可刪除分類",
        });
      }

      const { id } = input;

      // 檢查分類是否存在
      const existing = await db
        .select()
        .from(videoCategories)
        .where(eq(videoCategories.id, id))
        .limit(1);

      if (existing.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `分類 ID ${id} 不存在`,
        });
      }

      // 軟刪除（設定 isActive = false）
      const [deleted] = await db
        .update(videoCategories)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(videoCategories.id, id))
        .returning();

      return deleted;
    }),

  /**
   * reorder - 調整分類排序
   * 
   * Admin 專用，批次更新 sortOrder
   */
  reorder: protectedProcedure
    .input(
      z.object({
        orders: z.array(
          z.object({
            id: z.number(),
            sortOrder: z.number(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "資料庫連線失敗",
        });
      }

      // 權限檢查：僅 Admin 可調整排序
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "僅管理員可調整分類排序",
        });
      }

      const { orders } = input;

      // 批次更新 sortOrder
      const promises = orders.map(({ id, sortOrder }) =>
        db
          .update(videoCategories)
          .set({ sortOrder, updatedAt: new Date() })
          .where(eq(videoCategories.id, id))
      );

      await Promise.all(promises);

      return { success: true, count: orders.length };
    }),
});
