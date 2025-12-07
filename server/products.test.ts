import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { products, productRelations } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * 商品知識中樞 API 測試
 * 
 * 測試範圍：
 * 1. SKU 搜尋功能
 * 2. 商品家族查詢
 * 3. 商品關聯查詢
 * 4. 商品 CRUD（Admin 專用）
 * 5. SKU 格式驗證
 */

describe("Products API", () => {
  const caller = appRouter.createCaller({
    user: { id: 1, openId: "test", name: "Admin", email: "admin@test.com", role: "admin" },
  } as any);

  let testProductId: number;
  let testProductId2: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) {
      throw new Error("Database connection failed");
    }

    // 清理測試資料
    await db.delete(products).where(eq(products.sku, "TST123456A"));
    await db.delete(products).where(eq(products.sku, "TST123456B"));
    await db.delete(products).where(eq(products.sku, "TST654321A"));
  });

  it("should create a product with valid SKU format", async () => {
    const result = await caller.products.create({
      sku: "TST123456A",
      name: "測試商品 A",
      description: "這是一個測試商品",
    });

    expect(result).toBeDefined();
    expect(result.sku).toBe("TST123456A");
    expect(result.name).toBe("測試商品 A");
    expect(result.familyCode).toBe("TST123");
    expect(result.variant).toBe("A");

    testProductId = result.id;
  });

  it("should reject invalid SKU format", async () => {
    await expect(
      caller.products.create({
        sku: "INVALID",
        name: "無效商品",
      })
    ).rejects.toThrow("SKU 格式錯誤");
  });

  it("should reject duplicate SKU", async () => {
    await expect(
      caller.products.create({
        sku: "TST123456A",
        name: "重複商品",
      })
    ).rejects.toThrow("該 SKU 已存在");
  });

  it("should search products by SKU", async () => {
    const results = await caller.products.search({
      query: "TST123456",
      limit: 10,
    });

    expect(results).toBeDefined();
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].sku).toBe("TST123456A");
  });

  it("should search products by name", async () => {
    const results = await caller.products.search({
      query: "測試商品",
      limit: 10,
    });

    expect(results).toBeDefined();
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].name).toContain("測試商品");
  });

  it("should get product by SKU", async () => {
    const product = await caller.products.getBySku({
      sku: "TST123456A",
    });

    expect(product).toBeDefined();
    expect(product.sku).toBe("TST123456A");
    expect(product.name).toBe("測試商品 A");
  });

  it("should create product family (same first 6 characters)", async () => {
    const result = await caller.products.create({
      sku: "TST123456B",
      name: "測試商品 B",
      description: "家族商品",
    });

    expect(result).toBeDefined();
    expect(result.familyCode).toBe("TST123");
    testProductId2 = result.id;
  });

  it("should get product family", async () => {
    const family = await caller.products.getFamily({
      sku: "TST123456A",
    });

    expect(family).toBeDefined();
    expect(family.length).toBeGreaterThanOrEqual(2);
    expect(family.every(p => p.familyCode === "TST123")).toBe(true);
  });

  it("should create product relation", async () => {
    const relation = await caller.products.createRelation({
      productAId: testProductId,
      productBId: testProductId2,
      relationType: "SYNONYM",
    });

    expect(relation).toBeDefined();
    expect(relation.productAId).toBe(testProductId);
    expect(relation.productBId).toBe(testProductId2);
    expect(relation.relationType).toBe("SYNONYM");
  });

  it("should get product relations", async () => {
    const relations = await caller.products.getRelations({
      productId: testProductId,
    });

    expect(relations).toBeDefined();
    expect(relations.length).toBeGreaterThan(0);
    expect(relations[0].relationType).toBe("SYNONYM");
    expect(relations[0].relatedProduct).toBeDefined();
  });

  it("should update product", async () => {
    const updated = await caller.products.update({
      id: testProductId,
      name: "測試商品 A（已更新）",
      description: "更新後的描述",
    });

    expect(updated).toBeDefined();
    expect(updated.name).toBe("測試商品 A（已更新）");
    expect(updated.description).toBe("更新後的描述");
  });

  it("should get related videos (empty for test product)", async () => {
    const videos = await caller.products.getRelatedVideos({
      sku: "TST123456A",
      limit: 10,
    });

    expect(videos).toBeDefined();
    expect(Array.isArray(videos)).toBe(true);
    // 測試商品沒有相關影片，應該是空陣列
  });
});
