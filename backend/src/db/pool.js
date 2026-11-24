// Uses Node.js built-in SQLite (node:sqlite) — available since Node 22.5+
// No compilation or extra packages needed!
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
require('dotenv').config();

// Always resolve relative to the backend root folder, not the cwd
const dbFile = path.resolve(__dirname, '../../../dev.sqlite');
const db = new DatabaseSync(dbFile);

// Performance pragmas
db.exec(`PRAGMA journal_mode = WAL`);
db.exec(`PRAGMA foreign_keys = ON`);

/**
 * pg-compatible async query wrapper so all controllers work unchanged.
 * node:sqlite is synchronous under the hood — we just wrap in Promise.
 */
const pool = {
  query: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      try {
        const trimmed = sql.trim().toUpperCase();
        const isSelect = trimmed.startsWith('SELECT') || trimmed.startsWith('WITH');
        const stmt = db.prepare(sql);

        if (isSelect) {
          const rows = stmt.all(...params);
          resolve({ rows });
        } else {
          const info = stmt.run(...params);
          resolve({ rows: [], rowCount: info.changes, lastID: info.lastInsertRowid });
        }
      } catch (err) {
        reject(err);
      }
    });
  },

  // Fake pg-style connect() for controllers that use BEGIN/COMMIT pattern
  connect: () => Promise.resolve({
    query: (sql, params = []) => pool.query(sql, params),
    release: () => {},
  }),
};

// Export raw db handle for initSqlite / seedDemo
module.exports = pool;
module.exports.db = db;
