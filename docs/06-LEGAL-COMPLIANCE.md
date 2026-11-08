# Legal and Regulatory Compliance Matrix — India

**As researched on:** 8 November 2026
**Business model assumed:** single-seller, inventory-owning e-commerce entity (not a marketplace)
**Deployment target:** pan-India, INR, Razorpay payments, third-party logistics

> **This is not legal advice and is not a substitute for review by an Indian lawyer and chartered accountant.** Effective dates and thresholds change. Items marked **VERIFY** must be checked against the Gazette/official notification immediately before launch. All business identifiers are placeholders and must be entered in admin settings; this repository must never ship invented GSTINs, addresses, registrations, officer identities or refund promises.

---

## 1. Compliance matrix

| #   | Instrument                                                                           | Core obligation relevant to this platform                                                                                                                                                                                                                                                                       | Effective / applicability                              | Implementation in product                                                                                                                     | Status                            |
| --- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| 1   | Consumer Protection Act, 2019                                                        | No unfair/restrictive trade practice; no false or misleading advertisement; product liability; consumer can complain within 2 years                                                                                                                                                                             | In force                                               | Honest pricing, no dark patterns, complaint/grievance records, evidence retention, warranty/return workflows                                  | Planned                           |
| 2   | Consumer Protection (E-Commerce) Rules, 2020                                         | Entity identity, contact, grievance officer, 48h acknowledgement, 1-month redressal; seller/importer/country-of-origin disclosures; no cancellation charges unless stated; refund if goods not as advertised/late                                                                                               | In force                                               | Grievance module with SLA clocks, seller data model, product declarations, cancellation policy enforcement, audit                             | In progress                       |
| 3   | Consumer Protection (E-Commerce) (Amendment) Rules, 2026 (G.S.R. 789(E), 9 Sep 2026) | Prior price (lowest in preceding 30 days) with every announced reduction; sponsored listings clearly identified; no misleading search manipulation; explain ranking; annual dark-pattern self-audit + displayed certificate; complaint copy; NCH convergence; seller/importer prominence; data-use restrictions | **1 January 2027**                                     | `ProductPriceHistory`; `SponsoredPlacement`; ranking policy page; `ComplianceAudit`; complaint PDF; NCH reference field; invoice seller block | **Must finish before 1 Jan 2027** |
| 4   | Guidelines for Prevention and Regulation of Dark Patterns, 2023                      | Prohibits 13 specified dark patterns (false urgency, scarcity, confirmshaming, forced action, subscription trap, hidden costs, bait-and-switch, drip pricing, disguised ads, nagging, obstruction, pre-selection, trick questions)                                                                              | In force; incorporated into 2026 Rules from 1 Jan 2027 | Design rules + review checklist; no fake timers/stock; equal accept/reject consent; total price before payment; cancellation self-service     | Planned                           |
| 5   | Digital Personal Data Protection Act, 2023                                           | Notice, consent, purpose limitation, data minimisation, accuracy, security safeguards, breach intimation, data-principal rights, grievance redressal                                                                                                                                                            | Phased; core obligations **13 May 2027**               | Consent ledger, privacy request workflow, retention/erasure jobs, breach runbook, processor register, security controls                       | In progress                       |
| 6   | DPDP Rules, 2025 (notified 13 Nov 2025)                                              | Standalone notice; itemised consent; consent withdrawal; rights; breach: first intimation without delay, detailed within **72 hours**; e-commerce erasure after **3 years inactivity** with **48h prior intimation** (Third Schedule — **VERIFY**)                                                              | Phased 13 Nov 2025 / 13 Nov 2026 / 13 May 2027         | Consent records with policy version, withdrawal API; privacy requests; scheduled retention/erasure with notification; audit evidence          | Planned                           |
| 7   | Information Technology Act, 2000 + SPDI Rules, 2011                                  | Reasonable security practices; sensitive personal data safeguards; intermediary obligations if applicable                                                                                                                                                                                                       | In force until DPDP supersedes                         | Security programme; encryption; access control; incident response                                                                             | In progress                       |
| 8   | Legal Metrology Act, 2009 + Packaged Commodities Rules, 2011 (as amended)            | Mandatory declarations for pre-packaged goods; e-commerce listing disclosures under Rule 6(10); MRP, unit sale price, net quantity, manufacturer/packer/importer, country of origin, consumer care; country-of-origin filter (2026 amendment; date **VERIFY**)                                                  | Rule 6(10) in force; 2026 amendments phased            | Product declaration fields; publish validation; origin facet/filter; price display; unit sale price                                           | In progress                       |
| 9   | CGST Act, 2017 + CGST Rules, 2017                                                    | GST registration, tax invoice (Rule 46), HSN, place of supply, CGST/SGST/IGST, sequential invoice series, records (8 years), e-invoicing above threshold                                                                                                                                                        | In force; GST 2.0 rates from 22 Sep 2025               | Tax engine, invoice sequence, GST snapshots, reports/exports, e-invoice fields                                                                | In progress                       |
| 10  | GST e-invoicing / B2C QR                                                             | IRN/QR for notified classes/thresholds                                                                                                                                                                                                                                                                          | Threshold **VERIFY** at deployment                     | Invoice model exposes IRN/ack/QR; integration adapter                                                                                         | Planned                           |
| 11  | TCS under CGST s.52                                                                  | E-commerce operators collect TCS; own-inventory seller generally outside                                                                                                                                                                                                                                        | Applicability **VERIFY with CA**                       | Business model is own-inventory; no TCS engine in v1                                                                                          | Out of scope v1                   |
| 12  | CERT-In Directions, 2022 (No. 20(3)/2022-CERT-In)                                    | Report specified incidents within **6 hours**; 180-day ICT logs in India; NTP sync; named contact                                                                                                                                                                                                               | In force since 28 Jun 2022                             | Structured logs, India-region retention, incident runbook, alerting                                                                           | Planned                           |
| 13  | RBI (Regulation of Payment Aggregators) Directions, 2025                             | Merchant KYC with PA; no raw card storage; tokenisation for card-on-file; grievance/security duties; PA handles escrow                                                                                                                                                                                          | In force 15 Sep 2025                                   | Razorpay hosted checkout, no card data, server verification, reconciliation, processor register                                               | In progress                       |
| 14  | PCI DSS                                                                              | SAQ-A scope if hosted checkout and no card data                                                                                                                                                                                                                                                                 | Contractual                                            | Hosted checkout; no card fields; CSP allowlist                                                                                                | Planned                           |
| 15  | E-waste (Management) Rules, 2022                                                     | EPR/take-back for electronics                                                                                                                                                                                                                                                                                   | In force                                               | Product metadata + operator process; not automated in v1                                                                                      | Operator                          |
| 16  | Battery Waste Management Rules, 2022                                                 | EPR for batteries                                                                                                                                                                                                                                                                                               | In force                                               | Supplier declarations; operator process                                                                                                       | Operator                          |
| 17  | BIS Compulsory Registration Scheme                                                   | Electronics in notified categories must be BIS registered                                                                                                                                                                                                                                                       | In force                                               | Product compliance fields (BIS registration no.); listing validation for notified categories                                                  | Planned                           |
| 18  | Companies Act, 2013                                                                  | Registered office, CIN, statutory disclosures                                                                                                                                                                                                                                                                   | In force                                               | `Seller` legal profile; footer and legal pages                                                                                                | Planned                           |
| 19  | Copyright Act, 1957 / Trade Marks Act, 1999                                          | Product images, brand names, user content                                                                                                                                                                                                                                                                       | In force                                               | Upload rights attestation; takedown workflow via support/grievance                                                                            | Planned                           |
| 20  | National Consumer Helpline convergence                                               | Participate in NCH convergence (2026 Rules)                                                                                                                                                                                                                                                                     | 1 Jan 2027                                             | `Grievance.nchReference`; NCH status field; reporting                                                                                         | Planned                           |

---

## 2. E-Commerce Rules 2026 — implementation detail

### 2.1 Prior price

- Every variant price change appends `ProductPriceHistory` with `effectiveFrom`; the previous row gets `effectiveTo`.
- When a discount is displayed, compute `priorPrice = MIN(price)` over the 30 days before the reduction announcement. If there is no 30-day history, show the current price as prior/current and do not claim a reduction. Never use MRP as a fake "was" price.
- The UI shows: selling price, MRP (only if genuinely the MRP), prior price and the 30-day window, discount amount/percentage, and tax-inclusive status.
- Admin cannot enter "compare at" prices manually. The only accepted reference is the price history.
- Tests cover: no history, partial history, interrupted price, multiple changes, tax-inclusive prices, and promo vs base price.

### 2.2 Sponsored listings

- Sponsored placements are separate records with `disclosureLabel` ("Sponsored") rendered adjacent to the product card/result, not in a tooltip or footer.
- Organic ranking and sponsored ranking are computed separately; a sponsored block is clearly separated and labelled.
- Ranking policy page explains factors (relevance, availability, rating, price, delivery, sales) in plain language. No paid placement may silently override relevance.
- Admin reports show sponsored spend/placement and labelled impressions.

### 2.3 Dark patterns

Prohibited in code review and QA:

- Fake countdown timers or resetting urgency clocks
- Fake "only X left" or fabricated recent-purchase notifications
- Hidden fees revealed only at payment
- Pre-ticked paid add-ons, insurance, donations or newsletter
- Misleading discount percentages (MRP anchoring, inflated prior price)
- Forced account creation before checkout
- Forced subscription or auto-renewal
- Confusing cancellation or return flows
- Confirm-shaming ("No thanks, I don't want to save money")
- Disguised ads
- Nagging interstitials
- Drip pricing
- Trick questions / double negatives
- Asymmetric accept/reject cookie buttons

The `ComplianceAudit` record stores the annual self-audit, findings, remediation, certificate URL and validity. The certificate is displayed prominently on the legal/compliance page only after a real audit is completed. **Do not generate a fake certificate in seed data.**

### 2.4 Complaints and grievances

- A complaint gets a unique number and a downloadable/emailed copy at submission (`copySentAt`).
- Acknowledgement SLA: 48 hours (`acknowledgedAt`, job alerts at 24h/48h).
- Resolution SLA: one month (`statutoryDueAt`, alerts at 20/27 days).
- Status history is append-only; staff replies and internal notes are separated.
- NCH reference and convergence status are recorded where applicable.
- Customer care and grievance officer details come from admin settings and appear in the footer, contact page and every policy page.

---

## 3. DPDP implementation detail

| Obligation         | Implementation                                                                                                                            |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Notice             | Standalone, plain-language privacy notice; itemised purposes; link at collection point; versioned                                         |
| Consent            | Unbundled, specific, affirmative; no pre-tick; consent ledger with timestamp, policy version, IP/UA, purpose; withdrawal as easy as grant |
| Purpose limitation | Analytics/marketing tags gated by consent purpose; order processing has a separate lawful basis/notice                                    |
| Data minimisation  | Only fields needed; no ID scans for ordinary purchases; optional profile fields                                                           |
| Retention          | Configurable schedule; e-commerce inactivity erasure at 3 years (VERIFY final rules); financial records preserved anonymised for 8 years  |
| Rights             | Access/export, correction, erasure, grievance, nomination; identity verification; statutory clocks; response artefacts stored             |
| Breach             | 6h CERT-In + DPB without delay + detailed 72h; affected principals notified per rules; incident log                                       |
| Security           | See `05-SECURITY.md`                                                                                                                      |
| Processors         | Register with purpose, data categories, location, DPA status; Razorpay, logistics, email/SMS, storage, hosting, monitoring                |
| Children           | Platform not directed at children; no behavioural advertising; age gate where required; parental consent flow if ever applicable          |
| SDF                | Status unknown until notified; controls (DPO, DPIA, audit) are configurable and can be enabled without a rewrite                          |

Data export format: machine-readable JSON + human-readable summary. Erasure: hard-delete/anonymise non-financial PII; preserve invoice/order records with a pseudonymous customer reference; record legal basis for retention. Never delete financial records on request without legal review.

---

## 4. Product listing declarations (Legal Metrology)

A product cannot be published unless these are present (where applicable):

- Legal seller name and address (from `Seller`)
- Manufacturer/packer/importer name and address
- Country of origin / manufacture / assembly (imported goods)
- Generic/common commodity name
- Net quantity and unit (SI), number of units where sold by count
- Month/year of manufacture or import (where applicable)
- MRP (₹, inclusive of all taxes)
- Unit sale price (₹ per unit of measure) where required
- Consumer care details (name, address, email, phone)
- Warranty and service-centre information
- BIS registration number for notified electronics; EPR/ewaste info where applicable
- Assembly/installation requirements for furniture
- Dimensions, material, finish and care instructions for furniture

Storefront displays these on the product page, not only in an image. Admin validation blocks `ACTIVE` status when mandatory fields are missing. Country-of-origin is a filter facet. The operator must keep packaging/label evidence.

---

## 5. GST and invoicing

- Prices are stored tax-inclusive (MRP convention) with `priceIncludesTax=true`; the checkout shows the tax component.
- Place of supply = shipping address state (goods). Seller state from `Seller`/warehouse registration. Intra-state = CGST+SGST; inter-state = IGST.
- HSN code and GST rate per product; rates are data, not constants (GST 2.0: 5/18/40, exemptions).
- Invoice fields: sequential number per FY, date, seller name/address/GSTIN, buyer name/address/GSTIN (if provided), place of supply, HSN, description, quantity, taxable value, rate, CGST/SGST/IGST amounts, total, round-off, tax-inclusive note.
- Invoice numbers are issued inside a transaction from `InvoiceSequence`; gaps require a documented cancellation/credit-note process.
- Credit notes for cancellations/refunds, linked to the original invoice. The schema supports refunds; credit-note document generation is Phase 10 work.
- Records retained 8 years. Exports for CA/GST returns.
- E-invoicing/IRN/QR integration is adapter-based and enabled only when the operator crosses the notified threshold (**VERIFY**).
- Shipping and COD fees have explicit tax treatment in settings; do not silently include them in the product taxable value.

---

## 6. Returns, refunds, warranty (legal design)

- The policy engine enforces **minimum legal rights**, not a blanket "no refunds". Defective/damaged/wrong/missing goods remain actionable even outside a voluntary window.
- Configurable per category: return window, replacement allowed, warranty months, condition requirements, non-returnable items (only where lawful, e.g. personal hygiene/sealed goods with clear pre-purchase disclosure).
- The customer sees eligibility before submitting; the server re-evaluates with the order/item snapshot.
- Damaged-on-arrival and wrong-item flows are prioritised and do not require the customer to prove non-fault beyond reasonable evidence.
- Refund timelines are stated and tracked; the status is only `COMPLETED` after the provider confirms or a manual transfer reference is recorded.
- Warranty claims route to manufacturer service centres where applicable; the platform records the claim and evidence. Do not imply the platform is the manufacturer.
- Restocking fees are configurable but must be lawful, disclosed before purchase, and must not override statutory rights.

---

## 7. Policy publication workflow

1. Admin creates a `LegalDocumentVersion` in `DRAFT` with content and change summary.
2. Legal reviewer (external) reviews; `legalReviewStatus` records reviewer, date, reference. The identity is business data, not invented.
3. `PUBLISHED` sets `effectiveAt` and supersedes the prior version; content hash is stored.
4. If `requiresReacceptance`, customers see a blocking notice and accept; `UserPolicyAcceptance` is recorded.
5. The public page shows version, effective date, last updated date and a change history link.
6. Publishing requires `legal.publish` + step-up MFA; audit log entry.
7. Legal pages must never be auto-generated with invented facts. Draft placeholders are clearly marked `DRAFT — LEGAL REVIEW REQUIRED` and are `noindex`.

**Required legal review checklist**

- [ ] Legal entity name, CIN, GSTIN, registered/principal address verified
- [ ] Grievance officer name, designation, contact verified and consent obtained
- [ ] Customer care phone/email/hours verified
- [ ] Return windows, non-returnable categories, restocking fees reviewed for CPA consistency
- [ ] Warranty terms match manufacturer/seller commitments
- [ ] Refund timelines and methods match payment partner capabilities
- [ ] Shipping timelines, charges, COD limits, serviceable areas accurate
- [ ] Privacy notice purposes, processors, retention, cross-border transfers accurate
- [ ] Consent language and cookie categories reviewed
- [ ] Grievance SLA and NCH process reviewed
- [ ] Dark-pattern audit completed; certificate genuine
- [ ] 2026 Rules disclosures (prior price, sponsored, ranking, seller identity) reviewed
- [ ] GST invoice template reviewed by CA
- [ ] Product declarations (Legal Metrology) reviewed
- [ ] Terms jurisdiction, dispute resolution, liability clauses reviewed
- [ ] Publication date/effective date and reacceptance decision recorded

---

## 8. Business disclosures (to be filled by operator)

These are **settings**, not source code constants:

| Field                                                  | Required on                                           | Status                             |
| ------------------------------------------------------ | ----------------------------------------------------- | ---------------------------------- |
| Legal entity name                                      | Footer, invoices, policies, product page seller block | **MISSING — supply**               |
| Trade/brand name                                       | Header, invoices                                      | Working brand only                 |
| CIN/LLPIN                                              | Footer, policies                                      | **MISSING — supply if applicable** |
| GSTIN                                                  | Invoices, footer, policies                            | **MISSING — supply**               |
| PAN                                                    | Policies/records                                      | **MISSING — supply**               |
| Registered office                                      | Footer, policies, invoices                            | **MISSING — supply**               |
| Principal place of business                            | Policies, invoices                                    | **MISSING — supply**               |
| Customer care email/phone/hours                        | Footer, contact, product, policies                    | **MISSING — supply**               |
| Grievance officer name/designation/email/phone/address | Footer, grievance page, policies                      | **MISSING — supply + consent**     |
| DPO (if SDF)                                           | Privacy policy                                        | Not applicable until notified      |
| Warehouse addresses/GSTINs                             | Invoices/place of supply                              | **MISSING — supply**               |
| Return windows by category                             | Product, policy                                       | To be configured                   |
| COD limits/fee/PINs                                    | Checkout                                              | To be configured                   |
| Shipping charges/threshold                             | Checkout, policy                                      | To be configured                   |
| Warranty/service centres                               | Product, warranty policy                              | To be configured                   |

---

## 9. Marketplace distinction

The 2020 Rules impose additional duties on **marketplace e-commerce entities**: seller verification, seller grievance, related-party ranking restrictions, marketplace data-use limits, and (from 2026) seller-ranking disclosures.

This build does **not** implement a marketplace. It sells its own inventory and is the seller of record. The `Seller` table with `isPlatformOwner` is a seam, not a marketplace implementation. Do not use marketplace language in policies, and do not onboard third-party sellers until the marketplace workstream (KYC, payouts, commissions, seller portal, marketplace grievance, ranking controls) is delivered and legally reviewed.

---

## 10. Open questions for the operator/legal counsel

1. Exact legal entity, GSTIN(s), registered/principal addresses and warehouse registrations.
2. Grievance officer appointment and published contact details.
3. Whether the entity will be notified as a Significant Data Fiduciary.
4. Confirmed DPDP Third Schedule retention/erasure interpretation for order data.
5. E-invoicing threshold applicability and B2C QR rollout at launch.
6. Whether TCS applies based on the final operating model.
7. Category-specific return windows and any lawful non-returnable categories.
8. Warranty structure (manufacturer vs seller) by brand/category.
9. COD limits, fraud controls and serviceable PIN policy.
10. Cross-border data transfers/processors and hosting region.
11. Legal Metrology country-of-origin filter deadline after the 2026 amendments.
12. Consumer complaint escalation path and NCH onboarding.
13. Insurance/product liability arrangements.
14. Accessibility commitments and grievance path for accessibility issues.
