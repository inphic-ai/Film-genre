import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import { users, videos, timelineNotes } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Review Center - Timeline Notes Approval System", () => {
  let testUserId: number;
  let testVideoId: number;
  let testNoteId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create test user (admin)
    const [user] = await db
      .insert(users)
      .values({
        openId: `test-admin-${Date.now()}`,
        name: "Test Admin",
        email: `test-admin-${Date.now()}@example.com`,
        role: "admin",
      })
      .returning();
    testUserId = user.id;

    // Create test video
    const [video] = await db
      .insert(videos)
      .values({
        title: "Test Video for Review",
        videoUrl: "https://www.youtube.com/watch?v=test123",
        platform: "youtube",
        category: "other", // Required field
        shareStatus: "private",
      })
      .returning();
    testVideoId = video.id;

    // Create test timeline note (PENDING status)
    const [note] = await db
      .insert(timelineNotes)
      .values({
        videoId: testVideoId,
        userId: testUserId,
        timeSeconds: 60,
        content: "Test note for review approval",
        status: "PENDING",
      })
      .returning();
    testNoteId = note.id;
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;

    // Cleanup: delete test data
    if (testNoteId) {
      await db.delete(timelineNotes).where(eq(timelineNotes.id, testNoteId));
    }
    if (testVideoId) {
      await db.delete(videos).where(eq(videos.id, testVideoId));
    }
    if (testUserId) {
      await db.delete(users).where(eq(users.id, testUserId));
    }
  });

  it("should list pending timeline notes", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const notes = await db
      .select()
      .from(timelineNotes)
      .where(eq(timelineNotes.status, "PENDING"));

    expect(notes.length).toBeGreaterThan(0);
    const testNote = notes.find((n) => n.id === testNoteId);
    expect(testNote).toBeDefined();
    expect(testNote?.status).toBe("PENDING");
  });

  it("should approve a timeline note", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Approve the note
    await db
      .update(timelineNotes)
      .set({ status: "APPROVED", updatedAt: new Date() })
      .where(eq(timelineNotes.id, testNoteId));

    // Verify status changed
    const [note] = await db
      .select()
      .from(timelineNotes)
      .where(eq(timelineNotes.id, testNoteId));

    expect(note.status).toBe("APPROVED");
  });

  it("should reject a timeline note with reason", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const rejectReason = "Content does not meet guidelines";

    // Reject the note
    await db
      .update(timelineNotes)
      .set({
        status: "REJECTED",
        rejectReason,
        updatedAt: new Date(),
      })
      .where(eq(timelineNotes.id, testNoteId));

    // Verify status and reason
    const [note] = await db
      .select()
      .from(timelineNotes)
      .where(eq(timelineNotes.id, testNoteId));

    expect(note.status).toBe("REJECTED");
    expect(note.rejectReason).toBe(rejectReason);
  });

  it("should batch approve multiple notes", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create multiple test notes
    const noteIds: number[] = [];
    for (let i = 0; i < 3; i++) {
      const [note] = await db
        .insert(timelineNotes)
        .values({
          videoId: testVideoId,
          userId: testUserId,
          timeSeconds: 60 + i * 10,
          content: `Batch test note ${i}`,
          status: "PENDING",
        })
        .returning();
      noteIds.push(note.id);
    }

    // Batch approve
    await db
      .update(timelineNotes)
      .set({ status: "APPROVED", updatedAt: new Date() })
      .where(eq(timelineNotes.videoId, testVideoId));

    // Verify all notes are approved
    const notes = await db
      .select()
      .from(timelineNotes)
      .where(eq(timelineNotes.videoId, testVideoId));

    const approvedCount = notes.filter((n) => n.status === "APPROVED").length;
    expect(approvedCount).toBeGreaterThanOrEqual(3);

    // Cleanup batch test notes
    for (const id of noteIds) {
      await db.delete(timelineNotes).where(eq(timelineNotes.id, id));
    }
  });

  it("should filter notes by status", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create notes with different statuses
    const [pendingNote] = await db
      .insert(timelineNotes)
      .values({
        videoId: testVideoId,
        userId: testUserId,
        timeSeconds: 100,
        content: "Pending note",
        status: "PENDING",
      })
      .returning();

    const [approvedNote] = await db
      .insert(timelineNotes)
      .values({
        videoId: testVideoId,
        userId: testUserId,
        timeSeconds: 110,
        content: "Approved note",
        status: "APPROVED",
      })
      .returning();

    // Filter by PENDING
    const pendingNotes = await db
      .select()
      .from(timelineNotes)
      .where(eq(timelineNotes.status, "PENDING"));

    expect(pendingNotes.some((n) => n.id === pendingNote.id)).toBe(true);
    expect(pendingNotes.some((n) => n.id === approvedNote.id)).toBe(false);

    // Cleanup
    await db.delete(timelineNotes).where(eq(timelineNotes.id, pendingNote.id));
    await db.delete(timelineNotes).where(eq(timelineNotes.id, approvedNote.id));
  });
});
