# Single-Owner Furniture, Electronics & Mobile Retail E-Commerce Platform

A production-grade, secure, compliant, and maintainable retail e-commerce platform built for a single shopkeeper selling **Furniture**, **Electronics**, and **Mobile Phones & Accessories**.

Built using the **PERN stack** (PostgreSQL, Express.js, React, Node.js) with strict TypeScript, unified single-store inventory, and physical counter billing.

---

## 🏗️ Architecture & Independent Applications

This monorepo consists of three completely independent top-level application directories sharing one PostgreSQL database and one Express backend:

1. **`storefront/`** (Port 3000): Customer-facing e-commerce web application (React, Vite, Tailwind CSS, Lucide React).
2. **`admin-dashboard/`** (Port 3001): Shopkeeper & staff management portal (React, Vite, Tailwind CSS, Lucide React).
3. **`backend/`** (Port 5000): Modular REST API service (Express.js, TypeScript, Prisma ORM, PostgreSQL).

> ⚠️ **Key Business Note**: This is **NOT** a multi-vendor marketplace (like Amazon or Flipkart). There is only **one** retail shopkeeper, one central inventory, and one legal business entity.

---

## 🚀 Quick Start (Local Setup)

### Prerequisites

- **Node.js** (v20.x or higher)
- **NPM** (v10.x or higher)
- **PostgreSQL** (v15.x or higher)

### 1. Installation

Install all workspace dependencies using `npm`:

```bash
npm install
```

### 2. Environment Configuration

Copy the example environment file and configure your credentials:

```bash
cp .env.example .env
```

Ensure your PostgreSQL database is created:

```sql
CREATE DATABASE retail_db;
```

### 3. Database Migration & Seeding

Generate Prisma client and seed initial categories, brands, and owner credentials:

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

Default Admin Credentials:
- **Phone**: `+919999999999`
- **Password**: `Admin@12345`

### 4. Running the Applications

To run all three applications concurrently:

```bash
npm run dev
```

Or run each service individually:

```bash
# Terminal 1: Backend API (Port 5000)
npm run dev:backend

# Terminal 2: Customer Storefront (Port 3000)
npm run dev:storefront

# Terminal 3: Admin Command Center (Port 3001)
npm run dev:admin
```

---

## 📁 Repository Directory Structure

```text
Ecomm/
├── storefront/              # Customer-facing shopping application (Port 3000)
├── admin-dashboard/         # Shopkeeper back-office & physical POS (Port 3001)
├── backend/                 # Modular Express.js & TypeScript API (Port 5000)
│   ├── prisma/              # Schema, migrations, and seed scripts
│   ├── src/
│   │   ├── config/          # Environment configuration and validation
│   │   ├── middleware/      # Security, rate limiters, auth, errors
│   │   ├── modules/         # Domain-driven backend modules
│   │   ├── integrations/    # Razorpay, Cloudinary, SMS/Email
│   │   ├── jobs/            # Background cron tasks
│   │   ├── lib/             # Prisma client and singletons
│   │   ├── utils/           # Helper routines and tax calculations
│   │   ├── app.ts           # Express application configuration
│   │   └── server.ts        # Server entrypoint
│   └── tests/
├── docs/
│   ├── architecture/        # Architecture documentation
│   ├── database/            # Database schema & ER diagram documentation
│   ├── api/                 # REST API endpoints reference
│   ├── security/            # Security & OWASP compliance guide
│   ├── legal/               # Indian e-commerce & DPDP compliance guide
│   ├── deployment/          # Non-Docker deployment runbook
│   └── implementation/      # Phased implementation tracking
├── package.json             # Root NPM workspaces definition
├── .env.example             # Template environment variables
├── .gitignore
└── README.md
```

---

## 🇮🇳 Legal & Regulatory Alignment

Designed in compliance with:
- **Consumer Protection Act, 2019** & **Consumer Protection (E-Commerce) Rules, 2020** (including 2026 amendments).
- **Digital Personal Data Protection (DPDP) Act, 2023** & **DPDP Rules, 2025**.
- **Legal Metrology (Packaged Commodities) Rules, 2011** (Mandatory declarations of MRP, Country of Origin, Manufacturer/Importer details).
- **Central Goods and Services Tax (CGST/SGST/IGST) Act, 2017** (Compliant GST invoices, HSN code breakdowns).
- **CERT-In Cyber Security Directions, 2022**.
