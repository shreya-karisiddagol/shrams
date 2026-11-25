/* ═══════════════════════════════════════════════════════
   Dashboard Page
═══════════════════════════════════════════════════════ */
function renderDashboard(container) {
  const totalStudents = DB.students.length;
  const activeStudents = DB.students.filter(s => s.status === 'active').length;
  const totalBeds = DB.hostels.reduce((a,h) => a + h.totalBeds, 0);
  const occupiedBeds = DB.hostels.reduce((a,h) => a + h.occupied, 0);
  const availBeds = DB.hostels.reduce((a,h) => a + h.available, 0);
  const pendingApps = DB.applications.filter(a => a.status === 'pending').length;
  const openComplaints = DB.complaints.filter(c => c.status === 'open' || c.status === 'onhold').length;
  const criticalComplaints = DB.complaints.filter(c => c.priority === 'critical').length;
  const occupancyPct = Math.round((occupiedBeds / totalBeds) * 100);

  container.innerHTML = `
  <div class="page-header">
    <div class="page-header-left">
      <h1>Welcome back, Admin 👋</h1>
      <p>Here's what's happening across all hostels today – ${new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</p>
    </div>
    <div class="page-header-right">
      <button class="btn btn-outline btn-sm" onclick="showPage('reports')"><i class="fas fa-download"></i> Export Report</button>
      <button class="btn btn-primary btn-sm" onclick="showPage('announcements')"><i class="fas fa-bullhorn"></i> New Announcement</button>
    </div>
  </div>

  <!-- STAT CARDS -->
  <div class="stat-grid">
    <div class="stat-card blue" onclick="showPage('students')" style="cursor:pointer">
      <div class="stat-row">
        <div>
          <div class="stat-value">${totalStudents}</div>
          <div class="stat-label">Total Students</div>
          <div class="stat-trend up"><i class="fas fa-arrow-up"></i> ${activeStudents} Active</div>
        </div>
        <div class="stat-icon blue"><i class="fas fa-user-graduate"></i></div>
      </div>
    </div>
    <div class="stat-card purple" onclick="showPage('occupancy')" style="cursor:pointer">
      <div class="stat-row">
        <div>
          <div class="stat-value">${occupancyPct}%</div>
          <div class="stat-label">Hostel Occupancy</div>
          <div class="stat-trend ${occupancyPct>90?'down':'up'}"><i class="fas fa-bed"></i> ${occupiedBeds}/${totalBeds} Beds</div>
        </div>
        <div class="stat-icon purple"><i class="fas fa-chart-pie"></i></div>
      </div>
    </div>
    <div class="stat-card green" onclick="showPage('rooms')" style="cursor:pointer">
      <div class="stat-row">
        <div>
          <div class="stat-value">${availBeds}</div>
          <div class="stat-label">Available Beds</div>
          <div class="stat-trend neutral"><i class="fas fa-door-open"></i> Across 3 Hostels</div>
        </div>
        <div class="stat-icon green"><i class="fas fa-door-open"></i></div>
      </div>
    </div>
    <div class="stat-card orange" onclick="showPage('applications')" style="cursor:pointer">
      <div class="stat-row">
        <div>
          <div class="stat-value">${pendingApps}</div>
          <div class="stat-label">Pending Applications</div>
          <div class="stat-trend ${pendingApps>3?'down':'neutral'}"><i class="fas fa-clock"></i> Awaiting Approval</div>
        </div>
        <div class="stat-icon orange"><i class="fas fa-file-alt"></i></div>
      </div>
    </div>
    <div class="stat-card red" onclick="showPage('maintenance')" style="cursor:pointer">
      <div class="stat-row">
        <div>
          <div class="stat-value">${openComplaints}</div>
          <div class="stat-label">Open Complaints</div>
          <div class="stat-trend down"><i class="fas fa-fire"></i> ${criticalComplaints} Critical</div>
        </div>
        <div class="stat-icon red"><i class="fas fa-wrench"></i></div>
      </div>
    </div>
    <div class="stat-card teal" onclick="showPage('staff')" style="cursor:pointer">
      <div class="stat-row">
        <div>
          <div class="stat-value">${DB.staff.length}</div>
          <div class="stat-label">Maintenance Staff</div>
          <div class="stat-trend up"><i class="fas fa-hard-hat"></i> ${DB.staff.filter(s=>s.status==='available').length} Available</div>
        </div>
        <div class="stat-icon teal"><i class="fas fa-hard-hat"></i></div>
      </div>
    </div>
  </div>

  <!-- HOSTEL OVERVIEW CARDS -->
  <div class="card" style="margin-bottom:20px">
    <div class="card-header">
      <div class="card-title"><i class="fas fa-hotel"></i> Hostel Overview</div>
      <button class="btn btn-outline btn-sm" onclick="showPage('occupancy')">View Floor Map</button>
    </div>
    <div class="card-body">
      <div class="grid3">
        ${DB.hostels.map(h => {
          const pct = Math.round(h.occupied/h.totalBeds*100);
          const fillClass = pct>=90?'red':pct>=70?'orange':'green';
          return `
          <div style="background:var(--bg);border-radius:12px;padding:18px;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
              <div>
                <div style="font-weight:700;font-size:0.9rem">${h.name}</div>
                <div style="font-size:0.75rem;color:var(--text-secondary)">${h.gender} · ${h.location}</div>
              </div>
              <div class="stat-icon ${h.gender==='Male'?'blue':'purple'}" style="width:38px;height:38px">
                <i class="fas fa-hotel"></i>
              </div>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:0.78rem;margin-bottom:8px">
              <span style="color:var(--text-secondary)">Occupancy</span>
              <span style="font-weight:700">${pct}%</span>
            </div>
            <div class="progress-bar"><div class="progress-fill ${fillClass}" style="width:${pct}%"></div></div>
            <div class="mini-stat-row" style="margin-top:14px;grid-template-columns:1fr 1fr 1fr">
              <div style="text-align:center">
                <div style="font-size:1.1rem;font-weight:800;color:var(--primary)">${h.occupied}</div>
                <div style="font-size:0.68rem;color:var(--text-muted)">Occupied</div>
              </div>
              <div style="text-align:center">
                <div style="font-size:1.1rem;font-weight:800;color:#43E97B">${h.available}</div>
                <div style="font-size:0.68rem;color:var(--text-muted)">Available</div>
              </div>
              <div style="text-align:center">
                <div style="font-size:1.1rem;font-weight:800;color:#FF4757">${h.maintenance}</div>
                <div style="font-size:0.68rem;color:var(--text-muted)">Maintenance</div>
              </div>
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>
  </div>

  <!-- BOTTOM ROW -->
  <div class="grid2">
    <!-- RECENT APPLICATIONS -->
    <div class="card">
      <div class="card-header">
        <div class="card-title"><i class="fas fa-file-alt"></i> Recent Applications</div>
        <button class="btn btn-outline btn-sm" onclick="showPage('applications')">View All</button>
      </div>
      <div class="table-wrapper">
        <table>
          <thead><tr><th>Student</th><th>Hostel Pref.</th><th>Date</th><th>Status</th></tr></thead>
          <tbody>
            ${DB.applications.slice(0,5).map(a => `
            <tr>
              <td><strong>${a.name}</strong><br><span style="font-size:0.72rem;color:var(--text-muted)">${a.usn}</span></td>
              <td style="font-size:0.82rem">${a.hostelPref}</td>
              <td style="font-size:0.78rem">${formatDate(a.appliedDate)}</td>
              <td>${statusBadge(a.status)}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- RECENT COMPLAINTS -->
    <div class="card">
      <div class="card-header">
        <div class="card-title"><i class="fas fa-wrench"></i> Recent Complaints</div>
        <button class="btn btn-outline btn-sm" onclick="showPage('maintenance')">View All</button>
      </div>
      <div class="table-wrapper">
        <table>
          <thead><tr><th>Room</th><th>Issue</th><th>Priority</th><th>Status</th></tr></thead>
          <tbody>
            ${DB.complaints.slice(0,5).map(c => `
            <tr>
              <td><strong>${c.room}</strong><br><span style="font-size:0.72rem;color:var(--text-muted)">${c.name}</span></td>
              <td style="font-size:0.82rem;max-width:140px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${c.desc}</td>
              <td>${priorityBadge(c.priority)}</td>
              <td>${statusBadge(c.status)}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- ACTIVITY LOG -->
    <div class="card">
      <div class="card-header">
        <div class="card-title"><i class="fas fa-clock-rotate-left"></i> Recent Activity</div>
        <button class="btn btn-outline btn-sm" onclick="showPage('activity')">View All</button>
      </div>
      <div class="card-body">
        <div class="timeline">
          ${DB.activityLog.slice(0,6).map(l => `
          <div class="timeline-item">
            <div class="timeline-dot ${l.type==='success'?'green':l.type==='danger'?'red':l.type==='warning'?'orange':'purple'}"></div>
            <div class="timeline-title">${l.action}</div>
            <div class="timeline-desc">${l.detail}</div>
            <div class="timeline-time"><i class="fas fa-clock"></i> ${l.time}</div>
          </div>`).join('')}
        </div>
      </div>
    </div>

    <!-- STAFF STATUS -->
    <div class="card">
      <div class="card-header">
        <div class="card-title"><i class="fas fa-hard-hat"></i> Staff Availability</div>
        <button class="btn btn-outline btn-sm" onclick="showPage('staff')">Manage Staff</button>
      </div>
      <div class="card-body">
        ${DB.staff.map(s => `
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">
          <div class="avatar" style="background:${avatarBg(s.name)}">${initials(s.name)}</div>
          <div style="flex:1">
            <div style="font-size:0.85rem;font-weight:600">${s.name}</div>
            <div style="font-size:0.75rem;color:var(--text-secondary)">${s.category} · ${s.hostel.replace('Boys ','').replace('Girls ','')}</div>
          </div>
          <div style="text-align:right">
            ${statusBadge(s.status)}
            <div style="font-size:0.72rem;color:var(--text-muted);margin-top:3px">${s.tasks} tasks</div>
          </div>
        </div>`).join('')}
      </div>
    </div>
  </div>`;
}
