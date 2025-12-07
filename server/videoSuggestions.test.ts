import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";

// Mock context for testing (will be populated in beforeAll)
let mockAdminContext: TrpcContext;
let mockStaffContext: TrpcContext;

const mockPublicContext: TrpcContext = {
  user: undefined,
  req: {} as any,
  res: {} as any,
};

describe("Video Suggestions API", () => {
  let testVideoId: number;
  let testSuggestionId: number;

  beforeAll(async () => {
    // Create test users (Admin and Staff)
    await db.upsertUser({
      openId: "test-admin",
      name: "Test Admin",
      email: "admin@test.com",
      role: "admin",
      loginMethod: "password",
    });
    
    await db.upsertUser({
      openId: "test-staff",
      name: "Test Staff",
      email: "staff@test.com",
      role: "staff",
      loginMethod: "password",
    });

    // Get created users
    const adminUser = await db.getUserByOpenId("test-admin");
    const staffUser = await db.getUserByOpenId("test-staff");

    if (!adminUser || !staffUser) {
      throw new Error("Failed to create test users");
    }

    // Initialize mock contexts with actual user IDs
    mockAdminContext = {
      user: adminUser,
      req: {} as any,
      res: {} as any,
    };

    mockStaffContext = {
      user: staffUser,
      req: {} as any,
      res: {} as any,
    };

    // Create a test video
    const video = await db.createVideo({
      title: "Test Video for Suggestions",
      description: "Test video description",
      videoUrl: "https://www.youtube.com/watch?v=test123",
      platform: "youtube",
      category: "product_intro",
      productId: "ABC123456a",
      shareStatus: "public",
      createdBy: 1,
    });
    testVideoId = video.id;
  });

  it("should create a new suggestion (protected)", async () => {
    const caller = appRouter.createCaller(mockStaffContext);
    const result = await caller.videoSuggestions.create({
      videoId: testVideoId,
      title: "建議改進影片音質",
      content: "影片音質有點模糊，建議重新錄製或使用更好的麥克風。",
      priority: "MEDIUM",
    });

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.title).toBe("建議改進影片音質");
    expect(result.priority).toBe("MEDIUM");
    expect(result.status).toBe("PENDING");
    expect(result.userId).toBe(mockStaffContext.user!.id); // Staff user ID

    testSuggestionId = result.id;
  });

  it("should list suggestions by video ID (public)", async () => {
    const caller = appRouter.createCaller(mockPublicContext);
    const result = await caller.videoSuggestions.listByVideo({
      videoId: testVideoId,
      limit: 10,
      offset: 0,
    });

    expect(result).toBeDefined();
    expect(result.suggestions).toBeInstanceOf(Array);
    expect(result.suggestions.length).toBeGreaterThan(0);
    expect(result.suggestions[0].title).toBe("建議改進影片音質");
  });

  it("should get suggestion count by video ID (public)", async () => {
    const caller = appRouter.createCaller(mockPublicContext);
    const result = await caller.videoSuggestions.getCount({
      videoId: testVideoId,
    });

    expect(result).toBeDefined();
    expect(result.total).toBeGreaterThan(0);
  });

  it("should filter suggestions by priority (public)", async () => {
    // Create a HIGH priority suggestion
    const adminCaller = appRouter.createCaller(mockAdminContext);
    await adminCaller.videoSuggestions.create({
      videoId: testVideoId,
      title: "緊急：影片內容錯誤",
      content: "影片中的產品編號錯誤，需要立即修正。",
      priority: "HIGH",
    });

    const publicCaller = appRouter.createCaller(mockPublicContext);
    const result = await publicCaller.videoSuggestions.listByVideo({
      videoId: testVideoId,
      priority: "HIGH",
    });

    expect(result.suggestions).toBeInstanceOf(Array);
    expect(result.suggestions.length).toBeGreaterThan(0);
    expect(result.suggestions[0].priority).toBe("HIGH");
  });

  it("should update suggestion (creator only)", async () => {
    if (!testSuggestionId) {
      throw new Error("testSuggestionId is not defined. Previous test may have failed.");
    }
    const caller = appRouter.createCaller(mockStaffContext);
    const result = await caller.videoSuggestions.update({
      id: testSuggestionId,
      title: "建議改進影片音質（已更新）",
      content: "影片音質有點模糊，建議重新錄製或使用更好的麥克風。已測試新麥克風。",
      priority: "HIGH",
    });

    expect(result).toBeDefined();
    expect(result.title).toBe("建議改進影片音質（已更新）");
    expect(result.priority).toBe("HIGH");
  });

  it("should update suggestion status (admin only)", async () => {
    if (!testSuggestionId) {
      throw new Error("testSuggestionId is not defined. Previous test may have failed.");
    }
    const caller = appRouter.createCaller(mockAdminContext);
    const result = await caller.videoSuggestions.updateStatus({
      id: testSuggestionId,
      status: "READ",
    });

    expect(result).toBeDefined();
    expect(result.status).toBe("READ");
  });

  it("should reject status update from non-admin", async () => {
    if (!testSuggestionId) {
      throw new Error("testSuggestionId is not defined. Previous test may have failed.");
    }
    const caller = appRouter.createCaller(mockStaffContext);
    
    await expect(
      caller.videoSuggestions.updateStatus({
        id: testSuggestionId,
        status: "RESOLVED",
      })
    ).rejects.toThrow("Unauthorized: Admin only");
  });

  it("should delete suggestion (creator or admin)", async () => {
    if (!testSuggestionId) {
      throw new Error("testSuggestionId is not defined. Previous test may have failed.");
    }
    const caller = appRouter.createCaller(mockStaffContext);
    const result = await caller.videoSuggestions.delete({
      id: testSuggestionId,
    });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);

    // Verify deletion
    const listResult = await caller.videoSuggestions.listByVideo({
      videoId: testVideoId,
    });
    const deletedSuggestion = listResult.suggestions.find(s => s.id === testSuggestionId);
    expect(deletedSuggestion).toBeUndefined();
  });

  it("should reject unauthorized deletion", async () => {
    // Create a suggestion as admin
    const adminCaller = appRouter.createCaller(mockAdminContext);
    const suggestion = await adminCaller.videoSuggestions.create({
      videoId: testVideoId,
      title: "Admin's suggestion",
      content: "This is an admin suggestion",
      priority: "LOW",
    });

    // Try to delete as staff (should fail)
    const staffCaller = appRouter.createCaller(mockStaffContext);
    await expect(
      staffCaller.videoSuggestions.delete({
        id: suggestion.id,
      })
    ).rejects.toThrow("Unauthorized: You can only delete your own suggestions");

    // Admin can delete their own suggestion
    await adminCaller.videoSuggestions.delete({
      id: suggestion.id,
    });
  });

  it("should require authentication for creating suggestions", async () => {
    const caller = appRouter.createCaller(mockPublicContext);
    
    await expect(
      caller.videoSuggestions.create({
        videoId: testVideoId,
        title: "Test suggestion",
        content: "Test content",
        priority: "LOW",
      })
    ).rejects.toThrow();
  });
});
