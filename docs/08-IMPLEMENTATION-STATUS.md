# Implementation Status

**Last verified:** 8 November 2026
**Phase:** 4 of 14 — product catalog complete
**Production readiness:** not ready; authentication and catalogue exist, but no cart, checkout, payment or order workflow exists yet

This document records what was actually executed, not what was merely written.

---

## 1. Verification log

Environment: Node.js 24.18.0, PostgreSQL 18.6 (isolated local cluster), Redis unavailable,
Docker unavailable. Integration tests use a dedicated `ecomm_test` database; no development data is
touched.

| Check                           | Command                         | Result                                                       |
| ------------------------------- | ------------------------------- | ------------------------------------------------------------ |
| Schema syntax                   | `npx prisma validate`           | ✅ valid                                                     |
| Initial + constraints migration | `npx prisma migrate dev`        | ✅ applied to clean DB                                       |
| Test database migration         | `npm run test:integration`      | ✅ `ecomm_test` created/migrated automatically               |
| Client generation               | `npx prisma generate`           | ✅ generated to `src/generated/prisma`                       |
| Seed idempotency                | `npm run prisma:seed`           | ✅ repeat run produced no duplicates                         |
| TypeScript                      | `npm run typecheck`             | ✅ clean                                                     |
| ESLint                          | `npm run lint`                  | ✅ 0 errors, 0 warnings                                      |
| Prettier                        | `npm run format:check`          | ✅ all files formatted                                       |
| Unit tests                      | `npm test`                      | ✅ 8 files, 48 tests                                         |
| Integration tests               | `npm run test:integration`      | ✅ 4 files, 33 tests                                         |
| Production build                | `npm run build`                 | ✅ Next 16.4.5, 81 route entries                             |
| Dev server                      | `npm run dev`                   | ✅ storefront, auth pages, catalogue pages, API routes, CSP  |
| Live auth smoke                 | `curl` against `localhost:3000` | ✅ register, verification gate, login, session, CSRF, logout |
| Live catalogue smoke            | `curl` against `localhost:3000` | ✅ product page/JSON-LD, API, facets, brand, sitemap         |
| Readiness                       | `GET /api/health/ready`         | ✅ `database: ok`, `cache: ok` (memory fallback)             |
| Docker image                    | `docker build`                  | ⚠️ not run — Docker missing on machine                       |
| Compose stack                   | `docker compose up`             | ⚠️ not run — Docker missing on machine                       |
| Playwright                      | `npm run test:e2e`              | ⚠️ browsers not installed on machine                         |
| k6                              | `npm run test:load`             | ⚠️ k6 not installed on machine                               |
| Redis rate-limit backend        | Redis-backed cache              | ⚠️ not run — Redis missing; memory fallback used             |
| Real email/SMS providers        | Resend/MSG91/Twilio sandbox     | ⚠️ not run — console adapters used                           |
| HTTPS production deployment     | Browser against deployed origin | ⚠️ not run — cookie flags covered by simulated env tests     |

Database counts after seed: 44 permissions, 8 roles, 12 categories, 8 draft legal versions,
6 attribute definitions, 9 settings, 3 navigation menus.

---

## 2. What exists

### Data model

`prisma/schema.prisma` contains 98 models and 57 enums covering:

- identity, sessions, MFA, roles/permissions, seller seam
- catalogue, variants, attributes, images, price history, sponsored placements, relations
- warehouses, inventory, reservations, stock ledger, purchase orders, receipts, transfers
- carts, wishlist, comparison, coupons, promotions
- verified reviews, review votes/reports, product Q&A
- orders, snapshots, payments, transactions, webhooks, refunds, invoices, shipments
- returns, return items/history, support tickets/messages, grievances
- legal documents/versions/acceptance, consent, privacy requests, compliance audits
- CMS pages, banners, navigation, blog, FAQs, stores, redirects, settings
- audit log, transactional outbox, idempotency keys, notifications, email/SMS logs, daily analytics

Raw migration adds:

- full-text search trigger and GIN index on `Product.searchVector`
- trigram indexes when `pg_trgm` is available (skipped gracefully on minimal PostgreSQL installs)
- partial indexes for active products, sessions, carts, reservations and outbox polling
- one-default-variant partial unique index
- check constraints for non-negative money/quantity, rating ranges, reservation ≤ on-hand,
  cancellation/return quantities ≤ ordered quantity, refunds ≤ paid

### Application foundation

- `src/lib/env.ts` — Zod environment contract; strict in production, deferred during build;
  loopback HTTP allowed only for local containers; blank `.env` values treated as absent
- `src/lib/prisma.ts` — singleton Prisma client with `PrismaPg` adapter
- `src/lib/redis.ts` + `src/lib/cache.ts` — Redis client, memory fallback only when
  `REDIS_REQUIRED=false`, cache/rate-limit interface
- `src/lib/logger.ts` — Pino JSON/pretty logging with redaction
- `src/lib/crypto.ts` — opaque tokens, SHA-256 hashing, HMAC OTP pepper, AES-256-GCM secret encryption
- `src/lib/money.ts` — Decimal money, GST extraction/splitting, invoice aggregation
- `src/lib/permissions.ts` — 44 permission codes, 8 roles, wildcard checks
- `src/lib/errors.ts` — typed application errors and public error mapping
- `src/lib/slug.ts`, `src/lib/pagination.ts`, `src/lib/utils.ts`
- `src/instrumentation.ts` — fails fast on invalid runtime configuration
- `src/proxy.ts` — CSP nonce, security headers, request ID, origin check for unsafe methods
- health, robots, sitemap, 404 and error boundaries
- Dockerfile (deps/builder/migrator/runner), compose stack, GitHub Actions CI, Playwright and k6 configs

### Authentication and authorization

- `src/lib/auth/passwords.ts` — Argon2id (64 MiB, 3 iterations, parallelism 1, 32-byte hash),
  length policy, common-password blocklist, rehash detection, constant-work dummy verification
- `src/lib/auth/sessions.ts` — DB-backed opaque sessions; SHA-256 token hashes only; sliding idle
  window; customer 7-day idle / 30-day absolute; staff 30-minute idle / 12-hour absolute; rotation,
  revocation, ownership-scoped session listing, RBAC asserts, SUPER_ADMIN wildcard
- `src/lib/auth/cookies.ts` — `cc_session` / `cc_staff_session` HttpOnly cookies, readable
  `cc_csrf` / `cc_staff_csrf` companions, `Secure` + `__Host-` when production is served over HTTPS,
  SameSite=Lax, cross-kind cookie cleanup
- `src/lib/auth/guards.ts` — cached per-request actor resolution, permission guards, form/header CSRF
- `src/lib/auth/tokens.ts` — hashed verification/reset/OTP tokens, atomic single-use consumption,
  attempt counters, invalidation of outstanding tokens
- `src/lib/auth/rate-limit.ts` — per-IP and per-identity fixed windows; identifiers hashed before
  reaching the cache; `Retry-After` surfaced on 429
- `src/lib/auth/audit.ts` — stable security event names and append-only `AuditLog` writes that never
  break the user-facing operation
- `src/lib/auth/mfa.ts` — TOTP generation/verification, AES-256-GCM secret storage, 10 single-use
  Argon2id-hashed recovery codes
- `src/modules/auth/*` — register, login, logout, email verification/resend, phone OTP request/verify,
  password forgot/reset/change, MFA challenge/setup/enable/verify, profile update, session
  list/revoke, privilege-change session revocation
- `src/lib/notifications/*` — Resend/console email adapter, MSG91/Twilio/console SMS adapter,
  escaped HTML templates; console providers deliberately never log tokens or OTP codes
- `src/app/api/v1/auth/*`, `src/app/api/v1/account/*`, `src/app/api/v1/admin/whoami` — REST surface
- `src/app/(storefront)/(login|register|forgot-password|reset-password|verify-email|account)/` —
  accessible forms, inline MFA challenge/setup, profile/password/session management, sign-out
- `src/app/admin/` — staff-only shell, MFA enforcement, permission-checked dashboard, 403 state
- `src/app/(storefront)/auth-actions.ts` — server actions with hidden CSRF tokens and validation
- `tests/integration/` — dedicated database lifecycle (create, `prisma migrate deploy`, truncate),
  factories, and 27 security integration tests

### Phase 3 acceptance mapping

| Requirement                      | Evidence                                                                         |
| -------------------------------- | -------------------------------------------------------------------------------- |
| Register/login/logout            | live smoke + integration session lifecycle                                       |
| Email verification               | integration single-use token test; login blocked until verified                  |
| Password reset                   | integration replay rejection + all-session revocation                            |
| Phone OTP adapters               | console SMS adapter; integration OTP success/exhaustion                          |
| Session rotation/revocation      | integration rotation, logout, privilege-change revocation                        |
| CSRF                             | missing/wrong token rejected in tests and live smoke; token rotates              |
| Argon2id                         | hash prefix and parameter checks in registration test                            |
| RBAC guards                      | customer/staff denial, granted permission, SUPER_ADMIN wildcard                  |
| Admin MFA                        | TOTP setup/enable/verify and one-time recovery code tests                        |
| Audit log                        | all auth mutations emit stable events; verified rows written                     |
| Rate limiting                    | per-IP/identity login limit and OTP attempt exhaustion                           |
| Account pages                    | `/account` renders profile, password, sessions and sign-out                      |
| No enumeration                   | generic login/recovery responses; duplicate registration is a 409                |
| Production cookie flags          | simulated production env asserts `Secure`, `HttpOnly`, `SameSite=Lax`, `__Host-` |
| Admin rejects missing permission | admin route 401/403/200 tests; customer `/admin/whoami` returns 403              |
| Session fixation/IDOR            | rotation invalidates old token; cross-user revoke returns 404                    |

### Product catalog

- `prisma/schema.prisma` — categories with materialised `path`/`level`, brands, attributes and
  options, category-attribute assignments, products, variants, variant attribute values, images,
  specifications, product attribute values and immutable `ProductPriceHistory`; one-default-variant
  partial unique index
- `src/modules/catalog/catalog.schema.ts` — Zod contracts for every catalogue input plus the
  documented public query contract (brand, price, rating, stock, discount, origin, `attr.<code>`,
  sort, pagination)
- `src/modules/catalog/catalog.repository.ts` — explicit selects/includes; public card select strips
  `costPrice`; published-only product, category and brand queries; sitemap query
- `src/modules/catalog/category.service.ts` — create/update/delete, archive, active-only tree,
  transactional reparenting that rewrites descendant paths and levels, descendant-cycle rejection,
  category-attribute assignment
- `src/modules/catalog/brand.service.ts` and `attribute.service.ts` — CRUD, slug generation,
  activation, option management and audit events
- `src/modules/catalog/product.service.ts` — product/variant/image/specification/attribute CRUD,
  unique SKU/slug enforcement, one-default-variant enforcement, immutable initial and changed price
  history, variant-matrix generation, publish/archive, catalogue-version bumps and audit events
- `src/modules/catalog/matrix.ts` — deterministic cartesian variant combinations and sanitised SKUs
- `src/modules/catalog/publish.ts` — pure Legal Metrology and Consumer Protection publish gate:
  HSN/GST, tax-inclusive pricing, country of origin, manufacturer/importer, packer, net quantity,
  unit of measure, unit sale price, consumer care, seller legal name/registered address/contact,
  images, active priced variants, MRP ≥ selling price and required category attributes
- `src/modules/catalog/search.service.ts` — `SearchProvider` seam with the PostgreSQL provider;
  weight-ranked FTS (`name` > keywords > short description > description), optional `pg_trgm`
  typo-tolerant matching, brand/price/attribute/origin/stock/discount filters, facet counts,
  suggestions, category pages and related products
- `src/modules/catalog/catalog.presenter.ts` — public and admin views, tax-inclusive price summary,
  30-day lowest-price marketing rule and declaration projection
- `src/modules/catalog/catalog.seo.ts` — canonical metadata, Product JSON-LD, AggregateOffer for
  variants, AggregateRating only when verified reviews exist, BreadcrumbList and ItemList
- `src/app/api/v1/admin/{categories,brands,attributes,products,variants}` — permission-gated admin
  REST routes (`catalog:read`, `catalog:write`, `catalog:publish`, `catalog:delete`) with CSRF checks
  on mutations, including variant matrix generation, price history and publish/archive
- `src/app/api/v1/{products,categories,brands,search/suggest}` — public read APIs with cache headers
  and ETag revalidation on product detail
- `src/app/admin/catalog/*` — server-rendered overview, category tree, brands, attributes, product
  list/new/detail, variants, matrix, images, specifications, product attributes, price history and
  publish/archive/delete controls; every page permission-gates
- `src/app/(storefront)/{products,categories,brands,search}` — published-only listing, product
  detail with gallery/variant picker/declarations/specifications, category tree, brand pages, filters,
  pagination and JSON-LD; `/search` redirects to the canonical `/products` listing
- `src/app/sitemap.ts` — dynamic sitemap containing only published products, active categories and
  active brands
- `tests/integration/catalog.integration.test.ts` + `catalog-factories.ts` — dedicated-database
  catalogue integration suite; `tests/unit/catalog-*.test.ts` — matrix, publish, URL and SEO units

### Phase 4 acceptance mapping

| Requirement                          | Evidence                                                                                                        |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| Category tree and safe reparenting   | integration test builds a three-level tree, moves a subtree and asserts rewritten paths/levels and cycle block  |
| Variant matrix                       | integration test creates 4 combinations idempotently; unit test asserts deterministic keys, labels and SKUs     |
| Attribute and brand filters/facets   | integration test asserts attribute filtering, brand filtering, price filtering, facet counts and category page  |
| Price history                        | integration test closes the previous window and records the new price; live product rendered the price summary  |
| Publish blocked without declarations | unit test reports every missing Legal Metrology/seller field; integration test keeps the product `DRAFT`        |
| Reference seed only                  | seed contains taxonomy/attributes/settings/navigation and a placeholder seller; no products, reviews or ratings |
| No fabricated social proof           | product JSON-LD and UI omit `aggregateRating` until verified reviews exist; live smoke showed no rating block   |
| SEO metadata and structured data     | unit tests cover Product/AggregateOffer/Breadcrumb/ItemList; live product page emitted valid JSON-LD            |
| Public API safety                    | integration test returns only published products, strips `costPrice`, and revalidates with ETag 304             |
| Search adapter boundary              | `SearchProvider` interface with `postgres` provider; public routes/pages resolve through `getSearchProvider()`  |

### Deliberately absent

No cart, checkout, coupons, Razorpay integration, order lifecycle, inventory/reservation workflow,
returns, reviews/Q&A submission, CMS content editing, published legal content, BullMQ worker, media
upload/processing adapter, real email/SMS delivery, browser E2E suite, hosted search engine, or
deployment evidence. The storefront product page intentionally disables “Add to cart” and says the
cart opens in the next release. The admin dashboard and marketing copy contain no invented metrics,
ratings, delivery promises or legal identifiers.

---

## 3. Known issues and limitations

1. **Docker untested.** The Dockerfile and compose stack have not been executed locally because
   Docker is unavailable on the build machine.
2. **Playwright/k6 not executed.** Configs and smoke tests exist but have not been run here.
3. **Redis fallback.** Development and the integration suite use an in-process cache. It does not
   provide cross-process rate limiting or durable queues. Production validation rejects the
   fallback, but the Redis-backed path has not been exercised.
4. **Email/SMS delivery unverified.** Resend, MSG91 and Twilio adapters are implemented but only the
   console adapters were used. Provider-specific error mapping and webhook/delivery receipts remain
   unverified.
5. **Password breach checking.** The policy uses a local common-password blocklist, not an HIBP
   k-anonymity lookup.
6. **MFA lifecycle gaps.** Staff can enrol and use TOTP and recovery codes, but there is no UI to
   disable MFA, regenerate recovery codes, or reset a lost authenticator through support. Those need
   an audited step-up flow in a later admin phase.
7. **Admin surface is partial.** Catalogue administration exists, but staff, role, permission,
   seller-identity and legal-declaration administration are not implemented.
8. **No browser-level E2E.** Forms and redirects are covered by typecheck/build plus API smoke tests,
   not by a real browser session.
9. **Postgres extensions.** `pg_trgm` is optional in this environment; typo-tolerant search will only
   use trigram indexes where the contrib package is installed. Production must install it.
10. **No CSP report endpoint.** Violations are not collected yet.
11. **Legal placeholders.** All legal documents are DRAFT with `legalReviewStatus = PENDING` and must
    never be published as-is.
12. **No email sender for newsletter.** Newsletter consent is stored, but double opt-in and
    unsubscribe emails are not implemented.
13. **Media upload is not implemented.** Admin image screens store external URLs and alt text; there
    is no presigned S3/Cloudinary upload, virus/content inspection, resizing or AVIF/WebP generation.
    Public images currently render with `unoptimized`, so image-delivery performance is unmeasured.
14. **Publishing is blocked until the seller is real.** The seeded platform seller has no registered
    address, GSTIN/PAN or consumer-care contact, and there is no seller-admin screen. A real product
    cannot be published until those verified details are entered; this is intentional.
15. **No bulk catalogue import/export.** CSV/Excel import, export and scheduled feeds described in the
    long-term API draft are not implemented in Phase 4.
16. **Search is PostgreSQL-only.** The `SearchProvider` seam exists and the default provider passes
    runtime tests, but no hosted engine or index-sync/reindex workflow exists. `pg_trgm` is optional
    locally; production must install it for fuzzy matching.
17. **Storefront catalogue is functional, not performance-tuned.** Pages are `force-dynamic` and
    server-rendered for correctness; caching, Lighthouse budgets, image optimisation and browser
    interaction tests have not been run. Full visual/storefront work remains Phase 6.

---

## 4. Phase 5 entry criteria

Before starting inventory:

- Decide the warehouse model (single fulfilment node vs. multiple) and the reservation TTL that
  checkout will use.
- Confirm the stock ledger invariant: every stock change must create a movement and reserved stock
  must never exceed on-hand.
- Wire catalogue variants to inventory rows; keep variant activation and price history independent of
  stock levels.
- Provide a way to mark products in stock for development without inventing customer-facing stock
  numbers.
- Install `pg_trgm` in staging/production or accept exact-match search until it is available.
- Keep the Phase 3 rule that authorization is checked in services, not only in routes/components.
- Extend the existing dedicated-database integration harness; do not truncate the development
  database.
