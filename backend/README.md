# Mitra Maheshwari — Backend

Modular monolith API (Node.js + Express 5 + TypeScript + PostgreSQL).

## Stack

- Express 5, TypeScript
- PostgreSQL via `pg` (node-postgres)
- Migrations via `node-pg-migrate` (`database/migrations/`)
- Validation via Zod, auth via JWT
- No Prisma, no Docker, no Firebase

## Architecture

```
HTTP Request
  -> Route
  -> Validation Middleware
  -> Authentication / Authorization Middleware
  -> Controller (calls service, no business logic, no SQL)
  -> Service (business logic)
  -> Repository (PostgreSQL queries only)
  -> PostgreSQL
```

## Structure

- `src/config/` — env (Zod-validated) + pg pool
- `src/middleware/` — authenticate, authorize, validate, error handler
- `src/modules/{auth,registration,family,admin}/` — controller, service, repository, route, schema
- `src/routes/index.ts` — mounted by `app.ts` under `/api`
- `src/app.ts` — creates the Express app
- `src/server.ts` — starts the server only
- `database/migrations/` — node-pg-migrate migrations

## Scripts

- `npm run dev` — start with tsx watch
- `npm run build` / `npm start` — compile + run from `dist/`
- `npm run migrate` — run node-pg-migrate
