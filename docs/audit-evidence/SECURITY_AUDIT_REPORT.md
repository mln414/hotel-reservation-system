# LankaStay Hotels & Resorts
# Comprehensive Application Security Assessment

> Phase 1 update (2026-09-17): current statuses below are verified for the active backend/frontend.
> Historical vulnerability evidence describes the pre-remediation snapshot.
> HIGH-03 still requires manual credential rotation; the older incomplete backend copy is unverified.
> Full commands, proof limits, runtime results, and exact files: [Phase 1 evidence](phase1/VERIFICATION.md).

---

## 1. Executive Summary

A comprehensive, authorized, evidence-based security audit of the LankaStay Hotels & Resorts web platform (SE2030 Software Engineering university project) was conducted. The application is a multi-property hotel reservation and management platform comprising a React (Vite) single-page frontend, a Java 17+ / Spring Boot 4.1.0 (with 3.4+ patterns) backend, and a MySQL 8+ database managed via Flyway migrations.

The assessment evaluated the complete request pipeline across browser clients, routing guards, Spring Security filters, controllers, service orchestration, persistence layers, and database constraints. The evaluation incorporated the mandatory checklist from the course security syllabus, OWASP Top 10:2025, OWASP API Security Top 10 (2023), OWASP ASVS 5.0.0, and the OWASP Web Security Testing Guide (WSTG).

### Key Assessment Outcome
The application demonstrates several enterprise-grade architectural strengths:
- Authoritative server-side price calculation and promotion validation that ignores client-tampered totals.
- Pessimistic write locking (`@Lock(LockModeType.PESSIMISTIC_WRITE)`) on room types to prevent double-booking race conditions during concurrent reservation creation.
- Strict object-level ownership checks (`findByIdAndCustomerId`) preventing horizontal IDOR attacks on customer reservations.
- Universal prepared statement / parameterized query usage across all JPA repositories and `JdbcTemplate` operations.
- Strong password hashing using BCrypt (strength 12) with cryptographically secure temporary password generation (`SecureRandom`).
- Double-Submit Cookie CSRF protection active on all mutating endpoints.

However, the assessment identified **1 Critical vulnerability**, **5 High-severity vulnerabilities**, and **6 Medium-severity vulnerabilities** that require remediation prior to any public deployment. Most notably:
1. **Critical Account Takeover via Unauthenticated Tokenless Password Reset:** `POST /api/v1/customer/auth/forgot-password/change-password` and `POST /api/v1/auth/forgot-password/change-password` permit any anonymous user who knows an email address to immediately overwrite that customer's or staff member's password without supplying any token, code, or proof of identity.
2. **User & Staff Enumeration:** Dedicated endpoints explicitly confirm the existence of email addresses in the system.
3. **Arbitrary File Upload (Stored XSS Risk):** The media upload endpoint relies solely on client-supplied `Content-Type` headers and unallowlisted file extensions, serving uploaded content directly on the application origin without Content-Security-Policy or magic byte verification.
4. **Hardcoded Database Credentials:** Active MySQL database passwords were committed in plain text in QA testing scripts.
5. **Broken Function Level Authorization (BFLA):** Receptionists and hotel staff can create, modify, and delete system-wide destinations and attractions due to missing `@PreAuthorize` guards on `ManagementDestinationController` and `AttractionController`.

---

## 2. Scope

The scope of this audit encompasses the source code, build manifests, schema migrations, configuration files, and local development runtime of the repository located at:
`c:\Users\MSI CYBORG\OneDrive - Sri Lanka Institute of Information Technology\Desktop\MAIN COPY SE`

### Components Audited:
- **Backend Architecture:** Spring Boot Java application under `backend/`
  - Spring Security configuration (`SecurityConfig.java`, `AccountStateFilter.java`)
  - 25 REST Controllers (`backend/src/main/java/com/lankastay/backend/controller/`)
  - 23 Business Services (`backend/src/main/java/com/lankastay/backend/service/`)
  - 18 JPA Repositories (`backend/src/main/java/com/lankastay/backend/repository/`)
  - 28 JPA Entities (`backend/src/main/java/com/lankastay/backend/entity/`)
  - Flyway Migrations `V1` through `V18` (`backend/src/main/resources/db/migration/`)
- **Frontend Architecture:** React (Vite) single-page application under `frontend/`
  - Routes, route guards, and contexts (`frontend/src/routes/`, `frontend/src/context/`)
  - Authentication and reservation API clients (`frontend/src/services/`)
  - Page views (Customer portal, Staff management, Booking workflow, Reviews, Profiles)
- **Deployment & Operational Files:**
  - Environment templates (`.env.example`, `.env`), launch scripts (`start-backend.ps1`, `start-frontend.ps1`), QA scripts (`scripts/qa/`), and dependency manifests (`pom.xml`, `package.json`).

---

## 3. Authorization and Testing Safety

This audit was conducted under the user's explicit authorization as the academic project owner. In accordance with non-destructive testing constraints:
- All active inspection was restricted strictly to `localhost:8080` (backend) and `localhost:5174` (frontend).
- No network requests were directed to external services, map providers, email services, or third-party infrastructure.
- All dynamic verifications performed against local endpoints used read-only or harmless diagnostic payloads.
- No live production databases or third-party APIs were accessed.
- Real secrets and passwords observed during the audit are redacted throughout this report.

---

## 4. Assessment Date

- **Audit Completion Date:** September 17, 2026
- **Context Timezone:** UTC+05:30

---

## 5. Repository / Commit Reviewed

- **Git Branch:** `java-only`
- **Latest Commit Analyzed:** `ab50a78 Merge pull request #5 from mln414/java-only`
- **Target Repository Corpus:** `LakshanHMK/hotel-reservation-system`

---

## 6. Application Architecture

```
+-----------------------------------------------------------------------------------+
|                                 CLIENT TIER                                       |
|  React 19.2.8 (Vite 8.2.0) Single-Page Application (Port 5174)                    |
|  - React Router v7/v8 (react-router 8.3.0) Route Guards                           |
|  - Vanilla CSS Luxury Design System, Lucide Icons, Leaflet / React-Leaflet        |
|  - In-Memory Contexts (CustomerContext, StaffContext, ReservationsContext)        |
+-----------------------------------------------------------------------------------+
                                         |
                                HTTP / JSON (CORS)
                       Cookie: LANKASTAY_SESSION (HttpOnly, SameSite=Lax)
                       Header: X-XSRF-TOKEN
                                         v
+-----------------------------------------------------------------------------------+
|                              SPRING BOOT BACKEND (Port 8080)                      |
|  Java 17+ (Compiled JDK 17, Running on OpenJDK 26.0.1) / Spring Boot 4.1.0        |
|                                                                                   |
|  [Security Filter Chain]                                                          |
|  - CsrfFilter (CookieCsrfTokenRepository.withHttpOnlyFalse)                       |
|  - CorsFilter (Configured Allowed Origins)                                        |
|  - SecurityContextPersistenceFilter (HttpSessionSecurityContextRepository)        |
|  - AccountStateFilter (Enforces active staff status and mandatory initial pwd)   |
|                                                                                   |
|  [Controller Layer]                                                               |
|  - Public Discovery: CustomerHotelController, CustomerDestinationController       |
|  - Customer Auth & Profile: CustomerAuthenticationController, CustomerProfileCtrl  |
|  - Customer Reservations & Reviews: CustomerReservationCtrl, CustomerReviewCtrl  |
|  - Staff Auth & Admin: AuthenticationController, StaffAdministrationController    |
|  - Management Operations: ManagementHotelCtrl, ManagementRoomCtrl, etc.           |
|                                                                                   |
|  [Service & Business Logic Tier]                                                  |
|  - CustomerReservationService: Pessimistic Locking, Server-authoritative Pricing   |
|  - ReviewService: Verified Stay Eligibility, 1-Review Constraint Enforcement     |
|  - PasswordResetService: Token-based SHA-256 Reset Flow                           |
|  - MediaStorageService: Local Disk File Storage (uploads/)                         |
|                                                                                   |
|  [Persistence Tier]                                                               |
|  - Spring Data JPA + Hibernate ORM (ddl-auto=update)                              |
|  - Spring JdbcTemplate (Cascading Deletions and Seed Initializer)                 |
+-----------------------------------------------------------------------------------+
                                         |
                                 JDBC / TCP (3306)
                                         v
+-----------------------------------------------------------------------------------+
|                              DATABASE TIER                                        |
|  MySQL 8+ Database: lankastay_db                                                  |
|  Flyway Schema Migrations: V1__ through V18__                                     |
+-----------------------------------------------------------------------------------+
```

---

## 7. Trust Boundaries and Data Flow

### Trust Boundaries:
1. **TB-1: Browser Client to Backend API:** Untrusted network boundary. Client input (form fields, query params, headers, uploaded multipart files) cannot be trusted. Client-side authentication flags in React state (`customer.isLoggedIn`, `user.role`) are purely cosmetic UX conveniences.
2. **TB-2: Anonymous Public vs Customer Authenticated:** Separated by HTTP session attribute `LANKASTAY_CUSTOMER_USER`. Spring Security authorizes `/api/v1/customer/**` as `permitAll()`, deferring session authentication to `CustomerSessionService.requireCustomer()`.
3. **TB-3: Customer vs Staff / Management:** Separated by Spring Security `SecurityContext`. Staff credentials populate `StaffPrincipal` into the Spring Security session with roles `ROLE_MANAGER`, `ROLE_HOTEL_STAFF`, `ROLE_RECEPTIONIST`. Customers must have zero access to `/api/management/**` or `/api/v1/admin/**`.
4. **TB-4: Hotel Property Scoping (Multi-Property Isolation):** Staff assigned to Hotel A (`assignedHotelId`) must be strictly prohibited from modifying rooms, rates, reservations, or inventory of Hotel B. Managers possess multi-property oversight.
5. **TB-5: File System Boundary:** The local file storage directory `uploads/` maps to the web root via Spring MVC resource handlers. Uploaded content must not execute server-side code or execute client-side scripts in the application origin.
6. **TB-6: Application to Database:** Protected via parameterized queries; isolated credentials required between deployment DDL and application runtime DML.

---

## 8. Methodology

The assessment adhered to an architecture-first code auditing methodology:
1. **Repository Topology & Discovery:** Analyzed directory structures, configuration files (`application.properties`, `.env.example`, `vite.config.js`), dependencies (`pom.xml`, `package.json`), and previous QA evidence.
2. **Control Flow Tracing:** Followed data paths end-to-end from browser interaction through controllers, validation annotations, service layers, entity mappings, and database queries.
3. **Mandatory Concept Verification:** Audited every item from the course security syllabus (Server State/Memory, Session Hijacking, File Uploads, SQL Injection, IDOR, Concurrency/Race Conditions, Least Privilege).
4. **Safe Local Dynamic Verification:** Tested live endpoints on `localhost` via non-destructive HTTP requests to verify CSRF enforcement, authentication responses, header emissions, and unauthenticated behavior.
5. **Standard Baseline Mapping:** Evaluated and mapped all findings to OWASP Top 10:2025, OWASP API Security Top 10:2023, and OWASP ASVS 5.0.0.

---

## 9. Standards and References

- **OWASP Top 10:2025**
- **OWASP API Security Top 10 (2023)**
- **OWASP Application Security Verification Standard (ASVS) v5.0.0**
- **OWASP Web Security Testing Guide (WSTG v4.2 / v5.0 Dev)**
- **NIST SP 800-63B:** Digital Identity Guidelines (Authentication and Lifecycle Management)
- **CISA Secure by Design Principles**
- **Spring Security 6.x / 7.x Official Reference Architecture**

---

## 10. Security Controls Already Implemented

| Control Name | Implementation Details | Evidence |
|---|---|---|
| **Pessimistic Locking on Room Inventory** | Room entities are queried with `@Lock(LockModeType.PESSIMISTIC_WRITE)` (`SELECT ... FOR UPDATE`) inside a `READ_COMMITTED` transaction prior to availability assertion, closing the TOCTOU check-then-book race condition. | [RoomRepository.java](file:///backend/src/main/java/com/lankastay/backend/repository/RoomRepository.java#L20-L22), [CustomerReservationService.java](file:///backend/src/main/java/com/lankastay/backend/service/CustomerReservationService.java#L68-L75) |
| **Server-Authoritative Pricing & Offers** | The backend computes subtotal, nightly averages, and promotion discounts directly from authoritative database rates and offer rules. Client-supplied price totals are completely ignored. | [CustomerReservationService.java](file:///backend/src/main/java/com/lankastay/backend/service/CustomerReservationService.java#L78-L101) |
| **Horizontal Ownership Enforcement (IDOR Protection)** | Customer reservation lookups, cancellations, and deletions strictly filter by `id` and authenticated `customerId` (`findByIdAndCustomerId`). | [CustomerReservationService.java](file:///backend/src/main/java/com/lankastay/backend/service/CustomerReservationService.java#L154-L173) |
| **Review Verified Stay & Uniqueness Constraints** | Customers can only review reservations belonging to their own customer ID that have reached `COMPLETED` stay status. Database constraint `uk_reviews_reservation` strictly enforces one review per reservation. | [ReviewService.java](file:///backend/src/main/java/com/lankastay/backend/service/ReviewService.java#L56-L72), [V8__review_management.sql](file:///backend/src/main/resources/db/migration/V8__review_management.sql#L34) |
| **Double-Submit Cookie CSRF Protection** | `CookieCsrfTokenRepository.withHttpOnlyFalse()` is active on all non-safe HTTP methods. React clients obtain tokens via `GET /api/v1/auth/csrf` and transmit `X-XSRF-TOKEN`. | [SecurityConfig.java](file:///backend/src/main/java/com/lankastay/backend/config/SecurityConfig.java#L57-L61), [authApi.js](file:///frontend/src/services/authApi.js#L43-L46) |
| **Robust Password Hashing & Policy** | Passwords are encrypted using BCrypt with work factor 12. Password policy enforces 8–128 characters, uppercase, lowercase, digit, and special character. | [SecurityConfig.java](file:///backend/src/main/java/com/lankastay/backend/config/SecurityConfig.java#L37), [PasswordPolicy.java](file:///backend/src/main/java/com/lankastay/backend/service/PasswordPolicy.java#L8-L28) |
| **HttpOnly Session Cookies & Session Fixation Protection** | `server.servlet.session.cookie.http-only=true` prevents JavaScript cookie theft. Both staff and customer logins explicitly invoke `changeSessionId()`. | [application.properties](file:///backend/src/main/resources/application.properties#L24), [CustomerAuthenticationController.java](file:///backend/src/main/java/com/lankastay/backend/controller/CustomerAuthenticationController.java#L47), [AuthenticationController.java](file:///backend/src/main/java/com/lankastay/backend/controller/AuthenticationController.java#L50) |
| **Zero Raw SQL String Concatenation** | Every JPA repository query uses parameterized JPQL/SQL (`:param` or `?`). `JdbcTemplate` calls in `HotelService` and `SeedDataInitializer` use parameterized arguments. | [All Repository Interfaces](file:///backend/src/main/java/com/lankastay/backend/repository/), [HotelService.java](file:///backend/src/main/java/com/lankastay/backend/service/HotelService.java#L305-L326) |
| **Sanitized Exception Handling** | `GlobalExceptionHandler` intercepts exceptions and returns sanitized JSON error payloads, preventing database dialect details or stack traces from reaching clients. | [GlobalExceptionHandler.java](file:///backend/src/main/java/com/lankastay/backend/exception/GlobalExceptionHandler.java#L23-L148) |
| **Staff Lifecycle Gate (`AccountStateFilter`)** | Intercepts requests to verify the staff account remains `ACTIVE` in the database; immediately invalidates sessions if disabled, and enforces forced password change prior to accessing dashboard resources. | [AccountStateFilter.java](file:///backend/src/main/java/com/lankastay/backend/security/AccountStateFilter.java#L23-L44) |
| **Cryptographically Secure Random Tokens** | Staff temporary passwords and password reset tokens utilize `java.security.SecureRandom`. Reset tokens are SHA-256 hashed before database persistence. | [TemporaryPasswordGenerator.java](file:///backend/src/main/java/com/lankastay/backend/service/TemporaryPasswordGenerator.java#L14), [PasswordResetService.java](file:///backend/src/main/java/com/lankastay/backend/service/PasswordResetService.java#L74-L78) |

---

## 11. Executive Risk Overview

| ID | Finding Title | Severity | Confidence | Component | Status |
|---|---|---|---|---|---|
| **CRIT-01** | Unauthenticated Tokenless Password Reset Permitting Complete Account Takeover | CRITICAL | CERTAIN | `CustomerAuthService`, `AuthService`, `SecurityConfig` | FIXED — VERIFIED |
| **HIGH-01** | User and Staff Account Enumeration via Dedicated Public Endpoints | HIGH | CERTAIN | `CustomerAuthController`, `AuthenticationController` | FIXED — VERIFIED |
| **HIGH-02** | Arbitrary File Upload Allowing HTML/SVG Stored XSS & Extension Bypass | HIGH | CERTAIN | `MediaStorageService`, `WebConfig`, `SecurityConfig` | FIXED — VERIFIED |
| **HIGH-03** | Plaintext Database Password Committed in QA Automation Scripts | HIGH | CERTAIN | `scripts/qa/*.js` | FIXED — REQUIRES MANUAL SECRET ROTATION |
| **HIGH-04** | Broken Function Level Authorization (BFLA) on Destination & Attraction CRUD | HIGH | CERTAIN | `ManagementDestinationController`, `AttractionController` | FIXED — VERIFIED |
| **HIGH-05** | Missing Cross-Hotel Scope Verification in Discount Management (IDOR/BOLA) | HIGH | CERTAIN | `DiscountController`, `DiscountService` | FIXED — VERIFIED |
| **MED-01** | Fail-Open Hotel Scope Authorization When Staff User Has No Assigned Hotel | MEDIUM | CERTAIN | `HotelService` | VULNERABLE |
| **MED-02** | Missing Content-Security-Policy (CSP) and HSTS Response Headers | MEDIUM | CERTAIN | `SecurityConfig` | VULNERABLE |
| **MED-03** | Static Mutable Map & Localhost-Bypassed Development Reset Endpoint | MEDIUM | CERTAIN | `PasswordResetService`, `PasswordResetController` | VULNERABLE |
| **MED-04** | Session Persistence Across Password Reset (Missing Invalidation of Active Sessions) | MEDIUM | CERTAIN | `PasswordResetService`, `CustomerAuthService` | VULNERABLE |
| **MED-05** | Account Lockout Denial-of-Service on Customer Accounts Without IP Throttling | MEDIUM | CERTAIN | `CustomerAuthenticationService` | VULNERABLE |
| **MED-06** | Unbounded In-Memory Map in `LoginRateLimiter` Causing Resource Exhaustion Risk | MEDIUM | CERTAIN | `LoginRateLimiter` | VULNERABLE |
| **MED-07** | Unrestricted Resource Consumption via Unpaginated Public Query Endpoints | MEDIUM | CERTAIN | `CustomerHotelController`, `PublicReviewController` | VULNERABLE |
| **LOW-01** | Dual Schema Management Conflict (Flyway Enabled Alongside `ddl-auto=update`) | LOW | CERTAIN | `application.properties`, `.env` | VULNERABLE |
| **LOW-02** | Missing `AbortController` on Asynchronous Frontend Quote Requests | LOW | CERTAIN | `frontend/src/pages/Booking/Booking.jsx` | VULNERABLE |
| **LOW-03** | Sensitive Customer Profile Photo Stored in Unencrypted Browser `localStorage` | LOW | CERTAIN | `frontend/src/pages/Profile/Profile.jsx` | VULNERABLE |
| **LOW-04** | Spoofable IP Resolution via Unvalidated `X-Forwarded-For` Header | LOW | CERTAIN | `CustomerReviewController`, `ManagementReviewController` | VULNERABLE |
| **INFO-01**| Missing CI/CD Pipeline, Automated SAST/SCA Workflows, and GitHub Push Protection | INFORMATIONAL | CERTAIN | GitHub Repository Root | VULNERABLE |
| **INFO-02**| High-Severity Advisory in Build-Time Transitive Dependency (`nanoid < 3.3.18`) | INFORMATIONAL | CERTAIN | `frontend/package.json` (`postcss` devDep) | MITIGATED |
| **INFO-03**| Direct JPA Entity Exposure in Public Room and Rate Endpoints | INFORMATIONAL | CERTAIN | `CustomerHotelController` | VULNERABLE |

---

## 12. Critical Findings

### Finding CRIT-01: Unauthenticated Tokenless Password Reset Permitting Complete Account Takeover

**Current Phase 1 status (active application): FIXED — VERIFIED.** See final verification section; original evidence below is historical.
- **Severity:** CRITICAL
- **Confidence:** CERTAIN
- **Affected Components:**
  - `backend/src/main/java/com/lankastay/backend/controller/CustomerAuthenticationController.java:63-70`
  - `backend/src/main/java/com/lankastay/backend/service/CustomerAuthenticationService.java:116-135`
  - `backend/src/main/java/com/lankastay/backend/controller/AuthenticationController.java:72-79`
  - `backend/src/main/java/com/lankastay/backend/service/AuthenticationService.java:169-188`
  - `backend/src/main/java/com/lankastay/backend/config/SecurityConfig.java:67, 69`
- **CWE:** CWE-306 (Missing Authentication for Critical Function), CWE-640 (Weak Password Recovery Mechanism for Forgotten Password)
- **OWASP Top 10:2025:** A07:2025 – Authentication Failures
- **OWASP API Security Top 10:** API2:2023 – Broken Authentication
- **ASVS 5.0:** V2.5.2, V2.5.6

#### Description:
The application exposes public REST endpoints that allow resetting any account password without proof of identity or authorization:
- `POST /api/v1/customer/auth/forgot-password/change-password`
- `POST /api/v1/auth/forgot-password/change-password`

Both endpoints are configured as `permitAll()` in `SecurityConfig.java`. In the service layer, `resetForgottenPassword` takes a `SimpleForgotPasswordRequest` containing only `email`, `newPassword`, and `confirmPassword`. The service looks up the user by email, checks password complexity, hashes the new password, and updates the database immediately. No verification code, email token, SMS OTP, or administrative approval is required.

#### Evidence:
From [CustomerAuthenticationService.java](file:///backend/src/main/java/com/lankastay/backend/service/CustomerAuthenticationService.java#L116-L135):
```java
@Transactional
public void resetForgottenPassword(SimpleForgotPasswordRequest request, String ipAddress) {
    String normalizedEmail = CustomerUser.normalizeEmail(request.email());
    CustomerUser customer = customerRepository.findByEmail(normalizedEmail)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Not Found", "No account found with this email."));

    if (!request.newPassword().equals(request.confirmPassword())) {
        throw new ApiException(HttpStatus.BAD_REQUEST, "Validation Error", "New password and confirmation do not match.");
    }

    passwordPolicy.validate(request.newPassword());
    if (encoder.matches(request.newPassword(), customer.getPasswordHash())) {
        throw new ApiException(HttpStatus.BAD_REQUEST, "Validation Error", "New password must be different from current password.");
    }

    customer.setPasswordHash(encoder.encode(request.newPassword()));
    customer.setFailedLoginAttempts(0);
    customer.setLockedUntil(null);
    customerRepository.save(customer);
    audit.record(customer.getId(), customer.getId(), SecurityEventType.PASSWORD_RESET_COMPLETED, ipAddress, "SUCCESS");
}
```
An identical flaw exists in [AuthenticationService.java](file:///backend/src/main/java/com/lankastay/backend/service/AuthenticationService.java#L169-L188) for staff accounts.

#### Attack Scenario:
1. Attacker learns or guesses the manager email (`manager@lankastay.com`).
2. Attacker sends an unauthenticated HTTP POST request to `/api/v1/auth/forgot-password/change-password` with `{"email": "manager@lankastay.com", "newPassword": "Hacked@1234", "confirmPassword": "Hacked@1234"}` along with a valid CSRF token.
3. The server sets the manager's password to `Hacked@1234` and resets failed attempts and lockouts.
4. Attacker logs into `/staff/login` with full `MANAGER` privileges.

#### Impact:
Catastrophic. Total compromise of all customer accounts and all staff/manager accounts. Unauthorized access to all reservation records, guest PII, room availability, and operational management.

#### Likelihood:
Extremely High. Trivial to discover and exploit with basic browser DevTools or curl.

#### Recommended Fix:
1. Delete the `POST /api/v1/customer/auth/forgot-password/change-password` and `POST /api/v1/auth/forgot-password/change-password` endpoints immediately.
2. Direct all password reset operations exclusively through the secure token-based workflow in `PasswordResetService`:
   - Step 1: `POST /api/v1/auth/forgot-password` generates a high-entropy SHA-256 hashed token with a 15–30 minute expiration and transmits a reset link via email.
   - Step 2: `POST /api/v1/auth/reset-password` accepts `token`, `newPassword`, and `confirmNewPassword`, validating the token hash against `password_reset_tokens` where `used_at IS NULL` and `expires_at > NOW()`.
3. Invalidate all active sessions upon password reset.

---

## 13. High Findings

### Finding HIGH-01: User and Staff Account Enumeration via Dedicated Public Endpoints

**Current Phase 1 status (active application): FIXED — VERIFIED.** See final verification section; original evidence below is historical.
- **Severity:** HIGH
- **Confidence:** CERTAIN
- **Affected Components:**
  - `backend/src/main/java/com/lankastay/backend/controller/CustomerAuthenticationController.java:56-61`
  - `backend/src/main/java/com/lankastay/backend/service/CustomerAuthenticationService.java:111-113`
  - `backend/src/main/java/com/lankastay/backend/controller/AuthenticationController.java:65-70`
  - `backend/src/main/java/com/lankastay/backend/service/AuthenticationService.java:163-166`
- **CWE:** CWE-204 (Observable Response Discrepancy)
- **OWASP Top 10:2025:** A07:2025 – Authentication Failures
- **OWASP API Security Top 10:** API2:2023 – Broken Authentication
- **ASVS 5.0:** V2.5.7

#### Description:
Both `CustomerAuthenticationController` and `AuthenticationController` expose dedicated `POST .../forgot-password/check-email` endpoints that return a JSON object explicitly declaring whether an email exists in the database: `{"exists": true}` or `{"exists": false}`.

#### Evidence:
[CustomerAuthenticationController.java](file:///backend/src/main/java/com/lankastay/backend/controller/CustomerAuthenticationController.java#L56-L61):
```java
@PostMapping("/forgot-password/check-email")
public ResponseEntity<Map<String, Boolean>> checkForgotPasswordEmail(
        @Valid @RequestBody ForgotPasswordRequest request
) {
    return ResponseEntity.ok(Map.of("exists", customerAuthService.forgotPasswordEmailExists(request.email())));
}
```
Observed local test response:
```json
HTTP/1.1 200 OK
Content-Type: application/json
{"exists": false}
```

#### Attack Scenario:
An attacker sends automated requests with lists of employee names, known customer emails, or dictionary email addresses. The endpoint confirms which emails are registered, generating high-quality target lists for spear phishing, credential stuffing, and account lockout attacks.

#### Recommended Fix:
Remove the `check-email` endpoints completely. Both customer and staff password reset flows should accept the email and always return the same generic message: `"If an account exists for that email, password reset instructions have been sent."` regardless of whether the email was found.

---

### Finding HIGH-02: Arbitrary File Upload Allowing HTML/SVG Stored XSS and Extension Bypass

**Current Phase 1 status (active application): FIXED — VERIFIED.** See final verification section; original evidence below is historical.
- **Severity:** HIGH
- **Confidence:** CERTAIN
- **Affected Components:**
  - `backend/src/main/java/com/lankastay/backend/controller/MediaController.java:19-24`
  - `backend/src/main/java/com/lankastay/backend/service/MediaStorageService.java:41-84`
  - `backend/src/main/java/com/lankastay/backend/config/WebConfig.java:18-24`
  - `backend/src/main/java/com/lankastay/backend/config/SecurityConfig.java:64, 74`
- **CWE:** CWE-434 (Unrestricted Upload of File with Dangerous Type), CWE-79 (Cross-Site Scripting)
- **OWASP Top 10:2025:** A05:2025 – Injection / A08:2025 – Software and Data Integrity Failures
- **OWASP API Security Top 10:** API8:2023 – Security Misconfiguration
- **ASVS 5.0:** V12.1.1, V12.1.2, V12.2.1

#### Description:
`MediaStorageService.storeFile` performs insufficient validation:
1. **Client-Controlled MIME Type:** MIME validation checks `file.getContentType()`, which is directly set by the client request header.
2. **Missing Extension Allowlist:** If a dot exists in `originalFilename`, the code extracts the client-supplied extension without verifying that the extension belongs to an allowlist:
   ```java
   int dotIndex = originalFilename.lastIndexOf('.');
   if (dotIndex > 0) {
       extension = originalFilename.substring(dotIndex).toLowerCase();
   }
   ```
3. **No Magic Byte Inspection:** The server does not inspect file signatures or magic bytes.
4. **Direct Execution / Rendering in Origin:** Uploaded files are resolved into `uploads/destinations/` and served publicly via `WebConfig.addResourceHandlers("/uploads/**")` without Content-Security-Policy or sandboxing headers.

#### Attack Scenario:
1. An attacker (or staff member) uploads a file named `xss.html` or `payload.svg` with HTTP header `Content-Type: image/png`.
2. The server accepts the upload because `contentType` is `image/png`. It extracts extension `.html` and saves the file as `uploads/destinations/dest_172658..._a1b2c3d4.html`.
3. The server returns public URL `/uploads/destinations/dest_172658..._a1b2c3d4.html`.
4. The attacker sends this URL to an administrator. When opened in the browser, Spring MVC serves the file as `text/html`, executing arbitrary JavaScript in the LankaStay security context (stealing localStorage, dispatching unauthorized API calls).

#### Recommended Fix:
1. Enforce a strict server-side extension allowlist (`.jpg`, `.jpeg`, `.png`, `.webp`). Reject any filename ending in `.html`, `.svg`, `.htm`, `.jsp`, `.exe`, etc.
2. Ignore client-provided extensions; instead, derive the storage extension strictly from server-verified MIME detection.
3. Validate magic bytes using an image parser (`ImageIO.read()` or Apache Tika) to confirm the byte stream is a genuine raster image.
4. Serve uploaded user media from a separate, sandboxed domain or add headers: `Content-Disposition: attachment` (for non-images) and `Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'`.

---

### Finding HIGH-03: Plaintext Database Password Committed in QA Automation Scripts

**Current Phase 1 status (active application): FIXED — REQUIRES MANUAL SECRET ROTATION.** See final verification section; original evidence below is historical.
- **Severity:** HIGH
- **Confidence:** CERTAIN
- **Affected Components:**
  - `scripts/qa/verify_auth_persistence_and_reset.js:96`
  - `scripts/qa/verify_after_restart.js:46`
- **CWE:** CWE-798 (Use of Hard-coded Credentials), CWE-259 (Use of Hard-coded Password)
- **OWASP Top 10:2025:** A02:2025 – Security Misconfiguration
- **OWASP API Security Top 10:** API8:2023 – Security Misconfiguration
- **ASVS 5.0:** V14.1.1, V14.1.2

#### Description:
The database connection string and raw application user password are hardcoded into JavaScript automation scripts in the repository:
```javascript
const mysqlOut = execSync(`mysql -u lankastay_app -p"[REDACTED_SECRET]" -e "USE lankastay_db; SELECT ...;"`, ...);
```
Anyone with access to the source repository gains direct access to the database credentials.

#### Recommended Fix:
1. Rotate the MySQL database password for user `lankastay_app` immediately.
2. Remove hardcoded credentials from `scripts/qa/`. Load credentials exclusively from process environment variables (`process.env.DB_PASSWORD`).
3. Ensure all QA scripts verify environment variable presence and fail cleanly if unset.

---

### Finding HIGH-04: Broken Function Level Authorization (BFLA) on Destination and Attraction Management

**Current Phase 1 status (active application): FIXED — VERIFIED.** See final verification section; original evidence below is historical.
- **Severity:** HIGH
- **Confidence:** CERTAIN
- **Affected Components:**
  - `backend/src/main/java/com/lankastay/backend/controller/ManagementDestinationController.java:51-79`
  - `backend/src/main/java/com/lankastay/backend/controller/AttractionController.java:39-65`
  - `backend/src/main/java/com/lankastay/backend/config/SecurityConfig.java:74`
- **CWE:** CWE-285 (Improper Authorization), CWE-862 (Missing Authorization)
- **OWASP Top 10:2025:** A01:2025 – Broken Access Control
- **OWASP API Security Top 10:** API5:2023 – Broken Function Level Authorization
- **ASVS 5.0:** V4.1.1, V4.1.2

#### Description:
`SecurityConfig.java` line 74 defines the rule:
```java
.requestMatchers("/api/v1/hotels/**", "/api/management/**", "/api/v1/management/**", "/api/media/**")
    .hasAnyRole("MANAGER", "HOTEL_STAFF", "RECEPTIONIST")
```
This permits all three staff roles past the Spring Security filter chain for `/api/management/**`.

However, unlike `ManagementHotelController` or `PhysicalRoomController` (which apply `@PreAuthorize("hasRole('MANAGER')")` on mutating methods), `ManagementDestinationController` and `AttractionController` contain **no method security annotations whatsoever**.

As a result, a user with the lowest-privilege role (`ROLE_RECEPTIONIST`) or a property-scoped `ROLE_HOTEL_STAFF` can issue:
- `POST /api/management/destinations` (Create new destinations)
- `PUT /api/management/destinations/{id}` (Modify existing destinations)
- `PATCH /api/management/destinations/{id}/status` (Activate/archive destinations)
- `DELETE /api/management/destinations/{id}` (Delete destinations)
- `POST/PUT/DELETE /api/management/destinations/{id}/attractions` (Mutate attractions)

This directly contradicts `docs/AUTHORIZATION.md` (which states `RECEPTIONIST` is DENIED and `HOTEL_STAFF` is restricted).

#### Recommended Fix:
Add `@PreAuthorize("hasRole('MANAGER')")` to mutating methods (`POST`, `PUT`, `PATCH`, `DELETE`) in both `ManagementDestinationController` and `AttractionController`.

---

### Finding HIGH-05: Missing Cross-Hotel Scope Verification in Discount Management (IDOR/BOLA)

**Current Phase 1 status (active application): FIXED — VERIFIED.** See final verification section; original evidence below is historical.
- **Severity:** HIGH
- **Confidence:** CERTAIN
- **Affected Components:**
  - `backend/src/main/java/com/lankastay/backend/controller/DiscountController.java:61-72`
  - `backend/src/main/java/com/lankastay/backend/service/DiscountService.java:59-79`
- **CWE:** CWE-639 (Authorization Bypass Through User-Controlled Key), CWE-863 (Incorrect Authorization)
- **OWASP Top 10:2025:** A01:2025 – Broken Access Control
- **OWASP API Security Top 10:** API1:2023 – Broken Object Level Authorization
- **ASVS 5.0:** V4.1.3, V4.2.1

#### Description:
1. In `DiscountController`, the endpoint `PUT /api/v1/management/discounts/{id}` permits `HOTEL_STAFF` to update discounts. However, it does not verify whether the discount record with ID `{id}` belongs to the staff member's assigned hotel. A staff member assigned to Hotel 301 can modify discount parameters, discount codes, or valid dates for Hotel 302.
2. Direct entity binding on `@RequestBody Discount discount` creates a mass-assignment / over-posting risk where clients can mutate unmanaged entity fields.
3. The method `GET /api/v1/management/discounts/validate` contains `@PreAuthorize("permitAll()")`, but is unreachable by unauthenticated customers because `SecurityConfig` blocks all `/api/v1/management/**` paths at the filter-chain level before method security is evaluated.

#### Recommended Fix:
1. Verify `principal.assignedHotelId()` matches `discount.getHotelId()` in `DiscountService.updateDiscount`.
2. Replace entity binding with a validated DTO (`UpdateDiscountRequest`).
3. Relocate public promo code validation to `/api/public/discounts/validate` or `/api/v1/customer/discounts/validate`.

---

## 14. Medium Findings

### Finding MED-01: Fail-Open Hotel Scope Authorization When Staff User Has No Assigned Hotel
- **Severity:** MEDIUM
- **Confidence:** CERTAIN
- **Affected Components:** `backend/src/main/java/com/lankastay/backend/service/HotelService.java:356-362, 369-373`
- **CWE:** CWE-285 (Improper Authorization)
- **Description:** In `HotelService.java`, `verifyStaffHotelScope` contains the following logic:
  ```java
  if (StaffRole.HOTEL_STAFF.name().equals(principal.role())) {
      StaffUser staffUser = staffUserRepository.findById(principal.id()).orElse(null);
      if (staffUser != null && staffUser.getAssignedHotelId() != null && !staffUser.getAssignedHotelId().equals(hotelId)) {
          throw new AccessDeniedException("You are not authorized to access or modify this hotel.");
      }
      return;
  }
  ```
  If a `HOTEL_STAFF` record has `assignedHotelId == null`, the condition evaluates to false, and the staff member is granted access to all hotels.
- **Recommended Fix:** Change the condition to fail-closed:
  ```java
  if (staffUser == null || staffUser.getAssignedHotelId() == null || !staffUser.getAssignedHotelId().equals(hotelId)) {
      throw new AccessDeniedException("Access denied: You are not assigned to this hotel.");
  }
  ```

---

### Finding MED-02: Missing Content-Security-Policy (CSP) and HSTS Response Headers
- **Severity:** MEDIUM
- **Confidence:** CERTAIN
- **Affected Components:** `backend/src/main/java/com/lankastay/backend/config/SecurityConfig.java:84-87`
- **CWE:** CWE-693 (Protection Mechanism Failure), CWE-1021 (Improper Restriction of Rendered UI)
- **Description:** Spring Security configuration configures `X-Content-Type-Options`, `Referrer-Policy`, and `Permissions-Policy`, but completely omits `Content-Security-Policy` and `Strict-Transport-Security`. In the event of an XSS flaw (such as file upload rendering), the absence of CSP allows unrestrained script execution and data exfiltration.
- **Recommended Fix:** Configure an authoritative CSP in `SecurityConfig.java`:
  ```java
  .headers(headers -> headers
      .contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'self'; img-src 'self' data: https://*.tile.openstreetmap.org; style-src 'self' 'unsafe-inline'; script-src 'self'; frame-ancestors 'none';"))
      .httpStrictTransportSecurity(hsts -> hsts.includeSubDomains(true).maxAgeInSeconds(31536000))
  )
  ```

---

### Finding MED-03: Static Mutable Map and Localhost-Bypassed Development Reset Endpoint
- **Severity:** MEDIUM
- **Confidence:** CERTAIN
- **Affected Components:**
  - `backend/src/main/java/com/lankastay/backend/service/PasswordResetService.java:45, 160-175`
  - `backend/src/main/java/com/lankastay/backend/controller/PasswordResetController.java:46-60`
  - `backend/src/main/java/com/lankastay/backend/config/SecurityConfig.java:68`
- **CWE:** CWE-668 (Exposure of Resource to Wrong Sphere), CWE-488 (Exposure of Data Element to Wrong Session)
- **Description:**
  1. `PasswordResetService` declares `private static final ConcurrentHashMap<String, String> devLastResetLinks = new ConcurrentHashMap<>();`. This static mutable collection persists reset tokens across requests and sessions, violating strict memory isolation.
  2. `GET /api/v1/auth/dev-last-reset-link` is `permitAll()` in `SecurityConfig`. While it checks for active profile `"dev"` and IP `127.0.0.1`, in a containerized environment, Kubernetes cluster, or behind a local reverse proxy, client IP is often reported as `127.0.0.1`, allowing unauthenticated token harvesting.
- **Recommended Fix:** Delete the `dev-last-reset-link` endpoint and the static map entirely. Use a mock email service / log-capturing SMTP sink (such as MailHog or GreenMail) during development.

---

### Finding MED-04: Session Persistence Across Password Reset (Missing Invalidation of Active Sessions)
- **Severity:** MEDIUM
- **Confidence:** CERTAIN
- **Affected Components:** `backend/src/main/java/com/lankastay/backend/service/PasswordResetService.java:103-158`
- **CWE:** CWE-613 (Insufficient Session Expiration)
- **Description:** When a user completes a password reset via `PasswordResetService.resetPassword`, existing sessions are never invalidated. If an account was compromised, an attacker retaining an active session remains authenticated until session timeout.
- **Recommended Fix:** Call `sessionRevocationService.revokeAll(user.getEmail())` in `PasswordResetService` upon successful password update. For customer users, clear active customer sessions associated with the user ID.

---

### Finding MED-05: Account Lockout Denial-of-Service on Customer Accounts Without IP Throttling
- **Severity:** MEDIUM
- **Confidence:** CERTAIN
- **Affected Components:** `backend/src/main/java/com/lankastay/backend/service/CustomerAuthenticationService.java:64-98`
- **CWE:** CWE-307 (Improper Restriction of Excessive Authentication Attempts), CWE-400 (Uncontrolled Resource Consumption)
- **Description:** `CustomerAuthenticationService` locks a customer account for 15 minutes after 5 failed attempts. However, it does not apply IP rate limiting (unlike staff login, which uses `LoginRateLimiter`). An attacker can lock out legitimate customers by sending 5 invalid password requests per known email.
- **Recommended Fix:** Integrate IP-based rate limiting on `/api/v1/customer/auth/login` (e.g., maximum 10 attempts per IP per 10 minutes) before incrementing user account lockout counters, or require CAPTCHA after 3 consecutive failures.

---

### Finding MED-06: Unbounded In-Memory Map in `LoginRateLimiter` Causing Resource Exhaustion Risk
- **Severity:** MEDIUM
- **Confidence:** CERTAIN
- **Affected Components:** `backend/src/main/java/com/lankastay/backend/service/LoginRateLimiter.java:15, 25-34`
- **CWE:** CWE-770 (Allocation of Resources Without Limits or Throttling)
- **Description:** `LoginRateLimiter` stores IP history in a `ConcurrentHashMap<String, Deque<Instant>>`. While entries within each deque are purged when older than `cutoff`, the IP keys in the map are never removed unless a successful login occurs (`clear()`). An attacker rotating through IP addresses can cause memory exhaustion.
- **Recommended Fix:** Replace the unbounded `ConcurrentHashMap` with a size-bounded cache with automatic eviction (e.g., Caffeine Cache with `expireAfterWrite(15, TimeUnit.MINUTES)` and `maximumSize(10_000)`).

---

### Finding MED-07: Unrestricted Resource Consumption via Unpaginated Public Query Endpoints
- **Severity:** MEDIUM
- **Confidence:** CERTAIN
- **Affected Components:**
  - `backend/src/main/java/com/lankastay/backend/controller/CustomerHotelController.java:36-39`
  - `backend/src/main/java/com/lankastay/backend/controller/CustomerDestinationController.java:26-29`
  - `backend/src/main/java/com/lankastay/backend/controller/PublicReviewController.java:22-37`
- **CWE:** CWE-770 (Allocation of Resources Without Limits or Throttling)
- **OWASP API Security Top 10:** API4:2023 – Unrestricted Resource Consumption
- **Description:** `GET /api/public/hotels`, `GET /api/destinations`, and `GET /api/public/reviews` return full unpaginated query results from the database into JVM memory. As inventory and reviews grow, unauthenticated attackers can flood these endpoints to exhaust heap space and database connection pools.
- **Recommended Fix:** Implement Spring Data `Pageable` on all public listing endpoints with strict max page sizes (e.g., `@PageableDefault(size = 20)` and maximum cap of 50).

---

## 15. Low Findings

### Finding LOW-01: Dual Schema Management Conflict (Flyway Enabled Alongside `ddl-auto=update`)
- **Severity:** LOW
- **Confidence:** CERTAIN
- **Affected Components:** `backend/src/main/resources/application.properties:12, 15-17`, `.env:4`
- **CWE:** CWE-1068 (Inconsistency Between Implementation and Documented Design)
- **Description:** `spring.jpa.hibernate.ddl-auto=update` is active concurrently with Flyway migrations. In staging and production, Hibernate can silently alter table definitions, drop foreign key constraints, or conflict with Flyway migrations.
- **Recommended Fix:** Set `spring.jpa.hibernate.ddl-auto=validate` for all non-local profiles.

---

### Finding LOW-02: Missing `AbortController` on Asynchronous Frontend Quote Requests
- **Severity:** LOW
- **Confidence:** CERTAIN
- **Affected Components:** `frontend/src/pages/Booking/Booking.jsx:154-172`
- **CWE:** CWE-400 (Uncontrolled Resource Consumption)
- **Description:** When users adjust dates or guest counts on the booking page, an asynchronous effect triggers `getReservationQuote`. While a boolean `active = true` flag prevents state updates after unmount, in-flight network requests are not aborted via `AbortController`, generating request storms against the backend quote calculation engine.
- **Recommended Fix:** Pass an `AbortSignal` to `getReservationQuote` and invoke `controller.abort()` in the effect cleanup function.

---

### Finding LOW-03: Sensitive Customer Profile Photo Stored in Unencrypted Browser `localStorage`
- **Severity:** LOW
- **Confidence:** CERTAIN
- **Affected Components:** `frontend/src/pages/Profile/Profile.jsx:156-189`, `frontend/src/context/CustomerContext.jsx:69-75`
- **CWE:** CWE-922 (Insecure Storage of Sensitive Information)
- **Description:** Profile photos up to 5 MB are stored in browser `localStorage` as base64 DataURLs. On shared devices (e.g., hotel business centers, university computers), photos persist indefinitely after logout.
- **Recommended Fix:** Store customer avatars server-side via authenticated media endpoints and clear avatar keys from `localStorage` on logout.

---

### Finding LOW-04: Spoofable IP Resolution via Unvalidated `X-Forwarded-For` Header
- **Severity:** LOW
- **Confidence:** CERTAIN
- **Affected Components:** `CustomerReviewController.java:68-70`, `ManagementReviewController.java:91-93`
- **CWE:** CWE-290 (Authentication Bypass by Spoofing)
- **Description:** Controllers extract the client IP directly from `request.getHeader("X-Forwarded-For")` without verifying whether the request came from a trusted reverse proxy. Attackers can inject arbitrary IP strings into audit logs.
- **Recommended Fix:** Configure Tomcat's `RemoteIpValve` via `server.forward-headers-strategy=framework` and rely on `request.getRemoteAddr()`.

---

## 16. Informational Findings

### Finding INFO-01: Missing CI/CD Pipeline, Automated SAST/SCA Workflows, and GitHub Push Protection
- **Severity:** INFORMATIONAL
- **Confidence:** CERTAIN
- **Description:** The repository has no `.github/workflows/` directory. There is no automated build verification, unit test execution, CodeQL SAST scan, or Dependabot configuration.
- **Recommendation:** Add standard GitHub Actions workflows for Maven and npm builds, CodeQL analysis, and Dependabot automated dependency scanning.

---

### Finding INFO-02: High-Severity Advisory in Build-Time Transitive Dependency (`nanoid < 3.3.18`)
- **Severity:** INFORMATIONAL / MITIGATED
- **Confidence:** CERTAIN
- **Advisory:** GHSA-2v37-7h3g-55p8 (CWE-835: Infinite loop in custom generators when size is zero)
- **Location:** `frontend/package.json` -> `devDependencies` -> `vite@8.2.1` -> `postcss@8.5.26` -> `nanoid@3.3.17`
- **Status:** Mitigated. `nanoid` is a build-time dependency used by PostCSS inside Vite, not bundled into production runtime JavaScript.
- **Recommendation:** Run `npm update nanoid --save-dev` to bump to `nanoid >= 3.3.18`.

---

### Finding INFO-03: Direct JPA Entity Exposure in Public Room and Rate Endpoints
- **Severity:** INFORMATIONAL
- **Confidence:** CERTAIN
- **Affected Components:** `CustomerHotelController.java:61-71`
- **Description:** Endpoints `GET /api/public/hotels/{hotelId}/rooms` and `GET .../rates` return `List<Room>` and `List<RoomRate>` JPA entities directly rather than mapped DTOs.
- **Recommendation:** Map to `PublicRoomResponse` and `RateResponse` DTOs to avoid accidental schema exposure or Jackson serialization recursion.

---

## 17. Authentication Review

### Staff Authentication:
- Session-based using `HttpSession` and `SecurityContext`.
- Password validation uses `DaoAuthenticationProvider` backed by `StaffUserDetailsService` and `BCryptPasswordEncoder(12)`.
- Password reset architecture uses SHA-256 hashed tokens in `PasswordResetService` (positive control).
- Critical Defect: `AuthenticationController` contains an unauthenticated bypass endpoint `POST /api/v1/auth/forgot-password/change-password` allowing complete staff account takeover.

### Customer Authentication:
- Decoupled from Spring Security's filter chain; uses custom session key `LANKASTAY_CUSTOMER_USER`.
- Session fixation protection is implemented via `changeSessionId()` on login.
- Critical Defect: `CustomerAuthenticationController` contains `POST /api/v1/customer/auth/forgot-password/change-password` allowing complete customer account takeover.
- User enumeration exists on `POST /api/v1/customer/auth/forgot-password/check-email`.

---

## 18. Authorization / RBAC Review

### Role Mapping Matrix:

| Endpoint Pattern | Anonymous | Customer | Receptionist | Hotel Staff | Manager | Ownership Enforced? |
|---|---|---|---|---|---|---|
| `GET /api/public/**` | ALLOW | ALLOW | ALLOW | ALLOW | ALLOW | N/A (Public) |
| `POST /api/v1/customer/auth/**` | ALLOW | ALLOW | ALLOW | ALLOW | ALLOW | N/A (Auth) |
| `GET /api/v1/customer/reservations` | DENY (401) | ALLOW | DENY (401) | DENY (401) | DENY (401) | YES (Self only) |
| `GET /api/v1/customer/reservations/{id}` | DENY (401) | ALLOW | DENY (401) | DENY (401) | DENY (401) | YES (Self only) |
| `POST /api/v1/customer/reservations/{id}/cancel` | DENY (401) | ALLOW | DENY (401) | DENY (401) | DENY (401) | YES (Self only) |
| `GET /api/v1/customer/profile` | DENY (401) | ALLOW | DENY (401) | DENY (401) | DENY (401) | YES (Self only) |
| `GET /api/v1/customer/reviews` | DENY (401) | ALLOW | DENY (401) | DENY (401) | DENY (401) | YES (Self only) |
| `GET /api/v1/admin/staff/**` | DENY (401) | DENY (403) | DENY (403) | DENY (403) | ALLOW | Manager only |
| `POST /api/v1/hotels` | DENY (401) | DENY (403) | DENY (403) | DENY (403) | ALLOW | Manager only |
| `PUT /api/v1/hotels/{id}` | DENY (401) | DENY (403) | DENY (403) | ALLOW (Scoped) | ALLOW | Scoped to Hotel |
| `POST /api/v1/management/rooms` | DENY (401) | DENY (403) | DENY (403) | DENY (403) | ALLOW | Manager only |
| `PUT /api/v1/management/rooms/{id}` | DENY (401) | DENY (403) | DENY (403) | ALLOW (Scoped) | ALLOW | Scoped to Hotel |
| `GET /api/v1/management/reservations` | DENY (401) | DENY (403) | ALLOW (Scoped) | ALLOW (Scoped) | ALLOW | Scoped to Hotel |
| `PATCH /api/v1/management/reservations/{id}/assign-room` | DENY (401) | DENY (403) | ALLOW (Scoped) | ALLOW (Scoped) | ALLOW | Scoped to Hotel |
| `DELETE /api/management/destinations/{id}` | DENY (401) | DENY (403) | **ALLOW (FLAW)** | **ALLOW (FLAW)** | ALLOW | **NO (Missing Guard)** |
| `DELETE /api/management/destinations/{id}/attractions/{aid}` | DENY (401) | DENY (403) | **ALLOW (FLAW)** | **ALLOW (FLAW)** | ALLOW | **NO (Missing Guard)** |
| `PUT /api/v1/management/discounts/{id}` | DENY (401) | DENY (403) | DENY (403) | **ALLOW (Unscoped)** | ALLOW | **NO (Missing Hotel Scope)** |

---

## 19. Session / Cookie / CSRF Review

- **Cookie Flags:** `HttpOnly=true`, `SameSite=Lax`, `Path=/`, name `LANKASTAY_SESSION`.
- **Secure Flag:** Controlled via `${SESSION_COOKIE_SECURE:false}`. Safe for localhost development; must be strictly `true` in production HTTPS deployments.
- **CSRF Protection:** Implemented using `CookieCsrfTokenRepository.withHttpOnlyFalse()`. Active across all mutating HTTP methods (`POST`, `PUT`, `PATCH`, `DELETE`). Verified active during testing (requests without `X-XSRF-TOKEN` are rejected with HTTP 403).
- **Session Revocation:** Implemented in `SessionRevocationService` for staff, but not invoked during password resets or customer logouts.

---

## 20. API Security Review

Mapping against OWASP API Security Top 10 (2023):
- **API1:2023 Broken Object Level Authorization (BOLA):** Customer reservations and reviews are strongly protected (`findByIdAndCustomerId`). However, discount management allows cross-hotel BOLA (Finding HIGH-05).
- **API2:2023 Broken Authentication:** Tokenless unauthenticated password resets represent a Critical failure (Finding CRIT-01). User enumeration on `/check-email` represents a High failure (Finding HIGH-01).
- **API3:2023 Broken Object Property Level Authorization:** Entities bound directly in `@RequestBody Discount discount` create mass-assignment risk (Finding HIGH-05).
- **API4:2023 Unrestricted Resource Consumption:** Public hotel, destination, and review listing endpoints lack pagination (Finding MED-07).
- **API5:2023 Broken Function Level Authorization (BFLA):** Destination and Attraction mutation endpoints lack `@PreAuthorize("hasRole('MANAGER')")` (Finding HIGH-04).
- **API6:2023 Unrestricted Access to Sensitive Business Flows:** Rate limiting is absent from customer reservation creation and quote calculation.
- **API7:2023 Server-Side Request Forgery (SSRF):** Not Applicable. No outbound HTTP clients exist in backend services.
- **API8:2023 Security Misconfiguration:** Arbitrary file upload extension handling (Finding HIGH-02) and missing security headers (Finding MED-02).
- **API9:2023 Improper Inventory Management:** Development reset endpoint exposed via `permitAll()` (Finding MED-03).
- **API10:2023 Unsafe Consumption of APIs:** Not Applicable. The backend does not consume third-party APIs.

---

## 21. Reservation Business-Logic Review

### Authoritative Server-Side Pricing:
The client does not transmit prices. `CustomerReservationService` calculates:
```java
BigDecimal subtotal = calculateTotal(rate, request.checkIn(), request.checkOut(), request.quantity());
```
Nightly rates vary for weekends vs weekdays based on database records. Subtotals and discounts cannot be manipulated via browser DevTools.

### Promotion and Offer Logic:
- Offers are evaluated server-side (`evaluateOffer`) matching booking window, stay window, minimum/maximum nights, applicable days, and property/room targeting.
- Final price is clamped to zero: `if (finalTotal.compareTo(BigDecimal.ZERO) < 0) finalTotal = BigDecimal.ZERO;`.
- Negative discounts and discounts exceeding subtotal cannot produce negative balances.

### State Transitions:
- Customers can only cancel `CONFIRMED` reservations before check-in date.
- Permanent deletion requires `CANCELLED` status, zero payment transactions, and no associated reviews.
- Completed status transitions require checkout date to have arrived.

---

## 22. Concurrency / Double-Booking Review

### Check-Then-Act Analysis:
In hotel reservation systems, a major risk is double-booking: two users booking the last available room simultaneously.

### LankaStay Implementation:
```java
@Transactional(isolation = Isolation.READ_COMMITTED)
public ReservationResponse create(UUID customerId, CreateReservationRequest request) {
    ...
    Room room = rooms.findByIdForUpdate(request.roomId())
            .orElseThrow(() -> badRequest("The selected room does not exist."));
    ...
    assertAvailable(room, request.checkIn(), request.checkOut(), request.quantity());
    ...
    Reservation saved = reservations.saveAndFlush(reservation);
    items.save(item);
}
```
1. `rooms.findByIdForUpdate(request.roomId())` acquires a pessimistic write lock (`SELECT ... FOR UPDATE`) on the `Room` row in MySQL.
2. The transaction holds this lock while executing `assertAvailable()`.
3. `assertAvailable()` computes effective capacity minus booked items for every night in the date range.
4. Concurrent transactions attempting to book the same room type block waiting for the lock.
5. When the first commits, the second acquires the lock, re-checks availability against the newly committed items, and throws `ConflictException("The selected room is no longer available...")`.

**Verdict:** The concurrency control for room reservation creation is **properly implemented and robust**.

---

## 23. Database Security Review

### Schema & Integrity:
- Foreign keys with `ON DELETE RESTRICT` protect hotels, rooms, rates, reservations, and customers from orphan deletion.
- `uk_reservations_code UNIQUE (reservation_code)` guarantees reservation code uniqueness.
- `uk_reviews_reservation UNIQUE (reservation_id)` guarantees single review per stay.

### Least Privilege Evaluation:
- The database user `lankastay_app` is granted DDL privileges (`CREATE TABLE`, `ALTER TABLE`) due to `ddl-auto=update` and Flyway migrations running under the same user.
- **Recommendation:** Separate database users: `lankastay_migrator` (for deployment migrations) and `lankastay_app` (DML only: `SELECT`, `INSERT`, `UPDATE`, `DELETE`).

---

## 24. SQL / Injection Review

- **JPA Repositories:** All 18 repository interfaces use Spring Data derived query methods or `@Query` annotations with named parameters (`:param`).
- **Dynamic Queries:** No criteria string concatenation or dynamic SQL construction exists.
- **JdbcTemplate:** Cascading deletes in `HotelService.java` and seed inserts in `SeedDataInitializer.java` strictly use positional parameter binding (`?`).
- **Verdict:** SAFE. No SQL Injection vulnerabilities were identified.

---

## 25. Input Validation Review

- DTOs utilize Bean Validation (`@Valid`, `@NotNull`, `@NotBlank`, `@Size`, `@Min`, `@Email`).
- Dates are strictly validated: `checkIn` before `checkOut`, and `checkIn` not in the past.
- Capacities are strictly validated against room maximums:
  ```java
  if (request.adults() > adultsCapacity || request.children() > childrenCapacity
          || request.adults() + request.children() > totalCapacity) {
      throw badRequest("Guest count exceeds the selected room capacity.");
  }
  ```

---

## 26. File Upload Review

- **File Size Limit:** Enforced at 5 MB via `spring.servlet.multipart.max-file-size=5MB` and `MediaStorageService.MAX_FILE_SIZE`.
- **Path Traversal:** Filenames are checked for `..`, `/`, `\\` via `StringUtils.cleanPath` and resolved securely against `uploadLocation`.
- **Storage Path:** Files are saved to `uploads/destinations/` with UUID-prefixed names.
- **Vulnerabilities Identified:** MIME type is read from client header without magic byte verification; extension is not checked against an allowlist, permitting HTML/SVG uploads and stored XSS (Finding HIGH-02).

---

## 27. Frontend Security Review

- **Framework:** React 19.2.8 with Vite 8.2.0.
- **State Management:** In-memory React context stores (`CustomerContext`, `AuthContext`, `ReservationsContext`).
- **Logout Isolation:** `ReservationsContext` explicitly purges state when switching accounts.
- **LocalStorage Usage:** Customer avatar is cached in `localStorage` as base64 without logout purging (Finding LOW-03).
- **Dangerous HTML:** Zero instances of `dangerouslySetInnerHTML`, `eval()`, or `javascript:` URLs found in the codebase.
- **External Links:** Links with `target="_blank"` properly declare `rel="noreferrer"` or `rel="noopener noreferrer"`.

---

## 28. XSS / CSP Review

- **DOM XSS / Reflected XSS:** React's JSX auto-encodes untrusted strings before rendering, protecting against standard reflected and stored DOM injection in UI templates.
- **Stored XSS via Media Upload:** Because uploaded HTML/SVG files are served directly on the application domain via `/uploads/**` with no Content-Security-Policy, an attacker can trigger stored XSS by sharing direct upload links (Finding HIGH-02).
- **CSP Status:** Content-Security-Policy header is absent (Finding MED-02).

---

## 29. CORS / Security Headers Review

### CORS Configuration:
```java
configuration.setAllowedOrigins(Arrays.stream(origins.split(",")).map(String::trim).filter(s -> !s.isBlank()).toList());
configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
configuration.setAllowedHeaders(List.of("Content-Type", "Accept", "X-XSRF-TOKEN"));
configuration.setAllowCredentials(true);
```
- Localhost origins (`5174`, `5173`, `5175`) are permitted.
- Wildcards (`*`) are avoided with credentialed sessions.
- **Requirement:** `CORS_ALLOWED_ORIGINS` must be overridden with exact production domains upon deployment.

### HTTP Headers:
- `X-Content-Type-Options: nosniff` (PRESENT)
- `X-Frame-Options: DENY` (PRESENT)
- `Referrer-Policy: no-referrer` (PRESENT)
- `Permissions-Policy: camera=(), microphone=(), geolocation=(self)` (PRESENT)
- `Content-Security-Policy` (MISSING - Finding MED-02)
- `Strict-Transport-Security` (MISSING - Finding MED-02)

---

## 30. Secrets Review

- `.env` is listed in `.gitignore` and was not committed to Git.
- Raw passwords and tokens are excluded from `toString()` representations in customer DTOs.
- `SecurityAuditService` excludes passwords, session IDs, and tokens from audit logs.
- **Defect:** Hardcoded plaintext database passwords found in `scripts/qa/` (Finding HIGH-03).

---

## 31. Dependency / Supply-Chain Review

### Backend Dependencies (`pom.xml`):
- `spring-boot-starter-data-jpa`
- `spring-boot-starter-validation`
- `spring-boot-starter-webmvc`
- `spring-boot-starter-security`
- `spring-boot-starter-flyway`
- `flyway-mysql`
- `mysql-connector-j` (runtime)

### Frontend Dependencies (`package.json`):
- Production: `react@19.2.8`, `react-dom@19.2.8`, `react-router@8.3.0`, `leaflet@1.9.4`, `react-leaflet@5.0.0`, `lucide-react@1.29.0`.
- Development: `vite@8.2.0`, `oxlint@1.75.0`, `@vitejs/plugin-react@6.0.4`.
- **Vulnerability Check:** `npm audit` flagged `nanoid < 3.3.18` (GHSA-2v37-7h3g-55p8) as a transitive build-time dependency in `postcss`. Mitigated for production browser runtime (Finding INFO-02).

---

## 32. GitHub / CI-CD Review

- No `.github/workflows` configurations exist in the repository.
- No automated regression testing on pull requests.
- No automated secret scanning or Dependabot vulnerability monitoring.
- Tracked as Finding INFO-01.

---

## 33. Logging / Privacy Review

- `SecurityAuditService` logs authentication, password change, lockout, and reservation lifecycle events asynchronously via `REQUIRES_NEW` transactions.
- Audit records store actor ID, target ID, event type, IP, and result status.
- Passwords and session IDs are never written to audit tables.
- PII is restricted to necessary guest contact details (name, email, phone).
- Finding LOW-04: Unvalidated `X-Forwarded-For` header allows audit log IP spoofing.

---

## 34. DoS / Resource Consumption Review

- Multipart upload request size is bounded at 5 MB (`spring.servlet.multipart.max-request-size=5MB`).
- Password length is bounded at 128 characters, protecting against BCrypt CPU exhaustion.
- Finding MED-05: Account-based lockout allows denial-of-service against customer accounts.
- Finding MED-06: In-memory rate limiter map is unbounded across distinct IP keys.
- Finding MED-07: Public query endpoints lack pagination limits.

---

## 35. Third-Party Integration Review

- OpenStreetMap tile layers are loaded directly by client-side Leaflet.
- Zero server-side outbound HTTP requests are performed.
- SSRF risk is currently Not Applicable.

---

## 36. Error Handling Review

- Handled by `GlobalExceptionHandler` with `@RestControllerAdvice`.
- Returns sanitized JSON schemas (`ErrorResponse`) containing timestamp, status, error type, and generic message.
- Internal stack traces and database dialect syntax are suppressed.

---

## 37. OWASP Top 10:2025 Mapping

| OWASP Category | Applicable? | Controls Present | Repository Findings |
|---|---|---|---|
| **A01 Broken Access Control** | YES | Ownership checks on reservations; `@PreAuthorize` on rooms & hotels | HIGH-04 (BFLA on destinations), HIGH-05 (IDOR on discounts), MED-01 (Fail-open hotel scope) |
| **A02 Security Misconfiguration** | YES | HttpOnly cookies, SameSite=Lax, frame denial | HIGH-03 (Committed QA credentials), MED-02 (Missing CSP/HSTS), LOW-01 (ddl-auto=update) |
| **A03 Software Supply Chain Failures** | YES | Lockfiles maintained | INFO-01 (No Dependabot/CI), INFO-02 (nanoid in postcss) |
| **A04 Cryptographic Failures** | YES | BCrypt (12), SecureRandom, SHA-256 token hashing | LOW-03 (Unencrypted photo in localStorage) |
| **A05 Injection** | YES | Universal parameter binding in JPA and JdbcTemplate | HIGH-02 (HTML/SVG upload stored XSS) |
| **A06 Insecure Design** | YES | Pessimistic locking for room availability; server pricing | CRIT-01 (Tokenless reset design flaw), MED-05 (Lockout DoS) |
| **A07 Authentication Failures** | YES | BCrypt, Session fixation protection, AccountStateFilter | CRIT-01 (Tokenless reset), HIGH-01 (Email enumeration), MED-04 (Stale sessions) |
| **A08 Software & Data Integrity** | YES | Database constraints (`uk_reviews_reservation`) | HIGH-02 (File extension bypass) |
| **A09 Security Logging & Alerting** | YES | `SecurityAuditService` with sanitized audit tables | LOW-04 (Spoofable client IP in review audit logs) |
| **A10 Mishandling of Exceptions** | YES | `GlobalExceptionHandler` suppressing stack traces | MED-06 (Unbounded rate limiter memory leak risk) |

---

## 38. OWASP API Top 10 Mapping

| OWASP API Category | Status | Repository Finding |
|---|---|---|
| **API1:2023 Broken Object Level Authorization** | VULNERABLE | HIGH-05 (Cross-hotel discount modification) |
| **API2:2023 Broken Authentication** | VULNERABLE | CRIT-01 (Tokenless password reset), HIGH-01 (User enumeration) |
| **API3:2023 Broken Object Property Level Auth** | VULNERABLE | HIGH-05 (Entity binding on Discount controller) |
| **API4:2023 Unrestricted Resource Consumption** | VULNERABLE | MED-07 (Unpaginated public queries), LOW-02 (Missing AbortController) |
| **API5:2023 Broken Function Level Authorization** | VULNERABLE | HIGH-04 (Receptionist access to destination deletion) |
| **API6:2023 Unrestricted Access to Sensitive Flows** | PARTIAL | Absence of CAPTCHA/IP throttling on customer auth |
| **API7:2023 Server-Side Request Forgery** | NOT APPLICABLE | No outbound HTTP integrations |
| **API8:2023 Security Misconfiguration** | VULNERABLE | HIGH-02 (Upload MIME verification), MED-02 (Missing CSP) |
| **API9:2023 Improper Inventory Management** | VULNERABLE | MED-03 (Dev reset endpoint permitted) |
| **API10:2023 Unsafe Consumption of APIs** | NOT APPLICABLE | No third-party API consumption |

---

## 39. OWASP ASVS 5.0 Mapping

| ASVS Section | Requirement | Status | Evidence |
|---|---|---|---|
| **V1 Architecture** | V1.1.1 Secure design patterns | PARTIAL | Strong concurrency design; flawed customer reset architecture |
| **V2 Authentication** | V2.1.1 Password complexity & length | PASS | `PasswordPolicy.java` enforces 8–128 chars + character sets |
| **V2 Authentication** | V2.5.2 Token-based recovery only | FAIL | CRIT-01 (Tokenless unauthenticated password resets) |
| **V2 Authentication** | V2.5.7 Prevent user enumeration | FAIL | HIGH-01 (Dedicated email check endpoints) |
| **V3 Session Management** | V3.2.1 HttpOnly cookie attribute | PASS | `server.servlet.session.cookie.http-only=true` |
| **V3 Session Management** | V3.2.3 SameSite attribute | PASS | `server.servlet.session.cookie.same-site=lax` |
| **V3 Session Management** | V3.3.1 Invalidate sessions on pwd change | FAIL | MED-04 (Sessions persist after token reset) |
| **V4 Access Control** | V4.1.1 Least privilege enforcement | FAIL | HIGH-04 (Receptionists can delete destinations) |
| **V4 Access Control** | V4.1.3 Record-level authorization | PASS | `findByIdAndCustomerId` enforces customer isolation |
| **V5 Cryptography** | V5.1.1 Approved password hashing | PASS | BCrypt strength 12 in `SecurityConfig.java` |
| **V5 Cryptography** | V5.3.1 Cryptographically secure random | PASS | `SecureRandom` in `TemporaryPasswordGenerator.java` |
| **V12 File Uploads** | V12.1.1 File extension validation | FAIL | HIGH-02 (Extension extracted without allowlist) |
| **V12 File Uploads** | V12.1.2 Content-Type verification | FAIL | HIGH-02 (Relies on client-provided header) |
| **V13 API & Web Services** | V13.1.1 Parameterized queries | PASS | 100% parameterized queries in JPA and JDBC |
| **V14 Configuration** | V14.1.1 No hardcoded credentials | FAIL | HIGH-03 (Plaintext DB passwords in `scripts/qa/`) |
| **V14 Configuration** | V14.4.1 Content-Security-Policy | FAIL | MED-02 (Missing CSP header) |

---

## 40. Supplied PDF Security Checklist Mapping

| PDF Checklist Concept | Repository Evidence | Status | Finding ID | Recommendation |
|---|---|---|---|---|
| **Server/Global Memory State** | Singleton services do not hold user state. `PasswordResetService` has static `ConcurrentHashMap`; `LoginRateLimiter` has unbounded IP map. | VULNERABLE | MED-03, MED-06 | Remove static reset map; add size limits & TTL to `LoginRateLimiter`. |
| **Backend Login Verification** | All protected APIs verify session server-side. Customer endpoints check session ID in controller. | SAFE | - | Maintained correctly; migrate customer sessions into Spring Security. |
| **Private Browser Caching** | Default headers include `no-cache, no-store, max-age=0, must-revalidate` for API responses. | SAFE | - | Properly enforced by Spring Security filter chain defaults. |
| **Frontend Secrets & API Keys** | No secrets in frontend bundle. Vite variables only contain public API URLs. QA scripts contained DB password. | VULNERABLE | HIGH-03 | Purge hardcoded passwords from `scripts/qa/` and rotate DB credential. |
| **DB Record-Level Authorization** | `findByIdAndCustomerId` used for customer reservations/reviews. Scoped checks used for staff hotel operations. | SAFE | - | Excellent object-level isolation implemented. |
| **Infinite Render / Request Loops** | `useEffect` arrays are stabilized. `Booking.jsx` lacks `AbortController` for in-flight requests. | VULNERABLE | LOW-02 | Add `AbortController` to booking and search effect hooks. |
| **Tenant / Account Isolation** | Cross-account contamination prevented in `ReservationsContext` by purging state on account switch. | SAFE | - | Maintained correctly. |
| **Global-State Pollution** | User state stored in dedicated request/session scopes. Profile photo stored in unencrypted `localStorage`. | VULNERABLE | LOW-03 | Clear `localStorage` on logout; store photos server-side. |
| **Session Hijacking** | HttpOnly, SameSite=Lax, `changeSessionId()` on login. Sessions not invalidated on password reset. | VULNERABLE | MED-04 | Invalidate active sessions upon password reset. |
| **File MIME Verification** | Relies on client `Content-Type` header; no magic byte inspection. | VULNERABLE | HIGH-02 | Enforce magic byte checking via Apache Tika or `ImageIO`. |
| **File Upload Size Limits** | 5 MB maximum enforced in both configuration and service. | SAFE | - | Size boundary correctly enforced. |
| **Executable Upload Prevention** | Storage paths use UUID prefixes, but unallowlisted `.html`/`.svg` extensions are preserved and served on origin. | VULNERABLE | HIGH-02 | Enforce strict extension allowlist (`.jpg`, `.png`, `.webp`). |
| **Raw SQL Injection** | Parameterized queries used everywhere; zero string concatenation. | SAFE | - | Prepared statements consistently applied. |
| **Input / Schema Validation** | Bean Validation annotations enforce required fields, lengths, numbers, and dates. | SAFE | - | Strong server-side validation on DTOs. |
| **Database Least Privilege** | `ddl-auto=update` and Flyway run under application runtime user. | VULNERABLE | LOW-01 | Separate migration user from runtime DML user. |
| **Architecture-First Review** | Full data flow traced from React UI to MySQL persistence. | SAFE | - | Complete architectural review completed. |

---

## 41. Threat Model

### Assets:
1. Customer Accounts and Authentication Credentials.
2. Staff & Manager Administrative Access.
3. Hotel Reservation and Inventory Records (financial and operational data).
4. Guest Personally Identifiable Information (PII: full names, emails, phone numbers, stay history).
5. Database Integrity and Application Availability.

### Threat Actors:
- **Anonymous External Attacker:** Motivated to steal customer data, take over manager accounts, or execute denial of service.
- **Malicious Customer:** Attempts horizontal privilege escalation to view/cancel other guests' bookings or manipulate prices.
- **Malicious or Compromised Staff Member:** Attempts vertical privilege escalation (receptionist attempting manager actions) or cross-property tampering.
- **Automated Bots:** Credential stuffing, reservation hoarding, and user enumeration.

### Key Abuse Cases:
1. **Abuse Case 1 (Account Takeover):** Attacker calls `/forgot-password/change-password` directly and resets the `manager@lankastay.com` credential, gaining total administrative control.
2. **Abuse Case 2 (Stored XSS via Media Upload):** Malicious staff uploads an HTML file disguised with an image MIME type. When an administrator inspects destination media, script executes in the admin browser context.
3. **Abuse Case 3 (Unauthorized Destination Tampering):** Receptionist issues `DELETE /api/management/destinations/1` to wipe destinations from the live catalog.
4. **Abuse Case 4 (Account Lockout DoS):** Script floods customer login with 5 wrong passwords per target customer, locking hundreds of user accounts simultaneously.

---

## 42. Security Test Matrix

| Feature | Threat | Test Performed | Expected Secure Result | Observed Behavior | Status | Evidence |
|---|---|---|---|---|---|---|
| **Staff Protected API** | Unauthenticated Access | `GET /api/v1/auth/me` without cookies | HTTP 401 Unauthorized | HTTP 401 with JSON security error | PASS | Verified locally via curl |
| **Customer Protected API** | Unauthenticated Access | `GET /api/v1/customer/reservations` without cookies | HTTP 401 Unauthorized | HTTP 401 with JSON error | PASS | Verified locally via curl |
| **Manager Admin API** | Unauthorized Role Access | `GET /api/v1/admin/staff` without cookies | HTTP 401 Unauthorized | HTTP 401 with JSON error | PASS | Verified locally via curl |
| **Hotel Management API** | Unauthorized Role Access | `GET /api/v1/hotels` without cookies | HTTP 401 Unauthorized | HTTP 401 with JSON error | PASS | Verified locally via curl |
| **CSRF Protection** | CSRF Attack on POST | `POST /check-email` without CSRF token | HTTP 403 Forbidden | HTTP 403 Access is denied | PASS | Verified locally via curl |
| **Email Check Endpoint** | User Enumeration | `POST /check-email` with CSRF token | Generic message without existence disclosure | Returns `{"exists": false}` | FAIL | Verified locally via curl |
| **Customer Password Reset** | Account Takeover | Direct POST to `.../change-password` | Reject without valid reset token | Allows password overwrite without token | FAIL | Source code verified |
| **Destination Deletion** | BFLA / Privilege Escalation | `DELETE /api/management/destinations/{id}` with RECEPTIONIST session | HTTP 403 Forbidden | Permitted by filter chain & missing `@PreAuthorize` | FAIL | Source code verified |
| **Cross-Hotel Discount** | BOLA / IDOR | `PUT /api/v1/management/discounts/{id}` with other hotel ID | HTTP 403 Forbidden | No property check in service | FAIL | Source code verified |
| **Room Double Booking** | Race Condition | Concurrent reservation creation for last room | Exactly one succeeds, second gets 409 Conflict | Pessimistic write lock serializes bookings | PASS | Source code verified |
| **Price Tampering** | Client-Side Price Tampering | Client submits reduced total in request | Server recalculates authoritative price | Server recalculates from database rate | PASS | Source code verified |
| **Reservation IDOR** | Customer A views Customer B stay | Customer A requests Customer B reservation ID | HTTP 404 Not Found | `findByIdAndCustomerId` isolates records | PASS | Source code verified |
| **SQL Injection** | Parameter Manipulation | Malicious SQL syntax in search inputs | Parameterized query treats input as literal text | 100% prepared queries across repos | PASS | Source code verified |

---

## 43. Six-Month Security Horizon (to March 2027)

### Current Stack Baseline (September 2026):
- Java JDK 17+ (running on OpenJDK 26.0.1)
- Spring Boot 4.1.0 / Spring Security 6+
- React 19.2.8 / Vite 8.2.0
- MySQL 8.0+

### Key Emerging Risks and Vulnerabilities:
1. **Transitive NPM Dependency Vulnerabilities:** Transitive packages in Vite/PostCSS build chains (e.g., `nanoid` GHSA-2v37-7h3g-55p8) will continue to emerge. Without automated SCA (Dependabot), unmaintained devDependencies accumulate known CVEs.
2. **Spring Framework & Virtual Thread Concurrency Patterns:** With modern Java runtimes (Java 21+ and JDK 26 preview), adoption of virtual threads changes synchronization semantics. Relying on `synchronized` blocks (such as in `LoginRateLimiter.java`) can pin underlying carrier threads under heavy traffic.
3. **Automated Credential Stuffing & Bot Attacks:** Modern threat actors use residential proxy botnets against login endpoints. In-memory rate limiting without distributed backing (Redis) or CAPTCHA fails to prevent distributed brute-force attacks once deployed publicly.
4. **AI-Generated Code Vulnerabilities:** As features are developed using LLM assistants, pattern shortcuts (such as the tokenless `SimpleForgotPasswordRequest` bypass identified in CRIT-01) frequently get introduced to satisfy functional tests while bypassing security controls.

### Horizon Roadmap:
- **NOW (Immediate):** Remediate tokenless password resets (CRIT-01), purge hardcoded credentials (HIGH-03), and restrict destination/attraction roles (HIGH-04).
- **0–30 Days:** Implement strict file upload magic-byte verification (HIGH-02), eliminate user enumeration (HIGH-01), and configure CSP/HSTS (MED-02).
- **1–3 Months:** Replace in-memory rate limiting with Redis-backed bucket token rate limiting; migrate customer authentication into Spring Security's unified security context.
- **3–6 Months:** Implement GitHub Actions CI/CD with automated CodeQL SAST and Dependabot SCA scanning; establish separate database users for Flyway migrations and runtime application traffic.

---

## 44. Remediation Roadmap

### Prioritization Summary:
- **P0 — Fix Immediately Before Any Public Deployment:**
  - `CRIT-01`: Remove tokenless unauthenticated password resets.
  - `HIGH-03`: Rotate MySQL password and purge credentials from `scripts/qa/`.
- **P1 — Fix Before Production Release:**
  - `HIGH-01`: Remove public `check-email` user enumeration endpoints.
  - `HIGH-02`: Enforce file upload extension allowlist and magic byte validation.
  - `HIGH-04`: Add `@PreAuthorize("hasRole('MANAGER')")` to destination/attraction controllers.
  - `HIGH-05`: Enforce hotel scoping in `DiscountController` and replace entity binding with DTOs.
- **P2 — Fix Soon (Next Sprint):**
  - `MED-01`: Fix fail-open check in `HotelService` for staff with null hotel assignment.
  - `MED-02`: Configure Content-Security-Policy (CSP) and HSTS headers.
  - `MED-03`: Remove `dev-last-reset-link` endpoint and static map.
  - `MED-04`: Invalidate active sessions upon password reset.
  - `MED-05`: Add IP rate limiting on customer login to prevent lockout DoS.
  - `MED-06`: Bounded cache with TTL for `LoginRateLimiter`.
  - `MED-07`: Implement pagination on all public listing APIs.
- **P3 — Hardening & Future Improvements:**
  - `LOW-01`: Set `ddl-auto=validate` in production profiles.
  - `LOW-02`: Add `AbortController` cleanup to frontend search and booking hooks.
  - `LOW-03`: Clear `localStorage` customer avatars on logout.
  - `LOW-04`: Replace raw `X-Forwarded-For` parsing with Tomcat `RemoteIpValve`.
  - `INFO-01`: Create GitHub Actions CI/CD pipeline with CodeQL and Dependabot.

---

## 45. Verification / Regression Tests

For each Critical and High finding, automated or curl-based regression test plans are detailed below:

### Regression Test 1 (CRIT-01: Tokenless Password Reset)
- **Test:** Send `POST /api/v1/customer/auth/forgot-password/change-password` with email and new password.
- **Expected Secure Result:** HTTP 404 Not Found (endpoint removed) or HTTP 401/403.
- **Verification Command:**
  ```powershell
  curl.exe -s -i -X POST "http://localhost:8080/api/v1/customer/auth/forgot-password/change-password" `
    -H "Content-Type: application/json" -d '{"email":"test@example.com","newPassword":"Password@123","confirmPassword":"Password@123"}'
  ```

### Regression Test 2 (HIGH-01: User Enumeration)
- **Test:** Send `POST /api/v1/customer/auth/forgot-password/check-email` with any email.
- **Expected Secure Result:** HTTP 404 Not Found (endpoint removed).
- **Verification Command:**
  ```powershell
  curl.exe -s -i -X POST "http://localhost:8080/api/v1/customer/auth/forgot-password/check-email" `
    -H "Content-Type: application/json" -d '{"email":"manager@lankastay.com"}'
  ```

### Regression Test 3 (HIGH-02: File Upload Extension Bypass)
- **Test:** Attempt to upload `exploit.html` with `Content-Type: image/png`.
- **Expected Secure Result:** HTTP 400 Bad Request: `"Invalid file extension. Only .jpg, .jpeg, .png, and .webp are allowed."`

### Regression Test 4 (HIGH-04: Receptionist Destination Deletion)
- **Test:** Log in as `RECEPTIONIST` and send `DELETE /api/management/destinations/1`.
- **Expected Secure Result:** HTTP 403 Forbidden.

### Regression Test 5 (HIGH-05: Cross-Hotel Discount Modification)
- **Test:** Log in as staff of Hotel 301 and send `PUT /api/v1/management/discounts/{hotel302DiscountId}`.
- **Expected Secure Result:** HTTP 403 Forbidden or 404 Not Found.

---

## 46. Known Limitations

1. **Tooling & Environment Limitation:** The current development workstation runs Java OpenJDK 26.0.1 on Windows. As documented in `UNIT_TESTING_GAP_CLOSURE_REPORT.md`, JDK 26 triggers an `AccessDeniedException` in ZipFS during full Maven test compilation against Java 17 release targets. Targeted unit suites and direct classes run cleanly, but a single complete `mvnw.cmd test` execution requires a supported LTS JDK 17 or 21 installation.
2. **Payment Processing:** Payment processing is simulated via internal database status fields (`PENDING`, `PAID`, `PARTIALLY_PAID`). No external payment gateway (Stripe/PayHere) was available in the repository for review.
3. **SMS / Production Mail Server:** External SMTP credentials were not configured locally, which led to the creation of the insecure development reset shortcuts.

---

## 47. Final Security Checklist

- [x] Server-side session verification enforced on protected endpoints
- [x] Pessimistic write locking verified for concurrent room booking
- [x] Authoritative server-side price calculation verified
- [x] Horizontal customer IDOR isolation verified (`findByIdAndCustomerId`)
- [x] Zero raw SQL string concatenation verified across repositories
- [x] Double-Submit Cookie CSRF protection verified active
- [x] BCrypt (strength 12) password hashing verified
- [x] Global exception handling and stack trace suppression verified
- [ ] Tokenless password reset endpoints removed (**Action Required - CRIT-01**)
- [ ] Public email enumeration endpoints removed (**Action Required - HIGH-01**)
- [ ] File upload extension allowlist and magic byte validation implemented (**Action Required - HIGH-02**)
- [ ] Plaintext database passwords purged from QA scripts and rotated (**Action Required - HIGH-03**)
- [ ] Role authorization added to Destination & Attraction management (**Action Required - HIGH-04**)
- [ ] Hotel scoping added to Discount management (**Action Required - HIGH-05**)
- [ ] Content-Security-Policy header configured (**Action Required - MED-02**)
- [ ] `SESSION_COOKIE_SECURE=true` configured for production HTTPS (**Action Required**)

---

## 48. References

1. OWASP Top 10:2025: https://owasp.org/Top10/
2. OWASP API Security Top 10 (2023): https://owasp.org/www-project-api-security/
3. OWASP Application Security Verification Standard 5.0.0: https://owasp.org/www-project-application-security-verification-standard/
4. OWASP Web Security Testing Guide (WSTG): https://owasp.org/www-project-web-security-testing-guide/
5. OWASP Cheat Sheet Series - Authentication, Authorization, Password Storage, File Upload, CSRF: https://cheatsheetseries.owasp.org/
6. NIST Special Publication 800-63B - Digital Identity Guidelines: Authentication and Lifecycle: https://csrc.nist.gov/publications/detail/sp/800-63b/final
7. Spring Security Reference Manual: https://docs.spring.io/spring-security/reference/
8. GitHub Security Advisory GHSA-2v37-7h3g-55p8 (Nanoid ReDoS / loop vulnerability): https://github.com/advisories/GHSA-2v37-7h3g-55p8

## PHASE 1 REMEDIATION VERIFICATION

Active backend: 197 tests passed, no failures/errors/skips. Frontend production build and security/auth-validation/rate/destination tests passed. Actual isolated H2/MySQL-mode HTTP smoke passed; existing port 8080 and real database records were untouched.

| Finding | Original Risk | Fix Applied | Regression Test | Test Result | Remaining Manual Step | Final Status |
|---|---|---|---|---|---|---|
| CRIT-01 | CRITICAL: anonymous account takeover | Removed tokenless mappings/services/DTO; 256-bit random hash-only, scoped, locked one-use tokens; mail delivery; lock reset and session revocation | SecurityPhaseOneIntegrationTest; AuthenticationPersistenceAndResetTest; SimpleForgotPasswordIntegrationTest; SimpleStaffForgotPasswordIntegrationTest | PASS: invalid/expired/used/random tokens, once-only reset, hash change, cross-namespace rejection, shared-email isolation, customer/staff session rejection | Deploy code and V19 via normal backend restart; configure/confirm mailbox delivery | FIXED — VERIFIED |
| HIGH-01 | HIGH: customer/staff email enumeration | Removed email-check handlers/calls; same HTTP 200 message for both outcomes; five requests/IP/15 minutes; asynchronous SMTP | SecurityPhaseOneIntegrationTest; secure customer/staff reset integration tests; frontend test:security | PASS: identical status/body/structure; absent users receive no email; sixth IP request returns 429 | Shared limiter if deploying multiple instances; controlled SMTP mailbox test | FIXED — VERIFIED |
| HIGH-02 | HIGH: HTML/SVG upload stored XSS | Trusted image decoding, bounded dimensions/pixels/bytes, allowlisted single extension matching detected format, re-encoded pixels, UUID names, inert resource allowlist/CSP/nosniff | MediaStorageServiceTest; uploadEndpointInspectsBytesAndServesOnlyInertImages | PASS: JPG/PNG/WebP; spoofed HTML/SVG/random, dangerous/double extensions, traversal, oversize/dimension bombs; appended script discarded; normal upload/GET works | Deploy resource handler/header changes; WebP now returns sanitized PNG | FIXED — VERIFIED |
| HIGH-03 | HIGH: exposed database credential | Removed source/document copies; required DB_* configuration; shell-free MySQL invocation with private child environment; placeholder-only example and rotation SQL template | frontend test:security DB config cases; node --check QA scripts; repository-wide literal search; read-only MySQL connection | PASS for source cleanup/config checks; rotation/new-secret reconnect NOT PERFORMED | DBA ALTER USER for lankastay_app@localhost; replace ignored .env/deployment secret/backups; reconnect and restart using NEW secret | FIXED — REQUIRES MANUAL SECRET ROTATION |
| HIGH-04 | HIGH: non-manager global catalog mutation | Manager method authorization on all destination and attraction mutations; preserved GET discovery; authorization matrix corrected | globalCatalogMutationsRejectEveryNonManager; managerCanMutateGlobalDestinationAndAttractionCatalog | PASS: all seven operations deny hotel staff/receptionist/customer/anonymous; manager create/update/status/delete and public reads work | Deploy code | FIXED — VERIFIED |
| HIGH-05 | HIGH: cross-hotel discounts/mass assignment | Validated create/update/response DTOs; existing-row authorization and current DB staff assignment; null/missing hotel fails closed; immutable update ownership; public validation route and legacy alias | discountScopeAndMassAssignmentAreEnforced; managerAllowedAndReceptionistDeniedDiscountMutations; discountCreateUsesAssignedHotelAndRejectsInjectedOwnership; nonexistentHotelFailsClosedAndPublicValidationIsReachable | PASS: own hotel allowed; foreign hotel/null/stale assignment/missing hotel/injected ownership/receptionist denied; manager and public validation work | Deploy code | FIXED — VERIFIED |

Statuses refer to the active `backend/` and `frontend/`. Scoped fixes were also mirrored to the older `hotel-reservation-system/backend`, but its existing missing Room/Offer domain types prevent compilation, so no runtime verification is claimed for that copy.

Manual actions: rotate `lankastay_app@localhost` using [reviewed SQL template](../../scripts/qa/rotate_database_password.sql.example), replace private environment/deployment secrets and obsolete backups, and verify a NEW database connection. Restart/deploy active backend with Flyway V19; configure SMTP/FRONTEND_URL and verify mailbox delivery. The ignored .env deliberately retains the old credential until coordinated rotation; HIGH-03 is not fully closed.

The source-wide old-secret search matches only ignored .env. No production frontend/QA call or controller mapping remains for retired reset/email-check/dev-link APIs; only explicit 404 tombstones, regression tests, and historical documentation reference those URLs. No commit/push or real-secret addition was made.

Exact changed files: [Phase 1 manifest](phase1/FILES_CHANGED.md). Commands/results, initial failures and their corrections, compatibility controls, and remaining verification limits: [Phase 1 verification evidence](phase1/VERIFICATION.md).

## Addendum — 2026-09-18 final personal-repository verification

[Current evidence](PRE_COMMIT_VERIFICATION_2026-09-18.md) supersedes prior readiness
claims. Database authentication and active-backend read access PASS, but HIGH-03
rotation is NOT VERIFIED: the configured credential remains a historical exposed
value. No secret value is reproduced here. Replace that credential privately and
remove/replace exposed bootstrap configuration before closure. Known-bootstrap
account comparison found zero matches, not proof of all historical rotations.
Fresh isolated B18→V19 and read-only live V18 validation passed; live V19 is pending.
External SMTP delivery and production deployment are not certified. No inactive
backend repair or Git handoff/commit/push occurred in this continuation.
