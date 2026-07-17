# Fix: ims.* and tms.* open the same app (TMS)

**Symptom:** Both URLs show TMS login:
- http://tms.144.91.98.218.nip.io/ → TMS ✓
- http://ims.144.91.98.218.nip.io/ → TMS ✗ (should be IMS)

**Cause (Contabo):** **Host Ubuntu nginx** (`nginx/1.24.0`) owns port 80 and serves TMS for **all** hostnames. IMS runs in Coolify Docker but traffic never reaches it.

Check: both URLs return `Server: nginx/1.24.0 (Ubuntu)` and `"service":"TMS Pro API"`.

---

## Fix (SSH to server — ~5 minutes)

### 1. Redeploy IMS in Coolify

Coolify → IMS app → **Actions → Redeploy** (uses `docker-compose.coolify.yml` with `8081:80` on web).

### 2. Run split script on server

```bash
ssh root@144.91.98.218
curl -fsSL https://raw.githubusercontent.com/Dilipkalpe/IMS/main/deploy/coolify/fix-nginx-split.sh | bash
```

Or copy `deploy/coolify/fix-nginx-split.sh` and run `sudo bash fix-nginx-split.sh`.

### 3. Fix TMS nginx (if ims still shows TMS)

```bash
grep -R "server_name" /etc/nginx/sites-enabled/
```

Edit the TMS site so it has **only**:

```nginx
server_name tms.144.91.98.218.nip.io;
```

Remove `ims.144.91.98.218.nip.io`, `_`, or `default_server` from the TMS block.

```bash
sudo nginx -t && sudo systemctl reload nginx
```

---

## Manual nginx (if you prefer)

IMS vhost: `deploy/coolify/nginx-host-ims.conf` → proxies `ims.*` → `http://127.0.0.1:8081`

---

## Verify (must differ after fix)

| URL | Must show |
|-----|-----------|
| http://tms.144.91.98.218.nip.io/api/health | `"service":"TMS Pro API"` |
| http://ims.144.91.98.218.nip.io/api/health | `"service":"ims-api"` |
| http://ims.144.91.98.218.nip.io/ | IMS login (not TMS) |

---

## Coolify-only note

If you **remove host nginx** and let Coolify Traefik own port 80, use separate Coolify resources and domains only (Step A/B below). On this server, TMS uses host nginx, so the SSH steps above are required.

### Step A — TMS Coolify: keep only `tms.*` domain

1. Open http://144.91.98.218:8000/
2. Open your **TMS** project / application
3. Go to **Domains** (or per-service domains for TMS web)
4. **Remove** `ims.144.91.98.218.nip.io` if it is listed
5. **Keep only:**
   ```
   http://tms.144.91.98.218.nip.io
   ```
6. **Save** → **Redeploy** TMS

### Step B — IMS: create separate Docker Compose stack

1. **+ Add** → **New Project** → name: `IMS`
2. **+ Add** → **Docker Compose**
3. Connect your **IMS Git repo** (this repository)
4. Settings:

| Field | Value |
|-------|--------|
| Compose file | `docker-compose.coolify.yml` |
| Base directory | `/` |

5. **Environment variables:**

```
IMS_PUBLIC_URL=http://ims.144.91.98.218.nip.io
IMS_AUTH_SECRET=<openssl rand -hex 32>
VITE_API_BASE_URL=
SERVICE_FQDN_WEB_80=ims.144.91.98.218.nip.io
```

6. Open the **web** service inside the compose stack → **Domains** → set:
   ```
   http://ims.144.91.98.218.nip.io
   ```
   Port: **80**

7. **Do not** add a public domain on `api` or `mongodb` — API is internal + proxied via `/api` on the web container.

8. **Deploy** (full deploy, not restart only)

### Step C — Seed IMS database (first time)

IMS stack → **api** container → **Terminal**:

```bash
node src/seed.js
node scripts/set-admin-password.js
```

---

## Verify (must differ after fix)

| URL | Must show |
|-----|-----------|
| http://tms.144.91.98.218.nip.io/api/health | `"service":"TMS Pro API"` |
| http://ims.144.91.98.218.nip.io/api/health | `"service":"ims-api"` |
| http://ims.144.91.98.218.nip.io/ | IMS login (not TMS) |

---

## If IMS still shows TMS after deploy

1. Hard refresh browser (Ctrl+Shift+R) or incognito window
2. Coolify → **Proxy** → restart Traefik/Caddy
3. Confirm two **separate** resources in Coolify (TMS project + IMS project)
4. Check domain conflict: Coolify warns if two apps share the same FQDN

---

## Summary

| App | Coolify resource | Domain |
|-----|------------------|--------|
| TMS | Existing TMS app | `tms.144.91.98.218.nip.io` only |
| IMS | **New** IMS Docker Compose | `ims.144.91.98.218.nip.io` only |

Never put both domains on one application.
