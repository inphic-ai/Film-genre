import { describe, it, expect } from "vitest";
import { storagePut, storageGet } from "./storage";

describe("Cloudflare R2 Integration", () => {
  it("should upload a file to R2 and return URL", async () => {
    const testContent = "Hello, Cloudflare R2!";
    const testKey = `test/${Date.now()}.txt`;

    const result = await storagePut(testKey, testContent, "text/plain");

    expect(result).toHaveProperty("key");
    expect(result).toHaveProperty("url");
    expect(result.key).toBe(testKey);
    expect(result.url).toContain(testKey);
  });

  it("should generate signed URL for uploaded file", async () => {
    const testContent = "Test image content";
    const testKey = `test/image-${Date.now()}.jpg`;

    // Upload file
    await storagePut(testKey, testContent, "image/jpeg");

    // Get signed URL
    const result = await storageGet(testKey, 3600);

    expect(result).toHaveProperty("key");
    expect(result).toHaveProperty("url");
    expect(result.key).toBe(testKey);
    expect(result.url).toContain("X-Amz-Signature"); // Signed URL contains signature
  });

  it("should handle file upload with Buffer", async () => {
    const testBuffer = Buffer.from("Binary content", "utf-8");
    const testKey = `test/buffer-${Date.now()}.bin`;

    const result = await storagePut(testKey, testBuffer, "application/octet-stream");

    expect(result).toHaveProperty("key");
    expect(result).toHaveProperty("url");
    expect(result.key).toBe(testKey);
  });

  it("should normalize keys by removing leading slashes", async () => {
    const testContent = "Normalized key test";
    const testKey = "/test/normalized.txt";
    const expectedKey = "test/normalized.txt";

    const result = await storagePut(testKey, testContent, "text/plain");

    expect(result.key).toBe(expectedKey);
  });
});
