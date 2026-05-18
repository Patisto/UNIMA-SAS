const API_BASE = 'https://unima-sas-voting.onrender.com/api';
const ADMIN_KEY = 'sas-vote-admin-2026';
const VOTED_KEY = 'sas_voted_2025';
const TOKEN_KEY = 'sas_voter_token_2025';

const POSITIONS = [
  { key: 'most_prayerful', label: 'Most Prayerful' },
  { key: 'most_dedicated', label: 'Most Dedicated' },
  { key: 'golden_voice', label: 'Golden Voice' },
  { key: 'well_dressed', label: 'Well Dressed' },
  { key: 'sociable_person', label: 'Sociable Person' },
];

function getVoterToken() {
  let token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    token = 'voter_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10);
    localStorage.setItem(TOKEN_KEY, token);
  }
  return token;
}

function hasVoted() {
  return localStorage.getItem(VOTED_KEY) === '1';
}

function markVoted() {
  localStorage.setItem(VOTED_KEY, '1');
}

async function initVotingPage() {
  getVoterToken();

  let isOpen = false;
  try {
    const res = await fetch(`${API_BASE}/voting/status`);
    const data = await res.json();
    isOpen = data.is_open;
  } catch (e) {
    console.error('Status check failed:', e);
  }

  const dot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  const closedBanner = document.getElementById('closedBanner');
  const votedBanner = document.getElementById('votedBanner');
  const submitBtn = document.getElementById('submitBtn');

  if (isOpen) {
    dot.classList.add('open');
    statusText.textContent = 'Voting is open';
  } else {
    dot.classList.add('closed');
    statusText.textContent = 'Voting is closed';
    closedBanner.classList.add('show');
  }

  if (hasVoted()) {
    votedBanner.classList.add('show');
  }

  let candidates = [];
  try {
    const res = await fetch(`${API_BASE}/candidates`);
    const data = await res.json();
    candidates = data.candidates || [];
  } catch (e) {
    document.getElementById('ballotContainer').innerHTML =
      '<p style="color:var(--danger);font-size:13px;">Failed to load candidates. Check connection.</p>';
    return;
  }

  buildBallot(candidates, isOpen);

  if (!isOpen || hasVoted()) {
    submitBtn.disabled = true;
  }
}

function buildBallot(candidates, isOpen) {
  const container = document.getElementById('ballotContainer');
  const alreadyVoted = hasVoted();
  const disabled = !isOpen || alreadyVoted;

  const grouped = {};
  POSITIONS.forEach(p => { grouped[p.key] = { male: [], female: [] }; });
  candidates.forEach(c => {
    if (grouped[c.position_key] && (c.gender === 'male' || c.gender === 'female')) {
      grouped[c.position_key][c.gender].push(c);
    }
  });

  container.innerHTML = '';

  POSITIONS.forEach((pos, idx) => {
    const block = document.createElement('div');
    block.className = 'position-block';

    block.innerHTML = `
      <div class="position-title">
        <span class="position-num">${idx + 1}.</span>${pos.label}
      </div>
      ${buildGenderGroup('male', grouped[pos.key].male, pos.key, disabled)}
      ${buildGenderGroup('female', grouped[pos.key].female, pos.key, disabled)}
    `;
    container.appendChild(block);
  });
}

function buildGenderGroup(gender, candidates, posKey, disabled) {
  const label = gender === 'male' ? 'Male' : 'Female';
  let inner = '';

  if (candidates.length === 0) {
    inner = '<p class="no-candidates">No candidates listed yet.</p>';
  } else {
    inner = `<div class="candidates-grid">`;
    candidates.forEach(c => {
      const photoEl = c.photo_url
        ? `<img class="candidate-photo" src="${escHtml(c.photo_url)}" alt="${escHtml(c.name)}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"/>
           <div class="candidate-photo-placeholder" style="display:none">${initials(c.name)}</div>`
        : `<div class="candidate-photo-placeholder">${initials(c.name)}</div>`;

      inner += `
        <div
          class="candidate-card${disabled ? ' voted-already' : ''}"
          id="card_${posKey}_${gender}_${c.id}"
          data-pos="${posKey}"
          data-gender="${gender}"
          data-id="${c.id}"
          onclick="${disabled ? '' : `selectCandidate('${posKey}','${gender}',${c.id},this)`}"
        >
          <div class="check-mark"></div>
          ${photoEl}
          <div class="candidate-name">${escHtml(c.name)}</div>
        </div>
      `;
    });
    inner += '</div>';
  }

  return `
    <div class="gender-group">
      <div class="gender-label">${label}</div>
      ${inner}
    </div>
  `;
}

const selections = {};

function selectCandidate(posKey, gender, candidateId, el) {
  const slotKey = `${posKey}_${gender}`;

  const prevId = selections[slotKey];
  if (prevId) {
    const prevCard = document.getElementById(`card_${posKey}_${gender}_${prevId}`);
    if (prevCard) prevCard.classList.remove('selected');
  }

  if (prevId === candidateId) {
    delete selections[slotKey];
    return;
  }

  selections[slotKey] = candidateId;
  el.classList.add('selected');
}

async function submitVotes() {
  if (hasVoted()) return;

  const voteList = [];
  for (const [slotKey, candidateId] of Object.entries(selections)) {
    let posKey, gender;
    if (slotKey.endsWith('_male')) {
      gender = 'male';
      posKey = slotKey.slice(0, -5);
    } else if (slotKey.endsWith('_female')) {
      gender = 'female';
      posKey = slotKey.slice(0, -7);
    } else continue;
    voteList.push({ position_key: posKey, gender, candidate_id: candidateId });
  }

  if (voteList.length === 0) {
    showToast('Select at least one candidate before submitting.');
    return;
  }

  const btn = document.getElementById('submitBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Submitting...';

  try {
    const res = await fetch(`${API_BASE}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ votes: voteList, voter_token: getVoterToken() }),
    });

    const data = await res.json();

    if (res.status === 409) {
      markVoted();
      showToast('You have already voted.');
      btn.innerHTML = 'Submit vote';
      document.getElementById('votedBanner').classList.add('show');
      disableAllCards();
      return;
    }

    if (!res.ok) {
      throw new Error(data.error || 'Failed');
    }

    markVoted();
    document.getElementById('votedBanner').classList.add('show');
    disableAllCards();
    showToast('Vote submitted. Thank you.');
    btn.innerHTML = 'Vote submitted';
  } catch (err) {
    console.error(err);
    showToast('Something went wrong. Please try again.');
    btn.disabled = false;
    btn.innerHTML = 'Submit vote';
  }
}

function disableAllCards() {
  document.querySelectorAll('.candidate-card').forEach(card => {
    card.classList.add('voted-already');
    card.onclick = null;
  });
  document.getElementById('submitBtn').disabled = true;
}

let currentVotingState = false;

function adminLogin() {
  const pass = document.getElementById('adminPass').value;
  const errEl = document.getElementById('loginError');
  if (pass === ADMIN_KEY) {
    document.getElementById('adminGate').style.display = 'none';
    document.getElementById('adminContent').classList.add('visible');
    switchAdminView('results');
    loadAdminData();
  } else {
    errEl.textContent = 'Incorrect password.';
  }
}

async function loadAdminData() {
  await Promise.all([loadResults(), loadCandidates()]);
}

let editingCandidateId = null;

async function loadResults() {
  try {
    const res = await fetch(`${API_BASE}/admin/results`, {
      headers: { 'x-admin-key': ADMIN_KEY }
    });
    const data = await res.json();

    currentVotingState = data.is_open;
    updateToggleUI(data.is_open);

    document.getElementById('adminTotalVoters').textContent = data.total_voters ?? '—';

    let totalVotes = 0;
    Object.values(data.tally || {}).forEach(slot => {
      Object.values(slot).forEach(c => { totalVotes += c; });
    });
    document.getElementById('adminTotalVotes').textContent = totalVotes;

    buildResults(data.tally || {});
  } catch (e) {
    console.error(e);
  }
}

function buildResults(tally) {
  const container = document.getElementById('resultsContainer');
  container.innerHTML = '';

  POSITIONS.forEach(pos => {
    const block = document.createElement('div');
    block.className = 'result-block';

    let html = `<div class="result-block-title">${pos.label}</div>`;

    ['male', 'female'].forEach(gender => {
      const slotKey = `${pos.key}__${gender}`;
      const slotData = tally[slotKey] || {};
      const sorted = Object.entries(slotData).sort((a, b) => b[1] - a[1]);
      const max = sorted.length ? sorted[0][1] : 1;

      html += `
        <div class="result-gender-section">
          <div class="result-gender-label">${gender === 'male' ? 'Male' : 'Female'}</div>
          ${sorted.length === 0
            ? '<p style="font-size:12px;color:var(--muted);font-style:italic;">No votes yet</p>'
            : sorted.map(([name, count]) => `
                <div class="result-row">
                  <span class="result-name">${escHtml(name)}</span>
                  <div class="result-bar-wrap">
                    <div class="result-bar" style="width:${Math.round((count/max)*100)}%"></div>
                  </div>
                  <span class="result-count">${count}</span>
                </div>
              `).join('')
          }
        </div>
      `;
    });

    block.innerHTML = html;
    container.appendChild(block);
  });
}

async function toggleVoting() {
  const newState = !currentVotingState;
  try {
    const res = await fetch(`${API_BASE}/admin/voting/toggle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': ADMIN_KEY
      },
      body: JSON.stringify({ is_open: newState }),
    });
    const data = await res.json();
    currentVotingState = data.is_open;
    updateToggleUI(data.is_open);
    showToast(`Voting ${data.is_open ? 'opened' : 'closed'}.`);
  } catch (e) {
    showToast('Failed to update voting status.');
  }
}

function updateToggleUI(isOpen) {
  const btn = document.getElementById('toggleBtn');
  const sub = document.getElementById('toggleSub');
  if (isOpen) {
    btn.textContent = 'Close voting';
    btn.className = 'toggle-btn open-state';
    sub.textContent = 'Voting is currently open';
  } else {
    btn.textContent = 'Open voting';
    btn.className = 'toggle-btn closed-state';
    sub.textContent = 'Voting is currently closed';
  }
}

function switchAdminView(view) {
  const manageView = document.getElementById('manageCandidatesView');
  const resultsView = document.getElementById('resultsView');
  const manageBtn = document.getElementById('manageViewBtn');
  const resultsBtn = document.getElementById('resultsViewBtn');

  if (!manageView || !resultsView || !manageBtn || !resultsBtn) return;

  const showManage = view === 'manage';

  manageView.classList.toggle('active-view', showManage);
  resultsView.classList.toggle('active-view', !showManage);
  manageBtn.classList.toggle('active', showManage);
  resultsBtn.classList.toggle('active', !showManage);
}

async function loadCandidates() {
  try {
    const res = await fetch(`${API_BASE}/candidates`);
    const data = await res.json();
    renderCandidatesList(data.candidates || []);
  } catch (e) {
    console.error(e);
  }
}

function renderCandidatesList(candidates) {
  const list = document.getElementById('candidatesList');
  if (candidates.length === 0) {
    list.innerHTML = '<p style="padding:14px;color:var(--muted);font-size:13px;">No candidates added yet.</p>';
    return;
  }

  const posMap = {};
  POSITIONS.forEach(p => { posMap[p.key] = p.label; });

  list.innerHTML = candidates.map(c => `
    <div class="candidate-list-row">
      <div class="candidate-list-info">
        ${c.photo_url
          ? `<img class="candidate-list-photo" src="${escHtml(c.photo_url)}" alt="${escHtml(c.name)}"/>`
          : `<div class="candidate-list-photo" style="display:flex;align-items:center;justify-content:center;font-size:12px;color:var(--muted);">${initials(c.name)}</div>`
        }
        <div>
          <div>${escHtml(c.name)}</div>
          <div class="candidate-list-meta">${posMap[c.position_key] || c.position_key} — ${c.gender}</div>
        </div>
      </div>
      <div class="candidate-list-actions">
        <button class="btn-edit" onclick='editCandidate(${JSON.stringify(c).replace(/'/g, "&#39;")})'>Edit</button>
        <button class="btn-delete" onclick="deleteCandidate(${c.id})">Remove</button>
      </div>
    </div>
  `).join('');
}

function editCandidate(candidate) {
  editingCandidateId = candidate.id;
  document.getElementById('newPosition').value = candidate.position_key || '';
  document.getElementById('newGender').value = candidate.gender || '';
  document.getElementById('newName').value = candidate.name || '';
  document.getElementById('newPhoto').value = candidate.photo_url || '';

  const saveBtn = document.getElementById('saveCandidateBtn');
  const cancelBtn = document.getElementById('cancelEditBtn');
  const editBanner = document.getElementById('editBanner');

  if (saveBtn) saveBtn.textContent = 'Save changes';
  if (cancelBtn) cancelBtn.style.display = 'inline-block';
  if (editBanner) editBanner.style.display = 'block';
}

function cancelEditCandidate() {
  editingCandidateId = null;
  document.getElementById('newPosition').value = '';
  document.getElementById('newGender').value = '';
  document.getElementById('newName').value = '';
  document.getElementById('newPhoto').value = '';

  const saveBtn = document.getElementById('saveCandidateBtn');
  const cancelBtn = document.getElementById('cancelEditBtn');
  const editBanner = document.getElementById('editBanner');

  if (saveBtn) saveBtn.textContent = 'Add candidate';
  if (cancelBtn) cancelBtn.style.display = 'none';
  if (editBanner) editBanner.style.display = 'none';
}

async function saveCandidate() {
  const isEditing = editingCandidateId !== null;
  const position_key = document.getElementById('newPosition').value;
  const gender = document.getElementById('newGender').value;
  const name = document.getElementById('newName').value.trim();
  const photo_url = document.getElementById('newPhoto').value.trim();

  if (!position_key || !gender || !name) {
    showToast('Position, gender, and name are required.');
    return;
  }

  try {
    const res = await fetch(
      editingCandidateId ? `${API_BASE}/admin/candidates/${editingCandidateId}` : `${API_BASE}/admin/candidates`,
      {
      method: isEditing ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': ADMIN_KEY
      },
      body: JSON.stringify({ position_key, gender, name, photo_url }),
    });

    if (!res.ok) throw new Error();

    if (isEditing) {
      showToast('Candidate updated.');
    } else {
      showToast('Candidate added.');
    }

    cancelEditCandidate();
    loadCandidates();
  } catch (e) {
    showToast(isEditing ? 'Failed to update candidate.' : 'Failed to add candidate.');
  }
}

async function deleteCandidate(id) {
  if (!confirm('Remove this candidate?')) return;
  try {
    await fetch(`${API_BASE}/admin/candidates/${id}`, {
      method: 'DELETE',
      headers: { 'x-admin-key': ADMIN_KEY }
    });
    showToast('Candidate removed.');
    loadCandidates();
  } catch (e) {
    showToast('Failed to remove.');
  }
}

async function downloadData() {
  try {
    const res = await fetch(`${API_BASE}/admin/export`, {
      headers: { 'x-admin-key': ADMIN_KEY }
    });
    const data = await res.json();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sas-votes-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (e) {
    showToast('Download failed.');
  }
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

function escHtml(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function initials(name) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}
