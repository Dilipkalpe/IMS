# IIS deployment — IMSWebAPI & IMSWebApp

## Quick fix for HTTP 404 / 403

404/403 usually means IIS folders are empty or only contain `web.config`.

Run this **once** from the repo (PowerShell as Administrator):

```powershell
cd D:\DK\RDERP\IMS\deploy\iis
.\publish.ps1
```

Then in **IIS Manager** set application physical paths:

| IIS application | Physical path |
|-----------------|---------------|
| **IMSWebAPI** | `C:\inetpub\ims\IMSWebAPI` |
| **IMSWebApp** | `C:\inetpub\ims\IMSWebApp` |

Restart both applications in IIS, then test:

- `http://localhost/IMSWebAPI/api/health`
- `http://localhost/IMSWebApp/`

---

## Architecture

| IIS name | Purpose | URL example |
|----------|---------|-------------|
| **IMSWebAPI** | Node.js REST API (HttpPlatformHandler) | `http://your-server/IMSWebAPI` |
| **IMSWebApp** | React build (static files) | `http://your-server/IMSWebApp` |

**IMSWebAPI** uses **reverse proxy** by default (IIS → Node on port 3000).

---

## Fix HTTP 500.19 (0x8007000d)

This error means IIS does not recognize `<httpPlatform>` in `web.config` (HttpPlatformHandler not installed).

**Quick fix (recommended):**

1. Use the **proxy** `web.config` (already the default). Copy was updated in your publish folder.
2. Install **URL Rewrite**: `winget install Microsoft.IISUrlRewriteModule`
3. Install **ARR** and enable proxy: IIS Manager → server → Application Request Routing → **Enable proxy**
4. Start the API in a console (keep it open):

```powershell
cd D:\DK\RDERP\IMS\deploy\iis
.\start-ims-api.ps1
```

5. Restart **IMSWebAPI** in IIS and open: `http://localhost/IMSWebAPI/api/health`

**Alternative (no separate npm start):** install Hosting Bundle, then publish with HttpPlatform:

```powershell
winget install Microsoft.DotNet.AspNetCore.HostingBundle
.\publish.ps1 -ApiMode httpplatform
```

---

## Prerequisites

1. **IIS** enabled (Windows Features → Internet Information Services)
2. **URL Rewrite** module — [download](https://www.iis.net/downloads/microsoft/url-rewrite)
3. **HttpPlatformHandler** — install [ASP.NET Core Hosting Bundle](https://dotnet.microsoft.com/download/dotnet) (includes HttpPlatformHandler)  
   Or enable Windows feature **IIS → Application Development → HttpPlatformHandler**
4. **Node.js** LTS installed at `C:\Program Files\nodejs\node.exe`
5. **MongoDB** running and `MONGODB_URI` set in `C:\inetpub\ims\IMSWebAPI\.env`

---

## IIS setup steps

1. Run `publish.ps1` (see above).
2. Open **IIS Manager** → **Sites** → **Default Web Site**.
3. **Add Application**:
   - Alias: `IMSWebAPI`
   - Physical path: `C:\inetpub\ims\IMSWebAPI`
4. **Add Application**:
   - Alias: `IMSWebApp`
   - Physical path: `C:\inetpub\ims\IMSWebApp`
5. Select application pool for **IMSWebAPI**:
   - **.NET CLR version**: No Managed Code
6. **Restart** both applications.

---

## Troubleshooting

| Error | Cause | Fix |
|-------|--------|-----|
| **404** on `/IMSWebAPI/api/health` | Empty folder or wrong physical path | Run `publish.ps1`, fix IIS path |
| **403.14** on `/IMSWebApp/` | No `index.html` | Run `publish.ps1` (builds React) |
| **500.19** (0x8007000d) | `httpPlatform` not installed | Use default **proxy** `web.config` + `start-ims-api.ps1`, OR install Hosting Bundle and use `web.config.httpplatform` |
| **502.3** Bad Gateway | Node failed to start | Check `C:\inetpub\ims\IMSWebAPI\iis-logs\` |
| API works on 3000 but not IIS | Using old proxy-only `web.config` | Use default `web.config` (HttpPlatformHandler) |

### API logs (IIS)

```
C:\inetpub\ims\IMSWebAPI\iis-logs\
```

### Alternative: reverse proxy (ARR)

If you prefer Node on port 3000 separately:

1. Start API: `cd api && npm start`
2. Enable ARR proxy in IIS
3. Replace `IMSWebAPI\web.config` with `web.config.proxy.arr`

---

## WPF desktop client

**Settings → API & web connection**

1. **IIS — IMSWebAPI**
2. Server: `localhost` or your PC name
3. **Test connection** → **Save**

---

## React rebuild after code changes

```powershell
cd D:\DK\RDERP\IMS\deploy\iis
.\publish.ps1
```

Then restart **IMSWebApp** in IIS.
