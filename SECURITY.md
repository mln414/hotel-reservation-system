# Security Policy

## 1. Supported Versions

| Project Component | Version / Environment | Supported |
|---|---|---|
| Spring Boot Backend | 4.1.0 / Java 17+ | :white_check_mark: |
| React Frontend | 19.2.8 / Vite 8 | :white_check_mark: |
| MySQL Database | 8.0+ (Flyway Migrations V1–V19) | :white_check_mark: |

These are maintained component versions, not a claim that production deployment,
SMTP delivery, credential rotation, or every database upgrade has been verified.
Fresh installations use B18 followed by V19; historical migration checksums are
preserved. Consult dated verification evidence for checks actually performed.

---

## 2. Reporting a Vulnerability

As this is an academic university software engineering project:
- If you discover a security vulnerability or sensitive information exposure, please **do not open a public GitHub issue**.
- Instead, report findings privately to the project lead or academic supervisors.
- Reports should include reproduction steps, affected endpoints, and suggested remediation.

---

## 3. Security Principles & Architecture

- **Zero Hardcoded Secrets:** All credentials (database passwords, mail secrets, bootstrap credentials) must be supplied via environment variables or local `.env` files (which are strictly Git-ignored).
- **Session Isolation:** Authenticated sessions use `HttpOnly`, `SameSite=Lax` cookies.
- **CSRF Defenses:** Double-Submit Cookie CSRF tokens are enforced on all mutating HTTP methods.
- **Concurrency Protections:** Database pessimistic row locks (`SELECT ... FOR UPDATE`) prevent double-booking race conditions during reservation creation.
- **File Upload Safeguards:** Media uploads enforce strict MIME allowlists, raster image magic-byte verification, and storage isolation.
- **Authoritative Calculations:** Financial totals, taxes, and promotional discounts are computed authoritatively on the server.
