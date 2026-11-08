# CasaCircuit

Indian furniture and electronics commerce platform. Next.js 16 App Router, strict TypeScript,
PostgreSQL 18 + Prisma 7, Redis/BullMQ, GST-inclusive pricing and an admin surface designed around
Indian consumer-protection, DPDP and e-commerce disclosure rules.

> **Status: Phase 2 (foundation) complete. Not production-ready.**
> There is no authentication, catalogue, cart, checkout, payment or admin UI yet. The seeded legal
> documents are unpublished placeholders, not policies. See [Implementation status](docs/08-IMPLEMENTATION-STATUS.md).

---

## Stack

| Layer        | Choice                                                       |
| ------------ | ------------------------------------------------------------ |
| Runtime      | Node.js 24                                                   |
| Framework    | Next.js 16.4.5 (App Router, RSC, standalone output)          |
| Language     | TypeScript 5.9 strict (`noUncheckedIndexedAccess`, no `any`) |
| UI           | Tailwind CSS 4, shadcn-style primitives, Lucide              |
| Data         | PostgreSQL 18, Prisma 7.10 with `@prisma/adapter-pg`         |
| Cache/queues | Redis 8, ioredis, BullMQ (worker not yet implemented)        |
| Validation   | Zod 4                                                        |
| Money        | Decimal.js, `DECIMAL(14,2)`, half-up paisa rounding          |
| Tests        | Vitest, Testing Library, Playwright, k6                      |
| Delivery     | Docker multi-stage, GitHub Actions                           |

## Local setup

Prerequisites: Node.js 24, PostgreSQL 18, and optionally Redis (the app can run without Redis in
development when `REDIS_REQUIRED=false`; production refuses that setting).

```bash
cp .env.example .env
# Edit DATABASE_URL, SHADOW_DATABASE_URL and the generated secrets.
npm ci
npx prisma migrate deploy     # or: npx prisma migrate dev
npm run prisma:seed           # reference data + optional dev admin
npm run dev
```

Open http://localhost:3000. Health probes:

- `GET /api/health` — liveness
- `GET /api/health/ready` — PostgreSQL + cache readiness

### Seed contents

The seed is idempotent and deliberately contains **no fake products, orders, reviews or legal
identity**. It creates:

- 44 permission codes and 8 operational roles
- Furniture/electronics category taxonomy
- Attribute definitions and options
- Navigation menus and footer links
- Store settings whose values come from environment variables
- Eight **draft, unpublished** legal-document shells marked “pending legal review”
- A development SUPER_ADMIN only when `BOOTSTRAP_ADMIN_EMAIL` and `BOOTSTRAP_ADMIN_PASSWORD` are set

## Verification

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e -- --project=chromium   # requires Playwright browsers
BASE_URL=http://localhost:3000 npm run test:load
```

Verified on 8 November 2026 against PostgreSQL 18.6: both migrations apply, the seed runs twice
without duplicates, 28 unit tests pass, and lint/typecheck/build are clean. Docker is unavailable on
the development machine, so the image build and compose stack have **not** been executed locally.

## Docker

```bash
docker compose up --build
```

The compose file is a local production-like stack, not a deployment template. Replace all placeholder
secrets, put TLS in front of the web service, and set an HTTPS `APP_URL`. The one-shot `migrate`
service runs before the web container starts. Seed manually:

```bash
docker compose run --rm --entrypoint "npx tsx prisma/seed.ts" migrate
```

## Repository layout

```text
src/app/                  App Router routes, layouts, server actions
src/components/           UI primitives and layout/marketing components
src/lib/                  env, prisma, redis/cache, crypto, money/GST, errors, permissions
src/generated/prisma/     generated client (gitignored)
prisma/schema.prisma      authoritative data model
prisma/migrations/        SQL migrations, including constraints and FTS trigger
prisma/seed.ts            reference-data seed
docs/                     research, architecture, database, API, security, legal, roadmap, status
tests/e2e, tests/load     Playwright and k6 suites
```

## Security baseline in place

- Strict server-side environment validation, deferred to server start so builds do not need secrets
- Opaque-token helpers (SHA-256 hashing, HMAC OTP pepper, AES-256-GCM MFA-secret encryption)
- CSP with per-request nonce, HSTS outside loopback, frame denial, permissions policy, request IDs
- Origin checks for unsafe methods as defence in depth
- Argon2id dependency and password-hashing defaults ready for the auth phase
- Database check constraints preventing negative money/quantity and over-reservation
- Dependency audit job; secrets excluded from git and Docker build context

These are foundations, not a security certification. Authentication, CSRF tokens, rate limiting on
all endpoints, payment signature verification and audit logging arrive in later phases.

## Legal caveat

The compliance matrix in [`docs/06-LEGAL-COMPLIANCE.md`](docs/06-LEGAL-COMPLIANCE.md) records
researched obligations and dates, including the Consumer Protection (E-Commerce) (Amendment) Rules,
2026 (effective 1 January 2027) and DPDP Rules, 2025. It is engineering research, not legal advice.
Before launch, counsel must review every policy, the business must supply its verified legal name,
registered address, GSTIN, grievance officer and customer-care details, and the team must complete
the open items in that document.
