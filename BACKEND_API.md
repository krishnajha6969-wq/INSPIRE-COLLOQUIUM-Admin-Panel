# Backend integration contract

Implement these endpoints before connecting live registrations.

```text
GET /admin/session
→ { user: {name: string, role: "admin"}, csrfToken: string }
GET /admin/login → redirect into your admin authentication flow
POST /admin/logout → 204
GET /admin/registrations
→ { registrations: Registration[], complete: true }
Return a COMPLETE, consistent snapshot, not just one page.
PATCH /admin/registrations/:id/evaluation
Body: {status: "pending"|"selected"|"rejected", reason: string, expectedVersion: integer}
→ 200 after transaction committed; 409 for conflicts or capacity reached.
POST /admin/registrations/:id/reminders
Body: {type:"payment", expectedVersion: integer}
→ {status:"queued"|"sent"}; use an idempotent mail queue.

Registration = {
 id: string, version: integer, category: "UG"|"PG"|"PPG",
 teamName: string|null, createdAt: ISO8601 timestamp with timezone,
 track: string|null,
 members: [{fullName, email, mobile, college, department, year, isLeader: boolean}],
 abstract: {submitted: boolean, text: string|null, url: HTTPS_URL|null},
 evaluation: {status:"pending"|"selected"|"rejected", reason: string|null},
 payment: {status:"not_required"|"unpaid"|"submitted"|"verified"|"failed",
 reference: string|null, submittedAt: ISO8601|null, verifiedAt: ISO8601|null,
 receiptUrl: HTTPS_URL|null, lastReminderAt: ISO8601|null}
}
UG: 2–4 members, exactly one leader. PG/PPG: exactly one member.
Every listed member field is a string. year is free text.
No abstract → evaluation must be pending; UI displays Not submitted.
Selected → payment cannot be not_required.
Not selected → payment must be not_required.

The frontend password 1234 is a convenience privacy lock, not authentication. It is visible in source and bypassable. Never trust it on the server. Reloading always locks the dashboard; unlocking is not persisted.
All routes MUST enforce server-side admin authorization.
Use Secure, HttpOnly session cookies; allow credentials only from the exact frontend origin.
Validate Origin and X-CSRF-Token on mutations. Never use wildcard CORS with credentials.
All responses: Cache-Control: no-store. JSON errors: {message: string}.
401/403 clear this UI's session. 409 prompts a refresh, never overwrites silently.
Selection transaction: atomically enforce 60 UG teams / 25 PG individuals / 25 PPG individuals.
Use expectedVersion for optimistic concurrency and audit every decision (admin, time, old/new status, reason).
Reject selection without an abstract. Block reversals for verified payments until refund review.
The database is the source of truth. Payment verification must come from your server/payment provider.
Reminder endpoint must recheck selection, unpaid status, email consent/policy, cooldown,
deduplication and registered leader/individual recipient. Never accept recipients from this browser.
Provide short-lived authorized links for abstract files and payment receipts.

Updates: complete snapshots are refreshed every 15 seconds when visible.
This is polling, not a WebSocket stream. Use a consistent snapshot transaction.
For larger events replace snapshots with server-side paginated queries plus aggregate counts.
CSV exports every member of all FILTERED registrations, not just the current page.
Date filtering and Today use Asia/Kolkata. Capacity uses ALL selected registrations.
Database setup: on your server define DATABASE_URL in a private environment file,
connect with your chosen database driver, and map its records to this contract.
No database driver or secret is needed in this HTML.
```
