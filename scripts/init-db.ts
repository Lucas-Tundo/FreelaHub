import fs from "node:fs";
import path from "node:path";

import { closeDb, getDb, runMigrations } from "@/lib/db";

function main(): void {
  runMigrations();
  const db = getDb();

  db.exec("DELETE FROM proposals");
  db.exec("DELETE FROM tracking");
  db.exec("DELETE FROM opportunities");
  db.exec("DELETE FROM activity_log");

  const seed = fs.readFileSync(path.join(process.cwd(), "db", "seed.sql"), "utf-8");
  db.exec(seed);

  const dbPath =
    process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "freelaboard.db");

  console.log("Banco inicializado em:", dbPath);
  closeDb();
}

main();
