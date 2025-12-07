import { router, protectedProcedure } from "../../_core/trpc";
import { z } from "zod";
import { getDb } from "../../db";
import { videos, products, productRelations, timelineNotes, auditLogs } from "../../../drizzle/schema";
import { sql, desc, and, gte, count, eq } from "drizzle-orm";

export const dashboardRouter = router({
  // 影片統計（分類分佈）
  getVideoStats: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    // 總影片數
    const totalVideos = await db.select({ count: count() }).from(videos);
    
    // 分類分佈
    const categoryDistribution = await db
      .select({
        category: videos.category,
        count: count(),
      })
      .from(videos)
      .groupBy(videos.category);
    
    // 平台分佈
    const platformDistribution = await db
      .select({
        platform: videos.platform,
        count: count(),
      })
      .from(videos)
      .groupBy(videos.platform);
    
    // 分享狀態分佈
    const shareStatusDistribution = await db
      .select({
        shareStatus: videos.shareStatus,
        count: count(),
      })
      .from(videos)
      .groupBy(videos.shareStatus);
    
    // 最近 30 天的影片趨勢
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentVideos = await db
      .select({
        date: sql<string>`DATE(${videos.createdAt})`.as("date"),
        count: count(),
      })
      .from(videos)
      .where(gte(videos.createdAt, thirtyDaysAgo))
      .groupBy(sql`DATE(${videos.createdAt})`)
      .orderBy(sql`DATE(${videos.createdAt})`);
    
    return {
      totalVideos: totalVideos[0]?.count || 0,
      categoryDistribution,
      platformDistribution,
      shareStatusDistribution,
      recentTrend: recentVideos,
    };
  }),

  // 商品分析統計
  getProductStats: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    // 總商品數
    const totalProducts = await db.select({ count: count() }).from(products);
    
    // 商品關聯統計
    const totalRelations = await db.select({ count: count() }).from(productRelations);
    
    // 關聯類型分佈
    const relationTypeDistribution = await db
      .select({
        relationType: productRelations.relationType,
        count: count(),
      })
      .from(productRelations)
      .groupBy(productRelations.relationType);
    
    // 最常關聯的商品（前 10）
    const topRelatedProducts = await db
      .select({
        sku: products.sku,
        name: products.name,
        relationCount: count(productRelations.id),
      })
      .from(products)
      .leftJoin(productRelations, eq(products.id, productRelations.productAId))
      .groupBy(products.id, products.sku, products.name)
      .orderBy(desc(count(productRelations.id)))
      .limit(10);
    
    return {
      totalProducts: totalProducts[0]?.count || 0,
      totalRelations: totalRelations[0]?.count || 0,
      relationTypeDistribution,
      topRelatedProducts,
    };
  }),

  // 使用者活動追蹤
  getUserActivity: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    // 最近 7 天的審核活動
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    // 時間軸筆記審核統計
    const noteStats = await db
      .select({
        status: timelineNotes.status,
        count: count(),
      })
      .from(timelineNotes)
      .groupBy(timelineNotes.status);
    
    // 最近的審核活動（從 audit_logs）
    const recentAudits = await db
      .select()
      .from(auditLogs)
      .where(gte(auditLogs.createdAt, sevenDaysAgo))
      .orderBy(desc(auditLogs.createdAt))
      .limit(10);
    
    // 最近 30 天的活動趨勢
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const activityTrend = await db
      .select({
        date: sql<string>`DATE(${auditLogs.createdAt})`.as("date"),
        count: count(),
      })
      .from(auditLogs)
      .where(gte(auditLogs.createdAt, thirtyDaysAgo))
      .groupBy(sql`DATE(${auditLogs.createdAt})`)
      .orderBy(sql`DATE(${auditLogs.createdAt})`);
    
    return {
      noteStats,
      recentAudits,
      activityTrend,
    };
  }),

  // 綜合統計（快速總覽）
  getOverview: protectedProcedure.query(async () => {
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
  }),
});
