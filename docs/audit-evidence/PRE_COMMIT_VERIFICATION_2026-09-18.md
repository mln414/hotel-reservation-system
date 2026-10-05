# Final personal-repository verification — 2026-09-18

## Verdict and scope

SAFE TO COMMIT: NO. HIGH-03 rotation verification: NOT VERIFIED.

This addendum supersedes earlier readiness statements, not historical test results.
Only the active root `backend/` and `frontend/` are in scope. The inactive nested
backend and group remote were not changed in this resumed verification. No commit,
push, branch switch, history rewrite, live credential change, or live migration ran.

## Credential verification

| Check | Result | Evidence / limitation |
|---|---|---|
| Environment-based database credential | PASS | Active application.properties uses `${DB_PASSWORD}`; effective user is lankastay_app and database is lankastay_db. |
| Private .env ignored | PASS | git check-ignore confirms exclusion. |
| .env.example password placeholders | PASS | Database, mail and bootstrap password fields contain replacement placeholders. |
| Direct MySQL authentication | PASS | Existing successful JDBC/MySQL verification used the private environment credential. |
| SELECT DATABASE() | PASS | Existing verification selected lankastay_db. |
| SELECT 1 | PASS | Existing verification returned 1. |
| Spring Boot database connection | PASS | Temporary active-backend package started with Hikari connected. |
| Database-backed endpoint | PASS | GET /api/destinations on temporary port 65387 returned HTTP 200 and JSON. |
| Genuinely unpublished rotated credential | FAIL | Current effective DB_PASSWORD still equals a historical exposed credential. |

The historical comparison was performed in memory against Git blob
`11efd5bb38a1f1983b05b2d76189b69adbf6d471`, formerly the customer-auth E2E helper.
Only the equality result was reported, never the database password. Current local
INITIAL_MANAGER_PASSWORD also equals its historical exposed template value in
blob `4f6e6dcac220b9449cff8d36f57ca0a396949b19`.

A prior read-only BCrypt comparison found zero staff and zero customer hashes
matching that known bootstrap credential. This is evidence for that one value,
not proof of every historical account credential having been rotated.

Authentication succeeds, but possession of a published password remains sufficient
at the database authentication boundary when network/account access permits it.
Removing a password from current source does not invalidate a still-working value.
Rotate lankastay_app privately to a new never-published value, update ignored .env
and deployment secret storage, replace/remove the exposed bootstrap configuration,
then repeat fresh-connection and history-comparison verification. No live account
password was automatically changed.

The temporary Spring Boot reconnect used a read-only MySQL session, disabled Flyway
and Hibernate schema writes, blank bootstrap overrides, and disabled demo seeding.
No listed database authentication/connection startup error was observed. The
database-backed endpoint was checked during this resumed run. Temporary Java PID
23316 was identity-checked and stopped; the original backend processes were not stopped.
This proves reconnect/read access, not a normal V19 deployment or production writes.

## Completed verification retained, not rerun

- Backend compile, full tests and package passed previously: 199 tests, no failures,
  errors or skips. These results preceded the final development-profile demo guard.
- The final guard recompiled current sources and passed four focused
  SeedDataInitializerTest tests on 2026-09-18 at 08:17 +05:30. Default startup,
  flag-only startup and mixed dev/prod startup cannot enable the completed demo
  reservation; explicit dev plus opt-in preserves its idempotent capability.
- The full suite and package were not rerun after that guard. The temporary
  reconnect used the previously built package, with demo disabled explicitly.
- Real MySQL migration verification already passed two tests: fresh isolated
  MySQL 8.0.46 runs B18 then V19, repeated migrate executes zero migrations;
  existing live V18 validates read-only while allowing pending migrations.
- All 18 frontend npm test scripts, the additional reservation-media test, and
  production build already passed. The build's chunk-size warning is nonfatal.
- Backend/frontend workflow YAML syntax and root structure passed local parsing;
  the migration harness had no PowerShell parse errors. GitHub-hosted CI has not run.

## Review of the 17 blocker-resolution files

| File | Review outcome |
|---|---|
| .github/workflows/backend-ci.yml | Java 17 matches pom.xml; bash wrapper invocation avoids executable-bit dependence; clean test is the actual CI command, not package. |
| .github/workflows/frontend-ci.yml | Node 24 accommodates locked engines; npm ci, security/auth-validation tests and production build match package.json. |
| .gitignore | Environment/build/cache/runtime exclusions preserved; cookie exclusion added; lint config and exactly three upload .gitkeep files are eligible. |
| start-backend.ps1 | Removed forced completed-demo seeding; ordinary launcher preserved. |
| backend/src/main/resources/application.properties | DB password remains environment-only; demo flag defaults false; bootstrap has empty, not secret, fallback. Existing Hibernate update and Flyway baseline-on-migrate settings remain unchanged. |
| .env.example | Secret fields are placeholders; dev-profile plus explicit demo opt-in documented. |
| CONTRIBUTING.md | Maintained personal main/origin-main strategy documented; group repository explicitly separate. Instructions describe the future steady state, not a completed handoff. |
| README.md | Fresh B18 versus immutable existing migrations and demo restrictions documented. Minor existing CI tree caption says test/package although workflow only runs test; treat as documentation cleanup, not a package-verification claim. |
| SECURITY.md | Supported versions explicitly do not certify deployment, SMTP delivery or rotation. |
| backend/src/main/resources/db/migration/B18__fresh_install_schema.sql | 28 schema tables; no INSERT/DROP/account SQL, Flyway history or table AUTO_INCREMENT counters; no passwords or business rows. Reflects verified V18 schema, including prior Hibernate-managed fields. |
| backend/src/test/java/com/lankastay/backend/SeedDataInitializerTest.java | Four passing focused tests cover default/flag-only/dev/mixed-prod gating and existing-demo idempotence. |
| backend/src/test/java/com/lankastay/backend/MySqlMigrationIT.java | Explicit environment opt-in; non-live-port empty sandbox guard; clean disabled; existing database only validate/info; fresh migrate and restart assertions passed. |
| scripts/qa/verify_mysql_migrations.ps1 | Separate loopback MySQL process under ignored target; secrets through process environment/stdin, not CLI args; own process cleanup; live credentials only used for validation. Ignored diagnostic files retained. |
| docs/database/SCHEMA.md | Actual historical scripts, baseline semantics and live-V19-pending limits documented; no production-data or complete fresh demo-inventory guarantee. |
| scripts/qa/ValidateWorkflows.java | Safe YAML constructor; syntax/root-structure validation only; no GitHub execution claim. |
| scripts/qa/CheckBootstrapExposure.java | Read-only account-hash comparison; prints counts only; checks a specified known credential, not all historical exposures. |
| backend/src/main/java/com/lankastay/backend/config/SeedDataInitializer.java | Completed-demo gate requires flag AND dev AND NOT prod/production; catalog initializer remains unchanged; current sources compiled during focused test. |

No unrelated application edits were made during this resumed verification. The
dated addenda and exact commit manifest are additional evidence files, not part
of the original 17-file blocker-resolution set. Public templates were inspected;
their commands are illustrative. The PR template's ./mvnw test spelling should
use bash ./mvnw test on Linux if the wrapper is not executable.

## Migration decision

Preserve the verified personal V4 hotel-contact/V5 reservation-core lineage and
all applied V4–V18 checksums. The staged alternate V4 destination/V5 room-rate
deletions are intentional for this verified lineage; B18 enables fresh schema
creation and V19 follows it. Do not repair or rewrite applied migration history.
Any database that used those alternate deleted scripts needs a separate migration
review. Live V19 is still pending; its deployment must be approved separately.

## Branch handoff, proposed only

Current branch is java-only; its mln/java-only upstream is gone. Origin points to
LakshanHMK/hotel-reservation-system; mln points to the separate group repository.
Existing main is the maintained personal full-stack branch, tracking origin/main.
Cached main is ahead of origin/main by 10 commits. Remote freshness is not certified.

After explicit approval, privately back up the dirty work, fetch origin only and
recheck topology. Use a separate approved worktree for existing main instead of
switching this dirty checkout. If main remains an ancestor of java-only, fast-forward
main to java-only without rewriting history; if origin/main has diverged, stop and
review the integration before continuing. Transfer only the manifest's allowlisted
changes, including approved deletions, and keep main tracking origin/main. Never
copy ignored secrets, runtime data or nested repositories into the handoff.
Inspect staged content and secret checks before separately authorizing commits.
Any future push must target origin/main only and requires separate approval.

## Future commit groups and exclusions

See [exact commit manifest](PRE_COMMIT_COMMIT_MANIFEST_2026-09-18.md) for every
addition/modification/deletion in each proposed group. The sequence is:

1. Atomic active full-stack application/security/migration/QA/config changes.
2. Documentation organization, policies and dated verification evidence.
3. CI workflows, collaboration templates and local workflow validator.

Keep .env/.env.*, QA environment secrets, target/.m2/Maven caches, node_modules,
dist, runtime uploads except the three .gitkeep files, logs, cookies, scratch/temp
files, browser profiles and inactive/tool repositories excluded. The manifest is
an allowlist, not authorization to run git add, commit, push or branch operations.

Final hygiene review found zero pending text files containing the current database
password and zero generated/secret/browser-profile artifact candidates. Profile
and StaffProfile frontend pages are legitimate application source, not browser
profiles. All 517 pending paths are in the exact manifest, including 427 frontend
source/asset/config paths and its .oxlintrc.json. Architecture documentation paths
exist. Only the two alternate migration deletions remain staged; no new staging ran.
git diff --cached --check passed. git diff --check reports four README trailing
space lines used as Markdown hard breaks; no automatic whitespace rewrite was made.
Cached main is an ancestor of java-only; origin freshness must still be checked
during an approved handoff.

## Manual actions and remaining limits

- Blocking: rotate the exposed current database credential to an unpublished
  secret; update private local/deployment configuration and verify again.
- Blocking security configuration: remove or replace the exposed local bootstrap
  password. Recheck accounts if bootstrap/account state changes.
- Before deployment: apply live V19 through an approved restart/deployment, after
  backup and migration review; current evidence only validates live V18.
- Before relying on production password-reset email: configure SMTP/FRONTEND_URL
  and verify delivery with a controlled mailbox. No external delivery was verified.
- Manual documentation cleanup: README CI caption and Linux PR-template wrapper
  spelling noted above. They were not changed in this evidence-only continuation.
- Approve and execute branch handoff only after blockers are addressed; do not
  change the group remote or rewrite history to remove old credentials in this task.

The security-fix verification method was used to distinguish source cleanup and
successful authentication from actual closure of the published-credential boundary.

## Follow-up — remaining-blocker resolution, 2026-09-18

This section supersedes the bootstrap and minor-documentation blocker statements
above. SAFE TO COMMIT remains NO solely because database rotation is still pending.

- README now accurately labels backend CI as Maven clean test (Java 17).
- The PR template now specifies backend/ as the working directory, bash ./mvnw
  test on macOS/Linux and .\mvnw.cmd test on Windows.
- Exposed local INITIAL_MANAGER_PASSWORD was blanked in ignored .env. Bootstrap
  remains environment-based with empty fallback; no real replacement secret was
  placed in source or templates. Blank password disables initial-manager creation.
  No existing account password was changed.
- A fresh read-only BCrypt comparison found zero staff and zero customer accounts
  matching the known exposed historical bootstrap value. No account identity,
  hash or credential value was printed. This does not certify every historical
  account credential; manually rotate an account if other exposed values are found.
- .env remains ignored and .env.example password fields remain placeholders.
- Both unchanged CI workflows passed local YAML syntax/structure parsing again.
  No GitHub-hosted run is claimed.
- Pending text contains neither the known old database password nor the currently
  configured database password. Because rotation has not occurred, there is no
  genuinely new database credential to check yet.
- Application/frontend sources and dependency manifests were not changed during
  this follow-up. Prior successful backend/frontend results and the final four-test
  guard result remain applicable within their previously documented limits.

The private database password still matches the known historical exposed value.
Await the owner's manual MySQL rotation and private .env update; never receive the
password through chat. Do not report HIGH-03 verified based on old-password access.
After rotation, compare the new value against exposed history, establish a fresh
read-only connection, run SELECT DATABASE() and SELECT 1, and reconnect the active
backend plus GET /api/destinations. Those post-rotation checks are still pending.

The existing 517-path manifest and three commit groups remain unchanged: only
existing allowlisted documentation paths and ignored .env were edited. Existing
staged migration deletions were preserved. No commit, push, branch switch, live
password rotation, migration, group-remote operation or history rewrite occurred.
V19 approval and SMTP verification remain deployment-only tasks, not additional
pre-commit blockers. The proposed personal main/origin-main handoff is unchanged.
