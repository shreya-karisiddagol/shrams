# SHRAMS — Smart Hostel Room Allocation & Management System

A full-stack web application for managing hostel accommodation, room allocation, maintenance, and student services.

## 👩‍💻 Team

| Module          | Developer    |
|-----------------|--------------|
| Student & Warden| **Shreya**   |
| Maintenance     | **Preeti**   |
| Admin           | **Bhumika**  |
| Super Admin     | **Aneek Verma** |

---

## 🚀 Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS + Recharts
- **Backend**: Node.js + Express.js + JWT Auth
- **Database**: PostgreSQL
- **File Uploads**: Multer

---

## 📁 Project Structure

```
shrams/
├── backend/                  # Express API (port 5000)
│   ├── src/
│   │   ├── config/           # DB connection + SQL schema
│   │   ├── controllers/      # Route logic
│   │   ├── middleware/       # Auth, upload, error handler
│   │   ├── models/           # DB query functions
│   │   ├── routes/           # API route definitions
│   │   └── utils/            # Notifications & helpers
│   ├── uploads/              # Uploaded images
│   ├── .env                  # Environment variables
│   └── server.js             # Entry point
│
└── frontend/                 # React app (port 5173)
    └── src/
        ├── components/       # Shared UI (layouts, common)
        ├── contexts/         # Auth context
        ├── hooks/            # Custom hooks
        ├── pages/
        │   ├── auth/         # Login, Register, Forgot Password
        │   ├── student/      # All student pages
        │   ├── warden/       # All warden pages
        │   ├── maintenance/  # 🔧 Preeti (placeholder)
        │   ├── admin/        # 🔧 Bhumika (placeholder)
        │   └── superadmin/   # 🔧 Aneek Verma (placeholder)
        └── services/         # Axios API service layer
```

---

## ⚙️ Setup Instructions

### 1. Prerequisites
- **Node.js** v18+
- **PostgreSQL** v14+
- **npm**

### 2. Database Setup

```bash
# Create database
psql -U postgres -c "CREATE DATABASE shrams_db;"

# Create the uuid-ossp extension (run inside psql)
psql -U postgres -d shrams_db -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;"

# Run the schema
psql -U postgres -d shrams_db -f backend/src/config/database.sql
```

### 3. Backend Setup

```bash
cd backend

# Configure environment
cp .env.example .env
# Edit .env → set DB_PASSWORD to your PostgreSQL password

# Install dependencies
npm install

# Start development server
npm run dev
```
> API runs at: **http://localhost:5000/api**

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```
> App runs at: **http://localhost:5173**

---

## 🔐 Roles & Demo Accounts

After running the SQL schema, you can register accounts via the app.

| Role        | Login Path                    |
|-------------|-------------------------------|
| Student     | Register at `/register`       |
| Warden      | Admin creates warden accounts |
| Maintenance | Admin creates staff accounts  |
| Admin       | Super Admin creates accounts  |
| Super Admin | Seed directly in DB           |

---

## 🎯 Features Built (Shreya)

### Student Portal
- ✅ Registration (3-step form) & Login
- ✅ Profile management (personal, academic, guardian, password)
- ✅ Hostel application (4-step form)
- ✅ Application status tracker with timeline
- ✅ Room allocation view with amenities
- ✅ Room change / vacating / transfer requests
- ✅ Maintenance complaint submission with image upload
- ✅ Complaint tracking, feedback and reopen
- ✅ Notifications (grouped by date, mark as read)
- ✅ Announcements (priority-based)
- ✅ Services (rules, facilities, FAQ, feedback)

### Warden Portal
- ✅ Dashboard with charts (occupancy, room status)
- ✅ Application review (approve/reject/waitlist)
- ✅ **Smart Auto-Allocation Engine** (race-condition safe)
- ✅ Manual room allocation
- ✅ Student directory with profile view
- ✅ Room overview & occupancy map
- ✅ Complaint management with staff assignment
- ✅ Maintenance staff monitoring
- ✅ Announcement publishing
- ✅ Reports (occupancy, allocations, maintenance)

---

## 🔌 API Endpoints Summary

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new student |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password |
| GET  | `/api/auth/me` | Get current user |

### Student (requires `Bearer token`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/PUT | `/api/students/profile` | Get/update profile |
| GET | `/api/students/hostels` | List available hostels |
| POST | `/api/students/applications` | Submit application |
| GET | `/api/students/allocation` | Current allocation |
| POST | `/api/students/allocation/room-change-request` | Request room change |
| POST | `/api/students/complaints` | Submit complaint |
| GET | `/api/students/notifications` | Get notifications |

### Warden (requires `Bearer token`, warden role)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/wardens/dashboard` | Dashboard stats |
| GET | `/api/wardens/applications` | List applications |
| PUT | `/api/wardens/applications/:id/review` | Approve/reject |
| POST | `/api/wardens/allocations/auto-allocate` | Auto-allocate rooms |
| POST | `/api/wardens/allocations` | Manual allocation |
| GET | `/api/wardens/reports/occupancy` | Occupancy report |

---

## 🗄️ Database Schema

15 tables:
`users` · `student_profiles` · `warden_profiles` · `maintenance_staff_profiles` ·
`hostels` · `blocks` · `rooms` · `beds` ·
`hostel_applications` · `allocations` ·
`room_change_requests` · `vacating_requests` · `transfer_requests` ·
`complaints` · `notifications` · `announcements`

---

## 🛡️ Key Technical Features

- **JWT Authentication** with role-based access control
- **Race-condition-safe auto-allocation** using PostgreSQL `FOR UPDATE SKIP LOCKED`
- **Database transactions** for all mutations (BEGIN/COMMIT/ROLLBACK)
- **Paginated API responses** (`?page=1&limit=10`)
- **Async notifications** (non-blocking, fire-and-forget)
- **Multer file uploads** (images stored to `uploads/`)
- **Mobile-responsive** UI with Tailwind CSS

