import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import Database from 'better-sqlite3';

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'server', 'data', 'signal-board.sqlite');
const MIGRATIONS_DIR = path.join(process.cwd(), 'server', 'migrations');

function readSql(fileName) {
  return fs.readFileSync(path.join(MIGRATIONS_DIR, fileName), 'utf8');
}

export function createDb() {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma('foreign_keys = ON');
  db.exec(readSql('001_init.sql'));
  return db;
}

export function makeId(prefix) {
  return `${prefix}_${crypto.randomUUID()}`;
}

export function nowTs() {
  return Date.now();
}

export function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || `org-${Math.random().toString(36).slice(2, 8)}`;
}

export { DB_PATH };
