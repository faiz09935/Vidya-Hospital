document.addEventListener('DOMContentLoaded', () => {
  Storage.seedIfEmpty();
  renderShell('settings', 'Settings', 'Hospital details and demo data controls');
  renderSettingsPage();
});

function renderSettingsPage() {
  const content = document.getElementById('page-content');
  const s = Storage.getSettings();

  content.innerHTML = `
    <div class="panel" style="max-width:640px;">
      <div class="panel-head"><h2>Hospital details</h2></div>
      <div class="form-grid">
        <div class="field span-2" id="f-hosp-name">
          <label>Hospital / clinic name <span class="req">*</span></label>
          <input type="text" id="set-hosp-name" value="${escapeHtml(s.hospitalName)}">
          <div class="error-text">Please enter a hospital name.</div>
        </div>
        <div class="field span-2">
          <label>Tagline</label>
          <input type="text" id="set-tagline" value="${escapeHtml(s.tagline || '')}">
        </div>
        <div class="field span-2">
          <label>Admin / front desk display name</label>
          <input type="text" id="set-admin" value="${escapeHtml(s.adminName || '')}">
        </div>
      </div>
      <div class="modal-actions" style="justify-content:flex-start;">
        <button class="btn btn-primary" id="btn-save-settings">Save changes</button>
      </div>
    </div>

    <div class="panel" style="max-width:640px;">
      <div class="panel-head"><h2>Demo data</h2></div>
      <p>Reset restores the sample doctors and patients this project ships with — useful before a fresh viva demonstration. This clears the queue currently on this browser.</p>
      <div class="modal-actions" style="justify-content:flex-start;">
        <button class="btn btn-outline" id="btn-reset-demo">Reset Demo Data</button>
        <button class="btn btn-danger" id="btn-clear-all">Clear All Data</button>
      </div>
    </div>
  `;

  document.getElementById('btn-save-settings').addEventListener('click', () => {
    const hospitalName = document.getElementById('set-hosp-name').value.trim();
    const tagline = document.getElementById('set-tagline').value.trim();
    const adminName = document.getElementById('set-admin').value.trim();
    const nameOk = hospitalName.length >= 2;
    setFieldError('f-hosp-name', !nameOk);
    if (!nameOk) { toast('Please enter a hospital name.', 'error'); return; }
    Storage.saveSettings({ hospitalName, tagline, adminName });
    toast('Settings saved.', 'success');
    renderShell('settings', 'Settings', 'Hospital details and demo data controls');
    renderSettingsPage();
  });

  document.getElementById('btn-reset-demo').addEventListener('click', async () => {
    const ok = await confirmDialog({
      title: 'Reset demo data?',
      message: 'This replaces all current doctors, patients, and tokens with the original sample data.',
      confirmLabel: 'Reset data',
      danger: true
    });
    if (!ok) return;
    Storage.resetDemoData();
    toast('Demo data restored.', 'success');
    renderSettingsPage();
  });

  document.getElementById('btn-clear-all').addEventListener('click', async () => {
    const ok = await confirmDialog({
      title: 'Clear all data?',
      message: 'This permanently deletes every doctor and patient record on this browser, with nothing to replace it.',
      confirmLabel: 'Clear everything',
      danger: true
    });
    if (!ok) return;
    Storage.clearAllData();
    toast('All data cleared.');
    renderSettingsPage();
  });
}
