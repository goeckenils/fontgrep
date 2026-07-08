import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";

const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "fontgrep.db");
export const FONTS_DIR_PATH = path.join(process.cwd(), "public", "fonts");

let db: Database.Database | null = null;

export interface FontRow {
  id: number;
  family: string;
  source_url: string;
  local_path: string;
  public_path: string | null;
  format: string;
  license: string | null;
  downloaded_at: string;
}

function ensureDirs() {
  fs.mkdirSync(DB_DIR, { recursive: true });
  fs.mkdirSync(FONTS_DIR_PATH, { recursive: true });
}

export function getDb(): Database.Database {
  if (db) return db;
  ensureDirs();
  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS fonts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      family TEXT NOT NULL,
      source_url TEXT NOT NULL UNIQUE,
      local_path TEXT NOT NULL,
      public_path TEXT,
      format TEXT NOT NULL,
      license TEXT,
      downloaded_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_fonts_family ON fonts(family);
  `);
  // Migration: add public_path column if missing (idempotent).
  const cols = db.prepare("PRAGMA table_info(fonts)").all() as { name: string }[];
  if (!cols.some((c) => c.name === "public_path")) {
    db.exec("ALTER TABLE fonts ADD COLUMN public_path TEXT");
  }
  return db;
}

export function getFontsBySourceUrl(sourceUrl: string): FontRow | undefined {
  return getDb().prepare("SELECT * FROM fonts WHERE source_url = ?").get(sourceUrl) as
    | FontRow
    | undefined;
}

export function insertFont(row: Omit<FontRow, "id" | "downloaded_at">): FontRow {
  const info = getDb()
    .prepare(
      `INSERT INTO fonts (family, source_url, local_path, public_path, format, license)
       VALUES (@family, @source_url, @local_path, @public_path, @format, @license)`
    )
    .run(row);
  return { id: Number(info.lastInsertRowid), downloaded_at: new Date().toISOString(), ...row };
}

export function getAllFonts(): FontRow[] {
  return getDb().prepare("SELECT * FROM fonts ORDER BY downloaded_at DESC").all() as FontRow[];
}

export function getFontById(id: number): FontRow | undefined {
  return getDb().prepare("SELECT * FROM fonts WHERE id = ?").get(id) as FontRow | undefined;
}
