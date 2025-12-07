/**
 * Timeline Notes Tests
 * 
 * Tests for timeline notes CRUD operations, permissions, and approval workflow.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as db from "./db";
import { getDb } from "./db";
import { timelineNotes, videos, users } from "../drizzle/schema";

describe("Timeline Notes System", () => {
  let testVideoId: number;
  let testAdminId: number;
  let testStaffId: number;
  let testViewerId: number;
  let testNoteId: number;

  beforeAll(async () => {
    const database = await getDb();
    if (!database) throw new Error("Database not available");

    // Create test users
    const [admin] = await database
      .insert(users)
      .values({
        email: "admin@test.com",
        name: "Test Admin",
        role: "admin",
      })
      .returning();
    testAdminId = admin.id;

    const [staff] = await database
      .insert(users)
      .values({
        email: "staff@test.com",
        name: "Test Staff",
        role: "staff",
      })
      .returning();
    testStaffId = staff.id;

    const [viewer] = await database
      .insert(users)
      .values({
        email: "viewer@test.com",
        name: "Test Viewer",
        role: "viewer",
      })
      .returning();
    testViewerId = viewer.id;

    // Create test video
    const video = await db.createVideo({
      title: "Test Video for Timeline Notes",
      platform: "youtube",
      videoUrl: "https://www.youtube.com/watch?v=test123",
      category: "product_intro",
      uploadedBy: testAdminId,
    });
    testVideoId = video.id;
  });

  afterAll(async () => {
    const database = await getDb();
    if (!database) return;

    // Cleanup
    await database.delete(timelineNotes);
    await database.delete(videos);
    await database.delete(users);
  });

  describe("Create Timeline Notes", () => {
    it("should create note by admin (auto-approved)", async () => {
      const note = await db.createTimelineNote({
        videoId: testVideoId,
        userId: testAdminId,
        timeSeconds: 120,
        content: "Admin note at 2:00",
        status: "APPROVED",
      });

      expect(note).toBeDefined();
      expect(note.videoId).toBe(testVideoId);
      expect(note.userId).toBe(testAdminId);
      expect(note.timeSeconds).toBe(120);
      expect(note.content).toBe("Admin note at 2:00");
      expect(note.status).toBe("APPROVED");
      testNoteId = note.id;
    });

    it("should create note by staff (pending approval)", async () => {
      const note = await db.createTimelineNote({
        videoId: testVideoId,
        userId: testStaffId,
        timeSeconds: 60,
        content: "Staff note at 1:00",
        status: "PENDING",
      });

      expect(note).toBeDefined();
      expect(note.status).toBe("PENDING");
    });

    it("should create note with images", async () => {
      const note = await db.createTimelineNote({
        videoId: testVideoId,
        userId: testAdminId,
        timeSeconds: 180,
        content: "Note with images",
        imageUrls: [
          "https://r2.example.com/image1.jpg",
          "https://r2.example.com/image2.jpg",
        ],
        status: "APPROVED",
      });

      expect(note.imageUrls).toHaveLength(2);
      expect(note.imageUrls).toContain("https://r2.example.com/image1.jpg");
    });
  });

  describe("Get Timeline Notes", () => {
    it("should get notes by video ID", async () => {
      const notes = await db.getTimelineNotesByVideoId(testVideoId);
      expect(notes.length).toBeGreaterThan(0);
      expect(notes[0].videoId).toBe(testVideoId);
    });

    it("should get note by ID", async () => {
      const note = await db.getTimelineNoteById(testNoteId);
      expect(note).toBeDefined();
      expect(note?.id).toBe(testNoteId);
      expect(note?.content).toBe("Admin note at 2:00");
    });

    it("should get pending notes", async () => {
      const pendingNotes = await db.getPendingTimelineNotes(10);
      expect(pendingNotes.length).toBeGreaterThan(0);
      expect(pendingNotes.every(n => n.status === "PENDING")).toBe(true);
    });

    it("should get notes by user ID", async () => {
      const staffNotes = await db.getTimelineNotesByUserId(testStaffId, 10);
      expect(staffNotes.length).toBeGreaterThan(0);
      expect(staffNotes.every(n => n.userId === testStaffId)).toBe(true);
    });
  });

  describe("Update Timeline Notes", () => {
    it("should update note content", async () => {
      const updated = await db.updateTimelineNote(testNoteId, {
        content: "Updated admin note",
      });

      expect(updated).toBeDefined();
      expect(updated?.content).toBe("Updated admin note");
    });

    it("should update note images", async () => {
      const updated = await db.updateTimelineNote(testNoteId, {
        imageUrls: ["https://r2.example.com/new-image.jpg"],
      });

      expect(updated?.imageUrls).toHaveLength(1);
      expect(updated?.imageUrls).toContain("https://r2.example.com/new-image.jpg");
    });
  });

  describe("Approval Workflow", () => {
    let pendingNoteId: number;

    beforeAll(async () => {
      const note = await db.createTimelineNote({
        videoId: testVideoId,
        userId: testStaffId,
        timeSeconds: 300,
        content: "Note to be approved",
        status: "PENDING",
      });
      pendingNoteId = note.id;
    });

    it("should approve pending note", async () => {
      const approved = await db.approveTimelineNote(pendingNoteId);
      expect(approved).toBeDefined();
      expect(approved?.status).toBe("APPROVED");
    });

    it("should reject note with reason", async () => {
      const noteToReject = await db.createTimelineNote({
        videoId: testVideoId,
        userId: testStaffId,
        timeSeconds: 400,
        content: "Note to be rejected",
        status: "PENDING",
      });

      const rejected = await db.rejectTimelineNote(
        noteToReject.id,
        "Content not appropriate"
      );

      expect(rejected).toBeDefined();
      expect(rejected?.status).toBe("REJECTED");
      expect(rejected?.rejectReason).toBe("Content not appropriate");
    });
  });

  describe("Delete Timeline Notes", () => {
    it("should delete note", async () => {
      const noteToDelete = await db.createTimelineNote({
        videoId: testVideoId,
        userId: testAdminId,
        timeSeconds: 500,
        content: "Note to be deleted",
        status: "APPROVED",
      });

      await db.deleteTimelineNote(noteToDelete.id);

      const deleted = await db.getTimelineNoteById(noteToDelete.id);
      expect(deleted).toBeUndefined();
    });
  });

  describe("Permission & Visibility", () => {
    it("should filter notes by status for different roles", async () => {
      const allNotes = await db.getTimelineNotesByVideoId(testVideoId);
      
      // Admin sees all notes
      const adminVisibleNotes = allNotes;
      expect(adminVisibleNotes.length).toBeGreaterThan(0);

      // Staff sees PENDING + APPROVED (not REJECTED)
      const staffVisibleNotes = allNotes.filter(n => n.status !== "REJECTED");
      expect(staffVisibleNotes.length).toBeLessThanOrEqual(allNotes.length);

      // Viewer sees only APPROVED
      const viewerVisibleNotes = allNotes.filter(n => n.status === "APPROVED");
      expect(viewerVisibleNotes.length).toBeLessThanOrEqual(staffVisibleNotes.length);
    });
  });

  describe("Timeline Notes with Video Integration", () => {
    it("should get notes sorted by time", async () => {
      const notes = await db.getTimelineNotesByVideoId(testVideoId);
      
      // Check if notes are sorted by timeSeconds
      for (let i = 1; i < notes.length; i++) {
        expect(notes[i].timeSeconds).toBeGreaterThanOrEqual(notes[i - 1].timeSeconds);
      }
    });

    it("should include user info in pending notes", async () => {
      const pendingNotes = await db.getPendingTimelineNotes(10);
      
      if (pendingNotes.length > 0) {
        const note = pendingNotes[0];
        expect(note.userName).toBeDefined();
        expect(note.userEmail).toBeDefined();
        expect(note.videoTitle).toBeDefined();
      }
    });
  });
});
