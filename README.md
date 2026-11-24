# Staff Maintenance Module — SHRAMS

> Part of the **Smart Hostel Room Allocation and Maintenance System (SHRAMS)**
>
> Built by: [Your Name] | Stack: React (Vite) + Tailwind CSS + Node.js/Express + PostgreSQL

---

## 📁 Structure

```
staff-maintenance/
├── backend/            # Express API server
│   ├── src/
│   │   ├── config/     # Cloudinary config
│   │   ├── controllers/# staffController, taskController, complaintController, notificationController
│   │   ├── db/         # pool.js, schema.sql, migrate.js, seed.js
│   │   ├── middleware/ # auth.js (JWT), upload.js (Cloudinary), validate.js
│   │   ├── routes/     # staffRoutes.js, complaintRoutes.js
│   │   └── index.js    # Express app + Socket.IO
│   ├── .env.example
│   └── package.json
│
└── frontend/           # React (Vite) app
    ├── src/
    │   ├── components/ # Layout, TaskCard, Badges, StatusUpdateModal, StatusTimeline, StatCard…
    │   ├── context/    # AuthContext, SocketContext
    │   ├── hooks/      # useTasks, useNotifications, useProfile
    │   ├── pages/      # Login, Dashboard, Tasks, TaskDetail, TaskHistory, Notifications, Profile
    │   ├── services/   # api.js (Axios + interceptors)
    │   └── utils/      # constants.js, dateUtils.js
    └── package.json
```

---

## 🚀 Getting Started

### 1. Database Setup

```bash
# Make sure PostgreSQL is running and the shared SHRAMS DB exists
cd backend
cp .env.example .env        # Fill in your values
npm install
npm run db:migrate          # Run schema.sql
npm run db:seed             # Insert demo staff (optional)
```

### 2. Backend

```bash
cd backend
npm run dev                 # Starts on http://localhost:5000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev                 # Starts on http://localhost:5173
```

---

## 🔑 API Routes

### Staff (role: `maintenance_staff`)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/staff/profile` | View personal profile |
| PATCH | `/api/staff/profile` | Update phone number |
| GET | `/api/staff/workload-stats` | Dashboard stats |
| GET | `/api/staff/tasks` | List assigned tasks (filterable) |
| GET | `/api/staff/tasks/history` | All tasks (paginated) |
| GET | `/api/staff/tasks/:id` | Task detail + status history |
| PATCH | `/api/staff/tasks/:id/status` | Update task status |
| POST | `/api/staff/tasks/:id/notes` | Add work note |
| GET | `/api/staff/notifications` | List notifications |
| PATCH | `/api/staff/notifications/:id/read` | Mark one as read |
| PATCH | `/api/staff/notifications/mark-all-read` | Mark all read |

### Complaints (shared with student module)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/complaints/categories` | List categories |
| POST | `/api/complaints` | Student submits complaint + images |
| GET | `/api/complaints/:id` | View complaint detail |

---

## 🔄 Status Lifecycle

```
Pending → Acknowledged → In Progress → On Hold → Resolved
                                     ↗           ↑
                               On Hold ──────────┘
```

---

## 🔌 Integration with Teammates

| Concern | Integration Point |
|---------|-------------------|
| **Auth / JWT** | Same `JWT_SECRET` as your teammates' auth service. The token's `role` field must be `maintenance_staff` for staff routes. |
| **Shared DB** | Tables: `users`, `hostels`, `rooms`, `beds` are owned by admin/warden modules. This module adds its own tables (prefix: `maintenance_staff`, `complaints`, `complaint_assignments`, `complaint_status_logs`, `staff_notifications`). |
| **Complaint creation** | Student module posts to `/api/complaints`; warden assigns via `complaint_assignments`. |
| **Real-time** | Socket.IO server emits to `staff_{staffId}` room. Warden module can call `io.to('staff_xxx').emit('new_task', {...})` after inserting a `complaint_assignment`. |

---

## 🌐 Environment Variables (`.env`)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Shared secret (same as auth service) |
| `PORT` | Backend port (default 5000) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account |
| `CLOUDINARY_API_KEY` | Cloudinary key |
| `CLOUDINARY_API_SECRET` | Cloudinary secret |
| `CLIENT_ORIGIN` | Frontend URL for CORS (default `http://localhost:5173`) |

---

## 📦 Git

```bash
git add .
git commit -m "feat: staff maintenance module complete"
git push origin feature/staff-maintenance
```
