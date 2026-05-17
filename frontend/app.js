// ─────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────
// Hardcoded API base (served from Render)
const API_BASE = 'https://unima-sas.onrender.com/api';
const ADMIN_KEY = 'sas-admin-2025'; // keep this private; only share with admins

const POSITIONS = [
  { key: 'most_prayerful',    label: 'Most Prayerful',        emoji: '🙏' },
  { key: 'most_dedicated',    label: 'Most Dedicated',         emoji: '⭐' },
  { key: 'golden_voice',      label: 'Golden Voice',           emoji: '🎤' },
  { key: 'well_dressed',      label: 'Well Dressed',           emoji: '👔' },
  { key: 'sociable_person',   label: 'Sociable Person',        emoji: '🤝' },
];

// ─────────────────────────────────────────────────────
// FETCH SUBMISSION COUNT
// ─────────────────────────────────────────────────────
async function fetchCount() {
  try {
    const res = await fetch(`${API_BASE}/submissions/count`);
    const data = await res.json();
    const els = document.querySelectorAll('#submissionCount');
    els.forEach(el => el.textContent = data.count ?? 0);
  } catch (e) {
    console.error('Count fetch failed:', e);
  }
}

// ─────────────────────────────────────────────────────
// LOAD RESULTS (for results.html)
// ─────────────────────────────────────────────────────
async function loadResults() {
  const container = document.getElementById('resultsContainer');
  if (!container) return;

  container.innerHTML = '<p style="text-align:center;color:var(--text-muted);font-size:13px;">Loading...</p>';

  try {
    const res = await fetch(`${API_BASE}/nominations`);
    const data = await res.json();
    const nominations = data.nominations || [];

    // Group by position_key then gender then name counts
    const grouped = {};
    POSITIONS.forEach(pos => {
      grouped[pos.key] = { male: {}, female: {} };
    });

    nominations.forEach(nom => {
      const key = nom.position_key;
      const gender = nom.gender;
      const name = (nom.nominee_name || '').trim();
      if (!grouped[key]) return;
      if (!grouped[key][gender][name]) grouped[key][gender][name] = 0;
      grouped[key][gender][name]++;
    });

    // Build compact HTML lists
    container.innerHTML = '';
    POSITIONS.forEach((pos) => {
      const card = document.createElement('div');
      card.className = 'position-result-card';

      const maleNames = Object.entries(grouped[pos.key].male).sort((a,b) => b[1]-a[1]);
      const femaleNames = Object.entries(grouped[pos.key].female).sort((a,b) => b[1]-a[1]);

      card.innerHTML = `
        <div class="position-result-header" onclick="toggleResult(this)">
          <div class="pos-left">
            <span class="pos-name-result">${pos.emoji} ${pos.label}</span>
          </div>
          <span class="chevron" id="chev_${pos.key}">▼</span>
        </div>
        <div class="position-result-body" id="body_${pos.key}">
          <div class="gender-section">
            <div class="gender-section-title">Male</div>
            ${maleNames.length
              ? `<ul class="nominee-list">
                  ${maleNames.map(([name, count]) => `<li><span class="nominee-name">${escHtml(name)}</span>${count > 1 ? `<span class="nominee-count"> (${count})</span>` : ''}</li>`).join('')}
                 </ul>`
              : '<p class="no-noms">No nominations yet</p>'
            }
          </div>
          <div class="gender-section">
            <div class="gender-section-title">Female</div>
            ${femaleNames.length
              ? `<ul class="nominee-list">
                  ${femaleNames.map(([name, count]) => `<li><span class="nominee-name">${escHtml(name)}</span>${count > 1 ? `<span class="nominee-count"> (${count})</span>` : ''}</li>`).join('')}
                 </ul>`
              : '<p class="no-noms">No nominations yet</p>'
            }
          </div>
        </div>
      `;
      container.appendChild(card);
    });

  } catch (err) {
    console.error(err);
    container.innerHTML = '<p style="text-align:center;color:red;font-size:13px;">Failed to load. Check connection.</p>';
  }
}


// ─────────────────────────────────────────────────────
// BUILD NOMINATION FORM
// ─────────────────────────────────────────────────────
function initNominationForm() {
  const container = document.getElementById('positionsForm');
  if (!container) return;

  POSITIONS.forEach((pos, idx) => {
    const card = document.createElement('div');
    card.className = 'position-card';
    card.innerHTML = `
      <div class="position-header">
        <div class="position-title">
          <div class="position-number">${idx + 1}</div>
          <span class="position-name">${pos.emoji} ${pos.label}</span>
        </div>
        <span class="position-badge">Male &amp; Female</span>
      </div>
      <div class="gender-fields">
        <div class="gender-field">
          <label><span class="gender-icon">♂️</span> Male</label>
          <input
            type="text"
            id="input_${pos.key}_male"
            placeholder="e.g. John Banda"
            autocomplete="off"
          />
        </div>
        <div class="gender-field">
          <label><span class="gender-icon">♀️</span> Female</label>
          <input
            type="text"
            id="input_${pos.key}_female"
            placeholder="e.g. Grace Phiri"
            autocomplete="off"
          />
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

// ─────────────────────────────────────────────────────
// SUBMIT NOMINATIONS
// ─────────────────────────────────────────────────────
async function submitNominations() {
  const btn = document.getElementById('submitBtn');
  const nominations = [];

  POSITIONS.forEach(pos => {
    ['male', 'female'].forEach(gender => {
      const input = document.getElementById(`input_${pos.key}_${gender}`);
      const name = input ? input.value.trim() : '';
      if (name) {
        nominations.push({
          position_key: pos.key,
          gender,
          nominee_name: name,
        });
      }
    });
  });

  if (nominations.length === 0) {
    showToast('⚠️ Please fill in at least one name.', '#b45309');
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Submitting...';

  try {
    // 1. Save nominations
    const nomRes = await fetch(`${API_BASE}/nominations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nominations }),
    });

    if (!nomRes.ok) throw new Error('Nominations failed');

    // 2. Log submission
    const subRes = await fetch(`${API_BASE}/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const subData = await subRes.json();

    // Update counter
    const countEl = document.getElementById('submissionCount');
    if (countEl) countEl.textContent = subData.count ?? '—';

    // Clear inputs
    POSITIONS.forEach(pos => {
      ['male', 'female'].forEach(gender => {
        const input = document.getElementById(`input_${pos.key}_${gender}`);
        if (input) input.value = '';
      });
    });

    showToast('✅ Nominations submitted! God bless you 🙏');

  } catch (err) {
    console.error(err);
    showToast('❌ Something went wrong. Please try again.', '#dc2626');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '✝ Submit My Nominations';
  }
}

function toggleResult(header) {
  const posKey = header.querySelector('.chevron').id.replace('chev_', '');
  const body = document.getElementById(`body_${posKey}`);
  const chev = document.getElementById(`chev_${posKey}`);
  const isOpen = body.classList.contains('open');
  body.classList.toggle('open', !isOpen);
  chev.classList.toggle('open', !isOpen);
}

// ─────────────────────────────────────────────────────
// ADMIN
// ─────────────────────────────────────────────────────
function adminLogin() {
  const pass = document.getElementById('adminPass').value;
  const errEl = document.getElementById('loginError');
  if (pass === ADMIN_KEY) {
    document.getElementById('adminGate').style.display = 'none';
    document.getElementById('adminPanel').classList.add('visible');
    loadAdminData();
  } else {
    errEl.textContent = 'Incorrect password.';
  }
}

async function loadAdminData() {
  try {
    const res = await fetch(`${API_BASE}/admin/export`, {
      headers: { 'x-admin-key': ADMIN_KEY }
    });
    const data = await res.json();
    document.getElementById('adminCount').textContent = data.totalSubmissions ?? '—';
    document.getElementById('adminNomCount').textContent = (data.nominations || []).length;
  } catch (e) {
    console.error(e);
  }
}

async function downloadData() {
  try {
    const res = await fetch(`${API_BASE}/admin/export`, {
      headers: { 'x-admin-key': ADMIN_KEY }
    });
    if (!res.ok) throw new Error('Export failed');
    const data = await res.json();

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sas-nominations-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    return true;
  } catch (e) {
    alert('Download failed. Check connection.');
    throw e;
  }
}

async function clearDatabase() {
  const confirmed = await showClearModal();
  if (!confirmed) return;

  // attempt automatic backup first
  try {
    await downloadData();
    showToast('Backup downloaded. Proceeding to clear.', '#16a34a');
  } catch (e) {
    const proceed = confirm('Backup download failed. Proceed to clear anyway?');
    if (!proceed) return;
  }

  try {
    const res = await fetch(`${API_BASE}/admin/clear`, {
      method: 'POST',
      headers: { 'x-admin-key': ADMIN_KEY }
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Clear failed');
    }

    showToast('All data cleared.', '#16a34a');
    // refresh admin stats
    if (document.getElementById('adminCount')) document.getElementById('adminCount').textContent = '—';
    if (document.getElementById('adminNomCount')) document.getElementById('adminNomCount').textContent = '0';
  } catch (e) {
    console.error('Clear failed:', e);
    showToast('Failed to clear data. Check server logs.', '#dc2626');
  }
}

function showClearModal() {
  return new Promise(resolve => {
    const modal = document.getElementById('clearModal');
    const input = document.getElementById('clearConfirmInput');
    const btnConfirm = document.getElementById('clearConfirmBtn');
    const btnCancel = document.getElementById('clearCancelBtn');

    if (!modal || !input || !btnConfirm || !btnCancel) return resolve(false);

    modal.setAttribute('aria-hidden', 'false');
    input.value = '';
    input.focus();

    function cleanup() {
      modal.setAttribute('aria-hidden', 'true');
      btnConfirm.removeEventListener('click', onConfirm);
      btnCancel.removeEventListener('click', onCancel);
      input.removeEventListener('keydown', onKeyDown);
    }

    function onConfirm() {
      if (input.value.trim().toUpperCase() === 'DELETE') {
        cleanup();
        resolve(true);
      } else {
        input.style.borderColor = '#dc2626';
        setTimeout(() => input.style.borderColor = '', 1000);
      }
    }

    function onCancel() {
      cleanup();
      resolve(false);
    }

    function onKeyDown(e) {
      if (e.key === 'Enter') onConfirm();
      if (e.key === 'Escape') onCancel();
    }

    btnConfirm.addEventListener('click', onConfirm);
    btnCancel.addEventListener('click', onCancel);
    input.addEventListener('keydown', onKeyDown);
  });
}

// ─────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────
function showToast(msg, bg = '#16a34a') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.style.background = bg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
}

function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
