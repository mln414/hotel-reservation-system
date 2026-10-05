# Phase 1 local verification and remaining operations

The QA scripts require DB_HOST, DB_PORT, DB_NAME, DB_USER, and DB_PASSWORD.
Export them from your private environment before running. DB_USER takes precedence
over the legacy backend DB_USERNAME variable. Missing configuration fails before
HTTP mutations. MySQL receives the secret through its child environment, never
through shell interpolation or command-line arguments.

The password exposed by the old QA scripts MUST BE ROTATED. Removing source copies
does not revoke it. Local read-only MySQL access confirmed the account
`lankastay_app@localhost`. Use an administrative session and the reviewed template
`rotate_database_password.sql.example`, substituting a newly generated secret
privately. Coordinate updating ignored .env and production secrets with restarting
the backend; existing connection pools can hide a stale credential until reconnect.
The old ignored .env currently remains unchanged so the running project is not
unexpectedly disconnected. Treat any ignored .env.zip or backups as secret-bearing:
replace/remove obsolete backups privately after rotation. If the old secret is in
Git history, coordinate history cleanup with all clones after rotation.

Then reconnect using only the new DB_PASSWORD environment value and verify
`SELECT 1`, backend startup, and a normal API request. Rotation and reconnection
with a NEW credential were not performed by the remediation agent.

Backend restart applies Flyway V19 (active backend) or V6 (older standalone copy).
These migrations add customer session_version with default zero. Do not run both
backend variants against the same database; their historical migration lineages
differ. The currently running 8080 process does not hot-load these source changes.

Outside the explicit dev profile, configure MAIL_HOST, MAIL_PORT, MAIL_USERNAME,
MAIL_PASSWORD, MAIL_FROM, MAIL_SMTP_AUTH, MAIL_STARTTLS, and FRONTEND_URL.
SMTP delivery runs asynchronously and failures are reported privately, with the
same generic HTTP confirmation for unknown and known addresses. Provider delivery
must be checked with a controlled mailbox before production release.
Only an explicitly enabled dev profile writes development reset links to the
private developer console; there is no HTTP token lookup in any profile.

Customer recovery/reset uses the customer auth namespace; staff uses the staff
namespace. Supply tokens exclusively from delivered URLs. The old live QA script
requires QA_RESET_TOKEN from private mail delivery; it cannot retrieve links from
the removed HTTP helper. For unattended complete reset verification, use the
JUnit suite, which captures EmailService delivery without contacting SMTP or
altering the real database.

Uploads accept single-extension JPG/JPEG/PNG/WebP filenames, ignore client MIME
for trust decisions, check dimensions before decoding, and re-encode pixels.
WebP is decoded by TwelveMonkeys and sanitized to PNG (URL/MIME report PNG).
Uploads and static serving share file.upload-dir/destinations. Old HTML/SVG paths
are not served. CSP is on the backend API/upload origin; the React document is
served by Vite/frontend hosting and is not subject to that response policy.

Forgot-password throttling is five requests per IP per fifteen minutes, shared
between customer and staff flows, with bounded local state. Database work and
mail enqueue may still create small timing differences; SMTP network latency is
outside the HTTP request. Multi-instance deployment requires a shared limiter.

## Addendum — 2026-09-18 credential and deployment limits

See [dated final evidence](../../docs/audit-evidence/PRE_COMMIT_VERIFICATION_2026-09-18.md).
Working MySQL authentication and a database-backed endpoint were verified, but
HIGH-03 rotation remains NOT VERIFIED: the current configured database credential
still equals a historical exposed value. Local bootstrap configuration also
matches its historical exposed value; known-value account comparison found zero
matches. Replace/remove those private settings and verify again without logging secrets.
Fresh isolated B18→V19 and read-only live V18 validation already passed. This does
not apply live V19 or verify external SMTP delivery. No inactive-copy repair,
live credential change, commit, push or branch switch ran in this continuation.
