/* ═══════════════════════════════════════════════════════
   SHRAMS – Core App Engine
═══════════════════════════════════════════════════════ */

/* ── Auth ────────────────────────────────────────────── */
function doLogin() {
  const u = document.getElementById('loginUser').value.trim();
  const p = document.getElementById('loginPass').value.trim();
  if (u === DB.admin.username && p === DB.admin.password) {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('appShell').classList.remove('hidden');
    document.body.classList.remove('login-page');
    initApp();
  } else {
    document.getElementById('loginError').classList.remove('hidden');
  }
}
function doLogout() {
  document.getElementById('appShell').classList.add('hidden');
  document.getElementById('loginScreen').classList.remove('hidden');
  document.body.classList.add('login-page');
}
function togglePass() {
  const inp = document.getElementById('loginPass');
  const icon = document.getElementById('eyeIcon');
  if (inp.type === 'password') { inp.type = 'text'; icon.className = 'fas fa-eye-slash'; }
  else { inp.type = 'password'; icon.className = 'fas fa-eye'; }
}
document.addEventListener('DOMContentLoaded', () => {
  const lp = document.getElementById('loginPass');
  if (lp) lp.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
  const lu = document.getElementById('loginUser');
  if (lu) lu.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
});

/* ── Init ────────────────────────────────────────────── */
function initApp() {
  renderNotifications();
  showPage('dashboard');
  setupNavigation();
}

/* ── Navigation ──────────────────────────────────────── */
function setupNavigation() {
  document.querySelectorAll('.nav-item[data-page]').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      showPage(el.dataset.page);
      if (window.innerWidth <= 768) document.getElementById('sidebar').classList.remove('mobile-open');
    });
  });
}

const PAGE_TITLES = {
  dashboard:    'Dashboard',
  students:     'Students',
  wardens:      'Wardens',
  staff:        'Maintenance Staff',
  hostels:      'Hostels & Blocks',
  rooms:        'Rooms & Beds',
  occupancy:    'Occupancy Monitor',
  applications: 'Applications',
  maintenance:  'Maintenance',
  reports:      'Reports & Analytics',
  config:       'Configuration',
  activity:     'Activity Log',
  announcements:'Announcements',
};

function showPage(page) {
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  const target = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (target) target.classList.add('active');
  document.getElementById('breadcrumb').innerHTML = `<span>${PAGE_TITLES[page] || page}</span>`;
  const container = document.getElementById('pageContainer');
  // Show loading spinner briefly for feel
  container.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;min-height:300px;">
    <div style="text-align:center;">
      <div style="width:48px;height:48px;border:4px solid var(--primary-light);border-top-color:var(--primary);border-radius:50%;animation:spin 0.7s linear infinite;margin:0 auto 16px;"></div>
      <div style="color:var(--text-muted);font-size:0.85rem">Loading ${PAGE_TITLES[page]}…</div>
    </div>
  </div>`;
  setTimeout(() => {
    container.innerHTML = '';
    const fns = {
      dashboard:    renderDashboard,
      students:     renderStudents,
      wardens:      renderWardens,
      staff:        renderStaff,
      hostels:      renderHostels,
      rooms:        renderRooms,
      occupancy:    renderOccupancy,
      applications: renderApplications,
      maintenance:  renderMaintenance,
      reports:      renderReports,
      config:       renderConfig,
      activity:     renderActivity,
      announcements:renderAnnouncements,
    };
    if (fns[page]) fns[page](container);
    window.scrollTo(0,0);
  }, 120);
}

/* ── Sidebar Toggle ──────────────────────────────────── */
function toggleSidebar() {
  const sb = document.getElementById('sidebar');
  if (window.innerWidth <= 768) sb.classList.toggle('mobile-open');
  else sb.classList.toggle('collapsed');
}

/* ── Notifications ───────────────────────────────────── */
function renderNotifications() {
  const list = document.getElementById('notifList');
  const dot = document.getElementById('notifDot');
  const unread = DB.notifications.filter(n => !n.read);
  dot.style.display = unread.length ? 'block' : 'none';
  list.innerHTML = DB.notifications.map(n => `
    <div class="notif-item ${n.read ? '' : 'unread'}" onclick="readNotif('${n.id}')">
      <div class="notif-icon" style="background:var(--primary-light);color:var(--primary)">
        <i class="fas ${n.icon}"></i>
      </div>
      <div class="notif-text">
        <div class="notif-title">${n.title}</div>
        <div class="notif-desc">${n.desc}</div>
        <div class="notif-time"><i class="fas fa-clock"></i> ${n.time}</div>
      </div>
    </div>
  `).join('');
}
function toggleNotifPanel() {
  document.getElementById('notifPanel').classList.toggle('hidden');
}
function markAllRead() {
  DB.notifications.forEach(n => n.read = true);
  renderNotifications();
  toast('All notifications marked as read', 'success');
}
function readNotif(id) {
  const n = DB.notifications.find(x => x.id === id);
  if (n) n.read = true;
  renderNotifications();
}
document.addEventListener('click', e => {
  const panel = document.getElementById('notifPanel');
  const wrap = e.target.closest('.notif-wrap');
  if (!wrap && !panel.classList.contains('hidden')) panel.classList.add('hidden');
  const sd = document.getElementById('searchDropdown');
  if (!e.target.closest('.search-bar')) sd.classList.add('hidden');
});

/* ── Global Search ───────────────────────────────────── */
function globalSearchHandler() {
  const q = document.getElementById('globalSearch').value.trim().toLowerCase();
  const dd = document.getElementById('searchDropdown');
  if (q.length < 2) { dd.classList.add('hidden'); return; }
  const results = [];
  DB.students.forEach(s => {
    if (s.name.toLowerCase().includes(q) || s.usn.toLowerCase().includes(q))
      results.push({ icon:'fa-user-graduate', label:`${s.name} – ${s.usn}`, action:`showStudentDetail('${s.id}')` });
  });
  DB.rooms.forEach(r => {
    if (r.number.toLowerCase().includes(q))
      results.push({ icon:'fa-door-open', label:`Room ${r.number} – ${r.hostel}`, action:`showPage('rooms')` });
  });
  DB.hostels.forEach(h => {
    if (h.name.toLowerCase().includes(q))
      results.push({ icon:'fa-hotel', label:h.name, action:`showPage('hostels')` });
  });
  if (!results.length) results.push({ icon:'fa-search', label:'No results found', action:'' });
  dd.innerHTML = results.slice(0,6).map(r => `
    <div class="search-result-item" onclick="${r.action}">
      <i class="fas ${r.icon}"></i> ${r.label}
    </div>`).join('');
  dd.classList.remove('hidden');
}

/* ── Toast ───────────────────────────────────────────── */
function toast(msg, type='info', dur=3200) {
  const icons = { success:'fa-check-circle', error:'fa-times-circle', warning:'fa-exclamation-triangle', info:'fa-info-circle' };
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<i class="fas ${icons[type]||icons.info}"></i> ${msg}`;
  document.getElementById('toastContainer').appendChild(t);
  setTimeout(() => t.remove(), dur);
}

/* ── Modal ───────────────────────────────────────────── */
function openModal(title, body, footer='', large=false) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML = body;
  document.getElementById('modalFooter').innerHTML = footer;
  document.getElementById('modal').className = `modal${large?' modal-lg':''}`;
  document.getElementById('modalOverlay').classList.remove('hidden');
  document.getElementById('modal').classList.remove('hidden');
}
function closeModal() {
  document.getElementById('modalOverlay').classList.add('hidden');
  document.getElementById('modal').classList.add('hidden');
}

/* ── Helpers ─────────────────────────────────────────── */
function avatarBg(name) {
  const colors = ['#6C63FF','#FF6584','#43E97B','#F7B731','#2ED9FF','#FF8C42','#9B59B6','#1ABC9C'];
  let hash = 0;
  for (let c of name) hash = c.charCodeAt(0) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}
function initials(name) {
  return name.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase();
}
function statusBadge(s) {
  const map = {
    active:'active', inactive:'inactive', pending:'pending',
    approved:'approved', rejected:'rejected', resolved:'resolved',
    open:'open', inprogress:'inprogress', onhold:'onhold',
    occupied:'occupied', available:'available', maintenance:'maintenance',
    partial:'onhold', reserved:'reserved', busy:'onhold',
  };
  const cls = map[s] || 'inactive';
  return `<span class="status-badge ${cls}">${s.replace('inprogress','In Progress').replace('onhold','On Hold')}</span>`;
}
function priorityBadge(p) {
  const icons = { critical:'fa-fire', high:'fa-arrow-up', medium:'fa-minus', low:'fa-arrow-down' };
  return `<span class="priority ${p}"><i class="fas ${icons[p]||'fa-minus'}"></i> ${p.charAt(0).toUpperCase()+p.slice(1)}</span>`;
}
function formatDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
}
function logActivity(action, detail) {
  DB.activityLog.unshift({
    id: 'L' + Date.now(),
    action, detail, user:'Admin',
    time: new Date().toLocaleString('en-IN').replace(',',''),
    type:'success'
  });
}

/* ── Tabs ────────────────────────────────────────────── */
function switchTab(tabId, paneClass) {
  document.querySelectorAll(`.${paneClass}`).forEach(p => p.classList.remove('active'));
  document.querySelectorAll(`[data-tab]`).forEach(b => b.classList.remove('active'));
  document.getElementById(tabId).classList.add('active');
  document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
}
