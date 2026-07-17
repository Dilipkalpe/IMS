#!/usr/bin/env bash
# Fix: ims.* and tms.* both open TMS on Contabo
# Run on the server (SSH root@144.91.98.218) AFTER IMS Coolify redeploy with port 8081.
set -euo pipefail

echo "==> Checking IMS on localhost:8081"
if curl -fsS --max-time 5 http://127.0.0.1:8081/api/health | grep -q ims-api; then
  echo "IMS Docker web is OK on :8081"
else
  echo "WARN: http://127.0.0.1:8081/api/health did not return ims-api."
  echo "      Redeploy IMS in Coolify first (docker-compose.coolify.yml must expose 8081:80)."
fi

echo "==> Installing IMS nginx vhost"
cat > /etc/nginx/sites-available/ims <<'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name ims.144.91.98.218.nip.io;

    client_max_body_size 25m;

    location / {
        proxy_pass http://127.0.0.1:8081;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
    }
}
EOF
ln -sf /etc/nginx/sites-available/ims /etc/nginx/sites-enabled/ims

echo "==> TMS vhosts — ensure ims.* is NOT in server_name"
grep -R "server_name" /etc/nginx/sites-enabled/ 2>/dev/null || true
echo ""
echo "If any TMS config lists ims.144.91.98.218.nip.io or uses default_server for all hosts,"
echo "edit that file so TMS only has: server_name tms.144.91.98.218.nip.io;"

nginx -t
systemctl reload nginx

echo ""
echo "==> Verify"
echo -n "ims: "; curl -fsS http://ims.144.91.98.218.nip.io/api/health || true
echo ""
echo -n "tms: "; curl -fsS http://tms.144.91.98.218.nip.io/api/health || true
echo ""
