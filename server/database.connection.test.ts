/**
 * Database Connection Test
 * 
 * Validates CUSTOM_DATABASE_URL connects to Railway PostgreSQL correctly.
 */

import { describe, it, expect } from "vitest";
import { getDb } from "./db";

describe("Railway PostgreSQL Connection", () => {
  it("should connect to PostgreSQL (not TiDB)", async () => {
    const db = await getDb();
    expect(db).toBeDefined();
    expect(db).not.toBeNull();
  });

  it("should query PostgreSQL version", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const result = await db.execute("SELECT version() as version");
    const version = (result.rows[0] as any).version;

    expect(version).toBeDefined();
    expect(version).toContain("PostgreSQL");
    expect(version).not.toContain("MySQL");
    expect(version).not.toContain("TiDB");
  });

  it("should have timeline_notes table", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const result = await db.execute(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'timeline_notes'
    `);

    expect(result.rows.length).toBe(1);
    expect((result.rows[0] as any).table_name).toBe("timeline_notes");
  });

  it("should have all required tables", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const result = await db.execute(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    const tableNames = result.rows.map((row: any) => row.table_name);
    const requiredTables = [
      "categories",
      "tags",
      "timeline_notes",
      "users",
      "video_tags",
      "videos",
    ];

    requiredTables.forEach(tableName => {
      expect(tableNames).toContain(tableName);
    });
  });
});
