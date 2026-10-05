# LankaStay REST API Overview

## 1. Authentication & Session Architecture

- **Session Transport:** HTTP cookie `LANKASTAY_SESSION` with flags `HttpOnly=true`, `SameSite=Lax`.
- **CSRF Protection:** Double-Submit Cookie CSRF protection. Mutating requests (`POST`, `PUT`, `PATCH`, `DELETE`) require the `X-XSRF-TOKEN` header matching the `XSRF-TOKEN` cookie.
- **CSRF Token Retrieval:** `GET /api/v1/auth/csrf` (unauthenticated).

---

## 2. API Endpoint Directory

### Public Discovery Endpoints (Unauthenticated)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/hotels/destinations` | List all active destinations |
| `GET` | `/api/v1/hotels/destinations/{id}` | Destination details & nearby attractions |
| `GET` | `/api/v1/hotels` | Search & filter hotel properties |
| `GET` | `/api/v1/hotels/{id}` | Detailed hotel overview with amenities and photos |
| `GET` | `/api/v1/hotels/{id}/rooms` | Available room types for a hotel |
| `GET` | `/api/v1/hotels/rooms/{id}` | Room details, rates, and occupancy rules |
| `GET` | `/api/v1/hotels/{id}/reviews` | Approved guest reviews for a hotel |
| `GET` | `/api/v1/discounts/validate` | Validate promo code for nights and hotel |

### Customer Authentication & Profile (`/api/v1/customer/**`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/v1/customer/auth/register` | Public | Register new guest account |
| `POST` | `/api/v1/customer/auth/login` | Public | Authenticate customer session |
| `POST` | `/api/v1/customer/auth/logout` | Customer | Invalidate customer session |
| `GET` | `/api/v1/customer/auth/me` | Customer | Current customer session profile |
| `PUT` | `/api/v1/customer/profile` | Customer | Update customer contact & details |
| `POST` | `/api/v1/customer/profile/change-password` | Customer | Change password while authenticated |

### Customer Reservations & Reviews
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/v1/customer/reservations` | Customer | Create booking with pessimistic room lock |
| `GET` | `/api/v1/customer/reservations` | Customer | List authenticated customer's reservations |
| `GET` | `/api/v1/customer/reservations/{id}` | Customer | View reservation details (IDOR protected) |
| `POST` | `/api/v1/customer/reservations/{id}/cancel` | Customer | Cancel eligible upcoming reservation |
| `POST` | `/api/v1/customer/reviews` | Customer | Submit review for completed stay |
| `GET` | `/api/v1/customer/reviews/eligible` | Customer | List completed stays awaiting review |

### Staff Authentication & Administration (`/api/v1/auth/**`, `/api/v1/admin/**`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/login` | Public | Authenticate staff member |
| `POST` | `/api/v1/auth/logout` | Staff | Invalidate staff session |
| `GET` | `/api/v1/auth/me` | Staff | Current staff profile & role |
| `POST` | `/api/v1/auth/forgot-password` | Public | Initiate token-based password reset |
| `POST` | `/api/v1/auth/reset-password` | Public | Complete password reset via token |
| `GET` | `/api/v1/admin/staff` | Manager | List all staff members across hotels |
| `POST` | `/api/v1/admin/staff` | Manager | Create staff account with temp credentials |
| `PATCH` | `/api/v1/admin/staff/{id}/status` | Manager | Activate or disable staff account |

### Management Operations (`/api/management/**`, `/api/v1/management/**`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/management/hotels` | Staff | List hotels (scoped by staff assignment) |
| `PUT` | `/api/management/hotels/{id}` | Manager | Update hotel details & amenities |
| `GET` | `/api/management/rooms` | Staff | List room types for assigned hotel |
| `POST` | `/api/management/rooms` | Staff | Create new room type |
| `GET` | `/api/management/physical-rooms` | Staff | List physical room units & maintenance states |
| `POST` | `/api/management/destinations` | Manager | Create new travel destination |
| `DELETE` | `/api/management/destinations/{id}` | Manager | Delete destination |
| `POST` | `/api/management/destinations/{id}/attractions` | Manager | Add nearby attraction |
| `GET` | `/api/v1/management/discounts` | Staff | List discount promo codes for property |
| `POST` | `/api/v1/management/discounts` | Staff | Create property discount code |
| `POST` | `/api/media/upload` | Staff | Upload raster destination/hotel image |
