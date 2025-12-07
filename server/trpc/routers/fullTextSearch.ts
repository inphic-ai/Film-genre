import { z } from "zod";
import { router, publicProcedure } from "../../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../../db";
import { videos } from "../../../drizzle/schema";
import { sql } from "drizzle-orm";

export const fullTextSearchRouter = router({
  // PostgreSQL tsvector 全文搜尋（支援中文）
  search: publicProcedure
    .input(
      z.object({
        query: z.string().min(1).max(200),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "資料庫連線失敗" });

      // 使用 PostgreSQL tsvector 全文搜尋
      // 注意：searchVector 欄位需要透過觸發器或應用層更新
      // 這裡使用 to_tsvector 即時生成（效能較差，建議後續優化）
      const searchResults = await db
        .select({
          id: videos.id,
          title: videos.title,
          description: videos.description,
          platform: videos.platform,
          videoUrl: videos.videoUrl,
          thumbnailUrl: videos.thumbnailUrl,
          customThumbnailUrl: videos.customThumbnailUrl,
          category: videos.category,
          productId: videos.productId,
          shareStatus: videos.shareStatus,
          viewCount: videos.viewCount,
          notes: videos.notes,
          duration: videos.duration,
          searchVector: videos.searchVector,
          createdAt: videos.createdAt,
          updatedAt: videos.updatedAt,
          uploadedBy: videos.uploadedBy,
          // 計算相關性分數（ts_rank）
          rank: sql<number>`ts_rank(
            to_tsvector('simple', COALESCE(${videos.title}, '') || ' ' || COALESCE(${videos.description}, '') || ' ' || COALESCE(${videos.productId}, '')),
            plainto_tsquery('simple', ${input.query})
          )`,
        })
        .from(videos)
        .where(
          sql`to_tsvector('simple', COALESCE(${videos.title}, '') || ' ' || COALESCE(${videos.description}, '') || ' ' || COALESCE(${videos.productId}, '')) @@ plainto_tsquery('simple', ${input.query})`
        )
        .orderBy(sql`ts_rank(
          to_tsvector('simple', COALESCE(${videos.title}, '') || ' ' || COALESCE(${videos.description}, '') || ' ' || COALESCE(${videos.productId}, '')),
          plainto_tsquery('simple', ${input.query})
        ) DESC`)
        .limit(input.limit)
        .offset(input.offset);

      // 取得總數
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(videos)
        .where(
          sql`to_tsvector('simple', COALESCE(${videos.title}, '') || ' ' || COALESCE(${videos.description}, '') || ' ' || COALESCE(${videos.productId}, '')) @@ plainto_tsquery('simple', ${input.query})`
        );

      return {
        results: searchResults,
        total: Number(count),
      };
    }),

  // 搜尋建議（自動完成）
  suggest: publicProcedure
    .input(
      z.object({
        query: z.string().min(1).max(100),
        limit: z.number().min(1).max(10).default(5),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "資料庫連線失敗" });

      // 使用 LIKE 查詢提供搜尋建議（簡單實作）
      const suggestions = await db
        .select({
          id: videos.id,
          title: videos.title,
          productId: videos.productId,
        })
        .from(videos)
        .where(
          sql`${videos.title} ILIKE ${'%' + input.query + '%'} OR ${videos.productId} ILIKE ${'%' + input.query + '%'}`
        )
        .limit(input.limit);

      return suggestions;
    }),
});
