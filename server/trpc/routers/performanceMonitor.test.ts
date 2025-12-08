import { describe, it, expect } from 'vitest';
import { appRouter } from '../../routers';

describe('performanceMonitor router', () => {
  describe('getApiStats', () => {
    it('should return API statistics structure', async () => {
      const caller = appRouter.createCaller({
        user: { id: 1, role: 'admin', email: 'admin@test.com', name: 'Admin', openId: 'admin-openid' },
      });

      const result = await caller.performanceMonitor.getApiStats({ days: 7 });

      expect(result).toHaveProperty('totalRequests');
      expect(result).toHaveProperty('avgResponseTime');
      expect(result).toHaveProperty('maxResponseTime');
      expect(result).toHaveProperty('minResponseTime');
      expect(result).toHaveProperty('statusCodeCounts');
      expect(result).toHaveProperty('endpointCounts');
      expect(result).toHaveProperty('slowestEndpoints');
      expect(result).toHaveProperty('recentLogs');
      expect(typeof result.totalRequests).toBe('number');
      expect(typeof result.avgResponseTime).toBe('number');
    });

    it('should reject non-admin users', async () => {
      const caller = appRouter.createCaller({
        user: { id: 2, role: 'staff', email: 'staff@test.com', name: 'Staff', openId: 'staff-openid' },
      });

      await expect(
        caller.performanceMonitor.getApiStats({ days: 7 })
      ).rejects.toThrow('Unauthorized: Admin only');
    });
  });

  describe('getDbStats', () => {
    it('should return database statistics structure', async () => {
      const caller = appRouter.createCaller({
        user: { id: 1, role: 'admin', email: 'admin@test.com', name: 'Admin', openId: 'admin-openid' },
      });

      const result = await caller.performanceMonitor.getDbStats({ days: 7 });

      expect(result).toHaveProperty('totalQueries');
      expect(result).toHaveProperty('avgQueryTime');
      expect(result).toHaveProperty('maxQueryTime');
      expect(result).toHaveProperty('slowQueries');
      expect(typeof result.totalQueries).toBe('number');
      expect(typeof result.avgQueryTime).toBe('number');
      expect(Array.isArray(result.slowQueries)).toBe(true);
    });

    it('should reject non-admin users', async () => {
      const caller = appRouter.createCaller({
        user: { id: 2, role: 'staff', email: 'staff@test.com', name: 'Staff', openId: 'staff-openid' },
      });

      await expect(
        caller.performanceMonitor.getDbStats({ days: 7 })
      ).rejects.toThrow('Unauthorized: Admin only');
    });
  });

  describe('getUserActivity', () => {
    it('should return user activity statistics structure', async () => {
      const caller = appRouter.createCaller({
        user: { id: 1, role: 'admin', email: 'admin@test.com', name: 'Admin', openId: 'admin-openid' },
      });

      const result = await caller.performanceMonitor.getUserActivity({ days: 7, limit: 50 });

      expect(result).toHaveProperty('totalActivities');
      expect(result).toHaveProperty('actionCounts');
      expect(result).toHaveProperty('mostActiveUsers');
      expect(result).toHaveProperty('recentActivities');
      expect(typeof result.totalActivities).toBe('number');
      expect(typeof result.actionCounts).toBe('object');
      expect(Array.isArray(result.mostActiveUsers)).toBe(true);
      expect(Array.isArray(result.recentActivities)).toBe(true);
    });

    it('should reject non-admin users', async () => {
      const caller = appRouter.createCaller({
        user: { id: 2, role: 'staff', email: 'staff@test.com', name: 'Staff', openId: 'staff-openid' },
      });

      await expect(
        caller.performanceMonitor.getUserActivity({ days: 7, limit: 50 })
      ).rejects.toThrow('Unauthorized: Admin only');
    });
  });

  describe('getSystemHealth', () => {
    it('should return system health status structure', async () => {
      const caller = appRouter.createCaller({
        user: { id: 1, role: 'admin', email: 'admin@test.com', name: 'Admin', openId: 'admin-openid' },
      });

      const result = await caller.performanceMonitor.getSystemHealth();

      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('avgResponseTime');
      expect(result).toHaveProperty('errorRate');
      expect(result).toHaveProperty('requestCount');
      expect(result).toHaveProperty('lastChecked');
      expect(['healthy', 'warning', 'critical']).toContain(result.status);
      expect(typeof result.avgResponseTime).toBe('number');
      expect(typeof result.errorRate).toBe('number');
      expect(typeof result.requestCount).toBe('number');
    });

    it('should reject non-admin users', async () => {
      const caller = appRouter.createCaller({
        user: { id: 2, role: 'staff', email: 'staff@test.com', name: 'Staff', openId: 'staff-openid' },
      });

      await expect(
        caller.performanceMonitor.getSystemHealth()
      ).rejects.toThrow('Unauthorized: Admin only');
    });
  });

  describe('logApiPerformance', () => {
    it('should log API performance successfully', async () => {
      const caller = appRouter.createCaller({
        user: { id: 1, role: 'admin', email: 'admin@test.com', name: 'Admin', openId: 'admin-openid' },
      });

      const result = await caller.performanceMonitor.logApiPerformance({
        endpoint: '/api/test',
        method: 'GET',
        responseTime: 150,
        statusCode: 200,
      });

      expect(result).toHaveProperty('success');
      expect(result.success).toBe(true);
    });
  });

  describe('logUserActivity', () => {
    it('should log user activity successfully', async () => {
      const caller = appRouter.createCaller({
        user: { id: 1, role: 'admin', email: 'admin@test.com', name: 'Admin', openId: 'admin-openid' },
      });

      const result = await caller.performanceMonitor.logUserActivity({
        action: 'VIDEO_CREATE',
        targetType: 'VIDEO',
        targetId: 1,
        details: 'Created new video',
      });

      expect(result).toHaveProperty('success');
      expect(result.success).toBe(true);
    });
  });
});
