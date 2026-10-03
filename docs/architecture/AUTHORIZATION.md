# Dashboard authentication authorization matrix

`ASSIGNED_SCOPE_ONLY` records the intended property boundary. The authentication foundation persists that boundary; future hotel-domain services must enforce it on each resource.

| Endpoint | Anonymous | MANAGER | HOTEL_STAFF | RECEPTIONIST |
|---|---|---|---|---|
| `GET /api/v1/auth/csrf` | ALLOW | ALLOW | ALLOW | ALLOW |
| `POST /api/v1/auth/login` | ALLOW | ALLOW | ALLOW | ALLOW |
| `GET /api/v1/auth/me` | DENY | ALLOW | ALLOW | ALLOW |
| `POST /api/v1/auth/change-initial-password` | DENY | SELF_ONLY | SELF_ONLY | SELF_ONLY |
| `POST /api/v1/auth/change-password` | DENY | SELF_ONLY | SELF_ONLY | SELF_ONLY |
| `POST /api/v1/auth/logout` | DENY | SELF_ONLY | SELF_ONLY | SELF_ONLY |
| `GET /api/v1/admin/staff` | DENY | ALLOW | DENY | DENY |
| `GET /api/v1/admin/staff/{id}` | DENY | ALLOW | DENY | DENY |
| `POST /api/v1/admin/staff` | DENY | ALLOW | DENY | DENY |
| `PATCH /api/v1/admin/staff/{id}` | DENY | ALLOW | DENY | DENY |
| `PATCH /api/v1/admin/staff/{id}/status` | DENY | ALLOW | DENY | DENY |
| `POST /api/v1/admin/staff/{id}/reset-password` | DENY | ALLOW | DENY | DENY |
| GET `/api/management/destinations/**` (including attractions) | DENY | ALLOW | ALLOW | ALLOW |
| POST/PUT/PATCH/DELETE `/api/management/destinations/**` (including attractions) | DENY | ALLOW | DENY | DENY |
| GET `/api/v1/management/discounts/**` | DENY | GLOBAL | ASSIGNED_SCOPE_ONLY | ASSIGNED_SCOPE_ONLY |
| POST/PUT `/api/v1/management/discounts/**` | DENY | GLOBAL | ASSIGNED_SCOPE_ONLY | DENY |
| DELETE `/api/v1/management/discounts/{id}` | DENY | ALLOW | DENY | DENY |
| GET `/api/public/discounts/validate` | ALLOW | ALLOW | ALLOW | ALLOW |
| Existing `POST /api/media/upload` | DENY | ALLOW | ASSIGNED_SCOPE_ONLY | DENY |

Management operations cannot target the acting manager or another `MANAGER`. Public staff registration does not exist.

Global destinations and attractions are manager-owned catalog data, not hotel-assigned resources.
Discount staff scope is reloaded from the active staff database row, requires an existing assigned hotel, and fails closed on null assignment.
Updates cannot change discount hotel ownership. Managers retain global (null-hotel) discounts.
Customer and staff reset requests use their separate auth namespaces; only hash-stored, unused, unexpired tokens for that namespace can reset passwords.
Retired tokenless, email-check, and development token lookup URLs return 404 in every profile.
