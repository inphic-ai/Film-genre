import { router, protectedProcedure, publicProcedure } from "../../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../../db";
import { products, productRelations, videos } from "../../../drizzle/schema";
import { eq, like, or, and, inArray, sql } from "drizzle-orm";

/**
 * 商品知識中樞 tRPC Router
 * 
 * 功能：
 * - SKU 搜尋與商品資訊查詢
 * - 商品家族（前 6 碼相同）查詢
 * - 商品關聯（Product_Relations）查詢
 * - 相關影片列表
 * - 商品 CRUD（Admin 專用）
 */

export const productsRouter = router({
  /**
   * 搜尋商品（支援 SKU、名稱、描述）
   */
  search: publicProcedure
    .input(
      z.object({
        query: z.string().min(1, "搜尋關鍵字不能為空"),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ input }) => {
      const { query, limit } = input;

      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "資料庫連線失敗",
        });
      }

      // Use case-insensitive search (ILIKE in PostgreSQL)
      const results = await db
        .select()
        .from(products)
        .where(
          or(
            sql`LOWER(${products.sku}) LIKE LOWER(${'%' + query + '%'})`,
            sql`LOWER(${products.name}) LIKE LOWER(${'%' + query + '%'})`,
            sql`LOWER(COALESCE(${products.description}, '')) LIKE LOWER(${'%' + query + '%'})`
          )
        )
        .limit(limit);

      return results;
    }),

  /**
   * 根據 SKU 取得商品詳細資訊
   */
  getBySku: publicProcedure
    .input(z.object({ sku: z.string().min(1) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "資料庫連線失敗",
        });
      }

      const product = await db
        .select()
        .from(products)
        .where(eq(products.sku, input.sku))
        .limit(1);

      if (product.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "找不到該商品",
        });
      }

      return product[0];
    }),

  /**
   * 取得商品家族（前 6 碼相同的商品）
   */
  getFamily: publicProcedure
    .input(z.object({ sku: z.string().min(6) }))
    .query(async ({ input }) => {
      // 取得前 6 碼作為 family_code
      const familyCode = input.sku.substring(0, 6);

      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "資料庫連線失敗",
        });
      }

      const familyProducts = await db
        .select()
        .from(products)
        .where(like(products.familyCode, `${familyCode}%`))
        .orderBy(products.sku);

      return familyProducts;
    }),

  /**
   * 取得商品關聯（同義 SKU、相關零件等）
   */
  getRelations: publicProcedure
    .input(z.object({ productId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "資料庫連線失敗",
        });
      }

      // 查詢所有關聯（雙向）
      const relationsA = await db
        .select({
          id: productRelations.id,
          relationType: productRelations.relationType,
          createdAt: productRelations.createdAt,
          relatedProduct: products,
        })
        .from(productRelations)
        .innerJoin(products, eq(productRelations.productBId, products.id))
        .where(eq(productRelations.productAId, input.productId));

      const relationsB = await db
        .select({
          id: productRelations.id,
          relationType: productRelations.relationType,
          createdAt: productRelations.createdAt,
          relatedProduct: products,
        })
        .from(productRelations)
        .innerJoin(products, eq(productRelations.productAId, products.id))
        .where(eq(productRelations.productBId, input.productId));

      return [...relationsA, ...relationsB];
    }),

  /**
   * 取得商品相關影片
   */
  getRelatedVideos: publicProcedure
    .input(
      z.object({
        sku: z.string().min(1),
        limit: z.number().min(1).max(50).default(20),
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

      const relatedVideos = await db
        .select()
        .from(videos)
        .where(like(videos.productId, `%${input.sku}%`))
        .limit(input.limit);

      return relatedVideos;
    }),

  /**
   * 新增商品（Admin 專用）
   */
  create: protectedProcedure
    .input(
      z.object({
        sku: z.string().min(1, "SKU 不能為空"),
        name: z.string().min(1, "商品名稱不能為空"),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // 檢查權限
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "僅管理員可新增商品",
        });
      }

      // 驗證 SKU 格式（英文3碼+數字6碼+a/b/c）
      const skuRegex = /^[A-Z]{3}\d{6}[ABC]$/i;
      if (!skuRegex.test(input.sku)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "SKU 格式錯誤（應為：英文3碼+數字6碼+A/B/C，例如 PM6123456A）",
        });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "資料庫連線失敗",
        });
      }

      // 檢查 SKU 是否已存在
      const existing = await db
        .select()
        .from(products)
        .where(eq(products.sku, input.sku.toUpperCase()))
        .limit(1);

      if (existing.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "該 SKU 已存在",
        });
      }

      // 提取 family_code（前 6 碼）與 variant（最後一碼）
      const upperSku = input.sku.toUpperCase();
      const familyCode = upperSku.substring(0, 6);
      const variant = upperSku.charAt(upperSku.length - 1);

      const newProduct = await db
        .insert(products)
        .values({
          sku: upperSku,
          name: input.name,
          familyCode,
          variant,
          description: input.description || null,
        })
        .returning();

      return newProduct[0];
    }),

  /**
   * 更新商品（Admin 專用）
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // 檢查權限
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "僅管理員可更新商品",
        });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "資料庫連線失敗",
        });
      }

      const updated = await db
        .update(products)
        .set({
          name: input.name,
          description: input.description,
          updatedAt: new Date(),
        })
        .where(eq(products.id, input.id))
        .returning();

      if (updated.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "找不到該商品",
        });
      }

      return updated[0];
    }),

  /**
   * 建立商品關聯（Admin 專用）
   */
  createRelation: protectedProcedure
    .input(
      z.object({
        productAId: z.number(),
        productBId: z.number(),
        relationType: z.enum(["SYNONYM", "FAMILY", "PART"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // 檢查權限
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "僅管理員可建立商品關聯",
        });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "資料庫連線失敗",
        });
      }

      // 檢查是否已存在關聯
      const existing = await db
        .select()
        .from(productRelations)
        .where(
          or(
            and(
              eq(productRelations.productAId, input.productAId),
              eq(productRelations.productBId, input.productBId)
            ),
            and(
              eq(productRelations.productAId, input.productBId),
              eq(productRelations.productBId, input.productAId)
            )
          )
        )
        .limit(1);

      if (existing.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "該商品關聯已存在",
        });
      }

      const newRelation = await db
        .insert(productRelations)
        .values({
          productAId: input.productAId,
          productBId: input.productBId,
          relationType: input.relationType,
        })
        .returning();

      return newRelation[0];
    }),

  /**
   * 刪除商品關聯（Admin 專用）
   */
  deleteRelation: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      // 檢查權限
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "僅管理員可刪除商品關聯",
        });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "資料庫連線失敗",
        });
      }

      const deleted = await db
        .delete(productRelations)
        .where(eq(productRelations.id, input.id))
        .returning();

      if (deleted.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "找不到該商品關聯",
        });
      }

      return { success: true };
    }),
});
