# Implementation Roadmap

**Baseline:** 8 November 2026
**Hard regulatory deadline:** 1 January 2027 — Consumer Protection (E-Commerce) (Amendment) Rules, 2026.
**Full DPDP obligations:** 13 May 2027.

Effort figures are engineering estimates for one senior full-stack developer with part-time design/QA support. They are planning aids, not commitments.

---

## 1. Dependency graph

```text
Phase 0/1 Research + architecture ──▶ Phase 2 Foundation ──▶ Phase 3 Auth/RBAC
                                                              │
                        ┌─────────────────────────────────────┼─────────────────────┐
                        ▼                                     ▼                     ▼
                 Phase 4 Catalog                       Phase 5 Inventory      Phase 12 Legal (can start)
                        │                                     │                     │
                        └──────────────▶ Phase 6 Storefront ◀┘                     │
                                                │                                   │
                                          Phase 7 Cart/Checkout                     │
                                                │                                   │
                                          Phase 8 Payments                          │
                                                │                                   │
                                          Phase 9 Orders/Shipping ──────────────────┤
                                                │                                   │
                                          Phase 10 Returns/Refunds ─────────────────┘
                                                │
                                          Phase 11 Admin dashboard
                                                │
                                          Phase 13 Testing/optimization
                                                │
                                          Phase 14 Deployment
```

---

## 2. Phase plan

### Phase 0 — Repository inspection and research ✅

**Deliverables:** environment audit; verified package versions; Indian regulatory research; risk register.
**Acceptance:** versions verified from registries; legal sources recorded with dates; open questions listed.

### Phase 1 — Architecture and design ✅

**Deliverables:** architecture, module map, ER model, API contract, security plan, legal matrix, roadmap.
**Acceptance:** all six docs exist; decisions have rationale; no code contradicts them.

### Phase 2 — Project foundation ✅

**Deliverables:**

- Next.js 16 + strict TypeScript + Tailwind 4 + shadcn-style primitives
- Prisma 7 schema, config, initial migration, seed framework
- PostgreSQL/Redis/Docker Compose, Dockerfile, `.env.example`
- Prisma client with driver adapter, Redis client, logger, env validation
- Money/Decimal, GST, rounding, slug, ID, pagination, time utilities
- ESLint/Prettier, Vitest/Playwright config, GitHub Actions
- Health endpoints and base layouts

**Acceptance:** `npm run typecheck`, `npm run lint`, `npm run build`, `npm test` pass; migration applies to a clean PostgreSQL 18 database; app starts; no secrets committed.

**Estimate:** 4–6 days.

**Verified 8 Nov 2026:** schema validates and both migrations apply to PostgreSQL 18.6; seed is idempotent; 28 unit tests pass; lint/typecheck/build pass; `next dev` serves the storefront and `/api/health`, `/api/health/ready` returns `database: ok`, `cache: ok`. Docker image was not executed locally because Docker is unavailable on the build machine; the Dockerfile and CI workflow are unverified end-to-end. See `docs/08-IMPLEMENTATION-STATUS.md`.

### Phase 3 — Authentication and authorization ✅

**Deliverables:** register/login/logout, email verification, password reset, phone OTP adapters, sessions + rotation + revocation, CSRF, Argon2id, RBAC schema/seed/guards, admin MFA, audit log, rate limiting, account pages.
**Acceptance:** integration tests for enumeration, brute force, session fixation, IDOR, privilege escalation; admin API rejects missing permissions; cookies verified in production mode.

**Estimate:** 6–8 days.

**Verified 8 Nov 2026:** 28 unit tests and 27 integration tests pass (PostgreSQL 18.6, dedicated
`ecomm_test` database). Integration coverage includes enumeration-resistant recovery, lockout,
per-IP/identity rate limiting, opaque-token storage, rotation/revocation, CSRF rejection, reset-token
replay, OTP attempt exhaustion, session IDOR, customer/staff RBAC boundaries, SUPER_ADMIN wildcard,
admin route 403/401/200, and production cookie attributes (`Secure`, `HttpOnly`, `SameSite=Lax`,
`__Host-`). Live smoke tests exercised register → verification gate → login → session → admin 403 →
CSRF-less logout rejection → CSRF logout → session invalidation, plus wrong-origin and weak-password
rejection. Browser E2E, real Resend/MSG91/Twilio delivery, Docker, Redis-backed rate limiting, and
an HTTPS deployment were not executed; see `docs/08-IMPLEMENTATION-STATUS.md`.

### Phase 4 — Product catalog

**Deliverables:** categories/brands CRUD, dynamic attributes and options, products/variants/images, price history, specifications, publishing validation (Legal Metrology fields), search adapter + Postgres FTS/trigram, filtering/facets, SEO metadata and structured data.
**Acceptance:** category tree, variant matrix, attribute filters, price-history tests; publish blocked without declarations; seed reference catalog only (no fake reviews).

**Estimate:** 10–14 days.

**Verified 8 Nov 2026:** 48 unit tests and 33 integration tests pass (PostgreSQL 18.6, dedicated
`ecomm_test` database). Coverage includes category reparenting with descendant path rewrites, variant
matrix generation and idempotency, attribute/brand/price facets, immutable price-history windows,
publish rejection when Legal Metrology declarations, images, seller identity or required attributes
are missing, public API publication filtering and cost-price stripping, ETag revalidation, URL
serialisation and SEO/JSON-LD helpers. Live smoke tests rendered a fully declared published product
with Product and BreadcrumbList JSON-LD, verified the product API omitted `costPrice`, and checked
brand/category filters, sitemap entries, `/products`, `/products/[slug]`, `/categories`,
`/categories/[slug]`, `/brands`, `/brands/[slug]`, `/search` (redirect) and `/sitemap.xml` over HTTP.
The temporary fixture was removed afterwards; the development database contains only seeded taxonomy
and the platform-seller placeholder. No fake products or reviews are seeded. Docker, browser E2E,
k6, Redis-backed cache/rate limiting and a production HTTPS deployment were not executed; see
`docs/08-IMPLEMENTATION-STATUS.md` for the current gap list.

### Phase 5 — Inventory

**Deliverables:** warehouses, stock ledger, reservations with TTL, atomic oversell protection, adjustments, low-stock alerts, suppliers, purchase orders, goods receipts, transfers, serviceable PINs.
**Acceptance:** concurrent checkout test cannot oversell; expiry releases reserved stock; every change has a movement; audit trail.

**Estimate:** 7–9 days.

### Phase 6 — Customer storefront

**Deliverables:** homepage, mega menu (DB-driven), listing/list-grid, product detail (gallery/zoom/video/specs/declarations/reviews/Q&A), wishlist, compare, search with suggestions, recently viewed, store locator, CMS pages, responsive premium design, skeletons/empty/error states.
**Acceptance:** Lighthouse ≥ 90 performance/accessibility on key templates (mobile); keyboard navigation; no dark patterns; canonical/OG/JSON-LD tests.

**Estimate:** 12–16 days.

### Phase 7 — Cart and checkout

**Deliverables:** guest/auth carts + merge, server pricing engine, promotions, coupons + concurrency, addresses, delivery methods, GST breakdown, COD rules, quote + stale detection, checkout UI, order confirmation.
**Acceptance:** totals cannot be manipulated; coupon redemption race test; GST intra/inter-state tests; address ownership tests; guest checkout works.

**Estimate:** 9–12 days.

### Phase 8 — Payments

**Deliverables:** Razorpay adapter, server order creation, verify endpoint, webhooks, idempotency, payment reconciliation, COD verification, failure/pending handling, security events.
**Acceptance:** signature, replay, duplicate, amount mismatch tests; order only paid by verified server event; reconciliation job catches missed webhooks.

**Estimate:** 6–8 days.

### Phase 9 — Orders and shipping

**Deliverables:** order lifecycle/state machine, snapshots, invoices + sequences + PDF, shipping adapters (Shiprocket first), serviceability, labels/AWB/tracking, furniture scheduling/installation, notifications, customer tracking, cancellation/partial cancellation.
**Acceptance:** invalid transitions blocked; invoice immutable and sequential; label/tracking sandbox tests; furniture fields validated; notification dedupe.

**Estimate:** 10–14 days.

### Phase 10 — Returns, refunds, warranty

**Deliverables:** eligibility engine, return requests + images, admin review/inspection, reverse pickup, restock, refunds (provider + manual), credit notes, replacements, warranty claims, SLA clocks.
**Acceptance:** policy snapshot; over-refund blocked; double restock blocked; provider refund verification; statutory rights never disabled by configuration.

**Estimate:** 8–10 days.

### Phase 11 — Admin dashboard and reports

**Deliverables:** analytics dashboard, product/inventory/order/customer/payment/refund/return/shipping/coupon/review/support/staff/role/settings/CMS screens, CSV/Excel exports, audit log viewer, PII masking, bulk import.
**Acceptance:** every screen permission-gated server-side; exports respect permissions and caps; dashboard queries indexed; no N+1 on lists.

**Estimate:** 14–18 days.

### Phase 12 — Legal compliance

**Deliverables:** legal document versioning/publishing, consent ledger + cookie banner, privacy request workflows, grievance system (48h/1 month), NCH reference, prior-price display, sponsored labels, ranking policy, annual dark-pattern audit + certificate, business profile settings, legal pages (draft → reviewed), invoices with seller identity.
**Acceptance:** all policy pages render with version/effective dates; placeholders visibly marked; no invented legal facts; consent blocks tags; grievance SLA jobs; 2026-rule tests pass.

**Estimate:** 8–10 days. **Must be complete before 1 January 2027.**

### Phase 13 — Testing, security, performance

**Deliverables:** unit/integration/E2E suites, security tests, k6 load tests, accessibility audit, SEO audit, dependency/container scans, penetration-test remediation.
**Acceptance:** critical journeys pass; no high/critical security findings open; load-test report with real numbers; Core Web Vitals targets met; restore drill passed.

**Estimate:** 10–12 days.

### Phase 14 — Production deployment

**Deliverables:** staging + production, managed Postgres/Redis, S3/CDN, secrets, migrations release process, backups/PITR, monitoring/alerts, incident runbook, go-live checklist, README/ops docs.
**Acceptance:** staged smoke tests; rollback tested; backup restore tested; CERT-In contact and log retention verified; legal sign-off recorded.

**Estimate:** 5–7 days.

---

## 3. Critical path to 1 January 2027

Minimum compliant launch set:

1. Foundation + auth/RBAC (Phases 2–3)
2. Catalog with price history, declarations, sponsored labels (Phase 4)
3. Inventory + storefront + cart/checkout (Phases 5–7)
4. Payments + orders (Phases 8–9)
5. Legal pages, grievance, consent, prior-price/sponsored display, dark-pattern audit (Phase 12)
6. Security testing and deployment (Phases 13–14)

Returns/refunds (Phase 10) and full admin analytics (Phase 11) can follow launch only if a manual, audited process exists and the policy/legal obligations are still met. Do not launch without a working grievance and refund path.

---

## 4. Quality gates (every phase)

- [ ] No TypeScript errors, no `any` without justification, no ignored lint rules
- [ ] Zod validation at every boundary
- [ ] Server-side authorization for every mutation
- [ ] Database transaction for multi-step writes
- [ ] Migration committed and applied to a clean DB
- [ ] Unit tests for domain rules; integration tests for the workflow
- [ ] Audit log for sensitive actions
- [ ] Error states, empty states, loading states
- [ ] Mobile and keyboard accessibility checked
- [ ] Docs/ADRs updated; checklist status updated honestly
- [ ] No secrets, no fake data, no TODO on a critical path

---

## 5. Current status

| Phase          | Status      | Evidence                                                              |
| -------------- | ----------- | --------------------------------------------------------------------- |
| 0 Research     | ✅ Complete | `docs/01-RESEARCH.md`                                                 |
| 1 Architecture | ✅ Complete | `docs/02`–`docs/06`                                                   |
| 2 Foundation   | ✅ Complete | schema, seed, app shell, health, tests; Docker image untested locally |
| 3 Auth/RBAC    | ⏳ Next     | —                                                                     |
| 4–14           | ⏳ Planned  | —                                                                     |

Status is updated only when the acceptance criteria are actually met. This file must not mark a phase complete because files exist.

---

## 6. Out of scope for v1 (explicit)

- Third-party marketplace, seller payouts, commissions, seller portal
- Multi-currency and international shipping
- Mobile apps (the API is designed to support them)
- Loyalty points/wallet (schema seam only)
- Subscriptions
- Real-time chat (support tickets + email in v1)
- AI recommendations (rule-based related products in v1; adapter seam later)
- Warehouse automation/ERP integration
- Advanced fraud scoring (velocity checks + manual review in v1)
- Marketplace/related-party ranking controls
