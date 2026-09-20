/* ==========================================================================
   app.js — shared UI shell used by every page (sidebar, topbar, toast, clock)
   ========================================================================== */

const NAV_ITEMS = [
  { id: 'dashboard', href: 'index.html', label: 'Dashboard', icon: 'grid' },
  { id: 'register', href: 'register.html', label: 'Register Patient', icon: 'plus' },
  { id: 'queue', href: 'queue.html', label: 'Queue Management', icon: 'list' },
  { id: 'doctors', href: 'doctors.html', label: 'Doctors', icon: 'stetho' },
  { id: 'patients', href: 'patients.html', label: 'Patients', icon: 'search' },
  { id: 'history', href: 'history.html', label: 'History', icon: 'clock' },
  { id: 'display', href: 'display.html', label: 'Live Queue Screen', icon: 'tv' },
  { id: 'settings', href: 'settings.html', label: 'Settings', icon: 'gear' }
];

const ICONS = {
  grid: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
  plus: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.5-6 8-6s8 2 8 6"/><path d="M19 8h4M21 6v4" stroke-width="2"/></svg>',
  list: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4" cy="6" r="1.4" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="4" cy="18" r="1.4" fill="currentColor" stroke="none"/></svg>',
  stetho: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3v6a4 4 0 0 0 8 0V3"/><path d="M9 13v2a6 6 0 0 0 12 0v-2"/><circle cx="21" cy="9" r="2"/></svg>',
  search: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>',
  clock: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>',
  tv: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="13" rx="2"/><path d="M8 21h8M12 18v3"/></svg>',
  gear: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>'
};

function initials(name) {
  return (name || '').split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
}

function renderShell(activeId, pageTitle, pageSub) {
  const mount = document.getElementById('shell-mount');
  if (!mount) return;
  const settings = Storage.getSettings();

  const navHtml = NAV_ITEMS.map(item => `
    <a class="nav-link ${item.id === activeId ? 'active' : ''}" href="${item.href}">
      ${ICONS[item.icon]}<span>${item.label}</span>
    </a>`).join('');

  mount.innerHTML = `
    <div class="sidebar-scrim" id="sidebar-scrim"></div>
    <aside class="sidebar" id="sidebar">
      <div class="brand">
        <div class="mark">+</div>
        <div class="name">${escapeHtml(settings.hospitalName)}<small>Queue Management</small></div>
      </div>
      <nav class="nav-group">${navHtml}</nav>
      <div class="sidebar-foot">BCA College Project<br>Runs fully offline via LocalStorage.</div>
    </aside>
    <main class="main">
      <div class="topbar">
        <div class="titles" style="display:flex;align-items:center;gap:10px;">
          <button class="nav-toggle" id="nav-toggle" aria-label="Toggle menu">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>
          <div>
            <h1>${pageTitle}</h1>
            ${pageSub ? `<div class="sub">${pageSub}</div>` : ''}
          </div>
        </div>
        <div class="right">
          <div class="clock" id="topbar-clock">--:--:--</div>
          <div class="admin-chip">
            <div class="avatar">${initials(settings.adminName) || 'AD'}</div>
            <span>${escapeHtml(settings.adminName)}</span>
          </div>
        </div>
      </div>
      <div id="page-content"></div>
    </main>
  `;

  const toggle = document.getElementById('nav-toggle');
  const sidebar = document.getElementById('sidebar');
  const scrim = document.getElementById('sidebar-scrim');
  if (toggle) {
    toggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      scrim.classList.toggle('open');
    });
    scrim.addEventListener('click', () => {
      sidebar.classList.remove('open');
      scrim.classList.remove('open');
    });
  }

  startClock();
}

function startClock() {
  const el = document.getElementById('topbar-clock');
  if (!el) return;
  function tick() {
    const now = new Date();
    const date = now.toLocaleDateString(undefined, { weekday: 'short', day: '2-digit', month: 'short' });
    const time = now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    el.textContent = `${date} · ${time}`;
  }
  tick();
  setInterval(tick, 1000);
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function timeAgo(iso) {
  if (!iso) return '';
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs} hr ${mins % 60}m ago`;
}

function formatClock(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function formatDateLong(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString(undefined, { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
}

/* ---------- Toast notifications ------------------------------------------- */
function toast(message, type) {
  let stack = document.getElementById('toast-stack');
  if (!stack) {
    stack = document.createElement('div');
    stack.id = 'toast-stack';
    document.body.appendChild(stack);
  }
  const el = document.createElement('div');
  el.className = 'toast' + (type ? ` toast-${type}` : '');
  el.textContent = message;
  stack.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transition = 'opacity 0.25s ease';
    setTimeout(() => el.remove(), 260);
  }, 2800);
}

/* ---------- Confirm modal --------------------------------------------------- */
function confirmDialog({ title, message, confirmLabel, danger }) {
  return new Promise(resolve => {
    let backdrop = document.getElementById('confirm-backdrop');
    if (backdrop) backdrop.remove();
    backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop open';
    backdrop.id = 'confirm-backdrop';
    backdrop.innerHTML = `
      <div class="modal-box">
        <h3>${escapeHtml(title || 'Are you sure?')}</h3>
        <p>${escapeHtml(message || '')}</p>
        <div class="modal-actions">
          <button class="btn btn-outline" id="confirm-cancel">Cancel</button>
          <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" id="confirm-ok">${escapeHtml(confirmLabel || 'Confirm')}</button>
        </div>
      </div>`;
    document.body.appendChild(backdrop);
    const cleanup = (result) => { backdrop.remove(); resolve(result); };
    backdrop.querySelector('#confirm-cancel').addEventListener('click', () => cleanup(false));
    backdrop.querySelector('#confirm-ok').addEventListener('click', () => cleanup(true));
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) cleanup(false); });
  });
}

/* ---------- Form field error helpers ------------------------------------------ */
function clearFieldError(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('has-error');
}
function setFieldError(id, hasError) {
  const el = document.getElementById(id);
  if (el) el.classList.toggle('has-error', hasError);
}

/* ---------- Status / priority chips ------------------------------------------ */
const STATUS_CLASS = {
  'Waiting': 'badge-waiting',
  'Called': 'badge-called',
  'In Consultation': 'badge-consult',
  'Completed': 'badge-completed',
  'Cancelled': 'badge-cancelled'
};
function statusBadge(status) {
  const cls = STATUS_CLASS[status] || 'badge-waiting';
  return `<span class="badge ${cls}"><span class="badge-dot"></span>${escapeHtml(status)}</span>`;
}
function priorityPill(priority) {
  return `<span class="pill-priority pill-${priority}">${escapeHtml(priority)}</span>`;
}

/* ---------- Boot ------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  Storage.seedIfEmpty();
});
