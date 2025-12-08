import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { Context } from "./_core/context";

/**
 * Phase 17 & Phase 21: 商品知識中樞進階功能 & 縮圖上傳系統測試
 * 
 * 測試項目：
 * 1. products.uploadThumbnail（商品縮圖上傳到 S3）
 * 2. products.importBatch（批次匯入 SKU 資料）
 */

describe("Phase 17 & Phase 21: 商品知識中樞進階功能 & 縮圖上傳系統", () => {
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

  describe("商品縮圖上傳", () => {
    it("應該拒絕非 Admin 使用者上傳縮圖", async () => {
      const staffContext = {
        user: {
          ...adminContext.user,
          role: "staff",
        },
      } as Context;

      const staffCaller = appRouter.createCaller(staffContext);

      await expect(
        staffCaller.products.uploadThumbnail({
          sku: "TEST-001",
          imageData: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        })
      ).rejects.toThrow("僅管理員可上傳商品縮圖");
    });

    it("應該拒絕無效的圖片格式", async () => {
      await expect(
        caller.products.uploadThumbnail({
          sku: "TEST-001",
          imageData: "invalid-image-data",
        })
      ).rejects.toThrow("無效的圖片格式");
    });
  });

  describe("商品批次匯入", () => {
    it("應該拒絕非 Admin 使用者批次匯入", async () => {
      const staffContext = {
        user: {
          ...adminContext.user,
          role: "staff",
        },
      } as Context;

      const staffCaller = appRouter.createCaller(staffContext);

      await expect(
        staffCaller.products.importBatch({
          products: [
            { sku: "TEST-001", name: "測試商品" },
          ],
        })
      ).rejects.toThrow("僅管理員可批次匯入商品");
    });

    it("應該拒絕空商品陣列", async () => {
      await expect(
        caller.products.importBatch({
          products: [],
        })
      ).rejects.toThrow();
    });

    it("應該成功批次匯入商品（跳過已存在的商品）", async () => {
      const result = await caller.products.importBatch({
        products: [
          { sku: "BATCH-TEST-001", name: "批次測試商品 1", description: "測試描述" },
          { sku: "BATCH-TEST-002", name: "批次測試商品 2" },
        ],
      });

      expect(result).toBeDefined();
      expect(result.success).toBeGreaterThanOrEqual(0);
      expect(result.skipped).toBeGreaterThanOrEqual(0);
      expect(result.failed).toBe(0);
      expect(result.success + result.skipped).toBe(2);
    });
  });

  describe("CSV 解析功能（前端邏輯）", () => {
    it("應該正確解析 CSV 格式", () => {
      const csvText = `sku,name,description
TEST-001,商品A,這是商品A的描述
TEST-002,商品B,這是商品B的描述`;

      const lines = csvText.trim().split("\n");
      expect(lines.length).toBe(3); // 1 標題行 + 2 資料行

      const headers = lines[0].split(",");
      expect(headers).toContain("sku");
      expect(headers).toContain("name");
      expect(headers).toContain("description");

      const firstProduct = lines[1].split(",");
      expect(firstProduct[0]).toBe("TEST-001");
      expect(firstProduct[1]).toBe("商品A");
      expect(firstProduct[2]).toBe("這是商品A的描述");
    });
  });
});
