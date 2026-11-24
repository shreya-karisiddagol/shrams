/* ═══════════════════════════════════════════════════════
   Users Page – Students, Wardens, Maintenance Staff
═══════════════════════════════════════════════════════ */

/* ── STUDENTS ───────────────────────────────────────── */
function renderStudents(container) {
  container.innerHTML = buildUsersPage('students');
  setupStudentsTable();
}
function buildUsersPage(type) {
  return `
  <div class="page-header">
    <div class="page-header-left">
      <h1>${type==='students'?'Student Records':type==='wardens'?'Warden Accounts':'Maintenance Staff'}</h1>
      <p>Manage and monitor all ${type} in the system</p>
    </div>
    <div class="page-header-right">
      <button class="btn btn-outline btn-sm" id="exportBtn${type}"><i class="fas fa-download"></i> Export CSV</button>
      <button class="btn btn-primary btn-sm" onclick="openAddUserModal('${type}')"><i class="fas fa-plus"></i> Add ${type==='students'?'Student':type==='wardens'?'Warden':'Staff'}</button>
    </div>
  </div>
  <div class="card">
    <div class="card-header">
      <div class="card-title"><i class="fas fa-users"></i> <span id="usersCountLabel">All ${type}</span></div>
      <div class="card-actions">
        <div class="filter-bar" style="margin:0">
          <input type="text" id="userSearch" placeholder="Search name, USN…" oninput="filterUsersTable('${type}')" />
          <select id="userStatusFilter" onchange="filterUsersTable('${type}')">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            ${type==='staff'?'<option value="available">Available</option><option value="busy">Busy</option>':''}
          </select>
          ${type==='students'?`<select id="userDeptFilter" onchange="filterUsersTable('students')">
            <option value="">All Dept</option>
            ${[...new Set(DB.students.map(s=>s.dept))].map(d=>`<option>${d}</option>`).join('')}
          </select>`:''}
        </div>
      </div>
    </div>
    <div class="table-wrapper" id="usersTableWrap"></div>
    <div class="pagination" id="usersPagination"></div>
  </div>`;
}

let _userPage = { students:1, wardens:1, staff:1 };
const _perPage = 8;

function setupStudentsTable() { filterUsersTable('students'); }

function filterUsersTable(type) {
  const q = (document.getElementById('userSearch')?.value || '').toLowerCase();
  const st = document.getElementById('userStatusFilter')?.value || '';
  const dept = document.getElementById('userDeptFilter')?.value || '';
  let data = type === 'students' ? [...DB.students]
           : type === 'wardens'  ? [...DB.wardens]
           : [...DB.staff];
  if (q) data = data.filter(d => JSON.stringify(d).toLowerCase().includes(q));
  if (st) data = data.filter(d => d.status === st);
  if (dept && type==='students') data = data.filter(d => d.dept === dept);
  _userPage[type] = 1;
  renderUsersTable(type, data);
}

function renderUsersTable(type, data) {
  const start = (_userPage[type]-1)*_perPage;
  const page = data.slice(start, start+_perPage);
  const wrap = document.getElementById('usersTableWrap');
  const pag  = document.getElementById('usersPagination');
  if (!wrap) return;

  document.getElementById('usersCountLabel').textContent = `${data.length} ${type}`;

  if (type === 'students') {
    wrap.innerHTML = `<table>
      <thead><tr>
        <th>Student</th><th>USN</th><th>Dept / Sem</th>
        <th>Hostel / Room</th><th>Contact</th><th>Status</th><th>Actions</th>
      </tr></thead>
      <tbody>${page.map(s => `
        <tr>
          <td>
            <div style="display:flex;align-items:center;gap:10px">
              <div class="avatar" style="background:${avatarBg(s.name)}">${initials(s.name)}</div>
              <div>
                <div style="font-weight:600;font-size:0.85rem">${s.name}</div>
                <div style="font-size:0.72rem;color:var(--text-muted)">${s.gender}</div>
              </div>
            </div>
          </td>
          <td style="font-size:0.82rem;font-weight:600">${s.usn}</td>
          <td><div style="font-size:0.82rem">${s.dept}</div><div style="font-size:0.72rem;color:var(--text-muted)">Sem ${s.sem}</div></td>
          <td><div style="font-size:0.82rem">${s.hostel}</div><div style="font-size:0.72rem;color:var(--text-muted)">Room: ${s.room}</div></td>
          <td><div style="font-size:0.78rem">${s.phone}</div><div style="font-size:0.72rem;color:var(--text-muted)">${s.email}</div></td>
          <td>${statusBadge(s.status)}</td>
          <td>
            <div style="display:flex;gap:6px">
              <button class="btn btn-outline btn-xs" onclick="showStudentDetail('${s.id}')"><i class="fas fa-eye"></i></button>
              <button class="btn btn-outline btn-xs" onclick="editStudent('${s.id}')"><i class="fas fa-edit"></i></button>
              <button class="btn btn-xs ${s.status==='active'?'btn-warning':'btn-success'}" onclick="toggleStudentStatus('${s.id}')">
                <i class="fas fa-${s.status==='active'?'ban':'check'}"></i>
              </button>
            </div>
          </td>
        </tr>`).join('')}
      </tbody>
    </table>`;
  } else if (type === 'wardens') {
    wrap.innerHTML = `<table>
      <thead><tr>
        <th>Warden</th><th>Hostel / Block</th><th>Contact</th><th>Experience</th><th>Joined</th><th>Status</th><th>Actions</th>
      </tr></thead>
      <tbody>${page.map(w => `
        <tr>
          <td>
            <div style="display:flex;align-items:center;gap:10px">
              <div class="avatar" style="background:${avatarBg(w.name)}">${initials(w.name)}</div>
              <div>
                <div style="font-weight:600;font-size:0.85rem">${w.name}</div>
                <div style="font-size:0.72rem;color:var(--text-muted)">${w.email}</div>
              </div>
            </div>
          </td>
          <td><div style="font-size:0.82rem">${w.hostel}</div><div style="font-size:0.72rem;color:var(--text-muted)">${w.block}</div></td>
          <td style="font-size:0.82rem">${w.phone}</td>
          <td style="font-size:0.82rem">${w.experience}</td>
          <td style="font-size:0.78rem">${formatDate(w.joinDate)}</td>
          <td>${statusBadge(w.status)}</td>
          <td>
            <div style="display:flex;gap:6px">
              <button class="btn btn-outline btn-xs" onclick="editWarden('${w.id}')"><i class="fas fa-edit"></i></button>
              <button class="btn btn-xs ${w.status==='active'?'btn-warning':'btn-success'}" onclick="toggleWardenStatus('${w.id}')">
                <i class="fas fa-${w.status==='active'?'ban':'check'}"></i>
              </button>
              <button class="btn btn-danger btn-xs" onclick="deleteUser('warden','${w.id}')"><i class="fas fa-trash"></i></button>
            </div>
          </td>
        </tr>`).join('')}
      </tbody>
    </table>`;
  } else {
    wrap.innerHTML = `<table>
      <thead><tr>
        <th>Staff</th><th>Category</th><th>Hostel</th><th>Phone</th><th>Active Tasks</th><th>Completed</th><th>Status</th><th>Actions</th>
      </tr></thead>
      <tbody>${page.map(s => `
        <tr>
          <td>
            <div style="display:flex;align-items:center;gap:10px">
              <div class="avatar" style="background:${avatarBg(s.name)}">${initials(s.name)}</div>
              <div style="font-weight:600;font-size:0.85rem">${s.name}</div>
            </div>
          </td>
          <td><span class="badge badge-blue">${s.category}</span></td>
          <td style="font-size:0.82rem">${s.hostel}</td>
          <td style="font-size:0.82rem">${s.phone}</td>
          <td style="font-weight:700;color:var(--primary)">${s.tasks}</td>
          <td style="font-weight:700;color:#43E97B">${s.completed}</td>
          <td>${statusBadge(s.status)}</td>
          <td>
            <div style="display:flex;gap:6px">
              <button class="btn btn-outline btn-xs" onclick="viewStaffTasks('${s.id}')"><i class="fas fa-list"></i></button>
              <button class="btn btn-outline btn-xs" onclick="editStaff('${s.id}')"><i class="fas fa-edit"></i></button>
              <button class="btn btn-danger btn-xs" onclick="deleteUser('staff','${s.id}')"><i class="fas fa-trash"></i></button>
            </div>
          </td>
        </tr>`).join('')}
      </tbody>
    </table>`;
  }

  // Pagination
  const totalPages = Math.ceil(data.length / _perPage);
  pag.innerHTML = `
    <div>Showing ${start+1}–${Math.min(start+_perPage,data.length)} of ${data.length}</div>
    <div class="page-btns">
      <button class="page-btn" onclick="_userPage['${type}']=${Math.max(1,_userPage['${type}']-1)};renderUsersTable('${type}',_cachedData)" ${_userPage[type]===1?'disabled':''}>
        <i class="fas fa-chevron-left"></i>
      </button>
      ${Array.from({length:totalPages},(_,i)=>`
        <button class="page-btn ${i+1===_userPage[type]?'active':''}" onclick="_userPage['${type}']=${i+1};renderUsersTable('${type}',_cachedData)">${i+1}</button>
      `).join('')}
      <button class="page-btn" onclick="_userPage['${type}']=${Math.min(totalPages,_userPage['${type}']+1)};renderUsersTable('${type}',_cachedData)" ${_userPage[type]===totalPages?'disabled':''}>
        <i class="fas fa-chevron-right"></i>
      </button>
    </div>`;
  window._cachedData = data;
}

/* ── Wardens ────────────────────────────────────────── */
function renderWardens(container) {
  container.innerHTML = buildUsersPage('wardens');
  document.getElementById('usersTableWrap');
  setTimeout(() => { renderUsersTable('wardens', DB.wardens); }, 10);
}

/* ── Staff ──────────────────────────────────────────── */
function renderStaff(container) {
  container.innerHTML = buildUsersPage('staff');
  setTimeout(() => { renderUsersTable('staff', DB.staff); }, 10);
}

/* ── Detail / Edit Modals ───────────────────────────── */
function showStudentDetail(id) {
  const s = DB.students.find(x => x.id === id);
  if (!s) return;
  openModal(`Student Profile – ${s.name}`, `
    <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px;padding:16px;background:var(--bg);border-radius:12px">
      <div class="avatar avatar-lg" style="background:${avatarBg(s.name)}">${initials(s.name)}</div>
      <div>
        <div style="font-size:1.1rem;font-weight:800">${s.name}</div>
        <div style="color:var(--text-secondary);font-size:0.85rem">${s.usn} · ${s.dept}</div>
        <div style="margin-top:6px">${statusBadge(s.status)}</div>
      </div>
    </div>
    <div class="form-row cols2">
      ${[
        ['USN', s.usn], ['Department', s.dept], ['Semester', `Sem ${s.sem}`], ['Gender', s.gender],
        ['Email', s.email], ['Phone', s.phone], ['Parent Phone', s.parentPhone],
        ['Hostel', s.hostel], ['Room', s.room], ['Date of Admission', formatDate(s.doa)]
      ].map(([k,v]) => `
        <div class="field-group">
          <div class="field-label">${k}</div>
          <div style="font-size:0.9rem;font-weight:600;color:var(--text-primary)">${v}</div>
        </div>`).join('')}
    </div>`,
    `<button class="btn btn-outline" onclick="closeModal()">Close</button>
     <button class="btn btn-primary" onclick="closeModal();editStudent('${id}')">Edit Profile</button>`);
}

function editStudent(id) {
  const s = DB.students.find(x => x.id === id);
  if (!s) return;
  openModal(`Edit Student – ${s.name}`, `
    <div class="form-row cols2">
      <div class="field-group"><label class="field-label required">Full Name</label><input class="field-input" id="ed_name" value="${s.name}"/></div>
      <div class="field-group"><label class="field-label">USN</label><input class="field-input" id="ed_usn" value="${s.usn}" readonly style="opacity:0.7"/></div>
      <div class="field-group"><label class="field-label">Department</label><input class="field-input" id="ed_dept" value="${s.dept}"/></div>
      <div class="field-group"><label class="field-label">Semester</label>
        <select class="field-select" id="ed_sem">${[1,2,3,4,5,6,7,8].map(i=>`<option ${s.sem==i?'selected':''}>${i}</option>`).join('')}</select>
      </div>
      <div class="field-group"><label class="field-label">Email</label><input class="field-input" id="ed_email" value="${s.email}"/></div>
      <div class="field-group"><label class="field-label">Phone</label><input class="field-input" id="ed_phone" value="${s.phone}"/></div>
      <div class="field-group"><label class="field-label">Parent Phone</label><input class="field-input" id="ed_pphone" value="${s.parentPhone}"/></div>
      <div class="field-group"><label class="field-label">Status</label>
        <select class="field-select" id="ed_status">
          <option ${s.status==='active'?'selected':''}>active</option>
          <option ${s.status==='inactive'?'selected':''}>inactive</option>
        </select>
      </div>
    </div>`,
    `<button class="btn btn-outline" onclick="closeModal()">Cancel</button>
     <button class="btn btn-primary" onclick="saveStudentEdit('${id}')">Save Changes</button>`);
}

function saveStudentEdit(id) {
  const s = DB.students.find(x => x.id === id);
  if (!s) return;
  s.name   = document.getElementById('ed_name').value;
  s.dept   = document.getElementById('ed_dept').value;
  s.sem    = +document.getElementById('ed_sem').value;
  s.email  = document.getElementById('ed_email').value;
  s.phone  = document.getElementById('ed_phone').value;
  s.parentPhone = document.getElementById('ed_pphone').value;
  s.status = document.getElementById('ed_status').value;
  logActivity('Student Updated', `Profile updated for ${s.name} (${s.usn})`);
  closeModal();
  toast(`${s.name}'s profile updated successfully`, 'success');
  showPage('students');
}

function toggleStudentStatus(id) {
  const s = DB.students.find(x => x.id === id);
  if (!s) return;
  s.status = s.status === 'active' ? 'inactive' : 'active';
  logActivity(`Student ${s.status==='active'?'Activated':'Deactivated'}`, `${s.name} (${s.usn})`);
  toast(`${s.name} is now ${s.status}`, s.status==='active'?'success':'warning');
  showPage('students');
}

function toggleWardenStatus(id) {
  const w = DB.wardens.find(x => x.id === id);
  if (!w) return;
  w.status = w.status === 'active' ? 'inactive' : 'active';
  toast(`${w.name} is now ${w.status}`, w.status==='active'?'success':'warning');
  showPage('wardens');
}

function editWarden(id) {
  const w = DB.wardens.find(x => x.id === id);
  if (!w) return;
  openModal(`Edit Warden – ${w.name}`, `
    <div class="form-row cols2">
      <div class="field-group"><label class="field-label required">Name</label><input class="field-input" id="ew_name" value="${w.name}"/></div>
      <div class="field-group"><label class="field-label">Email</label><input class="field-input" id="ew_email" value="${w.email}"/></div>
      <div class="field-group"><label class="field-label">Phone</label><input class="field-input" id="ew_phone" value="${w.phone}"/></div>
      <div class="field-group"><label class="field-label">Hostel</label>
        <select class="field-select" id="ew_hostel">
          ${DB.hostels.map(h=>`<option ${h.name===w.hostel?'selected':''}>${h.name}</option>`).join('')}
        </select>
      </div>
    </div>`,
    `<button class="btn btn-outline" onclick="closeModal()">Cancel</button>
     <button class="btn btn-primary" onclick="saveWardenEdit('${id}')">Save</button>`);
}

function saveWardenEdit(id) {
  const w = DB.wardens.find(x => x.id === id);
  if (!w) return;
  w.name   = document.getElementById('ew_name').value;
  w.email  = document.getElementById('ew_email').value;
  w.phone  = document.getElementById('ew_phone').value;
  w.hostel = document.getElementById('ew_hostel').value;
  logActivity('Warden Updated', `${w.name} profile updated`);
  closeModal();
  toast('Warden profile updated', 'success');
  showPage('wardens');
}

function editStaff(id) {
  const s = DB.staff.find(x => x.id === id);
  if (!s) return;
  openModal(`Edit Staff – ${s.name}`, `
    <div class="form-row cols2">
      <div class="field-group"><label class="field-label required">Name</label><input class="field-input" id="es_name" value="${s.name}"/></div>
      <div class="field-group"><label class="field-label">Phone</label><input class="field-input" id="es_phone" value="${s.phone}"/></div>
      <div class="field-group"><label class="field-label">Category</label>
        <select class="field-select" id="es_cat">
          ${DB.config.complaints.categories.map(c=>`<option ${c===s.category?'selected':''}>${c}</option>`).join('')}
        </select>
      </div>
      <div class="field-group"><label class="field-label">Hostel</label>
        <select class="field-select" id="es_hostel">
          ${DB.hostels.map(h=>`<option ${h.name===s.hostel?'selected':''}>${h.name}</option>`).join('')}
        </select>
      </div>
    </div>`,
    `<button class="btn btn-outline" onclick="closeModal()">Cancel</button>
     <button class="btn btn-primary" onclick="saveStaffEdit('${id}')">Save</button>`);
}

function saveStaffEdit(id) {
  const s = DB.staff.find(x => x.id === id);
  if (!s) return;
  s.name     = document.getElementById('es_name').value;
  s.phone    = document.getElementById('es_phone').value;
  s.category = document.getElementById('es_cat').value;
  s.hostel   = document.getElementById('es_hostel').value;
  closeModal();
  toast('Staff profile updated', 'success');
  showPage('staff');
}

function viewStaffTasks(id) {
  const s = DB.staff.find(x => x.id === id);
  const tasks = DB.complaints.filter(c => c.assignedTo === id);
  openModal(`Tasks – ${s.name}`, `
    <div style="margin-bottom:14px">
      <span class="badge badge-blue">${s.category}</span>
      <span style="margin-left:8px;font-size:0.82rem;color:var(--text-secondary)">${s.hostel}</span>
    </div>
    ${tasks.length ? `
    <div class="table-wrapper"><table>
      <thead><tr><th>ID</th><th>Room</th><th>Issue</th><th>Priority</th><th>Status</th></tr></thead>
      <tbody>${tasks.map(t => `
        <tr>
          <td style="font-weight:700">${t.id}</td>
          <td>${t.room}</td>
          <td style="font-size:0.82rem">${t.desc}</td>
          <td>${priorityBadge(t.priority)}</td>
          <td>${statusBadge(t.status)}</td>
        </tr>`).join('')}
      </tbody>
    </table></div>` : `<div class="empty-state"><i class="fas fa-check-circle"></i><p>No tasks assigned</p></div>`}`,
    `<button class="btn btn-outline" onclick="closeModal()">Close</button>`);
}

function deleteUser(type, id) {
  openModal('Confirm Delete', `<p style="font-size:0.9rem;color:var(--text-secondary)">Are you sure you want to delete this ${type} account? This action cannot be undone.</p>`,
    `<button class="btn btn-outline" onclick="closeModal()">Cancel</button>
     <button class="btn btn-danger" onclick="confirmDelete('${type}','${id}')"><i class="fas fa-trash"></i> Delete</button>`);
}

function confirmDelete(type, id) {
  if (type === 'warden') {
    const idx = DB.wardens.findIndex(x => x.id === id);
    if (idx > -1) { logActivity('Warden Deleted', DB.wardens[idx].name); DB.wardens.splice(idx,1); }
    closeModal(); toast('Warden account deleted', 'success'); showPage('wardens');
  } else if (type === 'staff') {
    const idx = DB.staff.findIndex(x => x.id === id);
    if (idx > -1) { logActivity('Staff Deleted', DB.staff[idx].name); DB.staff.splice(idx,1); }
    closeModal(); toast('Staff account deleted', 'success'); showPage('staff');
  }
}

function openAddUserModal(type) {
  if (type === 'students') {
    openModal('Add New Student', `
      <div class="form-row cols2">
        <div class="field-group"><label class="field-label required">Full Name</label><input class="field-input" id="ns_name" placeholder="Student name"/></div>
        <div class="field-group"><label class="field-label required">USN</label><input class="field-input" id="ns_usn" placeholder="1VKxxYYzzz"/></div>
        <div class="field-group"><label class="field-label">Department</label>
          <select class="field-select" id="ns_dept">
            ${['Computer Science','Electronics','Mechanical Engineering','Civil Engineering','Information Science','AI & ML','Electrical'].map(d=>`<option>${d}</option>`).join('')}
          </select>
        </div>
        <div class="field-group"><label class="field-label">Semester</label>
          <select class="field-select" id="ns_sem">${[1,2,3,4,5,6,7,8].map(i=>`<option>${i}</option>`).join('')}</select>
        </div>
        <div class="field-group"><label class="field-label">Gender</label>
          <select class="field-select" id="ns_gender"><option>Male</option><option>Female</option></select>
        </div>
        <div class="field-group"><label class="field-label">Phone</label><input class="field-input" id="ns_phone" placeholder="10-digit number"/></div>
        <div class="field-group"><label class="field-label">Email</label><input class="field-input" id="ns_email" placeholder="student@college.edu" style="grid-column:span 2"/></div>
      </div>`,
      `<button class="btn btn-outline" onclick="closeModal()">Cancel</button>
       <button class="btn btn-primary" onclick="saveNewStudent()"><i class="fas fa-plus"></i> Add Student</button>`);
  } else if (type === 'wardens') {
    openModal('Add New Warden', `
      <div class="form-row cols2">
        <div class="field-group"><label class="field-label required">Name</label><input class="field-input" id="nw_name" placeholder="Full name"/></div>
        <div class="field-group"><label class="field-label">Email</label><input class="field-input" id="nw_email" placeholder="warden@college.edu"/></div>
        <div class="field-group"><label class="field-label">Phone</label><input class="field-input" id="nw_phone" placeholder="10-digit"/></div>
        <div class="field-group"><label class="field-label">Assign Hostel</label>
          <select class="field-select" id="nw_hostel">${DB.hostels.map(h=>`<option>${h.name}</option>`).join('')}</select>
        </div>
        <div class="field-group"><label class="field-label">Password</label><input class="field-input" type="password" id="nw_pass" placeholder="Set password"/></div>
      </div>`,
      `<button class="btn btn-outline" onclick="closeModal()">Cancel</button>
       <button class="btn btn-primary" onclick="saveNewWarden()"><i class="fas fa-plus"></i> Create Account</button>`);
  } else {
    openModal('Add Maintenance Staff', `
      <div class="form-row cols2">
        <div class="field-group"><label class="field-label required">Name</label><input class="field-input" id="nm_name" placeholder="Full name"/></div>
        <div class="field-group"><label class="field-label">Phone</label><input class="field-input" id="nm_phone" placeholder="10-digit"/></div>
        <div class="field-group"><label class="field-label">Category</label>
          <select class="field-select" id="nm_cat">${DB.config.complaints.categories.map(c=>`<option>${c}</option>`).join('')}</select>
        </div>
        <div class="field-group"><label class="field-label">Assign Hostel</label>
          <select class="field-select" id="nm_hostel">${DB.hostels.map(h=>`<option>${h.name}</option>`).join('')}</select>
        </div>
      </div>`,
      `<button class="btn btn-outline" onclick="closeModal()">Cancel</button>
       <button class="btn btn-primary" onclick="saveNewStaff()"><i class="fas fa-plus"></i> Add Staff</button>`);
  }
}

function saveNewStudent() {
  const name = document.getElementById('ns_name').value.trim();
  if (!name) { toast('Name is required', 'error'); return; }
  const id = 'S' + String(DB.students.length+1).padStart(3,'0');
  DB.students.push({
    id, name,
    usn: document.getElementById('ns_usn').value,
    dept: document.getElementById('ns_dept').value,
    sem: +document.getElementById('ns_sem').value,
    gender: document.getElementById('ns_gender').value,
    phone: document.getElementById('ns_phone').value,
    email: document.getElementById('ns_email').value,
    parentPhone: '', room:'—', hostel:'—', status:'inactive', doa: new Date().toISOString().split('T')[0]
  });
  logActivity('Student Added', `New student account created for ${name}`);
  closeModal(); toast(`${name} added successfully`, 'success');
  document.getElementById('nav-badge-students').textContent = DB.students.length;
  showPage('students');
}

function saveNewWarden() {
  const name = document.getElementById('nw_name').value.trim();
  if (!name) { toast('Name is required', 'error'); return; }
  const id = 'W' + String(DB.wardens.length+1).padStart(3,'0');
  DB.wardens.push({
    id, name,
    email: document.getElementById('nw_email').value,
    phone: document.getElementById('nw_phone').value,
    hostel: document.getElementById('nw_hostel').value,
    block: 'Block', experience: '0 yrs', status: 'active',
    joinDate: new Date().toISOString().split('T')[0]
  });
  logActivity('Warden Account Created', `New warden account for ${name}`);
  closeModal(); toast(`${name} account created`, 'success');
  document.getElementById('nav-badge-wardens').textContent = DB.wardens.length;
  showPage('wardens');
}

function saveNewStaff() {
  const name = document.getElementById('nm_name').value.trim();
  if (!name) { toast('Name is required', 'error'); return; }
  const id = 'M' + String(DB.staff.length+1).padStart(3,'0');
  DB.staff.push({
    id, name,
    phone: document.getElementById('nm_phone').value,
    category: document.getElementById('nm_cat').value,
    hostel: document.getElementById('nm_hostel').value,
    tasks:0, completed:0, status:'available',
    joinDate: new Date().toISOString().split('T')[0]
  });
  logActivity('Staff Added', `New maintenance staff: ${name}`);
  closeModal(); toast(`${name} added`, 'success');
  document.getElementById('nav-badge-staff').textContent = DB.staff.length;
  showPage('staff');
}
