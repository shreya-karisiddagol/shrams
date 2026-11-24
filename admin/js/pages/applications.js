/* ═══════════════════════════════════════════════════════
   Applications Page
═══════════════════════════════════════════════════════ */
function renderApplications(container) {
  const pending  = DB.applications.filter(a=>a.status==='pending').length;
  const approved = DB.applications.filter(a=>a.status==='approved').length;
  const rejected = DB.applications.filter(a=>a.status==='rejected').length;

  container.innerHTML = `
  <div class="page-header">
    <div class="page-header-left">
      <h1>Hostel Applications</h1>
      <p>Review, approve or reject student accommodation applications</p>
    </div>
    <div class="page-header-right">
      <button class="btn btn-outline btn-sm" onclick="autoAllocateAll()"><i class="fas fa-robot"></i> Auto-Allocate</button>
      <button class="btn btn-primary btn-sm" onclick="exportApps()"><i class="fas fa-download"></i> Export</button>
    </div>
  </div>

  <!-- STAT MINI ROW -->
  <div class="mini-stat-row" style="margin-bottom:20px;grid-template-columns:repeat(4,1fr)">
    <div class="mini-stat">
      <div class="mini-stat-icon" style="background:rgba(108,99,255,0.1);color:var(--primary)"><i class="fas fa-file-alt"></i></div>
      <div><div class="mini-stat-val">${DB.applications.length}</div><div class="mini-stat-lbl">Total</div></div>
    </div>
    <div class="mini-stat">
      <div class="mini-stat-icon" style="background:rgba(247,183,49,0.1);color:#F7B731"><i class="fas fa-clock"></i></div>
      <div><div class="mini-stat-val">${pending}</div><div class="mini-stat-lbl">Pending</div></div>
    </div>
    <div class="mini-stat">
      <div class="mini-stat-icon" style="background:rgba(67,233,123,0.1);color:#43E97B"><i class="fas fa-check"></i></div>
      <div><div class="mini-stat-val">${approved}</div><div class="mini-stat-lbl">Approved</div></div>
    </div>
    <div class="mini-stat">
      <div class="mini-stat-icon" style="background:rgba(255,71,87,0.1);color:#FF4757"><i class="fas fa-times"></i></div>
      <div><div class="mini-stat-val">${rejected}</div><div class="mini-stat-lbl">Rejected</div></div>
    </div>
  </div>

  <!-- TABS -->
  <div class="card">
    <div class="card-header" style="flex-direction:column;align-items:flex-start;gap:12px">
      <div class="tab-nav" style="margin:0;border:none;width:100%">
        <button class="tab-btn active" data-tab="tab-all"     onclick="switchAppTab('all')">All (${DB.applications.length})</button>
        <button class="tab-btn"        data-tab="tab-pending" onclick="switchAppTab('pending')">Pending (${pending})</button>
        <button class="tab-btn"        data-tab="tab-approved" onclick="switchAppTab('approved')">Approved (${approved})</button>
        <button class="tab-btn"        data-tab="tab-rejected" onclick="switchAppTab('rejected')">Rejected (${rejected})</button>
      </div>
      <div class="filter-bar" style="margin:0">
        <input type="text" id="appSearch" placeholder="Search applicant…" oninput="renderAppTable()" />
        <select id="appHostelFilter" onchange="renderAppTable()">
          <option value="">All Hostels</option>
          ${DB.hostels.map(h=>`<option>${h.name}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="table-wrapper" id="appTableWrap"></div>
  </div>`;

  window._appStatusFilter = '';
  renderAppTable();
}

function switchAppTab(status) {
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
  event.target.classList.add('active');
  window._appStatusFilter = status==='all'?'':status;
  renderAppTable();
}

function renderAppTable() {
  const q = document.getElementById('appSearch')?.value.toLowerCase()||'';
  const hostel = document.getElementById('appHostelFilter')?.value||'';
  let data = [...DB.applications];
  if (window._appStatusFilter) data = data.filter(a=>a.status===window._appStatusFilter);
  if (q) data = data.filter(a=>a.name.toLowerCase().includes(q)||a.usn.toLowerCase().includes(q));
  if (hostel) data = data.filter(a=>a.hostelPref===hostel);

  document.getElementById('appTableWrap').innerHTML = `
    <table>
      <thead><tr>
        <th>Applicant</th><th>Dept</th><th>Hostel Pref.</th><th>Room Type</th><th>Applied</th><th>Priority</th><th>Status</th><th>Actions</th>
      </tr></thead>
      <tbody>${data.map(a => `
        <tr>
          <td>
            <div style="display:flex;align-items:center;gap:10px">
              <div class="avatar" style="background:${avatarBg(a.name)}">${initials(a.name)}</div>
              <div>
                <div style="font-weight:600;font-size:0.85rem">${a.name}</div>
                <div style="font-size:0.72rem;color:var(--text-muted)">${a.usn}</div>
              </div>
            </div>
          </td>
          <td style="font-size:0.82rem">${a.dept}</td>
          <td style="font-size:0.82rem">${a.hostelPref}</td>
          <td><span class="badge badge-blue">${a.roomType}</span></td>
          <td style="font-size:0.78rem">${formatDate(a.appliedDate)}</td>
          <td>${a.priority==='urgent'?'<span class="priority critical"><i class="fas fa-fire"></i> Urgent</span>':'<span style="font-size:0.78rem;color:var(--text-muted)">Normal</span>'}</td>
          <td>${statusBadge(a.status)}</td>
          <td>
            <div style="display:flex;gap:6px">
              <button class="btn btn-outline btn-xs" onclick="viewApplication('${a.id}')"><i class="fas fa-eye"></i></button>
              ${a.status==='pending'?`
              <button class="btn btn-success btn-xs" onclick="approveApp('${a.id}')"><i class="fas fa-check"></i></button>
              <button class="btn btn-danger btn-xs" onclick="rejectApp('${a.id}')"><i class="fas fa-times"></i></button>`:
              `<button class="btn btn-outline btn-xs" onclick="resetApp('${a.id}')"><i class="fas fa-undo"></i></button>`}
            </div>
          </td>
        </tr>`).join('')}
      </tbody>
    </table>
    ${data.length===0?`<div class="empty-state"><i class="fas fa-file-alt"></i><p>No applications found</p></div>`:''}`;
}

function viewApplication(id) {
  const a = DB.applications.find(x=>x.id===id);
  openModal(`Application – ${a.id}`, `
    <div style="background:var(--bg);border-radius:12px;padding:16px;margin-bottom:16px;display:flex;align-items:center;gap:16px">
      <div class="avatar avatar-lg" style="background:${avatarBg(a.name)}">${initials(a.name)}</div>
      <div>
        <div style="font-size:1.1rem;font-weight:800">${a.name}</div>
        <div style="color:var(--text-secondary);font-size:0.85rem">${a.usn} · ${a.dept}</div>
        <div style="margin-top:6px">${statusBadge(a.status)}</div>
      </div>
    </div>
    <div class="form-row cols2">
      ${[['Application ID',a.id],['Preferred Hostel',a.hostelPref],['Room Type',a.roomType],
         ['Applied Date',formatDate(a.appliedDate)],['Priority',a.priority]
        ].map(([k,v])=>`<div class="field-group"><div class="field-label">${k}</div><div style="font-weight:600">${v}</div></div>`).join('')}
    </div>
    ${a.status==='pending'?`
    <div style="margin-top:16px;padding:14px;background:var(--primary-light);border-radius:10px;border-left:4px solid var(--primary)">
      <strong style="font-size:0.85rem">Manual Allocation</strong>
      <div class="form-row cols2" style="margin-top:10px">
        <div class="field-group"><label class="field-label">Assign Room</label>
          <select class="field-select" id="manualRoom">
            <option value="">Auto Select</option>
            ${DB.rooms.filter(r=>r.occupied<r.capacity&&r.status!=='maintenance').map(r=>`<option value="${r.id}">${r.number} (${r.hostel})</option>`).join('')}
          </select>
        </div>
      </div>
    </div>`:''}`,
    a.status==='pending'?`
      <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
      <button class="btn btn-danger" onclick="closeModal();rejectApp('${id}')"><i class="fas fa-times"></i> Reject</button>
      <button class="btn btn-success" onclick="approveAppWithRoom('${id}')"><i class="fas fa-check"></i> Approve</button>`
    :`<button class="btn btn-outline" onclick="closeModal()">Close</button>`);
}

function approveApp(id) {
  const a = DB.applications.find(x=>x.id===id);
  a.status = 'approved';
  // Find available room in preferred hostel
  const room = DB.rooms.find(r => r.hostel===a.hostelPref && r.occupied<r.capacity && r.status!=='maintenance');
  if (room) {
    room.occupied++;
    if (room.occupied>=room.capacity) room.status='occupied'; else room.status='partial';
    toast(`${a.name} approved → Room ${room.number}`, 'success');
  } else {
    toast(`${a.name} approved (no room in preferred hostel, will be waitlisted)`, 'warning');
  }
  logActivity('Application Approved', `${a.name} (${a.id}) approved`);
  document.getElementById('nav-badge-apps').textContent = DB.applications.filter(x=>x.status==='pending').length;
  renderAppTable();
}

function approveAppWithRoom(id) {
  const roomId = document.getElementById('manualRoom')?.value;
  closeModal();
  approveApp(id);
}

function rejectApp(id) {
  const a = DB.applications.find(x=>x.id===id);
  openModal('Reject Application', `
    <p style="margin-bottom:14px;font-size:0.9rem">Rejecting application for <strong>${a.name}</strong>. Please provide a reason:</p>
    <textarea class="field-textarea" id="rejectReason" placeholder="Reason for rejection…"></textarea>`,
    `<button class="btn btn-outline" onclick="closeModal()">Cancel</button>
     <button class="btn btn-danger" onclick="confirmRejectApp('${id}')"><i class="fas fa-times"></i> Reject</button>`);
}

function confirmRejectApp(id) {
  const a = DB.applications.find(x=>x.id===id);
  a.status = 'rejected';
  logActivity('Application Rejected', `${a.name} (${a.id}): ${document.getElementById('rejectReason').value}`);
  closeModal(); toast(`${a.name}'s application rejected`, 'error');
  document.getElementById('nav-badge-apps').textContent = DB.applications.filter(x=>x.status==='pending').length;
  renderAppTable();
}

function resetApp(id) {
  const a = DB.applications.find(x=>x.id===id);
  a.status = 'pending';
  toast(`Application ${id} reset to pending`, 'info');
  renderAppTable();
}

function autoAllocateAll() {
  const pending = DB.applications.filter(a=>a.status==='pending');
  let count = 0;
  pending.forEach(a => {
    const room = DB.rooms.find(r=>r.hostel===a.hostelPref&&r.occupied<r.capacity&&r.status!=='maintenance');
    if (room) { a.status='approved'; room.occupied++; if(room.occupied>=room.capacity)room.status='occupied';else room.status='partial'; count++; }
  });
  logActivity('Auto-Allocation', `${count} applications processed automatically`);
  toast(`Auto-allocated ${count} of ${pending.length} pending applications`, 'success');
  document.getElementById('nav-badge-apps').textContent = DB.applications.filter(x=>x.status==='pending').length;
  showPage('applications');
}

function exportApps() { toast('Application report exported (CSV)', 'success'); }
