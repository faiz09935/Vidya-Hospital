document.addEventListener('DOMContentLoaded', () => {
  Storage.seedIfEmpty();
  renderShell('dashboard', 'Dashboard', "Today's overview across every department");
  renderDashboard();
});

function renderDashboard() {
  const content = document.getElementById('page-content');
  const today = Storage.getTodayPatients();
  const doctors = Storage.getDoctors();

  const waiting = today.filter(p => p.status === 'Waiting').length;
  const serving = today.filter(p => p.status === 'Called' || p.status === 'In Consultation').length;
  const completed = today.filter(p => p.status === 'Completed').length;
  const availableDoctors = doctors.filter(d => d.available).length;

  content.innerHTML = `
    <div class="grid grid-4">
      <div class="stat-card accent-teal">
        <div class="label">Patients registered today</div>
        <div class="value">${today.length}</div>
        <div class="delta">${formatDateLong(Storage.todayStr())}</div>
      </div>
      <div class="stat-card accent-amber">
        <div class="label">Patients waiting</div>
        <div class="value">${waiting}</div>
        <div class="delta">Across ${doctors.length} doctor${doctors.length === 1 ? '' : 's'}</div>
      </div>
      <div class="stat-card">
        <div class="label">Currently being served</div>
        <div class="value">${serving}</div>
        <div class="delta">Called or in consultation</div>
      </div>
      <div class="stat-card">
        <div class="label">Completed consultations</div>
        <div class="value">${completed}</div>
        <div class="delta">${availableDoctors} of ${doctors.length} doctors available</div>
      </div>
    </div>

    <div class="section-title">Currently serving</div>
    <div class="serving-strip">${servingStripHtml(doctors)}</div>

    <div class="section-title">Quick actions</div>
    <div class="grid grid-4">
      <a class="btn btn-primary btn-block" href="register.html">Register Patient</a>
      <a class="btn btn-outline btn-block" href="queue.html">View Queue</a>
      <a class="btn btn-outline btn-block" href="doctors.html">Manage Doctors</a>
      <a class="btn btn-outline btn-block" href="display.html">Live Queue Screen</a>
    </div>

    <div class="grid grid-2" style="margin-top:22px;align-items:start;">
      <div class="panel">
        <div class="panel-head">
          <h2>Today's queue overview</h2>
          <span class="hint">${today.length} record${today.length === 1 ? '' : 's'} today</span>
        </div>
        ${todayTableHtml(today, doctors)}
      </div>
      <div class="panel">
        <div class="panel-head">
          <h2>Doctor-wise patients today</h2>
          <span class="hint">Waiting + completed</span>
        </div>
        ${doctors.length ? '<canvas id="doctor-load-chart" height="220"></canvas>' : '<div class="empty-state">No doctors set up yet.</div>'}
        <div class="section-title" style="margin-top:18px;">Average waiting time</div>
        <div class="value font-head" style="font-size:26px;font-weight:800;">${averageWaitLabel(today)}</div>
      </div>
    </div>
  `;

  if (doctors.length) renderDoctorLoadChart(doctors);
}

function averageWaitLabel(today) {
  const waiting = today.filter(p => p.status === 'Waiting');
  if (waiting.length === 0) return 'No one waiting';
  const total = waiting.reduce((sum, p) => sum + Storage.estimateWait(p), 0);
  return Math.round(total / waiting.length) + ' minutes';
}

function renderDoctorLoadChart(doctors) {
  const canvas = document.getElementById('doctor-load-chart');
  if (!canvas || typeof Chart === 'undefined') return;
  const today = Storage.getTodayPatients();
  const labels = doctors.map(d => d.name.replace('Dr. ', ''));
  const counts = doctors.map(d => today.filter(p => p.doctorId === d.id).length);

  new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data: counts,
        backgroundColor: '#0B5D5D',
        borderRadius: 6,
        maxBarThickness: 34
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: '#EAF1EF' } },
        x: { grid: { display: false } }
      }
    }
  });
}

function servingStripHtml(doctors) {
  if (doctors.length === 0) return `<div class="empty-state">No doctors set up yet.</div>`;
  return doctors.map(doc => {
    const summary = Storage.doctorQueueSummary(doc.id);
    const active = summary.active;
    const nextUp = summary.waiting[0];
    return `<div class="serving-tile">
      <div class="doc-line">
        <span class="doc-name">${escapeHtml(doc.name)}</span>
        <span class="doc-room">Room ${escapeHtml(doc.room || '—')}</span>
      </div>
      <div class="tile-token ${active ? '' : 'is-idle'}">${active ? active.token : 'No one waiting'}</div>
      <div class="tile-foot">
        <span>Next: ${nextUp ? nextUp.token : '—'}</span>
        <span>${summary.waiting.length} waiting</span>
      </div>
    </div>`;
  }).join('');
}

function todayTableHtml(today, doctors) {
  if (today.length === 0) {
    return `<div class="empty-state"><div class="icon">🗓️</div>No patients registered yet today. <a href="register.html">Register the first patient</a>.</div>`;
  }
  const doctorMap = Object.fromEntries(doctors.map(d => [d.id, d]));
  const rows = today
    .slice()
    .sort((a, b) => new Date(b.registeredAt) - new Date(a.registeredAt))
    .slice(0, 12)
    .map(p => {
      const doc = doctorMap[p.doctorId];
      const wait = p.status === 'Waiting' ? Storage.estimateWait(p) + ' min' : '—';
      return `<tr>
        <td class="font-head" style="font-weight:700;color:var(--teal-700)">${p.token}</td>
        <td>${escapeHtml(p.name)}</td>
        <td>${doc ? escapeHtml(doc.name) : '<span class="muted">Removed</span>'}</td>
        <td>${priorityPill(p.priority)}</td>
        <td>${statusBadge(p.status)}</td>
        <td class="muted">${wait}</td>
        <td class="muted">${formatClock(p.registeredAt)}</td>
      </tr>`;
    }).join('');

  return `<div class="table-wrap"><table class="data-table">
    <thead><tr><th>Token</th><th>Patient</th><th>Doctor</th><th>Priority</th><th>Status</th><th>Est. wait</th><th>Registered</th></tr></thead>
    <tbody>${rows}</tbody>
  </table></div>`;
}
