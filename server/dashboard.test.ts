import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";

describe("Dashboard & MyContributions API Tests", () => {
  // Mock admin user context
  const mockAdminContext = {
    user: {
      id: 1,
      openId: "admin@test.com",
      name: "Admin",
      email: "admin@test.com",
      role: "admin" as const,
    },
  } as any;

  describe("Dashboard Statistics API", () => {
    it("should get overview statistics", async () => {
      const caller = appRouter.createCaller(mockAdminContext);

      const result = await caller.dashboard.getOverview();

      expect(result).toHaveProperty("totalVideos");
      expect(result).toHaveProperty("totalProducts");
      expect(result).toHaveProperty("totalNotes");
      expect(result).toHaveProperty("pendingNotes");
      expect(typeof result.totalVideos).toBe("number");
      expect(typeof result.totalProducts).toBe("number");
      expect(typeof result.totalNotes).toBe("number");
      expect(typeof result.pendingNotes).toBe("number");
    });

    it("should get video statistics", async () => {
      const caller = appRouter.createCaller(mockAdminContext);

      const result = await caller.dashboard.getVideoStats();

      expect(result).toHaveProperty("totalVideos");
      expect(result).toHaveProperty("categoryDistribution");
      expect(result).toHaveProperty("platformDistribution");
      expect(result).toHaveProperty("shareStatusDistribution");
      expect(result).toHaveProperty("recentTrend");
      expect(Array.isArray(result.categoryDistribution)).toBe(true);
      expect(Array.isArray(result.platformDistribution)).toBe(true);
    });

    it("should get product statistics", async () => {
      const caller = appRouter.createCaller(mockAdminContext);

      const result = await caller.dashboard.getProductStats();

      expect(result).toHaveProperty("totalProducts");
      expect(result).toHaveProperty("totalRelations");
      expect(result).toHaveProperty("relationTypeDistribution");
      expect(result).toHaveProperty("topRelatedProducts");
      expect(typeof result.totalProducts).toBe("number");
      expect(typeof result.totalRelations).toBe("number");
      expect(Array.isArray(result.relationTypeDistribution)).toBe(true);
      expect(Array.isArray(result.topRelatedProducts)).toBe(true);
    });

    it("should get user activity", async () => {
      const caller = appRouter.createCaller(mockAdminContext);

      const result = await caller.dashboard.getUserActivity();

      expect(result).toHaveProperty("noteStats");
      expect(result).toHaveProperty("recentAudits");
      expect(result).toHaveProperty("activityTrend");
      expect(Array.isArray(result.noteStats)).toBe(true);
      expect(Array.isArray(result.recentAudits)).toBe(true);
      expect(Array.isArray(result.activityTrend)).toBe(true);
    });
  });

  describe("MyContributions API", () => {
    it("should get my videos", async () => {
      const caller = appRouter.createCaller(mockAdminContext);

      const result = await caller.myContributions.getMyVideos();

      expect(Array.isArray(result)).toBe(true);
      // Videos should be filtered by current user
      result.forEach((video) => {
        if (video.uploadedBy !== null) {
          expect(video.uploadedBy).toBe(mockAdminContext.user.id);
        }
      });
    });

    it("should get my notes", async () => {
      const caller = appRouter.createCaller(mockAdminContext);

      const result = await caller.myContributions.getMyNotes();

      expect(Array.isArray(result)).toBe(true);
      // Notes should be filtered by current user
      result.forEach((note) => {
        expect(note.userId).toBe(mockAdminContext.user.id);
      });
    });

    it("should get my contribution stats", async () => {
      const caller = appRouter.createCaller(mockAdminContext);

      const result = await caller.myContributions.getStats();

      expect(result).toHaveProperty("totalVideos");
      expect(result).toHaveProperty("totalNotes");
      expect(result).toHaveProperty("approvedNotes");
      expect(result).toHaveProperty("pendingNotes");
      expect(result).toHaveProperty("rejectedNotes");
      expect(typeof result.totalVideos).toBe("number");
      expect(typeof result.totalNotes).toBe("number");
      expect(typeof result.approvedNotes).toBe("number");
      expect(typeof result.pendingNotes).toBe("number");
      expect(typeof result.rejectedNotes).toBe("number");
      
      // Validate stats consistency
      expect(result.approvedNotes + result.pendingNotes + result.rejectedNotes).toBe(result.totalNotes);
    });
  });
});
