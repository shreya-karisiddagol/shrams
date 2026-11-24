/* ═══════════════════════════════════════════════════════
   Maintenance Page
═══════════════════════════════════════════════════════ */
function renderMaintenance(container) {
  const open     = DB.complaints.filter(c=>c.status==='open').length;
  const inprog   = DB.complaints.filter(c=>c.status==='inprogress').length;
  const onhold   = DB.complaints.filter(c=>c.status==='onhold').length;
  const resolved = DB.complaints.filter(c=>c.status==='resolved').length;
  const critical = DB.complaints.filter(c=>c.priority==='critical').length;

  container.innerHTML = `
  <div class="page-header">
    <div class="page-header-left">
      <h1>Maintenance &amp; Complaints</h1>
      <p>Monitor and manage all hostel maintenance complaints</p>
    </div>
    <div class="page-header-right">
      <button class="btn btn-outline btn-sm" onclick="exportComplaints()"><i class="fas fa-download"></i> Export</button>
    </div>
  </div>

  ${critical>0?`
  <div style="background:rgba(255,71,87,0.08);border:1px solid rgba(255,71,87,0.3);border-radius:12px;padding:14px 18px;margin-bottom:16px;display:flex;align-items:center;gap:12px">
    <i class="fas fa-fire" style="color:var(--danger);font-size:1.2rem"></i>
    <div>
      <strong style="color:var(--danger)">${critical} Critical Complaint${critical>1?'s':''} Require Immediate Attention</strong>
      <div style="font-size:0.8rem;color:var(--text-secondary);margin-top:2px">Please review and assign maintenance staff immediately.</div>
    </div>
    <button class="btn btn-danger btn-sm" style="margin-left:auto" onclick="filterByPriority('critical')">View Critical</button>
  </div>`:''}

  <!-- STAT ROW -->
  <div class="mini-stat-row" style="grid-template-columns:repeat(5,1fr);margin-bottom:20px">
    <div class="mini-stat" style="cursor:pointer" onclick="filterByStatus('')">
      <div class="mini-stat-icon" style="background:rgba(108,99,255,0.1);color:var(--primary)"><i class="fas fa-list"></i></div>
      <div><div class="mini-stat-val">${DB.complaints.length}</div><div class="mini-stat-lbl">Total</div></div>
    </div>
    <div class="mini-stat" style="cursor:pointer" onclick="filterByStatus('open')">
      <div class="mini-stat-icon" style="background:rgba(255,71,87,0.1);color:#FF4757"><i class="fas fa-circle-exclamation"></i></div>
      <div><div class="mini-stat-val">${open}</div><div class="mini-stat-lbl">Open</div></div>
    </div>
    <div class="mini-stat" style="cursor:pointer" onclick="filterByStatus('inprogress')">
      <div class="mini-stat-icon" style="background:rgba(46,217,255,0.1);color:#2ED9FF"><i class="fas fa-spinner"></i></div>
      <div><div class="mini-stat-val">${inprog}</div><div class="mini-stat-lbl">In Progress</div></div>
    </div>
    <div class="mini-stat" style="cursor:pointer" onclick="filterByStatus('onhold')">
      <div class="mini-stat-icon" style="background:rgba(247,183,49,0.1);color:#F7B731"><i class="fas fa-pause"></i></div>
      <div><div class="mini-stat-val">${onhold}</div><div class="mini-stat-lbl">On Hold</div></div>
    </div>
    <div class="mini-stat" style="cursor:pointer" onclick="filterByStatus('resolved')">
      <div class="mini-stat-icon" style="background:rgba(67,233,123,0.1);color:#43E97B"><i class="fas fa-check-circle"></i></div>
      <div><div class="mini-stat-val">${resolved}</div><div class="mini-stat-lbl">Resolved</div></div>
    </div>
  </div>

  <div class="card">
    <div class="card-header">
      <div class="card-title"><i class="fas fa-wrench"></i> Complaints</div>
      <div class="filter-bar" style="margin:0">
        <input type="text" id="complaintSearch" placeholder="Search…" oninput="renderComplaintsTable()" />
        <select id="complaintStatusFilter" onchange="renderComplaintsTable()">
          <option value="">All Status</option>
          <option>open</option><option value="inprogress">In Progress</option>
          <option value="onhold">On Hold</option><option>resolved</option>
        </select>
        <select id="complaintPriorityFilter" onchange="renderComplaintsTable()">
          <option value="">All Priority</option>
          <option>critical</option><option>high</option><option>medium</option><option>low</option>
        </select>
        <select id="complaintHostelFilter" onchange="renderComplaintsTable()">
          <option value="">All Hostels</option>
          ${DB.hostels.map(h=>`<option>${h.name}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="table-wrapper" id="complaintsTable"></div>
  </div>`;

  window._maintStatusFilter = '';
  renderComplaintsTable();
}

function filterByStatus(s) {
  const sel = document.getElementById('complaintStatusFilter');
  if (sel) { sel.value=s; renderComplaintsTable(); }
}
function filterByPriority(p) {
  const sel = document.getElementById('complaintPriorityFilter');
  if (sel) { sel.value=p; renderComplaintsTable(); }
}

function renderComplaintsTable() {
  const q = document.getElementById('complaintSearch')?.value.toLowerCase()||'';
  const st = document.getElementById('complaintStatusFilter')?.value||'';
  const pr = document.getElementById('complaintPriorityFilter')?.value||'';
  const ht = document.getElementById('complaintHostelFilter')?.value||'';
  let data = [...DB.complaints];
  if (q) data = data.filter(c=>c.name.toLowerCase().includes(q)||c.desc.toLowerCase().includes(q)||c.room.includes(q));
  if (st) data = data.filter(c=>c.status===st);
  if (pr) data = data.filter(c=>c.priority===pr);
  if (ht) data = data.filter(c=>c.hostel===ht);

  document.getElementById('complaintsTable').innerHTML = `
    <table>
      <thead><tr>
        <th>ID</th><th>Student / Room</th><th>Category</th><th>Description</th>
        <th>Priority</th><th>Assigned To</th><th>Submitted</th><th>Status</th><th>Actions</th>
      </tr></thead>
      <tbody>${data.map(c => {
        const staff = DB.staff.find(s=>s.id===c.assignedTo);
        return `
        <tr>
          <td style="font-weight:800;color:var(--primary)">${c.id}</td>
          <td>
            <div style="font-weight:600;font-size:0.85rem">${c.name}</div>
            <div style="font-size:0.72rem;color:var(--text-muted)">Room ${c.room} · ${c.hostel.replace('Boys ','').replace('Girls ','')}</div>
          </td>
          <td><span class="badge badge-blue">${c.category}</span></td>
          <td style="font-size:0.82rem;max-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${c.desc}</td>
          <td>${priorityBadge(c.priority)}</td>
          <td>
            ${staff?`<div style="display:flex;align-items:center;gap:6px">
              <div class="avatar avatar-sm" style="background:${avatarBg(staff.name)}">${initials(staff.name)}</div>
              <span style="font-size:0.78rem">${staff.name}</span>
            </div>`:`<button class="btn btn-outline btn-xs" onclick="openAssignModal('${c.id}')"><i class="fas fa-plus"></i> Assign</button>`}
          </td>
          <td style="font-size:0.78rem">${formatDate(c.submittedDate)}</td>
          <td>${statusBadge(c.status)}</td>
          <td>
            <div style="display:flex;gap:5px">
              <button class="btn btn-outline btn-xs" onclick="viewComplaint('${c.id}')"><i class="fas fa-eye"></i></button>
              ${c.status!=='resolved'?`<button class="btn btn-success btn-xs" onclick="resolveComplaint('${c.id}')"><i class="fas fa-check"></i></button>`:''}
              ${c.assignedTo&&c.status==='open'?`<button class="btn btn-warning btn-xs" onclick="changeStatus('${c.id}','inprogress')"><i class="fas fa-play"></i></button>`:''}
            </div>
          </td>
        </tr>`;
      }).join('')}
      </tbody>
    </table>
    ${data.length===0?`<div class="empty-state"><i class="fas fa-wrench"></i><p>No complaints found</p></div>`:''}`;
}

function viewComplaint(id) {
  const c = DB.complaints.find(x=>x.id===id);
  const staff = DB.staff.find(s=>s.id===c.assignedTo);
  openModal(`Complaint ${c.id}`, `
    <div class="form-row cols2" style="margin-bottom:16px">
      ${[['Student',c.name],['Room',c.room],['Hostel',c.hostel],['Category',c.category],
         ['Priority',''],['Status',''],['Submitted',formatDate(c.submittedDate)],
         ['Resolved',c.resolvedDate?formatDate(c.resolvedDate):'Pending'],
         ['Assigned To',staff?staff.name:'Unassigned']
        ].map(([k,v])=>`<div class="field-group"><div class="field-label">${k}</div><div style="font-weight:600">${
          k==='Priority'?priorityBadge(c.priority):k==='Status'?statusBadge(c.status):v}</div></div>`).join('')}
    </div>
    <div style="background:var(--bg);padding:14px;border-radius:10px;margin-bottom:16px">
      <div class="field-label">Description</div>
      <p style="font-size:0.88rem;margin-top:4px">${c.desc}</p>
    </div>
    ${c.status!=='resolved'?`
    <div style="background:var(--primary-light);padding:14px;border-radius:10px">
      <div style="font-size:0.82rem;font-weight:700;margin-bottom:10px">Quick Actions</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn-outline btn-sm" onclick="closeModal();openAssignModal('${c.id}')"><i class="fas fa-user-plus"></i> Assign/Reassign</button>
        <button class="btn btn-warning btn-sm" onclick="changeStatus('${c.id}','onhold');closeModal()"><i class="fas fa-pause"></i> Hold</button>
        <button class="btn btn-success btn-sm" onclick="resolveComplaint('${c.id}');closeModal()"><i class="fas fa-check"></i> Mark Resolved</button>
      </div>
    </div>`:''}`,
    `<button class="btn btn-outline" onclick="closeModal()">Close</button>`);
}

function openAssignModal(id) {
  const c = DB.complaints.find(x=>x.id===id);
  const availStaff = DB.staff.filter(s=>s.category===c.category||s.category==='General');
  openModal(`Assign Complaint ${id}`, `
    <div style="background:var(--bg);padding:12px;border-radius:10px;margin-bottom:16px">
      <strong>${c.desc}</strong>
      <div style="font-size:0.8rem;color:var(--text-secondary);margin-top:4px">
        ${c.room} · ${priorityBadge(c.priority)}
      </div>
    </div>
    <div class="field-group">
      <label class="field-label required">Select Staff (${c.category})</label>
      <select class="field-select" id="assignStaffSel">
        <option value="">Choose staff member…</option>
        ${availStaff.map(s=>`<option value="${s.id}">${s.name} – ${s.category} (${s.tasks} active tasks, ${statusBadge(s.status).replace(/<[^>]+>/g,'')})</option>`).join('')}
        ${DB.staff.filter(s=>s.category!==c.category&&s.category!=='General').map(s=>`<option value="${s.id}">[Other] ${s.name} – ${s.category}</option>`).join('')}
      </select>
    </div>`,
    `<button class="btn btn-outline" onclick="closeModal()">Cancel</button>
     <button class="btn btn-primary" onclick="confirmAssign('${id}')"><i class="fas fa-user-plus"></i> Assign</button>`);
}

function confirmAssign(id) {
  const c = DB.complaints.find(x=>x.id===id);
  const staffId = document.getElementById('assignStaffSel').value;
  if (!staffId) { toast('Please select a staff member','error'); return; }
  const prevStaff = DB.staff.find(s=>s.id===c.assignedTo);
  if (prevStaff) prevStaff.tasks = Math.max(0, prevStaff.tasks-1);
  c.assignedTo = staffId;
  c.status = 'inprogress';
  const staff = DB.staff.find(s=>s.id===staffId);
  staff.tasks++;
  staff.status = 'busy';
  logActivity('Complaint Assigned', `${c.id} assigned to ${staff.name}`);
  closeModal(); toast(`Complaint assigned to ${staff.name}`, 'success');
  document.getElementById('nav-badge-maint').textContent = DB.complaints.filter(c=>c.status==='open'||c.status==='onhold').length;
  renderComplaintsTable();
}

function resolveComplaint(id) {
  const c = DB.complaints.find(x=>x.id===id);
  c.status = 'resolved';
  c.resolvedDate = new Date().toISOString().split('T')[0];
  const staff = DB.staff.find(s=>s.id===c.assignedTo);
  if (staff) { staff.tasks=Math.max(0,staff.tasks-1); staff.completed++; if(staff.tasks===0)staff.status='available'; }
  logActivity('Complaint Resolved', `${c.id}: ${c.desc}`);
  toast(`Complaint ${id} marked as resolved`, 'success');
  document.getElementById('nav-badge-maint').textContent = DB.complaints.filter(c=>c.status==='open'||c.status==='onhold').length;
  renderComplaintsTable();
}

function changeStatus(id, status) {
  const c = DB.complaints.find(x=>x.id===id);
  c.status = status;
  toast(`Complaint ${id} → ${status}`, 'info');
  renderComplaintsTable();
}

function exportComplaints() { toast('Maintenance report exported (CSV)', 'success'); }
