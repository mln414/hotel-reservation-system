# Contributing to LankaStay Hotels & Resorts

Thank you for contributing to the LankaStay Hotel Reservation System university project! This document outlines code standards, branch conventions, and pull request guidelines.

---

## 1. Branch Naming Conventions

The maintained full-stack branch of the personal repository
`LakshanHMK/hotel-reservation-system` is `main`, tracking `origin/main`.
`java-only` is a legacy integration branch, not the full-stack development base.
The university/group repository is separate; this workflow does not modify its remote.
For new work, branch from the maintained personal `main` using descriptive prefixes:

| Branch Type | Format | Example |
|---|---|---|
| **Feature** | `feature/<short-description>` | `feature/customer-reservation` |
| **Bug Fix** | `fix/<short-description>` | `fix/reservation-validation` |
| **Documentation** | `docs/<short-description>` | `docs/readme-update` |
| **Testing** | `test/<short-description>` | `test/reservation-service` |
| **Chore / Refactor** | `chore/<short-description>` | `chore/clean-repository` |

---

## 2. Commit Message Guidelines

We follow the **Conventional Commits** specification:

```
<type>(<optional-scope>): <concise-description>
```

### Approved Types:
- `feat`: A new user-facing or API feature (e.g., `feat(booking): add customer reservation flow`).
- `fix`: A bug fix (e.g., `fix(concurrency): prevent invalid room double-booking`).
- `test`: Adding or correcting automated tests (e.g., `test(auth): add password policy unit tests`).
- `docs`: Documentation updates only (e.g., `docs(setup): improve local MySQL instructions`).
- `refactor`: Code restructuring without functional changes (e.g., `refactor(dto): extract discount request records`).
- `chore`: Maintenance tasks, dependencies, or Git configuration (e.g., `chore(git): harden root gitignore`).

---

## 3. Development & Pull Request Workflow

1. **Clone & Branch:**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/your-feature-name
   ```

2. **Implement & Test Locally:**
   - Verify backend: `cd backend && .\mvnw.cmd test`
   - Verify frontend: `cd frontend && npm run test:security && npm run build`

3. **Check Secret Hygiene:**
   - Never commit `.env` files, API keys, private passwords, or local certificates.
   - All runtime variables must be supplied via `.env` based on `.env.example`.

4. **Open a Pull Request:**
   - Fill out the `.github/PULL_REQUEST_TEMPLATE.md`.
   - Ensure all automated CI checks pass.
   - Request review from at least one peer before merging.
