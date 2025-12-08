import { describe, it, expect, beforeAll } from "vitest";
import { getDb, ensureProductCodeTag, getTagByName, getAllTags } from "./db";
import { tags } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

describe("Product Code Tag Auto-Creation", () => {
  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    // Clean up test tags
    await db.delete(tags).where(eq(tags.name, "TEST123456a"));
    await db.delete(tags).where(eq(tags.name, "TEST789012b"));
  });

  it("should create PRODUCT_CODE tag if it doesn't exist", async () => {
    const productId = "TEST123456a";
    
    // Ensure tag is created
    await ensureProductCodeTag(productId);
    
    // Verify tag exists
    const tag = await getTagByName(productId);
    expect(tag).toBeDefined();
    expect(tag?.name).toBe(productId);
    expect(tag?.tagType).toBe("PRODUCT_CODE");
    expect(tag?.description).toBe(`商品編號：${productId}`);
  });

  it("should not create duplicate PRODUCT_CODE tag", async () => {
    const productId = "TEST123456a";
    
    // Call ensureProductCodeTag twice
    await ensureProductCodeTag(productId);
    await ensureProductCodeTag(productId);
    
    // Verify only one tag exists
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const allTags = await db.select()
      .from(tags)
      .where(and(eq(tags.name, productId), eq(tags.tagType, "PRODUCT_CODE")));
    
    expect(allTags.length).toBe(1);
  });

  it("should create multiple PRODUCT_CODE tags for different product IDs", async () => {
    const productId1 = "TEST123456a";
    const productId2 = "TEST789012b";
    
    // Create two different product code tags
    await ensureProductCodeTag(productId1);
    await ensureProductCodeTag(productId2);
    
    // Verify both tags exist
    const tag1 = await getTagByName(productId1);
    const tag2 = await getTagByName(productId2);
    
    expect(tag1).toBeDefined();
    expect(tag1?.tagType).toBe("PRODUCT_CODE");
    expect(tag2).toBeDefined();
    expect(tag2?.tagType).toBe("PRODUCT_CODE");
  });

  it("should filter tags by PRODUCT_CODE type", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    // Get all PRODUCT_CODE tags
    const productCodeTags = await db.select()
      .from(tags)
      .where(eq(tags.tagType, "PRODUCT_CODE"));
    
    // Verify all returned tags are PRODUCT_CODE type
    expect(productCodeTags.length).toBeGreaterThan(0);
    productCodeTags.forEach(tag => {
      expect(tag.tagType).toBe("PRODUCT_CODE");
    });
  });
});
