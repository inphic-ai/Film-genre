import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../../_core/trpc";
import { eq, desc, and, gte, sql } from "drizzle-orm";
import { performanceLogs, userActivityLogs } from "../../../drizzle/schema";
import { getDb } from "../../db";

/**
 * Performance Monitor Router
 * Provides APIs for system performance monitoring and user activity tracking
 */
export const performanceMonitorRouter = router({
  /**
   * Get API performance statistics
   * Admin only
   */
  getApiStats: protectedProcedure
    .input(z.object({
      days: z.number().min(1).max(90).default(7), // Last N days
    }))
    .query(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Unauthorized: Admin only');
      }

      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - input.days);

      // Get API logs from the last N days
      const logs = await db
        .select()
        .from(performanceLogs)
        .where(
          and(
            eq(performanceLogs.logType, 'API'),
            gte(performanceLogs.createdAt, cutoffDate)
          )
        )
        .orderBy(desc(performanceLogs.createdAt))
        .limit(1000);

      // Calculate statistics
      const totalRequests = logs.length;
      const avgResponseTime = logs.length > 0
        ? Math.round(logs.reduce((sum, log) => sum + log.responseTime, 0) / logs.length)
        : 0;
      const maxResponseTime = logs.length > 0
        ? Math.max(...logs.map(log => log.responseTime))
        : 0;
      const minResponseTime = logs.length > 0
        ? Math.min(...logs.map(log => log.responseTime))
        : 0;

      // Count by status code
      const statusCodeCounts = logs.reduce((acc, log) => {
        const code = log.statusCode || 0;
        acc[code] = (acc[code] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);

      // Count by endpoint
      const endpointCounts = logs.reduce((acc, log) => {
        const endpoint = log.endpoint || 'unknown';
        acc[endpoint] = (acc[endpoint] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Get slowest endpoints
      const endpointStats = Object.entries(
        logs.reduce((acc, log) => {
          const endpoint = log.endpoint || 'unknown';
          if (!acc[endpoint]) {
            acc[endpoint] = { total: 0, count: 0, max: 0 };
          }
          acc[endpoint].total += log.responseTime;
          acc[endpoint].count += 1;
          acc[endpoint].max = Math.max(acc[endpoint].max, log.responseTime);
          return acc;
        }, {} as Record<string, { total: number; count: number; max: number }>)
      ).map(([endpoint, stats]) => ({
        endpoint,
        avgResponseTime: Math.round(stats.total / stats.count),
        maxResponseTime: stats.max,
        requestCount: stats.count,
      })).sort((a, b) => b.avgResponseTime - a.avgResponseTime).slice(0, 10);

      return {
        totalRequests,
        avgResponseTime,
        maxResponseTime,
        minResponseTime,
        statusCodeCounts,
        endpointCounts,
        slowestEndpoints: endpointStats,
        recentLogs: logs.slice(0, 50), // Return latest 50 logs
      };
    }),

  /**
   * Get database query performance statistics
   * Admin only
   */
  getDbStats: protectedProcedure
    .input(z.object({
      days: z.number().min(1).max(90).default(7),
    }))
    .query(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Unauthorized: Admin only');
      }

      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - input.days);

      // Get DB query logs from the last N days
      const logs = await db
        .select()
        .from(performanceLogs)
        .where(
          and(
            eq(performanceLogs.logType, 'DB_QUERY'),
            gte(performanceLogs.createdAt, cutoffDate)
          )
        )
        .orderBy(desc(performanceLogs.createdAt))
        .limit(1000);

      // Calculate statistics
      const totalQueries = logs.length;
      const avgQueryTime = logs.length > 0
        ? Math.round(logs.reduce((sum, log) => sum + log.responseTime, 0) / logs.length)
        : 0;
      const maxQueryTime = logs.length > 0
        ? Math.max(...logs.map(log => log.responseTime))
        : 0;

      // Get slowest queries
      const slowQueries = logs
        .sort((a, b) => b.responseTime - a.responseTime)
        .slice(0, 20)
        .map(log => ({
          endpoint: log.endpoint || 'unknown',
          responseTime: log.responseTime,
          createdAt: log.createdAt,
          metadata: log.metadata,
        }));

      return {
        totalQueries,
        avgQueryTime,
        maxQueryTime,
        slowQueries,
      };
    }),

  /**
   * Get user activity statistics
   * Admin only
   */
  getUserActivity: protectedProcedure
    .input(z.object({
      days: z.number().min(1).max(90).default(7),
      limit: z.number().min(1).max(100).default(50),
    }))
    .query(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Unauthorized: Admin only');
      }

      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - input.days);

      // Get activity logs from the last N days
      const logs = await db
        .select()
        .from(userActivityLogs)
        .where(gte(userActivityLogs.createdAt, cutoffDate))
        .orderBy(desc(userActivityLogs.createdAt))
        .limit(input.limit);

      // Count by action type
      const actionCounts = logs.reduce((acc, log) => {
        acc[log.action] = (acc[log.action] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Count by user
      const userCounts = logs.reduce((acc, log) => {
        acc[log.userId] = (acc[log.userId] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);

      // Most active users
      const mostActiveUsers = Object.entries(userCounts)
        .map(([userId, count]) => ({ userId: parseInt(userId), activityCount: count }))
        .sort((a, b) => b.activityCount - a.activityCount)
        .slice(0, 10);

      return {
        totalActivities: logs.length,
        actionCounts,
        mostActiveUsers,
        recentActivities: logs,
      };
    }),

  /**
   * Get system health status
   * Admin only
   */
  getSystemHealth: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Unauthorized: Admin only');
      }

      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // Get recent API logs (last 5 minutes)
      const fiveMinutesAgo = new Date();
      fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);

      const recentApiLogs = await db
        .select()
        .from(performanceLogs)
        .where(
          and(
            eq(performanceLogs.logType, 'API'),
            gte(performanceLogs.createdAt, fiveMinutesAgo)
          )
        );

      const avgResponseTime = recentApiLogs.length > 0
        ? Math.round(recentApiLogs.reduce((sum, log) => sum + log.responseTime, 0) / recentApiLogs.length)
        : 0;

      const errorCount = recentApiLogs.filter(log => log.statusCode && log.statusCode >= 400).length;
      const errorRate = recentApiLogs.length > 0
        ? Math.round((errorCount / recentApiLogs.length) * 100)
        : 0;

      // Determine health status
      let status: 'healthy' | 'warning' | 'critical' = 'healthy';
      if (avgResponseTime > 2000 || errorRate > 10) {
        status = 'critical';
      } else if (avgResponseTime > 1000 || errorRate > 5) {
        status = 'warning';
      }

      return {
        status,
        avgResponseTime,
        errorRate,
        requestCount: recentApiLogs.length,
        lastChecked: new Date(),
      };
    }),

  /**
   * Log API performance (internal use)
   * Protected procedure
   */
  logApiPerformance: protectedProcedure
    .input(z.object({
      endpoint: z.string(),
      method: z.string(),
      responseTime: z.number(),
      statusCode: z.number(),
      errorMessage: z.string().optional(),
      metadata: z.any().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return { success: false };

      try {
        await db.insert(performanceLogs).values({
          logType: 'API',
          endpoint: input.endpoint,
          method: input.method,
          responseTime: input.responseTime,
          statusCode: input.statusCode,
          userId: ctx.user.id,
          errorMessage: input.errorMessage || null,
          metadata: input.metadata || null,
        });
        return { success: true };
      } catch (error) {
        console.error('[logApiPerformance] Error:', error);
        return { success: false };
      }
    }),

  /**
   * Log user activity (internal use)
   * Protected procedure
   */
  logUserActivity: protectedProcedure
    .input(z.object({
      action: z.string(),
      targetType: z.string().optional(),
      targetId: z.number().optional(),
      details: z.string().optional(),
      ipAddress: z.string().optional(),
      userAgent: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return { success: false };

      try {
        await db.insert(userActivityLogs).values({
          userId: ctx.user.id,
          action: input.action,
          targetType: input.targetType || null,
          targetId: input.targetId || null,
          details: input.details || null,
          ipAddress: input.ipAddress || null,
          userAgent: input.userAgent || null,
        });
        return { success: true };
      } catch (error) {
        console.error('[logUserActivity] Error:', error);
        return { success: false };
      }
    }),
});
