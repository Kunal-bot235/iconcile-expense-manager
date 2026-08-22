# iConCile Expense Manager

A full-stack expense tracking web application built with **Next.js**, **Express**, **TypeScript**, **Prisma ORM**, and **PostgreSQL**.

Features rule-based expense categorization, batch CSV import with row-level validation, 3× category average anomaly detection, and a real-time dashboard summarizing spending trends.

---

## 🛠️ Technologies Used

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Vanilla CSS design system.
- **Backend**: Node.js, Express, TypeScript.
- **Database & ORM**: PostgreSQL, Prisma ORM with `@prisma/adapter-pg`.
- **Parsing & Uploads**: `csv-parse` for streaming CSV parsing, `multer` for multipart form data handling.

```
Frontend (Next.js)  ──HTTP/REST──> Express API ──> Services ──> Prisma ORM ──> PostgreSQL
```

---

## 📐 Architectural Rationale & Tech Stack Selection

While enterprise backend architectures often utilize **Java / Spring Boot**, NoSQL databases (e.g. MongoDB), or single-page apps (plain React.js with Vite), this project deliberately selected **Node.js + Express**, **PostgreSQL**, and **Next.js**:

### 1. Node.js + Express + TypeScript *(vs Java / Spring Boot)*
- **Existing Assessment Starter**: Leveraged the assessment's initialized Node.js + Express + TypeScript setup to maintain framework continuity.
- **Unified TypeScript Ecosystem**: Enables end-to-end type safety between frontend API calls and backend service logic, eliminating model serialization drift.
- **Lightweight I/O Efficiency**: Express provides non-blocking event-driven request handling, ideal for streaming CSV parsing and fast JSON REST API responses without heavy JVM startup overhead or verbose annotation boilerplate.

### 2. PostgreSQL + Prisma ORM *(vs MongoDB / NoSQL / SQLite)*
- **Relational Domain Integrity**: Expense management requires strict relational mapping (`Category` 1-to-many `Expense`, `Category` 1-to-many `VendorCategoryRule`) with foreign key constraints.
- **Financial Precision & ACID Compliance**: PostgreSQL guarantees ACID compliance and exact decimal precision storage (`Decimal(12,2)`), preventing floating-point rounding errors typical in document stores.
- **Analytical Query Capability**: Enables fast in-database grouping and average calculations (`_avg`, `_count`, `SUM`) essential for monthly category summaries and $3\times$ category-average anomaly detection.

### 3. Next.js App Router *(vs Plain React.js / Vite SPA)*
- **Built-in Routing & Layouts**: App Router provides intuitive file-based routing (`/`, `/expenses`, `/expenses/new`, `/upload`) and shared layout persistence without external routing libraries (`react-router-dom`).
- **SSR & Build Optimizations**: Delivers server-rendered HTML, automatic static page generation, font optimization, and code-splitting out-of-the-box.

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js (v18+)
- Running **PostgreSQL** database (Local server or Cloud connection URL)

### ⚠️ PostgreSQL Configuration (Local vs Cloud)

- **Local PostgreSQL**:
  1. Ensure PostgreSQL service is running locally on port `5432`.
  2. Create a database: `CREATE DATABASE mydb;`
  3. Set `DATABASE_URL="postgresql://<user>:<password>@localhost:5432/mydb?schema=public"` in `backend/.env`.

- **Cloud PostgreSQL (Neon / Supabase / Railway)**:
  1. Copy your connection string from Neon.tech, Supabase, or Railway.
  2. Set `DATABASE_URL="postgresql://user:pass@ep-xyz.region.aws.neon.tech/neondb?sslmode=require"` in `backend/.env`.

---

### Step-by-Step E2E Setup

#### 1. Environment Files Setup
```bash
# Backend env setup
cd backend
cp .env.example .env
# Edit backend/.env to verify your DATABASE_URL

# Frontend env setup (optional)
cd ../frontend
cp .env.example .env.local
```

#### 2. Backend Setup & Migration
```bash
cd backend

# Install dependencies
npm install

# Run database migration
npx prisma migrate dev

# Seed categories, vendor rules, and realistic expenses with anomalies
npx tsx prisma/seed.ts

# Start Express server (http://localhost:5000)
npm run dev
```

> **Expected Seed Output**:
> ```text
> ✓ Categories seeded
> ✓ Vendor rules seeded
> ✓ Expenses seeded
> ✓ Anomalies calculated
> Seed complete: 39 expenses, 3 anomalies
> ```

#### 3. Frontend Startup
In a **new terminal tab/window**:
```bash
cd frontend

# Install dependencies
npm install

# Start Next.js server (http://localhost:3000)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 💡 Assumptions & Decisions

1. **Vendor Normalization & Rule Matching**:
   - Vendor names are normalized (`vendor.trim().toLowerCase()`) before database lookup.
   - Example rules: `Zomato`/`Swiggy`/`KFC` → **Food**, `Blinkit`/`Zepto` → **Groceries**, `Uber`/`Ola` → **Transport**, `Amazon`/`Flipkart` → **Shopping**.
   - **Fallback**: If no rule matches, the expense automatically falls back to **Miscellaneous**.

2. **Anomaly Detection (3× Rule)**:
   - An expense is flagged as an anomaly (`isAnomaly = true`) if:
     $$\text{Amount} > 3 \times \text{Average of OTHER expenses in the same category}$$
   - **Self-Distortion Prevention**: The expense currently being evaluated is **excluded** when calculating the category average.
   - **Edge Cases**: Categories with fewer than 2 total expenses default to `isAnomaly = false` due to insufficient baseline data.

3. **Malformed CSV Handling**:
   - Accepts CSV containing `date`, `amount`, `vendor`, and optional `description`.
   - Each row is validated independently: missing required fields, non-positive amounts, or unparseable dates generate per-row error reports without crashing the server. Valid rows are saved and categorized.

---

## 📡 API Endpoints Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | API health check |
| `POST` | `/api/expenses` | Create expense (auto-categorizes & calculates anomaly status) |
| `GET` | `/api/expenses` | Get all expenses sorted by date |
| `GET` | `/api/expenses/:id` | Get single expense by ID |
| `DELETE` | `/api/expenses/:id` | Delete expense & recalculate category anomalies |
| `POST` | `/api/expenses/upload` | Upload CSV batch with row-level validation |
| `GET` | `/api/expenses/preview-category` | Real-time category preview for vendor string |
| `GET` | `/api/dashboard/monthly-summary` | Category totals for a month (`?month=8&year=2026`) |
| `GET` | `/api/dashboard/top-vendors` | Top N vendors by total spend (`?limit=5`) |
| `GET` | `/api/dashboard/anomalies` | List of all flagged anomalous expenses |
| `GET` | `/api/categories` | List all available spending categories |
| `GET` | `/api/categories/vendor-rules` | List all vendor-to-category mapping rules |

---

## 📝 Short Design Note (Mandatory — 5 to 10 Lines)

> See full document: [`DESIGN_NOTE.md`](./DESIGN_NOTE.md)

1. **Rule-Based Categorization**: Vendors are normalized using whitespace trimming and lowercase conversion (`vendor.trim().toLowerCase()`), then matched against `VendorCategoryRule` records stored in PostgreSQL via Prisma.
2. **Category Fallback**: If no database rule matches a vendor (e.g. unknown vendors), the expense gracefully falls back to the pre-seeded "Miscellaneous" category without throwing errors.
3. **Data Model Choices**: Relational architecture using 3 minimal Prisma models (`Category`, `Expense`, `VendorCategoryRule`) with foreign key constraints (`categoryId`) and indexes on `Expense.date` and `categoryId` for optimal query speed.
4. **Anomaly Logic (3× Rule)**: An expense is flagged (`isAnomaly = true`) if its amount exceeds $3\times$ the average amount of other expenses in the same category.
5. **Self-Distortion Prevention**: The expense being evaluated is strictly excluded from the average calculation to prevent self-inflation, and categories with fewer than 2 expenses default to `isAnomaly = false`.
6. **Trade-offs & Shortcuts**: Anomaly detection and category recalculations run synchronously inside service calls upon creation/deletion to guarantee deterministic state without the complexity of background queue systems (e.g., Redis/BullMQ).
