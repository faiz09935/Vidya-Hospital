document.addEventListener('DOMContentLoaded', () => {
  Storage.seedIfEmpty();
  renderShell('queue', 'Queue Management', 'Move patients through the queue, doctor by doctor');
  renderQueuePage();
});

function renderQueuePage() {
  const content = document.getElementById('page-content');
  const doctors = Storage.getDoctors();

  if (doctors.length === 0) {
    content.innerHTML = `<div class="empty-state"><div class="icon">🩺</div>No doctors set up yet. <a href="doctors.html">Add a doctor first</a>.</div>`;
    return;
  }

  content.innerHTML = `<div class="grid grid-2" id="queue-cards"></div>`;
  const wrap = document.getElementById('queue-cards');
  wrap.style.gridTemplateColumns = 'repeat(auto-fit, minmax(380px, 1fr))';

  doctors.forEach(doc => {
    const card = document.createElement('div');
    card.className = 'queue-card';
    card.id = `qcard-${doc.id}`;
    wrap.appendChild(card);
    renderDoctorCard(doc.id);
  });
}

function renderDoctorCard(doctorId) {
  const card = document.getElementById(`qcard-${doctorId}`);
  if (!card) return;
  const summary = Storage.doctorQueueSummary(doctorId);
  const doc = summary.doctor;
  if (!doc) { card.remove(); return; }

  const activeHtml = summary.active ? `
    <div class="queue-row">
      <div class="tok">${summary.active.token}</div>
      <div>
        <div class="who">${escapeHtml(summary.active.name)}</div>
        <div class="sub">${priorityPillInline(summary.active.priority)} · ${statusBadge(summary.active.status)}</div>
      </div>
      <div class="actions">
        ${summary.active.status === 'Called'
          ? `<button class="btn btn-primary btn-sm" data-act="start" data-id="${summary.active.id}">Start Consultation</button>`
          : `<button class="btn btn-primary btn-sm" data-act="complete" data-id="${summary.active.id}">Complete</button>`}
        <button class="btn btn-ghost btn-sm" data-act="cancel" data-id="${summary.active.id}">Cancel</button>
      </div>
    </div>` : `
    <div class="queue-row" style="grid-template-columns:1fr auto;">
      <div class="muted">No one is currently being served.</div>
      <button class="btn btn-primary btn-sm" data-act="callnext" data-doc="${doc.id}" ${summary.waiting.length === 0 ? 'disabled' : ''}>Call Next</button>
    </div>`;

  const waitingRows = summary.waiting.map((p, i) => `
    <div class="queue-row">
      <div class="tok">${p.token}</div>
      <div>
        <div class="who">${escapeHtml(p.name)}</div>
        <div class="sub">${priorityPillInline(p.priority)} · waiting #${i + 1} · ~${Storage.estimateWait(p)} min</div>
      </div>
      <div class="actions">
        <button class="btn btn-ghost btn-sm" data-act="cancel" data-id="${p.id}">Cancel</button>
      </div>
    </div>`).join('');

  card.innerHTML = `
    <div class="qhead">
      <div>
        <div class="name">${escapeHtml(doc.name)} <span class="tok" style="font-size:12px;color:var(--slate-500);font-weight:700;">${doc.prefix}-series</span></div>
        <div class="dept">${escapeHtml(doc.department)} · Room ${escapeHtml(doc.room || '—')} · ~${doc.avgDuration} min/patient</div>
      </div>
      <div class="muted" style="font-size:12px;">${summary.waiting.length} waiting · ${summary.completedCount} done today</div>
    </div>
    <div class="qbody">
      ${activeHtml}
      ${summary.waiting.length ? `<div class="section-title" style="margin:14px 0 4px;">Waiting list</div>${waitingRows}` : ''}
      ${(!summary.active && summary.waiting.length === 0) ? `<div class="empty-state" style="margin-top:10px;padding:20px;">Queue is empty.</div>` : ''}
    </div>
  `;

  card.querySelectorAll('[data-act]').forEach(btn => {
    btn.addEventListener('click', () => handleQueueAction(btn.dataset.act, btn.dataset.id, btn.dataset.doc));
  });
}

function priorityPillInline(priority) {
  return priorityPill(priority);
}

async function handleQueueAction(action, patientId, doctorId) {
  if (action === 'callnext') {
    const result = Storage.callNext(doctorId);
    if (result) toast(`Token ${result.token} called.`, 'success');
    renderDoctorCard(doctorId);
    return;
  }
  const patient = Storage.getPatient(patientId);
  if (!patient) return;

  if (action === 'start') {
    Storage.startConsultation(patientId);
    toast(`Token ${patient.token} — consultation started.`, 'success');
  } else if (action === 'complete') {
    Storage.completeConsultation(patientId);
    toast(`Token ${patient.token} marked as completed.`, 'success');
  } else if (action === 'cancel') {
    const ok = await confirmDialog({
      title: 'Cancel this token?',
      message: `Token ${patient.token} for ${patient.name} will be marked as cancelled.`,
      confirmLabel: 'Cancel token',
      danger: true
    });
    if (!ok) return;
    Storage.cancelPatient(patientId);
    if (patient.status === 'Called' || patient.status === 'In Consultation') {
      Storage.callNext(patient.doctorId);
    }
    toast(`Token ${patient.token} cancelled.`);
  }
  renderDoctorCard(patient.doctorId);
}
