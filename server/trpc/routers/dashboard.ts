import { router, protectedProcedure } from "../../_core/trpc";
import { z } from "zod";
import { getDb } from "../../db";
import { videos, products, productRelations, timelineNotes, auditLogs } from "../../../drizzle/schema";
import { sql, desc, and, gte, count, eq } from "drizzle-orm";
import { withCache } from "../../_core/redis";

export const dashboardRouter = router({
  // 影片統計（分類分佈）
  getVideoStats: protectedProcedure.query(async () => {
    return withCache('dashboard:video_stats:v1', 300, async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
    
    // 使用 Promise.all 並行執行所有查詢
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const [
      totalVideos,
      categoryDistribution,
      platformDistribution,
      shareStatusDistribution,
      recentVideos,
    ] = await Promise.all([
      db.select({ count: count() }).from(videos),
      db.select({
        category: videos.category,
        count: count(),
      })
      .from(videos)
      .groupBy(videos.category),
      db.select({
        platform: videos.platform,
        count: count(),
      })
      .from(videos)
      .groupBy(videos.platform),
      db.select({
        shareStatus: videos.shareStatus,
        count: count(),
      })
      .from(videos)
      .groupBy(videos.shareStatus),
      db.select({
        date: sql<string>`DATE(${videos.createdAt})`.as("date"),
        count: count(),
      })
      .from(videos)
      .where(gte(videos.createdAt, thirtyDaysAgo))
      .groupBy(sql`DATE(${videos.createdAt})`)
      .orderBy(sql`DATE(${videos.createdAt})`),
    ]);
    
      return {
        totalVideos: totalVideos[0]?.count || 0,
        categoryDistribution,
        platformDistribution,
        shareStatusDistribution,
        recentTrend: recentVideos,
      };
    });
  }),

  // 商品分析統計
  getProductStats: protectedProcedure.query(async () => {
    return withCache('dashboard:product_stats:v1', 300, async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
    
    // 使用 Promise.all 並行執行所有查詢
    const [
      totalProducts,
      totalRelations,
      relationTypeDistribution,
      topRelatedProducts,
    ] = await Promise.all([
      db.select({ count: count() }).from(products),
      db.select({ count: count() }).from(productRelations),
      db.select({
        relationType: productRelations.relationType,
        count: count(),
      })
      .from(productRelations)
      .groupBy(productRelations.relationType),
      db.select({
        sku: products.sku,
        name: products.name,
        relationCount: count(productRelations.id),
      })
      .from(products)
      .leftJoin(productRelations, eq(products.id, productRelations.productAId))
      .groupBy(products.id, products.sku, products.name)
      .orderBy(desc(count(productRelations.id)))
      .limit(10),
    ]);
    
      return {
        totalProducts: totalProducts[0]?.count || 0,
        totalRelations: totalRelations[0]?.count || 0,
        relationTypeDistribution,
        topRelatedProducts,
      };
    });
  }),

  // 使用者活動追蹤
  getUserActivity: protectedProcedure.query(async () => {
    return withCache('dashboard:user_activity:v1', 300, async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
    
    // 使用 Promise.all 並行執行所有查詢
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const [
      noteStats,
      recentAudits,
      activityTrend,
    ] = await Promise.all([
      db.select({
        status: timelineNotes.status,
        count: count(),
      })
      .from(timelineNotes)
      .groupBy(timelineNotes.status),
      db.select()
      .from(auditLogs)
      .where(gte(auditLogs.createdAt, sevenDaysAgo))
      .orderBy(desc(auditLogs.createdAt))
      .limit(10),
      db.select({
        date: sql<string>`DATE(${auditLogs.createdAt})`.as("date"),
        count: count(),
      })
      .from(auditLogs)
      .where(gte(auditLogs.createdAt, thirtyDaysAgo))
      .groupBy(sql`DATE(${auditLogs.createdAt})`)
      .orderBy(sql`DATE(${auditLogs.createdAt})`),
    ]);
    
      return {
        noteStats,
        recentAudits,
        activityTrend,
      };
    });
  }),

  // 創作者統計
  getCreatorStats: protectedProcedure.query(async () => {
    return withCache('dashboard:creator_stats:v1', 300, async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
    
    // 總創作者數（去重）
    const creatorsWithCount = await db
      .select({
        creator: videos.creator,
        videoCount: count(),
      })
      .from(videos)
      .where(sql`${videos.creator} IS NOT NULL AND ${videos.creator} != ''`)
      .groupBy(videos.creator)
      .orderBy(desc(count()));
    
    const totalCreators = creatorsWithCount.length;
    const totalVideosWithCreator = creatorsWithCount.reduce((sum, c) => sum + Number(c.videoCount), 0);
    
    // 創作者影片數量分佈
    const distribution = {
      single: creatorsWithCount.filter(c => Number(c.videoCount) === 1).length,
      few: creatorsWithCount.filter(c => Number(c.videoCount) >= 2 && Number(c.videoCount) <= 5).length,
      many: creatorsWithCount.filter(c => Number(c.videoCount) > 5).length,
    };
    
    // Top 10 創作者
    const topCreators = creatorsWithCount.slice(0, 10);
    
      return {
        totalCreators,
        totalVideosWithCreator,
        distribution,
        topCreators,
      };
    });
  }),

  // 創作者列表（支援搜尋與分頁）
  getCreatorList: protectedProcedure
    .input(z.object({
      search: z.string().optional(),
      limit: z.number().default(20),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      let query = db
        .select({
          creator: videos.creator,
          videoCount: count(),
        })
        .from(videos)
        .where(sql`${videos.creator} IS NOT NULL AND ${videos.creator} != ''`)
        .groupBy(videos.creator)
        .$dynamic();
      
      // 搜尋過濾
      if (input.search) {
        query = query.where(sql`${videos.creator} ILIKE ${'%' + input.search + '%'}`);
      }
      
      // 獲取總數
      const totalQuery = db
        .select({ count: count() })
        .from(videos)
        .where(sql`${videos.creator} IS NOT NULL AND ${videos.creator} != ''`)
        .groupBy(videos.creator);
      
      const totalResult = await totalQuery;
      const total = totalResult.length;
      
      const creators = await query
        .orderBy(desc(count()))
        .limit(input.limit)
        .offset(input.offset);
      
      return {
        creators,
        total,
      };
    }),

  // 創作者詳情（影片列表、統計數據）
  getCreatorDetail: protectedProcedure
    .input(
      z.object({
        creatorName: z.string().min(1, "創作者名稱不可為空"),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // 查詢該創作者的所有影片
      const creatorVideos = await db
        .select()
        .from(videos)
        .where(eq(videos.creator, input.creatorName))
        .orderBy(desc(videos.createdAt));

      if (creatorVideos.length === 0) {
        return {
          creator: input.creatorName,
          videos: [],
          stats: {
            totalVideos: 0,
            totalViewCount: 0,
            averageRating: 0,
            categoryDistribution: [],
            platformDistribution: [],
            monthlyTrend: [],
          },
        };
      }

      // 統計數據
      const totalViewCount = creatorVideos.reduce((sum, v) => sum + (v.viewCount || 0), 0);
      const ratingsCount = creatorVideos.filter(v => v.rating !== null).length;
      const averageRating = ratingsCount > 0
        ? creatorVideos.reduce((sum, v) => sum + (v.rating || 0), 0) / ratingsCount
        : 0;

      // 分類分佈
      const categoryMap = new Map<string, number>();
      creatorVideos.forEach(v => {
        categoryMap.set(v.category, (categoryMap.get(v.category) || 0) + 1);
      });
      const categoryDistribution = Array.from(categoryMap.entries()).map(([category, count]) => ({
        category,
        count,
      }));

      // 平台分佈
      const platformMap = new Map<string, number>();
      creatorVideos.forEach(v => {
        platformMap.set(v.platform, (platformMap.get(v.platform) || 0) + 1);
      });
      const platformDistribution = Array.from(platformMap.entries()).map(([platform, count]) => ({
        platform,
        count,
      }));

      // 每月趨勢（最近 6 個月）
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const recentVideos = creatorVideos.filter(v => new Date(v.createdAt) >= sixMonthsAgo);
      const monthMap = new Map<string, number>();
      recentVideos.forEach(v => {
        const month = new Date(v.createdAt).toISOString().slice(0, 7); // YYYY-MM
        monthMap.set(month, (monthMap.get(month) || 0) + 1);
      });
      const monthlyTrend = Array.from(monthMap.entries())
        .map(([month, count]) => ({ month, count }))
        .sort((a, b) => a.month.localeCompare(b.month));

      return {
        creator: input.creatorName,
        videos: creatorVideos,
        stats: {
          totalVideos: creatorVideos.length,
          totalViewCount,
          averageRating: Math.round(averageRating * 10) / 10,
          categoryDistribution,
          platformDistribution,
          monthlyTrend,
        },
      };
    }),

  // 最近影片（限制數量）
  getRecentVideos: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(50).default(6),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const recentVideos = await db
        .select()
        .from(videos)
        .orderBy(desc(videos.createdAt))
        .limit(input.limit);
      
      return recentVideos;
    }),

  // 綜合統計（快速總覽）
  getOverview: protectedProcedure.query(async () => {
    return withCache('dashboard:overview:v1', 300, async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
    
    const [
      totalVideos,
      totalProducts,
      totalNotes,
      pendingNotes,
    ] = await Promise.all([
      db.select({ count: count() }).from(videos),
      db.select({ count: count() }).from(products),
      db.select({ count: count() }).from(timelineNotes),
      db.select({ count: count() }).from(timelineNotes).where(eq(timelineNotes.status, "PENDING")),
    ]);
    
      return {
        totalVideos: totalVideos[0]?.count || 0,
        totalProducts: totalProducts[0]?.count || 0,
        totalNotes: totalNotes[0]?.count || 0,
        pendingNotes: pendingNotes[0]?.count || 0,
      };
    });
  }),
});
