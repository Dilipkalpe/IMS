# IMS API — ASP.NET Core (.NET 8) + PostgreSQL

Migration target for the Node.js + MongoDB backend in `../api/`.

## Quick start

```powershell
# PostgreSQL must be running; create DB first:
# psql -U postgres -c "CREATE DATABASE ims_dev;"

cd ims-api-net
dotnet ef database update --project src\Ims.Infrastructure --startup-project src\Ims.Api
dotnet run --project src\Ims.Api
```

- Health: `GET /api/health`
- Login: `POST /api/auth/login` with `{ "loginId": "admin", "password": "admin", "financialYearId": "..." }`
- Default credentials: **admin** / **admin**

## Configuration

Edit `src/Ims.Api/appsettings.Development.json`:

```json
{
  "ConnectionStrings": {
    "PostgreSQL": "Host=127.0.0.1;Port=5432;Database=ims_dev;Username=postgres;Password=postgres"
  },
  "IMS_AUTH_SECRET": "ims-dev-auth-secret-change-in-production"
}
```

## Migration progress

See [docs/NODE-TO-DOTNET-MIGRATION.md](../docs/NODE-TO-DOTNET-MIGRATION.md) for the full endpoint checklist and phase plan.

**Implemented:** auth, health, financial-years, products, accounts (foundation).

**Pending:** ~340 remaining endpoints across sales, purchase, payroll, reports, import, etc.
