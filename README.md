# Hospital Queue Management System

A fully working, browser-based queue management system for a hospital or clinic front desk — built as a BCA college project.

## Project purpose

Front desks at busy clinics juggle patient registration, doctor assignment, and "who's next" by hand or on paper. This project digitizes that flow: register a patient, hand them a token, and let the system track the queue, calculate waiting times, and move patients through consultation — all without a server, a database, or an internet connection.

## Features

- **Dashboard** — today's stats (registered, waiting, being served, completed), a live "currently serving" strip for every doctor, a doctor-wise patient chart, and quick actions.
- **Patient registration** — validated form (name, age, gender, mobile, address, doctor, reason, priority) that generates a unique token and a printable token card.
- **Automatic token numbering** — each doctor gets an independent letter series (A-001, B-001, …); numbers increase automatically and reset when the date changes.
- **Queue management** — a card per doctor with Call Next → Start Consultation → Complete controls; completing a patient automatically calls the next one in line.
- **Estimated waiting time** — calculated live from queue position × the doctor's average consultation time, with priority (Emergency → Senior Citizen → Normal) affecting queue order.
- **Doctor management** — add, edit, delete doctors, and toggle Available/Unavailable.
- **Patient search** — search every record by name, token, or mobile number.
- **Patient history** — full record log with date, doctor, and status filters.
- **Live Queue Screen** — a full-screen, auto-refreshing display meant for a waiting-room TV.
- **Settings** — hospital name/branding and a Reset Demo Data / Clear All Data option.
- **Print Token** — a clean print stylesheet that prints only the token card.

## Technologies used

- HTML5, CSS3, vanilla JavaScript (no frameworks)
- Browser `localStorage` for all data persistence
- Google Fonts (Manrope + IBM Plex Sans) and Chart.js, both loaded from a CDN — no paid APIs, no backend, no login system

## Folder structure

```
hospital-queue-management/
│
├── index.html         Dashboard
├── register.html      Patient registration + token generation
├── queue.html          Queue management (per doctor)
├── doctors.html        Doctor management
├── patients.html        Patient search
├── history.html        Patient history + filters
├── display.html        Live Queue Screen (TV display)
├── settings.html        Hospital settings + demo data reset
│
├── css/
│   └── style.css        All styling (design tokens, layout, components)
│
├── js/
│   ├── storage.js        Data layer: localStorage schema, token logic, queue math
│   ├── app.js            Shared UI shell (sidebar, topbar, toast, modal, clock)
│   ├── dashboard.js       Dashboard page logic
│   ├── register.js        Registration form + token confirmation
│   ├── queue.js           Queue management page logic
│   ├── doctors.js         Doctor management page logic
│   ├── patients.js        Patient search page logic
│   ├── history.js         Patient history page logic
│   ├── display.js         Live Queue Screen logic
│   └── settings.js        Settings page logic
│
├── assets/images/       (reserved for future icons/logo)
└── README.md
```

## How to run the project

**Option 1 — just open it.** Double-click `index.html` (or right-click → Open with your browser). Every page works directly from the file system.

**Option 2 — local server (optional, but recommended for the demo).** From inside the project folder:

```
python3 -m http.server 8000
```

Then open `http://localhost:8000` in your browser.

## How LocalStorage works here

Everything the app knows — doctors, patients, tokens, today's counters, settings — is stored as JSON under a few keys in the browser's `localStorage` (see `js/storage.js`). There is no server: every page reads and writes directly to `localStorage`, so data survives a refresh or closing the tab, but it lives only on that one browser/device. Token counters are stored per doctor *and* per date, so numbering restarts automatically the next day without any extra code.

## Demo data

The first time the app runs, it seeds four sample doctors and nine sample patients (a mix of Waiting, In Consultation, and Completed) so the dashboard and queue never look empty. This is a one-time seed — your own registrations build on top of it.

## How to reset demo data

Go to **Settings → Reset Demo Data** to wipe the current queue and restore the original sample doctors and patients. **Clear All Data** on the same page removes everything with nothing put back, useful for a clean run-through before your viva.

## Suggested demo script (for viva)

1. Open the Dashboard — point out today's stats and the "currently serving" strip.
2. Go to **Register Patient**, fill the form, submit — a token is generated and the printable ticket appears.
3. Open **Queue Management** — the new token is in the doctor's waiting list with an estimated wait time.
4. Click **Call Next → Start Consultation → Complete** — watch the doctor's queue automatically call the next patient.
5. Return to the Dashboard — the stats update immediately.
6. Open **Patients**, search for the token or name just used.
7. Open **History**, filter by today's date to see the full log.
8. Refresh the browser to show the data survived.
9. Open **Live Queue Screen** to show the waiting-room display.

## Future improvements

- Multi-branch / multi-clinic support
- SMS or WhatsApp token notifications
- Appointment booking ahead of walk-in tokens
- Exportable daily reports (CSV/PDF)
- Role-based login for reception vs. admin
