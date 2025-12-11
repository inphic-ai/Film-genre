import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { appRouter } from './routers';
import { getDb } from './db';
import { videoCategories } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

/**
 * videoCategories router 測試
 * 
 * 測試 Category CRUD API 的完整功能
 */

// Mock context for admin user
const mockAdminContext = {
  user: {
    id: 1,
    openId: 'test-admin',
    name: 'Test Admin',
    email: 'admin@test.com',
    role: 'admin' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    loginMethod: 'oauth',
  },
  req: {} as any,
  res: {} as any,
};

// Mock context for staff user
const mockStaffContext = {
  user: {
    id: 2,
    openId: 'test-staff',
    name: 'Test Staff',
    email: 'staff@test.com',
    role: 'staff' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    loginMethod: 'oauth',
  },
  req: {} as any,
  res: {} as any,
};

// Test data
let testCategoryId: number;

describe('videoCategories router', () => {
  beforeAll(async () => {
    // Clean up test data
    const db = await getDb();
    if (db) {
      await db.delete(videoCategories).where(eq(videoCategories.type, 'test_category'));
    }
  });

  afterAll(async () => {
    // Clean up test data
    const db = await getDb();
    if (db) {
      await db.delete(videoCategories).where(eq(videoCategories.type, 'test_category'));
    }
  });

  describe('list', () => {
    it('should list all active categories', async () => {
      const caller = appRouter.createCaller(mockAdminContext);
      const result = await caller.videoCategories.list({ includeDisabled: false });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      // 應該只包含 isActive = true 的分類
      result.forEach((category) => {
        expect(category.isActive).toBe(true);
      });
    });

    it('should list all categories including disabled', async () => {
      const caller = appRouter.createCaller(mockAdminContext);
      const result = await caller.videoCategories.list({ includeDisabled: true });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('create', () => {
    it('should create a new category (admin only)', async () => {
      const caller = appRouter.createCaller(mockAdminContext);
      const result = await caller.videoCategories.create({
        name: 'Test Category',
        type: 'test_category',
        description: 'This is a test category',
        color: '#FF5733',
        icon: 'TestIcon',
      });

      expect(result).toBeDefined();
      expect(result.name).toBe('Test Category');
      expect(result.type).toBe('test_category');
      expect(result.description).toBe('This is a test category');
      expect(result.color).toBe('#FF5733');
      expect(result.icon).toBe('TestIcon');
      expect(result.isActive).toBe(true);

      // Save test category ID for later tests
      testCategoryId = result.id;
    });

    it('should reject duplicate type', async () => {
      const caller = appRouter.createCaller(mockAdminContext);

      await expect(
        caller.videoCategories.create({
          name: 'Duplicate Category',
          type: 'test_category', // Duplicate type
          description: 'This should fail',
        })
      ).rejects.toThrow('已存在');
    });

    it('should reject non-admin users', async () => {
      const caller = appRouter.createCaller(mockStaffContext);

      await expect(
        caller.videoCategories.create({
          name: 'Unauthorized Category',
          type: 'unauthorized_category',
        })
      ).rejects.toThrow('僅管理員可新增分類');
    });
  });

  describe('update', () => {
    it('should update a category (admin only)', async () => {
      const caller = appRouter.createCaller(mockAdminContext);
      const result = await caller.videoCategories.update({
        id: testCategoryId,
        name: 'Updated Test Category',
        description: 'Updated description',
        color: '#00FF00',
      });

      expect(result).toBeDefined();
      expect(result.name).toBe('Updated Test Category');
      expect(result.description).toBe('Updated description');
      expect(result.color).toBe('#00FF00');
    });

    it('should reject non-existent category', async () => {
      const caller = appRouter.createCaller(mockAdminContext);

      await expect(
        caller.videoCategories.update({
          id: 999999,
          name: 'Non-existent Category',
        })
      ).rejects.toThrow('不存在');
    });

    it('should reject non-admin users', async () => {
      const caller = appRouter.createCaller(mockStaffContext);

      await expect(
        caller.videoCategories.update({
          id: testCategoryId,
          name: 'Unauthorized Update',
        })
      ).rejects.toThrow('僅管理員可更新分類');
    });
  });

  describe('delete', () => {
    it('should soft delete a category (admin only)', async () => {
      const caller = appRouter.createCaller(mockAdminContext);
      const result = await caller.videoCategories.delete({
        id: testCategoryId,
      });

      expect(result).toBeDefined();
      expect(result.isActive).toBe(false);

      // Verify the category is soft deleted
      const db = await getDb();
      if (db) {
        const [category] = await db
          .select()
          .from(videoCategories)
          .where(eq(videoCategories.id, testCategoryId))
          .limit(1);

        expect(category.isActive).toBe(false);
      }
    });

    it('should reject non-existent category', async () => {
      const caller = appRouter.createCaller(mockAdminContext);

      await expect(
        caller.videoCategories.delete({
          id: 999999,
        })
      ).rejects.toThrow('不存在');
    });

    it('should reject non-admin users', async () => {
      const caller = appRouter.createCaller(mockStaffContext);

      await expect(
        caller.videoCategories.delete({
          id: testCategoryId,
        })
      ).rejects.toThrow('僅管理員可刪除分類');
    });
  });

  describe('reorder', () => {
    it('should reorder categories (admin only)', async () => {
      const caller = appRouter.createCaller(mockAdminContext);

      // Get all categories
      const categories = await caller.videoCategories.list({ includeDisabled: true });

      // Reverse the order
      const orders = categories.map((category, index) => ({
        id: category.id,
        sortOrder: categories.length - index,
      }));

      const result = await caller.videoCategories.reorder({ orders });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.count).toBe(orders.length);

      // Verify the order is updated
      const updatedCategories = await caller.videoCategories.list({ includeDisabled: true });
      // list 是按 sortOrder 升序排列，所以第一個的 sortOrder 應該小於最後一個
      expect(updatedCategories[0].sortOrder).toBeLessThan(updatedCategories[updatedCategories.length - 1].sortOrder);
    });

    it('should reject non-admin users', async () => {
      const caller = appRouter.createCaller(mockStaffContext);

      await expect(
        caller.videoCategories.reorder({
          orders: [
            { id: 1, sortOrder: 1 },
            { id: 2, sortOrder: 2 },
          ],
        })
      ).rejects.toThrow('僅管理員可調整分類排序');
    });
  });
});
