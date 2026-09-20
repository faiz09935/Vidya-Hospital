document.addEventListener('DOMContentLoaded', () => {
  Storage.seedIfEmpty();
  renderShell('history', 'Patient History', 'Every registration recorded on this device, filterable by date, doctor, or status');
  renderHistoryPage();
});

function renderHistoryPage() {
  const content = document.getElementById('page-content');
  const doctors = Storage.getDoctors();
  const doctorOptions = doctors.map(d => `<option value="${d.id}">${escapeHtml(d.name)}</option>`).join('');
  const statusOptions = STATUS_FLOW.map(s => `<option value="${s}">${s}</option>`).join('');

  content.innerHTML = `
    <div class="panel">
      <div class="filters-row">
        <input type="date" id="fl-date">
        <select id="fl-doctor"><option value="">All doctors</option>${doctorOptions}</select>
        <select id="fl-status"><option value="">All statuses</option>${statusOptions}</select>
        <button class="btn btn-ghost btn-sm" id="fl-clear">Clear filters</button>
      </div>
      <div id="history-results"></div>
    </div>
  `;

  ['fl-date', 'fl-doctor', 'fl-status'].forEach(id => {
    document.getElementById(id).addEventListener('change', renderHistoryResults);
  });
  document.getElementById('fl-clear').addEventListener('click', () => {
    document.getElementById('fl-date').value = '';
    document.getElementById('fl-doctor').value = '';
    document.getElementById('fl-status').value = '';
    renderHistoryResults();
  });

  renderHistoryResults();
}

function renderHistoryResults() {
  const date = document.getElementById('fl-date').value;
  const doctorId = document.getElementById('fl-doctor').value;
  const status = document.getElementById('fl-status').value;
  const doctors = Object.fromEntries(Storage.getDoctors().map(d => [d.id, d]));

  let patients = Storage.getPatients().slice().sort((a, b) => new Date(b.registeredAt) - new Date(a.registeredAt));
  if (date) patients = patients.filter(p => p.date === date);
  if (doctorId) patients = patients.filter(p => p.doctorId === doctorId);
  if (status) patients = patients.filter(p => p.status === status);

  const wrap = document.getElementById('history-results');
  if (patients.length === 0) {
    wrap.innerHTML = `<div class="empty-state" style="margin-top:12px;"><div class="icon">🗂️</div>No records match these filters.</div>`;
    return;
  }

  const rows = patients.map(p => {
    const doc = doctors[p.doctorId];
    return `<tr>
      <td class="muted">${p.date}</td>
      <td style="font-weight:700;color:var(--teal-700)">${p.token}</td>
      <td>${escapeHtml(p.name)}</td>
      <td>${doc ? escapeHtml(doc.name) : '<span class="muted">Removed</span>'}</td>
      <td>${escapeHtml(p.department)}</td>
      <td>${priorityPill(p.priority)}</td>
      <td>${statusBadge(p.status)}</td>
      <td class="muted">${formatClock(p.registeredAt)}</td>
    </tr>`;
  }).join('');

  wrap.innerHTML = `
    <div class="table-wrap" style="margin-top:14px;"><table class="data-table">
      <thead><tr><th>Date</th><th>Token</th><th>Patient</th><th>Doctor</th><th>Department</th><th>Priority</th><th>Status</th><th>Time</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>
    <div class="muted" style="margin-top:10px;font-size:12.5px;">${patients.length} record${patients.length === 1 ? '' : 's'} found.</div>
  `;
}
