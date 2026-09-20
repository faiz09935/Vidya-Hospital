/* ==========================================================================
   storage.js — data layer for the Hospital Queue Management System
   Everything the app knows lives in localStorage under these keys.
   No external calls, no frameworks — plain objects, plain arrays.
   ========================================================================== */

const HQMS_KEYS = {
  DOCTORS: 'hqms_doctors',
  PATIENTS: 'hqms_patients',
  SETTINGS: 'hqms_settings',
  COUNTERS: 'hqms_counters',
  SEEDED: 'hqms_seeded_v1'
};

const PRIORITY_WEIGHT = { Emergency: 0, Senior: 1, Normal: 2 };
const PRIORITY_LABELS = ['Normal', 'Senior', 'Emergency'];
const STATUS_FLOW = ['Waiting', 'Called', 'In Consultation', 'Completed', 'Cancelled'];

const Storage = (function () {

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      console.error('Storage read failed for', key, e);
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('Storage write failed for', key, e);
      return false;
    }
  }

  function uid(prefix) {
    return (prefix || 'id') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function todayStr(d) {
    const dt = d ? new Date(d) : new Date();
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const day = String(dt.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  // Doctors --------------------------------------------------------------
  function getDoctors() { return read(HQMS_KEYS.DOCTORS, []); }
  function saveDoctors(list) { return write(HQMS_KEYS.DOCTORS, list); }
  function getDoctor(id) { return getDoctors().find(d => d.id === id) || null; }

  function nextPrefix() {
    const letters = getDoctors().map(d => d.prefix);
    for (let i = 0; i < 26; i++) {
      const letter = String.fromCharCode(65 + i);
      if (!letters.includes(letter)) return letter;
    }
    // fall back to double letters AA, AB, ...
    for (let i = 0; i < 26; i++) {
      for (let j = 0; j < 26; j++) {
        const letter = String.fromCharCode(65 + i) + String.fromCharCode(65 + j);
        if (!letters.includes(letter)) return letter;
      }
    }
    return 'X';
  }

  function addDoctor(doc) {
    const doctors = getDoctors();
    const record = {
      id: uid('doc'),
      name: doc.name,
      department: doc.department,
      specialization: doc.specialization || '',
      avgDuration: Number(doc.avgDuration) || 10,
      room: doc.room || '',
      available: doc.available !== false,
      prefix: nextPrefix(),
      createdAt: new Date().toISOString()
    };
    doctors.push(record);
    saveDoctors(doctors);
    return record;
  }

  function updateDoctor(id, patch) {
    const doctors = getDoctors();
    const idx = doctors.findIndex(d => d.id === id);
    if (idx === -1) return null;
    doctors[idx] = Object.assign({}, doctors[idx], patch);
    saveDoctors(doctors);
    return doctors[idx];
  }

  function deleteDoctor(id) {
    saveDoctors(getDoctors().filter(d => d.id !== id));
    // Patients keep their historical doctor reference even if the doctor is removed.
  }

  // Counters (per doctor, per day) ---------------------------------------
  function getCounters() { return read(HQMS_KEYS.COUNTERS, {}); }
  function saveCounters(c) { return write(HQMS_KEYS.COUNTERS, c); }

  function nextToken(doctorId) {
    const doctor = getDoctor(doctorId);
    if (!doctor) return null;
    const day = todayStr();
    const counters = getCounters();
    const key = `${doctorId}_${day}`;
    const nextNum = (counters[key] || 0) + 1;
    counters[key] = nextNum;
    saveCounters(counters);
    const padded = String(nextNum).padStart(3, '0');
    return `${doctor.prefix}-${padded}`;
  }

  // Patients / tokens ------------------------------------------------------
  function getPatients() { return read(HQMS_KEYS.PATIENTS, []); }
  function savePatients(list) { return write(HQMS_KEYS.PATIENTS, list); }
  function getPatient(id) { return getPatients().find(p => p.id === id) || null; }

  function getTodayPatients() {
    const day = todayStr();
    return getPatients().filter(p => p.date === day);
  }

  function registerPatient(input) {
    const doctor = getDoctor(input.doctorId);
    if (!doctor) throw new Error('Doctor not found');
    const token = nextToken(input.doctorId);
    const record = {
      id: uid('pat'),
      name: input.name.trim(),
      age: Number(input.age),
      gender: input.gender,
      mobile: input.mobile.trim(),
      address: input.address ? input.address.trim() : '',
      doctorId: input.doctorId,
      department: doctor.department,
      reason: input.reason ? input.reason.trim() : '',
      priority: input.priority || 'Normal',
      token: token,
      status: 'Waiting',
      registeredAt: new Date().toISOString(),
      date: todayStr(),
      calledAt: null,
      startedAt: null,
      completedAt: null
    };
    const patients = getPatients();
    patients.push(record);
    savePatients(patients);
    return record;
  }

  function updatePatient(id, patch) {
    const patients = getPatients();
    const idx = patients.findIndex(p => p.id === id);
    if (idx === -1) return null;
    patients[idx] = Object.assign({}, patients[idx], patch);
    savePatients(patients);
    return patients[idx];
  }

  // Queue math -------------------------------------------------------------
  // Waiting list for one doctor, ordered by priority then arrival time.
  function waitingQueue(doctorId) {
    return getTodayPatients()
      .filter(p => p.doctorId === doctorId && p.status === 'Waiting')
      .sort((a, b) => {
        const pw = PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
        if (pw !== 0) return pw;
        return new Date(a.registeredAt) - new Date(b.registeredAt);
      });
  }

  function activePatient(doctorId) {
    // Whoever is currently being handled: prefer "In Consultation", else "Called".
    const today = getTodayPatients().filter(p => p.doctorId === doctorId);
    const inConsult = today.filter(p => p.status === 'In Consultation')
      .sort((a, b) => new Date(b.startedAt || 0) - new Date(a.startedAt || 0))[0];
    if (inConsult) return inConsult;
    const called = today.filter(p => p.status === 'Called')
      .sort((a, b) => new Date(b.calledAt || 0) - new Date(a.calledAt || 0))[0];
    return called || null;
  }

  function lastCompleted(doctorId) {
    return getTodayPatients()
      .filter(p => p.doctorId === doctorId && p.status === 'Completed')
      .sort((a, b) => new Date(b.completedAt || 0) - new Date(a.completedAt || 0))[0] || null;
  }

  // Estimated wait time for a single waiting patient, in minutes.
  function estimateWait(patient) {
    if (!patient || patient.status !== 'Waiting') return 0;
    const doctor = getDoctor(patient.doctorId);
    if (!doctor) return 0;
    const queue = waitingQueue(patient.doctorId);
    const position = queue.findIndex(p => p.id === patient.id);
    if (position === -1) return 0;
    const active = activePatient(patient.doctorId);
    const aheadInService = active ? 1 : 0;
    return (position + aheadInService) * doctor.avgDuration;
  }

  function doctorQueueSummary(doctorId) {
    const doctor = getDoctor(doctorId);
    const waiting = waitingQueue(doctorId);
    const active = activePatient(doctorId);
    const today = getTodayPatients().filter(p => p.doctorId === doctorId);
    return {
      doctor,
      waiting,
      active,
      completedCount: today.filter(p => p.status === 'Completed').length,
      cancelledCount: today.filter(p => p.status === 'Cancelled').length,
      totalToday: today.length
    };
  }

  function callNext(doctorId) {
    // Only one patient should be "Called" or "In Consultation" at a time per doctor.
    const current = activePatient(doctorId);
    if (current) return current; // finish the current one first
    const queue = waitingQueue(doctorId);
    if (queue.length === 0) return null;
    const next = queue[0];
    return updatePatient(next.id, { status: 'Called', calledAt: new Date().toISOString() });
  }

  function startConsultation(patientId) {
    return updatePatient(patientId, { status: 'In Consultation', startedAt: new Date().toISOString() });
  }

  function completeConsultation(patientId) {
    const patient = getPatient(patientId);
    if (!patient) return null;
    const updated = updatePatient(patientId, { status: 'Completed', completedAt: new Date().toISOString() });
    // Auto-advance: call the next waiting patient for this doctor, if any.
    callNext(patient.doctorId);
    return updated;
  }

  function cancelPatient(patientId) {
    return updatePatient(patientId, { status: 'Cancelled', completedAt: new Date().toISOString() });
  }

  // Settings -----------------------------------------------------------------
  function getSettings() {
    return read(HQMS_KEYS.SETTINGS, {
      hospitalName: 'Sunrise General Hospital',
      tagline: 'Care without the wait',
      adminName: 'Front Desk Admin'
    });
  }
  function saveSettings(s) { return write(HQMS_KEYS.SETTINGS, s); }

  // Seed / reset ---------------------------------------------------------
  function seedDoctors() {
    const doctors = [
      { name: 'Dr. Ankit Verma', department: 'General Medicine', specialization: 'Internal Medicine', avgDuration: 10, room: '102', available: true },
      { name: 'Dr. Priya Singh', department: 'Pediatrics', specialization: 'Child Health', avgDuration: 12, room: '108', available: true },
      { name: 'Dr. Rohan Mehta', department: 'Orthopedics', specialization: 'Joint & Spine', avgDuration: 15, room: '204', available: true },
      { name: 'Dr. Neha Kulkarni', department: 'Dermatology', specialization: 'Skin & Cosmetology', avgDuration: 8, room: '110', available: false }
    ];
    doctors.forEach(d => addDoctor(d));
  }

  function seedPatients() {
    const doctors = getDoctors();
    if (doctors.length === 0) return;
    const now = Date.now();
    const sample = [
      { name: 'Rahul Sharma', age: 34, gender: 'Male', mobile: '9876543210', reason: 'Fever and cold', priority: 'Normal', doctor: 0, minsAgo: 55, status: 'Completed' },
      { name: 'Sunita Rao', age: 68, gender: 'Female', mobile: '9876500011', reason: 'Routine checkup', priority: 'Senior', doctor: 0, minsAgo: 40, status: 'Completed' },
      { name: 'Vikram Patel', age: 29, gender: 'Male', mobile: '9876500022', reason: 'Chest pain', priority: 'Emergency', doctor: 0, minsAgo: 20, status: 'In Consultation' },
      { name: 'Ayesha Khan', age: 5, gender: 'Female', mobile: '9876500033', reason: 'Vaccination', priority: 'Normal', doctor: 1, minsAgo: 30, status: 'Completed' },
      { name: 'Meera Joshi', age: 41, gender: 'Female', mobile: '9876500044', reason: 'Follow-up', priority: 'Normal', doctor: 0, minsAgo: 12, status: 'Waiting' },
      { name: 'Karan Malhotra', age: 8, gender: 'Male', mobile: '9876500055', reason: 'Fever', priority: 'Normal', doctor: 1, minsAgo: 8, status: 'Waiting' },
      { name: 'Deepak Nair', age: 72, gender: 'Male', mobile: '9876500066', reason: 'Knee pain', priority: 'Senior', doctor: 2, minsAgo: 15, status: 'Waiting' },
      { name: 'Priyanka Das', age: 26, gender: 'Female', mobile: '9876500077', reason: 'Back pain', priority: 'Normal', doctor: 2, minsAgo: 5, status: 'Waiting' },
      { name: 'Arjun Reddy', age: 19, gender: 'Male', mobile: '9876500088', reason: 'Sports injury', priority: 'Normal', doctor: 2, minsAgo: 2, status: 'Waiting' }
    ];

    sample.forEach(s => {
      const doctor = doctors[s.doctor];
      if (!doctor) return;
      const token = nextToken(doctor.id);
      const registeredAt = new Date(now - s.minsAgo * 60000).toISOString();
      const record = {
        id: uid('pat'),
        name: s.name,
        age: s.age,
        gender: s.gender,
        mobile: s.mobile,
        address: '',
        doctorId: doctor.id,
        department: doctor.department,
        reason: s.reason,
        priority: s.priority,
        token: token,
        status: 'Waiting',
        registeredAt: registeredAt,
        date: todayStr(),
        calledAt: null,
        startedAt: null,
        completedAt: null
      };
      if (s.status === 'Completed') {
        record.status = 'Completed';
        record.calledAt = new Date(now - (s.minsAgo - 2) * 60000).toISOString();
        record.startedAt = new Date(now - (s.minsAgo - 3) * 60000).toISOString();
        record.completedAt = new Date(now - (s.minsAgo - 10) * 60000).toISOString();
      } else if (s.status === 'In Consultation') {
        record.status = 'In Consultation';
        record.calledAt = new Date(now - (s.minsAgo - 2) * 60000).toISOString();
        record.startedAt = new Date(now - (s.minsAgo - 4) * 60000).toISOString();
      }
      const patients = getPatients();
      patients.push(record);
      savePatients(patients);
    });
  }

  function seedIfEmpty() {
    const already = read(HQMS_KEYS.SEEDED, false);
    if (already) return;
    if (getDoctors().length === 0) seedDoctors();
    if (getPatients().length === 0) seedPatients();
    write(HQMS_KEYS.SEEDED, true);
  }

  function resetDemoData() {
    localStorage.removeItem(HQMS_KEYS.DOCTORS);
    localStorage.removeItem(HQMS_KEYS.PATIENTS);
    localStorage.removeItem(HQMS_KEYS.COUNTERS);
    localStorage.removeItem(HQMS_KEYS.SEEDED);
    seedIfEmpty();
  }

  function clearAllData() {
    localStorage.removeItem(HQMS_KEYS.DOCTORS);
    localStorage.removeItem(HQMS_KEYS.PATIENTS);
    localStorage.removeItem(HQMS_KEYS.COUNTERS);
    localStorage.removeItem(HQMS_KEYS.SEEDED);
  }

  return {
    KEYS: HQMS_KEYS,
    uid, todayStr,
    getDoctors, saveDoctors, getDoctor, addDoctor, updateDoctor, deleteDoctor,
    getPatients, savePatients, getPatient, getTodayPatients, registerPatient, updatePatient,
    waitingQueue, activePatient, lastCompleted, estimateWait, doctorQueueSummary,
    callNext, startConsultation, completeConsultation, cancelPatient,
    getSettings, saveSettings,
    seedIfEmpty, resetDemoData, clearAllData,
    nextToken
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Storage;
}
