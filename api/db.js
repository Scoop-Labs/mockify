import Database from 'better-sqlite3';
import path from 'path';

const isVercel = process.env.VERCEL || process.env.NOW_BUILDER;
const dbDir = isVercel ? '/tmp' : process.cwd();
const dbPath = path.resolve(dbDir, 'mockify.db');
const db = new Database(dbPath);

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS InterviewLinks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    candidate_id TEXT,
    candidate_email TEXT,
    role TEXT,
    experience TEXT,
    token TEXT UNIQUE,
    is_enabled INTEGER DEFAULT 1,
    expires_at TEXT,
    interview_status TEXT DEFAULT 'pending',
    link_type TEXT DEFAULT 'individual',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS AuditLogs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token TEXT,
    candidate_email TEXT,
    access_time TEXT DEFAULT CURRENT_TIMESTAMP,
    ip_address TEXT,
    browser TEXT,
    status_checked TEXT,
    result_score INTEGER
  );

  CREATE TABLE IF NOT EXISTS SimulatedGoogleSheet (
    token TEXT PRIMARY KEY,
    mode INTEGER DEFAULT 1
  );
`);

export default db;
