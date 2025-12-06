import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

function createPublicContext(): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: undefined,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("videos router", () => {
  it("should list all categories (public access)", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const categories = await caller.categories.list();

    expect(categories).toBeDefined();
    expect(Array.isArray(categories)).toBe(true);
    expect(categories.length).toBeGreaterThan(0);
  });

  it("should list YouTube videos (public access)", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const videos = await caller.videos.listYouTube();

    expect(videos).toBeDefined();
    expect(Array.isArray(videos)).toBe(true);
    // All videos should be YouTube platform
    videos.forEach(video => {
      expect(video.platform).toBe('youtube');
    });
  });

  it("should require admin role to list all videos", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.videos.listAll()).rejects.toThrow();
  });

  it("should allow admin to list all videos", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const videos = await caller.videos.listAll();

    expect(videos).toBeDefined();
    expect(Array.isArray(videos)).toBe(true);
  });

  it("should require admin role to create video", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.videos.create({
        title: "Test Video",
        platform: "youtube",
        videoUrl: "https://youtube.com/watch?v=test",
        category: "product_intro",
      })
    ).rejects.toThrow();
  });
});
