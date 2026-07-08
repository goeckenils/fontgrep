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
  real_family: string | null;
  weight: number | null;
  style: string | null;
  is_variable: number | null;
  designer: string | null;
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
      downloaded_at TEXT NOT NULL DEFAULT (datetime('now')),
      real_family TEXT,
      weight INTEGER,
      style TEXT,
      is_variable INTEGER,
      designer TEXT
    );
    CREATE TABLE IF NOT EXISTS api_cache (
      cache_key TEXT PRIMARY KEY,
      response_json TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_fonts_family ON fonts(family);
  `);
  // Migrations (idempotent).
  const cols = db.prepare("PRAGMA table_info(fonts)").all() as { name: string }[];
  const has = (n: string) => cols.some((c) => c.name === n);
  if (!has("public_path")) db.exec("ALTER TABLE fonts ADD COLUMN public_path TEXT");
  if (!has("real_family")) db.exec("ALTER TABLE fonts ADD COLUMN real_family TEXT");
  if (!has("weight")) db.exec("ALTER TABLE fonts ADD COLUMN weight INTEGER");
  if (!has("style")) db.exec("ALTER TABLE fonts ADD COLUMN style TEXT");
  if (!has("is_variable")) db.exec("ALTER TABLE fonts ADD COLUMN is_variable INTEGER");
  if (!has("designer")) db.exec("ALTER TABLE fonts ADD COLUMN designer TEXT");
  return db;
}

export function getFontsBySourceUrl(sourceUrl: string): FontRow | undefined {
  return getDb().prepare("SELECT * FROM fonts WHERE source_url = ?").get(sourceUrl) as
    | FontRow
    | undefined;
}

export interface InsertFontRow {
  family: string;
  source_url: string;
  local_path: string;
  public_path: string | null;
  format: string;
  license: string | null;
  real_family?: string | null;
  weight?: number | null;
  style?: string | null;
  is_variable?: boolean | null;
  designer?: string | null;
}

export function insertFont(row: InsertFontRow): FontRow {
  const { is_variable: _iv, ...rest } = row;
  void _iv;
  const info = getDb()
    .prepare(
      `INSERT INTO fonts (family, source_url, local_path, public_path, format, license, real_family, weight, style, is_variable, designer)
       VALUES (@family, @source_url, @local_path, @public_path, @format, @license, @real_family, @weight, @style, @is_variable, @designer)`
    )
    .run(row);
  return {
    id: Number(info.lastInsertRowid),
    downloaded_at: new Date().toISOString(),
    real_family: row.real_family ?? null,
    weight: row.weight ?? null,
    style: row.style ?? null,
    is_variable:
      row.is_variable == null ? null : row.is_variable ? 1 : 0,
    designer: row.designer ?? null,
    ...rest,
  };
}

export function getAllFonts(): FontRow[] {
  return getDb().prepare("SELECT * FROM fonts ORDER BY downloaded_at DESC").all() as FontRow[];
}

export function getFontById(id: number): FontRow | undefined {
  return getDb().prepare("SELECT * FROM fonts WHERE id = ?").get(id) as FontRow | undefined;
}

/** Delete a font row; returns the local file path so the caller can remove the file. */
export function deleteFont(id: number): { local_path: string; public_path: string | null } | null {
  const row = getDb()
    .prepare("SELECT local_path, public_path FROM fonts WHERE id = ?")
    .get(id) as { local_path: string; public_path: string | null } | undefined;
  if (!row) return null;
  getDb().prepare("DELETE FROM fonts WHERE id = ?").run(id);
  return row;
}

export function setFontMetadata(
  id: number,
  meta: {
    real_family?: string | null;
    weight?: number | null;
    style?: string | null;
    is_variable?: boolean | null;
    designer?: string | null;
  }
): void {
  getDb()
    .prepare(
      `UPDATE fonts SET real_family=@real_family, weight=@weight, style=@style, is_variable=@is_variable, designer=@designer WHERE id=@id`
    )
    .run({ id, ...meta });
}
