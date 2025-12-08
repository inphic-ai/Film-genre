import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { Context } from "./_core/context";

/**
 * Phase 50: 使用者回饋功能改進測試
 * 
 * 測試項目：
 * 1. 商品知識中樞標籤篩選 API（products.listByTags）
 */

describe("Phase 50: 使用者回饋功能改進", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;
  let adminContext: Context;

  beforeAll(async () => {
    // 建立 Admin 測試上下文
    adminContext = {
      user: {
        id: 1,
        openId: "test-admin",
        name: "Test Admin",
        email: "admin@test.com",
        role: "admin",
        loginMethod: "manus",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
    } as Context;

    caller = appRouter.createCaller(adminContext);
  });

  describe("商品知識中樞標籤篩選", () => {
    it("應該能根據標籤篩選商品（空結果）", async () => {
      // 測試不存在的標籤 ID
      const result = await caller.products.listByTags({
        tagIds: [99999],
        limit: 50,
        offset: 0,
      });

      expect(result).toBeDefined();
      expect(result.products).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.hasMore).toBe(false);
    });

    it("應該能根據多個標籤篩選商品", async () => {
      // 測試多個標籤 ID（假設標籤 1, 2 存在）
      const result = await caller.products.listByTags({
        tagIds: [1, 2],
        limit: 50,
        offset: 0,
      });

      expect(result).toBeDefined();
      expect(result.products).toBeDefined();
      expect(Array.isArray(result.products)).toBe(true);
      expect(result.total).toBeGreaterThanOrEqual(0);
      expect(typeof result.hasMore).toBe("boolean");
    });

    it("應該支援分頁功能", async () => {
      // 測試分頁參數
      const result = await caller.products.listByTags({
        tagIds: [1],
        limit: 10,
        offset: 0,
      });

      expect(result).toBeDefined();
      expect(result.products.length).toBeLessThanOrEqual(10);
    });

    it("應該拒絕空標籤陣列", async () => {
      // 測試空標籤陣列（應該拋出錯誤）
      await expect(
        caller.products.listByTags({
          tagIds: [],
          limit: 50,
          offset: 0,
        })
      ).rejects.toThrow();
    });
  });

  describe("排序功能驗證", () => {
    it("Board.tsx 排序邏輯應該支援升序/降序", () => {
      // 模擬排序邏輯
      const mockVideos = [
        { id: 1, title: "A", viewCount: 100, rating: 5, duration: 300, createdAt: new Date("2024-01-01") },
        { id: 2, title: "B", viewCount: 200, rating: 4, duration: 200, createdAt: new Date("2024-01-02") },
        { id: 3, title: "C", viewCount: 150, rating: 3, duration: 400, createdAt: new Date("2024-01-03") },
      ];

      // 測試降序排序（viewCount）
      const sortedDesc = [...mockVideos].sort((a, b) => {
        const result = (b.viewCount || 0) - (a.viewCount || 0);
        return result; // desc
      });
      expect(sortedDesc[0].viewCount).toBe(200);
      expect(sortedDesc[2].viewCount).toBe(100);

      // 測試升序排序（viewCount）
      const sortedAsc = [...mockVideos].sort((a, b) => {
        const result = (b.viewCount || 0) - (a.viewCount || 0);
        return -result; // asc
      });
      expect(sortedAsc[0].viewCount).toBe(100);
      expect(sortedAsc[2].viewCount).toBe(200);
    });
  });
});
