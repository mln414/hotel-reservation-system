# LankaStay Hotel Reservation System — Setup Guide

This guide explains how to run the full LankaStay stack (Spring Boot backend + React/Vite frontend) on a local machine. Follow every section in order.

---

## Prerequisites

| Tool | Version | Download |
|------|---------|----------|
| **Java (JDK)** | 25 or later | https://adoptium.net |
| **MySQL** | 8.0 or later | https://dev.mysql.com/downloads/mysql/ |
| **Node.js** | 18 or later | https://nodejs.org |
| **npm** | Comes with Node.js | — |
| **Git** | Any recent | https://git-scm.com |

> **Windows tip:** After installing Java, make sure `JAVA_HOME` is set and `java -version` works in PowerShell.

---

## 1 — Clone the Repository

```bash
git clone <repository-url>
cd hotel-reservation-system
```

---

## 2 — Create the MySQL Database

Open MySQL Workbench or the `mysql` CLI and run:

```sql
-- Create the application database
CREATE DATABASE lankastay_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create an application user (recommended over using root)
CREATE USER 'lankastay_app'@'localhost' IDENTIFIED BY 'YourStrongPassword123!';
GRANT ALL PRIVILEGES ON lankastay_db.* TO 'lankastay_app'@'localhost';
FLUSH PRIVILEGES;
```

> **Note:** Keep the password you choose — you will use it in Step 3.

---

## 3 — Configure the Backend

The backend reads its database credentials from environment variables. You can set them in a `.env` file or export them in your shell.

### Option A — Set Environment Variables (PowerShell)

```powershell
$env:DB_URL       = "jdbc:mysql://localhost:3306/lankastay_db"
$env:DB_USERNAME  = "lankastay_app"
$env:DB_PASSWORD  = "YourStrongPassword123!"
```

### Option B — Edit `application.properties` directly (quick start)

Open `backend/src/main/resources/application.properties` and replace the relevant lines:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/lankastay_db
spring.datasource.username=lankastay_app
spring.datasource.password=YourStrongPassword123!
```

> ⚠️ **Do not commit real passwords to Git.** Use environment variables in shared environments.

### Bootstrap the First Admin Account (Optional but Recommended)

Set these once to auto-create the first MANAGER account on first startup:

```powershell
$env:BOOTSTRAP_ADMIN_EMAIL         = "admin@lankastay.com"
$env:BOOTSTRAP_ADMIN_TEMP_PASSWORD = "Admin@Temp123!"
```

After first login, change the password immediately via the management panel.

---

## 4 — Run the Backend

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

The backend starts at **`http://localhost:8080`**. You should see:

```
Started LankastayBackendApplication in X seconds
```

Flyway runs all database migrations automatically on startup — no manual SQL scripts needed.

---

## 5 — Run the Frontend

Open a **new terminal** (keep the backend running):

```powershell
cd frontend
npm install
npm run dev
```

The frontend starts at **`http://localhost:5173`** (or `5174` if 5173 is in use).

---

## 6 — Default Accounts

### Staff Accounts

| Role | How to create |
|------|--------------|
| **MANAGER** | Bootstrap env vars (Step 3) or create via `/api/v1/auth/register` using an existing MANAGER token |
| **RECEPTIONIST** | Created by MANAGER via management panel → Staff |
| **HOTEL_STAFF** | Created by MANAGER via management panel → Staff |

**Default login URL:** `http://localhost:5173/management/login`

### Customer Accounts

Customers self-register at `http://localhost:5173/register` or via the API:

```http
POST http://localhost:8080/api/v1/customer/auth/register
Content-Type: application/json

{
  "firstName": "Test",
  "lastName": "User",
  "email": "test@example.com",
  "password": "Test@1234!",
  "phone": "+94 77 000 0000"
}
```

---

## 7 — Port Summary

| Service | Default Port | URL |
|---------|-------------|-----|
| Spring Boot backend | `8080` | http://localhost:8080 |
| Vite dev frontend | `5173` | http://localhost:5173 |
| MySQL | `3306` | localhost:3306 |

If the frontend starts on port `5174`, update the CORS allowed origins in `application.properties`:

```properties
lankastay.security.allowed-origins=http://localhost:5174,http://localhost:5173
```

---

## 8 — Key API Endpoints (Quick Reference)

| Endpoint | Description |
|----------|-------------|
| `POST /api/v1/auth/login` | Staff login |
| `POST /api/v1/customer/auth/login` | Customer login |
| `GET  /api/v1/auth/me` | Staff session check |
| `GET  /api/v1/customer/auth/me` | Customer session check |
| `GET  /api/public/hotels` | Public hotel listing |
| `GET  /api/public/destinations` | Public destinations |
| `POST /api/v1/customer/reservations` | Create reservation (customer) |
| `GET  /api/v1/customer/reservations` | List customer reservations |
| `POST /api/v1/management/reservations` | Create reservation (staff) |
| `GET  /api/v1/management/reservations` | List all reservations (staff) |
| `POST /api/public/reviews` | Submit guest review |
| `GET  /api/public/reviews` | List public reviews |

---

## 9 — Project Structure

```
hotel-reservation-system/
├── backend/               ← Spring Boot application
│   ├── src/main/java/...  ← Controllers, Services, Entities
│   ├── src/main/resources/
│   │   ├── application.properties
│   │   └── db/migration/  ← Flyway SQL migrations (V1__, V2__, ...)
│   └── mvnw.cmd           ← Maven wrapper (Windows)
└── frontend/              ← React + Vite application
    ├── src/
    │   ├── context/       ← React contexts (auth, reservations, reviews, ...)
    │   ├── pages/         ← Page components
    │   ├── services/      ← API service modules (authApi, reservationApi, reviewApi, ...)
    │   └── utils/         ← Domain logic utilities
    └── vite.config.js
```

---

## 10 — Troubleshooting

### Backend won't start — "Access denied for user"
- Confirm the MySQL user and password match what is set in `application.properties` or environment variables.
- Re-run the `GRANT` statement from Step 2.

### Backend won't start — "Table doesn't exist" / Flyway errors
- Ensure the database `lankastay_db` was created before starting the backend.
- If using `JPA_DDL_AUTO=create`, Hibernate may conflict with Flyway — keep the default `update`.

### Frontend shows "Network Error" or 401 on every request
- Make sure the backend is running on port 8080.
- Check `frontend/vite.config.js` for the proxy target: it should point to `http://localhost:8080`.
- Ensure CORS allowed origins include the port your frontend is using.

### Customer cannot log in / session not persisting
- The frontend uses session cookies (`LANKASTAY_SESSION`). Ensure cookies are not blocked by the browser.
- Open DevTools → Application → Cookies and confirm `LANKASTAY_SESSION` is present after login.

### `.\mvnw.cmd` permission error on Windows
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\mvnw.cmd spring-boot:run
```

### Port 8080 / 5173 already in use
- Find and kill the process:
  ```powershell
  netstat -ano | findstr :8080
  taskkill /PID <PID> /F
  ```
- Or change the backend port: add `server.port=8081` to `application.properties` and update `vite.config.js` proxy accordingly.

---

## 11 — Verification Checklist

After startup, confirm the following work end-to-end:

- [ ] `http://localhost:5173` loads the LankaStay public home page
- [ ] `http://localhost:8080/api/public/hotels` returns JSON hotel data
- [ ] Customer registration at `/register` succeeds and creates a session
- [ ] Browsing hotels at `/hotels` shows hotel cards loaded from the backend
- [ ] Booking a room at `/booking/:roomId` goes through and the reservation appears in My Reservations
- [ ] Staff login at `/management/login` succeeds and the management dashboard loads
- [ ] Creating a reservation from the staff panel creates it in the database

---

*Last updated: September 2026 — LankaStay Team*
