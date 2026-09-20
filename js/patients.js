document.addEventListener('DOMContentLoaded', () => {
  Storage.seedIfEmpty();
  renderShell('patients', 'Patients', 'Search patient and token records by name, token, or mobile number');
  renderPatientsPage();
});

function renderPatientsPage() {
  const content = document.getElementById('page-content');
  content.innerHTML = `
    <div class="panel">
      <div class="panel-head">
        <h2>Search records</h2>
        <span class="hint">Searches every patient record on this device</span>
      </div>
      <div class="searchbox" style="max-width:420px;">
        ${ICONS.search}
        <input type="text" id="patient-search" placeholder="Search by name, token, or mobile number">
      </div>
    </div>
    <div class="panel" id="patients-results" style="margin-top:16px;"></div>
  `;

  const input = document.getElementById('patient-search');
  input.addEventListener('input', () => renderResults(input.value.trim()));
  renderResults('');
}

function renderResults(query) {
  const wrap = document.getElementById('patients-results');
  const doctors = Object.fromEntries(Storage.getDoctors().map(d => [d.id, d]));
  let patients = Storage.getPatients().slice().sort((a, b) => new Date(b.registeredAt) - new Date(a.registeredAt));

  if (query) {
    const q = query.toLowerCase();
    patients = patients.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.token.toLowerCase().includes(q) ||
      p.mobile.includes(q)
    );
  } else {
    patients = patients.slice(0, 25);
  }

  if (patients.length === 0) {
    wrap.innerHTML = `<div class="empty-state"><div class="icon">🔍</div>No matching patient or token records found.</div>`;
    return;
  }

  const rows = patients.map(p => {
    const doc = doctors[p.doctorId];
    const wait = p.status === 'Waiting' ? `${Storage.estimateWait(p)} min` : '—';
    return `<tr>
      <td style="font-weight:700;color:var(--teal-700)">${p.token}</td>
      <td>${escapeHtml(p.name)}</td>
      <td class="muted">${escapeHtml(p.mobile)}</td>
      <td>${doc ? escapeHtml(doc.name) : '<span class="muted">Removed</span>'}</td>
      <td>${escapeHtml(p.department)}</td>
      <td>${statusBadge(p.status)}</td>
      <td class="muted">${wait}</td>
      <td class="muted">${p.date} · ${formatClock(p.registeredAt)}</td>
    </tr>`;
  }).join('');

  wrap.innerHTML = `
    <div class="panel-head"><h2>${query ? `Results for "${escapeHtml(query)}"` : 'Most recent records'}</h2><span class="hint">${patients.length} shown</span></div>
    <div class="table-wrap"><table class="data-table">
      <thead><tr><th>Token</th><th>Patient</th><th>Mobile</th><th>Doctor</th><th>Department</th><th>Status</th><th>Est. wait</th><th>Registered</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>
  `;
}
