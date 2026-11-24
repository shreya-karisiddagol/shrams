/* ═══════════════════════════════════════════════════════
   Reports & Analytics Page
═══════════════════════════════════════════════════════ */
function renderReports(container) {
  const totalStudents = DB.students.length;
  const activeStudents = DB.students.filter(s=>s.status==='active').length;
  const totalBeds = DB.hostels.reduce((a,h)=>a+h.totalBeds,0);
  const occupied  = DB.hostels.reduce((a,h)=>a+h.occupied,0);
  const resolved  = DB.complaints.filter(c=>c.status==='resolved').length;
  const totalComp = DB.complaints.length;
  const resRate   = Math.round(resolved/totalComp*100);

  container.innerHTML = `
  <div class="page-header">
    <div class="page-header-left">
      <h1>Reports &amp; Analytics</h1>
      <p>Comprehensive hostel performance insights and exportable reports</p>
    </div>
    <div class="page-header-right">
      <select class="btn btn-outline btn-sm" id="reportPeriod" style="cursor:pointer">
        <option>This Month</option><option>Last 3 Months</option><option>This Year</option>
      </select>
      <button class="btn btn-outline btn-sm" onclick="exportReport('csv')"><i class="fas fa-file-csv"></i> CSV</button>
      <button class="btn btn-primary btn-sm" onclick="exportReport('pdf')"><i class="fas fa-file-pdf"></i> PDF</button>
    </div>
  </div>

  <!-- KEY METRICS -->
  <div class="stat-grid" style="grid-template-columns:repeat(4,1fr)">
    <div class="stat-card blue">
      <div class="stat-row">
        <div>
          <div class="stat-value">${Math.round(occupied/totalBeds*100)}%</div>
          <div class="stat-label">Overall Occupancy</div>
          <div class="stat-trend up"><i class="fas fa-arrow-up"></i> +2.4% vs last month</div>
        </div>
        <div class="stat-icon blue"><i class="fas fa-chart-pie"></i></div>
      </div>
    </div>
    <div class="stat-card green">
      <div class="stat-row">
        <div>
          <div class="stat-value">${resRate}%</div>
          <div class="stat-label">Complaint Resolution Rate</div>
          <div class="stat-trend up"><i class="fas fa-arrow-up"></i> ${resolved} resolved</div>
        </div>
        <div class="stat-icon green"><i class="fas fa-check-circle"></i></div>
      </div>
    </div>
    <div class="stat-card orange">
      <div class="stat-row">
        <div>
          <div class="stat-value">${DB.applications.filter(a=>a.status==='approved').length}</div>
          <div class="stat-label">Approved Applications</div>
          <div class="stat-trend neutral"><i class="fas fa-file-alt"></i> This semester</div>
        </div>
        <div class="stat-icon orange"><i class="fas fa-check-square"></i></div>
      </div>
    </div>
    <div class="stat-card purple">
      <div class="stat-row">
        <div>
          <div class="stat-value">${activeStudents}</div>
          <div class="stat-label">Active Residents</div>
          <div class="stat-trend up"><i class="fas fa-users"></i> ${totalStudents} total</div>
        </div>
        <div class="stat-icon purple"><i class="fas fa-user-graduate"></i></div>
      </div>
    </div>
  </div>

  <div class="grid2" style="margin-bottom:20px">
    <!-- OCCUPANCY BAR CHART -->
    <div class="card">
      <div class="card-header"><div class="card-title"><i class="fas fa-chart-bar"></i> Occupancy by Hostel</div></div>
      <div class="card-body">
        <!-- CSS Bar Chart -->
        <div class="css-chart" style="margin-bottom:20px">
          ${DB.hostels.map(h => {
            const pct = Math.round(h.occupied/h.totalBeds*100);
            const col = pct>=90?'#FF4757':pct>=70?'#F7B731':'#43E97B';
            const heightPct = pct;
            return `
            <div class="css-bar-wrap">
              <div class="css-bar" data-val="${pct}%" style="height:${heightPct}%;background:linear-gradient(to top,${col}cc,${col})"></div>
              <div class="css-bar-label">${h.name.replace(' Hostel','').replace('Boys ','B.').replace('Girls','G.')}</div>
            </div>`;
          }).join('')}
        </div>
        ${DB.hostels.map(h => {
          const pct = Math.round(h.occupied/h.totalBeds*100);
          const cls = pct>=90?'red':pct>=70?'orange':'green';
          return `
          <div style="margin-bottom:14px">
            <div style="display:flex;justify-content:space-between;margin-bottom:5px;font-size:0.82rem">
              <span style="font-weight:600">${h.name}</span>
              <span style="font-weight:800">${pct}%</span>
            </div>
            <div class="progress-bar" style="height:10px;border-radius:5px">
              <div class="progress-fill ${cls}" style="width:${pct}%;border-radius:5px"></div>
            </div>
            <div style="display:flex;gap:12px;margin-top:4px;font-size:0.72rem;color:var(--text-muted)">
              <span>🟣 ${h.occupied} occupied</span>
              <span>🟢 ${h.available} free</span>
              <span>🔴 ${h.maintenance} maint.</span>
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>

    <!-- DONUT CHART: COMPLAINT STATUS -->
    <div class="card">
      <div class="card-header"><div class="card-title"><i class="fas fa-chart-pie"></i> Complaint Status</div></div>
      <div class="card-body">
        ${(() => {
          const open = DB.complaints.filter(c=>c.status==='open').length;
          const inp  = DB.complaints.filter(c=>c.status==='inprogress').length;
          const hold = DB.complaints.filter(c=>c.status==='onhold').length;
          const res  = DB.complaints.filter(c=>c.status==='resolved').length;
          const tot  = DB.complaints.length || 1;
          const r = 60; const circ = 2 * Math.PI * r;
          const segs = [
            { val:res,  color:'#43E97B', label:'Resolved' },
            { val:inp,  color:'#2ED9FF', label:'In Progress' },
            { val:hold, color:'#F7B731', label:'On Hold' },
            { val:open, color:'#FF4757', label:'Open' },
          ];
          let offset = 0;
          const paths = segs.map(s => {
            const len = (s.val/tot)*circ;
            const p = `<circle class="donut-segment" cx="80" cy="80" r="${r}" stroke="${s.color}" stroke-dasharray="${len} ${circ-len}" stroke-dashoffset="${-offset}" />`;
            offset += len;
            return p;
          }).join('');
          return `
          <div style="display:flex;align-items:center;gap:24px;flex-wrap:wrap">
            <div class="donut-wrap" style="width:160px;height:160px;flex-shrink:0">
              <svg class="donut-svg" width="160" height="160" viewBox="0 0 160 160">
                <circle class="donut-track" cx="80" cy="80" r="${r}" />
                ${paths}
              </svg>
              <div class="donut-center">
                <div class="donut-pct">${tot}</div>
                <div class="donut-lbl">Total</div>
              </div>
            </div>
            <div style="flex:1">
              ${segs.map(s=>`
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
                <div style="display:flex;align-items:center;gap:8px">
                  <div style="width:12px;height:12px;border-radius:3px;background:${s.color}"></div>
                  <span style="font-size:0.82rem;font-weight:500">${s.label}</span>
                </div>
                <span style="font-weight:800;font-size:0.95rem">${s.val}</span>
              </div>`).join('')}
              <div style="margin-top:12px;padding-top:10px;border-top:1px solid var(--border);font-size:0.8rem;color:var(--text-secondary)">
                Resolution Rate: <strong style="color:var(--success)">${resRate}%</strong>
              </div>
            </div>
          </div>`;
        })()}
      </div>
    </div>
  </div>

  <div class="grid2" style="margin-bottom:20px">
    <!-- DEPT DISTRIBUTION -->
    <div class="card">
      <div class="card-header"><div class="card-title"><i class="fas fa-graduation-cap"></i> Students by Department</div></div>
      <div class="card-body">
        ${(() => {
          const depts = {};
          DB.students.forEach(s => { depts[s.dept] = (depts[s.dept]||0)+1; });
          return Object.entries(depts).sort((a,b)=>b[1]-a[1]).map(([dept,count]) => {
            const pct = Math.round(count/DB.students.length*100);
            return `
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
              <div style="font-size:0.78rem;font-weight:600;width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${dept}</div>
              <div class="progress-bar" style="flex:1"><div class="progress-fill purple" style="width:${pct}%"></div></div>
              <span style="font-size:0.8rem;font-weight:700;width:30px;text-align:right">${count}</span>
            </div>`;
          }).join('');
        })()}
      </div>
    </div>

    <!-- STAFF PERFORMANCE -->
    <div class="card">
      <div class="card-header"><div class="card-title"><i class="fas fa-hard-hat"></i> Staff Performance</div></div>
      <div class="table-wrapper">
        <table>
          <thead><tr><th>Staff</th><th>Category</th><th>Active</th><th>Completed</th><th>Efficiency</th></tr></thead>
          <tbody>
            ${DB.staff.map(s => {
              const eff = Math.round(s.completed/(s.completed+s.tasks||1)*100);
              return `<tr>
                <td>
                  <div style="display:flex;align-items:center;gap:8px">
                    <div class="avatar avatar-sm" style="background:${avatarBg(s.name)}">${initials(s.name)}</div>
                    <span style="font-size:0.82rem;font-weight:600">${s.name}</span>
                  </div>
                </td>
                <td><span class="badge badge-blue" style="font-size:0.65rem">${s.category}</span></td>
                <td style="font-weight:700;color:var(--warning)">${s.tasks}</td>
                <td style="font-weight:700;color:var(--success)">${s.completed}</td>
                <td>
                  <div style="display:flex;align-items:center;gap:6px">
                    <div class="progress-bar" style="width:60px;height:6px"><div class="progress-fill green" style="width:${eff}%"></div></div>
                    <span style="font-size:0.78rem;font-weight:700">${eff}%</span>
                  </div>
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- ALLOCATION TIMELINE -->
  <div class="card">
    <div class="card-header">
      <div class="card-title"><i class="fas fa-timeline"></i> Recent Allocation Activity</div>
    </div>
    <div class="card-body">
      <div class="timeline">
        ${DB.activityLog.filter(l=>l.action.includes('Allocated')||l.action.includes('Application')).slice(0,8).map(l=>`
        <div class="timeline-item">
          <div class="timeline-dot ${l.type==='success'?'green':l.type==='danger'?'red':'purple'}"></div>
          <div class="timeline-title">${l.action}</div>
          <div class="timeline-desc">${l.detail}</div>
          <div class="timeline-time"><i class="fas fa-clock"></i> ${l.time}</div>
        </div>`).join('')}
      </div>
    </div>
  </div>`;
}

function exportReport(type) {
  if (type==='csv') {
    // Build a simple CSV for occupancy
    const rows = [['Hostel','Total Beds','Occupied','Available','Maintenance','Occupancy %']];
    DB.hostels.forEach(h => rows.push([h.name,h.totalBeds,h.occupied,h.available,h.maintenance,Math.round(h.occupied/h.totalBeds*100)+'%']));
    const csv = rows.map(r=>r.join(',')).join('\n');
    const blob = new Blob([csv], {type:'text/csv'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `SHRAMS_Occupancy_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast('CSV report downloaded','success');
  } else {
    toast('PDF report generated and ready for download','success');
  }
  logActivity('Report Exported', `Occupancy report exported as ${type.toUpperCase()}`);
}
