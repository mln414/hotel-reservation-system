# LankaStay Unit Testing Gap Closure Report

Date: 2026-09-09  
Branch: `main`  
Starting commit: `2939c8186c7a231704070fa144e402601cb104a8`

## Evidence and limitation

`UNIT_TESTING_AUDIT.md`, requirements documents, and implementation reports were searched by filename throughout the workspace (including hidden files) but were not present. This work therefore used the supplied audit summary, current source, database migration/entity contracts, current tests, and `docs/AUTHENTICATION.md`. No missing report content was inferred.

The working tree already contained extensive modified and untracked files. All were treated as user-owned; no reset, clean, commit, push, schema change, or destructive database operation was performed.

## Current gap matrix

| Finding | Module | Source / tests | Current status before work | Classification | Business rule and minimal change | Risk / priority |
|---|---|---|---|---|---|---|
| DEFECT-OFFER-01 | Offers | `offers.js`, `customerOffers.js`, `offerEligibility.js`; offer scripts; `ManagementOfferService` | Seed offers omitted `applicableDays`; raw malformed day data could pass parts of eligibility; visibility regression failed | CONFIRMED DEFECT | The existing entity, migration, create service, and management form establish omitted create input as an all-days default. Seed records now state all days explicitly; raw public data fails closed; backend normalizes valid day codes and rejects invalid/duplicate codes | Medium / High |
| DEFECT-AUTH-01 | Customer auth | `authValidation.js`; `authValidation.test.mjs` | Email, phone, and password helpers threw for null or non-string inputs | CONFIRMED DEFECT | Non-string values are handled safely while preserving boolean and structured-object return shapes | Medium / High |
| DEFECT-AUTH-02 | Customer auth | `PasswordPolicy`; customer registration/reset/change/login DTOs; backend unit tests | Shared/staff policy allowed 128, but registration and reset DTOs allowed only 100; customer change/login lacked upper bounds | CONFIRMED DEFECT | Shared constants define the existing approved 8–128 boundary and customer DTOs consistently enforce it without weakening complexity rules | High / High |
| DEFECT-AUTH-03 | Profile | `Profile.jsx`, `authValidation.js`; auth validation tests | Profile duplicated email, phone, and password regex rules | TESTABILITY ISSUE / CONFIRMED DUPLICATION | Profile delegates to centralized pure validators while retaining its existing messages and form behavior | Medium / Medium |
| UT-BACKEND-01 | Auth and offers | New `CustomerAuthenticationServiceUnitTest`, `ManagementOfferServiceUnitTest`, `PasswordPolicyTest`, `AuthRequestValidationTest` | Affected critical services/policies had no isolated tests | MISSING UNIT TEST | Added constructor-isolated Mockito service tests and plain JUnit/Bean Validation boundary tests; no Spring context is loaded | Medium / High |
| SEC-LOG-01 | Customer auth | Customer auth DTOs; `SensitiveDtoLoggingTest` | Customer record `toString()` output exposed supplied passwords/reset tokens in debug logs | CONFIRMED DEFECT | Applied the repository's existing redaction pattern and added regression assertions | High / High |
| AUDIT-DOC-01 | Documentation | Workspace-wide filename search | Full historical audit unavailable | NOT REPRODUCIBLE AS DOCUMENT EVIDENCE | Limitation documented; supplied summary used only where confirmed by current code | Low / Medium |
| OTHER-SERVICE-UNIT-GAPS | Other functional modules | Remaining service classes and Spring integration tests | Scope and exact audit findings unavailable | OUT OF SCOPE FOR UNVERIFIED BLIND CHANGES | No speculative rewrites/tests were added outside the confirmed offer/auth work | Unknown / Deferred |

## Implemented tests

- Frontend isolated validation tests cover valid/invalid, empty, whitespace, null, undefined, number, object and array inputs; email/phone malformed and boundary values; password minimum/maximum and complexity boundaries; profile messages; and password-change validation.
- Offer tests cover valid, missing, empty, invalid, duplicate, all-day and restricted-day configurations; active/inactive status; valid/invalid date ranges; eligible/ineligible/no-offer paths; public visibility; discount calculations; and malformed data.
- Backend isolated tests cover password policy boundaries/complexity, registration/reset/change DTO consistency, registration orchestration and duplicate handling with Mockito, offer day defaults/normalization/rejection with Mockito, and secret redaction.

## Verification

- 16 configured frontend test scripts excluding the separate broad `test:runtime` route launcher: passed.
- `test:offer-visibility`: passed. It remains classified as an SSR/targeted regression check, not unit coverage. Because public hotels load through a client effect that SSR does not execute, the script now separates page-render smoke assertions from direct canonical visibility verification.
- Frontend production build: passed (existing large-chunk warning only).
- Frontend lint: passed.
- New/affected backend focused suite: 12 tests passed, 0 failed (11 new tests plus the extended secret-redaction test).
- Safe H2 regression run of currently compiled backend classes: 34 tests passed, 0 failed.

## Tooling note

The only installed JDK is 26.0.1 while Maven compiles with Java release 17. On Windows, JDK 26 throws `java.nio.file.AccessDeniedException` from ZipFS while closing test dependency JARs after emitting the class files. This interrupts the normal `test-compile` lifecycle and left only 6 of 20 top-level test classes compiled for the broad run. Surefire was invoked directly against the emitted classes, producing the passing results above. A complete historical backend-suite count cannot be claimed from this environment; use a supported JDK 17 or 21 and run `mvnw.cmd test` to remove this tooling limitation.

## Security and maintainability review

- Malformed offer configuration fails closed on public surfaces.
- Backend day input is normalized and allow-listed; no test-only exception was added.
- Password complexity remains uppercase, lowercase, number, special character, and 8–128 characters.
- Passwords and reset tokens are redacted from customer DTO string representations.
- Validation logic is centralized in small pure functions and shared policy constants.
- No dependency upgrade, migration, feature addition, commit, or push was performed.

## Addendum — 2026-09-18 subsequent pre-commit verification

The sentence above describes the historical gap-closure run, not subsequent work.
[Dated final evidence](PRE_COMMIT_VERIFICATION_2026-09-18.md) records the later
successful backend compile/full tests/package (199 tests), two real-MySQL migration
tests, all 18 frontend npm test scripts, additional media test and production build.
After the final demo-profile guard, current sources compiled and four focused
SeedDataInitializerTest tests passed; the full suite/package were not rerun afterward.
No frontend or migration rerun was performed in this continuation. Read-only active
backend reconnect and database-backed GET passed. Those successes do not certify
credential rotation, external mail delivery, or live V19 deployment. No commit/push ran.
