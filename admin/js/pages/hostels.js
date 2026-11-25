/* ═══════════════════════════════════════════════════════
   Hostels & Blocks Page
═══════════════════════════════════════════════════════ */
function renderHostels(container) {
  container.innerHTML = `
  <div class="page-header">
    <div class="page-header-left">
      <h1>Hostels & Blocks</h1>
      <p>Manage hostel buildings, blocks, floors and facilities</p>
    </div>
    <div class="page-header-right">
      <button class="btn btn-primary btn-sm" onclick="openAddHostelModal()"><i class="fas fa-plus"></i> Add Hostel</button>
    </div>
  </div>

  <!-- HOSTEL CARDS GRID -->
  <div id="hostelCardsArea"></div>
  `;

  const area = document.getElementById('hostelCardsArea');
  area.innerHTML = `<div class="grid3">${DB.hostels.map(h => buildHostelCard(h)).join('')}</div>
  <div style="margin-top:24px">
    <div class="card">
      <div class="card-header">
        <div class="card-title"><i class="fas fa-table-cells"></i> Hostel Comparison</div>
      </div>
      <div class="table-wrapper">
        <table>
          <thead><tr><th>Hostel</th><th>Gender</th><th>Blocks</th><th>Floors</th><th>Total Rooms</th><th>Total Beds</th><th>Occupied</th><th>Available</th><th>Maintenance</th><th>Occupancy %</th><th>Status</th></tr></thead>
          <tbody>
            ${DB.hostels.map(h => `
            <tr>
              <td><strong>${h.name}</strong></td>
              <td>${h.gender}</td>
              <td>${h.blocks.join(', ')}</td>
              <td>${h.floors}</td>
              <td style="font-weight:700">${h.totalRooms}</td>
              <td style="font-weight:700">${h.totalBeds}</td>
              <td style="color:var(--primary);font-weight:700">${h.occupied}</td>
              <td style="color:#43E97B;font-weight:700">${h.available}</td>
              <td style="color:#FF4757;font-weight:700">${h.maintenance}</td>
              <td>
                <div style="display:flex;align-items:center;gap:8px">
                  <div class="progress-bar" style="width:80px"><div class="progress-fill ${Math.round(h.occupied/h.totalBeds*100)>=90?'red':Math.round(h.occupied/h.totalBeds*100)>=70?'orange':'green'}" style="width:${Math.round(h.occupied/h.totalBeds*100)}%"></div></div>
                  <span style="font-size:0.8rem;font-weight:700">${Math.round(h.occupied/h.totalBeds*100)}%</span>
                </div>
              </td>
              <td>${statusBadge(h.status)}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
  </div>`;
}

function buildHostelCard(h) {
  const pct = Math.round(h.occupied/h.totalBeds*100);
  const fillClass = pct>=90?'red':pct>=70?'orange':'green';
  return `
  <div class="card" style="overflow:visible">
    <div style="background:linear-gradient(135deg,${h.gender==='Male'?'#6C63FF,#4c46b8':'#FF6584,#c94466'});padding:20px;border-radius:12px 12px 0 0;position:relative;overflow:hidden">
      <div style="position:absolute;top:-20px;right:-20px;width:100px;height:100px;background:rgba(255,255,255,0.08);border-radius:50%"></div>
      <div style="position:absolute;bottom:-30px;right:20px;width:60px;height:60px;background:rgba(255,255,255,0.08);border-radius:50%"></div>
      <div style="color:#fff">
        <div style="display:flex;align-items:center;justify-content:space-between">
          <span class="badge" style="background:rgba(255,255,255,0.2);color:#fff">${h.gender}</span>
          <div style="display:flex;gap:6px">
            <button class="btn btn-xs" style="background:rgba(255,255,255,0.2);color:#fff" onclick="editHostel('${h.id}')"><i class="fas fa-edit"></i></button>
            <button class="btn btn-xs" style="background:rgba(255,255,255,0.2);color:#fff" onclick="manageHostelFacilities('${h.id}')"><i class="fas fa-cog"></i></button>
          </div>
        </div>
        <div style="font-size:1.3rem;font-weight:800;margin-top:12px">${h.name}</div>
        <div style="font-size:0.8rem;opacity:0.8;margin-top:4px"><i class="fas fa-location-dot"></i> ${h.location} · Est. ${h.established}</div>
      </div>
    </div>
    <div class="card-body">
      <div class="mini-stat-row" style="grid-template-columns:1fr 1fr;margin-bottom:14px">
        <div class="mini-stat">
          <div class="mini-stat-icon" style="background:rgba(108,99,255,0.1);color:var(--primary)"><i class="fas fa-layer-group"></i></div>
          <div><div class="mini-stat-val">${h.floors}</div><div class="mini-stat-lbl">Floors</div></div>
        </div>
        <div class="mini-stat">
          <div class="mini-stat-icon" style="background:rgba(67,233,123,0.1);color:#43E97B"><i class="fas fa-door-open"></i></div>
          <div><div class="mini-stat-val">${h.totalRooms}</div><div class="mini-stat-lbl">Rooms</div></div>
        </div>
      </div>
      <div style="margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;font-size:0.78rem;margin-bottom:6px">
          <span style="color:var(--text-secondary)">Occupancy – ${h.occupied}/${h.totalBeds} beds</span>
          <strong>${pct}%</strong>
        </div>
        <div class="progress-bar"><div class="progress-fill ${fillClass}" style="width:${pct}%"></div></div>
      </div>
      <div style="display:flex;justify-content:space-between;text-align:center;padding:10px 0;border-top:1px solid var(--border)">
        <div><div style="font-size:1rem;font-weight:800;color:var(--primary)">${h.occupied}</div><div style="font-size:0.68rem;color:var(--text-muted)">Occupied</div></div>
        <div><div style="font-size:1rem;font-weight:800;color:#43E97B">${h.available}</div><div style="font-size:0.68rem;color:var(--text-muted)">Available</div></div>
        <div><div style="font-size:1rem;font-weight:800;color:#F7B731">${h.reserved}</div><div style="font-size:0.68rem;color:var(--text-muted)">Reserved</div></div>
        <div><div style="font-size:1rem;font-weight:800;color:#FF4757">${h.maintenance}</div><div style="font-size:0.68rem;color:var(--text-muted)">Maint.</div></div>
      </div>
      <div style="margin-top:12px">
        <div style="font-size:0.75rem;font-weight:700;color:var(--text-secondary);margin-bottom:6px">WARDEN</div>
        <div style="display:flex;align-items:center;gap:8px">
          <div class="avatar avatar-sm" style="background:${avatarBg(h.warden)}">${initials(h.warden)}</div>
          <span style="font-size:0.82rem;font-weight:600">${h.warden}</span>
        </div>
      </div>
      <div style="margin-top:12px">
        <div style="font-size:0.75rem;font-weight:700;color:var(--text-secondary);margin-bottom:6px">FACILITIES</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px">
          ${h.facilities.map(f => `<span class="badge badge-blue">${f}</span>`).join('')}
        </div>
      </div>
    </div>
  </div>`;
}

function editHostel(id) {
  const h = DB.hostels.find(x => x.id === id);
  if (!h) return;
  openModal(`Edit Hostel – ${h.name}`, `
    <div class="form-row cols2">
      <div class="field-group"><label class="field-label required">Name</label><input class="field-input" id="eh_name" value="${h.name}"/></div>
      <div class="field-group"><label class="field-label">Gender</label>
        <select class="field-select" id="eh_gender">
          <option ${h.gender==='Male'?'selected':''}>Male</option>
          <option ${h.gender==='Female'?'selected':''}>Female</option>
        </select>
      </div>
      <div class="field-group"><label class="field-label">Location</label><input class="field-input" id="eh_loc" value="${h.location}"/></div>
      <div class="field-group"><label class="field-label">Floors</label><input class="field-input" type="number" id="eh_floors" value="${h.floors}"/></div>
      <div class="field-group"><label class="field-label">Total Rooms</label><input class="field-input" type="number" id="eh_rooms" value="${h.totalRooms}"/></div>
      <div class="field-group"><label class="field-label">Status</label>
        <select class="field-select" id="eh_status">
          <option ${h.status==='active'?'selected':''}>active</option>
          <option ${h.status==='inactive'?'selected':''}>inactive</option>
        </select>
      </div>
    </div>`,
    `<button class="btn btn-outline" onclick="closeModal()">Cancel</button>
     <button class="btn btn-primary" onclick="saveHostelEdit('${id}')">Save</button>`);
}

function saveHostelEdit(id) {
  const h = DB.hostels.find(x => x.id === id);
  if (!h) return;
  h.name   = document.getElementById('eh_name').value;
  h.gender = document.getElementById('eh_gender').value;
  h.location = document.getElementById('eh_loc').value;
  h.floors = +document.getElementById('eh_floors').value;
  h.totalRooms = +document.getElementById('eh_rooms').value;
  h.status = document.getElementById('eh_status').value;
  logActivity('Hostel Updated', `${h.name} details updated`);
  closeModal(); toast('Hostel updated', 'success');
  showPage('hostels');
}

function manageHostelFacilities(id) {
  const h = DB.hostels.find(x => x.id === id);
  const allFacilities = ['Wi-Fi','Laundry','Gym','Canteen','Study Hall','Sports Room','Beauty Salon','Library','Medical','CCTV','Generator'];
  openModal(`Facilities – ${h.name}`, `
    <p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:16px">Select facilities available in this hostel:</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      ${allFacilities.map(f => `
        <label class="toggle-switch">
          <input type="checkbox" id="fac_${f.replace(/\s/g,'')}" ${h.facilities.includes(f)?'checked':''} />
          <div class="toggle-track"></div>
          <span class="toggle-label">${f}</span>
        </label>`).join('')}
    </div>`,
    `<button class="btn btn-outline" onclick="closeModal()">Cancel</button>
     <button class="btn btn-primary" onclick="saveFacilities('${id}')">Save Facilities</button>`);
  window._allFacilities = allFacilities;
}

function saveFacilities(id) {
  const h = DB.hostels.find(x => x.id === id);
  h.facilities = window._allFacilities.filter(f => document.getElementById('fac_'+f.replace(/\s/g,'')).checked);
  logActivity('Facilities Updated', `${h.name} facilities updated`);
  closeModal(); toast('Facilities updated', 'success');
  showPage('hostels');
}

function openAddHostelModal() {
  openModal('Add New Hostel', `
    <div class="form-row cols2">
      <div class="field-group"><label class="field-label required">Hostel Name</label><input class="field-input" id="ah_name" placeholder="e.g. Boys Hostel C"/></div>
      <div class="field-group"><label class="field-label">Gender</label>
        <select class="field-select" id="ah_gender"><option>Male</option><option>Female</option></select>
      </div>
      <div class="field-group"><label class="field-label">Location</label><input class="field-input" id="ah_loc" placeholder="e.g. West Campus"/></div>
      <div class="field-group"><label class="field-label">Floors</label><input class="field-input" type="number" id="ah_floors" value="4"/></div>
      <div class="field-group"><label class="field-label">Total Rooms</label><input class="field-input" type="number" id="ah_rooms" value="60"/></div>
      <div class="field-group"><label class="field-label">Total Beds</label><input class="field-input" type="number" id="ah_beds" value="120"/></div>
    </div>`,
    `<button class="btn btn-outline" onclick="closeModal()">Cancel</button>
     <button class="btn btn-primary" onclick="saveNewHostel()"><i class="fas fa-plus"></i> Add Hostel</button>`);
}

function saveNewHostel() {
  const name = document.getElementById('ah_name').value.trim();
  if (!name) { toast('Hostel name is required','error'); return; }
  const id = 'H' + String(DB.hostels.length+1).padStart(3,'0');
  DB.hostels.push({
    id, name,
    gender: document.getElementById('ah_gender').value,
    blocks: [name.split(' ').pop()[0]],
    floors: +document.getElementById('ah_floors').value,
    totalRooms: +document.getElementById('ah_rooms').value,
    totalBeds: +document.getElementById('ah_beds').value,
    occupied:0, available:+document.getElementById('ah_beds').value,
    maintenance:0, reserved:0,
    warden:'Unassigned', facilities:['Wi-Fi'],
    location: document.getElementById('ah_loc').value,
    established: new Date().getFullYear().toString(), status:'active'
  });
  logActivity('Hostel Added', `New hostel: ${name}`);
  closeModal(); toast(`${name} added`, 'success');
  showPage('hostels');
}
