# INSPIRE Colloquium Admin Panel

A standalone, responsive admin frontend for registrations, abstract evaluation and payment monitoring. No build step, external libraries, demo records or database credentials are included.

## Run

Open `index.html` to preview the interface. Enter `1234` to unlock it. For backend integration, serve this folder over HTTP locally (`python3 -m http.server 8080`) or HTTPS in production.

Deploy the repository root to any static host with `index.html` as its entry point. GitHub Pages can serve the frontend when enabled in repository Settings → Pages → Deploy from a branch → main / root. Uploading this repository does not enable hosting automatically.

## Backend connection

Open **Backend setup** and enter your API base URL, or set `CONFIG.apiBase` in `index.html`. Implement the contract in [BACKEND_API.md](BACKEND_API.md). Database connections and credentials belong exclusively on the backend. The frontend does not include a backend or database implementation.

The `1234` screen is a source-visible, bypassable privacy lock. It is not authentication. Every live API must independently require a server-side admin session. The dashboard also provides backend sign-in and sign-out.

## Features

- UG teams and PG/PPG individual participants; capacity indicators of 60/25/25 selected registrations.
- Search by team, leader, participant, email or institution; category, status and registration date filters.
- Evaluation and unpaid/unverified payment queues, participant details and backend evaluation updates.
- Payment reminders through a backend endpoint with explicit confirmation.
- Complete filtered CSV export, light/dark mode and lock button.
- Refresh every 15 seconds while visible and authenticated; empty states with no demo data.
- Asia/Kolkata date boundaries, stale-data action protection and optimistic concurrency fields.

## Validate

With Node.js installed, run `npm test`. Tests use synthetic records only in the test process; the website contains no seeded registrations. These checks cover dashboard logic, not a live backend or a deployed browser session.
