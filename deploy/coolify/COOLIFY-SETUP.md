# Coolify — IMS Application

**IMS URL:** http://ims.144.91.98.218.nip.io/  
**TMS URL (separate app):** http://tms.144.91.98.218.nip.io/  
**Coolify panel:** http://144.91.98.218:8000/

IMS and TMS are **two independent applications** on the same Contabo server — each has its own Coolify resource and nip.io subdomain.

---

## Quick setup in Coolify (IMS only)

### 1. New Docker Compose resource

| Field | Value |
|-------|--------|
| Project | `IMS` (separate from TMS project) |
| Type | Docker Compose |
| Compose file | `docker-compose.coolify.yml` |
| Base directory | `/` (repo root) |

### 2. Environment variables

Copy from [`deploy/coolify/.env.coolify.example`](.env.coolify.example):

```
IMS_PUBLIC_URL=http://ims.144.91.98.218.nip.io
IMS_AUTH_SECRET=<openssl rand -hex 32>
VITE_API_BASE_URL=
```

Leave `VITE_API_BASE_URL` **empty** — nginx proxies `/api` on the same IMS host.

### 3. Assign domain to **web** service (IMS only)

In Coolify → IMS compose stack → **web** service → **Domains**:

```
http://ims.144.91.98.218.nip.io
```

Do **not** use `tms.144.91.98.218.nip.io` — that belongs to the TMS application.

### 4. Deploy

Click **Deploy**. Wait for: `mongodb` → `api` → `web` healthy.

### 5. Seed (first time)

Coolify → IMS **api** → **Terminal**:

```bash
node src/seed.js
node scripts/set-admin-password.js
```

### 6. Verify

| Application | URL | Expected |
|-------------|-----|----------|
| **IMS** | http://ims.144.91.98.218.nip.io/api/health | API health JSON |
| **IMS** | http://ims.144.91.98.218.nip.io/ | IMS login page |
| **TMS** | http://tms.144.91.98.218.nip.io/ | TMS (unchanged, separate stack) |
| IMS login | — | `admin` / `admin` |

---

## Architecture (IMS stack)

```
Browser → ims.144.91.98.218.nip.io
            ├── /      → nginx → React (web)
            └── /api/* → nginx → Node API → MongoDB (ims DB)
```

TMS runs its own stack on `tms.144.91.98.218.nip.io` with separate DB/services.

---

## WPF desktop (IMS)

`%LocalAppData%\IMS\settings.json`:

```json
{
  "ApiBaseUrl": "http://ims.144.91.98.218.nip.io"
}
```

---

## Re-deploy after code changes

Git push → Coolify → IMS stack → **Redeploy**.

---

## Optional: HTTPS

Coolify → IMS **web** → Domains → enable **HTTPS** when you have a real domain. nip.io subdomains typically use HTTP for testing.
