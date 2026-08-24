# Financi

> Leia em [Português](README.pt-BR.md).

Personal finance tracker — a REST API plus a mobile app, both built from scratch as a
portfolio project. It records income, expenses, transfers between accounts, installment
purchases, recurring entries, per-category budgets and savings goals.

It depends on no third-party integration: the data is entered by the user and lives in a
database the user controls.

## Stack

| Layer | Technologies |
| --- | --- |
| Backend | Node.js 20, TypeScript, Express, Prisma, PostgreSQL |
| Mobile | React Native, Expo, Expo Router |
| Validation | Zod |
| Auth | email + password (bcrypt), JWT access token + rotating refresh token |
| Testing | Jest (unit), Supertest (E2E against a real database), StrykerJS (mutation) |
| Quality | ESLint, Prettier, SonarQube |
| CI/CD | GitHub Actions, deployed to Render with Postgres on Neon |

## Domain model

A `User` owns `Account`s (wallet, checking account, credit card) and `Category`s (typed as
INCOME/EXPENSE). Every `Transaction` is a single ledger entry tied to one account, and it may:

- belong to a `Recurrence` — a template with an interval in months, whose occurrences are
  pre-generated in batch within a rolling 12-month window;
- be part of an installment plan — N transactions sharing an `installmentGroupId`, with the
  rounding remainder landing on the last one;
- form a transfer — a pair of transactions sharing a `transferGroupId`, an outflow on the
  source account and an inflow on the destination, excluded from every income/expense
  aggregate;
- carry free-form `Tag`s, created at write time.

`Budget` is a ceiling per category per month. `Goal` accumulates `GoalContribution`s and its
progress is always derived, never persisted.

The `paid` field separates what actually happened from what is merely scheduled — future
recurrence occurrences and unmatured installments are the pending side.

## Running locally

Prerequisites: Node.js 20, Docker.

The local Postgres runs on port **5439** so it does not collide with a native installation.

```bash
docker compose up -d
```

### Backend

```bash
cd apps/backend && cp .env.example .env && npm ci && npm run prisma:migrate:dev && npm run dev
```

The API comes up at `http://localhost:3000`. The OpenAPI specification lives in
`apps/backend/openapi.yaml` and is served with Swagger UI at `/docs` outside production.

### Mobile

```bash
cd apps/mobile && cp .env.example .env && npm ci && npm start
```

Point `EXPO_PUBLIC_API_URL` at the local backend and open it through Expo Go.

## Testing and quality

```bash
npm run test:unit
```

```bash
npm run test:e2e
```

```bash
npm run test:coverage -- --runInBand
```

The E2E tests run against a real Postgres database (`financi_test`), not against mocks.
`npm run test:mutation` runs StrykerJS over the business logic.

## Architecture

A monorepo with `apps/backend` and `apps/mobile`. The backend is organized by domain rather
than by file type: each folder under `src/modules/<domain>/` carries its own routes,
controller, service and schema. Cross-cutting code lives in `src/config/`, `src/middlewares/`
and `src/utils/`.

## License

MIT — see [LICENSE](LICENSE).
