# LankaStay Database Schema & Migration Guide

## 1. Relational Database Overview

LankaStay utilizes **MySQL 8+** (`lankastay_db`) with database migrations managed authoritatively via **Flyway**.

### Core Schema Design Highlights:
- **Foreign Key Constraints:** Cascade deletion and integrity guarantees across hotels, rooms, physical room units, rates, offers, and reservations.
- **Pessimistic Concurrency Locking:** `rooms` rows are locked via `SELECT ... FOR UPDATE` during reservation creation to eliminate TOCTOU overbooking race conditions.
- **Unique Constraints:**
  - `customer_users(email)` & `staff_users(email)`: Prevent duplicate account registration.
  - `reviews(reservation_id)`: Enforces verified-stay policy (exactly one review per completed booking).
  - `discounts(code)`: Enforces promo code uniqueness.
  - `offer_hotels(offer_id, hotel_id)`: Prevents duplicate promotional attachments.

---

## 2. Flyway Migration History (V1 — V19)

| Version | Migration Script | Description & Purpose |
|---|---|---|
| **V1** | `V1__dashboard_authentication.sql` | Creates `staff_users` and `security_audit`; account roles are stored as strings. No accounts or passwords are seeded. |
| **V2** | `V2__hotel_management.sql` | Establishes `hotels`, amenities, photos, and hotel operational settings. |
| **V3** | `V3__customer_and_password_reset.sql` | Creates `customer_users` and `password_reset_tokens` with staff/customer token ownership. |
| **V4** | `V4__hotel_contact_fields.sql` | Conditionally adds `city`, `province`, `postal_code`, `email`, `phone`, and `website` to `hotels`. |
| **V5** | `V5__reservation_core.sql` | Creates `rooms`, `room_rates`, `reservations`, and `reservation_items`; reconciles legacy reservation fields and constraints. |
| **V6** | `V6__room_management_core.sql` | Adds room/rate constraints and indexes, `room_gallery`, and `room_name_snapshot` with backfills. |
| **V7** | `V7__rate_and_offer_management.sql` | Enhances `room_rates`; creates `offers`, `offer_hotels`, `offer_rooms`; adds reservation pricing/offer snapshots. |
| **V8** | `V8__review_management.sql` | Creates `reviews` and `review_photos`; management responses are columns on `reviews`. Completed-stay eligibility is enforced by application logic. |
| **V9** | `V9__customer_profile_audit.sql` | Widens `security_audit.event_type` to `VARCHAR(50)`. |
| **V10** | `V10__review_submission_history.sql` | Adds `reservations.review_submitted_at` and backfills it from existing reviews. |
| **V11** | `V11__physical_room_inventory.sql` | Creates `physical_rooms`, `physical_room_blocks`, and `reservations.assigned_physical_room_id`. |
| **V12** | `V12__reservation_physical_room_assignments.sql` | Connects reservations to allocated physical room instances upon check-in. |
| **V13** | `V13__complete_existing_hotel_inventory.sql` | Completes existing property operational fields and inventory; does not establish a production deployment. |
| **V14** | `V14__restore_existing_hotel_photos.sql` | Populates curated imagery metadata for seeded hotel properties. |
| **V15** | `V15__publish_three_booking_ready_hotels.sql` | Updates the demo publication set to three booking-ready hotels and associated inventory. |
| **V16** | `V16__restore_discount_table.sql` | Establishes the authoritative `discounts` promotional engine table. |
| **V17** | `V17__align_discount_value_type.sql` | Changes `discounts.discount_value` from DECIMAL to `DOUBLE NOT NULL` to match the legacy Java Double mapping. |
| **V18** | `V18__destination_management.sql` | Implements `destinations` and `attractions` catalog tables for geographic discovery. |
| **V19** | `V19__customer_session_version.sql` | Adds `customer_users.session_version BIGINT NOT NULL DEFAULT 0` for password-reset session invalidation. |

## 3. Immutable history and fresh installations

The maintained personal lineage uses V4 hotel contact fields and V5 reservation core.
The alternate V4 destination and V5 room-rate/discount files must not coexist in the
active migration directory. They were not the V4/V5 scripts applied to the verified database.
Databases that used that alternate lineage need an independently reviewed migration plan.

Applied V4–V18 files remain byte-for-byte unchanged. Their checksums must continue to
match `flyway_schema_history`; do not use `repair`, edit applied SQL, or renumber history
to conceal a mismatch. V19 is pending on the live database until an approved deployment.

Flyway **12.4.0** supports cumulative baseline migrations. An empty MySQL database
uses `B18__fresh_install_schema.sql` (28 schema tables, no account/business data), then
V19. Existing databases with applied migrations ignore B18 and continue their own history.
The schema snapshot avoids replaying the known duplicate-object sequence in V5/V6.
It is not the `flyway baseline` command and does not stamp an empty database without
creating its schema. Once used, B18 is immutable too; evolve through later migrations.

The snapshot excludes `flyway_schema_history`, user data, passwords, uploaded files,
and existing AUTO_INCREMENT counters. It reflects the verified active V18 schema,
including fields previously maintained by Hibernate. Historical V13–V15 data updates
are not replayed on a fresh baseline. The existing catalog initializer remains separate;
this is not a production-data backup or a guarantee of a fully populated demo inventory.

Real-MySQL verification: `powershell -NoProfile -File scripts/qa/verify_mysql_migrations.ps1`.
It creates a separate loopback-only MySQL 8 process under ignored `backend/target/`,
initializes an empty test database, runs B18/V19, verifies restart idempotence, and stops
the test server. Against the existing database it runs Flyway validation only, allowing
pending migrations. It does not apply V19, rotate live credentials, or remove live data.
The ignored sandbox files are retained for diagnosis. Never point a fresh test at the live port.
