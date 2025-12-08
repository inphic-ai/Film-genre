import { router, protectedProcedure, publicProcedure } from "../../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../../db";
import { products, productRelations, videos, videoTags } from "../../../drizzle/schema";
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
   * 列出所有商品（支援分頁與排序）
   */
  list: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
        sortBy: z.enum(["createdAt", "sku", "name"]).default("createdAt"),
        sortOrder: z.enum(["asc", "desc"]).default("desc"),
      })
    )
    .query(async ({ input }) => {
      const { limit, offset, sortBy, sortOrder } = input;

      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "資料庫連線失敗",
        });
      }

      // 建立查詢
      let query = db.select().from(products);

      // 排序與分頁
      let results;
      if (sortBy === "createdAt") {
        results = sortOrder === "asc" 
          ? await query.orderBy(products.createdAt).limit(limit).offset(offset)
          : await query.orderBy(sql`${products.createdAt} DESC`).limit(limit).offset(offset);
      } else if (sortBy === "sku") {
        results = sortOrder === "asc" 
          ? await query.orderBy(products.sku).limit(limit).offset(offset)
          : await query.orderBy(sql`${products.sku} DESC`).limit(limit).offset(offset);
      } else if (sortBy === "name") {
        results = sortOrder === "asc" 
          ? await query.orderBy(products.name).limit(limit).offset(offset)
          : await query.orderBy(sql`${products.name} DESC`).limit(limit).offset(offset);
      } else {
        results = await query.limit(limit).offset(offset);
      }

      // 總數
      const totalResult = await db.select({ count: sql<number>`count(*)` }).from(products);
      const total = Number(totalResult[0]?.count || 0);

      return {
        products: results,
        total,
        hasMore: offset + results.length < total,
      };
    }),

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

  /**
   * 根據標籤篩選商品（查詢有這些標籤的影片 → 取得商品編號 → 顯示商品）
   */
  listByTags: publicProcedure
    .input(
      z.object({
        tagIds: z.array(z.number()).min(1, "至少選擇一個標籤"),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      const { tagIds, limit, offset } = input;

      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "資料庫連線失敗",
        });
      }

      // Step 1: 找出有這些標籤的影片 ID
      const videoIdsResult = await db
        .selectDistinct({ videoId: videoTags.videoId })
        .from(videoTags)
        .where(inArray(videoTags.tagId, tagIds));

      const videoIds = videoIdsResult.map(v => v.videoId);

      if (videoIds.length === 0) {
        return {
          products: [],
          total: 0,
          hasMore: false,
        };
      }

      // Step 2: 從這些影片中取得商品編號（productId）
      const videosResult = await db
        .selectDistinct({ productId: videos.productId })
        .from(videos)
        .where(
          and(
            inArray(videos.id, videoIds),
            sql`${videos.productId} IS NOT NULL AND ${videos.productId} != ''`
          )
        );

      const productIds = videosResult
        .map(v => v.productId)
        .filter((id): id is string => id !== null && id !== '');

      if (productIds.length === 0) {
        return {
          products: [],
          total: 0,
          hasMore: false,
        };
      }

      // Step 3: 查詢這些商品的詳細資訊
      const productsResult = await db
        .select()
        .from(products)
        .where(inArray(products.sku, productIds))
        .limit(limit)
        .offset(offset);

      // Step 4: 計算總數
      const totalResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(products)
        .where(inArray(products.sku, productIds));

      const total = Number(totalResult[0]?.count || 0);

      return {
        products: productsResult,
        total,
        hasMore: offset + productsResult.length < total,
      };
    }),

  /**
   * 上傳商品縮圖到 S3（Admin 專用）
   */
  uploadThumbnail: protectedProcedure
    .input(
      z.object({
        sku: z.string().min(1, "商品編號不可為空"),
        imageData: z.string().min(1, "圖片資料不可為空"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // 檢查權限
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "僅管理員可上傳商品縮圖",
        });
      }

      const { sku, imageData } = input;

      // 解析 base64 圖片
      const matches = imageData.match(/^data:image\/(\w+);base64,(.+)$/);
      if (!matches) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "無效的圖片格式",
        });
      }

      const imageType = matches[1];
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, "base64");

      // 上傳到 S3
      const { storagePut } = await import("../../storage");
      const fileKey = `products/${sku}-${Date.now()}.${imageType}`;
      const { url } = await storagePut(fileKey, buffer, `image/${imageType}`);

      // 更新資料庫
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "資料庫連線失敗",
        });
      }

      await db
        .update(products)
        .set({ thumbnailUrl: url })
        .where(eq(products.sku, sku));

      return { url };
    }),

  /**
   * 批次匯入商品資料（CSV/Excel）（Admin 專用）
   */
  importBatch: protectedProcedure
    .input(
      z.object({
        products: z.array(
          z.object({
            sku: z.string().min(1, "商品編號不可為空"),
            name: z.string().min(1, "商品名稱不可為空"),
            description: z.string().optional(),
            thumbnailUrl: z.string().optional(),
          })
        ).min(1, "至少匯入一個商品"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // 檢查權限
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "僅管理員可批次匯入商品",
        });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "資料庫連線失敗",
        });
      }

      const results = {
        success: 0,
        skipped: 0,
        failed: 0,
        errors: [] as string[],
      };

      for (const product of input.products) {
        try {
          // 檢查是否已存在
          const existing = await db
            .select()
            .from(products)
            .where(eq(products.sku, product.sku))
            .limit(1);

          if (existing.length > 0) {
            results.skipped++;
            continue;
          }

          // 新增商品
          await db.insert(products).values({
            sku: product.sku,
            name: product.name,
            description: product.description || null,
            thumbnailUrl: product.thumbnailUrl || null,
          });

          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push(`${product.sku}: ${error instanceof Error ? error.message : '未知錯誤'}`);
        }
      }

      return results;
    }),
});
