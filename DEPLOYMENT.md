# Deployment Guide

This document describes how to deploy the Single-Ecom application (Frontend, Admin, Backend) using GitHub Actions.

## Architecture Overview

| Component | Technology | Port |
|-----------|------------|------|
| Frontend | TanStack Start + Vite | 3000 |
| Admin | TanStack Start + Vite | 3001 |
| Backend | FastAPI + Python | 8000 |

---

## GitHub Actions Deployment

The deployment is automated via GitHub Actions workflow (`.github/workflows/deploy.yml`).

### Trigger
- **Automatic**: Pushes to `main` branch
- **Manual**: Via GitHub Actions UI (workflow_dispatch)

### What it does
1. Builds Frontend and Admin apps with Vite
2. Copies build artifacts to server via SCP
3. Copies Backend code to server
4. Creates `.env` files from GitHub secrets
5. Installs backend dependencies with `uv`
6. Runs database migrations with Alembic
7. Restarts all systemd services

---

## Required GitHub Secrets

Go to: **Repository Settings → Secrets and Variables → Actions → New Repository Secret**

| Secret | Description | Example |
|--------|-------------|---------|
| `HOST` | Server IP address | `192.168.1.100` |
| `USERNAME` | SSH username | `ubuntu` |
| `KEY` | SSH private key (PEM format) | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `PORT` | SSH port | `22` |
| `VITE_API_URL` | API URL for frontend builds | `https://api.example.com/api/v1` |
| `BACKEND_ENV` | Backend `.env` file contents | See below |
| `FRONTEND_ENV` | Frontend `.env` file contents | See below |
| `ADMIN_ENV` | Admin `.env` file contents | See below |

### Example BACKEND_ENV

```env
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/dbname
SECRET_KEY=your-secret-key
SUPER_ADMIN_EMAIL=admin@example.com
SUPER_ADMIN_PASSWORD=Admin@123
CORS_ORIGINS=["https://example.com","https://admin.example.com"]
```

### Example FRONTEND_ENV / ADMIN_ENV

```env
VITE_API_URL=https://api.example.com/api/v1
```

---

## Server Setup

### 1. Install Prerequisites

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install Python 3.12 and uv
sudo apt install -y python3.12 python3.12-venv
curl -LsSf https://astral.sh/uv/install.sh | sh

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Nginx (optional, for reverse proxy)
sudo apt install -y nginx
```

### 2. Create Application Directory

```bash
sudo mkdir -p /var/www/single-ecom
sudo chown $USER:$USER /var/www/single-ecom
```

### 3. Create Systemd Services

#### Backend Service

```bash
sudo nano /etc/systemd/system/single-ecom-backend.service
```

```ini
[Unit]
Description=Single-Ecom Backend API
After=network.target postgresql.service

[Service]
User=ubuntu
WorkingDirectory=/var/www/single-ecom/backend
Environment="PATH=/var/www/single-ecom/backend/.venv/bin"
ExecStart=/root/.local/bin/uv run uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

#### Frontend Service

```bash
sudo nano /etc/systemd/system/single-ecom-frontend.service
```

```ini
[Unit]
Description=Single-Ecom Frontend
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/var/www/single-ecom/frontend
ExecStart=/usr/bin/node .output/server/index.mjs
Environment="PORT=3000"
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

#### Admin Service

```bash
sudo nano /etc/systemd/system/single-ecom-admin.service
```

```ini
[Unit]
Description=Single-Ecom Admin Panel
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/var/www/single-ecom/admin
ExecStart=/usr/bin/node .output/server/index.mjs
Environment="PORT=3001"
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

### 4. Enable Services

```bash
sudo systemctl daemon-reload
sudo systemctl enable single-ecom-backend
sudo systemctl enable single-ecom-frontend
sudo systemctl enable single-ecom-admin
```

---

## Nginx Reverse Proxy (Optional)

```nginx
# /etc/nginx/sites-available/single-ecom

# Frontend
server {
    listen 80;
    server_name example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Admin
server {
    listen 80;
    server_name admin.example.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# API
server {
    listen 80;
    server_name api.example.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/single-ecom /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## Manual Deployment

If you need to deploy manually without GitHub Actions:

```bash
# SSH to server
ssh user@your-server

# Pull latest code
cd /var/www/single-ecom
git pull origin main

# Build Frontend
cd frontend && npm ci && npm run build

# Build Admin
cd ../admin && npm ci && npm run build

# Update Backend
cd ../backend
uv sync --frozen --no-install-project
uv run alembic upgrade head

# Restart services
sudo systemctl restart single-ecom-backend
sudo systemctl restart single-ecom-frontend
sudo systemctl restart single-ecom-admin
```

---

## Troubleshooting

### Check Service Status
```bash
sudo systemctl status single-ecom-backend
sudo systemctl status single-ecom-frontend
sudo systemctl status single-ecom-admin
```

### View Logs
```bash
sudo journalctl -u single-ecom-backend -f
sudo journalctl -u single-ecom-frontend -f
sudo journalctl -u single-ecom-admin -f
```

### Common Issues

| Issue | Solution |
|-------|----------|
| Port already in use | `sudo lsof -i :PORT` to find process, then kill it |
| Permission denied | Check file ownership: `sudo chown -R ubuntu:ubuntu /var/www/single-ecom` |
| Database connection failed | Verify PostgreSQL is running and credentials in `.env` are correct |
| Build fails | Check Node.js version (need v20+) and npm dependencies |
