document.addEventListener('DOMContentLoaded', () => {
  Storage.seedIfEmpty();
  renderShell('doctors', 'Doctors', 'Add, edit, and manage doctor availability');
  renderDoctorsPage();
});

function renderDoctorsPage() {
  const content = document.getElementById('page-content');
  content.innerHTML = `
    <div class="panel-head" style="margin-bottom:16px;">
      <div></div>
      <button class="btn btn-primary" id="btn-add-doctor">+ Add Doctor</button>
    </div>
    <div class="grid grid-3" id="doctor-cards"></div>
    <div id="doctor-modal-mount"></div>
  `;
  content.querySelector('.panel-head').style.paddingBottom = '0';
  document.getElementById('btn-add-doctor').addEventListener('click', () => openDoctorModal(null));
  renderDoctorCards();
}

function renderDoctorCards() {
  const wrap = document.getElementById('doctor-cards');
  const doctors = Storage.getDoctors();
  if (doctors.length === 0) {
    wrap.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><div class="icon">🩺</div>No doctors yet. Add your first doctor to start building queues.</div>`;
    return;
  }
  wrap.innerHTML = doctors.map(d => {
    const summary = Storage.doctorQueueSummary(d.id);
    return `<div class="doctor-card">
      <div class="top">
        <div>
          <div class="name">${escapeHtml(d.name)}</div>
          <div class="dept">${escapeHtml(d.department)}${d.specialization ? ' · ' + escapeHtml(d.specialization) : ''}</div>
        </div>
        <span class="badge ${d.available ? 'badge-completed' : 'badge-cancelled'}">
          <span class="badge-dot"></span>${d.available ? 'Available' : 'Unavailable'}
        </span>
      </div>
      <div class="stats">
        <span>Room ${escapeHtml(d.room || '—')}</span>
        <span>~${d.avgDuration} min/patient</span>
        <span>${d.prefix}-series</span>
      </div>
      <div class="stats">
        <span>${summary.waiting.length} waiting today</span>
        <span>${summary.completedCount} completed</span>
      </div>
      <div class="actions">
        <button class="btn btn-outline btn-sm" data-act="edit" data-id="${d.id}">Edit</button>
        <button class="btn btn-ghost btn-sm" data-act="toggle" data-id="${d.id}">${d.available ? 'Mark unavailable' : 'Mark available'}</button>
        <button class="btn btn-danger btn-sm" data-act="delete" data-id="${d.id}">Delete</button>
      </div>
    </div>`;
  }).join('');

  wrap.querySelectorAll('[data-act]').forEach(btn => {
    btn.addEventListener('click', () => onDoctorAction(btn.dataset.act, btn.dataset.id));
  });
}

async function onDoctorAction(action, id) {
  const doctor = Storage.getDoctor(id);
  if (!doctor) return;
  if (action === 'edit') {
    openDoctorModal(doctor);
  } else if (action === 'toggle') {
    Storage.updateDoctor(id, { available: !doctor.available });
    toast(`${doctor.name} marked as ${!doctor.available ? 'available' : 'unavailable'}.`);
    renderDoctorCards();
  } else if (action === 'delete') {
    const ok = await confirmDialog({
      title: 'Delete this doctor?',
      message: `${doctor.name} will be removed from the doctor list. Past patient records are kept.`,
      confirmLabel: 'Delete doctor',
      danger: true
    });
    if (!ok) return;
    Storage.deleteDoctor(id);
    toast('Doctor removed.');
    renderDoctorCards();
  }
}

function openDoctorModal(doctor) {
  const mount = document.getElementById('doctor-modal-mount');
  const isEdit = !!doctor;
  mount.innerHTML = `
    <div class="modal-backdrop open" id="doctor-backdrop">
      <div class="modal-box" style="max-width:520px;">
        <h3>${isEdit ? 'Edit doctor' : 'Add doctor'}</h3>
        <p style="margin-bottom:12px;">${isEdit ? 'Update this doctor\'s details.' : 'New doctors get the next available token prefix automatically.'}</p>
        <div class="form-grid">
          <div class="field span-2" id="f-doc-name">
            <label>Doctor name <span class="req">*</span></label>
            <input type="text" id="doc-name" placeholder="e.g. Dr. Ankit Verma" value="${isEdit ? escapeHtml(doctor.name) : ''}">
            <div class="error-text">Please enter the doctor's name.</div>
          </div>
          <div class="field" id="f-doc-dept">
            <label>Department <span class="req">*</span></label>
            <input type="text" id="doc-dept" placeholder="e.g. General Medicine" value="${isEdit ? escapeHtml(doctor.department) : ''}">
            <div class="error-text">Please enter a department.</div>
          </div>
          <div class="field">
            <label>Specialization</label>
            <input type="text" id="doc-spec" placeholder="Optional" value="${isEdit ? escapeHtml(doctor.specialization || '') : ''}">
          </div>
          <div class="field" id="f-doc-duration">
            <label>Avg. consultation (min) <span class="req">*</span></label>
            <input type="number" id="doc-duration" min="1" max="120" value="${isEdit ? doctor.avgDuration : 10}">
            <div class="error-text">Enter a duration between 1 and 120 minutes.</div>
          </div>
          <div class="field">
            <label>Room number</label>
            <input type="text" id="doc-room" placeholder="e.g. 102" value="${isEdit ? escapeHtml(doctor.room || '') : ''}">
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn btn-outline" id="doc-cancel">Cancel</button>
          <button class="btn btn-primary" id="doc-save">${isEdit ? 'Save changes' : 'Add doctor'}</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('doc-cancel').addEventListener('click', () => mount.innerHTML = '');
  document.getElementById('doctor-backdrop').addEventListener('click', (e) => {
    if (e.target.id === 'doctor-backdrop') mount.innerHTML = '';
  });
  document.getElementById('doc-save').addEventListener('click', () => {
    const name = document.getElementById('doc-name').value.trim();
    const dept = document.getElementById('doc-dept').value.trim();
    const spec = document.getElementById('doc-spec').value.trim();
    const duration = document.getElementById('doc-duration').value;
    const room = document.getElementById('doc-room').value.trim();

    let valid = true;
    const nameOk = name.length >= 2;
    setFieldError('f-doc-name', !nameOk); if (!nameOk) valid = false;
    const deptOk = dept.length >= 2;
    setFieldError('f-doc-dept', !deptOk); if (!deptOk) valid = false;
    const durOk = duration !== '' && Number(duration) >= 1 && Number(duration) <= 120;
    setFieldError('f-doc-duration', !durOk); if (!durOk) valid = false;

    if (!valid) { toast('Please fix the highlighted fields.', 'error'); return; }

    if (isEdit) {
      Storage.updateDoctor(doctor.id, { name, department: dept, specialization: spec, avgDuration: Number(duration), room });
      toast('Doctor details updated.', 'success');
    } else {
      Storage.addDoctor({ name, department: dept, specialization: spec, avgDuration: Number(duration), room, available: true });
      toast('Doctor added successfully.', 'success');
    }
    mount.innerHTML = '';
    renderDoctorCards();
  });
}
