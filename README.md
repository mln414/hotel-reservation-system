# LankaStay Hotels & Resorts – Multi-Property Hotel Reservation System
[![Backend CI](https://github.com/LakshanHMK/hotel-reservation-system/actions/workflows/backend-ci.yml/badge.svg?branch=main)](https://github.com/LakshanHMK/hotel-reservation-system/actions/workflows/backend-ci.yml)
[![Frontend CI](https://github.com/LakshanHMK/hotel-reservation-system/actions/workflows/frontend-ci.yml/badge.svg?branch=main)](https://github.com/LakshanHMK/hotel-reservation-system/actions/workflows/frontend-ci.yml)
[![Latest Release](https://img.shields.io/github/v/release/LakshanHMK/hotel-reservation-system?display_name=tag)](https://github.com/LakshanHMK/hotel-reservation-system/releases/latest)
[![CodeQL](https://img.shields.io/badge/CodeQL-enabled-success)](https://github.com/LakshanHMK/hotel-reservation-system/security/code-scanning)
[![Secret Protection](https://img.shields.io/badge/Secret%20Protection-enabled-success)](https://github.com/LakshanHMK/hotel-reservation-system/security)


> **Academic Project Declaration:**  
> **Course Module:** SE2030 – Software Engineering (Year 2, Semester 1)  
> **Institution:** Sri Lanka Institute of Information Technology (SLIIT)  
> **Domain:** Enterprise Web-Based Multi-Property Hospitality & Hotel Reservation Platform  

---

## 1. Project Overview

**LankaStay Hotels & Resorts** is a full-stack hospitality web platform engineered for luxury destination resorts across Sri Lanka. The application provides an end-to-end guest booking experience—spanning destination discovery with interactive maps, real-time room availability, authoritative rate and promotional discounting calculations, verified-stay guest reviews, and customer profiles.

Simultaneously, LankaStay equips hotel staff and executive managers with an enterprise back-office portal supporting multi-property administration, physical room unit inventory tracking, seasonal promotional codes, and role-based staff provisioning.

---

## 2. Main Features

- **Geographic Destination Discovery:** Search travel destinations across Sri Lanka with curated tourist attractions and interactive Leaflet map integration.
- **Multi-Property Hotel Catalog:** Comprehensive property showcases with amenities, photography, contact metadata, and active promotions.
- **Real-Time Room Availability & Concurrency Control:** Search rooms by date range and guest capacity; zero double-booking guaranteed through database-level pessimistic write locking (`SELECT ... FOR UPDATE`).
- **Server-Authoritative Pricing & Offers:** Client price tampering is neutralized; nightly subtotals, seasonal discounts, promotional codes, and taxes are computed authoritatively from database records.
- **Verified-Stay Guest Reviews:** Reviews are restricted to authenticated customers with verified `COMPLETED` stays; database constraints enforce a strict 1-review-per-stay policy.
- **Customer Guest Portal:** Self-service registration, secure session authentication, profile updating, upcoming stay tracking, and self-cancellation.
- **Staff Back-Office Portal:** Dedicated role-gated administration workspace for General Managers, Hotel Staff, and Receptionists.
- **Physical Room Inventory:** Allocation of physical room units (room numbers, floor, maintenance states) to reservations.
- **Secure Media Upload:** Raster image processing (JPEG, PNG, WebP) with magic-byte deep inspection, file size bounds, and path traversal defenses.

---

## 3. User Roles & Access Control

The platform enforces a five-tier access control matrix:

| Actor / Role | Description | Access Scope |
|---|---|---|
| **Public Guest** | Unauthenticated browser visitor | Browse destinations, search hotels, view room types, check rates. |
| **Customer (`CUSTOMER`)** | Registered guest user | Book rooms, manage own reservations, cancel bookings, submit verified reviews, edit personal profile. |
| **Receptionist (`ROLE_RECEPTIONIST`)** | On-site hotel desk personnel | View property check-in/check-out rosters, assign physical room numbers, assist arriving guests. |
| **Hotel Staff (`ROLE_HOTEL_STAFF`)** | Property-scoped operations staff | Manage assigned hotel rooms, create property discount codes, monitor inventory. Restricted to assigned property. |
| **General Manager (`ROLE_MANAGER`)** | System executive administrator | Global multi-property oversight, hotel creation, destination & attraction curation, staff account provisioning. |

---

## 4. Technology Stack

### Frontend
- **Framework:** React 19.2.8
- **Build Tool & Bundler:** Vite 8.2.0
- **Routing:** React Router 8.3.0
- **Styling:** Vanilla CSS luxury design system with custom CSS tokens & responsive breakpoints
- **Mapping & Icons:** Leaflet 1.9.4, React-Leaflet 5.0.0, Lucide React 1.29.0
- **Linting:** Oxlint 1.75.0

### Backend
- **Language & Runtime:** Java 17+ (Compiled JDK 17, verified on modern JVMs)
- **Framework:** Spring Boot 4.1.0 / managed Spring Security 7.1.0
- **Persistence:** Spring Data JPA, Hibernate ORM, Spring `JdbcTemplate`
- **Image Processing:** TwelveMonkeys ImageIO 3.12.0
- **Database Driver:** MySQL Connector/J 9.7.0 (Spring Boot dependency management)
- **Build Tool:** Apache Maven 3.9+ (Maven Wrapper included)

### Database
- **Database Engine:** MySQL 8.0+
- **Migration Framework:** Flyway Database Migrations (V1 — V19)

---

## 5. System Architecture

LankaStay uses a layered client-server architecture. The React/Vite single-page application communicates with a Spring Boot REST backend over HTTP/JSON using session-based authentication. Spring Security provides CSRF protection and role-based authorization; customer controllers also validate customer sessions. Services implement business rules, Spring Data JPA and Spring JdbcTemplate provide persistence, and MySQL stores application data with Flyway-managed schema migrations.

```mermaid
%%{init: {"flowchart": {"wrappingWidth": 220}}}%%
flowchart TB
    subgraph clientTier["Client Tier"]
        spa["React 19 + Vite SPA - Port 5174<br/>Context state: CustomerContext,<br/>StaffContext, ReservationsContext<br/>Route guards: CustomerProtectedRoute<br/>and ManagementProtectedRoute"]
    end
    subgraph communicationTier[" "]
        direction TB
        communicationTitle["Communication / Security Boundary"]:::tierTitle
        transport["HTTP / JSON REST + credentialed CORS<br/>Session cookie: LANKASTAY_SESSION<br/>HttpOnly / SameSite=Lax<br/>CSRF header: X-XSRF-TOKEN"]
        communicationTitle --> transport
    end
    subgraph applicationTier["Spring Boot Application Tier - Development port: 8080"]
        direction LR
        subgraph securityLayer["Spring Security Layer"]
            security["Spring Security filter chain<br/>CsrfFilter + CookieCsrfTokenRepository<br/>CorsFilter + allowed-origin configuration<br/>Session SecurityContext persistence:<br/>HttpSessionSecurityContextRepository<br/>AccountStateFilter"]
        end
        subgraph controllerLayer["Controller Layer"]
            controllers["Public Discovery<br/>Customer Auth and Booking<br/>Staff Operations<br/>Management Admin<br/>Customer-session validation"]
        end
        subgraph serviceLayer["Service / Business Logic Layer"]
            services["Reservation Management<br/>Room Availability<br/>Pessimistic Room Locking<br/>Authoritative Pricing<br/>Password Reset + Image Validation<br/>Verified-Stay Reviews"]
        end
        subgraph persistenceLayer["Persistence Layer - 18 repositories"]
            persistence["Spring Data JPA<br/>Parameterized JPQL<br/>Spring JdbcTemplate<br/>Parameterized SQL"]
        end
        security --> controllers --> services --> persistence
    end
    subgraph databaseTier[" "]
        direction TB
        databaseTitle["Database Tier"]:::tierTitle
        mysql[("MySQL 8+<br/>lankastay_db<br/>Flyway V1-V19<br/>B18 baseline for fresh installations")]
        databaseTitle --> mysql
    end
    spa --> communicationTier --> applicationTier
    applicationTier -->|JDBC / TCP 3306| databaseTier
    classDef tierTitle fill:transparent,stroke:transparent,color:#333,font-weight:bold;
```

---

## 6. Repository Directory Structure

```
LankaStay/
├── README.md                           # Master project documentation
├── .gitignore                          # Hardened Git exclusions
├── .env.example                        # Environment variable template
├── CONTRIBUTING.md                     # Contribution & branch standards
├── SECURITY.md                         # Security policy & disclosure
├── start-backend.ps1                   # Local backend launcher
├── start-frontend.ps1                  # Local frontend launcher
│
├── .github/                            # GitHub Actions & community files
│   ├── workflows/
│   │   ├── backend-ci.yml              # Maven clean test workflow (Java 17)
│   │   └── frontend-ci.yml             # Vite build & security test workflow
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   └── feature_request.md
│   └── PULL_REQUEST_TEMPLATE.md
│
├── backend/                            # Spring Boot Java Application
│   ├── pom.xml                         # Maven dependencies & plugins
│   ├── mvnw / mvnw.cmd                 # Maven wrapper binaries
│   ├── .mvn/                           # Maven wrapper configuration
│   └── src/
│       ├── main/
│       │   ├── java/com/lankastay/backend/
│       │   │   ├── config/             # Spring Security, Web MVC, CORS
│       │   │   ├── controller/         # REST API Controllers
│       │   │   ├── dto/                # Request & Response DTOs
│       │   │   ├── entity/             # JPA Entities
│       │   │   ├── exception/          # Global exception handlers
│       │   │   ├── mapper/             # Entity to DTO mappers
│       │   │   ├── repository/         # Spring Data JPA repositories
│       │   │   ├── security/           # Principal & filter components
│       │   │   └── service/            # Core business & transactional logic
│       │   └── resources/
│       │       ├── application.properties
│       │       └── db/migration/       # Flyway SQL migrations (V1 - V19)
│       └── test/                       # Integration & unit test suite
│
├── frontend/                           # React + Vite Application
│   ├── package.json                    # npm scripts & dependencies
│   ├── vite.config.js                  # Vite bundler configuration
│   ├── index.html                      # HTML entrypoint
│   ├── public/                         # Static public assets
│   ├── scripts/                        # Automated domain test suites
│   └── src/
│       ├── assets/                     # Imagery, branding, logos
│       ├── components/                 # Reusable UI components
│       ├── context/                    # React Context state providers
│       ├── pages/                      # Page views (Guest, Customer, Staff)
│       ├── routes/                     # AppRoutes and route guards
│       ├── services/                   # API client service layer
│       ├── utils/                      # Validation & formatting utilities
│       ├── App.jsx                     # Application shell
│       ├── main.jsx                    # React entrypoint
│       └── index.css                   # Core design system CSS
│
├── docs/                               # Project Documentation
│   ├── architecture/                   # Architecture, Auth & Access specs
│   ├── database/                       # Schema guide & migration log
│   ├── api/                            # REST API directory
│   └── audit-evidence/                 # Security assessments & gap reports
│
├── scripts/                            # Operational & QA Scripts
│   └── qa/                             # Runtime verification scripts
│
└── uploads/                            # Runtime media storage (.gitkeep)
    ├── destinations/
    └── hotels/
```

---

## 7. Backend Layered Architecture

The backend strictly separates concerns across architectural layers:
- **Controllers:** Bind HTTP requests, enforce `@Valid` input validation, and delegate immediately to domain services. Zero business logic is held in controllers.
- **DTOs:** Pure data-carrying objects that isolate JPA entities from public exposure. Mass-assignment and over-posting risks are eliminated.
- **Services:** Transaction boundaries (`@Transactional`), business assertions, concurrency locking, and audit recording.
- **Repositories:** Clean data access interfaces utilizing Spring Data JPA with 100% prepared/parameterized queries.
- **Security:** Dual-layer protection incorporating Spring Security for staff RBAC and session attributes for customer operations.

---

## 8. Frontend Architecture

The React single-page application is structured around responsive, accessible components:
- **Context State Management:** Lightweight, decoupled React contexts (`CustomerContext`, `StaffContext`, `ReservationsContext`) maintain session state without third-party boilerplate.
- **Route Guards:** `CustomerRoute` redirects unauthenticated guests to `/login`; `StaffRoute` gates management views behind verified staff credentials and enforces initial password rotation.
- **API Services Layer:** Centralized service modules (`authApi`, `customerApi`, `hotelApi`, `reservationApi`, `managementApi`) encapsulate fetch requests and automatically manage CSRF headers (`X-XSRF-TOKEN`).
- **Luxury Design System:** Pure Vanilla CSS design system featuring harmonious HSL palettes, smooth transitions, and mobile-responsive layouts.

---

## 9. Database Overview & Flyway Migrations

The active migration lineage is V1–V19. Applied versioned migrations remain immutable.
Fresh empty MySQL databases use the cumulative schema-only `B18__fresh_install_schema.sql`
baseline and then V19; existing databases keep their recorded versioned history.
See [the schema guide](docs/database/SCHEMA.md) for verification and upgrade limits.

- `V1__dashboard_authentication.sql`: Staff accounts, roles (`MANAGER`, `HOTEL_STAFF`, `RECEPTIONIST`), audit log.
- `V2__hotel_management.sql`: Hotel entities, amenities, photos, and policies.
- `V3__customer_and_password_reset.sql`: Customer users, profiles, SHA-256 password reset tokens.
- `V4__hotel_contact_fields.sql`: Extended contact, phone, email, and location metadata.
- `V5__reservation_core.sql`: Core reservation engine, booking numbers, dates, statuses.
- `V6__room_management_core.sql`: Room/rate constraints and indexes, room gallery, room-name snapshots.
- `V7__rate_and_offer_management.sql`: Seasonal rates, promotional packages, and discounts.
- `V8__review_management.sql`: Guest reviews and staff replies with completed-stay constraints.
- `V9`: Wider audit event names; `V10`: Reservation review-submission marker and backfill.
- `V11` & `V12`: Physical room instances (`physical_rooms`) and reservation unit assignments.
- `V13` — `V15`: Seed data for production-ready hotels across Galle, Colombo, and Kandy.
- `V16` & `V17`: Discount promotional engine and numeric precision alignment.
- `V18__destination_management.sql`: Travel destinations and nearby attraction catalogs.
- `V19__customer_session_version.sql`: Customer session versioning for immediate session invalidation on password reset.

---

## 10. Security Architecture & Controls

LankaStay incorporates enterprise-grade security controls verified by formal security assessments:
- **Pessimistic Concurrency Locking:** Room inventory uses `@Lock(LockModeType.PESSIMISTIC_WRITE)` (`SELECT ... FOR UPDATE`) within `READ_COMMITTED` transactions, preventing race conditions during concurrent bookings.
- **Double-Submit Cookie CSRF Protection:** Mutating HTTP requests require the `X-XSRF-TOKEN` header matching the `XSRF-TOKEN` cookie.
- **HttpOnly Session Cookies:** `LANKASTAY_SESSION` cookie is guarded against JavaScript theft with `HttpOnly=true` and `SameSite=Lax`.
- **BCrypt Password Hashing:** All credentials are encrypted using BCrypt (strength 12) with complexity validation (8–128 chars, uppercase, lowercase, numbers, special characters).
- **Horizontal Ownership Enforcement (IDOR Protection):** Customer reservation lookups, cancellations, and reviews strictly filter by `id` and authenticated `customerId` (`findByIdAndCustomerId`).
- **Deep Raster Image Verification:** Media uploads inspect byte stream magic bytes using `ImageIO.read()` to reject disguised HTML, SVG scripts, and image bombs.
- **Zero SQL Injection:** 100% prepared queries and parameterized bindings across JPA and `JdbcTemplate`.

---

## 11. Installation Prerequisites

Ensure the following runtimes are installed on your workstation:
1. **Java Development Kit (JDK):** Version 17 or higher (`java -version`).
2. **Node.js:** Version 24 (`node -v`) with `npm`; the locked React Router requires at least Node 22.22.0.
3. **MySQL Server:** Version 8.0 or higher running on `localhost:3306`.
4. **Git:** Version 2.30 or higher.

---

## 12. Environment Setup

1. Clone the repository locally:
   ```bash
   git clone https://github.com/LakshanHMK/hotel-reservation-system.git
   cd "hotel-reservation-system"
   ```

2. Initialize your local MySQL database:
   ```sql
   CREATE DATABASE lankastay_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'lankastay_app'@'localhost' IDENTIFIED BY 'YourStrongPasswordHere!';
   GRANT ALL PRIVILEGES ON lankastay_db.* TO 'lankastay_app'@'localhost';
   FLUSH PRIVILEGES;
   ```

3. Create your local `.env` configuration file:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and set your local MySQL credentials:
   ```ini
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=lankastay_db
   DB_USER=lankastay_app
   DB_PASSWORD=YourStrongPasswordHere!
   ```

---

## 13. How to Run the Backend

### Option A: Using the PowerShell Launcher
```powershell
.\start-backend.ps1
```

### Option B: Using the Maven Wrapper Directly
```powershell
cd backend
.\mvnw.cmd spring-boot:run
```
*(On macOS/Linux, use `bash ./mvnw spring-boot:run`)*

- The backend will start on **`http://localhost:8080`**.
- Flyway applies pending migrations on startup. Fresh installations use B18 then V19;
  existing installations preserve their applied history. Never mix alternate migration lineages.
- Completed demo reservations are **disabled by default**. On a disposable development
  database only, explicitly set `SPRING_PROFILES_ACTIVE=dev` and
  `LANKASTAY_DEMO_SEED_COMPLETED_RESERVATION=true` in the private environment.
  Both are required; `prod`/`production` profiles prohibit the demo even alongside `dev`.
  The opt-in creates real rows for the first active customer. Ordinary catalog seed behavior
  is unchanged. The dev profile also uses private-console reset-link delivery, not SMTP.

---

## 14. How to Run the Frontend

### Option A: Using the PowerShell Launcher
```powershell
.\start-frontend.ps1
```

### Option B: Using npm Directly
```powershell
cd frontend
npm install
npm run dev
```

- The frontend single-page application will be available at **`http://localhost:5174`**.

---

## 15. Testing & Quality Verification

### Backend Automated Test Suite
Run unit tests and Spring Boot integration tests:
```powershell
cd backend
.\mvnw.cmd test
```

### Frontend Automated Domain Test Suites
The frontend includes comprehensive unit, integration, and security test scripts:
```powershell
cd frontend
npm run test:security          # Verify CSRF, auth flows, and header security
npm run test:auth-validation    # Verify customer & staff password policies
npm run test:reservations       # Verify reservation state transitions
npm run test:hotels             # Verify hotel discovery and filtering
npm run test:offers             # Verify promotional discounting logic
npm run build                   # Verify production bundle compilation
npm run lint                    # Execute Oxlint code quality verification
```

---

## 16. User Interface Gallery

| Home & Destination Discovery | Luxury Hotel Showcase |
|:---:|:---:|
| *(Interactive Destination Catalog & Leaflet Map)* | *(Room Options, Amenities & Nightly Rates)* |

| Real-Time Reservation Flow | Staff Management Portal |
|:---:|:---:|
| *(Date Picker, Dynamic Price Quote & Concurrency Lock)* | *(Inventory Control, Rosters & Room Maintenance)* |

---

## 17. REST API Overview

| Area | Method | Path | Access Scope | Description |
|---|---|---|---|---|
| **Public** | `GET` | `/api/v1/hotels` | Public | Search and filter hotels |
| **Public** | `GET` | `/api/v1/hotels/destinations` | Public | List travel destinations & attractions |
| **Public** | `GET` | `/api/v1/discounts/validate` | Public | Validate promotional coupon code |
| **Customer** | `POST` | `/api/v1/customer/auth/login` | Public | Authenticate customer session |
| **Customer** | `POST` | `/api/v1/customer/reservations` | Customer | Create booking with pessimistic lock |
| **Customer** | `GET` | `/api/v1/customer/reservations` | Customer | List authenticated guest's bookings |
| **Customer** | `POST` | `/api/v1/customer/reviews` | Customer | Submit verified-stay guest review |
| **Staff** | `POST` | `/api/v1/auth/login` | Public | Authenticate staff session |
| **Staff** | `GET` | `/api/management/rooms` | Staff | List rooms for assigned hotel |
| **Management** | `POST` | `/api/management/destinations` | Manager | Create new travel destination |
| **Admin** | `POST` | `/api/v1/admin/staff` | Manager | Provision new staff account |

*For complete endpoint parameters and response schemas, see [docs/api/API_OVERVIEW.md](docs/api/API_OVERVIEW.md).*

---

## 18. Team & Contribution Acknowledgement

This software engineering project was designed and developed collaboratively as part of the **SE2030 Software Engineering** curriculum:

- **Group:** `2026-Y2-S1-MLB-B1G1-07`
- **Key Project Contributors:**
  - **Lakshan H.M.K** — IT25101220 *(Reservation Architecture, Concurrency Controls, Backend Services)*
  - **Wickramasinghe M.P.T.H** — IT25300115 *(Hotel Management, Multi-Property Operations)*
  - **Collaborating Team Members** *(Destination Discovery, Reviews, Customer Experience)*

---

## 19. Academic Declaration & License

This project is submitted in partial fulfillment of the requirements for the **SE2030 Software Engineering** degree module at the **Sri Lanka Institute of Information Technology (SLIIT)**.

All rights reserved © 2026 LankaStay Hotels & Resorts Team. Developed solely for academic assessment and learning purposes.
