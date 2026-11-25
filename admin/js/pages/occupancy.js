/* ═══════════════════════════════════════════════════════
   Occupancy Monitor Page – Interactive Floor Map
═══════════════════════════════════════════════════════ */
function renderOccupancy(container) {
  const totalBeds = DB.hostels.reduce((a,h)=>a+h.totalBeds,0);
  const occupied  = DB.hostels.reduce((a,h)=>a+h.occupied,0);
  const available = DB.hostels.reduce((a,h)=>a+h.available,0);
  const maintenance = DB.hostels.reduce((a,h)=>a+h.maintenance,0);
  const reserved  = DB.hostels.reduce((a,h)=>a+h.reserved,0);

  container.innerHTML = `
  <div class="page-header">
    <div class="page-header-left">
      <h1>Occupancy Monitor</h1>
      <p>Real-time hostel occupancy, floor maps and bed allocation overview</p>
    </div>
    <div class="page-header-right">
      <select class="btn btn-outline btn-sm" id="hostelMapFilter" onchange="renderFloorMap()" style="cursor:pointer">
        ${DB.hostels.map((h,i)=>`<option value="${i}">${h.name}</option>`).join('')}
      </select>
    </div>
  </div>

  <!-- SYSTEM-WIDE STATS -->
  <div class="stat-grid" style="grid-template-columns:repeat(5,1fr)">
    <div class="stat-card blue">
      <div class="stat-row">
        <div><div class="stat-value">${totalBeds}</div><div class="stat-label">Total Beds</div></div>
        <div class="stat-icon blue"><i class="fas fa-bed"></i></div>
      </div>
    </div>
    <div class="stat-card purple">
      <div class="stat-row">
        <div><div class="stat-value">${occupied}</div><div class="stat-label">Occupied</div></div>
        <div class="stat-icon purple"><i class="fas fa-user-check"></i></div>
      </div>
    </div>
    <div class="stat-card green">
      <div class="stat-row">
        <div><div class="stat-value">${available}</div><div class="stat-label">Available</div></div>
        <div class="stat-icon green"><i class="fas fa-door-open"></i></div>
      </div>
    </div>
    <div class="stat-card red">
      <div class="stat-row">
        <div><div class="stat-value">${maintenance}</div><div class="stat-label">Maintenance</div></div>
        <div class="stat-icon red"><i class="fas fa-wrench"></i></div>
      </div>
    </div>
    <div class="stat-card orange">
      <div class="stat-row">
        <div><div class="stat-value">${reserved}</div><div class="stat-label">Reserved</div></div>
        <div class="stat-icon orange"><i class="fas fa-bookmark"></i></div>
      </div>
    </div>
  </div>

  <!-- HOSTEL PROGRESS BARS -->
  <div class="card" style="margin-bottom:20px">
    <div class="card-header">
      <div class="card-title"><i class="fas fa-chart-bar"></i> Per-Hostel Occupancy</div>
    </div>
    <div class="card-body">
      ${DB.hostels.map(h => {
        const pct = Math.round(h.occupied/h.totalBeds*100);
        const cls = pct>=90?'red':pct>=70?'orange':'green';
        return `
        <div style="margin-bottom:20px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
            <div>
              <span style="font-weight:700">${h.name}</span>
              <span style="margin-left:10px;font-size:0.75rem;color:var(--text-muted)">${h.gender} · ${h.location}</span>
            </div>
            <div style="display:flex;align-items:center;gap:14px;font-size:0.78rem">
              <span style="color:var(--primary)"><i class="fas fa-user-check"></i> ${h.occupied}</span>
              <span style="color:#43E97B"><i class="fas fa-door-open"></i> ${h.available}</span>
              <span style="color:#FF4757"><i class="fas fa-wrench"></i> ${h.maintenance}</span>
              <strong style="font-size:0.9rem">${pct}%</strong>
            </div>
          </div>
          <div class="progress-bar" style="height:12px">
            <div class="progress-fill ${cls}" style="width:${pct}%"></div>
          </div>
        </div>`;
      }).join('')}
    </div>
  </div>

  <!-- FLOOR MAP -->
  <div class="card">
    <div class="card-header">
      <div class="card-title"><i class="fas fa-map"></i> Interactive Floor Map</div>
      <div style="display:flex;gap:8px;align-items:center">
        <div class="legend">
          <div class="legend-item"><div class="legend-dot" style="background:rgba(108,99,255,0.6)"></div> Occupied</div>
          <div class="legend-item"><div class="legend-dot" style="background:rgba(67,233,123,0.6)"></div> Available</div>
          <div class="legend-item"><div class="legend-dot" style="background:rgba(247,183,49,0.6)"></div> Partial</div>
          <div class="legend-item"><div class="legend-dot" style="background:rgba(255,71,87,0.6)"></div> Maintenance</div>
        </div>
      </div>
    </div>
    <div class="card-body" id="floorMapArea"></div>
  </div>`;

  renderFloorMap();
}

function renderFloorMap() {
  const idx = +(document.getElementById('hostelMapFilter')?.value || 0);
  const h = DB.hostels[idx];
  const area = document.getElementById('floorMapArea');
  if (!area) return;

  // Build simulated room layout
  let html = `<h3 style="margin-bottom:16px;font-size:0.95rem;font-weight:700">${h.name} – Floor Map (${h.floors} Floors × ~${Math.ceil(h.totalRooms/h.floors)} Rooms/Floor)</h3>`;
  const roomsPerFloor = Math.ceil(h.totalRooms / h.floors);
  const statusPool = ['occupied','occupied','occupied','partial','available','available','maintenance'];

  for (let floor = h.floors; floor >= 1; floor--) {
    html += `<div style="margin-bottom:12px"><div style="font-size:0.75rem;font-weight:700;color:var(--text-secondary);margin-bottom:6px"><i class="fas fa-layer-group"></i> Floor ${floor}</div>`;
    html += `<div style="display:flex;flex-wrap:wrap;gap:6px">`;
    for (let r = 1; r <= roomsPerFloor; r++) {
      const roomNum = `${h.blocks[0]}${floor}${String(r).padStart(2,'0')}`;
      // Look up real room first, else simulate
      const realRoom = DB.rooms.find(x => x.number === roomNum);
      const st = realRoom ? realRoom.status : statusPool[Math.floor(Math.random()*statusPool.length)];
      const occ = realRoom ? `${realRoom.occupied}/${realRoom.capacity}` : st==='occupied'?'2/2':st==='partial'?'1/2':st==='maintenance'?'0/2':'0/2';
      html += `
        <div class="room-cell ${st}" onclick="showRoomTooltip('${roomNum}','${st}','${occ}')" title="${roomNum} · ${st}">
          <div class="room-num">${roomNum}</div>
          <div class="room-occ">${occ}</div>
        </div>`;
    }
    html += `</div></div>`;
  }

  // Bed-level grid for selected hostel
  html += `<div style="margin-top:24px">
    <div style="font-size:0.85rem;font-weight:700;margin-bottom:10px">Bed-Level Grid (${h.occupied} occupied of ${h.totalBeds})</div>
    <div class="bed-grid">`;
  for (let i = 1; i <= h.totalBeds; i++) {
    const pct = i/h.totalBeds;
    const st = i <= h.occupied ? 'occupied' : i <= h.occupied+h.maintenance ? 'maintenance' : i <= h.occupied+h.maintenance+h.reserved ? 'reserved' : 'available';
    html += `<div class="bed-cell ${st}" title="Bed ${i}">${i}</div>`;
  }
  html += `</div></div>`;

  area.innerHTML = html;
}

function showRoomTooltip(num, status, occ) {
  const statusNames = { occupied:'Fully Occupied', partial:'Partially Occupied', available:'Available', maintenance:'Under Maintenance' };
  toast(`Room ${num}: ${statusNames[status]||status} (${occ} beds)`, status==='available'?'success':status==='maintenance'?'error':'info', 2500);
}
