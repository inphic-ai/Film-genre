import { describe, it, expect, beforeAll } from 'vitest';
import * as db from './db';
import { appRouter } from './routers';

describe('Video Duplicate Detection', () => {
  let testVideoId: number;
  let testVideoUrl: string;
  let mockAdminContext: any;

  beforeAll(async () => {
    // Create test admin user
    await db.upsertUser({
      openId: 'test-admin-duplicate',
      name: 'Test Admin',
      email: 'admin-duplicate@test.com',
      role: 'admin',
    });

    const adminUser = await db.getUserByOpenId('test-admin-duplicate');
    if (!adminUser) throw new Error('Failed to create test admin user');

    mockAdminContext = {
      user: adminUser,
      req: {} as any,
      res: {} as any,
    };

    // Create a test video
    testVideoUrl = `https://www.youtube.com/watch?v=test-duplicate-${Date.now()}`;
    const video = await appRouter.createCaller(mockAdminContext).videos.create({
      title: 'Test Video for Duplicate Detection',
      description: 'This video is used to test duplicate detection',
      platform: 'youtube',
      videoUrl: testVideoUrl,
      category: 'product_intro',
      shareStatus: 'private',
    });
    testVideoId = video.id;
  });

  it('should detect duplicate video by URL', async () => {
    const caller = appRouter.createCaller(mockAdminContext);
    const result = await caller.videos.checkDuplicate({ videoUrl: testVideoUrl });

    expect(result.isDuplicate).toBe(true);
    expect(result.video).toBeDefined();
    expect(result.video?.id).toBe(testVideoId);
    expect(result.video?.videoUrl).toBe(testVideoUrl);
  });

  it('should return false for non-existent video URL', async () => {
    const caller = appRouter.createCaller(mockAdminContext);
    const nonExistentUrl = `https://www.youtube.com/watch?v=non-existent-${Date.now()}`;
    const result = await caller.videos.checkDuplicate({ videoUrl: nonExistentUrl });

    expect(result.isDuplicate).toBe(false);
    expect(result.video).toBeNull();
  });

  it('should return existing video details when duplicate', async () => {
    const caller = appRouter.createCaller(mockAdminContext);
    const result = await caller.videos.checkDuplicate({ videoUrl: testVideoUrl });

    expect(result.isDuplicate).toBe(true);
    expect(result.video).toBeDefined();
    expect(result.video?.title).toBe('Test Video for Duplicate Detection');
    expect(result.video?.platform).toBe('youtube');
    expect(result.video?.category).toBe('product_intro');
  });

  it('should require admin role', async () => {
    // Create a staff user
    await db.upsertUser({
      openId: 'test-staff-duplicate',
      name: 'Test Staff',
      email: 'staff-duplicate@test.com',
      role: 'staff',
    });

    const staffUser = await db.getUserByOpenId('test-staff-duplicate');
    if (!staffUser) throw new Error('Failed to create test staff user');

    const mockStaffContext = {
      user: staffUser,
      req: {} as any,
      res: {} as any,
    };

    const caller = appRouter.createCaller(mockStaffContext);

    await expect(
      caller.videos.checkDuplicate({ videoUrl: testVideoUrl })
    ).rejects.toThrow('Unauthorized');
  });
});
