import { describe, it, expect } from "vitest";
import { appRouter } from "../../routers";
import type { TrpcContext } from "../../_core/context";

// Helper function to create a mock protected context
function createProtectedContext(userId: number, role: "admin" | "staff" | "viewer" = "staff"): TrpcContext {
  return {
    user: {
      id: userId,
      email: `test-user-${userId}@test.com`,
      name: `Test User ${userId}`,
      role,
      openId: `test-openid-${userId}`,
    },
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("myContributions router", () => {

  describe("getMyVideos", () => {
    it("should return an array of videos", async () => {
      const ctx = createProtectedContext(1);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.myContributions.getMyVideos();

      expect(result).toBeInstanceOf(Array);
      // Result may be empty or contain videos depending on database state
    });
  });

  describe("getMyNotes", () => {
    it("should return an array of timeline notes", async () => {
      const ctx = createProtectedContext(1);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.myContributions.getMyNotes();

      expect(result).toBeInstanceOf(Array);
      // Each note should have basic properties if notes exist
      if (result.length > 0) {
        expect(result[0]).toHaveProperty("id");
        expect(result[0]).toHaveProperty("videoId");
        expect(result[0]).toHaveProperty("content");
      }
    });
  });

  describe("getStats", () => {
    it("should return contribution statistics with correct structure", async () => {
      const ctx = createProtectedContext(1);
      const caller = appRouter.createCaller(ctx);

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
    });
  });

  describe("Admin-only procedures", () => {

    describe("listUsers", () => {
      it("should return all users for admin", async () => {
        const ctx = createProtectedContext(1, "admin");
        const caller = appRouter.createCaller(ctx);

        const result = await caller.myContributions.listUsers();

        expect(result).toBeInstanceOf(Array);
        // Should return array of users with id, name, email properties
        if (result.length > 0) {
          expect(result[0]).toHaveProperty("id");
          expect(result[0]).toHaveProperty("name");
          expect(result[0]).toHaveProperty("email");
        }
      });

      it("should reject non-admin users", async () => {
        const ctx = createProtectedContext(1, "staff");
        const caller = appRouter.createCaller(ctx);

        await expect(caller.myContributions.listUsers()).rejects.toThrow("僅管理員可存取");
      });
    });

    describe("getUserVideos", () => {
      it("should return videos for specified user (admin only)", async () => {
        const ctx = createProtectedContext(1, "admin");
        const caller = appRouter.createCaller(ctx);

        const result = await caller.myContributions.getUserVideos({ userId: 1 });

        expect(result).toBeInstanceOf(Array);
      });

      it("should reject non-admin users", async () => {
        const ctx = createProtectedContext(1, "staff");
        const caller = appRouter.createCaller(ctx);

        await expect(
          caller.myContributions.getUserVideos({ userId: 1 })
        ).rejects.toThrow("僅管理員可存取");
      });
    });

    describe("getUserNotes", () => {
      it("should return notes for specified user (admin only)", async () => {
        const ctx = createProtectedContext(1, "admin");
        const caller = appRouter.createCaller(ctx);

        const result = await caller.myContributions.getUserNotes({ userId: 1 });

        expect(result).toBeInstanceOf(Array);
      });

      it("should reject non-admin users", async () => {
        const ctx = createProtectedContext(1, "staff");
        const caller = appRouter.createCaller(ctx);

        await expect(
          caller.myContributions.getUserNotes({ userId: 1 })
        ).rejects.toThrow("僅管理員可存取");
      });
    });

    describe("getUserStats", () => {
      it("should return statistics for specified user (admin only)", async () => {
        const ctx = createProtectedContext(1, "admin");
        const caller = appRouter.createCaller(ctx);

        const result = await caller.myContributions.getUserStats({ userId: 1 });

        expect(result).toHaveProperty("totalVideos");
        expect(result).toHaveProperty("totalNotes");
        expect(result).toHaveProperty("approvedNotes");
        expect(result).toHaveProperty("pendingNotes");
        expect(result).toHaveProperty("rejectedNotes");
      });

      it("should reject non-admin users", async () => {
        const ctx = createProtectedContext(1, "staff");
        const caller = appRouter.createCaller(ctx);

        await expect(
          caller.myContributions.getUserStats({ userId: 1 })
        ).rejects.toThrow("僅管理員可存取");
      });
    });
  });
});
