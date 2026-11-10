# Furniture & Electronics Single-Store eCommerce (PERN Stack)

Production-grade single-store eCommerce system built with the PERN stack (PostgreSQL, Express, React, Node.js + TypeScript). Tailored specifically for a physical furniture and electronics showroom with local delivery and Cash on Delivery (COD) fulfillment.

---

## 🏛 System Architecture Overview

```
                      ┌────────────────────────┐
                      │  Customer Storefront   │
                      │  (React + Vite + TS)   │
                      └───────────┬────────────┘
                                  │ HTTPS / REST
                                  ▼
┌──────────────────┐  HTTPS   ┌────────────────────────┐
│   Admin Panel    ├─────────►│      Backend API       │
│(React + Vite + TS│          │ (Express + TS + Prisma)│
└──────────────────┘          └───────────┬────────────┘
                                          │ Prisma ORM
                                          ▼
                              ┌────────────────────────┐
                              │  PostgreSQL Database   │
                              │ (Neon / Local Postgres)│
                              └────────────────────────┘
```

### Architectural Principles
1. **Three Independent Applications**: `storefront`, `admin`, and `backend`. No monorepo packages, no root package.json, and no shared types. Each app owns its runtime, dependencies, and environment files.
2. **Backend as Source of Truth**: Pricing, taxes, discounts, delivery qualification, and inventory reservations are computed strictly on the backend.
3. **Concurrency-Safe Checkout**: Atomic conditional stock updates inside PostgreSQL transactions prevent overselling.
4. **Auditability**: Every stock change is backed by an `InventoryMovement`, every order change by `OrderStatusHistory`, and administrative modifications by `AdminAuditLog`.

---

## 📁 Repository Layout

```
.
├── storefront/              # Customer shopping app (React 18/19, Vite, Tailwind, Zustand)
├── admin/                   # Store operations & inventory panel (React, Vite, Tailwind, Zustand)
├── backend/                 # Express REST API modular monolith (Node.js, TypeScript, Prisma)
├── docs/
│   ├── API_DOCUMENTATION.md # Complete REST API specification
│   ├── DATABASE_DESIGN.md   # Schema diagrams, relations & indexing strategy
│   ├── BUSINESS_RULES.md    # Pricing, cancellation, delivery, & stock rules
│   ├── ORDER_FLOW.md        # State transitions & atomic reservation sequence
│   └── DEPLOYMENT.md        # Production deployment guides for Vercel, Render & Neon
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **PostgreSQL**: v14 or higher (or a Neon cloud PostgreSQL instance)

### 1. Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env with your PostgreSQL DATABASE_URL and JWT secrets

npm install
npx prisma generate
npx prisma db push # or npx prisma migrate dev
npm run db:seed    # Seeds admin user, categories, sample furniture & electronics
npm run dev        # Starts backend API on http://localhost:5000
```

### 2. Storefront Setup
```bash
cd ../storefront
cp .env.example .env
npm install
npm run dev        # Starts storefront on http://localhost:5173
```

### 3. Admin Panel Setup
```bash
cd ../admin
cp .env.example .env
npm install
npm run dev        # Starts admin panel on http://localhost:5174
```

---

## 🔐 Default Seed Credentials

After running `npm run db:seed` in the `backend` folder:
- **Admin**: `admin@furniturestore.local` / `Admin@12345` (Phone: `+919876543210`)
- **Staff**: `staff@furniturestore.local` / `Staff@12345` (Phone: `+919876543211`)
- **Customer**: `customer@example.com` / `Customer@12345` (Phone: `+919876543212`)

---

## 📚 Detailed Documentation
- [API Documentation](file:///home/gabrialdeora/Desktop/Personal/Ecomm/docs/API_DOCUMENTATION.md)
- [Database Design](file:///home/gabrialdeora/Desktop/Personal/Ecomm/docs/DATABASE_DESIGN.md)
- [Business Rules](file:///home/gabrialdeora/Desktop/Personal/Ecomm/docs/BUSINESS_RULES.md)
- [Order Flow & State Machine](file:///home/gabrialdeora/Desktop/Personal/Ecomm/docs/ORDER_FLOW.md)
- [Deployment Guide](file:///home/gabrialdeora/Desktop/Personal/Ecomm/docs/DEPLOYMENT.md)
