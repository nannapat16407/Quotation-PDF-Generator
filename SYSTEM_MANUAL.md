# Quotation PDF Generator — System / Developer Manual

> **Version:** 1.0
> **Last Updated:** June 2026
> **Audience:** Developers, DevOps Engineers, Technical Reviewers

---

## Table of Contents

1. [Codebase Analysis](#1-codebase-analysis)
2. [System Architecture](#2-system-architecture)
3. [Project Structure](#3-project-structure)
4. [Environment Configuration](#4-environment-configuration)
5. [Local Development Guide](#5-local-development-guide)
6. [Deployment Documentation](#6-deployment-documentation)
7. [API Documentation](#7-api-documentation)
8. [PDF System Documentation](#8-pdf-system-documentation)
9. [Troubleshooting Guide](#9-troubleshooting-guide)
10. [Future Development Guide](#10-future-development-guide)
11. [Codebase Risk Analysis](#11-codebase-risk-analysis)
12. [Production Readiness Review](#12-production-readiness-review)

---

## 1. Codebase Analysis

### 1.1 Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend Framework | Next.js (App Router) | 16.2.7 |
| Frontend Language | TypeScript | ES2017 target |
| UI Library | React | 19.2.4 |
| Styling | Tailwind CSS | v4 |
| Component System | shadcn/ui + @base-ui/react | Latest |
| Data Fetching | TanStack React Query | Latest |
| HTTP Client | Axios | Latest |
| Notifications | Sonner | 2.0.7 |
| Backend Framework | NestJS | 11 |
| ORM | Prisma | 7.8 |
| Database Driver | @prisma/adapter-pg + pg | 8.21 |
| Auth | JWT + Passport | Latest |
| PDF Engine | @react-pdf/renderer | 4.5.1 |
| Cloud Storage | Google Drive API (googleapis) | 173 |
| Database | PostgreSQL (Neon in prod) | 16+ |

---

### 1.2 Frontend Analysis

#### Framework
- **Next.js 16** with App Router (`src/app/`)
- React Server Components by default, `'use client'` directive for interactive pages
- Path alias `@/*` → `./src/*`

#### Routing Structure (App Router)

```
/login                          → Public login page
/register                       → Public registration page
/                               → Redirects to /quotations (if authed) or /login
/quotations                     → Quotation list (search, filter, paginate)
/quotations/create              → Create quotation form
/quotations/[id]/preview        → PDF preview + metadata
/quotations/[id]/edit           → Edit quotation form
/settings/supplier              → Supplier info management
/settings/packages              → Package CRUD
/settings/special-offers        → Special offer CRUD
/profile                        → User profile + password change
```

Route groups:
- `(auth)` — public authentication routes
- `(dashboard)` — protected routes requiring JWT; wrapped by `dashboard/layout.tsx`

#### Components Architecture

```
components/
├── layout/
│   ├── sidebar.tsx              → Desktop left navigation
│   ├── topbar.tsx               → Sticky header with user menu + logout
│   └── mobile-nav.tsx           → Slide-out mobile drawer
├── special-offer-form-dialog.tsx → Reusable add/edit offer dialog
└── ui/                          → shadcn primitives (badge, button, card, dialog,
                                   input, label, select, separator, sonner,
                                   switch, textarea)
```

#### State Management

- **Server state**: TanStack React Query (`@tanstack/react-query`)
  - Configured in `lib/query-provider.tsx`
  - Global `staleTime: 60s`, `retry: 1`
  - Each domain has a dedicated hook (see below)
- **Local state**: React `useState` / `useEffect`
- **No global client store** (no Redux/Zustand) — auth state lives in React Query cache

#### API Integration

**Client**: `lib/api.ts`
- Axios instance with `baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'`
- Request interceptor: injects `Authorization: Bearer ${token}` from `localStorage`
- Response interceptor: on `401`, clears token and redirects to `/login`

**Pattern**: Components → Custom Hooks → Axios → Backend
- Each hook wraps React Query `useQuery` / `useMutation`
- Mutations call `queryClient.invalidateQueries()` to refresh related data
- Toasts (`sonner`) fired on success/error inside hooks

**File upload**: Special `uploadSignature(file: File)` helper in `lib/api.ts` posts `multipart/form-data`.

#### Authentication Flow

1. User submits login form → `POST /api/auth/login`
2. Backend returns `{ access_token }`
3. Frontend stores token in `localStorage.setItem('token', access_token)`
4. Axios interceptor attaches token to all subsequent requests
5. `useAuth()` hook calls `GET /api/auth/profile` to fetch current user
6. Dashboard layout checks auth state; redirects to `/login` if no user
7. Logout clears token and redirects

#### Frontend Environment Variables

| Variable | Purpose | Required |
|----------|---------|----------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL (must include `/api` suffix) | Yes (defaults to `http://localhost:3001/api`) |

---

### 1.3 Backend Analysis

#### Auth Module (`features/auth/`)

**Purpose**: User registration, login, JWT issuance, profile management, signature upload.

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/register` | POST | No | Register new user |
| `/api/auth/login` | POST | No | Login, returns JWT |
| `/api/auth/profile` | GET | Yes | Get current user |
| `/api/auth/profile` | PUT | Yes | Update name/email |
| `/api/auth/signature` | POST | Yes | Upload signature (multipart) |
| `/api/auth/signature` | DELETE | Yes | Remove signature |
| `/api/auth/password` | PUT | Yes | Change password |

**DTOs**:
- `RegisterDto`: `name: string`, `email: string (email)`, `password: string (min 6)`
- `LoginDto`: `email: string (email)`, `password: string`
- `UpdateProfileDto`: `name?: string`, `email?: string`
- `ChangePasswordDto`: `currentPassword: string`, `newPassword: string (min 6)`

**Workflow**:
1. Register → bcrypt hash password → save User
2. Login → verify password → sign JWT (7d expiry)
3. Signature upload → multer `diskStorage` saves to `./uploads/signatures/` → URL stored on User

**Tables used**: `users`

---

#### Quotation Module (`features/quotation/`)

**Purpose**: Core business module — create, read, update, delete quotations with PDF generation and Google Drive upload.

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/quotations/next-number` | GET | Yes | Get next auto-generated quotation number |
| `/api/quotations/validate-number` | GET | Yes | Validate a manual quotation number |
| `/api/quotations` | GET | Yes | List quotations (search, filter, paginate) |
| `/api/quotations/:id` | GET | Yes | Get quotation detail |
| `/api/quotations/:id/pdf` | GET | Yes | Stream PDF for browser preview |
| `/api/quotations/:id/download` | GET | Yes | Download PDF as attachment |
| `/api/quotations/:id/drive-link` | GET | Yes | Get Google Drive link |
| `/api/quotations/upload-signature` | POST | Yes | Upload signature (multipart) |
| `/api/quotations` | POST | Yes | Create quotation |
| `/api/quotations/:id/duplicate` | POST | Yes | Duplicate quotation |
| `/api/quotations/:id` | PUT | Yes | Update quotation |
| `/api/quotations/:id` | DELETE | Yes | Delete quotation + Drive file |

**DTOs**:
- `CreateQuotationDto`: customer info, dates, packageId, billingType, financial amounts, nested `items[]` and `offers[]`, optional `signatureUrl`
- `UpdateQuotationDto`: all fields optional (PATCH-like semantics)
- `QuotationQueryDto`: `search?`, `dateFrom?`, `dateTo?`, `page?`, `limit?`
- `CreateQuotationItemDto`: `type`, `description`, `descriptionTh?`, `qty`, `unitPrice`, `amount`, `sortOrder`
- `CreateQuotationOfferDto`: `specialOfferId?`, `name`, `nameTh?`, `isCustom`
- Customer `customerTaxId` validated with `@Matches(/^\d{13}$/)`

**Create workflow** (see §8 for full detail):
1. Validate financial calculations
2. Generate or validate quotation number (`QUOYYYYMMNNN`)
3. Capture supplier snapshot (immutable for PDF)
4. Persist quotation + items + offers
5. Generate PDF buffer via `PdfService`
6. Upload to Google Drive (or update if filename exists)
7. Update quotation with `driveFileId`, `driveUrl`, `pdfFileSize`

**Tables used**: `quotations`, `quotation_items`, `quotation_special_offers`, `packages`, `users`, `supplier_info`

---

#### PDF Module (`features/pdf/`)

**Purpose**: Generate quotation PDFs using React-PDF with Thai font support.

**Files**:
- `pdf.service.tsx` — service that registers fonts and renders PDF to buffer
- `templates/quotation-pdf.tsx` — React-PDF document component
- `templates/pdf-styles.ts` — color palette and design tokens
- `fonts/` — Sarabun-Regular.ttf, Sarabun-Bold.ttf, Sarabun-Italic.ttf, Sarabun-BoldItalic.ttf, Inter.ttf
- `assets/superhr.png` — company logo

**Public method**: `generateQuotationPdf(data: QuotationPdfData): Promise<Buffer>`

See **§8 PDF System Documentation** for full deep-dive.

---

#### Supplier Module (`features/supplier/`)

**Purpose**: Manage a singleton supplier record (your company) used in PDFs.

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/supplier` | GET | Yes | Get supplier info |
| `/api/supplier` | PUT | Yes | Upsert supplier info |

**DTOs**:
- `UpdateSupplierDto`: `companyName`, `companyNameTh?`, `taxId`, `address`, `contactInfo?`
- `SupplierResponseDto`: full supplier record

**Tables used**: `supplier_info` (singleton — first row only)

> **Note**: When a quotation is created, the supplier info is **snapshotted** into `Quotation.supplierSnapshot` so later supplier edits don't change historical PDFs.

---

#### Package Module (`features/package/`)

**Purpose**: CRUD for pricing packages.

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/packages` | GET | Yes | List all packages |
| `/api/packages/:id` | GET | Yes | Get one package |
| `/api/packages` | POST | Yes | Create package |
| `/api/packages/:id` | PUT | Yes | Update package |
| `/api/packages/:id` | DELETE | Yes | Delete package |

**DTOs**:
- `CreatePackageDto`: `name`, `nameTh?`, `userCountEn?`, `userCountTh?`, `monthlyPrice: number`, `yearlyPrice: number`, `isActive?`, `sortOrder?`
- `UpdatePackageDto`: all optional

**Tables used**: `packages`

---

#### Special Offer Module (`features/special-offer/`)

**Purpose**: CRUD for promotional offers attachable to quotations.

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/special-offers` | GET | Yes | List all offers |
| `/api/special-offers/:id` | GET | Yes | Get one offer |
| `/api/special-offers` | POST | Yes | Create offer |
| `/api/special-offers/:id` | PUT | Yes | Update offer |
| `/api/special-offers/:id` | DELETE | Yes | Delete offer |

**DTOs**:
- `CreateSpecialOfferDto`: `name`, `nameTh?`, `description?`, `descriptionTh?`, `isActive?`, `isDefault?`, `sortOrder?`

**Tables used**: `special_offers`, `quotation_special_offers`

---

#### Google Drive Integration (`integrations/google-drive/`)

**Purpose**: Upload, update, delete PDF files in Google Drive.

**Public methods** (on `GoogleDriveService`):
- `uploadFile(fileName, buffer, mimeType)` → `{ fileId, webViewLink, size }`
- `updateFile(fileId, buffer, mimeType)`
- `deleteFile(fileId)`
- `validateFolder(folderId)` → folder name
- `testConnection()`

**OAuth flow**:
1. Uses `OAuth2Client` with `clientId`, `clientSecret`, `refreshToken`
2. Sets credentials from refresh token
3. On `401` from Drive API → refreshes access token automatically
4. Retries up to **3 times** on `403/429/500/503` with exponential backoff (`1s, 3s, 5s`)

**Quirks**:
- If `fileName` already exists in target folder, updates the existing file rather than creating a duplicate
- Service is **graceful when unconfigured**: returns nulls instead of throwing if env vars missing

---

#### Google Drive Settings Module (`features/google-drive-settings/`)

**Purpose**: Persist the target Drive folder URL/ID for the running app.

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/google-drive-settings` | GET | Yes | Get current settings |
| `/api/google-drive-settings` | PUT | Yes | Upsert settings |
| `/api/google-drive-settings/validate-folder` | GET | Yes | Validate folder ID |
| `/api/google-drive-settings/test-connection` | GET | Yes | Test Drive connection |

**Tables used**: `google_drive_settings`

---

### 1.4 Database Analysis

#### Entity Relationship Diagram (text)

```
┌────────────┐       ┌──────────────────┐
│   users    │──┐    │ supplier_info    │ (singleton)
│────────────│  │    │──────────────────│
│ id (PK)    │  │    │ id (PK)          │
│ name       │  │    │ companyName      │
│ email (UQ) │  │    │ taxId            │
│ password   │  │    │ address          │
│ signatureUrl│ │    │ contactInfo      │
│ role       │  │    └──────────────────│
└────────────┘  │            ▲
       │        │            │ snapshot
       │        ▼            │
       │   ┌────────────────────────────────┐
       │   │          quotations            │
       │   │────────────────────────────────│
       └──>│ createdById (FK → users.id)    │
           │ packageId   (FK → packages.id) │
           │ quotationNumber (UQ)           │
           │ version                        │
           │ customerCompany/TaxId/Address  │
           │ issuedDate / validUntil        │
           │ paymentTerm / dueDate          │
           │ billingType                    │
           │ packageAmount/addonsAmount     │
           │ discount/subtotal              │
           │ vatEnabled/vatAmount/total     │
           │ driveFileId / driveUrl         │
           │ pdfFileSize                    │
           │ signatureUrl                   │
           │ supplierSnapshot (JSONB)       │
           └────────────────────────────────┘
                       │  │
            ┌──────────┘  └─────────────┐
            ▼                            ▼
  ┌─────────────────────┐      ┌────────────────────────────┐
  │ quotation_items     │      │ quotation_special_offers   │
  │─────────────────────│      │────────────────────────────│
  │ id (PK)             │      │ id (PK)                    │
  │ quotationId (FK)    │      │ quotationId (FK)           │
  │ type (PACKAGE/ADDON)│      │ specialOfferId (FK, null)  │
  │ description         │      │ name / nameTh              │
  │ qty / unitPrice     │      │ isCustom                   │
  │ amount / sortOrder  │      └────────────────────────────│
  └─────────────────────┘                  ▲
                                           │
                                ┌──────────────────────┐
                                │   special_offers     │
                                │──────────────────────│
                                │ id (PK)              │
                                │ name / nameTh        │
                                │ description / descTh │
                                │ isActive / isDefault │
                                │ sortOrder            │
                                └──────────────────────┘

  ┌──────────────────────┐         ┌─────────────────────────┐
  │      packages        │         │ google_drive_settings   │
  │──────────────────────│         │─────────────────────────│
  │ id (PK)              │         │ id (PK)                 │
  │ name / nameTh        │         │ folderUrl / folderId    │
  │ userCountEn / Th     │         └─────────────────────────│
  │ monthlyPrice / yearly│
  │ isActive / sortOrder │
  └──────────────────────┘
```

#### Tables

| Table | Purpose | Singleton? |
|-------|---------|------------|
| `users` | Application users (auth + profile) | No |
| `supplier_info` | Company info shown on PDFs | Yes (first row) |
| `packages` | Pricing packages | No |
| `special_offers` | Promotional offers | No |
| `quotations` | Quotation headers | No |
| `quotation_items` | Line items per quotation | No |
| `quotation_special_offers` | Snapshot of offers attached to a quotation | No |
| `google_drive_settings` | Drive folder config | Yes |

#### Relationships & Foreign Keys

| From | To | Type | On Delete |
|------|-----|------|-----------|
| `quotations.createdById` | `users.id` | Many-to-One | Restrict (default) |
| `quotations.packageId` | `packages.id` | Many-to-One | Restrict (default) |
| `quotation_items.quotationId` | `quotations.id` | One-to-Many | **Cascade** |
| `quotation_special_offers.quotationId` | `quotations.id` | One-to-Many | **Cascade** |
| `quotation_special_offers.specialOfferId` | `special_offers.id` | Many-to-One | Set null (optional FK) |

#### Enums

```prisma
enum QuotationItemType {
  PACKAGE
  ADDON
}
```

> **Note**: `billingType` and `role` are stored as `TEXT` (previously enums, removed in migration `20260609020000`).

#### Business Rules

1. **Quotation numbers** must match `^QUO\d{4}(0[1-9]|1[0-2])\d{3}$` and be unique.
2. **Customer Tax ID** must be exactly 13 digits.
3. **Supplier snapshot** captured at quotation create/update time → PDF immutability.
4. **Quotation items** cascade-delete with parent quotation.
5. **Special offer links** are nullable so a quotation offer can survive even if the source offer is deleted (snapshot pattern).
6. **Money fields** use `Decimal(12, 2)` for precision.
7. **Timestamps** use `Timestamptz(6)` for timezone-aware storage.

#### Migration History

| Migration | Summary |
|-----------|---------|
| `20260604033842_init` | Initial schema with all tables + enums |
| `20260608013434_add_google_drive_settings` | Add Drive settings table |
| `20260608120000_remove_status_and_role_enums` | Drop `QuotationStatus` enum, convert role to TEXT |
| `20260609010000_supplier_snapshot_and_cleanup` | Drop phone/email/website from supplier, add `supplier_snapshot` JSONB |
| `20260609020000_remove_billing_enum_add_user_count` | Convert billing to TEXT, add `user_count_en/th` to packages, add `contact_info` to supplier |
| `20260609074219_add_payment_term` | Add `payment_term` and `due_date` to quotations |

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       USER (Browser)                        │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS
                           ▼
┌─────────────────────────────────────────────────────────────┐
│           FRONTEND — Next.js on Vercel                      │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────────┐    │
│  │ App Router  │  │ React Query  │  │ Axios + JWT      │    │
│  │ (SSR/CSR)   │  │ (cache)      │  │ interceptor      │    │
│  └────────────┘  └──────────────┘  └────────┬─────────┘    │
└─────────────────────────────────────┬───────────────────────┘
                                      │ HTTPS REST + multipart
                                      ▼
┌─────────────────────────────────────────────────────────────┐
│           BACKEND — NestJS on Render                         │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │ JWT Guard│→ │ Controllers  │→ │   Services           │   │
│  │ (Passport)│  │ (/api/*)     │  │ (business logic)     │   │
│  └──────────┘  └──────────────┘  └───┬─────────┬────────┘   │
│                                      │         │            │
│                    ┌─────────────────┘         │            │
│                    ▼                           ▼            │
│  ┌──────────────────────┐      ┌─────────────────────────┐  │
│  │ PrismaService        │      │ PdfService (React-PDF)  │  │
│  │ (pg.Pool + adapter)  │      │  • Sarabun fonts        │  │
│  └──────────┬───────────┘      │  • Logo (base64)        │  │
│             │                  │  • Signature (base64)   │  │
│             │                  └──────────┬──────────────┘  │
│             │                             │ Buffer           │
│             │                             ▼                  │
│             │                ┌──────────────────────────┐    │
│             │                │ GoogleDriveService       │    │
│             │                │ (OAuth2 + retry/backoff) │    │
│             │                └──────────┬───────────────┘    │
│             │                           │                    │
└─────────────┼───────────────────────────┼────────────────────┘
              │                           │
              ▼                           ▼
┌─────────────────────────┐    ┌─────────────────────────────┐
│ PostgreSQL — Neon       │    │ Google Drive API            │
│ (SSL required)          │    │ (folder from env or DB)     │
│                         │    │                             │
│ Tables:                 │    │ Files stored as:            │
│  users, quotations,     │    │  {quotationNumber}.pdf      │
│  quotation_items,       │    │                             │
│  quotation_special_     │    │ Metadata stored in DB:      │
│    offers,              │    │  driveFileId, driveUrl,     │
│  packages,              │    │  pdfFileSize                │
│  special_offers,        │    │                             │
│  supplier_info,         │    └─────────────────────────────┘
│  google_drive_settings  │
└─────────────────────────┘
```

### 2.2 Authentication Flow

```
┌────────┐                        ┌──────────┐                  ┌────────┐
│ Browser│                        │ Backend  │                  │ Postgres│
└───┬────┘                        └────┬─────┘                  └───┬────┘
    │  POST /api/auth/login            │                            │
    │  { email, password }             │                            │
    │─────────────────────────────────>│                            │
    │                                  │ SELECT user WHERE email=?  │
    │                                  │───────────────────────────>│
    │                                  │<───────────────────────────│
    │                                  │ bcrypt.compare(password)   │
    │                                  │ jwt.sign({sub, email})     │
    │  { access_token }                │                            │
    │<─────────────────────────────────│                            │
    │                                  │                            │
    │ localStorage.set('token', ...)   │                            │
    │                                  │                            │
    │  GET /api/auth/profile           │                            │
    │  Authorization: Bearer <token>   │                            │
    │─────────────────────────────────>│                            │
    │                                  │ JwtStrategy verifies       │
    │                                  │ SELECT user WHERE id=?     │
    │                                  │───────────────────────────>│
    │                                  │<───────────────────────────│
    │  { id, name, email, signatureUrl }│                           │
    │<─────────────────────────────────│                            │
```

### 2.3 Quotation Generation Flow

```
Browser                Backend (QuotationService)          Postgres       Drive
  │                          │                                │             │
  │ POST /api/quotations     │                                │             │
  │ { dto }                  │                                │             │
  │─────────────────────────>│                                │             │
  │                          │ 1. validateFinancials(dto)      │             │
  │                          │ 2. generateQuotationNumber()    │             │
  │                          │    (or validate manual number)  │             │
  │                          │ 3. supplier = getSupplier()     │             │
  │                          │    snapshot = JSON(supplier)    │             │
  │                          │                                │             │
  │                          │ INSERT quotation               │             │
  │                          │  + items                       │             │
  │                          │  + offers                      │             │
  │                          │───────────────────────────────>│             │
  │                          │<───────────────────────────────│             │
  │                          │                                │             │
  │                          │ 4. buildPdfData(quotation)      │             │
  │                          │ 5. PdfService.generatePdf()     │             │
  │                          │    → Buffer                     │             │
  │                          │                                │             │
  │                          │ 6. GoogleDriveService           │             │
  │                          │    .uploadFile(name, buffer)    │             │
  │                          │─────────────────────────────────────────────>│
  │                          │<─────────────────────────────────────────────│
  │                          │    { fileId, webViewLink, size }│             │
  │                          │                                │             │
  │                          │ 7. UPDATE quotation             │             │
  │                          │    SET driveFileId=, driveUrl=  │             │
  │                          │───────────────────────────────>│             │
  │                          │<───────────────────────────────│             │
  │                          │                                │             │
  │ 200 { quotation }        │                                │             │
  │<─────────────────────────│                                │             │
```

### 2.4 PDF Generation Flow

```
QuotationService.buildPdfData(quotation)
    │
    │ Assembles: { supplier (from snapshot), customer, package, items,
    │              offers, financials, dates, signatureUrl }
    ▼
PdfService.generateQuotationPdf(data)
    │
    │ 1. Register Sarabun fonts (once, module load)
    │ 2. Load logo as base64 (once, module load)
    │ 3. renderToBuffer(<QuotationPdfDocument data logoSrc />)
    ▼
@react-pdf/renderer
    │
    │ • Resolves font/image sources
    │ • Lays out Document → Page → Views
    │ • Streams PDF bytes
    ▼
Buffer
    │
    ├──> GoogleDriveService.uploadFile()
    └──> Controller response (preview: stream; download: attachment)
```

### 2.5 Google Drive Upload Flow

```
QuotationService
    │
    │ Wants to upload "{QUO202606001}.pdf"
    ▼
GoogleDriveService.uploadFile(fileName, buffer, mimeType)
    │
    │ 1. Build OAuth2 client (clientId, secret, refreshToken)
    │ 2. Search Drive for existing file with same name in folder
    │ 3. If exists → updateFile(fileId, buffer, mimeType)
    │    Else    → drive.files.create({ media, fields })
    ▼
Google Drive API
    │
    │ Returns: { id, webViewLink, size }
    │
    │ On 401 → refresh access token → retry
    │ On 403/429/500/503 → wait (1s, 3s, 5s) → retry
    │ Max 3 attempts
    ▼
{ fileId, webViewLink, size }
```

---

## 3. Project Structure

### 3.1 Repository Layout

```
Quotation-PDF-Generator/
├── backend/                  ← NestJS API
├── frontend/                 ← Next.js web app
├── docker/                   ← Dockerfiles + docker-compose.yml
├── docs/                     ← (not present in current codebase)
├── render.yaml               ← Render deployment blueprint
├── USER_MANUAL.md            ← End-user manual
└── SYSTEM_MANUAL.md          ← This document
```

### 3.2 Backend Structure

```
backend/
├── prisma/
│   ├── schema.prisma         ← DB schema (single source of truth)
│   ├── migrations/           ← Timestamped SQL migrations
│   └── seed.ts               ← Seeds admin user, supplier, packages, offers
├── src/
│   ├── main.ts               ← Bootstrap, CORS, Swagger, env validation
│   ├── app.module.ts         ← Root module
│   ├── app.controller.ts     ← GET / and GET /api/health
│   ├── app.service.ts        ← Health check response
│   ├── config/
│   │   └── configuration.ts  ← Env var → config object
│   ├── prisma/
│   │   ├── prisma.service.ts ← PrismaClient + pg.Pool + SSL
│   │   └── prisma.module.ts  ← Global PrismaModule
│   ├── common/
│   │   ├── jwt-auth.guard.ts ← JWT guard
│   │   └── current-user.decorator.ts ← @CurrentUser()
│   ├── features/             ← Feature modules (one per domain)
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.module.ts
│   │   │   ├── dto/
│   │   │   └── strategies/jwt.strategy.ts
│   │   ├── quotation/
│   │   │   ├── quotation.controller.ts
│   │   │   ├── quotation.service.ts  ← Core business logic
│   │   │   ├── quotation.module.ts
│   │   │   └── dto/
│   │   ├── pdf/
│   │   │   ├── pdf.service.tsx        ← React-PDF bridge
│   │   │   ├── pdf.module.ts
│   │   │   ├── templates/
│   │   │   │   ├── quotation-pdf.tsx  ← PDF layout
│   │   │   │   └── pdf-styles.ts      ← Design tokens
│   │   │   ├── fonts/                  ← Sarabun TTFs
│   │   │   └── assets/                 ← superhr.png
│   │   ├── supplier/
│   │   ├── package/
│   │   ├── special-offer/
│   │   └── google-drive-settings/
│   └── integrations/
│       └── google-drive/
│           ├── google-drive.service.ts ← OAuth + upload
│           └── google-drive.module.ts
├── nest-cli.json             ← assets config (fonts + PNGs)
├── tsconfig.json
├── prisma.config.ts          ← Prisma 7 config
├── package.json
└── .env / .env.example
```

**When to modify each folder**:

| Folder | Modify when… |
|--------|-------------|
| `prisma/` | DB schema changes, new migration, seed data |
| `src/config/` | New env var, app-wide config |
| `src/prisma/` | Connection logic (rarely) |
| `src/common/` | New guard, decorator, interceptor, filter |
| `src/features/<x>/` | New endpoint, business rule for domain X |
| `src/features/pdf/templates/` | PDF layout / styling |
| `src/features/pdf/fonts/` | Adding a new font |
| `src/integrations/` | New third-party service integration |

### 3.3 Frontend Structure

```
frontend/
├── src/
│   ├── app/                  ← App Router routes
│   │   ├── layout.tsx        ← Root layout (HTML, fonts, Toaster)
│   │   ├── page.tsx          ← Redirects to /quotations or /login
│   │   ├── globals.css       ← Tailwind + CSS variables
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   └── (dashboard)/
│   │       ├── layout.tsx    ← Protected layout (sidebar, topbar)
│   │       ├── page.tsx      ← Redirects to /quotations
│   │       ├── profile/page.tsx
│   │       ├── quotations/
│   │       │   ├── page.tsx           ← List
│   │       │   ├── create/page.tsx    ← Create
│   │       │   └── [id]/
│   │       │       ├── preview/page.tsx ← PDF preview
│   │       │       └── edit/page.tsx     ← Edit form
│   │       └── settings/
│   │           ├── supplier/page.tsx
│   │           ├── packages/page.tsx
│   │           └── special-offers/page.tsx
│   ├── components/
│   │   ├── layout/           ← sidebar, topbar, mobile-nav
│   │   ├── special-offer-form-dialog.tsx ← Shared dialog
│   │   └── ui/               ← shadcn primitives
│   ├── hooks/                ← One hook per data domain
│   │   ├── use-auth.ts
│   │   ├── use-quotations.ts
│   │   ├── use-packages.ts
│   │   ├── use-special-offers.ts
│   │   ├── use-supplier.ts
│   │   └── use-profile.ts
│   ├── lib/
│   │   ├── api.ts            ← Axios instance + interceptors
│   │   ├── query-provider.tsx← React Query provider
│   │   └── utils.ts          ← cn() class merge helper
│   └── types/
│       └── index.ts          ← Shared types + helpers
├── public/
├── next.config.ts
├── tsconfig.json
├── package.json
└── .env / .env.example
```

**When to modify each folder**:

| Folder | Modify when… |
|--------|-------------|
| `app/(auth)/` | New public auth page |
| `app/(dashboard)/` | New protected page |
| `app/(dashboard)/[feature]/page.tsx` | New screen |
| `components/layout/` | Navigation changes |
| `components/ui/` | Add new shadcn primitive |
| `components/<feature>.tsx` | New reusable component |
| `hooks/` | New data domain or action |
| `lib/api.ts` | New interceptor or upload helper |
| `types/index.ts` | New shared type |

---

## 4. Environment Configuration

### 4.1 Local Development Environment

#### Backend (`backend/.env`)

| Variable | Purpose | Required | Example |
|----------|---------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | **Yes** | `postgresql://postgres:postgres@localhost:5432/quotation_db` |
| `JWT_SECRET` | Secret used to sign JWT tokens | **Yes** | `super-secret-jwt-key-change-in-production` |
| `GOOGLE_DRIVE_CLIENT_ID` | OAuth2 client ID for Drive | No (PDFs skip Drive if missing) | `xxxx.apps.googleusercontent.com` |
| `GOOGLE_DRIVE_CLIENT_SECRET` | OAuth2 client secret | No | `GOCSPX-xxxx` |
| `GOOGLE_DRIVE_REFRESH_TOKEN` | OAuth2 refresh token | No | `1//xxxx...` |
| `GOOGLE_DRIVE_FOLDER_ID` | Target Drive folder ID | No | `1aBcDeFgHiJkLmN` |
| `PORT` | Backend listen port | No (default `3001`) | `3001` |
| `FRONTEND_URL` | Allowed CORS origin | No (default `http://localhost:3000`) | `http://localhost:3000` |

> **Startup validation**: `main.ts` calls `validateEnv()` which exits the process if `DATABASE_URL` or `JWT_SECRET` are missing.

#### Frontend (`frontend/.env`)

| Variable | Purpose | Required | Example |
|----------|---------|----------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | Yes (default `http://localhost:3001/api`) | `http://localhost:3001/api` |

> `NEXT_PUBLIC_*` prefix is required by Next.js to expose the var to the browser.

---

### 4.2 Render Environment (Backend)

| Variable | Purpose | Required | Notes |
|----------|---------|----------|-------|
| `DATABASE_URL` | Neon connection string (with `?sslmode=require`) | **Yes** | Auto-enables SSL via `neon.tech` detection |
| `JWT_SECRET` | JWT signing secret | **Yes** | `render.yaml` uses `generateValue: true` to auto-generate |
| `PORT` | Render-injected port | **Yes** | `render.yaml` sets `10000` |
| `FRONTEND_URL` | Vercel frontend URL | **Yes** | Required for CORS — e.g. `https://app.vercel.app` |
| `GOOGLE_DRIVE_CLIENT_ID` | OAuth2 client ID | No | If omitted, Drive uploads are skipped |
| `GOOGLE_DRIVE_CLIENT_SECRET` | OAuth2 client secret | No | — |
| `GOOGLE_DRIVE_REFRESH_TOKEN` | OAuth2 refresh token | No | — |
| `GOOGLE_DRIVE_FOLDER_ID` | Target folder | No | Falls back to settings DB row |

---

### 4.3 Vercel Environment (Frontend)

| Variable | Purpose | Required | Notes |
|----------|---------|----------|-------|
| `NEXT_PUBLIC_API_URL` | Backend URL on Render | **Yes** | e.g. `https://quotation-api.onrender.com/api` |

> No `output: "standalone"` — Vercel auto-detects Next.js and uses default build.

---

### 4.4 Neon Environment (Database)

| Setting | Value |
|---------|-------|
| Engine | PostgreSQL 16+ |
| Connection string format | `postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname?sslmode=require` |
| SSL | **Required** (`sslmode=require`) |
| Pooler | Recommended (PgBouncer) — set `?pgbouncer=true&connection_limit=1` if used |

The backend auto-detects Neon via `DATABASE_URL.includes('neon.tech')` and enables `ssl: { rejectUnauthorized: false }` on the `pg.Pool`.

---

## 5. Local Development Guide

### 5.1 Prerequisites

| Tool | Required Version | Check Command |
|------|------------------|---------------|
| Node.js | 20.x or 22.x LTS | `node --version` |
| npm | 10.x+ | `npm --version` |
| Docker (optional) | 24.x+ | `docker --version` |
| Git | any recent | `git --version` |

> The project uses `npm` (not yarn/pnpm). Lockfiles are `package-lock.json`.

### 5.2 Setup Options

You have two ways to run the database locally:
- **Option A**: Docker Compose (recommended — one command)
- **Option B**: Local PostgreSQL install

#### Option A — Docker Compose

```bash
cd docker
docker compose up -d postgres
```

This starts a `postgres:16-alpine` container on port `5432` with:
- DB: `quotation_db`
- User: `postgres`
- Password: `postgres`

To verify:
```bash
docker ps
# Should show quotation_postgres running
docker exec -it quotation_postgres pg_isready -U postgres
```

#### Option B — Local PostgreSQL

Install PostgreSQL 16+ and create the database:
```bash
createdb quotation_db
```

Update `backend/.env`:
```
DATABASE_URL="postgresql://<your-user>:<your-pass>@localhost:5432/quotation_db"
```

### 5.3 Backend Setup

```bash
cd backend

# 1. Install dependencies
npm install

# 2. Copy env template
cp .env.example .env
# Edit .env — set DATABASE_URL, JWT_SECRET

# 3. Generate Prisma client
npx prisma generate

# 4. Apply migrations
npx prisma migrate deploy
# Or for active development: npx prisma migrate dev

# 5. Seed initial data (admin user, supplier, packages, offers)
npx tsx prisma/seed.ts

# 6. Start dev server (hot reload)
npm run start:dev
```

**Default seed credentials**:
- Email: `admin@superhr.com`
- Password: `admin123`

### 5.4 Frontend Setup

```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Copy env template
cp .env.example .env
# Edit .env — set NEXT_PUBLIC_API_URL if backend isn't on default port

# 3. Start dev server
npm run dev
```

### 5.5 Verification Steps

| Check | Command | Expected |
|-------|---------|----------|
| Backend health | `curl http://localhost:3001/api/health` | `{"status":"ok","timestamp":"..."}` |
| Swagger docs | Open `http://localhost:3001/api/docs` in browser | Swagger UI loads |
| Frontend running | Open `http://localhost:3000` | Login page renders |
| DB connection | `cd backend && npx prisma studio` | Opens Prisma Studio |
| Login works | Use `admin@superhr.com` / `admin123` | Redirects to `/quotations` |
| PDF generation | Create a quotation | PDF preview loads |

### 5.6 Full Docker Stack (Optional)

To run everything in Docker:

```bash
cd docker
docker compose up -d
```

This starts PostgreSQL, backend (port 3001), and frontend (port 3000). The backend Dockerfile runs `prisma migrate deploy` before starting the app.

---

## 6. Deployment Documentation

### 6.1 Current Production Architecture

```
Vercel (Frontend)  ←──HTTPS──>  Render (Backend API)  ←──>  Neon (PostgreSQL)
                                         │
                                         └──> Google Drive API
```

### 6.2 Neon Configuration

**Provisioning**:
1. Create a project at [neon.tech](https://neon.tech)
2. Choose region closest to your users (and Render region)
3. Copy the connection string — must include `?sslmode=require`
4. Run migrations from your local machine first:
   ```bash
   cd backend
   DATABASE_URL="postgresql://..." npx prisma migrate deploy
   DATABASE_URL="postgresql://..." npx tsx prisma/seed.ts
   ```

**SSL**: The backend auto-enables SSL when `DATABASE_URL` contains `neon.tech`. No code change needed.

**Connection pooler**: If you hit "too many connections", switch to pooled connection string and add `?pgbouncer=true&connection_limit=1`.

### 6.3 Render Configuration

**Blueprint**: The repo includes `render.yaml` at the root. Render auto-detects it on repo connection.

**Manual setup** (if not using blueprint):

| Setting | Value |
|---------|-------|
| Service type | Web Service → Node |
| Runtime | Node |
| Root Directory | `backend` |
| Build Command | `npm ci && npx prisma generate && npm run build` |
| Start Command | `npx prisma migrate deploy && node dist/main.js` |
| Health Check Path | `/api/health` |
| Plan | Free / Starter / Standard |

**Critical env vars**: see §4.2.

**Common issues**:
- **Missing `prisma generate` in build** → runtime error: `@prisma/client not found`
- **Missing `JWT_SECRET`** → app exits at boot (`validateEnv()`)
- **Wrong `FRONTEND_URL`** → CORS errors in browser console
- **Cold starts** (Free tier): first request after idle takes ~30s; upgrade to paid tier for always-on

### 6.4 Vercel Configuration

| Setting | Value |
|---------|-------|
| Framework Preset | Next.js (auto-detected) |
| Root Directory | `frontend` |
| Build Command | `next build` (default) |
| Output mode | Default (NOT `standalone`) |
| Env vars | `NEXT_PUBLIC_API_URL` → Render backend URL |

**Critical**: Do NOT add `output: "standalone"` to `next.config.ts` — Vercel handles Next.js builds natively.

### 6.5 Post-Deploy Verification

```bash
# 1. Backend health
curl https://<backend>.onrender.com/api/health
# Expected: {"status":"ok","timestamp":"..."}

# 2. Frontend loads
curl https://<frontend>.vercel.app
# Expected: HTML response with login page

# 3. End-to-end: login → create quotation → PDF downloads
```

### 6.6 CI/CD

- **Vercel**: Auto-deploys on push to `main`
- **Render**: Auto-deploys on push to `main` (if configured)
- **Database migrations**: Run via Render start command (`prisma migrate deploy`) — applied on every deploy

---

## 7. API Documentation

> All routes are prefixed with `/api`. All routes except `/auth/login` and `/auth/register` require `Authorization: Bearer <JWT>` header.

Full interactive docs available at `/api/docs` (Swagger UI) when backend is running.

### 7.1 Auth Endpoints

#### POST `/api/auth/register`

| Field | Type | Validation |
|-------|------|------------|
| name | string | required |
| email | string | valid email |
| password | string | min 6 chars |

**Response 201**: `{ id, name, email, role, createdAt }`

---

#### POST `/api/auth/login`

| Field | Type |
|-------|------|
| email | string |
| password | string |

**Response 200**: `{ access_token: string }`

---

#### GET `/api/auth/profile`
**Auth**: Required

**Response**: `{ id, name, email, signatureUrl, role, createdAt }`

---

#### PUT `/api/auth/profile`
**Auth**: Required

| Field | Type |
|-------|------|
| name | string (optional) |
| email | string (optional) |

**Response**: Updated user object

---

#### POST `/api/auth/signature`
**Auth**: Required
**Content-Type**: `multipart/form-data`

| Field | Type |
|-------|------|
| file | File (PNG/JPEG, max 2MB) |

**Response**: `{ signatureUrl: string }`

---

#### DELETE `/api/auth/signature`
**Auth**: Required

**Response**: `{ signatureUrl: null }`

---

#### PUT `/api/auth/password`
**Auth**: Required

| Field | Type |
|-------|------|
| currentPassword | string |
| newPassword | string (min 6) |

**Response**: `{ message: "Password updated" }`

---

### 7.2 Supplier Endpoints

#### GET `/api/supplier`
**Auth**: Required

**Response**: `{ id, companyName, companyNameTh, taxId, address, contactInfo, updatedAt }`

---

#### PUT `/api/supplier`
**Auth**: Required

| Field | Type |
|-------|------|
| companyName | string |
| companyNameTh | string? |
| taxId | string |
| address | string |
| contactInfo | string? |

**Response**: Updated supplier object

---

### 7.3 Package Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/packages` | List all packages |
| GET | `/api/packages/:id` | Get one package |
| POST | `/api/packages` | Create package |
| PUT | `/api/packages/:id` | Update package |
| DELETE | `/api/packages/:id` | Delete package |

**Create/Update body**:
```json
{
  "name": "Pro",
  "nameTh": "โปร",
  "userCountEn": "Unlimited Users",
  "userCountTh": "ผู้ใช้ไม่จำกัด",
  "monthlyPrice": 1359,
  "yearlyPrice": 13590,
  "isActive": true,
  "sortOrder": 4
}
```

---

### 7.4 Special Offer Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/special-offers` | List all |
| GET | `/api/special-offers/:id` | Get one |
| POST | `/api/special-offers` | Create |
| PUT | `/api/special-offers/:id` | Update |
| DELETE | `/api/special-offers/:id` | Delete |

**Create/Update body**:
```json
{
  "name": "Free Data Migration",
  "nameTh": "นำเข้าข้อมูลฟรี",
  "description": "Free for Basic plans and above.",
  "descriptionTh": "ฟรีสำหรับแพ็กเกจ Basic ขึ้นไป",
  "isActive": true,
  "isDefault": true,
  "sortOrder": 1
}
```

---

### 7.5 Quotation Endpoints

#### GET `/api/quotations`
**Auth**: Required

**Query params**:
| Param | Type | Default |
|-------|------|---------|
| search | string | — |
| dateFrom | string (YYYY-MM-DD) | — |
| dateTo | string (YYYY-MM-DD) | — |
| page | number | 1 |
| limit | number | 10 |

**Response**:
```json
{
  "data": [ { "id": "...", "quotationNumber": "...", ... } ],
  "meta": { "total": 42, "page": 1, "limit": 10, "totalPages": 5 }
}
```

---

#### GET `/api/quotations/next-number`
**Response**: `{ quotationNumber: "QUO202606001" }`

---

#### GET `/api/quotations/validate-number`
**Query**: `number=QUO202606001&excludeId=<optional>`

**Response**: `{ errors: string[], warnings: string[] }`

Validation rules:
- Format: `^QUO\d{4}(0[1-9]|1[0-2])\d{3}$`
- Uniqueness: must not collide with existing
- Future month check: error if month is in the future
- Sequence warning: warn if number is older than latest sequence

---

#### GET `/api/quotations/:id`
**Response**: Full quotation with nested `items`, `offerRecords`, `package`, `createdBy`

---

#### GET `/api/quotations/:id/pdf`
**Response**: `application/pdf` (inline stream)

---

#### GET `/api/quotations/:id/download`
**Response**: `application/pdf` (attachment, filename = `{quotationNumber}.pdf`)

---

#### GET `/api/quotations/:id/drive-link`
**Response**: `{ fileId, webViewLink, size }`

---

#### POST `/api/quotations/upload-signature`
**Content-Type**: `multipart/form-data`

| Field | Type |
|-------|------|
| file | File (PNG/JPEG, max 2MB) |

**Response**: `{ signatureUrl: string }`

---

#### POST `/api/quotations`

**Body**:
```json
{
  "quotationNumber": "QUO202606001",      // optional, auto-generated if omitted
  "customerCompany": "Acme Co.",
  "customerCompanyTh": "บริษัท เอ็ม จำกัด",
  "customerTaxId": "0105551234567",        // must be 13 digits
  "customerAddress": "123 Sukhumvit Rd",
  "issuedDate": "2026-06-13",
  "validUntil": "2026-08-13",
  "dueDate": "2026-09-13",
  "packageId": "<uuid>",
  "billingType": "MONTHLY",                // or "YEARLY"
  "packageAmount": 1500,
  "addonsAmount": 500,
  "discount": 0,
  "subtotal": 2000,
  "vatEnabled": true,
  "vatAmount": 140,
  "totalAmount": 2140,
  "signatureUrl": "/uploads/signatures/xxx.png",
  "items": [
    { "type": "PACKAGE", "description": "...", "qty": 1, "unitPrice": 1500, "amount": 1500, "sortOrder": 0 }
  ],
  "offers": [
    { "specialOfferId": "<uuid>", "name": "Free Data Migration", "nameTh": "...", "isCustom": false }
  ]
}
```

**Response 201**: Created quotation (with `driveFileId`, `driveUrl`, `pdfFileSize` populated if Drive configured)

---

#### POST `/api/quotations/:id/duplicate`
**Response 201**: New quotation copy with version=1 and new quotation number

---

#### PUT `/api/quotations/:id`
Same body as POST (all fields optional). Increments `version`.

---

#### DELETE `/api/quotations/:id`
**Side effects**:
- Cascades delete `quotation_items` and `quotation_special_offers`
- Deletes associated Google Drive file (if `driveFileId` present)

**Response 204**: No content

---

### 7.6 Google Drive Settings Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/google-drive-settings` | Get current settings |
| PUT | `/api/google-drive-settings` | Upsert settings |
| GET | `/api/google-drive-settings/validate-folder?folderId=xxx` | Validate folder |
| GET | `/api/google-drive-settings/test-connection` | Test Drive connection |

---

### 7.7 Health Check

#### GET `/api/health`
**Auth**: Not required

**Response**: `{ status: "ok", timestamp: "<ISO date>" }`

---

## 8. PDF System Documentation

### 8.1 PDF Generation Flow

```
QuotationService.create() / update()
        │
        ▼
buildPdfData(quotation)
   │
   ├─ supplier      ← from quotation.supplierSnapshot (fallback: live SupplierInfo)
   ├─ customer      ← from quotation fields
   ├─ package       ← from quotation.package relation
   ├─ items         ← from quotation.items
   ├─ offers        ← from quotation.offerRecords
   ├─ financials    ← from quotation fields
   ├─ signatureUrl  ← resolved to full URL → fetched as base64 at render time
   └─ dates         ← issuedDate, validUntil, dueDate
        │
        ▼
PdfService.generateQuotationPdf(data)
        │
        ▼
@react-pdf/renderer renderToBuffer(<QuotationPdfDocument />)
        │
        ▼
Buffer → returned to controller / Drive upload
```

### 8.2 Font Loading

**Fonts used**: Sarabun (Thai-compatible) — 4 variants:
- `Sarabun-Regular.ttf` (weight 400)
- `Sarabun-Bold.ttf` (weight 700)
- `Sarabun-Italic.ttf` (weight 400, italic)
- `Sarabun-BoldItalic.ttf` (weight 700, italic)

**Registration** (`pdf.service.tsx`):
```typescript
const fontsDir = path.resolve(pdfBaseDir, 'fonts');
Font.register({
  family: 'Sarabun',
  fonts: [
    { src: path.join(fontsDir, 'Sarabun-Regular.ttf'), fontWeight: 400 },
    { src: path.join(fontsDir, 'Sarabun-Bold.ttf'), fontWeight: 700 },
    { src: path.join(fontsDir, 'Sarabun-Italic.ttf'), fontWeight: 400, fontStyle: 'italic' },
    { src: path.join(fontsDir, 'Sarabun-BoldItalic.ttf'), fontWeight: 700, fontStyle: 'italic' },
  ],
});
```

Fonts are registered once at module load (not per-request).

### 8.3 Asset Loading

**Logo**: `superhr.png` from `assets/` directory, loaded as base64 at module load:

```typescript
const logoPath = path.resolve(pdfBaseDir, 'assets', 'superhr.png');
const logoBase64 = fs.existsSync(logoPath)
  ? `data:image/png;base64,${fs.readFileSync(logoPath).toString('base64')}`
  : null;
```

### 8.4 Path Resolution — Critical

The `pdfBaseDir` calculation handles a NestJS/Prisma quirk:

```typescript
const pdfBaseDir = __dirname.includes(`${path.sep}dist${path.sep}`)
  ? __dirname.replace(/[/\\]src[/\\]features[/\\]/, '/features/')
  : __dirname;
```

**Why this is needed**:
- `nest-cli.json` copies assets from `src/features/pdf/` → `dist/features/pdf/` (strips `src/`)
- But TypeScript compiles `src/features/pdf/pdf.service.tsx` → `dist/src/features/pdf/pdf.service.js` (because `prisma.config.ts` at project root causes TS to infer `rootDir` = project root)
- Result: compiled JS and copied assets end up in **different** dist subpaths
- The `replace()` normalizes the path so assets resolve correctly

### 8.5 Signature Handling

- Stored on `Quotation.signatureUrl` as a relative path (e.g., `/uploads/signatures/abc.png`)
- At PDF render time, `buildPdfData()` resolves it to a full URL using `NEXT_PUBLIC_API_URL`... actually no — the backend resolves using its own configured origin
- React-PDF fetches the URL and embeds the image in the PDF

### 8.6 PDF Document Structure

The React-PDF document (`quotation-pdf.tsx`) renders:

1. **Header**: "Quotation / ใบเสนอราคา" title + SuperHR logo
2. **Info grid** (3 columns): Supplier | Prepared For | Document Info
3. **Hero banner**: Package name, price, billing period, due date (Thai Buddhist calendar)
4. **Item table**: Description (EN/TH), Qty, Unit Price, Amount
5. **Bottom grid**: Special Offers (left) + Financial Summary (right)
6. **Signature row**: Authorised by + Accepted by lines
7. **Footer**: Contact info centered at bottom

### 8.7 Known Deployment Issues

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| **ENOENT: Sarabun-Regular.ttf** at `dist/src/features/pdf/fonts/` | TS rootDir inference places compiled JS at `dist/src/...` but assets at `dist/...` | `pdfBaseDir` normalization strips `/src/` from `__dirname` |
| **Logo missing in PDF** | Same path mismatch as fonts | Same fix applies to logo path |
| **Font shows as boxes (tofu)** | Sarabun TTFs not copied to `dist/` | `nest-cli.json` `assets: ["**/*.ttf", "**/*.png"]` |
| **PDF generation OOM on Render free tier** | React-PDF is memory-intensive | Upgrade Render plan; or refactor to streaming render |
| **Cold start PDF timeout** | Render free tier sleeps after 15min idle | Use cron ping or upgrade plan |

---

## 9. Troubleshooting Guide

### 9.1 Prisma Migration Errors

#### Symptom: `P3005 (Migration drift)`

**Cause**: The migration history in `_prisma_migrations` table doesn't match `prisma/migrations/` folder.

**Fix**:
```bash
# Option A: Reset DB entirely (dev only — destroys data)
npx prisma migrate reset

# Option B: Mark drifted migration as applied (prod)
npx prisma migrate resolve --applied <migration_name>

# Option C: Apply SQL delta manually
psql $DATABASE_URL -c "ALTER TABLE ..."
npx prisma migrate resolve --applied <migration_name>
```

#### Symptom: `PrismaClientInitializationError`

**Cause**: `DATABASE_URL` wrong, DB not running, or SSL missing for Neon.

**Fix**:
- Local: confirm Postgres running (`docker ps` or `pg_isready`)
- Neon: ensure `?sslmode=require` in URL
- Check `npx prisma db pull --print` works

---

### 9.2 Neon Connection Errors

#### Symptom: `Error: Endpoint is not enabled for TLS`

**Cause**: Trying to connect without SSL.

**Fix**: Backend auto-enables SSL via `neon.tech` detection. If you've customized `prisma.service.ts`, restore the SSL block:
```typescript
ssl: process.env.DATABASE_URL?.includes('neon.tech')
  ? { rejectUnauthorized: false }
  : undefined,
```

#### Symptom: `Error: too many connections`

**Cause**: Connection limit hit on Neon free tier.

**Fix**: Switch to Neon's pooled connection string (port 6543) and add `?pgbouncer=true&connection_limit=1`.

---

### 9.3 JWT Errors

#### Symptom: `Unauthorized` (401) on every protected route

**Cause**: `JWT_SECRET` env var missing or different from issue time.

**Fix**:
- Check `backend/.env` has `JWT_SECRET` set
- `validateEnv()` in `main.ts` exits at boot if missing
- Clear `localStorage` in browser and re-login

#### Symptom: `Error: jwt malformed`

**Cause**: Frontend sending token without `Bearer ` prefix.

**Fix**: Check `lib/api.ts` interceptor:
```typescript
config.headers.Authorization = `Bearer ${token}`;
```

---

### 9.4 Google Drive Errors

#### Symptom: `Error: invalid_grant` on Drive upload

**Cause**: Refresh token expired or revoked.

**Fix**:
1. Go to Google Cloud Console → APIs → Credentials
2. Verify OAuth client still exists
3. Regenerate refresh token via OAuth Playground
4. Update `GOOGLE_DRIVE_REFRESH_TOKEN` env var

#### Symptom: PDFs save but no Drive link stored

**Cause**: `GOOGLE_DRIVE_FOLDER_ID` missing OR settings DB row missing folder.

**Fix**:
- Set env var or update `/api/google-drive-settings`
- Check backend logs: `GoogleDriveService` logs warning when not configured

---

### 9.5 PDF Font Errors

#### Symptom: `ENOENT: .../dist/src/features/pdf/fonts/Sarabun-Regular.ttf`

**Cause**: TypeScript `rootDir` inference (caused by `prisma.config.ts` at project root) places compiled output at `dist/src/features/pdf/`, but `nest-cli.json` copies assets to `dist/features/pdf/`.

**Fix**: Ensure `pdf.service.tsx` uses the `pdfBaseDir` normalization (see §8.4). If still failing after rebuild:
```bash
cd backend
rm -rf dist
npm run build
# Verify: find dist -name "Sarabun-Regular.ttf"
# Should be at: dist/features/pdf/fonts/Sarabun-Regular.ttf
```

#### Symptom: PDF renders boxes instead of Thai text

**Cause**: Sarabun font not registered.

**Fix**:
- Confirm `nest-cli.json` has `"assets": ["**/*.ttf", "**/*.png"]`
- Confirm TTFs exist in `src/features/pdf/fonts/`
- Run `npm run build` again

---

### 9.6 Render Deployment Errors

#### Symptom: Build succeeds but app crashes at startup

**Cause**: Missing env var (likely `JWT_SECRET`).

**Fix**: Check Render dashboard → Environment. All vars from §4.2 must be set.

#### Symptom: Health check never passes

**Cause**: App binding to wrong port or `/api/health` not responding.

**Fix**:
- Render injects `PORT` env var — `main.ts` reads `process.env.PORT || 3001`
- Health check path must be exactly `/api/health` (with `/api` prefix)

#### Symptom: CORS errors in browser

**Cause**: `FRONTEND_URL` not set or wrong.

**Fix**: Set `FRONTEND_URL` to exact Vercel URL (with protocol, no trailing slash).

---

### 9.7 Vercel Deployment Errors

#### Symptom: Build fails with `output: 'standalone'` error

**Cause**: `next.config.ts` had `output: "standalone"` (Vercel doesn't need it).

**Fix**: Remove the option (already done in current codebase):
```typescript
const nextConfig: NextConfig = {};
```

#### Symptom: API calls fail with CORS

**Cause**: Backend `FRONTEND_URL` doesn't match Vercel deployment URL.

**Fix**: Update `FRONTEND_URL` in Render env vars.

#### Symptom: 404 on routes after deploy

**Cause**: Root directory not set to `frontend` in Vercel project settings.

**Fix**: Vercel dashboard → Project Settings → Root Directory = `frontend`.

---

## 10. Future Development Guide

### 10.1 How to Add a New Module

Example: adding a `customers` module.

1. **Prisma schema** — add model:
   ```prisma
   model Customer {
     id        String   @id @default(uuid())
     name      String
     createdAt DateTime @default(now())
     @@map("customers")
   }
   ```
2. **Generate migration**:
   ```bash
   npx prisma migrate dev --name add_customers
   ```
3. **Scaffold NestJS module**:
   ```bash
   npx nest g resource customers
   ```
4. **Edit** `customers/customers.controller.ts`, `customers.service.ts`, `customers.dto/*`
5. **Register module** in `app.module.ts`:
   ```typescript
   imports: [..., CustomersModule],
   ```
6. **Frontend**: add hook `hooks/use-customers.ts`, page `app/(dashboard)/customers/page.tsx`

### 10.2 How to Add a New Database Table

1. Edit `prisma/schema.prisma` — add the model with proper `@@map()` for snake_case table name
2. Run `npx prisma migrate dev --name <descriptive_name>`
3. Run `npx prisma generate` to update the client types
4. For seed data, edit `prisma/seed.ts`

### 10.3 How to Add a New API Endpoint

1. Add route to appropriate controller (`@Get`, `@Post`, etc.)
2. Add method to corresponding service
3. Add DTO with `class-validator` decorators
4. If public, exclude from JWT guard (guard is global — use `@Public()` decorator if added)
5. Test via Swagger UI at `/api/docs`

### 10.4 How to Add a New PDF Field

1. **Extend** `QuotationPdfData` interface in `pdf/templates/quotation-pdf.tsx`
2. **Render** the new field in the JSX layout
3. **Populate** it in `QuotationService.buildPdfData()`
4. **Frontend** — if user-configurable, add to create/edit forms

### 10.5 How to Add a New Settings Page

1. **Backend**: scaffold module (controller + service + DTO + Prisma model if persistence needed)
2. **Frontend**: create `app/(dashboard)/settings/<name>/page.tsx`
3. **Hook**: add `hooks/use-<name>.ts` mirroring `use-supplier.ts`
4. **Sidebar**: add nav item in `components/layout/sidebar.tsx` and `mobile-nav.tsx`

### 10.6 How to Add a New Environment Variable

1. **Backend**:
   - Add to `src/config/configuration.ts`:
     ```typescript
     myNewVar: process.env.MY_NEW_VAR,
     ```
   - Add to `backend/.env.example` and your local `.env`
   - Add to Render env vars (and `render.yaml`)
   - If required at boot, add to `validateEnv()` in `main.ts`

2. **Frontend**:
   - Add to `frontend/.env.example` with `NEXT_PUBLIC_` prefix
   - Reference via `process.env.NEXT_PUBLIC_<NAME>`
   - Add to Vercel env vars

---

## 11. Codebase Risk Analysis

### 11.1 Technical Debt

| Issue | Severity | Impact | Recommendation |
|-------|----------|--------|----------------|
| `prisma.config.ts` at root changes TS `rootDir` (causes `dist/src/` path issues) | **Medium** | PDF asset path resolution fragile | Move `prisma.config.ts` into `src/`, OR add explicit `rootDir: "src"` to tsconfig |
| Mutation hooks use `any` types (`useQuotationActions.create` accepts `any`) | **Medium** | Type safety lost at mutation boundaries | Define proper DTO types in `types/index.ts` |
| `quotation.service.ts` is ~600 lines with mixed concerns (PDF + Drive + DB) | **Medium** | Hard to test, hard to change | Extract `QuotationPdfOrchestrator` and `QuotationDriveService` |
| No unit tests | **High** | Regressions undetectable | Add Jest tests for service layer |
| Signature uploads go to ephemeral filesystem (Render) | **High** | Files lost on redeploy | Migrate to S3/R2 or store as base64 in DB |
| No request rate limiting | **Medium** | DoS / brute-force exposure | Add `@nestjs/throttler` |

### 11.2 Security Risks

| Issue | Severity | Impact | Recommendation |
|-------|----------|--------|----------------|
| JWT secret stored as plain env var | **Low** | Standard practice | OK; consider secrets manager for enterprise |
| No password complexity rules (only min 6) | **Medium** | Weak passwords allowed | Add `class-validator` password rules |
| Customer Tax IDs stored in plaintext | **Low** | PII exposure | Acceptable for internal tool; encrypt at rest if expanding scope |
| No CSRF protection on auth endpoints | **Low** | JWT in localStorage (not cookie) — CSRF not applicable | Current design OK |
| Google Drive refresh token in env vars | **Medium** | Token leak = Drive access | Use Google's Workload Identity if migrating to GCP |
| `forbidNonWhitelisted: true` global pipe | **Low** | Good defense | Keep |
| No input sanitization on customer address (XSS via PDF?) | **Low** | React-PDF escapes by default | OK |

### 11.3 Deployment Risks

| Issue | Severity | Impact | Recommendation |
|-------|----------|--------|----------------|
| Render free tier cold starts (~30s) | **Medium** | Poor UX for first visitor after idle | Upgrade to paid tier or cron ping |
| Ephemeral filesystem loses signature uploads | **High** | PDFs break after redeploy | See §11.1 |
| Single-instance backend (no horizontal scaling) | **Low** | Acceptable for current scale | Monitor Render metrics |
| No DB backups configured | **High** | Data loss if Neon fails | Enable Neon PITR (point-in-time recovery) |
| No monitoring/alerting | **Medium** | Issues undetected | Add Sentry / LogRocket |

### 11.4 Scalability Risks

| Issue | Severity | Impact | Recommendation |
|-------|----------|--------|----------------|
| PDF generation blocks event loop | **Medium** | Under load, requests queue | Move PDF generation to background worker (BullMQ) |
| Google Drive API rate limits (queries/sec) | **Low** | Acceptable at current scale | Already mitigated via retry/backoff |
| Prisma connection per request (pg.Pool) | **Low** | Pool handles concurrency | OK; consider PgBouncer at high scale |
| No caching layer | **Low** | Repeated DB reads | Add Redis for hot paths if needed |

### 11.5 Maintainability Risks

| Issue | Severity | Impact | Recommendation |
|-------|----------|--------|----------------|
| No contributor docs beyond this manual | **Medium** | Onboarding friction | Keep this manual updated |
| Two seed configs existed (legacy `package.json` vs `prisma.config.ts`) — now resolved | **Low** | Was confusing | Done |
| Bilingual labels hardcoded in components | **Low** | Adding a third language = refactor | Extract to i18n library if needed |
| `tsconfig.json` no `include`/`exclude` — picks up root files | **Medium** | rootDir inference issues | Add `"include": ["src/**/*"]` |

---

## 12. Production Readiness Review

### 12.1 Frontend (Vercel) — Score: 90/100

| Criterion | Status | Notes |
|-----------|--------|-------|
| Build succeeds on Vercel | ✅ Pass | `output: "standalone"` removed |
| Env vars documented | ✅ Pass | `NEXT_PUBLIC_API_URL` |
| Error boundaries | ⚠️ Partial | No explicit error boundary component |
| Loading states | ✅ Pass | Quotation create/edit overlays |
| Toast notifications | ✅ Pass | Sonner wired up |
| Type safety | ✅ Pass | `tsc --noEmit` clean |
| Linting | ✅ Pass | ESLint configured |
| Accessibility | ⚠️ Partial | Most inputs have labels, some ARIA missing |
| SEO | N/A | Internal tool |
| Bundle analysis | ⚠️ Partial | No bundle analyzer configured |

### 12.2 Backend (Render) — Score: 82/100

| Criterion | Status | Notes |
|-----------|--------|-------|
| Health check endpoint | ✅ Pass | `GET /api/health` |
| Env var validation at boot | ✅ Pass | `validateEnv()` |
| JWT secret management | ✅ Pass | No fallback, auto-generated on Render |
| SSL for Neon | ✅ Pass | Auto-detected |
| Error handling | ✅ Pass | NestJS exception filter (default) |
| Request validation | ✅ Pass | Global `ValidationPipe` |
| CORS configured | ✅ Pass | Via `FRONTEND_URL` |
| API documentation | ✅ Pass | Swagger at `/api/docs` |
| Logging | ⚠️ Partial | Default NestJS logger, no structured logging |
| Rate limiting | ❌ Fail | Add `@nestjs/throttler` |
| Tests | ❌ Fail | No test suite |
| Graceful shutdown | ⚠️ Partial | `OnModuleDestroy` disconnects Prisma; no SIGTERM handler |
| Ephemeral FS for uploads | ❌ Fail | Signatures lost on redeploy |

### 12.3 Database (Neon) — Score: 88/100

| Criterion | Status | Notes |
|-----------|--------|-------|
| Connection SSL | ✅ Pass | `sslmode=require` |
| Migrations under control | ✅ Pass | 6 migrations, all applied |
| Seed script exists | ✅ Pass | `prisma/seed.ts` |
| Connection pooling | ⚠️ Partial | Not using PgBouncer yet |
| Backups | ❌ Fail | Verify Neon PITR is enabled |
| Indexes | ⚠️ Partial | Only default PK + unique constraints |
| Schema documentation | ✅ Pass | This manual |

### 12.4 Overall Production Readiness Score: **87/100**

### 12.5 Deployment Checklist

#### Pre-Deploy (Must Complete)
- [ ] Create Neon project, copy `DATABASE_URL`
- [ ] Run `prisma migrate deploy` against Neon
- [ ] Run `prisma db seed` against Neon
- [ ] Create Render Web Service from `render.yaml`
- [ ] Set all backend env vars (Render dashboard)
- [ ] Create Vercel project, root = `frontend`
- [ ] Set `NEXT_PUBLIC_API_URL` on Vercel
- [ ] Set `FRONTEND_URL` on Render (matching Vercel URL)
- [ ] Configure Google Drive OAuth credentials
- [ ] Verify `GET /api/health` returns 200 on Render
- [ ] Verify frontend loads without CORS errors
- [ ] Test login → create quotation → download PDF end-to-end

#### Post-Deploy (Recommended)
- [ ] Enable Neon PITR backups
- [ ] Add Sentry/error tracking
- [ ] Set up uptime monitoring (e.g., UptimeRobot on `/api/health`)
- [ ] Configure custom domain + SSL
- [ ] Document Runbook for on-call

### 12.6 Missing Items

| Item | Priority | Effort |
|------|----------|--------|
| Persistent file storage (S3/R2) for signatures | **Critical** | 1-2 days |
| Automated test suite | High | 2-3 days |
| Rate limiting | High | 2 hours |
| Structured logging (Pino) | Medium | 4 hours |
| Sentry integration | Medium | 2 hours |
| CI pipeline (GitHub Actions) | Medium | 4 hours |
| Custom domain + SSL | Low | 1 hour |
| Bundle analyzer | Low | 1 hour |

### 12.7 Critical Issues Before Release

1. **Signature upload persistence** — Files on Render's filesystem are wiped on every redeploy. Either:
   - Move uploads to S3/Cloudflare R2 (recommended)
   - Store signature images as base64 in the `users.signatureUrl` column (simplest fix)

2. **Database backups** — Verify Neon's PITR is enabled on your plan. Without it, a bad migration or accidental deletion is unrecoverable.

3. **`FRONTEND_URL` after first deploy** — The backend needs to know the Vercel URL for CORS. Set it after the first Vercel deploy and re-deploy Render.

### 12.8 Recommended Improvements (Post-Launch)

- **Background PDF worker** — Move PDF generation off the request thread using BullMQ + Redis
- **Multi-user support** — Add `tenantId` scoping if expanding beyond single-org use
- **Audit log** — Track who created/edited/deleted quotations
- **Quotation templates** — Multiple PDF layouts selectable per quotation
- **Email integration** — Send quotations directly to customers via SMTP

---

*End of System / Developer Manual*
