// SQLite schema + seed for local dev (uses built-in node:sqlite)
const { db } = require('./pool');
const { v4: uuidv4 } = require('./uuid');

function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS complaint_categories (
      id       INTEGER PRIMARY KEY AUTOINCREMENT,
      name     TEXT UNIQUE NOT NULL,
      priority TEXT NOT NULL DEFAULT 'medium'
    );

    CREATE TABLE IF NOT EXISTS maintenance_staff (
      id             TEXT PRIMARY KEY,
      user_id        TEXT NOT NULL UNIQUE,
      employee_id    TEXT UNIQUE NOT NULL,
      full_name      TEXT NOT NULL,
      phone          TEXT,
      email          TEXT UNIQUE NOT NULL,
      category       TEXT NOT NULL,
      assigned_block TEXT,
      is_available   INTEGER NOT NULL DEFAULT 1,
      is_active      INTEGER NOT NULL DEFAULT 1,
      created_at     TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS complaints (
      id           TEXT PRIMARY KEY,
      student_id   TEXT NOT NULL,
      room_id      TEXT NOT NULL,
      hostel_id    TEXT NOT NULL,
      block        TEXT,
      floor        TEXT,
      category_id  INTEGER NOT NULL REFERENCES complaint_categories(id),
      title        TEXT NOT NULL,
      description  TEXT NOT NULL,
      priority     TEXT NOT NULL DEFAULT 'medium',
      status       TEXT NOT NULL DEFAULT 'Pending',
      images       TEXT DEFAULT '[]',
      submitted_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS complaint_assignments (
      id           TEXT PRIMARY KEY,
      complaint_id TEXT NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
      staff_id     TEXT NOT NULL REFERENCES maintenance_staff(id),
      assigned_by  TEXT NOT NULL,
      assigned_at  TEXT NOT NULL DEFAULT (datetime('now')),
      deadline     TEXT,
      is_active    INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS complaint_status_logs (
      id           TEXT PRIMARY KEY,
      complaint_id TEXT NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
      changed_by   TEXT NOT NULL,
      role         TEXT NOT NULL,
      old_status   TEXT,
      new_status   TEXT NOT NULL,
      note         TEXT,
      changed_at   TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS staff_notifications (
      id           TEXT PRIMARY KEY,
      staff_id     TEXT NOT NULL REFERENCES maintenance_staff(id) ON DELETE CASCADE,
      type         TEXT NOT NULL,
      title        TEXT NOT NULL,
      message      TEXT NOT NULL,
      complaint_id TEXT REFERENCES complaints(id),
      is_read      INTEGER NOT NULL DEFAULT 0,
      created_at   TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Seed complaint categories
  const cats = [
    ['Electrical','high'], ['Plumbing','high'], ['Carpentry','medium'],
    ['Housekeeping','low'], ['Internet / Wi-Fi','medium'],
    ['Pest Control','medium'], ['Civil Work','high'], ['Other','low'],
  ];
  const insertCat = db.prepare(`INSERT OR IGNORE INTO complaint_categories (name, priority) VALUES (?, ?)`);
  for (const [name, priority] of cats) insertCat.run(name, priority);

  // Seed demo staff accounts
  const demoStaff = [
    { id: uuidv4(), user_id: 'user-staff-001', employee_id: 'EMP001',
      full_name: 'Ravi Kumar',     phone: '9876543210', email: 'ravi.kumar@shrams.in',  category: 'Electrical', assigned_block: 'Block A' },
    { id: uuidv4(), user_id: 'user-staff-002', employee_id: 'EMP002',
      full_name: 'Suresh Plumber', phone: '9876543211', email: 'suresh.p@shrams.in',    category: 'Plumbing',   assigned_block: 'Block B' },
    { id: uuidv4(), user_id: 'user-staff-003', employee_id: 'EMP003',
      full_name: 'Mohan Carpenter',phone: '9876543212', email: 'mohan.c@shrams.in',     category: 'Carpentry',  assigned_block: null },
  ];
  const insertStaff = db.prepare(`
    INSERT OR IGNORE INTO maintenance_staff
      (id, user_id, employee_id, full_name, phone, email, category, assigned_block)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const s of demoStaff) {
    insertStaff.run(s.id, s.user_id, s.employee_id, s.full_name, s.phone, s.email, s.category, s.assigned_block || null);
  }

  console.log('✅  SQLite DB ready (node:sqlite built-in)');
}

module.exports = { initDb };
