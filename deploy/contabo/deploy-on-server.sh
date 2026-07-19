#!/usr/bin/env bash
# Update IMS on Contabo after uploading publish bundle to /var/www/ims
# Run from /var/www/ims: bash deploy-on-server.sh

set -euo pipefail

APP_ROOT="${APP_ROOT:-/var/www/ims}"
cd "$APP_ROOT"

echo "==> Deploying IMS from $APP_ROOT"

if [[ ! -f "$APP_ROOT/api/package.json" ]]; then
  echo "Missing $APP_ROOT/api/package.json — upload publish bundle first." >&2
  exit 1
fi

if [[ ! -f "$APP_ROOT/api/.env" ]]; then
  if [[ -f "$APP_ROOT/api.env.production.example" ]]; then
    cp "$APP_ROOT/api.env.production.example" "$APP_ROOT/api/.env"
    echo "Created api/.env from example — EDIT IMS_AUTH_SECRET and MONGODB_URI before go-live."
  else
    echo "Missing api/.env" >&2
    exit 1
  fi
fi

# MongoDB (Docker) if compose file present
if [[ -f "$APP_ROOT/docker-compose.mongo.yml" ]] && command -v docker >/dev/null 2>&1; then
  docker compose -f "$APP_ROOT/docker-compose.mongo.yml" up -d
  echo "Waiting for MongoDB..."
  sleep 3
fi

echo "==> Installing API dependencies"
cd "$APP_ROOT/api"
npm ci --omit=dev 2>/dev/null || npm install --omit=dev

echo "==> Restarting API (PM2)"
if pm2 describe ims-api >/dev/null 2>&1; then
  pm2 restart ims-api
else
  pm2 start "$APP_ROOT/pm2.ecosystem.cjs"
fi
pm2 save
pm2 startup systemd -u "${SUDO_USER:-root}" --hp "/home/${SUDO_USER:-root}" 2>/dev/null || true

echo "==> Nginx"
if [[ -f "$APP_ROOT/nginx-ims.conf" ]]; then
  cp "$APP_ROOT/nginx-ims.conf" /etc/nginx/sites-available/ims
  ln -sf /etc/nginx/sites-available/ims /etc/nginx/sites-enabled/ims
  rm -f /etc/nginx/sites-enabled/default
  nginx -t
  systemctl reload nginx
fi

echo ""
echo "==> Health check"
sleep 2
curl -fsS "http://127.0.0.1:3000/api/health" && echo ""
curl -fsS "http://127.0.0.1/api/health" && echo "" || echo "(nginx /api/health — configure server_name if needed)"

echo ""
echo "Done. Open http://YOUR_SERVER_IP/ in browser."
echo "Default login (if seeded): admin / admin"
