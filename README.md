# SHRAMS – Administrator Portal

**Smart Hostel Resource & Accommodation Management System**  
Administrator Dashboard — Pure HTML/CSS/JavaScript (No build tools required)

---

## 🚀 How to Open

Simply double-click `admin/index.html` or open it in any modern browser:

```
c:\Users\Bhumika\OneDrive\Desktop\shrams\admin\index.html
```

**Login Credentials:**
- Username: `admin`
- Password: `admin123`

---

## 📂 File Structure

```
admin/
├── index.html              # Main app shell & login
├── css/
│   └── style.css           # Complete stylesheet (~41KB)
└── js/
    ├── data.js             # Mock data store (students, rooms, hostels…)
    ├── app.js              # Core engine (auth, navigation, helpers)
    └── pages/
        ├── dashboard.js    # Dashboard overview
        ├── users.js        # Students, Wardens, Maintenance Staff
        ├── hostels.js      # Hostel & Block management
        ├── rooms.js        # Room & Bed management
        ├── occupancy.js    # Interactive floor map & occupancy monitor
        ├── applications.js # Hostel applications (approve/reject/auto-allocate)
        ├── maintenance.js  # Complaints & maintenance management
        ├── reports.js      # Analytics & CSV export
        ├── config.js       # System configuration
        ├── activity.js     # Activity log
        └── announcements.js# Announcements management
```

---

## 🎯 Modules Covered

| Module | Features |
|--------|----------|
| **Dashboard** | Live stats, hostel overview, recent activity, staff availability |
| **Students** | View, add, edit, activate/deactivate, search & filter |
| **Wardens** | Account management, hostel assignment |
| **Maintenance Staff** | Profile management, task assignment, workload tracking |
| **Hostels & Blocks** | Card view, facilities editor, comparison table |
| **Rooms & Beds** | Full CRUD, maintenance toggle, bed-level tracking |
| **Occupancy Monitor** | Interactive floor map, bed-grid, per-hostel progress bars |
| **Applications** | Approve/reject/auto-allocate, priority flagging, manual room assignment |
| **Maintenance** | Complaint lifecycle, staff assignment, priority filtering, resolution tracking |
| **Reports & Analytics** | Occupancy charts, complaint breakdown, staff KPIs, CSV export |
| **Configuration** | Allocation engine rules, complaint categories, notification toggles, hostel rules |
| **Activity Log** | Full audit trail, search/filter, CSV export |
| **Announcements** | Publish, pin, edit, delete, audience targeting |

---

## 🔗 Integration with Other Modules

Your friends' modules (Student Portal, Warden Portal, Maintenance Staff Portal) should connect to the same backend. The data format in `js/data.js` acts as the shared schema reference.

---

*Built for SHRAMS · Administrator Role · 2026*
