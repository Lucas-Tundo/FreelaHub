import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

let db: Database.Database | null = null;
let migrationsApplied = false;

function getDatabasePath(): string {
  return process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "freelaboard.db");
}

function columnExists(
  database: Database.Database,
  table: string,
  column: string,
): boolean {
  const columns = database
    .prepare(`PRAGMA table_info(${table})`)
    .all() as Array<{ name: string }>;

  return columns.some((entry) => entry.name === column);
}

function tableExists(database: Database.Database, table: string): boolean {
  const row = database
    .prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = @table",
    )
    .get({ table }) as { name: string } | undefined;

  return Boolean(row);
}

function runSqlStatements(database: Database.Database, sql: string): void {
  const statements = sql
    .split(";")
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0);

  for (const statement of statements) {
    try {
      database.exec(`${statement};`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro de migração";
      if (!message.includes("duplicate column name")) {
        throw error;
      }
    }
  }
}

function applyIncrementalMigrations(database: Database.Database): void {
  if (migrationsApplied) return;

  if (
    tableExists(database, "opportunities") &&
    !columnExists(database, "opportunities", "kind")
  ) {
    const migrationPath = path.join(
      process.cwd(),
      "db",
      "migrations",
      "002_vagas.sql",
    );
    const migration = fs.readFileSync(migrationPath, "utf-8");
    runSqlStatements(database, migration);
  }

  if (tableExists(database, "opportunities")) {
    database.exec(
      "CREATE INDEX IF NOT EXISTS idx_opportunities_kind ON opportunities(kind)",
    );
  }

  migrationsApplied = true;
}

export function getDb(): Database.Database {
  if (db) return db;

  const dbPath = getDatabasePath();
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  return db;
}

export function runMigrations(): void {
  const database = getDb();
  const schemaPath = path.join(process.cwd(), "db", "schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf-8");
  database.exec(schema);
  applyIncrementalMigrations(database);
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
    migrationsApplied = false;
  }
}
