# Node.js + MongoDB → ASP.NET Core + PostgreSQL Migration

This document tracks migration of the IMS backend from `api/` (Node/Express/Mongoose) to `ims-api-net/` (.NET 8/EF Core/PostgreSQL).

## Architecture mapping

| Node.js (current) | ASP.NET Core (target) |
|-------------------|------------------------|
| Express routes (`api/src/routes/*.js`) | ASP.NET Controllers (`Ims.Api/Controllers/`) |
| Mongoose models (`api/src/models/`) | EF Core entities (`Ims.Domain/`) |
| Services (`api/src/services/`) | Application + Infrastructure services |
| `yearDbContext` + per-DB Mongo | `YearDatabaseName` column + middleware |
| Custom HMAC JWT (`auth.js`) | `AuthService` (PBKDF2 + HMAC parity) |
| `MONGODB_URI` | `ConnectionStrings:PostgreSQL` |

## Financial year isolation

**MongoDB:** Each FY = separate database (`IWM_2526`, etc.).

**PostgreSQL:** Single database; business tables include `year_database_name` (matches Mongo `databaseName`). JWT still carries `yearDb` claim for API compatibility.

## Project structure

```
ims-api-net/
  src/
    Ims.Api/           # HTTP layer, middleware, controllers
    Ims.Application/   # Interfaces, DTOs, abstractions
    Ims.Domain/        # Entities
    Ims.Infrastructure/# EF Core, auth, services, migrations
```

## Migration status

### Phase 1 — Foundation (started)

| Area | Status |
|------|--------|
| Solution scaffold | Done |
| PostgreSQL + EF Core | Done |
| Auth (login/logout/me, HMAC JWT, PBKDF2) | Done |
| Financial year middleware | Done |
| Health + `/api` root | Done |
| Financial years list | Done |
| Products CRUD (full parity) | Done |
| Bootstrap (admin user, default FY, license) | Done |

### Phase 2 — Masters & security

| Module | Endpoints | Status |
|--------|-----------|--------|
| Accounts | 7 | Pending |
| Users | 5 | Pending |
| Companies | 8 | Pending |
| Warehouses, machines, product types, etc. | ~7×7 each | Pending |
| Roles & menus (RBAC) | 9 | Pending |
| Security (edit/delete password) | 4 | Pending |
| License admin | 4 | Pending |
| Grid columns | 6 | Pending |
| Settings | 2 | Pending |

### Phase 3 — Transactions

| Module | Status |
|--------|--------|
| Sales orders, quotations | Pending |
| Delivery challans, sales invoices, sales returns | Pending |
| Purchase orders, GRNs, purchase invoices, returns | Pending |
| Payment/receipt vouchers, credit/debit notes | Pending |
| Cash/bank entries, stock transfers | Pending |
| BOMs, production orders | Pending |

### Phase 4 — Reports, payroll, import

| Module | Status |
|--------|--------|
| Dashboard | Pending |
| Reports (stock, ledger, P&L, etc.) | Pending |
| Payroll (employees, attendance, runs, payslips) | Pending |
| Excel import | Pending |
| Bill formats & reporting designer | Pending |
| Admin (purge, backup) | Pending |

### Phase 5 — Data migration

| Task | Status |
|------|--------|
| MongoDB → PostgreSQL ETL script | Pending |
| Preserve ObjectId strings as `_id` | Designed |
| Year DB merge into `year_database_name` | Designed |
| Seed parity (`api/src/seed.js`) | Pending |

## Run locally

### Prerequisites

- .NET 8 SDK
- PostgreSQL 14+

### Setup

```powershell
# Create database
psql -U postgres -c "CREATE DATABASE ims_dev;"

cd D:\DK\RDERP\IMS\ims-api-net
dotnet ef database update --project src\Ims.Infrastructure --startup-project src\Ims.Api
dotnet run --project src\Ims.Api
```

API: `http://localhost:5000` (or port in `launchSettings.json`)

### Verify

```powershell
curl http://localhost:5000/api/health
curl http://localhost:5000/api/financial-years
curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d "{\"loginId\":\"admin\",\"password\":\"admin\",\"financialYearId\":\"<fy-id>\"}"
```

Login: **admin** / **admin**

## Environment variables

| Variable | Purpose |
|----------|---------|
| `ConnectionStrings__PostgreSQL` | PostgreSQL connection |
| `IMS_AUTH_SECRET` | HMAC token signing (must match Node if switching gradually) |
| `IMS_API_MOUNT_PATH` | IIS reverse-proxy path strip |
| `IMS_EDIT_DELETE_PASSWORD` | Edit/delete confirmation password |

## API compatibility rules

1. **Same URL paths** — `/api/products`, `/api/auth/login`, etc.
2. **Same JSON shape** — camelCase; entities expose `_id` (Mongo parity).
3. **Same HTTP status codes** — 401/403/404/204 as Node returns.
4. **Same auth header** — `Authorization: Bearer <token>`.
5. **Same token format** — `{base64url(payload)}.{hmac-sha256-signature}`.
6. **No breaking changes** to WPF (`IMS/`) or React (`ims-web/`) clients without explicit approval.

## Next implementation steps

1. Port **Accounts** controller (copy Products pattern).
2. Port **numbered document factory** for sales/purchase docs.
3. Port **Counter** service for document numbering.
4. Port **productStock** hooks on invoice/DC/GRN CRUD.
5. Port **menuPermissionService** for full RBAC (not admin-only stub).
6. Build MongoDB → PostgreSQL migration tool for production cutover.
