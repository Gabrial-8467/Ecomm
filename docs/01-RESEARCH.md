# Phase 0 — Research Findings and Locked Decisions

**Research date:** 8 November 2026
**Scope:** Indian retail e-commerce for furniture and electronics, single-seller inventory model (D2C), INR, pan-India delivery.
**Status of this document:** Phase 0/1 deliverable. It records what was verified, what was assumed, and what still requires business or legal confirmation.

> This is engineering research, not legal advice. Every policy and legal workflow in this repository must be reviewed by a qualified Indian lawyer before publication. Business-specific identifiers are intentionally absent and must be supplied by the operator through admin settings.

---

## 1. Verified toolchain

Versions were read from the public npm registry `dist-tags` and from the frameworks' own upgrade documentation on 8 November 2026.

| Package               | Verified latest                                           | Version selected            | Reason                                                                                                                                                                                                       |
| --------------------- | --------------------------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Node.js               | 24.18.0 (installed)                                       | 24.x LTS                    | Active LTS, meets Next.js 16 (`>=20.9`) and Prisma 7 (`>=20.19`)                                                                                                                                             |
| Next.js               | 16.4.5                                                    | 16.4.5                      | Current stable; App Router, Turbopack default, async request APIs                                                                                                                                            |
| React / React DOM     | 19.3.1                                                    | 19.3.1                      | Required by Next.js 16                                                                                                                                                                                       |
| TypeScript            | 7.0.2 (`latest`)                                          | **5.9.3**                   | `@typescript-eslint/parser` supports `>=4.8.4 <6.1.0`. TS 7 is not yet compatible with the lint/type toolchain; choosing it would violate "mutually compatible". Revisit when typescript-eslint supports it. |
| Tailwind CSS          | 4.3.5                                                     | 4.3.5                       | Current stable, CSS-first config                                                                                                                                                                             |
| shadcn/ui CLI         | 4.23.0                                                    | component source only       | Copy-in components, no runtime dependency                                                                                                                                                                    |
| Prisma CLI / Client   | 7.10.1 stable (`latest` tag currently points to 8.0.0-rc) | **7.10.1**                  | 8 is a release candidate; production app must not ship an RC ORM                                                                                                                                             |
| Prisma driver adapter | 7.10.1                                                    | `@prisma/adapter-pg` 7.10.1 | Prisma 7 requires an adapter                                                                                                                                                                                 |
| PostgreSQL            | 18.6                                                      | 18.x                        | Current major; tested locally                                                                                                                                                                                |
| Redis                 | 8.x                                                       | 8.x (Docker)                | Redis 7+ required by BullMQ 6; 8 is current stable                                                                                                                                                           |
| BullMQ                | 6.7.2                                                     | 6.7.2                       | Current stable                                                                                                                                                                                               |
| Zod                   | 4.6.7                                                     | 4.6.7                       | Current stable                                                                                                                                                                                               |
| TanStack Query        | 5.107.1                                                   | 5.107.1                     | Client server-state                                                                                                                                                                                          |
| React Hook Form       | 7.91.0                                                    | 7.91.0                      | Admin/public forms                                                                                                                                                                                           |
| Lucide React          | 1.70.0                                                    | 1.70.0                      | Icons                                                                                                                                                                                                        |
| Vitest                | 5.1.0                                                     | 5.1.0                       | Unit/integration                                                                                                                                                                                             |
| Playwright            | 1.65.0                                                    | 1.65.0                      | E2E                                                                                                                                                                                                          |
| ESLint                | 10.14.0                                                   | 10.14.0                     | Flat config; `next lint` removed in Next 16                                                                                                                                                                  |
| Prettier              | 3.9.10                                                    | 3.9.10                      | Formatting                                                                                                                                                                                                   |
| Razorpay SDK          | 2.9.8                                                     | 2.9.8                       | Payments                                                                                                                                                                                                     |
| Resend                | 6.37.0                                                    | 6.37.0                      | Transactional email                                                                                                                                                                                          |
| AWS SDK S3            | 3.1164.0                                                  | 3.1164.0                    | Object storage adapter                                                                                                                                                                                       |
| Cloudinary            | 2.11.0                                                    | optional adapter            | Alternative storage                                                                                                                                                                                          |
| Argon2                | `@node-rs/argon2` 2.2.2                                   | 2.2.2                       | Native Argon2id, prebuilt binaries                                                                                                                                                                           |
| Decimal.js            | 10.6.0                                                    | 10.6.0                      | Money math outside Prisma                                                                                                                                                                                    |
| otplib                | 13.6.0                                                    | 13.6.0                      | Admin TOTP MFA                                                                                                                                                                                               |

**Deliberate exclusions**

- **No NextAuth/Auth.js.** The requirement is server-managed sessions with rotation and revocation. A small, auditable session module backed by a `Session` table is simpler and avoids a second authorization model.
- **No Prisma 8 RC.** RC software is not production-grade.
- **No microservices, no separate GraphQL layer.** Modular monolith, REST + Server Actions.
- **No client-side price authority.** All totals are recomputed server-side.
- **No marketplace payouts/commissions.** This build is an inventory-owning seller. The schema keeps a `Seller` seam so marketplace support can be added later, but marketplace obligations are not claimed as implemented.

---

## 2. Regulatory findings that change the software design

### 2.1 Consumer Protection (E-Commerce) (Amendment) Rules, 2026

Notified as **G.S.R. 789(E) on 9 September 2026**, announced by PIB on 10 September 2026, and **commencing 1 January 2027**. It amends the Consumer Protection (E-Commerce) Rules, 2020.

Design consequences (must exist before 1 January 2027):

1. **Prior-price disclosure.** When a price reduction is announced, display the reduced price **and** the lowest price at which the item was offered in the preceding 30 days. This requires an immutable, per-variant price history table. A "compare at" price invented in the CMS is not acceptable.
2. **Sponsored listing disclosure.** Any paid placement must be clearly and prominently labelled as sponsored, distinct from organic results. Ranking logic must be explainable.
3. **Search/ranking transparency.** Do not manipulate results to mislead; be able to explain the ranking parameters.
4. **Dark-pattern compliance.** Comply with the Guidelines for Prevention and Regulation of Dark Patterns, 2023; conduct an **annual self-audit**; prominently display a compliance certificate. The software needs an audit record and a certificate record with validity dates.
5. **Seller and importer identity.** Display seller name, address, contact, importer details and country of origin with appropriate prominence; invoice templates must identify the actual seller, not only the platform brand.
6. **Complaint handling.** Acknowledge consumer complaints within 48 hours, provide the complainant a copy of the recorded complaint, and resolve within one month. The grievance module must record acknowledgement and resolution timestamps and produce a downloadable complaint copy.
7. **National Consumer Helpline convergence.** Be able to participate in NCH convergence; store NCH reference numbers against grievances.
8. **No dark patterns.** Explicitly prohibited in this product: fake countdowns, fake stock scarcity, hidden charges, preselected paid add-ons, misleading discount percentages, forced subscriptions, confusing cancellation, fake reviews, manipulated checkout ordering.

Sources: PIB release 10 Sep 2026; G.S.R. 789(E); ICLG briefing "Transparency by Design"; TaxGuru reproduction.

### 2.2 Digital Personal Data Protection Act, 2023 and DPDP Rules, 2025

- The DPDP Rules, 2025 were notified on **13 November 2025** (Gazette 14 November 2025).
- Implementation is phased: the Data Protection Board was established immediately; the consent-manager framework matures on **13 November 2026**; the core obligations on data fiduciaries (notice, consent, security, data-principal rights, breach reporting, SDF duties) are enforced from **13 May 2027**.
- Breach reporting: first intimation to the Data Protection Board without delay, detailed intimation within **72 hours**.
- The Third Schedule imposes retention/erasure duties on e-commerce entities: erase personal data after **three years of inactivity**, with intimation to the data principal **48 hours before erasure** (verify the final rule text against the Gazette before go-live).
- Consent must be free, specific, informed, unconditional and unambiguous; pre-ticked boxes are not consent. Non-essential analytics/marketing tags must not fire before consent.
- Data-principal rights: access, correction, erasure, grievance redressal, nomination. The app needs a privacy-request workflow with verified identity and statutory clocks.
- A Significant Data Fiduciary may be notified based on volume/sensitivity; SDF duties include an India-based DPO, DPIA, and annual audit. The design keeps these as configurable controls rather than assuming SDF status.

**Design consequences:** consent ledger with policy version and evidence; cookie/tag consent gate; data export and erasure jobs; anonymisation that preserves GST invoices and statutory financial records; retention scheduler; grievance SLA clocks; processor register.

### 2.3 Legal Metrology (Packaged Commodities) Rules, 2011

- Rule 6(10) requires e-commerce entities to display the mandatory package declarations on the listing: manufacturer/packer/importer name and address, country of origin, generic commodity name, net quantity, MRP, unit sale price, consumer-care details, and month/year of manufacture where applicable.
- 2026 amendments (G.S.R. 128(E) of 13 Feb 2026 and subsequent amendments) add/alter e-commerce declarations. Secondary reports indicate the searchable/sortable **country-of-origin filter** was moved to **1 July 2027** by G.S.R. 312(E) of 27 April 2026. Confirm the operative Gazette text before implementing the deadline.
- Penalties were revised by the Jan Vishwas (Amendment of Provisions) Act, 2026. Do not rely on secondary summaries for penalty amounts.

**Design consequences:** product-level fields for manufacturer/packer/importer, country of origin, net quantity + unit, MRP, unit sale price; a filterable country-of-origin facet; listing validation that blocks publishing when mandatory declarations are missing.

### 2.4 GST

- "GST 2.0" rate rationalisation has applied since **22 September 2025**: principal slabs 5% and 18%, with 0% exemptions and a 40% demerit rate for specified goods. Most consumer electronics (large TVs, ACs, refrigerators, washing machines) moved from 28% to 18%; mobile phones and laptops remain 18%. Furniture rates vary by item and material (commonly 18%; some items 5%). Rates must be stored per product/HSN, not hardcoded.
- Indian retail MRP is tax-inclusive. The platform will store tax-inclusive selling prices, extract GST for the invoice, and show the tax breakdown transparently.
- Intra-state supply splits into CGST + SGST; inter-state supply uses IGST. The place of supply is derived from the shipping address state versus the seller's registered state.
- GST invoices must comply with Rule 46 of the CGST Rules (supplier/buyer details, invoice number series, HSN, taxable value, tax rate and amount, place of supply). Invoice numbers must be sequential per financial year.
- E-invoicing applies above the notified aggregate turnover threshold; the threshold and B2C e-invoicing rollout must be confirmed at deployment. The invoice module exposes the IRN/QR fields so the operator can integrate when applicable.
- TCS under section 52 applies to e-commerce operators; an own-inventory seller is generally not an ECO for TCS. This must be confirmed with the operator's CA based on the actual business model.

**Design consequences:** `hsnCode`, `gstRate`, `priceIncludesTax`, `placeOfSupply`, CGST/SGST/IGST breakdown, invoice sequence per FY, immutable order tax snapshots, GST report/export.

### 2.5 CERT-In Directions, 2022

- Directions No. 20(3)/2022-CERT-In dated 28 April 2022, effective 28 June 2022.
- Report specified cyber incidents to CERT-In within **6 hours** of noticing.
- Enable and retain ICT logs for a rolling **180 days**, stored within Indian jurisdiction.
- Synchronise clocks to NIC/NPL NTP sources.
- Maintain a named point of contact.

**Design consequences:** structured JSON logs with request IDs and security events; India-region log storage; 180-day retention; incident-response runbook; alerting for payment anomalies, auth attacks and mass data access.

### 2.6 RBI payment framework

- The RBI (Regulation of Payment Aggregators) Directions, 2025 were issued on **15 September 2025** and supersede the 2020 PA/PG guidelines. Razorpay operates as a regulated payment aggregator; the merchant is not the PA.
- The merchant must not store raw card data. Use Razorpay's hosted/PCI-compliant checkout. Card-on-file, if ever enabled, must use network tokenisation.
- Merchant KYC with the PA is mandatory. The operator must complete Razorpay onboarding with the legal entity and GST details.
- Payment amounts/currency must be validated server-side; webhooks must be signature-verified and idempotent.

### 2.7 Other applicable regimes

| Regime                                                          | Relevance                                                                   | Software implication                                                                     |
| --------------------------------------------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Consumer Protection Act, 2019                                   | Unfair trade practices, product liability, 2-year limitation for complaints | Complaint records, evidence retention, no misleading pricing, warranty/return workflows  |
| Guidelines for Prevention and Regulation of Dark Patterns, 2023 | 13 specified dark patterns                                                  | Design review checklist; annual audit record; UI rules                                   |
| IT Act, 2000 + SPDI Rules, 2011                                 | Reasonable security practices, sensitive personal data                      | Encryption, access control, incident response (until DPDP fully supersedes)              |
| IT (Intermediary Guidelines) Rules, 2021                        | If the platform later hosts third-party content/sellers                     | Not applicable to a pure own-inventory store; marketplace mode needs additional controls |
| E-waste (Management) Rules, 2022                                | Electronics take-back/EPR                                                   | Product metadata and operator processes; not a checkout feature                          |
| Battery Waste Management Rules, 2022                            | Batteries in electronics                                                    | Operator compliance; supplier declarations                                               |
| BIS Compulsory Registration Scheme                              | Electronics requiring BIS registration                                      | Supplier/product compliance fields and listing checks                                    |
| Legal Metrology Act, 2009                                       | Weights, measures, MRP declarations                                         | Product declaration fields                                                               |
| CGST Act, 2017 + Rules                                          | Invoicing, records, e-invoicing                                             | Invoice/GST modules, 8-year record retention                                             |
| Companies Act, 2013                                             | Registered office, CIN, grievance officer disclosures                       | Business profile settings                                                                |

---

## 3. Business-model assumption (important)

This implementation is a **single-seller, inventory-owning e-commerce entity** ("inventory e-commerce entity" under the 2020 Rules), not a marketplace.

What that means:

- The operator is the seller of record and is responsible for the product, invoice, warranty and grievance.
- There are no third-party sellers, commissions, seller payouts or seller onboarding/KYC flows in v1.
- The `Seller` table exists so the legal seller identity is data-driven and marketplace support can be added later without rewriting products/orders.
- Marketplace-specific duties (seller verification, related-party ranking restrictions, marketplace data-use restrictions) are **not claimed as implemented**. They are listed in the roadmap as a separate future workstream.

This distinction is critical because marketplace obligations are materially broader. Do not describe this system as a marketplace.

---

## 4. Locked architectural decisions

| #       | Decision                                          | Rationale                                                                      | Consequence                                                   |
| ------- | ------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------- |
| ADR-001 | Modular monolith, six layers                      | Fits a small team; permits later extraction of payments/shipping/notifications | Strict module boundaries; no Prisma in UI                     |
| ADR-002 | Server-managed opaque sessions                    | Revocation, rotation, no long-lived tokens in localStorage                     | `Session` table + HttpOnly cookie + CSRF token                |
| ADR-003 | Argon2id password hashing                         | OWASP recommendation                                                           | `@node-rs/argon2`, tuned parameters                           |
| ADR-004 | CUID2-style IDs via `cuid()`                      | Stable, sortable, non-enumerable                                               | All models use `String @id @default(cuid())`                  |
| ADR-005 | `Decimal(14,2)` for money, `Decimal(5,2)` for tax | No floating point in financial paths                                           | Decimal.js in domain; Prisma Decimal at boundaries            |
| ADR-006 | Tax-inclusive catalog prices                      | Indian MRP convention; transparent extraction                                  | Selling price includes GST; invoice shows taxable value + tax |
| ADR-007 | Immutable order/invoice snapshots                 | Historical accuracy; legal record                                              | OrderItem copies names, SKU, HSN, price, tax                  |
| ADR-008 | Per-variant price history                         | 2026 prior-price rule                                                          | `ProductPriceHistory` appended on every price change          |
| ADR-009 | Checkout-time inventory reservation               | Prevent overselling without blocking carts                                     | Atomic conditional `UPDATE`; TTL + BullMQ release             |
| ADR-010 | Transactional outbox + BullMQ                     | No lost emails/notifications on crash                                          | `OutboxEvent` written in same transaction as business change  |
| ADR-011 | Razorpay hosted checkout                          | PCI scope reduction                                                            | Server creates order; webhook is the source of truth          |
| ADR-012 | PostgreSQL full-text search behind adapter        | No extra infrastructure now                                                    | `SearchProvider` interface; Meilisearch later                 |
| ADR-013 | REST `/api/v1` + Server Actions                   | Public/mobile/webhooks use REST; admin forms use actions                       | Shared service layer for both                                 |
| ADR-014 | Single currency INR, but currency code stored     | Avoids hardcoding in money types                                               | `currency` on cart/order/payment                              |
| ADR-015 | Legal content versioned in DB, not hardcoded      | Consent evidence and policy change history                                     | `LegalDocument` + `LegalDocumentVersion`                      |
| ADR-016 | No non-essential tracking before consent          | DPDP                                                                           | Consent-gated tag loader                                      |
| ADR-017 | India-region logs, 180-day retention              | CERT-In                                                                        | Log pipeline config + retention job                           |
| ADR-018 | S3-compatible storage with Cloudinary adapter     | Portability                                                                    | `StorageProvider` interface                                   |

---

## 5. Facts that must come from the business (not invented)

The UI and seed data must never fabricate these. They are admin settings, published only when supplied and reviewed.

- Legal entity name, trade name, entity type, CIN/LLPIN (if any)
- GSTIN, PAN, registered office and principal place of business
- Customer-care email, phone, hours, languages
- Grievance officer name, designation, email, phone, postal address
- Warehouse addresses and GST registration per state (for place of supply)
- Return windows by category, non-returnable categories, restocking fees (if lawful)
- Warranty terms by brand/category and service-centre details
- COD limits, COD fee, eligible PIN codes
- Shipping charges, free-shipping threshold, furniture delivery/installation fees
- Razorpay keys, Resend domain, SMS sender IDs, S3 bucket/CDN
- Privacy contact, DPO (if applicable), SDF status
- Brand assets, product photography, manufacturer/importer declarations
- Statutory registrations relevant to electronics (BIS CRS, EPR) and furniture

---

## 6. Source register

Accessed 8 November 2026 unless stated.

1. Next.js 16 upgrade guide — https://nextjs.org/docs/app/guides/upgrading/version-16
2. Prisma ORM 7 upgrade guide — https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions/upgrading-to-prisma-7
3. npm registry dist-tags — https://registry.npmjs.org/
4. PIB, "Government amends E-Commerce Rules..." 10 Sep 2026; G.S.R. 789(E) dated 9 Sep 2026 (reproduced at https://taxguru.in/corporate-law/consumer-protection-commerce-amendment-rules-2026.html)
5. ICLG, "Transparency by Design: India's 2026 E-Commerce Rules Amendment"
6. Consumer Protection (E-Commerce) Rules, 2020 — https://consumeraffairs.nic.in/
7. Guidelines for Prevention and Regulation of Dark Patterns, 2023 — CCPA, https://consumeraffairs.nic.in/
8. DPDP Act, 2023; DPDP Rules, 2025 (notified 13 Nov 2025) — https://www.meity.gov.in/
9. CERT-In Directions No. 20(3)/2022-CERT-In, 28 Apr 2022 — https://www.cert-in.org.in/
10. RBI (Regulation of Payment Aggregators) Directions, 2025, 15 Sep 2025 — https://www.rbi.org.in/
11. Legal Metrology (Packaged Commodities) Rules, 2011 and 2026 amendments — https://consumeraffairs.gov.in/pages/legal-metrology-act
12. PIB GST 2.0 factsheet — https://www.pib.gov.in/FactsheetDetails.aspx?Id=150302
13. CGST Act, 2017 and CGST Rules, 2017 (Rule 46 invoices) — https://cbic-gst.gov.in/

Any provision marked "verify" above must be checked against the Gazette and confirmed by Indian counsel/CA at deployment.
