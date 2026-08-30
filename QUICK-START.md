# Quick Deployment Guide - 10 Minutes Setup

## 🚀 Linux/Ubuntu VPS (Recommended)

### 1. Connect to VPS
```bash
ssh root@your.vps.ip
```

### 2. Install Prerequisites
```bash
apt update && apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs
npm install -g pm2
```

### 3. Clone & Deploy
```bash
cd /opt
git clone https://github.com/ahmad-ramzan/online-proxy.git
cd online-proxy

# Copy environment template
cp .env.example .env.production
# Edit with your settings
nano .env.production

# Run automated deployment
chmod +x scripts/deploy-linux.sh
./scripts/deploy-linux.sh
```

### 4. Setup Domain (Nginx)
```bash
apt install -y nginx certbot python3-certbot-nginx

# Get SSL certificate
certbot certonly --nginx -d yourdomain.com

# Create nginx config
sudo tee /etc/nginx/sites-available/proxygpt > /dev/null <<'NGINX'
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
NGINX

# Enable and restart
sudo ln -s /etc/nginx/sites-available/proxygpt /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### ✅ Done! Access at `https://yourdomain.com`

---

## 🪟 Windows VPS (Alternative)

### 1. Remote Desktop Connect
Open RDP and login with your credentials

### 2. Install Node.js
- Download from https://nodejs.org/
- Install with default settings
- Open PowerShell and verify: `node --version`

### 3. Deploy
```powershell
cd C:\opt
git clone https://github.com/ahmad-ramzan/online-proxy.git
cd online-proxy

# Copy environment template
Copy-Item .env.example .env.production
# Edit settings
notepad .env.production

# Run deployment script
powershell -ExecutionPolicy Bypass -File .\scripts\deploy-windows.ps1
```

### ✅ Done! Access at `http://localhost:3000`

---

## 📋 Essential Environment Variables

**Minimum required settings** in `.env.production`:

```env
VITE_APP_NAME=ProxyGPT Online
APP_URL=https://yourdomain.com
NODE_ENV=production
STRIPE_SECRET_KEY=sk_live_xxxxx
PROXY_PROVIDER_API_KEY=your_key_here
DATABASE_PATH=/opt/online-proxy/data/db.json
```

---

## 🔍 Monitoring

```bash
# View logs
pm2 logs proxygpt

# Monitor resources
pm2 monit

# Check status
pm2 status

# Restart app
pm2 restart proxygpt
```

---

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 3000 in use | `lsof -i :3000` then `kill -9 <PID>` |
| Build fails | Run `npm install` first |
| Can't connect | Check firewall (allow 80, 443) |
| High memory | `pm2 restart proxygpt` |

---

## 📚 Full Documentation

See `DEPLOYMENT.md` for detailed setup, SSL, backups, and production hardening.

---

**Time to deploy:** ~10 minutes  
**Estimated cost:** $5-20/month (VPS) + Domain name
