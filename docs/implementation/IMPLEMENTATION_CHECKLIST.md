# Phased Implementation Checklist & Roadmap
## Apex Retailers Single-Owner Retail Platform

### Phase Status Overview

- [x] **Phase 1: Architecture, Research & Database Design**
  - [x] Single-store business model specification.
  - [x] Comprehensive PostgreSQL Prisma schema with 38+ normalized models.
  - [x] Indian e-commerce legal compliance research (CP Rules 2020, DPDP 2023, Legal Metrology 2011, GST 2017).
  - [x] Architecture, Database, API, Security, Legal & Deployment documentation created.

- [x] **Phase 2: Project Initialization & Independent Applications**
  - [x] Monorepo structure confirmed clean and initialized with standard NPM.
  - [x] `storefront/` configured with React, Vite, Tailwind CSS, TypeScript.
  - [x] `admin-dashboard/` configured with React, Vite, Tailwind CSS, TypeScript.
  - [x] `backend/` configured with Node.js, Express, TypeScript, Prisma ORM.
  - [x] Storefront and Admin are completely segregated at the root level (no shared frontend folder).
  - [x] NPM workspaces and root scripts orchestrated.

- [ ] **Phase 3: Backend Foundation & PostgreSQL Setup**
  - [ ] Run initial Prisma migrations against live PostgreSQL database.
  - [ ] Execute database seed (`prisma/seed.ts`).
  - [ ] Implement central response formatter and domain-driven directory modules.

- [ ] **Phase 4: Authentication & Admin Authorization**
  - [ ] JWT / Cookie authentication service with bcrypt password hashing.
  - [ ] RBAC middleware (`CUSTOMER`, `ADMIN`, `STORE_MANAGER`, `CASHIER`, `DELIVERY_STAFF`).
  - [ ] Rate limiting and secure cookie headers.

- [ ] **Phase 5: Product Catalog & Dynamic Specifications**
  - [ ] Category tree endpoints (Furniture, Electronics, Mobiles).
  - [ ] Flexible `ProductAttribute` and `ProductAttributeValue` management.
  - [ ] Cloudinary media upload integration.
  - [ ] Variant-specific pricing, dimensions, and SKU tracking.

- [ ] **Phase 6: Customer Storefront Implementation**
  - [ ] Homepage hero banners, category shortcuts, best sellers.
  - [ ] Responsive navigation and instant search.
  - [ ] Department-specific browsing (Furniture, Electronics, Mobiles).

- [ ] **Phase 7: Product Detail, Filters & Search**
  - [ ] Image gallery with zoom.
  - [ ] Dynamic specifications rendering table.
  - [ ] PIN code serviceability checker.
  - [ ] WhatsApp enquiry and custom quotation request triggers.

- [ ] **Phase 8: Cart & Checkout Engine**
  - [ ] Persistent guest & authenticated cart.
  - [ ] Strict server-side price, coupon, and GST recalculation.
  - [ ] Multi-step Indian address form (PIN code, state, landmark).

- [ ] **Phase 9: Razorpay Payment Integration**
  - [ ] Server-side order creation (`razorpay.orders.create`).
  - [ ] Cryptographic signature verification.
  - [ ] Webhook handling for asynchronous capture & failure.
  - [ ] Cash on Delivery (COD) mode with OTP verification.

- [ ] **Phase 10: Unified Inventory & Order Processing**
  - [ ] Atomic stock reservations preventing overselling.
  - [ ] Order status state machine (`PENDING` -> `CONFIRMED` -> `PROCESSING` -> `DISPATCHED` -> `DELIVERED`).
  - [ ] Stock movement audit trails.

- [ ] **Phase 11: Admin Command Center & Analytics**
  - [ ] Real-time sales metrics (Today, Monthly, Category breakdown).
  - [ ] Low-stock notifications.
  - [ ] Product and variant CRUD dashboards.

- [ ] **Phase 12: Physical Shop POS / Counter Billing**
  - [ ] Instant walk-in order creation.
  - [ ] Direct shop counter inventory deduction.
  - [ ] Thermal / A4 GST compliant printable receipt.

- [ ] **Phase 13: Delivery, Warranty & Returns**
  - [ ] Local delivery and furniture assembly scheduling.
  - [ ] Serial number and mobile IMEI tracking.
  - [ ] Returns inspection workflow and refund processing.

- [ ] **Phase 14: Legal Policies & Grievance Redressal**
  - [ ] Indian compliance pages (Terms, Privacy, Returns, Warranty).
  - [ ] Grievance submission and SLA tracking (< 48 hrs acknowledgment).
  - [ ] DPDP consent logging and data erasure workflows.

- [ ] **Phase 15: Automated Testing & Performance Optimization**
  - [ ] Vitest unit tests for financial calculations and inventory deduction.
  - [ ] Playwright E2E tests for customer purchase journey.

- [ ] **Phase 16: Deployment & Production Readiness**
  - [ ] Production build verification (`npm run build`).
  - [ ] PM2 ecosystem and Nginx reverse proxy configuration.
