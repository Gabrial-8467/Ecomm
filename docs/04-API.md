# Draft API Specification (v1)

Base URL: `/api/v1`
Content type: `application/json; charset=utf-8` (webhooks consume raw bytes; uploads use presigned URLs).
Auth: HttpOnly session cookie. Mutating cookie-authenticated requests also send `X-CSRF-Token`.
Admin API is additionally protected by RBAC permission checks **inside the service layer**.

> This is the contract agreed in Phase 1. Implementation follows module by module; an OpenAPI 3.1 document will be generated from the Zod schemas when Phase 3 lands.

---

## 1. Conventions

### Response envelope

```json
{ "data": {}, "meta": { "requestId": "req_...", "nextCursor": "..." } }
```

Errors use RFC 9457 Problem Details plus a stable machine code:

```json
{
  "type": "https://errors.casacircuit.example/validation",
  "title": "Validation failed",
  "status": 422,
  "code": "VALIDATION_FAILED",
  "detail": "Quantity must be between 1 and 10.",
  "requestId": "req_...",
  "errors": [{ "path": "items.0.quantity", "message": "..." }]
}
```

No stack traces, SQL, provider payloads or internal IDs in production errors.

### Status codes

| Code | Use                                                         |
| ---- | ----------------------------------------------------------- |
| 200  | Read/update success                                         |
| 201  | Resource created                                            |
| 202  | Accepted for async processing (exports, refund initiation)  |
| 204  | No content (delete/logout)                                  |
| 400  | Malformed request                                           |
| 401  | Not authenticated / session expired                         |
| 403  | Authenticated but not permitted                             |
| 404  | Not found or not owned (avoid IDOR disclosure)              |
| 409  | State conflict (stale quote, invalid transition, duplicate) |
| 422  | Validation failure / business rule violation                |
| 429  | Rate limited (`Retry-After`)                                |
| 500  | Unexpected error                                            |

### Stable error codes (excerpt)

`VALIDATION_FAILED`, `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `RATE_LIMITED`, `CSRF_INVALID`, `QUOTE_STALE`, `OUT_OF_STOCK`, `COUPON_INVALID`, `COUPON_NOT_APPLICABLE`, `PAYMENT_SIGNATURE_INVALID`, `PAYMENT_AMOUNT_MISMATCH`, `PAYMENT_DUPLICATE`, `ORDER_INVALID_TRANSITION`, `RETURN_NOT_ELIGIBLE`, `RETURN_WINDOW_EXPIRED`, `IDEMPOTENCY_CONFLICT`, `UPLOAD_REJECTED`, `EMAIL_TAKEN`, `PHONE_TAKEN`, `ACCOUNT_LOCKED`, `OTP_INVALID`, `OTP_EXPIRED`.

### Pagination

- Public/search: cursor-based `?limit=24&cursor=...`; `meta.nextCursor`.
- Admin/report lists: page-based `?page=1&pageSize=50` with `meta.total`, `meta.pageCount`.
- Hard cap `limit <= 100`, `pageSize <= 200`. Exports are capped and asynchronous above 10k rows.

### Idempotency

`POST` endpoints that create money-moving resources require `Idempotency-Key` (UUID). Server stores scope+key+request hash+response for 24h. Same key + different body → `409 IDEMPOTENCY_CONFLICT`.

### Rate limits (Redis sliding window)

| Class                     | Limit                                                   |
| ------------------------- | ------------------------------------------------------- |
| Login/OTP/password reset  | 5/min per IP, 5/min per identity, 20/hour per IP        |
| Register                  | 3/hour per IP                                           |
| Search/suggest            | 60/min per IP                                           |
| Cart/checkout             | 60/min per session                                      |
| Reviews/support/grievance | 10/hour per identity                                    |
| Uploads                   | 30/hour per identity                                    |
| Webhooks                  | Provider IP allowlist + signature; 300/min per provider |
| Admin mutations           | 120/min per staff identity                              |

`429` includes `Retry-After`.

### Caching headers

- Public catalog: `Cache-Control: public, s-maxage=60, stale-while-revalidate=300`.
- Cart/checkout/account/admin: `Cache-Control: no-store`.
- Product detail includes `ETag` based on catalog version.

### Security headers

Set globally by `src/proxy.ts`: CSP with per-request nonce, `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, `X-Frame-Options: DENY`/`frame-ancestors 'none'`. CORS is disabled by default for cookie APIs; a dedicated allowlist applies only if a mobile client is added.

---

## 2. Public storefront

**Implemented in Phase 4:** `/products`, `/products/:slug`, `/products/:slug/related`,
`/categories`, `/categories/:slug`, `/brands` and `/search/suggest`. `/search` is a storefront
redirect to `/products`; its planned JSON endpoint is not implemented. Every other row below remains
planned and is not routable yet. Implemented routes return resource JSON directly (for example
`{ items, pagination, facets, query }` or `{ product }`), not the draft `{ data, meta }` envelope.

| Method | Path                        | Purpose                         | Notes                                                                                                                                      |
| ------ | --------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| GET    | `/products`                 | List/filter/sort                | `category`, `brand[]`, `minPrice`, `maxPrice`, `rating`, `inStock`, `discount`, `attr.<code>=`, `countryOfOrigin`, `sort`, `page`, `limit` |
| GET    | `/products/:slug`           | Product detail                  | variants, images, specs, declarations, price summary; ETag revalidation                                                                    |
| GET    | `/products/:slug/related`   | Related / FBT                   | limit 8, published only                                                                                                                    |
| GET    | `/products/:slug/reviews`   | Approved reviews                | paginated, rating summary                                                                                                                  |
| GET    | `/products/:slug/questions` | Q&A                             | approved only                                                                                                                              |
| GET    | `/categories`               | Navigation tree                 | active only                                                                                                                                |
| GET    | `/categories/:slug`         | Category page data              | breadcrumb, facets, SEO                                                                                                                    |
| GET    | `/brands`                   | Brand list                      | active only; published-product counts                                                                                                      |
| GET    | `/search`                   | Full search                     | Phase 4 redirects to `/products?…`; dedicated endpoint not implemented                                                                     |
| GET    | `/search/suggest`           | Autocomplete                    | products, categories, brands; max 10                                                                                                       |
| GET    | `/serviceability/:pincode`  | Delivery/COD/installation check | cached 24h; never promises unsupported service                                                                                             |
| GET    | `/shipping/rates`           | Quote shipping for PIN + cart   | server-side cart or explicit variant quantities                                                                                            |
| GET    | `/stores`                   | Store locator                   |                                                                                                                                            |
| GET    | `/banners`                  | Active banners by placement     |                                                                                                                                            |
| GET    | `/pages/:slug`              | CMS page                        | published only                                                                                                                             |
| GET    | `/legal/:slug`              | Current legal document          | version, effective date, draft flag                                                                                                        |
| GET    | `/blog` / `/blog/:slug`     | Blog                            | published only                                                                                                                             |
| GET    | `/faqs`                     | FAQs                            |                                                                                                                                            |
| POST   | `/newsletter`               | Subscribe                       | double opt-in email                                                                                                                        |
| POST   | `/grievances`               | File a grievance                | rate-limited, returns acknowledgement copy                                                                                                 |
| GET    | `/grievances/:number`       | Track (email + number)          | no enumeration of PII                                                                                                                      |
| GET    | `/orders/track`             | Guest order tracking            | order number + email/phone + OTP proof                                                                                                     |

**Product payload must include** (Legal Metrology + 2026 Rules): seller legal name/address, manufacturer/packer/importer, country of origin, net quantity + unit, unit sale price, MRP, selling price, prior price (lowest in 30 days) when a reduction is shown, tax-inclusive flag, warranty, return eligibility, assembly/installation flags. Missing mandatory declarations prevent `ACTIVE` status.

---

## 3. Authentication and account

Paths are relative to `/api/v1`. Only the rows below are implemented in Phase 3; the remaining
account surfaces (addresses, orders, wishlist, returns, privacy) are planned for later phases and
are not routable yet.

| Method | Path                           | Purpose                                                      |
| ------ | ------------------------------ | ------------------------------------------------------------ |
| POST   | `/auth/register`               | Email+password registration; always sends verification email |
| POST   | `/auth/login`                  | Email + password; sets session cookie or MFA challenge       |
| POST   | `/auth/logout`                 | Revoke current session (204, CSRF required)                  |
| GET    | `/auth/session`                | Current actor, roles, permissions (UI hints only)            |
| POST   | `/auth/verify-email`           | Consume email verification token                             |
| POST   | `/auth/resend-verification`    | Always 202 (no account enumeration)                          |
| POST   | `/auth/otp/request`            | Phone OTP for login/verification; always 202                 |
| POST   | `/auth/otp/verify`             | Verify OTP, create session                                   |
| POST   | `/auth/password/forgot`        | Always 202 (no account enumeration)                          |
| POST   | `/auth/password/reset`         | Single-use token, revokes all sessions                       |
| POST   | `/auth/mfa/challenge`          | Describe a pending MFA challenge                             |
| POST   | `/auth/mfa/setup`              | Start TOTP enrolment; returns one-time recovery codes        |
| POST   | `/auth/mfa/enable`             | Confirm TOTP and finish sign-in                              |
| POST   | `/auth/mfa/verify`             | Verify TOTP/recovery code                                    |
| GET    | `/account`                     | Profile + actor                                              |
| PATCH  | `/account`                     | Update name, language, marketing consent (CSRF)              |
| POST   | `/account/password`            | Change password, rotate session, revoke others               |
| GET    | `/account/sessions`            | List active sessions (current marked)                        |
| DELETE | `/account/sessions/:sessionId` | Revoke own session (IDOR-safe, CSRF)                         |
| GET    | `/admin/whoami`                | Requires `dashboard:read`; returns public actor              |

Guest checkout is supported; no endpoint above is required to purchase.

---

## 4. Cart and checkout

| Method | Path                    | Purpose                      | Notes                                        |
| ------ | ----------------------- | ---------------------------- | -------------------------------------------- |
| GET    | `/cart`                 | Current cart                 | Recomputes totals from DB                    |
| POST   | `/cart/items`           | Add line                     | `{variantId, quantity}`                      |
| PATCH  | `/cart/items/:id`       | Update quantity/variant      | Revalidates                                  |
| DELETE | `/cart/items/:id`       | Remove                       |                                              |
| POST   | `/cart/coupon`          | Apply code                   | Server validates eligibility                 |
| DELETE | `/cart/coupon`          | Remove                       |                                              |
| POST   | `/cart/merge`           | Merge guest cart after login | Server-side, idempotent                      |
| POST   | `/cart/validate`        | Revalidate prices/stock      | Returns changed lines                        |
| POST   | `/checkout/quote`       | Server quote                 | address, delivery method, coupon, COD choice |
| GET    | `/checkout/quote/:id`   | Retrieve quote               | owner-bound, expires                         |
| POST   | `/checkout/place-order` | Create order                 | `Idempotency-Key` required; reserves stock   |
| POST   | `/checkout/cod/verify`  | OTP for COD                  | configurable eligibility                     |

**Server quote** returns: line items with unit price, promotion discount, coupon allocation, taxable value, CGST/SGST/IGST, shipping, COD fee, grand total, quote hash, expiry, stock warnings, serviceability, expected delivery date, installation options. The client echoes only the quote ID and hash; it never sends amounts.

**Place order** revalidates quote hash, prices, stock, coupon, serviceability and address. Any change → `409 QUOTE_STALE` with the new quote.

---

## 5. Orders, payments, returns

| Method | Path                                        | Purpose                                              |
| ------ | ------------------------------------------- | ---------------------------------------------------- |
| GET    | `/orders/:orderNumber`                      | Guest lookup with proof (email/phone + OTP)          |
| POST   | `/orders/:orderNumber/cancel`               | Customer cancellation if status/items eligible       |
| POST   | `/orders/:orderNumber/items/:itemId/cancel` | Partial cancellation                                 |
| GET    | `/orders/:orderNumber/tracking`             | Shipment events                                      |
| POST   | `/payments/razorpay/verify`                 | Server-side verification; never trusts client status |
| POST   | `/payments/razorpay/webhook`                | Raw body, signature, idempotent                      |
| POST   | `/payments/cod/confirm`                     | COD OTP confirmation                                 |
| POST   | `/returns`                                  | Create return/replacement/warranty request           |
| GET    | `/returns/:number`                          | Track (ownership/proof)                              |
| POST   | `/returns/:number/images`                   | Presigned upload completion                          |
| POST   | `/returns/:number/cancel`                   | Customer cancels before pickup                       |
| POST   | `/reviews`                                  | Verified-purchase review                             |
| PATCH  | `/reviews/:id`                              | Edit own pending/approved review                     |
| POST   | `/reviews/:id/report`                       | Report abuse                                         |
| POST   | `/products/:id/questions`                   | Ask a question                                       |
| POST   | `/support/tickets`                          | Create ticket (guest or customer)                    |
| POST   | `/support/tickets/:number/messages`         | Reply                                                |

Payment verification flow:

1. `POST /payments/razorpay/verify` receives `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature`.
2. Server recomputes HMAC with the key secret, fetches the payment from Razorpay, checks amount/currency/order reference and status (`captured`/`authorized` as configured).
3. Transaction updates Payment/Order idempotently; duplicate callbacks return 200 with the same result.
4. If the webhook arrives first, the verify call is a no-op success. If verification fails, the order remains pending and the reservation is released by the expiry job; no order is marked paid.

---

## 6. Admin API

Every route is permission-gated. Permission codes shown are the minimum required.

### Catalog (implemented in Phase 4)

Every mutating route also requires `X-CSRF-Token`. `GET` routes require `catalog:read`. Implemented
paths use the `/api/v1` prefix; the admin UI mirrors them as `/admin/catalog/*` pages.

| Method           | Path                                                         | Permission                                          |
| ---------------- | ------------------------------------------------------------ | --------------------------------------------------- |
| GET/POST         | `/admin/categories`                                          | `catalog:read` / `catalog:write`                    |
| GET/PATCH/DELETE | `/admin/categories/:categoryId`                              | `catalog:read` / `catalog:write` / `catalog:delete` |
| PUT              | `/admin/categories/:categoryId/attributes`                   | `catalog:write`                                     |
| GET/POST         | `/admin/brands`                                              | `catalog:read` / `catalog:write`                    |
| GET/PATCH/DELETE | `/admin/brands/:brandId`                                     | `catalog:read` / `catalog:write` / `catalog:delete` |
| GET/POST         | `/admin/attributes`                                          | `catalog:read` / `catalog:write`                    |
| GET/PATCH/DELETE | `/admin/attributes/:attributeId`                             | `catalog:read` / `catalog:write` / `catalog:delete` |
| GET/POST         | `/admin/products`                                            | `catalog:read` / `catalog:write`                    |
| GET/PATCH/DELETE | `/admin/products/:productId`                                 | `catalog:read` / `catalog:write` / `catalog:delete` |
| POST             | `/admin/products/:productId/publish`                         | `catalog:publish`                                   |
| POST             | `/admin/products/:productId/archive`                         | `catalog:delete`                                    |
| POST             | `/admin/products/:productId/variants`                        | `catalog:write`                                     |
| POST             | `/admin/products/:productId/variants/generate`               | `catalog:write`                                     |
| PATCH/DELETE     | `/admin/variants/:variantId`                                 | `catalog:write` / `catalog:delete`                  |
| POST             | `/admin/variants/:variantId/price`                           | `catalog:write`                                     |
| POST             | `/admin/products/:productId/images`                          | `catalog:write`                                     |
| DELETE           | `/admin/products/:productId/images/:imageId`                 | `catalog:delete`                                    |
| POST             | `/admin/products/:productId/specifications`                  | `catalog:write`                                     |
| DELETE           | `/admin/products/:productId/specifications/:specificationId` | `catalog:delete`                                    |
| POST             | `/admin/products/:productId/attributes`                      | `catalog:write`                                     |
| DELETE           | `/admin/products/:productId/attributes/:attributeId`         | `catalog:delete`                                    |

Not implemented in Phase 4: CSV/Excel import/export, presigned media uploads, seller/legal-entity
administration, and sponsored placements.

### Inventory

| Method   | Path                                 | Permission                            |
| -------- | ------------------------------------ | ------------------------------------- |
| GET      | `/admin/inventory`                   | `inventory.view`                      |
| POST     | `/admin/inventory/:variantId/adjust` | `inventory.adjust`                    |
| GET      | `/admin/inventory/movements`         | `inventory.view`                      |
| GET/POST | `/admin/warehouses`                  | `inventory.view` / `inventory.manage` |
| GET/POST | `/admin/suppliers`                   | `inventory.view` / `inventory.manage` |
| GET/POST | `/admin/purchase-orders`             | `inventory.view` / `inventory.manage` |
| POST     | `/admin/purchase-orders/:id/receive` | `inventory.receive`                   |
| POST     | `/admin/stock-transfers`             | `inventory.transfer`                  |
| GET      | `/admin/inventory/low-stock`         | `inventory.view`                      |

### Orders, payments, refunds, returns, shipping

| Method   | Path                                 | Permission                             |
| -------- | ------------------------------------ | -------------------------------------- |
| GET      | `/admin/orders`                      | `orders.view`                          |
| GET      | `/admin/orders/:id`                  | `orders.view`                          |
| POST     | `/admin/orders/:id/transition`       | `orders.update` (transition whitelist) |
| POST     | `/admin/orders/:id/cancel`           | `orders.cancel`                        |
| POST     | `/admin/orders/:id/notes`            | `orders.update`                        |
| POST     | `/admin/orders/:id/invoice`          | `invoices.generate`                    |
| GET      | `/admin/payments`                    | `payments.view`                        |
| POST     | `/admin/payments/:id/reconcile`      | `payments.reconcile`                   |
| GET      | `/admin/refunds`                     | `refunds.view`                         |
| POST     | `/admin/refunds`                     | `refunds.create`                       |
| POST     | `/admin/refunds/:id/approve`         | `refunds.approve`                      |
| POST     | `/admin/refunds/:id/retry`           | `refunds.approve`                      |
| GET      | `/admin/returns`                     | `returns.view`                         |
| POST     | `/admin/returns/:id/approve`         | `returns.approve`                      |
| POST     | `/admin/returns/:id/reject`          | `returns.approve`                      |
| POST     | `/admin/returns/:id/inspect`         | `returns.inspect`                      |
| POST     | `/admin/returns/:id/pickup`          | `shipping.manage`                      |
| GET/POST | `/admin/shipments`                   | `shipping.view` / `shipping.manage`    |
| POST     | `/admin/shipments/:id/label`         | `shipping.manage`                      |
| POST     | `/admin/shipments/:id/tracking/sync` | `shipping.manage`                      |
| GET/POST | `/admin/serviceable-pincodes`        | `shipping.view` / `shipping.manage`    |

### Customers, staff, RBAC, reviews, support

| Method   | Path                               | Permission                                                |
| -------- | ---------------------------------- | --------------------------------------------------------- |
| GET      | `/admin/customers`                 | `customers.view`                                          |
| GET      | `/admin/customers/:id`             | `customers.view` (PII masked unless `customers.pii.view`) |
| POST     | `/admin/customers/:id/suspend`     | `customers.manage`                                        |
| GET      | `/admin/staff`                     | `staff.view`                                              |
| POST     | `/admin/staff/invite`              | `staff.manage`                                            |
| PATCH    | `/admin/staff/:id`                 | `staff.manage`                                            |
| GET/POST | `/admin/roles`                     | `roles.view` / `roles.manage`                             |
| GET      | `/admin/permissions`               | `roles.view`                                              |
| GET      | `/admin/reviews`                   | `reviews.view`                                            |
| POST     | `/admin/reviews/:id/moderate`      | `reviews.moderate`                                        |
| GET/POST | `/admin/questions`                 | `reviews.view` / `reviews.moderate`                       |
| GET      | `/admin/support/tickets`           | `support.view`                                            |
| POST     | `/admin/support/tickets/:id/reply` | `support.respond`                                         |
| PATCH    | `/admin/support/tickets/:id`       | `support.manage`                                          |

### Reports, CMS, legal, settings, audit

| Method    | Path                                         | Permission                              |
| --------- | -------------------------------------------- | --------------------------------------- |
| GET       | `/admin/reports/dashboard`                   | `reports.view`                          |
| GET       | `/admin/reports/:type`                       | `reports.view`                          |
| POST      | `/admin/reports/:type/export`                | `reports.export` (async)                |
| GET       | `/admin/reports/exports/:id`                 | `reports.export`                        |
| GET/POST  | `/admin/cms/banners`                         | `cms.view` / `cms.manage`               |
| GET/POST  | `/admin/cms/pages`                           | `cms.view` / `cms.manage`               |
| GET/POST  | `/admin/cms/navigation`                      | `cms.view` / `cms.manage`               |
| GET/POST  | `/admin/cms/blog`                            | `cms.view` / `cms.manage`               |
| GET/POST  | `/admin/cms/faqs`                            | `cms.view` / `cms.manage`               |
| GET/POST  | `/admin/cms/stores`                          | `cms.view` / `cms.manage`               |
| GET/PATCH | `/admin/settings/business`                   | `settings.view` / `settings.manage`     |
| GET/PATCH | `/admin/settings/operations`                 | `settings.view` / `settings.manage`     |
| GET/POST  | `/admin/legal/documents`                     | `legal.view` / `legal.manage`           |
| POST      | `/admin/legal/documents/:id/versions`        | `legal.manage` (draft)                  |
| POST      | `/admin/legal/versions/:id/publish`          | `legal.publish` + legal review evidence |
| GET       | `/admin/legal/privacy-requests`              | `privacy.view`                          |
| POST      | `/admin/legal/privacy-requests/:id/complete` | `privacy.manage`                        |
| GET       | `/admin/legal/grievances`                    | `grievances.view`                       |
| POST      | `/admin/legal/grievances/:id/acknowledge`    | `grievances.manage`                     |
| POST      | `/admin/legal/grievances/:id/resolve`        | `grievances.manage`                     |
| GET/POST  | `/admin/legal/audits`                        | `legal.view` / `legal.manage`           |
| GET       | `/admin/audit-logs`                          | `audit.view`                            |

---

## 7. Webhooks and health

| Method | Path                                  | Security                                                                       |
| ------ | ------------------------------------- | ------------------------------------------------------------------------------ |
| POST   | `/api/v1/webhooks/razorpay`           | HMAC-SHA256 `X-Razorpay-Signature`, raw body, event idempotency, replay window |
| POST   | `/api/v1/webhooks/shipping/:provider` | Provider signature/secret + IP allowlist where supported                       |
| GET    | `/api/v1/health/live`                 | No auth; process liveness only                                                 |
| GET    | `/api/v1/health/ready`                | No auth; DB + Redis checks; no secrets                                         |

Webhook responses: `200` for processed **and** duplicate events; `4xx` for invalid signature (do not leak why); `5xx` only for retryable internal failures. A daily reconciliation job catches missed/late events.

---

## 8. Server Actions

Admin forms and account mutations use Server Actions for progressive enhancement and to avoid client-side price logic. Actions:

- Are thin wrappers over the same services used by the REST API.
- Validate with the same Zod schemas.
- Re-authorize on every invocation.
- Return typed field errors for React Hook Form.
- Are covered by integration tests, not only E2E.

Public read pages use RSC data access through module query services; no internal HTTP fetch to own API.

---

## 9. Contract testing

- Zod schemas are the single source of truth for request/response shapes.
- Integration tests assert status codes, error codes and side effects.
- Webhook fixtures cover valid, invalid signature, duplicate, late, amount-mismatch, failed and refund events.
- A generated OpenAPI 3.1 document will be tested for drift in CI.
