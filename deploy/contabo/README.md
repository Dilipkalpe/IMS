# IMS — Contabo deployment (React + Node.js + MongoDB)

Deploy the **React web app**, **Node API**, and **MongoDB** on a Contabo VPS (Ubuntu 22.04/24.04).

## Architecture

```
Browser → nginx (:80)
            ├── /          → /var/www/ims/web   (React static)
            └── /api/*     → PM2 → Node (:3000)
MongoDB     → Docker :27017 (local) or MongoDB Atlas
```

## 1. Build on your PC (Windows)

```powershell
cd D:\DK\RDERP\IMS
powershell -ExecutionPolicy Bypass -File deploy\contabo\publish.ps1
```

Output: `deploy\contabo\publish\`

| Folder | Contents |
|--------|----------|
| `api/` | Node API + `node_modules` |
| `web/` | React production build |
| `*.sh`, `*.conf` | Server scripts |

## 2. Upload to Contabo

Replace `USER` and `SERVER_IP` with your SSH user and Contabo VPS IP.

```powershell
scp -r deploy\contabo\publish\* USER@SERVER_IP:/var/www/ims/
```

Or use **WinSCP** / **FileZilla** to upload `publish` contents to `/var/www/ims/`.

## 3. First-time server setup (SSH)

```bash
ssh USER@SERVER_IP
cd /var/www/ims
sudo bash server-setup.sh
```

## 4. Configure environment

```bash
sudo cp /var/www/ims/api.env.production.example /var/www/ims/api/.env
sudo nano /var/www/ims/api/.env
```

Set:

- `IMS_AUTH_SECRET` — long random string (`openssl rand -hex 32`)
- `MONGODB_URI` — `mongodb://127.0.0.1:27017/ims` (local Docker) or Atlas connection string

Edit nginx domain:

```bash
sudo nano /var/www/ims/nginx-ims.conf
# Change server_name YOUR_DOMAIN_OR_IP;
```

## 5. Deploy / update

```bash
cd /var/www/ims
sudo bash deploy-on-server.sh
```

## 6. Verify

```bash
curl http://127.0.0.1/api/health
```

Open in browser: `http://SERVER_IP/`

Default login (after seed): **admin** / **admin**

## Seed data (optional, on server)

```bash
cd /var/www/ims/api
node src/seed.js
node scripts/set-admin-password.js
```

## SSL (recommended)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## Updates (all code changes)

1. Run `publish.ps1` on PC  
2. Upload `publish/api` and `publish/web` to server  
3. Run `sudo bash deploy-on-server.sh` on server  

## PM2 commands

```bash
pm2 status
pm2 logs ims-api
pm2 restart ims-api
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| API 502 | `pm2 logs ims-api`, check MongoDB running |
| Blank page | Ensure `web/index.html` exists; nginx `try_files` |
| CORS errors | Use same-origin `/api` (default Contabo build) |
| Mongo refused | `docker compose -f docker-compose.mongo.yml up -d` |

## WPF desktop

Point `%LocalAppData%\IMS\settings.json`:

```json
{ "ApiBaseUrl": "http://YOUR_SERVER_IP" }
```
