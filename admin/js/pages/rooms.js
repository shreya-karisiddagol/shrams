/* ═══════════════════════════════════════════════════════
   Rooms & Beds Page
═══════════════════════════════════════════════════════ */
function renderRooms(container) {
  container.innerHTML = `
  <div class="page-header">
    <div class="page-header-left">
      <h1>Rooms &amp; Beds</h1>
      <p>Manage individual room records, bed assignments and availability</p>
    </div>
    <div class="page-header-right">
      <button class="btn btn-outline btn-sm" onclick="showPage('occupancy')"><i class="fas fa-map"></i> Floor Map</button>
      <button class="btn btn-primary btn-sm" onclick="openAddRoomModal()"><i class="fas fa-plus"></i> Add Room</button>
    </div>
  </div>

  <!-- FILTER BAR -->
  <div class="card" style="margin-bottom:16px">
    <div class="card-body" style="padding:14px 20px">
      <div class="filter-bar">
        <input type="text" id="roomSearch" placeholder="Search room number…" oninput="filterRooms()" />
        <select id="roomHostelFilter" onchange="filterRooms()">
          <option value="">All Hostels</option>
          ${DB.hostels.map(h=>`<option>${h.name}</option>`).join('')}
        </select>
        <select id="roomStatusFilter" onchange="filterRooms()">
          <option value="">All Status</option>
          <option value="occupied">Occupied</option>
          <option value="available">Available</option>
          <option value="partial">Partial</option>
          <option value="maintenance">Maintenance</option>
        </select>
        <select id="roomTypeFilter" onchange="filterRooms()">
          <option value="">All Types</option>
          <option>Single</option>
          <option>Double Sharing</option>
          <option>Triple Sharing</option>
        </select>
      </div>
    </div>
  </div>

  <div class="card">
    <div class="card-header">
      <div class="card-title"><i class="fas fa-door-open"></i> <span id="roomsCountLabel">All Rooms</span></div>
    </div>
    <div class="table-wrapper" id="roomsTable"></div>
    <div class="pagination" id="roomsPagination"></div>
  </div>`;

  filterRooms();
}

let _roomPage = 1;
function filterRooms() {
  const q = document.getElementById('roomSearch')?.value.toLowerCase() || '';
  const hostel = document.getElementById('roomHostelFilter')?.value || '';
  const status = document.getElementById('roomStatusFilter')?.value || '';
  const type   = document.getElementById('roomTypeFilter')?.value || '';
  let data = [...DB.rooms];
  if (q) data = data.filter(r => r.number.toLowerCase().includes(q));
  if (hostel) data = data.filter(r => r.hostel === hostel);
  if (status) data = data.filter(r => r.status === status);
  if (type)   data = data.filter(r => r.type === type);
  _roomPage = 1;
  renderRoomsTable(data);
}

function renderRoomsTable(data) {
  const start = (_roomPage-1)*10;
  const page = data.slice(start, start+10);
  document.getElementById('roomsCountLabel').textContent = `${data.length} Rooms`;
  document.getElementById('roomsTable').innerHTML = `
    <table>
      <thead><tr>
        <th>Room No.</th><th>Hostel</th><th>Block / Floor</th><th>Type</th>
        <th>Capacity</th><th>Occupancy</th><th>Beds</th><th>Status</th><th>Actions</th>
      </tr></thead>
      <tbody>${page.map(r => `
        <tr>
          <td style="font-weight:800;font-size:1rem;color:var(--primary)">${r.number}</td>
          <td style="font-size:0.82rem">${r.hostel}</td>
          <td style="font-size:0.82rem">Block ${r.block} · Floor ${r.floor}</td>
          <td><span class="badge badge-blue">${r.type}</span></td>
          <td style="font-weight:700">${r.capacity}</td>
          <td>
            <div style="display:flex;align-items:center;gap:8px">
              <div class="progress-bar" style="width:60px"><div class="progress-fill ${r.occupied===r.capacity?'red':r.occupied>0?'orange':'green'}" style="width:${Math.round(r.occupied/r.capacity*100)}%"></div></div>
              <span style="font-size:0.78rem;font-weight:700">${r.occupied}/${r.capacity}</span>
            </div>
          </td>
          <td>
            <div style="display:flex;flex-wrap:wrap;gap:4px">
              ${r.beds.map(b => `<span class="badge ${b.endsWith('—')?'badge-gray':'badge-blue'}" style="font-size:0.65rem">${b}</span>`).join('')}
            </div>
          </td>
          <td>${statusBadge(r.status)}</td>
          <td>
            <div style="display:flex;gap:6px">
              <button class="btn btn-outline btn-xs" onclick="viewRoomDetail('${r.id}')"><i class="fas fa-eye"></i></button>
              <button class="btn btn-outline btn-xs" onclick="editRoom('${r.id}')"><i class="fas fa-edit"></i></button>
              <button class="btn btn-${r.status==='maintenance'?'success':'warning'} btn-xs" onclick="toggleRoomMaintenance('${r.id}')" title="${r.status==='maintenance'?'Mark Available':'Set Maintenance'}">
                <i class="fas fa-${r.status==='maintenance'?'check':'wrench'}"></i>
              </button>
            </div>
          </td>
        </tr>`).join('')}
      </tbody>
    </table>`;

  const totalPages = Math.ceil(data.length/10);
  document.getElementById('roomsPagination').innerHTML = `
    <div>Showing ${start+1}–${Math.min(start+10,data.length)} of ${data.length}</div>
    <div class="page-btns">
      ${_roomPage>1?`<button class="page-btn" onclick="_roomPage--;filterRooms()"><i class="fas fa-chevron-left"></i></button>`:''}
      ${Array.from({length:totalPages},(_,i)=>`<button class="page-btn ${i+1===_roomPage?'active':''}" onclick="_roomPage=${i+1};filterRooms()">${i+1}</button>`).join('')}
      ${_roomPage<totalPages?`<button class="page-btn" onclick="_roomPage++;filterRooms()"><i class="fas fa-chevron-right"></i></button>`:''}
    </div>`;
  window._roomsData = data;
}

function viewRoomDetail(id) {
  const r = DB.rooms.find(x => x.id === id);
  if (!r) return;
  const occupants = r.beds.filter(b => !b.endsWith('—')).map(b => {
    const sid = b.split('-')[1];
    const s = DB.students.find(x => x.id === sid);
    return s ? `<div style="display:flex;align-items:center;gap:10px;padding:10px;background:var(--bg);border-radius:8px;margin-bottom:8px">
      <div class="avatar avatar-sm" style="background:${avatarBg(s.name)}">${initials(s.name)}</div>
      <div><div style="font-size:0.82rem;font-weight:600">${s.name}</div><div style="font-size:0.72rem;color:var(--text-muted)">${s.usn} · ${s.dept}</div></div>
    </div>` : '';
  }).join('');
  openModal(`Room ${r.number} Details`, `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px">
      ${[['Room Number',r.number],['Hostel',r.hostel],['Block',`Block ${r.block}`],['Floor',`Floor ${r.floor}`],
         ['Type',r.type],['Capacity',r.capacity],['Occupied',r.occupied],['Available',r.capacity-r.occupied]
        ].map(([k,v])=>`<div class="field-group"><div class="field-label">${k}</div><div style="font-weight:600">${v}</div></div>`).join('')}
    </div>
    <div style="font-size:0.82rem;font-weight:700;color:var(--text-secondary);margin-bottom:10px">OCCUPANTS</div>
    ${occupants || '<div class="empty-state" style="padding:20px"><i class="fas fa-bed"></i><p>No occupants</p></div>'}`,
    `<button class="btn btn-outline" onclick="closeModal()">Close</button>`);
}

function editRoom(id) {
  const r = DB.rooms.find(x => x.id === id);
  openModal(`Edit Room – ${r.number}`, `
    <div class="form-row cols2">
      <div class="field-group"><label class="field-label">Room Number</label><input class="field-input" id="er_num" value="${r.number}"/></div>
      <div class="field-group"><label class="field-label">Floor</label><input class="field-input" type="number" id="er_floor" value="${r.floor}"/></div>
      <div class="field-group"><label class="field-label">Type</label>
        <select class="field-select" id="er_type">
          ${['Single','Double Sharing','Triple Sharing'].map(t=>`<option ${t===r.type?'selected':''}>${t}</option>`).join('')}
        </select>
      </div>
      <div class="field-group"><label class="field-label">Status</label>
        <select class="field-select" id="er_status">
          ${['occupied','available','maintenance','partial'].map(s=>`<option ${s===r.status?'selected':''}>${s}</option>`).join('')}
        </select>
      </div>
    </div>`,
    `<button class="btn btn-outline" onclick="closeModal()">Cancel</button>
     <button class="btn btn-primary" onclick="saveRoomEdit('${id}')">Save</button>`);
}

function saveRoomEdit(id) {
  const r = DB.rooms.find(x => x.id === id);
  r.number = document.getElementById('er_num').value;
  r.floor  = +document.getElementById('er_floor').value;
  r.type   = document.getElementById('er_type').value;
  r.status = document.getElementById('er_status').value;
  r.capacity = r.type==='Single'?1:r.type==='Double Sharing'?2:3;
  logActivity('Room Updated', `Room ${r.number} updated`);
  closeModal(); toast('Room updated','success'); showPage('rooms');
}

function toggleRoomMaintenance(id) {
  const r = DB.rooms.find(x => x.id === id);
  if (r.status === 'maintenance') {
    r.status = r.occupied===r.capacity?'occupied':r.occupied>0?'partial':'available';
    toast(`Room ${r.number} marked as available`,'success');
  } else {
    r.status = 'maintenance';
    toast(`Room ${r.number} set to maintenance`,'warning');
  }
  logActivity('Room Status Changed', `Room ${r.number} → ${r.status}`);
  filterRooms();
}

function openAddRoomModal() {
  openModal('Add New Room', `
    <div class="form-row cols2">
      <div class="field-group"><label class="field-label required">Room Number</label><input class="field-input" id="ar_num" placeholder="e.g. A-201"/></div>
      <div class="field-group"><label class="field-label">Hostel</label>
        <select class="field-select" id="ar_hostel">${DB.hostels.map(h=>`<option>${h.name}</option>`).join('')}</select>
      </div>
      <div class="field-group"><label class="field-label">Block</label><input class="field-input" id="ar_block" placeholder="A"/></div>
      <div class="field-group"><label class="field-label">Floor</label><input class="field-input" type="number" id="ar_floor" value="1"/></div>
      <div class="field-group"><label class="field-label">Type</label>
        <select class="field-select" id="ar_type"><option>Single</option><option>Double Sharing</option><option>Triple Sharing</option></select>
      </div>
    </div>`,
    `<button class="btn btn-outline" onclick="closeModal()">Cancel</button>
     <button class="btn btn-primary" onclick="saveNewRoom()"><i class="fas fa-plus"></i> Add Room</button>`);
}

function saveNewRoom() {
  const num = document.getElementById('ar_num').value.trim();
  if (!num) { toast('Room number required','error'); return; }
  const type = document.getElementById('ar_type').value;
  const cap  = type==='Single'?1:type==='Double Sharing'?2:3;
  const id = 'R' + String(DB.rooms.length+1).padStart(3,'0');
  DB.rooms.push({
    id, number:num,
    hostel: document.getElementById('ar_hostel').value,
    block: document.getElementById('ar_block').value,
    floor: +document.getElementById('ar_floor').value,
    type, capacity:cap, occupied:0, status:'available',
    beds: Array.from({length:cap},(_,i)=>`B0${i+1}-—`)
  });
  logActivity('Room Added', `Room ${num} added`);
  closeModal(); toast(`Room ${num} added`,'success'); showPage('rooms');
}
