# Security Architecture and Implementation Plan

**Target:** OWASP Top 10 (2021), OWASP ASVS Level 2 for customer-facing areas and Level 3 for admin/payment operations, CERT-In Directions 2022, DPDP security safeguards, PCI DSS SAQ-A scope for payments.

> No claim of certification or regulatory compliance is made until independent verification, penetration testing and the operator's legal/security review are complete.

---

## 1. Threat model (abridged)

| Trust boundary      | Threats                                                                 | Primary controls                                                                                                     |
| ------------------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Browser → app       | XSS, CSRF, session theft, price tampering, IDOR, brute force, bot abuse | CSP nonce, HttpOnly/SameSite cookies, CSRF token, server-side pricing, ownership checks, Redis rate limits, Argon2id |
| Webhook → app       | Spoofed payment/shipping events, replay, duplicate processing           | Raw-body HMAC, timestamp window, provider re-query, unique event IDs, idempotency                                    |
| Admin → app         | Privilege escalation, insider abuse, account takeover                   | RBAC in services, MFA, session rotation, audit logs, least privilege, PII masking                                    |
| App → DB            | SQL injection, credential leakage, over-broad access                    | Prisma parameterisation, least-privilege roles, TLS, secret manager, no browser DB access                            |
| App → third parties | SSRF, data leakage, vendor compromise                                   | Allowlisted outbound hosts, signed URLs, minimal scopes, processor agreements                                        |
| Uploads             | Malware, polyglot files, stored XSS, decompression bombs                | Type/size validation, re-encode, EXIF strip, malware scan, separate origin                                           |
| Jobs                | Lost/duplicated notifications, replay                                   | Outbox, dedupe keys, idempotent processors, retries with backoff                                                     |

---

## 2. Authentication

### Passwords

- Argon2id via `@node-rs/argon2`: memory 64 MiB, iterations 3, parallelism 1, hash length 32.
- Minimum 10 characters (12 for staff), maximum 128, block breached/common passwords (local list + optional HIBP k-anonymity check).
- Never log passwords, hashes, OTPs or reset tokens.
- Rehash on successful login when parameters change.
- Password change revokes all other sessions.

### Sessions

| Property         | Customer                                                    | Staff/Admin                               |
| ---------------- | ----------------------------------------------------------- | ----------------------------------------- |
| Token            | 256-bit random, base64url                                   | same                                      |
| Storage          | SHA-256 hash in `Session.tokenHash`                         | same                                      |
| Cookie           | `__Host-cc_session`; Secure, HttpOnly, SameSite=Lax, Path=/ | same, separate cookie name                |
| Idle timeout     | 7 days                                                      | 30 minutes                                |
| Absolute timeout | 30 days                                                     | 12 hours                                  |
| Rotation         | On login, password change, privilege change, every 24h      | On login, MFA, privilege change, every 4h |
| Revocation       | Logout, admin action, password reset, account suspend       | same                                      |

No authentication token is stored in `localStorage` or `sessionStorage`.

### MFA

- TOTP (RFC 6238) mandatory for SUPER_ADMIN and ADMIN; configurable for other staff roles.
- Secret encrypted with AES-256-GCM (`MFA_ENCRYPTION_KEY`, 32 bytes, key id prefix for rotation).
- 10 single-use recovery codes, Argon2id-hashed.
- Step-up MFA required for: refund approval above threshold, role changes, legal document publication, settings containing bank/GST data, data export, account deletion.

### OTP

- 6 digits from CSPRNG, hashed (SHA-256 + server pepper), 5-minute expiry, max 5 attempts, single use.
- Per-phone, per-IP and global rate limits. No OTP value in responses or logs. Constant-time comparison.
- SMS adapter is interchangeable; provider delivery reports stored in `SmsLog`.

### Account protection

- Progressive delays and temporary lock after 5 failures per identity in 15 minutes; `429` with generic message.
- Login responses do not reveal whether an email/phone exists.
- New device/IP alert email (optional, configurable).
- Admin login requires MFA; repeated failures raise a security event.

---

## 3. Authorization (RBAC + ownership)

### Seeded roles

| Role              | Typical permissions                                                              |
| ----------------- | -------------------------------------------------------------------------------- |
| SUPER_ADMIN       | all, including `staff.manage`, `roles.manage`, `legal.publish`                   |
| ADMIN             | all operational, excluding destructive role/legal publication unless delegated   |
| PRODUCT_MANAGER   | `products.*`, `categories.*`, `brands.*`, `catalog.attributes.*`, `media.upload` |
| INVENTORY_MANAGER | `inventory.*`, purchase orders, transfers, warehouses                            |
| ORDER_MANAGER     | `orders.*`, `shipments.*`, `invoices.generate`                                   |
| CUSTOMER_SUPPORT  | `orders.view`, `customers.view`, `support.*`, `returns.view`, `reviews.view`     |
| FINANCE_MANAGER   | `payments.*`, `refunds.*`, `reports.*`, `invoices.*`                             |
| CONTENT_MANAGER   | `cms.*`, `promotions.manage`, `reviews.moderate`                                 |

### Enforcement rules

1. Services receive a resolved `Actor` (`userId`, `roles`, `permissions`, `sessionId`) and call `requirePermission(actor, code)` before any mutation.
2. The UI hides buttons as a UX aid only. Direct API calls receive `403` if unauthorized.
3. Ownership checks are separate: `assertOwnsOrder(actor, order)`, `assertOwnsAddress`, `assertOwnsReturn`. Returning `404` for non-owned resources avoids enumeration.
4. Staff impersonation is not implemented. If added, it must be a distinct audited session with read-only default.
5. Permission changes revoke active sessions of the affected user (forced re-login).
6. Refund approval is dual-control above a configurable threshold (`refunds.approve` plus a different approver than the initiator).

### CSRF

- Server Actions: Next.js built-in Origin/Host validation (keep enabled; do not disable).
- REST mutations: require `X-CSRF-Token` matching `Session.csrfTokenHash`; reject missing/mismatched tokens.
- `SameSite=Lax` is defence in depth, not the only control.
- Webhooks are exempt (no cookie) and use signatures.
- State-changing GETs are forbidden.

---

## 4. Input, output and API security

- Every request body, query string and route param is parsed with a strict Zod schema (`.strict()` where appropriate, bounded strings, arrays, numbers, enums).
- Unknown fields are rejected or stripped deterministically; mass assignment is impossible because services map explicit fields.
- Prisma is used for CRUD; raw SQL only with `Prisma.sql`/bound parameters. No string interpolation of user input.
- Output encoding: React escapes by default. Rich text (product descriptions, CMS, legal) is sanitised server-side with an allowlist (`sanitize-html`) and rendered only from the sanitised field.
- JSON-LD is serialised with a safe encoder (`<` escaping) to prevent script breakout.
- File names, slugs and redirects are normalised; open redirects blocked by allowing only relative paths or configured hosts.
- Pagination, sorting and filter keys are allowlisted. No arbitrary `orderBy` from user input.
- Response size limits and request body limits (`1 MB` JSON, `10 MB` non-file endpoints rejected; uploads use presigned URLs).
- CORS: same-origin by default. If a mobile app is added, an explicit allowlist with credentials disabled/token auth.
- SSRF: no endpoint fetches arbitrary URLs. Integration clients use fixed provider hosts; image import validates host and blocks private/link-local/metadata IPs after DNS resolution, with redirects disabled.
- Error handling: central mapper; production hides internals, logs correlation ID.

---

## 5. Security headers and CSP

Set in `src/proxy.ts`:

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'nonce-<random>' 'strict-dynamic' https://checkout.razorpay.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob: https://cdn.example https://res.cloudinary.com;
  font-src 'self';
  connect-src 'self' https://api.razorpay.com https://lumberjack.razorpay.com;
  frame-src https://api.razorpay.com https://checkout.razorpay.com;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
  object-src 'none';
  upgrade-insecure-requests;
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(self), payment=(self)
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
```

`style-src 'unsafe-inline'` is required by some UI libraries; it is documented and reviewed. Razorpay domains are allowlisted only where checkout is used. A report-only CSP runs in staging before enforcement.

---

## 6. Payment security

- Razorpay hosted checkout; raw card data never touches the application. Scope target: PCI DSS SAQ-A.
- Server creates the provider order with amount/currency from the server quote. The client cannot set amount.
- Verification: HMAC-SHA256 of `order_id|payment_id` with the key secret, constant-time compare; then fetch the payment from Razorpay and verify amount, currency, status and receipt.
- Webhook: raw body, `X-Razorpay-Signature` HMAC with webhook secret, timestamp/replay tolerance, `WebhookEvent(provider,eventId)` unique.
- Idempotency: `Payment.idempotencyKey`, unique provider IDs, transactional state transitions. Duplicate events return success without double side effects.
- Amount mismatch, currency mismatch, unknown order → security event + alert; never auto-confirm.
- Refunds require permission, amount ≤ captured − already refunded, and a unique idempotency key. Provider refund status is polled/verified; manual bank transfers require a reference and dual control.
- COD eligibility: configurable max order value, PIN serviceability, OTP verification, fraud velocity checks.
- Reconciliation: daily job compares provider settlements/payments with local records; exceptions create an admin task.
- Secrets only in env/secret manager; never in `NEXT_PUBLIC_*`, logs or database settings.

---

## 7. File uploads and media

- Presigned POST/PUT with content-length range and content-type allowlist (`image/jpeg`, `image/png`, `image/webp`, `video/mp4`).
- Random object keys; original filename stored only as metadata (escaped).
- Server-side verification of magic bytes, not just `Content-Type`.
- Images re-encoded (sharp) to strip EXIF/GPS and reject decompression bombs; videos transcoded or rejected if unsupported.
- Malware scan (ClamAV sidecar or provider) before public availability; quarantined objects are private.
- Public product images served from a separate CDN origin with immutable cache; user review images are private until approved.
- SVG uploads are rejected (XSS risk) unless sanitised and served as `image/svg+xml` from a separate origin with CSP; default is reject.

---

## 8. Data protection and privacy

- TLS 1.2+ everywhere; HSTS preload. Database connections require TLS in managed environments.
- Encryption at rest: provider-managed volume encryption + encrypted backups. MFA secrets and any reversible secrets use AES-256-GCM.
- PII minimisation: only collect what is needed for order fulfilment, tax and support.
- Log redaction: passwords, tokens, OTPs, card fields, full addresses (except order operations where required), email/phone partially masked in general logs.
- PII access is permissioned (`customers.pii.view`) and audited.
- Data export/erasure workflows with identity verification; erasure preserves invoices/financial records in anonymised form as legally required.
- Consent ledger for analytics/marketing; tags do not load before consent. Cookie banner offers equally prominent accept/reject; no pre-ticked boxes.
- Processor register (Razorpay, shipping providers, Resend, SMS, S3/Cloudinary, hosting, monitoring) with DPAs and cross-border transfer assessment.
- Breach response: detect → contain → assess → notify Data Protection Board without delay and detailed report within 72h → notify data principals as required → CERT-In within 6h for specified cyber incidents.

---

## 9. Database security

- Separate roles: `app_rw` (DML only), `app_ro` (reporting read-only, optional), `migrator` (DDL, used only in release), `backup` (dump).
- No superuser in application connection strings.
- Connection pooling (PgBouncer or provider pooler); TLS required.
- Daily encrypted backups + WAL/PITR; restore test monthly; retention per policy.
- Migrations reviewed; no destructive automatic production migration. Two-step expand/contract for column drops.
- Audit triggers or application audit log for sensitive changes (price, role, refund, legal, settings).
- No direct database access from browsers or public networks.

---

## 10. Logging, monitoring and CERT-In

Structured JSON logs (pino) with `requestId`, `actorId` (hashed/pseudonymous where appropriate), route, status, latency, IP, user agent. Security events are a separate stream:

- login success/failure, lockout, MFA failure
- privilege/permission changes
- payment verification failure, amount mismatch, duplicate webhook
- refund approval/execution
- data export/erasure
- admin PII access
- upload rejection/malware detection
- rate-limit breaches and suspicious velocity
- legal publication and consent changes

Retention: 180 days minimum, India region. Tamper resistance: append-only storage/object lock where available; daily digest. Alerts: payment failure spike, 5xx spike, auth failure spike, queue backlog, DB replication lag, backup failure, certificate expiry.

Incident response: see `docs/10-INCIDENT-RESPONSE.md` (Phase 14). CERT-In report within 6 hours of noticing a specified incident; DPB notification without delay and details within 72 hours.

---

## 11. Secrets and supply chain

- Secrets in a secret manager or platform env; `.env` never committed. `.env.example` contains placeholders only.
- Separate keys per environment; rotation procedure documented.
- CSPT/CI: lockfile committed, `npm ci`, dependency audit, Dependabot/Renovate, pinned GitHub Actions by SHA, least-privilege `GITHUB_TOKEN`, protected branches, signed commits recommended.
- Container: non-root user, read-only filesystem where possible, minimal image, no build secrets, image scanning.
- No `eval`, no dynamic `require` of user input, no untrusted HTML.

---

## 12. Security testing plan

| Area            | Tests                                                                                                                                    |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Auth            | registration enumeration, brute force, session fixation/rotation, cookie flags, CSRF, password reset token reuse/expiry, OTP brute force |
| Access control  | IDOR on orders/addresses/returns/invoices, horizontal/vertical privilege escalation, admin API without permission, mass assignment       |
| Injection       | SQLi attempts through filters/search, XSS in reviews/CMS/product fields, template injection, header injection                            |
| Payments        | webhook spoofing, duplicate/replay, amount/currency tampering, verify-before-webhook and webhook-before-verify, refund overdraw          |
| Inventory races | concurrent checkout of last unit, reservation expiry, cancellation/refund double restock                                                 |
| Uploads         | MIME spoof, polyglot, oversize, decompression bomb, path traversal, SVG                                                                  |
| Rate limiting   | distributed limits across instances, bypass via headers/IPv6                                                                             |
| Data leakage    | error messages, logs, source maps, `.env`, debug endpoints                                                                               |
| Dependencies    | `npm audit`, container scan, secret scan (gitleaks)                                                                                      |
| Load            | k6 scenarios for browse/search/cart/checkout/admin; document actual results only                                                         |

Security tests run in CI (unit/integration) and a pre-release checklist (DAST + manual). A third-party penetration test is required before go-live for payment/admin surfaces.

---

## 13. Go-live security checklist

- [ ] All secrets generated, stored, rotated from any dev values
- [ ] Production cookies Secure/HttpOnly/SameSite verified over HTTPS
- [ ] CSP enforced (not report-only) with no unexplained violations
- [ ] Admin MFA enforced; default staff accounts disabled
- [ ] RBAC matrix reviewed against job roles
- [ ] Rate limits verified across two app instances
- [ ] Razorpay live keys, webhook secret, IP allowlist, test→live reconciliation
- [ ] Webhook duplicate/replay tests pass
- [ ] Backups encrypted; restore drill passed
- [ ] DB roles least-privilege; migration role not used at runtime
- [ ] Log retention 180 days in India; CERT-In contact registered
- [ ] DPDP notice/consent, privacy requests, breach runbook reviewed
- [ ] Penetration test findings closed or risk-accepted in writing
- [ ] Dependency and container scans clean
- [ ] Error pages do not leak internals
- [ ] Incident contacts and escalation tested
