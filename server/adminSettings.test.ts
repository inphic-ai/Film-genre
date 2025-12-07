import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";

describe("Admin Settings & Review Center API Tests", () => {
  const mockAdminContext = {
    user: {
      id: 1,
      openId: "admin-test",
      name: "Admin Test",
      email: "admin@test.com",
      role: "admin" as const,
    },
  };

  const mockStaffContext = {
    user: {
      id: 2,
      openId: "staff-test",
      name: "Staff Test",
      email: "staff@test.com",
      role: "staff" as const,
    },
  };

  const caller = appRouter.createCaller(mockAdminContext);
  const staffCaller = appRouter.createCaller(mockStaffContext);

  // ========== Admin Settings Tests ==========

  it("should list users (Admin only)", async () => {
    const result = await caller.adminSettings.listUsers({ limit: 10, offset: 0 });
    expect(result).toHaveProperty("users");
    expect(result).toHaveProperty("total");
    expect(Array.isArray(result.users)).toBe(true);
  });

  it("should reject listUsers for non-admin", async () => {
    await expect(
      staffCaller.adminSettings.listUsers({ limit: 10, offset: 0 })
    ).rejects.toThrow("僅管理員可查看使用者列表");
  });

  it("should get audit logs (Admin only)", async () => {
    const result = await caller.adminSettings.getAuditLogs({ limit: 10, offset: 0 });
    expect(result).toHaveProperty("logs");
    expect(result).toHaveProperty("total");
    expect(Array.isArray(result.logs)).toBe(true);
  });

  it("should get audit stats (Admin only)", async () => {
    const result = await caller.adminSettings.getAuditStats();
    expect(result).toHaveProperty("total");
    expect(result).toHaveProperty("recentTrend");
    expect(result).toHaveProperty("actionDistribution");
    expect(Array.isArray(result.recentTrend)).toBe(true);
    expect(Array.isArray(result.actionDistribution)).toBe(true);
  });

  // ========== Review Center Tests ==========

  it("should get audit history (Admin only)", async () => {
    const result = await caller.reviewCenter.getAuditHistory({ limit: 10, offset: 0 });
    expect(result).toHaveProperty("logs");
    expect(result).toHaveProperty("total");
    expect(Array.isArray(result.logs)).toBe(true);
  });

  it("should get review stats (Admin only)", async () => {
    const result = await caller.reviewCenter.getReviewStats();
    expect(result).toHaveProperty("total");
    expect(result).toHaveProperty("pending");
    expect(result).toHaveProperty("approved");
    expect(result).toHaveProperty("rejected");
    expect(result).toHaveProperty("approvalRate");
    expect(result).toHaveProperty("recentTrend");
    expect(result).toHaveProperty("topRejectReasons");
    expect(typeof result.recentTrend).toBe("object");
    expect(Array.isArray(result.topRejectReasons)).toBe(true);
  });

  it("should reject getAuditHistory for non-admin", async () => {
    await expect(
      staffCaller.reviewCenter.getAuditHistory({ limit: 10, offset: 0 })
    ).rejects.toThrow("僅管理員可查看審核歷史");
  });

  it("should reject getReviewStats for non-admin", async () => {
    await expect(
      staffCaller.reviewCenter.getReviewStats()
    ).rejects.toThrow("僅管理員可查看審核統計");
  });
});
