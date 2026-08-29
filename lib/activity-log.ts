import { getDb, runMigrations } from "@/lib/db";

export type ActivityLevel = "info" | "warn" | "error";

export interface ActivityLogEntry {
  id: number;
  platform: string | null;
  level: ActivityLevel;
  message: string;
  metadata: string;
  created_at: string;
}

export function logActivity(
  platform: string | null,
  level: ActivityLevel,
  message: string,
  metadata: Record<string, unknown> = {},
): void {
  runMigrations();
  const db = getDb();

  db.prepare(
    `INSERT INTO activity_log (platform, level, message, metadata)
     VALUES (@platform, @level, @message, @metadata)`,
  ).run({
    platform,
    level,
    message,
    metadata: JSON.stringify(metadata),
  });
}

export function getRecentActivity(limit = 20): ActivityLogEntry[] {
  runMigrations();
  const db = getDb();

  return db
    .prepare(
      `SELECT id, platform, level, message, metadata, created_at
       FROM activity_log
       ORDER BY created_at DESC
       LIMIT @limit`,
    )
    .all({ limit }) as ActivityLogEntry[];
}

export function getRecentErrors(limit = 5): ActivityLogEntry[] {
  runMigrations();
  const db = getDb();

  return db
    .prepare(
      `SELECT id, platform, level, message, metadata, created_at
       FROM activity_log
       WHERE level = 'error'
       ORDER BY created_at DESC
       LIMIT @limit`,
    )
    .all({ limit }) as ActivityLogEntry[];
}
