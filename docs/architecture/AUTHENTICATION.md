# LankaStay dashboard authentication

The dashboard uses a server-side Spring Security session. The browser receives only an `HttpOnly` session cookie; React stores no access or refresh credential. Mutating requests require the CSRF token exposed by `GET /api/v1/auth/csrf`.

## Local bootstrap

1. Create the MySQL database and a least-privileged application database user.
2. Copy `.env.example` to the repository-root `.env` and set the local database credentials there. The root launch scripts and a direct `cd backend; .\mvnw.cmd spring-boot:run` both load it. OS/IDE environment variables take precedence when supplied.
3. Set `SESSION_COOKIE_SECURE=false` only for local HTTP. Production HTTPS must use `true`.
4. Start the backend once with `INITIAL_MANAGER_EMAIL` and an 8–128 character policy-compliant `INITIAL_MANAGER_PASSWORD`.
5. Sign in and change that temporary password immediately.
6. Remove both bootstrap variables after the manager exists. Startup will never create a second manager automatically.

The frontend is intentionally fixed to `http://localhost:5174` by `frontend/vite.config.js`.
The default local CORS list permits the loopback forms of ports 5173 and 5174 because
both are used by this repository. Override `CORS_ALLOWED_ORIGINS` with only the exact
trusted HTTPS frontend origin in production.

Changing `INITIAL_MANAGER_PASSWORD` after that email exists does not change that
manager's password. Use the authenticated manager reset workflow for staff accounts.
For a lost bootstrap-manager credential in a disposable local database, delete and
recreate that local database before rerunning bootstrap; the application deliberately
has no startup password-overwrite backdoor.

The raw bootstrap or generated staff password is never logged or stored. Only its BCrypt hash is persisted.

## Authentication flow

```text
Manager provisions staff
        |
        v
secure random temporary password --> return once to manager
        |                            (never persisted or logged)
        v
BCrypt hash + must_change_password=true
        |
        v
staff login --> restricted authenticated session
        |
        v
initial password change --> normal role-authorized dashboard session
```

See `AUTHORIZATION.md` for the implemented endpoint matrix. Assigned hotel IDs are persisted as authorization context for future hotel-domain service checks; this task does not add unrelated hotel CRUD.
