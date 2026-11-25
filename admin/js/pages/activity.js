/* ═══════════════════════════════════════════════════════
   Activity Log Page
═══════════════════════════════════════════════════════ */
function renderActivity(container) {
  container.innerHTML = `
  <div class="page-header">
    <div class="page-header-left">
      <h1>Activity Log</h1>
      <p>Monitor all administrative actions and system events</p>
    </div>
    <div class="page-header-right">
      <button class="btn btn-outline btn-sm" onclick="exportActivity()"><i class="fas fa-download"></i> Export Log</button>
      <button class="btn btn-danger btn-sm" onclick="clearActivityLog()"><i class="fas fa-trash"></i> Clear Log</button>
    </div>
  </div>

  <!-- FILTER BAR -->
  <div class="filter-bar" style="margin-bottom:16px">
    <input type="text" id="activitySearch" placeholder="Search activity…" oninput="filterActivity()" style="min-width:240px"/>
    <select id="activityTypeFilter" onchange="filterActivity()">
      <option value="">All Types</option>
      <option value="success">Success</option>
      <option value="danger">Critical</option>
      <option value="warning">Warning</option>
      <option value="info">Info</option>
    </select>
    <input type="date" id="activityDateFilter" onchange="filterActivity()" />
  </div>

  <div class="card">
    <div class="card-header">
      <div class="card-title"><i class="fas fa-clock-rotate-left"></i> <span id="activityCount">All Activity</span></div>
    </div>
    <div id="activityList"></div>
    <div class="pagination" id="activityPagination"></div>
  </div>`;

  window._activityPage = 1;
  filterActivity();
}

function filterActivity() {
  const q = document.getElementById('activitySearch')?.value.toLowerCase()||'';
  const t = document.getElementById('activityTypeFilter')?.value||'';
  let data = [...DB.activityLog];
  if (q) data = data.filter(l => l.action.toLowerCase().includes(q) || l.detail.toLowerCase().includes(q));
  if (t) data = data.filter(l => l.type === t);
  window._activityPage = 1;
  renderActivityList(data);
}

function renderActivityList(data) {
  const perPage = 12;
  const start = (window._activityPage-1)*perPage;
  const page = data.slice(start, start+perPage);
  document.getElementById('activityCount').textContent = `${data.length} Records`;

  const typeConfig = {
    success: { icon:'fa-check-circle', color:'var(--success)', bg:'rgba(67,233,123,0.1)' },
    danger:  { icon:'fa-times-circle', color:'var(--danger)',  bg:'rgba(255,71,87,0.1)' },
    warning: { icon:'fa-exclamation-triangle', color:'var(--warning)', bg:'rgba(247,183,49,0.1)' },
    info:    { icon:'fa-info-circle',  color:'#2ED9FF', bg:'rgba(46,217,255,0.1)' },
  };

  document.getElementById('activityList').innerHTML = page.map(l => {
    const cfg = typeConfig[l.type] || typeConfig.info;
    return `
    <div style="display:flex;align-items:flex-start;gap:14px;padding:14px 20px;border-bottom:1px solid var(--border);transition:background 0.2s" onmouseover="this.style.background='var(--bg)'" onmouseout="this.style.background='transparent'">
      <div style="width:36px;height:36px;border-radius:10px;background:${cfg.bg};display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px">
        <i class="fas ${cfg.icon}" style="color:${cfg.color}"></i>
      </div>
      <div style="flex:1">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px">
          <span style="font-weight:700;font-size:0.88rem">${l.action}</span>
          <span style="font-size:0.72rem;color:var(--text-muted);white-space:nowrap"><i class="fas fa-clock"></i> ${l.time}</span>
        </div>
        <div style="font-size:0.8rem;color:var(--text-secondary);margin-top:3px">${l.detail}</div>
        <div style="font-size:0.72rem;color:var(--text-muted);margin-top:4px"><i class="fas fa-user-shield"></i> ${l.user}</div>
      </div>
    </div>`;
  }).join('');

  const totalPages = Math.ceil(data.length/perPage);
  document.getElementById('activityPagination').innerHTML = `
    <div>Showing ${start+1}–${Math.min(start+perPage,data.length)} of ${data.length} records</div>
    <div class="page-btns">
      ${window._activityPage>1?`<button class="page-btn" onclick="window._activityPage--;renderActivityList(window._activityData)"><i class="fas fa-chevron-left"></i></button>`:''}
      ${Array.from({length:Math.min(totalPages,5)},(_,i)=>`<button class="page-btn ${i+1===window._activityPage?'active':''}" onclick="window._activityPage=${i+1};renderActivityList(window._activityData)">${i+1}</button>`).join('')}
      ${window._activityPage<totalPages?`<button class="page-btn" onclick="window._activityPage++;renderActivityList(window._activityData)"><i class="fas fa-chevron-right"></i></button>`:''}
    </div>`;
  window._activityData = data;
}

function exportActivity() {
  const rows = [['ID','Action','Detail','User','Time','Type']];
  DB.activityLog.forEach(l=>rows.push([l.id,l.action,l.detail,l.user,l.time,l.type]));
  const csv = rows.map(r=>r.join(',')).join('\n');
  const blob = new Blob([csv],{type:'text/csv'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `SHRAMS_Activity_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  toast('Activity log exported','success');
}

function clearActivityLog() {
  openModal('Clear Activity Log','<p style="font-size:0.9rem;color:var(--text-secondary)">Are you sure you want to clear all activity logs? This action cannot be undone.</p>',
    `<button class="btn btn-outline" onclick="closeModal()">Cancel</button>
     <button class="btn btn-danger" onclick="DB.activityLog=[];closeModal();toast('Activity log cleared','info');showPage('activity')"><i class="fas fa-trash"></i> Clear All</button>`);
}
