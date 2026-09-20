document.addEventListener('DOMContentLoaded', () => {
  Storage.seedIfEmpty();
  renderTvScreen();
  setInterval(renderTvScreen, 4000);
  window.addEventListener('storage', renderTvScreen);
});

function renderTvScreen() {
  const mount = document.getElementById('tv-mount');
  const settings = Storage.getSettings();
  const doctors = Storage.getDoctors();
  const now = new Date();

  const cards = doctors.map(doc => {
    const summary = Storage.doctorQueueSummary(doc.id);
    const active = summary.active;
    const nextUp = summary.waiting[0];
    return `<div class="tv-card">
      <div class="doc">${escapeHtml(doc.name)}</div>
      <div class="dept">${escapeHtml(doc.department)} · Room ${escapeHtml(doc.room || '—')}</div>
      <div class="serving-label">CURRENTLY SERVING</div>
      <div class="serving-token">${active ? active.token : '—'}</div>
      <div class="next-line"><span>Next: ${nextUp ? nextUp.token : '—'}</span><span>${summary.waiting.length} waiting</span></div>
      <div class="waiting-line">${doc.available ? 'Available now' : 'Currently unavailable'}</div>
    </div>`;
  }).join('');

  mount.innerHTML = `
    <div class="tv-body">
      <div class="tv-head">
        <div class="hosp">${escapeHtml(settings.hospitalName)} — Live Queue</div>
        <div class="time">${now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
      </div>
      ${doctors.length === 0
        ? `<div class="empty-state" style="color:#EAF5F3;border-color:rgba(234,245,243,0.3);">No doctors set up yet.</div>`
        : `<div class="tv-grid">${cards}</div>`}
      <div style="margin-top:26px;">
        <a href="index.html" style="color:#BFE0DC;font-size:12.5px;">← Back to admin dashboard</a>
      </div>
    </div>
  `;
}
