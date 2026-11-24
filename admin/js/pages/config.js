/* ═══════════════════════════════════════════════════════
   Configuration Page
═══════════════════════════════════════════════════════ */
function renderConfig(container) {
  container.innerHTML = `
  <div class="page-header">
    <div class="page-header-left">
      <h1>System Configuration</h1>
      <p>Configure allocation rules, complaint categories, notification settings and more</p>
    </div>
    <div class="page-header-right">
      <button class="btn btn-primary btn-sm" onclick="saveAllConfig()"><i class="fas fa-save"></i> Save All Changes</button>
    </div>
  </div>

  <!-- ALLOCATION CONFIG -->
  <div class="config-section">
    <div class="config-section-header" onclick="toggleConfigSection(this)">
      <h3><i class="fas fa-robot" style="color:var(--primary)"></i> Allocation Engine Settings</h3>
      <i class="fas fa-chevron-down chevron"></i>
    </div>
    <div class="config-section-body open">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
        <div>
          <div style="margin-bottom:14px">
            <label class="toggle-switch">
              <input type="checkbox" id="cfg_autoAllocate" ${DB.config.allocation.autoAllocate?'checked':''} />
              <div class="toggle-track"></div>
              <span class="toggle-label">Enable Auto-Allocation</span>
            </label>
            <p style="font-size:0.75rem;color:var(--text-muted);margin-top:4px;margin-left:54px">Automatically allocate rooms when applications are approved</p>
          </div>
          <div style="margin-bottom:14px">
            <label class="toggle-switch">
              <input type="checkbox" id="cfg_preferByDept" ${DB.config.allocation.preferByDept?'checked':''} />
              <div class="toggle-track"></div>
              <span class="toggle-label">Group by Department</span>
            </label>
          </div>
          <div style="margin-bottom:14px">
            <label class="toggle-switch">
              <input type="checkbox" id="cfg_respectGender" ${DB.config.allocation.respectGender?'checked':''} />
              <div class="toggle-track"></div>
              <span class="toggle-label">Enforce Gender-based Hostel</span>
            </label>
          </div>
        </div>
        <div>
          <div class="field-group">
            <label class="field-label">Maximum Occupants per Room</label>
            <select class="field-select" id="cfg_maxPerRoom" style="max-width:200px">
              ${[1,2,3,4].map(n=>`<option ${DB.config.allocation.maxPerRoom===n?'selected':''}>${n}</option>`).join('')}
            </select>
          </div>
          <div style="margin-top:16px;padding:14px;background:var(--bg);border-radius:10px">
            <div style="font-size:0.82rem;font-weight:700;margin-bottom:8px">Allocation Priority Order</div>
            <div style="font-size:0.8rem;color:var(--text-secondary)">
              1. Urgent flagged applications<br>
              2. Senior semester students<br>
              3. Department preference<br>
              4. First-come, first-served
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- COMPLAINT CONFIG -->
  <div class="config-section">
    <div class="config-section-header" onclick="toggleConfigSection(this)">
      <h3><i class="fas fa-wrench" style="color:#F7B731"></i> Complaint & Maintenance Settings</h3>
      <i class="fas fa-chevron-down chevron"></i>
    </div>
    <div class="config-section-body open">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px">
        <div>
          <div class="field-group" style="margin-bottom:16px">
            <label class="field-label">Complaint Categories</label>
            <div id="categoriesList" style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px">
              ${DB.config.complaints.categories.map(c=>`
                <div style="display:flex;align-items:center;gap:6px;background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:5px 10px;font-size:0.82rem">
                  ${c}
                  <button onclick="removeCategory('${c}')" style="color:var(--danger);margin-left:2px"><i class="fas fa-times"></i></button>
                </div>`).join('')}
            </div>
            <div style="display:flex;gap:8px">
              <input class="field-input" id="newCategoryInput" placeholder="Add category…" style="flex:1" />
              <button class="btn btn-primary btn-sm" onclick="addCategory()"><i class="fas fa-plus"></i></button>
            </div>
          </div>
        </div>
        <div>
          <div style="margin-bottom:14px">
            <label class="toggle-switch">
              <input type="checkbox" id="cfg_autoAssign" ${DB.config.complaints.autoAssign?'checked':''} />
              <div class="toggle-track"></div>
              <span class="toggle-label">Auto-assign to available staff</span>
            </label>
          </div>
          <div style="margin-bottom:14px">
            <label class="toggle-switch">
              <input type="checkbox" id="cfg_criticalAlert" ${DB.config.complaints.criticalAlertEmail?'checked':''} />
              <div class="toggle-track"></div>
              <span class="toggle-label">Email alerts for critical complaints</span>
            </label>
          </div>
          <div class="field-group" style="margin-top:14px">
            <label class="field-label">Priority Levels</label>
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px">
              ${DB.config.complaints.priorities.map(p=>`<span class="priority ${p}">${p}</span>`).join('')}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- NOTIFICATION CONFIG -->
  <div class="config-section">
    <div class="config-section-header" onclick="toggleConfigSection(this)">
      <h3><i class="fas fa-bell" style="color:#43E97B"></i> Notification Settings</h3>
      <i class="fas fa-chevron-down chevron"></i>
    </div>
    <div class="config-section-body open">
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px">
        <div style="background:var(--bg);border-radius:12px;padding:16px;text-align:center">
          <i class="fas fa-envelope" style="font-size:2rem;color:var(--primary);margin-bottom:10px"></i>
          <div style="font-weight:700;margin-bottom:8px">Email Notifications</div>
          <label class="toggle-switch" style="justify-content:center">
            <input type="checkbox" id="cfg_email" ${DB.config.notifications.emailEnabled?'checked':''} />
            <div class="toggle-track"></div>
          </label>
        </div>
        <div style="background:var(--bg);border-radius:12px;padding:16px;text-align:center">
          <i class="fas fa-sms" style="font-size:2rem;color:#43E97B;margin-bottom:10px"></i>
          <div style="font-weight:700;margin-bottom:8px">SMS Notifications</div>
          <label class="toggle-switch" style="justify-content:center">
            <input type="checkbox" id="cfg_sms" ${DB.config.notifications.smsEnabled?'checked':''} />
            <div class="toggle-track"></div>
          </label>
        </div>
        <div style="background:var(--bg);border-radius:12px;padding:16px;text-align:center">
          <i class="fas fa-mobile-alt" style="font-size:2rem;color:#2ED9FF;margin-bottom:10px"></i>
          <div style="font-weight:700;margin-bottom:8px">Push Notifications</div>
          <label class="toggle-switch" style="justify-content:center">
            <input type="checkbox" id="cfg_push" ${DB.config.notifications.appPush?'checked':''} />
            <div class="toggle-track"></div>
          </label>
        </div>
      </div>
    </div>
  </div>

  <!-- HOSTEL RULES CONFIG -->
  <div class="config-section">
    <div class="config-section-header" onclick="toggleConfigSection(this)">
      <h3><i class="fas fa-scroll" style="color:#FF6584"></i> Hostel Rules &amp; Policies</h3>
      <i class="fas fa-chevron-down chevron"></i>
    </div>
    <div class="config-section-body">
      <div class="field-group">
        <label class="field-label">General Hostel Rules</label>
        <textarea class="field-textarea" id="hostelRules" style="min-height:140px">1. Gate closing time is 10:00 PM. All students must return before this time.
2. Visitors are allowed only in common areas between 10AM–6PM.
3. Ragging in any form is strictly prohibited and punishable.
4. Consumption of alcohol, tobacco and drugs is prohibited.
5. Noise levels must be maintained, especially after 10:00 PM.
6. Students must keep their rooms and common areas clean.
7. Use of electrical appliances (heaters, irons) in rooms is not allowed.
8. Any damage to hostel property will be charged to the student.</textarea>
      </div>
      <div class="field-group" style="margin-top:14px">
        <label class="field-label">Gate Closing Time</label>
        <input class="field-input" type="time" value="22:00" style="max-width:160px" />
      </div>
    </div>
  </div>`;
}

function toggleConfigSection(header) {
  const body = header.nextElementSibling;
  body.classList.toggle('open');
  header.classList.toggle('open');
}

function addCategory() {
  const inp = document.getElementById('newCategoryInput');
  const val = inp.value.trim();
  if (!val) { toast('Enter a category name','error'); return; }
  if (DB.config.complaints.categories.includes(val)) { toast('Category already exists','warning'); return; }
  DB.config.complaints.categories.push(val);
  inp.value = '';
  document.getElementById('categoriesList').innerHTML = DB.config.complaints.categories.map(c=>`
    <div style="display:flex;align-items:center;gap:6px;background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:5px 10px;font-size:0.82rem">
      ${c}
      <button onclick="removeCategory('${c}')" style="color:var(--danger);margin-left:2px"><i class="fas fa-times"></i></button>
    </div>`).join('');
  toast(`Category "${val}" added`, 'success');
}

function removeCategory(cat) {
  DB.config.complaints.categories = DB.config.complaints.categories.filter(c=>c!==cat);
  document.getElementById('categoriesList').innerHTML = DB.config.complaints.categories.map(c=>`
    <div style="display:flex;align-items:center;gap:6px;background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:5px 10px;font-size:0.82rem">
      ${c}
      <button onclick="removeCategory('${c}')" style="color:var(--danger);margin-left:2px"><i class="fas fa-times"></i></button>
    </div>`).join('');
  toast(`Category removed`, 'info');
}

function saveAllConfig() {
  DB.config.allocation.autoAllocate = document.getElementById('cfg_autoAllocate').checked;
  DB.config.allocation.preferByDept = document.getElementById('cfg_preferByDept').checked;
  DB.config.allocation.respectGender= document.getElementById('cfg_respectGender').checked;
  DB.config.allocation.maxPerRoom   = +document.getElementById('cfg_maxPerRoom').value;
  DB.config.complaints.autoAssign   = document.getElementById('cfg_autoAssign').checked;
  DB.config.complaints.criticalAlertEmail = document.getElementById('cfg_criticalAlert').checked;
  DB.config.notifications.emailEnabled = document.getElementById('cfg_email').checked;
  DB.config.notifications.smsEnabled   = document.getElementById('cfg_sms').checked;
  DB.config.notifications.appPush      = document.getElementById('cfg_push').checked;
  logActivity('Config Updated', 'System configuration saved');
  toast('All configuration saved successfully!', 'success');
}
