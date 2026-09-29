# Zedu Tasks — Agent Guide

## Project map

- `frontend/`: React 18 + TypeScript + Vite client.
- `backend/`: FastAPI + SQLAlchemy REST API.
- `docker-compose.yml`: production-like local and Dokploy stack.
- MySQL is the production database. Backend tests use an isolated SQLite database.

## Working rules

1. Read this file and the closest nested `AGENTS.md` before editing.
2. Keep changes scoped to the request; do not rewrite unrelated code.
3. Preserve the API contract in `backend/app/schemas.py`. If it must change, update the frontend types and tests in the same change.
4. Never commit secrets. Add new configuration through environment variables and document defaults in `.env.example`.
5. Database changes must be represented in SQLAlchemy models. For destructive or production schema changes, add an Alembic migration before deployment.
6. Keep UI components typed, accessible, responsive, and usable with a keyboard. Every form input needs a visible label or an accessible name.
7. Return useful HTTP status codes and concise error messages. Validate data at the API boundary.

## Required validation

Run the checks relevant to every changed area before finishing:

```bash
# Backend
cd backend
pytest -q

# Frontend
cd frontend
npm run test -- --run
npm run build

# Deployment configuration (from repository root)
docker compose config
```

- Add or update API tests for every new or changed endpoint, including one failure case.
- Add frontend tests for new user-visible behavior when practical.
- Do not consider work complete with failing tests, TypeScript errors, or an invalid Compose file.
- If a check cannot run, report the exact command and reason.

## API conventions

- All application routes live below `/api`.
- JSON uses `snake_case`, ISO-8601 dates, and UTC timestamps.
- Collection routes support filtering through query parameters.
- `DELETE` returns `204`; creation returns `201`; missing records return `404`.
- `/health` is reserved for container health checks and must not depend on authentication.

## Definition of done

- Code, tests, and documentation agree.
- Docker images build without development-only assumptions.
- The app starts with `docker compose up --build` after copying `.env.example` to `.env`.
- No credentials, generated build output, or dependency directories are committed.
