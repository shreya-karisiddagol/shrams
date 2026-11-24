-- ============================================================
--  SHRAMS – Staff Maintenance Module
--  Database Schema (PostgreSQL)
--  Run once; shared tables assumed to already exist in the
--  shared schema (users, hostels, rooms, beds).
-- ============================================================

-- Enable pgcrypto for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Maintenance Staff Profiles ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS maintenance_staff (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL UNIQUE,          -- FK → shared users table
  employee_id      VARCHAR(20) UNIQUE NOT NULL,
  full_name        VARCHAR(120) NOT NULL,
  phone            VARCHAR(15),
  email            VARCHAR(120) UNIQUE NOT NULL,
  category         VARCHAR(60) NOT NULL,          -- e.g. 'Electrical','Plumbing','Carpentry'
  assigned_block   VARCHAR(60),                   -- e.g. 'Block A', NULL = all
  is_available     BOOLEAN NOT NULL DEFAULT TRUE,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Complaint Categories ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS complaint_categories (
  id        SERIAL PRIMARY KEY,
  name      VARCHAR(80) UNIQUE NOT NULL,          -- 'Electrical','Plumbing', etc.
  priority  VARCHAR(20) NOT NULL DEFAULT 'medium' -- 'low','medium','high','critical'
);

INSERT INTO complaint_categories (name, priority) VALUES
  ('Electrical',       'high'),
  ('Plumbing',         'high'),
  ('Carpentry',        'medium'),
  ('Housekeeping',     'low'),
  ('Internet / Wi-Fi', 'medium'),
  ('Pest Control',     'medium'),
  ('Civil Work',       'high'),
  ('Other',            'low')
ON CONFLICT (name) DO NOTHING;

-- ── Complaints (registered by students) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS complaints (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID NOT NULL,                  -- FK → shared users table
  room_id         UUID NOT NULL,                  -- FK → shared rooms table
  hostel_id       UUID NOT NULL,
  block           VARCHAR(60),
  floor           VARCHAR(20),
  category_id     INT NOT NULL REFERENCES complaint_categories(id),
  title           VARCHAR(200) NOT NULL,
  description     TEXT NOT NULL,
  priority        VARCHAR(20) NOT NULL DEFAULT 'medium',
  status          VARCHAR(30) NOT NULL DEFAULT 'Pending',
  -- status lifecycle: Pending → Acknowledged → In Progress → On Hold → Resolved
  images          TEXT[],                         -- Cloudinary URLs
  submitted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Complaint Assignments ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS complaint_assignments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id    UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  staff_id        UUID NOT NULL REFERENCES maintenance_staff(id),
  assigned_by     UUID NOT NULL,                  -- FK → warden/admin user id
  assigned_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deadline        TIMESTAMPTZ,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE   -- false when reassigned
);

-- ── Complaint Status Logs ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS complaint_status_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id    UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  changed_by      UUID NOT NULL,                  -- staff or admin user id
  role            VARCHAR(30) NOT NULL,           -- 'staff','warden','admin'
  old_status      VARCHAR(30),
  new_status      VARCHAR(30) NOT NULL,
  note            TEXT,                           -- maintenance work note / on-hold reason
  changed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Maintenance Task View (for staff dashboard) ───────────────────────────────
-- (materialized view is optional; we query on the fly via JOIN)

-- ── Notifications ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS staff_notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id        UUID NOT NULL REFERENCES maintenance_staff(id) ON DELETE CASCADE,
  type            VARCHAR(60) NOT NULL,           -- 'new_task','critical_alert','reassignment','update'
  title           VARCHAR(200) NOT NULL,
  message         TEXT NOT NULL,
  complaint_id    UUID REFERENCES complaints(id),
  is_read         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_complaints_status         ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_student        ON complaints(student_id);
CREATE INDEX IF NOT EXISTS idx_assignments_staff         ON complaint_assignments(staff_id) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_assignments_complaint     ON complaint_assignments(complaint_id);
CREATE INDEX IF NOT EXISTS idx_logs_complaint            ON complaint_status_logs(complaint_id);
CREATE INDEX IF NOT EXISTS idx_notifications_staff_unread ON staff_notifications(staff_id) WHERE is_read = FALSE;
