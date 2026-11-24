-- ============================================================
-- SHRAMS - Smart Hostel Room Allocation & Management System
-- Complete Database Schema
-- PostgreSQL 14+
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Users Table ──────────────────────────────────────────────────────────────
-- Stores all system users across all roles
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('student','warden','maintenance','admin','super_admin')),
  phone VARCHAR(15),
  is_active BOOLEAN DEFAULT true,
  reset_token VARCHAR(255),
  reset_token_expires TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ─── Student Profiles ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS student_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  usn VARCHAR(20) UNIQUE NOT NULL,
  department VARCHAR(100),
  semester INTEGER CHECK (semester BETWEEN 1 AND 8),
  date_of_birth DATE,
  gender VARCHAR(10) CHECK (gender IN ('male','female','other')),
  address TEXT,
  parent_name VARCHAR(100),
  parent_phone VARCHAR(15),
  parent_email VARCHAR(100),
  emergency_contact VARCHAR(15),
  blood_group VARCHAR(5),
  profile_photo VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ─── Hostels ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hostels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('boys','girls')),
  address TEXT,
  total_capacity INTEGER DEFAULT 0,
  warden_id UUID REFERENCES users(id),
  facilities TEXT[],
  rules TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ─── Blocks ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hostel_id UUID REFERENCES hostels(id) ON DELETE CASCADE,
  block_name VARCHAR(10) NOT NULL,
  total_floors INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ─── Rooms ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id UUID REFERENCES blocks(id) ON DELETE CASCADE,
  room_number VARCHAR(20) NOT NULL,
  floor INTEGER NOT NULL,
  room_type VARCHAR(20) NOT NULL CHECK (room_type IN ('single','double','triple')),
  capacity INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available','partially_occupied','fully_occupied','maintenance','reserved')),
  amenities TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);

-- ─── Beds ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS beds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  bed_number VARCHAR(10) NOT NULL,
  status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available','occupied','reserved','maintenance')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ─── Hostel Applications ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hostel_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  preferred_hostel_id UUID REFERENCES hostels(id),
  preferred_room_type VARCHAR(20),
  preferred_block_id UUID REFERENCES blocks(id),
  reason TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','waitlisted')),
  reviewed_by UUID REFERENCES users(id),
  review_notes TEXT,
  reviewed_at TIMESTAMP,
  academic_year VARCHAR(10),
  semester INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ─── Room Allocations ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  hostel_id UUID REFERENCES hostels(id),
  block_id UUID REFERENCES blocks(id),
  room_id UUID REFERENCES rooms(id),
  bed_id UUID REFERENCES beds(id) UNIQUE,
  allocated_by UUID REFERENCES users(id),
  allocation_date DATE DEFAULT CURRENT_DATE,
  check_in_date DATE,
  check_out_date DATE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','vacated','transferred')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ─── Room Change Requests ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS room_change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES users(id),
  current_allocation_id UUID REFERENCES allocations(id),
  preferred_room_type VARCHAR(20),
  preferred_block_id UUID REFERENCES blocks(id),
  reason TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reviewed_by UUID REFERENCES users(id),
  review_notes TEXT,
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ─── Vacating Requests ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vacating_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES users(id),
  allocation_id UUID REFERENCES allocations(id),
  reason TEXT NOT NULL,
  expected_vacating_date DATE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reviewed_by UUID REFERENCES users(id),
  review_notes TEXT,
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ─── Transfer Requests ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transfer_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES users(id),
  current_allocation_id UUID REFERENCES allocations(id),
  preferred_hostel_id UUID REFERENCES hostels(id),
  reason TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reviewed_by UUID REFERENCES users(id),
  review_notes TEXT,
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ─── Maintenance Complaints ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES users(id),
  room_id UUID REFERENCES rooms(id),
  category VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low','medium','high','critical')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','acknowledged','in_progress','on_hold','resolved','closed','reopened')),
  images TEXT[],
  assigned_to UUID REFERENCES users(id),
  assigned_at TIMESTAMP,
  resolved_at TIMESTAMP,
  work_notes TEXT,
  feedback_rating INTEGER CHECK (feedback_rating BETWEEN 1 AND 5),
  feedback_comment TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ─── Notifications ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(30) DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  related_id UUID,
  related_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ─── Announcements ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hostel_id UUID REFERENCES hostels(id),
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  posted_by UUID REFERENCES users(id),
  priority VARCHAR(10) DEFAULT 'normal' CHECK (priority IN ('normal','important','urgent')),
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ─── Warden Profiles ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS warden_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  hostel_id UUID REFERENCES hostels(id),
  employee_id VARCHAR(20) UNIQUE,
  department VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ─── Maintenance Staff Profiles ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS maintenance_staff_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  employee_id VARCHAR(20) UNIQUE,
  category VARCHAR(50),
  assigned_block_id UUID REFERENCES blocks(id),
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ─── Indexes for Performance ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_student_profiles_user_id ON student_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_student_profiles_usn ON student_profiles(usn);
CREATE INDEX IF NOT EXISTS idx_rooms_block_id ON rooms(block_id);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);
CREATE INDEX IF NOT EXISTS idx_beds_room_id ON beds(room_id);
CREATE INDEX IF NOT EXISTS idx_beds_status ON beds(status);
CREATE INDEX IF NOT EXISTS idx_allocations_student_id ON allocations(student_id);
CREATE INDEX IF NOT EXISTS idx_allocations_status ON allocations(status);
CREATE INDEX IF NOT EXISTS idx_hostel_applications_student_id ON hostel_applications(student_id);
CREATE INDEX IF NOT EXISTS idx_hostel_applications_status ON hostel_applications(status);
CREATE INDEX IF NOT EXISTS idx_complaints_student_id ON complaints(student_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- ─── Updated_at Trigger Function ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_profiles_updated_at
  BEFORE UPDATE ON student_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hostel_applications_updated_at
  BEFORE UPDATE ON hostel_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_complaints_updated_at
  BEFORE UPDATE ON complaints
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
