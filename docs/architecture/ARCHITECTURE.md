# LankaStay System Architecture & Design

## 1. System Overview

LankaStay Hotels & Resorts is an enterprise multi-property hospitality and reservation management platform designed for luxury travel destinations across Sri Lanka. The platform is engineered as a decoupled single-page application (SPA) backed by a Spring Boot REST API and a MySQL relational persistence tier.

```
+-----------------------------------------------------------------------------------+
|                                 CLIENT TIER                                       |
|  React 19.2 (Vite 8) Single-Page Application (Port 5174)                          |
|  - React Router v8 Route Guards (Guest, Customer, Staff)                         |
|  - In-Memory Contexts: CustomerContext, StaffContext, ReservationsContext         |
|  - Vanilla CSS Luxury Design System, Lucide Icons, Leaflet / React-Leaflet        |
+-----------------------------------------------------------------------------------+
                                         |
                                HTTP / JSON (CORS)
                       Cookie: LANKASTAY_SESSION (HttpOnly, SameSite=Lax)
                       Header: X-XSRF-TOKEN
                                         v
+-----------------------------------------------------------------------------------+
|                           SPRING BOOT BACKEND (Port 8080)                         |
|  Java 17+ / Spring Boot 4.1.0 / Spring Security 6+                                |
|                                                                                   |
|  [Security Filter Pipeline]                                                       |
|  - CsrfFilter (CookieCsrfTokenRepository, Double-Submit Cookie)                   |
|  - CorsFilter (Explicitly Allowed Origins)                                        |
|  - SecurityContextPersistenceFilter (HttpSessionSecurityContextRepository)        |
|  - AccountStateFilter (Enforces ACTIVE staff status & initial password reset)   |
|                                                                                   |
|  [Controller Layer - 25 REST Controllers]                                         |
|  - Public Discovery: CustomerHotelController, CustomerDestinationController       |
|  - Customer Auth & Profile: CustomerAuthenticationController, CustomerProfileCtrl  |
|  - Customer Booking: CustomerReservationController, CustomerReviewController     |
|  - Staff & Management: AuthenticationController, ManagementHotelController,       |
|    ManagementRoomController, PhysicalRoomController, DiscountController, etc.    |
|                                                                                   |
|  [Service & Domain Business Logic - 23 Services]                                  |
|  - CustomerReservationService: Pessimistic locking, server-authoritative pricing  |
|  - ReviewService: Verified completed-stay eligibility, unique review enforcement  |
|  - PasswordResetService: Secure 256-bit SHA-256 token reset & session revocation |
|  - MediaStorageService: Raster image validation (JPEG/PNG/WebP), size limits      |
|                                                                                   |
|  [Persistence Tier - 18 Repositories]                                             |
|  - Spring Data JPA + Hibernate ORM (100% Parameterized Queries)                   |
|  - Spring JdbcTemplate (Cascading Deletions & Seeding)                            |
+-----------------------------------------------------------------------------------+
                                         |
                                  JDBC / TCP (3306)
                                         v
+-----------------------------------------------------------------------------------+
|                              DATABASE TIER                                        |
|  MySQL 8+ Database: lankastay_db                                                  |
|  Flyway Schema Migrations: V1__ through V19__                                     |
+-----------------------------------------------------------------------------------+
```

---

## 2. Layered Backend Architecture

The backend strictly follows a layered architectural pattern:
- **`config/`**: Security configuration, CORS origin policies, Web MVC resource handlers, and seed initializers.
- **`security/`**: `StaffPrincipal`, `AccountStateFilter`, `RetiredPasswordResetFilter`, and password policies.
- **`controller/`**: Exposes REST endpoints, binds HTTP parameters, validates incoming DTOs using `@Valid`, and delegates immediately to services.
- **`dto/`**: Strongly typed Request and Response records and classes, shielding internal database entities from direct API exposure.
- **`service/`**: Encapsulates transactional business logic, domain assertions, concurrency controls, and event auditing.
- **`repository/`**: Spring Data JPA repositories with parameterized JPQL/SQL methods.
- **`entity/`**: JPA domain models mapped to relational tables with database constraints and audit fields.
- **`exception/`**: Centralized `GlobalExceptionHandler` and `ApiException` hierarchy returning sanitized error responses without leaking stack traces.
- **`mapper/`**: Static and utility mappers transforming JPA entities to public API DTOs.

---

## 3. Trust Boundaries & Data Flow

1. **Client to API (Untrusted Boundary):** All incoming parameters, headers, cookies, and multipart uploads are treated as untrusted. Client-side authentication flags in React state are purely UX conveniences; the backend independently authorizes every request.
2. **Customer vs. Staff Context:** Staff sessions authenticate against Spring Security's `SecurityContext` (`StaffPrincipal`). Customer sessions utilize the servlet session attribute `LANKASTAY_CUSTOMER_USER`. Endpoints enforce strict separation.
3. **Multi-Property Staff Scoping:** Staff members assigned to a specific hotel property are strictly restricted to that hotel's rooms, discounts, and reservations. Managers possess multi-property oversight.
4. **Authoritative Server Pricing:** Room rates, night multipliers, active promotional offers, and taxes are calculated authoritatively on the server; client-submitted totals are ignored.
5. **Concurrency & Double-Booking Protection:** Room availability assertions and reservation creations are serialized using pessimistic write locks (`@Lock(LockModeType.PESSIMISTIC_WRITE)`).
