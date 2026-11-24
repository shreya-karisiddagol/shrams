/* ═══════════════════════════════════════════════════════
   Announcements Page
═══════════════════════════════════════════════════════ */
function renderAnnouncements(container) {
  container.innerHTML = `
  <div class="page-header">
    <div class="page-header-left">
      <h1>Announcements</h1>
      <p>Publish and manage hostel notices and important announcements</p>
    </div>
    <div class="page-header-right">
      <button class="btn btn-primary btn-sm" onclick="openNewAnnouncementModal()">
        <i class="fas fa-plus"></i> New Announcement
      </button>
    </div>
  </div>

  <!-- FILTER BAR -->
  <div class="filter-bar" style="margin-bottom:16px">
    <input type="text" id="annSearch" placeholder="Search announcements…" oninput="filterAnnouncements()" />
    <select id="annTypeFilter" onchange="filterAnnouncements()">
      <option value="">All Types</option>
      <option value="info">Info</option>
      <option value="warning">Warning</option>
      <option value="urgent">Urgent</option>
    </select>
  </div>

  <!-- PINNED -->
  ${DB.announcements.filter(a=>a.pinned).length?`
  <div style="margin-bottom:20px">
    <div style="font-size:0.8rem;font-weight:700;color:var(--text-muted);letter-spacing:1px;margin-bottom:10px"><i class="fas fa-thumbtack"></i> PINNED</div>
    <div id="pinnedAnn">
      ${DB.announcements.filter(a=>a.pinned).map(a=>buildAnnouncementCard(a)).join('')}
    </div>
  </div>`:''}

  <!-- ALL ANNOUNCEMENTS -->
  <div>
    <div style="font-size:0.8rem;font-weight:700;color:var(--text-muted);letter-spacing:1px;margin-bottom:10px">ALL ANNOUNCEMENTS</div>
    <div id="announcementsList">
      ${DB.announcements.map(a=>buildAnnouncementCard(a)).join('')}
    </div>
  </div>`;

  filterAnnouncements();
}

function buildAnnouncementCard(a) {
  const typeColors = { info:'var(--primary)', warning:'var(--warning)', urgent:'var(--danger)' };
  const typeIcons  = { info:'fa-info-circle', warning:'fa-exclamation-triangle', urgent:'fa-fire' };
  return `
  <div class="announcement-card ${a.type}" data-ann-id="${a.id}" data-type="${a.type}">
    <div class="ann-header">
      <div style="display:flex;align-items:flex-start;gap:12px;flex:1">
        <div style="width:36px;height:36px;border-radius:10px;background:${typeColors[a.type]}1a;display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <i class="fas ${typeIcons[a.type]}" style="color:${typeColors[a.type]}"></i>
        </div>
        <div>
          <div class="ann-title">${a.title}</div>
          <div class="ann-meta">
            <span><i class="fas fa-calendar"></i> ${formatDate(a.date)}</span>
            <span><i class="fas fa-user"></i> ${a.author}</span>
            <span><i class="fas fa-users"></i> ${a.audience.join(', ')}</span>
            ${a.pinned?'<span style="color:var(--primary)"><i class="fas fa-thumbtack"></i> Pinned</span>':''}
          </div>
        </div>
      </div>
      <div style="display:flex;gap:6px">
        <button class="btn btn-outline btn-xs" onclick="editAnnouncement('${a.id}')"><i class="fas fa-edit"></i></button>
        <button class="btn btn-outline btn-xs" onclick="togglePin('${a.id}')"><i class="fas fa-thumbtack"></i></button>
        <button class="btn btn-danger btn-xs" onclick="deleteAnnouncement('${a.id}')"><i class="fas fa-trash"></i></button>
      </div>
    </div>
    <div class="ann-body">${a.body}</div>
  </div>`;
}

function filterAnnouncements() {
  const q = document.getElementById('annSearch')?.value.toLowerCase()||'';
  const t = document.getElementById('annTypeFilter')?.value||'';
  const list = document.getElementById('announcementsList');
  if (!list) return;
  DB.announcements.forEach(a => {
    const el = list.querySelector(`[data-ann-id="${a.id}"]`);
    if (!el) return;
    const show = (!q||a.title.toLowerCase().includes(q)||a.body.toLowerCase().includes(q)) && (!t||a.type===t);
    el.style.display = show?'':'none';
  });
}

function openNewAnnouncementModal() {
  openModal('New Announcement', `
    <div class="form-row" style="gap:14px">
      <div class="field-group">
        <label class="field-label required">Title</label>
        <input class="field-input" id="na_title" placeholder="Announcement title…" />
      </div>
      <div class="form-row cols2">
        <div class="field-group">
          <label class="field-label">Type</label>
          <select class="field-select" id="na_type">
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
        <div class="field-group">
          <label class="field-label">Audience</label>
          <select class="field-select" id="na_audience">
            <option value="all">All (Students + Wardens)</option>
            <option value="students">Students Only</option>
            <option value="wardens">Wardens Only</option>
          </select>
        </div>
      </div>
      <div class="field-group">
        <label class="field-label required">Message</label>
        <textarea class="field-textarea" id="na_body" placeholder="Write your announcement here…"></textarea>
      </div>
      <div class="field-group">
        <label class="toggle-switch">
          <input type="checkbox" id="na_pinned" />
          <div class="toggle-track"></div>
          <span class="toggle-label">Pin this announcement</span>
        </label>
      </div>
    </div>`,
    `<button class="btn btn-outline" onclick="closeModal()">Cancel</button>
     <button class="btn btn-primary" onclick="publishAnnouncement()"><i class="fas fa-bullhorn"></i> Publish</button>`);
}

function publishAnnouncement() {
  const title = document.getElementById('na_title').value.trim();
  const body  = document.getElementById('na_body').value.trim();
  if (!title || !body) { toast('Title and message are required','error'); return; }
  const audVal = document.getElementById('na_audience').value;
  const audience = audVal==='all'?['Students','Wardens']:audVal==='students'?['Students']:['Wardens'];
  const id = 'AN' + String(DB.announcements.length+1).padStart(3,'0');
  DB.announcements.unshift({
    id, title, body,
    type: document.getElementById('na_type').value,
    audience,
    date: new Date().toISOString().split('T')[0],
    author: 'Admin',
    pinned: document.getElementById('na_pinned').checked
  });
  logActivity('Announcement Published', title);
  closeModal(); toast('Announcement published successfully!','success');
  showPage('announcements');
}

function editAnnouncement(id) {
  const a = DB.announcements.find(x=>x.id===id);
  openModal(`Edit – ${a.title}`, `
    <div class="form-row" style="gap:14px">
      <div class="field-group"><label class="field-label">Title</label><input class="field-input" id="ea_title" value="${a.title}"/></div>
      <div class="form-row cols2">
        <div class="field-group"><label class="field-label">Type</label>
          <select class="field-select" id="ea_type">
            ${['info','warning','urgent'].map(t=>`<option ${t===a.type?'selected':''}>${t}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="field-group"><label class="field-label">Message</label>
        <textarea class="field-textarea" id="ea_body">${a.body}</textarea>
      </div>
    </div>`,
    `<button class="btn btn-outline" onclick="closeModal()">Cancel</button>
     <button class="btn btn-primary" onclick="saveAnnouncementEdit('${id}')">Save</button>`);
}

function saveAnnouncementEdit(id) {
  const a = DB.announcements.find(x=>x.id===id);
  a.title = document.getElementById('ea_title').value;
  a.type  = document.getElementById('ea_type').value;
  a.body  = document.getElementById('ea_body').value;
  logActivity('Announcement Updated', a.title);
  closeModal(); toast('Announcement updated','success');
  showPage('announcements');
}

function togglePin(id) {
  const a = DB.announcements.find(x=>x.id===id);
  a.pinned = !a.pinned;
  toast(`"${a.title}" ${a.pinned?'pinned':'unpinned'}`, 'info');
  showPage('announcements');
}

function deleteAnnouncement(id) {
  openModal('Delete Announcement','<p style="font-size:0.9rem;color:var(--text-secondary)">Delete this announcement? This cannot be undone.</p>',
    `<button class="btn btn-outline" onclick="closeModal()">Cancel</button>
     <button class="btn btn-danger" onclick="confirmDeleteAnn('${id}')"><i class="fas fa-trash"></i> Delete</button>`);
}

function confirmDeleteAnn(id) {
  const idx = DB.announcements.findIndex(x=>x.id===id);
  if (idx>-1) { logActivity('Announcement Deleted', DB.announcements[idx].title); DB.announcements.splice(idx,1); }
  closeModal(); toast('Announcement deleted','info');
  showPage('announcements');
}
