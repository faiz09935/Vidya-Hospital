document.addEventListener('DOMContentLoaded', () => {
  Storage.seedIfEmpty();
  renderShell('register', 'Register Patient', 'Add a new patient and generate their queue token');
  renderRegisterForm();
});

function renderRegisterForm() {
  const content = document.getElementById('page-content');
  const doctors = Storage.getDoctors();

  const doctorOptions = doctors.map(d =>
    `<option value="${d.id}" ${d.available ? '' : 'disabled'}>
      ${escapeHtml(d.name)} — ${escapeHtml(d.department)}${d.available ? '' : ' (unavailable)'}
    </option>`
  ).join('');

  content.innerHTML = `
    <div class="panel" style="max-width:760px;">
      ${doctors.length === 0 ? `<div class="empty-state"><div class="icon">🩺</div>No doctors set up yet. <a href="doctors.html">Add a doctor first</a>.</div>` : `
      <form id="register-form" novalidate>
        <div class="form-grid">
          <div class="field" id="f-name">
            <label>Patient name <span class="req">*</span></label>
            <input type="text" id="in-name" placeholder="e.g. Rahul Sharma" autocomplete="off">
            <div class="error-text">Please enter the patient's name.</div>
          </div>
          <div class="field" id="f-age">
            <label>Age <span class="req">*</span></label>
            <input type="number" id="in-age" placeholder="e.g. 34" min="0" max="120">
            <div class="error-text">Enter a valid age between 0 and 120.</div>
          </div>
          <div class="field" id="f-gender">
            <label>Gender <span class="req">*</span></label>
            <select id="in-gender">
              <option value="">Select gender</option>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
            <div class="error-text">Please select a gender.</div>
          </div>
          <div class="field" id="f-mobile">
            <label>Mobile number <span class="req">*</span></label>
            <input type="tel" id="in-mobile" placeholder="10-digit mobile number">
            <div class="error-text">Enter a valid 10-digit mobile number.</div>
          </div>
          <div class="field span-2" id="f-address">
            <label>Address</label>
            <input type="text" id="in-address" placeholder="Optional">
          </div>
          <div class="field" id="f-doctor">
            <label>Doctor <span class="req">*</span></label>
            <select id="in-doctor">
              <option value="">Select doctor</option>
              ${doctorOptions}
            </select>
            <div class="error-text">Please select an available doctor.</div>
          </div>
          <div class="field" id="f-department">
            <label>Department</label>
            <input type="text" id="in-department" placeholder="Auto-filled from doctor" disabled>
          </div>
          <div class="field span-2" id="f-reason">
            <label>Reason for visit</label>
            <textarea id="in-reason" placeholder="Briefly describe the symptoms or purpose of the visit"></textarea>
          </div>
          <div class="field span-2" id="f-priority">
            <label>Priority</label>
            <div class="priority-choices">
              <label class="priority-choice sel-Normal is-selected" data-p="Normal">
                <input type="radio" name="priority" value="Normal" checked>Normal
              </label>
              <label class="priority-choice sel-Senior" data-p="Senior">
                <input type="radio" name="priority" value="Senior">Senior Citizen
              </label>
              <label class="priority-choice sel-Emergency" data-p="Emergency">
                <input type="radio" name="priority" value="Emergency">Emergency
              </label>
            </div>
          </div>
        </div>
        <div class="modal-actions" style="justify-content:flex-start;margin-top:22px;">
          <button type="submit" class="btn btn-primary">Register & Generate Token</button>
          <button type="reset" class="btn btn-ghost" id="btn-clear">Clear form</button>
        </div>
      </form>
      `}
    </div>
    <div id="token-result"></div>
  `;

  if (doctors.length === 0) return;

  const doctorSelect = document.getElementById('in-doctor');
  const deptInput = document.getElementById('in-department');
  doctorSelect.addEventListener('change', () => {
    const doc = Storage.getDoctor(doctorSelect.value);
    deptInput.value = doc ? doc.department : '';
    clearFieldError('f-doctor');
  });

  document.querySelectorAll('.priority-choice').forEach(el => {
    el.addEventListener('click', () => {
      document.querySelectorAll('.priority-choice').forEach(o => o.classList.remove('is-selected'));
      el.classList.add('is-selected');
    });
  });

  document.getElementById('register-form').addEventListener('submit', onSubmitRegister);
  document.getElementById('register-form').addEventListener('reset', () => {
    setTimeout(() => {
      document.querySelectorAll('.priority-choice').forEach(o => o.classList.remove('is-selected'));
      document.querySelector('.priority-choice.sel-Normal').classList.add('is-selected');
      deptInput.value = '';
      ['f-name', 'f-age', 'f-gender', 'f-mobile', 'f-doctor'].forEach(clearFieldError);
    }, 0);
  });
}

function onSubmitRegister(e) {
  e.preventDefault();

  const name = document.getElementById('in-name').value.trim();
  const age = document.getElementById('in-age').value;
  const gender = document.getElementById('in-gender').value;
  const mobile = document.getElementById('in-mobile').value.trim();
  const address = document.getElementById('in-address').value.trim();
  const doctorId = document.getElementById('in-doctor').value;
  const reason = document.getElementById('in-reason').value.trim();
  const priority = document.querySelector('input[name="priority"]:checked').value;

  let valid = true;
  const nameOk = name.length >= 2;
  setFieldError('f-name', !nameOk); if (!nameOk) valid = false;

  const ageOk = age !== '' && Number(age) >= 0 && Number(age) <= 120;
  setFieldError('f-age', !ageOk); if (!ageOk) valid = false;

  const genderOk = !!gender;
  setFieldError('f-gender', !genderOk); if (!genderOk) valid = false;

  const mobileOk = /^[6-9]\d{9}$/.test(mobile);
  setFieldError('f-mobile', !mobileOk); if (!mobileOk) valid = false;

  const doctorOk = !!doctorId;
  setFieldError('f-doctor', !doctorOk); if (!doctorOk) valid = false;

  if (!valid) {
    toast('Please fix the highlighted fields.', 'error');
    return;
  }

  const patient = Storage.registerPatient({ name, age, gender, mobile, address, doctorId, reason, priority });
  toast(`Token ${patient.token} generated.`, 'success');
  showTokenResult(patient);
}

function showTokenResult(patient) {
  const doctor = Storage.getDoctor(patient.doctorId);
  const waitAhead = Storage.waitingQueue(patient.doctorId).findIndex(p => p.id === patient.id);
  const est = Storage.estimateWait(patient);
  const settings = Storage.getSettings();

  document.getElementById('register-form') && (document.getElementById('register-form').parentElement.style.display = 'none');

  const box = document.getElementById('token-result');
  box.innerHTML = `
    <div class="panel" style="max-width:760px;">
      <div class="panel-head">
        <h2>Token confirmed</h2>
        <button class="btn btn-ghost btn-sm" id="btn-register-another">Register another patient</button>
      </div>
      <div class="ticket-wrap">
        <div id="print-ticket">
        <div class="ticket">
          <div class="hosp">${escapeHtml(settings.hospitalName)}</div>
          <div class="label">TOKEN NUMBER</div>
          <div class="big-token">${patient.token}</div>
          <hr>
          <div class="row"><span>Patient</span><span>${escapeHtml(patient.name)}</span></div>
          <div class="row"><span>Doctor</span><span>${doctor ? escapeHtml(doctor.name) : '—'}</span></div>
          <div class="row"><span>Department</span><span>${escapeHtml(patient.department)}</span></div>
          <div class="row"><span>Priority</span><span>${patient.priority}</span></div>
          <div class="row"><span>Registered</span><span>${formatClock(patient.registeredAt)}</span></div>
          <div class="wait-callout">Estimated waiting time: ~${est} minutes (${Math.max(waitAhead, 0)} ahead of you)</div>
        </div>
        </div>
      </div>
      <div class="modal-actions" style="justify-content:center;">
        <button class="btn btn-outline" id="btn-print">Print Token</button>
        <a class="btn btn-primary" href="queue.html">View Queue</a>
      </div>
    </div>
  `;

  document.getElementById('btn-print').addEventListener('click', () => window.print());
  document.getElementById('btn-register-another').addEventListener('click', () => renderRegisterForm());
}
