# Phase 1 security remediation verification

Date: 2026-09-17. Verified implementation scope: active `backend/` plus `frontend/`
and QA/config tooling. No Medium/Low finding was independently remediated.
Session invalidation and upload response CSP are included because Phase 1 explicitly requires them.

## Ordered verification gates

1. Source/boundary review: traced all reset controllers/services, customer session readers,
staff registry/filter expiry, token entity/repository/migrations, frontend recovery callers,
the only MultipartFile upload endpoint and resource handler, catalog CRUD, all discount
service callers, and current database credential copies. No tokenless setter or entity-bound
discount request remains. Retired URLs appear only in 404 tombstones, tests, and historical
audit/specification examples; they have no password-changing or email-check handler.
2. Security triggers and alternative malicious inputs: actual MockMvc requests and trusted
parser tests reject takeover/enumeration paths, cross-namespace and expired/used tokens,
cross-hotel and mass-assignment attempts, and spoofed raster/traversal/double-extension/
oversized/dimension-bomb uploads. A separate review pass found Spring's default expired
session response was HTTP 200; the candidate now returns 401 and the authenticated request
regression passes. Original insecure-flow tests were migrated, preserving confirmation,
hash-only password persistence, old-password rejection, and new-password login controls.
3. Legitimate controls and owning-package checks: active backend full test suite, frontend
production build, relevant domain tests, security API/UI rendering tests, and actual isolated
HTTP runtime smoke all passed. Read-only MySQL access succeeded with the existing private
environment credential; no rotation success is claimed.

## Exact commands and results

| Command / check | Result |
|---|---|
| backend: `mvnw.cmd -o "-Dmaven.repo.local=.m2/repository" "-Dlogging.level.root=WARN" "-Ddebug=false" test` | PASS — 197 tests, 0 failures/errors/skips |
| Phase 1 backend regression suites (included above) | PASS — 59 tests: SecurityPhaseOneIntegrationTest 24; MediaStorageServiceTest 22; AuthenticationPersistenceAndResetTest 4; DiscountServiceTest 5; secure customer/staff reset tests 2 each |
| frontend: `npm.cmd run build` | PASS — production bundle; existing chunk-size warning only |
| frontend: `npm.cmd run test:security` | PASS — separate customer/staff APIs, CSRF, required DB config, four recovery/reset pages rendered |
| frontend: `npm.cmd run test:auth-validation` | PASS |
| frontend: `npm.cmd run test:rates` | PASS |
| frontend: `npm.cmd run test:destinations` | PASS |
| `node --check` for both named QA scripts and db-config.js | PASS |
| `git -c core.whitespace=cr-at-eol diff --check` | PASS after respecting Windows CRLF; unrelated user changes preserved |
| Repository-wide exact old-secret filename-only scan, including hidden/rollback/secondary source copies (excluding binary/build/vendor/browser-cache/Git internals) | Only ignored local .env matches; no current source/doc/example copy |
| No obsolete frontend/QA calls or removed service/DTO imports | PASS — frontend/QA call search has no matches |
| Local MySQL read-only CURRENT_USER() | PASS — lankastay_app@localhost; password not printed |
| Reconnect using a rotated credential | NOT RUN — manual DBA step, HIGH-03 not fully closed |
| Older copy: `mvnw.cmd -o "-Dmaven.repo.local=../../backend/.m2/repository" "-Dlogging.level.root=WARN" "-Ddebug=false" test` | FAIL / UNVERIFIED — pre-existing missing Room/Offer entities and repositories and mismatched reservation types |
| External SMTP delivery | NOT RUN — configure provider and controlled mailbox before production |

Initial sandbox execution denied Java access to dependency JARs; dependency download and
Java verification succeeded after approved execution outside the sandbox. The initial
frontend `npm` alias hit PowerShell execution policy; `npm.cmd` succeeded without changing policy.
The initial full suite failed on four obsolete insecure-flow assertions and the HTTP 200
expiry response; both were corrected, and the final full suite passed.

## Safe isolated runtime

Started active Spring Boot with test classpath, `server.port=0`,
`jdbc:h2:mem:phase1_runtime;MODE=MySQL;DATABASE_TO_LOWER=TRUE`,
Flyway disabled, create-drop schema, no authentication bootstrap, and uploads under
`backend/target/phase1-runtime-uploads`. Actual selected port was 60924.
An initial plain-H2 attempt failed on the existing MySQL-specific seed SQL; enabling MySQL
compatibility resolved it without changing the user's seed initializer.

Command: `PHASE1_BASE_URL=http://localhost:60924 PHASE1_ALLOW_ISOLATED_FIXTURES=true node scripts/qa/verify_phase_one_runtime.mjs`
(set variables using the local shell syntax).
PASS: anonymous retired routes 404 even without CSRF; CSRF initialization; controlled
customer registration/login; identical known/unknown reset responses; staff generic
reset response; invalid token cannot change login credential; public destination
discovery 200; nosniff/sandbox CSP; SVG upload path 404.
The script requires explicit isolated-fixture opt-in and refuses non-local hosts.
The temporary Java process was identity-checked and stopped after testing.
The Maven run wrapper then reported exit -1 because its Java child was intentionally
stopped; this is the recorded shutdown outcome, not an HTTP/startup test failure.
The existing 8080 process and real MySQL data were not mutated.

## PHASE 1 REMEDIATION VERIFICATION

| Finding | Original Risk | Fix Applied | Regression Test | Test Result | Remaining Manual Step | Final Status |
|---|---|---|---|---|---|---|
| CRIT-01 | CRITICAL: anonymous account takeover | Removed tokenless mappings/services/DTO; 256-bit random hash-only, scoped, locked one-use tokens; mail delivery; lock reset and session revocation | SecurityPhaseOneIntegrationTest; AuthenticationPersistenceAndResetTest; SimpleForgotPasswordIntegrationTest; SimpleStaffForgotPasswordIntegrationTest | PASS: invalid/expired/used/random tokens, once-only reset, hash change, cross-namespace rejection, shared-email isolation, customer/staff session rejection | Deploy code and V19 via normal backend restart; configure/confirm mailbox delivery | FIXED — VERIFIED |
| HIGH-01 | HIGH: customer/staff email enumeration | Removed email-check handlers/calls; same HTTP 200 message for both outcomes; five requests/IP/15 minutes; asynchronous SMTP | SecurityPhaseOneIntegrationTest; secure customer/staff reset integration tests; frontend test:security | PASS: identical status/body/structure; absent users receive no email; sixth IP request returns 429 | Shared limiter if deploying multiple instances; controlled SMTP mailbox test | FIXED — VERIFIED |
| HIGH-02 | HIGH: HTML/SVG upload stored XSS | Trusted image decoding, bounded dimensions/pixels/bytes, allowlisted single extension matching detected format, re-encoded pixels, UUID names, inert resource allowlist/CSP/nosniff | MediaStorageServiceTest; uploadEndpointInspectsBytesAndServesOnlyInertImages | PASS: JPG/PNG/WebP; spoofed HTML/SVG/random, dangerous/double extensions, traversal, oversize/dimension bombs; appended script discarded; normal upload/GET works | Deploy resource handler/header changes; WebP now returns sanitized PNG | FIXED — VERIFIED |
| HIGH-03 | HIGH: exposed database credential | Removed source/document copies; required DB_* configuration; shell-free MySQL invocation with private child environment; placeholder-only example and rotation SQL template | frontend test:security DB config cases; node --check QA scripts; repository-wide literal search; read-only MySQL connection | PASS for source cleanup/config checks; rotation/new-secret reconnect NOT PERFORMED | DBA ALTER USER for lankastay_app@localhost; replace ignored .env/deployment secret/backups; reconnect and restart using NEW secret | FIXED — REQUIRES MANUAL SECRET ROTATION |
| HIGH-04 | HIGH: non-manager global catalog mutation | Manager method authorization on all destination and attraction mutations; preserved GET discovery; authorization matrix corrected | globalCatalogMutationsRejectEveryNonManager; managerCanMutateGlobalDestinationAndAttractionCatalog | PASS: all seven operations deny hotel staff/receptionist/customer/anonymous; manager create/update/status/delete and public reads work | Deploy code | FIXED — VERIFIED |
| HIGH-05 | HIGH: cross-hotel discounts/mass assignment | Validated create/update/response DTOs; existing-row authorization and current DB staff assignment; null/missing hotel fails closed; immutable update ownership; public validation route and legacy alias | discountScopeAndMassAssignmentAreEnforced; managerAllowedAndReceptionistDeniedDiscountMutations; discountCreateUsesAssignedHotelAndRejectsInjectedOwnership; nonexistentHotelFailsClosedAndPublicValidationIsReachable | PASS: own hotel allowed; foreign hotel/null/stale assignment/missing hotel/injected ownership/receptionist denied; manager and public validation work | Deploy code | FIXED — VERIFIED |

## Manual operations and limits

- Rotate the exposed database credential with the reviewed template
  `scripts/qa/rotate_database_password.sql.example`; update the private environment,
  deployment secret store, and obsolete secret backups, then verify a NEW connection.
  Source deletion cannot revoke the old secret. Accessible Git history has no commits
  for the named QA scripts (currently untracked), but this does not establish that the
  secret was never shared or committed in another copy; rotate regardless.
- Restart/deploy the active backend with its Flyway V19 session-version migration.
  MySQL V19 was prepared, not applied to the user's running database during verification.
  The running old 8080 process cannot hot-load source edits.
- Configure SMTP and FRONTEND_URL; verify delivery with a controlled mailbox. Mocked
  EmailService delivery proves URL/token wiring, not an external provider's availability.
  Explicit dev mode uses only a private console link, never HTTP token exposure.
- The older `hotel-reservation-system/backend` is an incomplete alternate source copy,
  with a different migration lineage. Scoped fixes were mirrored, but its runtime has
  NOT passed verification. Restore that copy's existing missing domain types and run
  its suite before using it; do not run both migration lineages on one database.
- Small database/queue timing differences may remain; SMTP network delivery is asynchronous.
  Reset throttling is bounded per-process; use shared storage for multiple instances.
- No commit/push was made and no real secret was introduced. Existing user changes were preserved.

Exact changed files: [FILES_CHANGED.md](FILES_CHANGED.md).

## Addendum — 2026-09-18 final personal-repository verification

See [dated final evidence](../PRE_COMMIT_VERIFICATION_2026-09-18.md) and its exact
commit manifest. Completed backend/frontend and isolated MySQL migration results
are retained; the final demo-profile guard additionally passed four focused tests.
Active-backend reconnect and a database-backed GET passed. HIGH-03 is NOT VERIFIED:
the current private database credential still equals a historically exposed value.
Local bootstrap configuration also still matches its exposed historical value;
the read-only known-value account comparison found zero matching hashes.
Live V19 and external SMTP delivery remain unverified deployment actions.
No older-copy repair, commit, push, branch handoff or live credential rotation ran.
Earlier descriptions of copy mirroring are historical, not actions of this continuation.
