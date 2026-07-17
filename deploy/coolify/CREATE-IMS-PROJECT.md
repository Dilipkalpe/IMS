# Create IMS project in Coolify — click-by-click

Do this in **http://144.91.98.218:8000/** (login: your Coolify account).

---

## Part 1 — Prepare Git (one time on your PC)

Coolify needs a Git repository. In PowerShell:

```powershell
cd D:\DK\RDERP\IMS
git init
git add api ims-web docker-compose.coolify.yml deploy/coolify .dockerignore api/.dockerignore ims-web/.dockerignore ims-web/nginx.conf ims-web/.env.production
git commit -m "IMS Coolify deployment"
```

Create a **private repo** on GitHub (e.g. `codeestack/ims`) and push:

```powershell
git remote add origin https://github.com/YOUR_USER/ims.git
git branch -M main
git push -u origin main
```

---

## Part 2 — Create IMS project in Coolify

### 1. New project
- Dashboard → **+ Add** → **New Project**
- Name: **`IMS`**
- Create

### 2. New Docker Compose resource
- Inside **IMS** project → **+ Add** → **Docker Compose**
- **Source:** Public / Private Git (your repo URL)
- **Branch:** `main`
- **Compose file:** `docker-compose.coolify.yml`
- **Base directory:** `/`

### 3. Environment variables

Click **Environment Variables** and add:

| Key | Value |
|-----|--------|
| `IMS_PUBLIC_URL` | `http://ims.144.91.98.218.nip.io` |
| `IMS_AUTH_SECRET` | *(run `openssl rand -hex 32` on server or use random string)* |
| `VITE_API_BASE_URL` | *(leave empty)* |
| `SERVICE_FQDN_WEB_80` | `ims.144.91.98.218.nip.io` |

### 4. Domain (web service only)

Open the compose stack → click **`web`** service → **Domains**:

```
http://ims.144.91.98.218.nip.io
```

Port: **80**

**Do not** add domains on `api` or `mongodb`.

### 5. Remove ims domain from TMS (important)

Open **TMS** project → Domains → **remove** `ims.144.91.98.218.nip.io` if present → Redeploy TMS.

### 6. Deploy IMS

Back in **IMS** project → **Deploy** (full deploy).

Wait until **mongodb**, **api**, **web** are green/healthy.

### 7. Seed database

IMS → **api** → **Terminal**:

```bash
node src/seed.js
node scripts/set-admin-password.js
```

---

## Part 3 — Verify

| URL | Expected |
|-----|----------|
| http://ims.144.91.98.218.nip.io/api/health | `"service":"ims-api"` |
| http://ims.144.91.98.218.nip.io/ | IMS login |
| http://tms.144.91.98.218.nip.io/ | TMS (unchanged) |

Login: **admin** / **admin**

---

## Files in this repo for Coolify

- `docker-compose.coolify.yml` — MongoDB + API + Web
- `api/Dockerfile`
- `ims-web/Dockerfile`
- `deploy/coolify/nginx-full.conf` — proxies `/api` to Node

---

## No GitHub yet?

Use **Coolify → Docker Compose → Private Git** with deploy key, or ask for help creating the GitHub repo.

Alternative: run `deploy\coolify\upload-and-deploy.bat root@144.91.98.218` if you have SSH access (bypasses Coolify Git).
