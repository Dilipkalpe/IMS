#!/usr/bin/env bash
# One-time Contabo/Ubuntu server setup for IMS (React + Node + MongoDB).
# Run as root or with sudo: bash server-setup.sh

set -euo pipefail

echo "==> IMS Contabo server setup"

export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y curl git nginx ufw

# Node.js 20 LTS
if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

# PM2
if ! command -v pm2 >/dev/null 2>&1; then
  npm install -g pm2
fi

# MongoDB (Docker) — optional; comment out if using Atlas
if ! command -v docker >/dev/null 2>&1; then
  apt-get install -y ca-certificates gnupg
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
    $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
fi

mkdir -p /var/www/ims/{api,web,logs}
chown -R "${SUDO_USER:-root}:${SUDO_USER:-root}" /var/www/ims 2>/dev/null || true

# Firewall
ufw allow OpenSSH || true
ufw allow 'Nginx Full' || true
ufw --force enable || true

echo ""
echo "Setup complete. Next:"
echo "  1. Upload deploy/contabo/publish/* to /var/www/ims/"
echo "  2. cp api.env.production.example -> /var/www/ims/api/.env and edit secrets"
echo "  3. docker compose -f docker-compose.mongo.yml up -d   (if using local Mongo)"
echo "  4. bash deploy-on-server.sh"
