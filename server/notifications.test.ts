import { describe, it, expect } from "vitest";
import * as db from "./db";

// Use existing test user ID (assuming user ID 1 exists in the database)
const TEST_USER_ID = 1;

describe("Notifications System", () => {

  describe("Notification Creation", () => {
    it("should create a notification successfully", async () => {
      const notification = await db.createNotification({
        userId: TEST_USER_ID,
        type: "SYSTEM_ANNOUNCEMENT",
        title: "Test Notification",
        content: "This is a test notification",
      });

      expect(notification).toBeDefined();
      expect(notification.id).toBeGreaterThan(0);
      expect(notification.userId).toBe(TEST_USER_ID);
      expect(notification.type).toBe("SYSTEM_ANNOUNCEMENT");
      expect(notification.title).toBe("Test Notification");
      expect(notification.isRead).toBe(false);

      // Cleanup
      await db.deleteNotification(notification.id, TEST_USER_ID);
    });
  });

  describe("Notification Retrieval", () => {
    it("should get user notifications", async () => {
      const notifications = await db.getNotifications(TEST_USER_ID, 10, 0);

      expect(notifications).toBeDefined();
      expect(Array.isArray(notifications)).toBe(true);
    });

    it("should get unread notifications count", async () => {
      const count = await db.getUnreadNotificationsCount(TEST_USER_ID);

      expect(typeof count).toBe("number");
      expect(count).toBeGreaterThanOrEqual(0);
    });

    it("should get total notifications count", async () => {
      const count = await db.getNotificationsCount(TEST_USER_ID);

      expect(typeof count).toBe("number");
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Notification Status Management", () => {
    it("should mark notification as read", async () => {
      // Create a test notification
      const notification = await db.createNotification({
        userId: TEST_USER_ID,
        type: "SYSTEM_ANNOUNCEMENT",
        title: "Test Notification for Status",
      });

      await db.markNotificationAsRead(notification.id, TEST_USER_ID);

      const notifications = await db.getNotifications(TEST_USER_ID, 10, 0);
      const updatedNotification = notifications.find((n) => n.id === notification.id);

      expect(updatedNotification?.isRead).toBe(true);

      // Cleanup
      await db.deleteNotification(notification.id, TEST_USER_ID);
    });
  });
});
