# ProxyGPT Online - Deployment Guide

Complete guide to deploy ProxyGPT Online on development machines and production VPS servers.

---

## 📋 Prerequisites

### Required
- **Node.js** 18+ ([download](https://nodejs.org/))
- **npm** 9+ (included with Node.js)
- **Git** for cloning and version control
- **PM2** for process management: `npm install -g pm2`

### Recommended
- **Linux/Ubuntu** 20.04+ for production (or Windows Server 2019+)
- **8GB RAM** minimum
- **50GB SSD** for database and application files
- **Static IP** address for VPS
- **Domain name** (DNS configured)

---

## 🖥️ Local Development

### 1. Clone Repository
```bash
git clone https://github.com/ahmad-ramzan/online-proxy.git
cd online-proxy
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Create Environment File
Create `.env.local` in project root:
```env
# App Settings
VITE_APP_NAME=ProxyGPT Online
APP_URL=http://localhost:5173

# Server
PORT=3000
NODE_ENV=development

# Payment Gateways (optional for development)
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Proxy Providers (optional)
PROXY_PROVIDER_URL=https://api.example.com
PROXY_PROVIDER_API_KEY=your_api_key
```

### 4. Start Development Server
```bash
npm run dev
```

Access at: `http://localhost:5173`

---

## 🐧 Linux/Ubuntu VPS Deployment

### Step 1: Connect to VPS via SSH
```bash
ssh root@your.vps.ip.address
# or if using custom SSH key:
ssh -i /path/to/key.pem ubuntu@your.vps.ip.address
```

### Step 2: Update System
```bash
apt update && apt upgrade -y
```

### Step 3: Install Node.js & npm
```bash
# Using NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs

# Verify installation
node --version
npm --version
```

### Step 4: Install PM2 Globally
```bash
npm install -g pm2
```

### Step 5: Clone Repository
```bash
cd /opt  # or preferred directory
git clone https://github.com/ahmad-ramzan/online-proxy.git
cd online-proxy
```

### Step 6: Install Dependencies
```bash
npm install
```

### Step 7: Create Production Environment File
```bash
cat > .env.production << 'EOF'
# App Settings
VITE_APP_NAME=ProxyGPT Online
APP_URL=https://yourdomain.com

# Server
PORT=3000
NODE_ENV=production

# Payment Gateways
STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
PAYPAL_CLIENT_ID=your_paypal_id
PAYPAL_SECRET=your_paypal_secret

# Proxy Providers
PROXY_PROVIDER_URL=https://api.proxy-seller.com
PROXY_PROVIDER_API_KEY=your_api_key
RESIDENTIAL_API_URL=https://api.proxy-seller.com/api/v1
RESIDENTIAL_API_KEY=your_residential_key

# LTESocks Mobile Proxy
LTESOCKS_API_KEY=Bearer your_ltesocks_token
LTESOCKS_BASE_URL=https://api.ltesocks.io/v2

# ZiniPay (Bangladesh)
ZINIPAY_API_KEY=your_zinipay_key
ZINIPAY_BASE_URL=https://api.zinipay.com
ZINIPAY_USD_TO_BDT=108.50

# Database
DATABASE_PATH=/opt/online-proxy/data/db.json
EOF
```

### Step 8: Build Application
```bash
npm run build
```

### Step 9: Start with PM2
```bash
# Start the application
pm2 start ecosystem.config.cjs

# Save PM2 startup config (auto-start on reboot)
pm2 startup
pm2 save

# View logs
pm2 logs proxygpt

# Monitor
pm2 monit
```

### Step 10: Setup Reverse Proxy (Nginx)

Install Nginx:
```bash
apt install -y nginx
```

Create config file:
```bash
cat > /etc/nginx/sites-available/proxygpt << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yourdomain.com;

    # SSL Certificate (use Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }
}
EOF
```

Enable site:
```bash
ln -s /etc/nginx/sites-available/proxygpt /etc/nginx/sites-enabled/
nginx -t  # Test config
systemctl restart nginx
```

### Step 11: Setup SSL with Let's Encrypt
```bash
apt install -y certbot python3-certbot-nginx
certbot certonly --nginx -d yourdomain.com
```

### Step 12: Verify Deployment
```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs proxygpt --lines 50

# Test endpoint
curl https://yourdomain.com/api/health
```

---

## 🪟 Windows VPS Deployment (PowerShell)

### Step 1: Connect via Remote Desktop
- Open Remote Desktop Connection
- Enter VPS IP address
- Login with credentials

### Step 2: Install Node.js
- Download from https://nodejs.org/ (LTS version)
- Run installer with default settings
- Verify in PowerShell:
```powershell
node --version
npm --version
```

### Step 3: Install PM2
```powershell
npm install -g pm2
```

### Step 4: Clone Repository
```powershell
cd C:\opt  # or preferred location
git clone https://github.com/ahmad-ramzan/online-proxy.git
cd online-proxy
```

### Step 5: Install Dependencies
```powershell
npm install
```

### Step 6: Create Production Environment File
```powershell
$env = @"
VITE_APP_NAME=ProxyGPT Online
APP_URL=https://yourdomain.com
PORT=3000
NODE_ENV=production
STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
DATABASE_PATH=C:\opt\online-proxy\data\db.json
"@

$env | Out-File -FilePath ".env.production" -Encoding UTF8
```

### Step 7: Build Application
```powershell
npm run build
```

### Step 8: Start with PM2
```powershell
# Start application
pm2 start ecosystem.config.cjs

# Setup Windows startup (Run as Administrator)
pm2 install pm2-windows-startup
pm2 save
```

### Step 9: Setup IIS Reverse Proxy

**Option A: Using IIS URL Rewrite (Recommended)**

1. Install IIS with URL Rewrite module
2. Create a new website pointing to `C:\opt\online-proxy\dist`
3. Create `web.config`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="ProxyRule" stopProcessing="true">
          <match url="^(.*)$" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="http://localhost:3000/{R:1}" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
```

**Option B: Using Nginx for Windows**

```powershell
# Download and extract Nginx
# Edit nginx.conf with proxy configuration (similar to Linux example)
# Run: nginx.exe
```

### Step 10: Configure SSL with Let's Encrypt
```powershell
# Install Certbot
choco install certbot

# Get certificate
certbot certonly --standalone -d yourdomain.com

# Import to Windows Certificate Store
# Bind to IIS website
```

---

## 📦 Database Setup

ProxyGPT uses JSON file-based database (auto-created):

```bash
# Data location
data/db.json

# Backup database
cp data/db.json data/db.json.backup

# Restore from backup
cp data/db.json.backup data/db.json
```

To migrate database:
```bash
# On old server
scp -r user@old-server:/opt/online-proxy/data /tmp/db-backup

# On new server
cp -r /tmp/db-backup/* /opt/online-proxy/data/
```

---

## 🔄 Updating Deployment

### Pull Latest Changes
```bash
cd /opt/online-proxy
git pull origin main
```

### Rebuild
```bash
npm install  # If dependencies changed
npm run build
```

### Restart Application
```bash
pm2 restart proxygpt
pm2 logs proxygpt  # View logs
```

### Check Deployment Branch
```bash
git branch -a
git checkout deploy  # Use deploy branch for stable version
```

---

## 🛡️ Production Checklist

- [ ] SSL certificate installed and auto-renewal configured
- [ ] Firewall rules configured (allow 80, 443)
- [ ] Database backups scheduled (daily)
- [ ] PM2 configured for auto-restart
- [ ] Nginx/IIS logs rotation configured
- [ ] Environment variables set securely (no `.env` in git)
- [ ] Admin account created and password changed
- [ ] Payment gateways configured and tested
- [ ] Domain DNS records configured
- [ ] Email notifications setup (for alerts)
- [ ] Monitoring/uptime checks enabled

---

## 📊 Monitoring Commands

### PM2 Monitoring
```bash
# Real-time monitoring
pm2 monit

# View process details
pm2 info proxygpt

# View logs with timestamps
pm2 logs proxygpt --timestamp

# Rotate logs
pm2 install pm2-logrotate
```

### System Monitoring (Linux)
```bash
# Check disk usage
df -h

# Check memory usage
free -h

# Check CPU usage
top

# View service status
systemctl status proxygpt
```

---

## 🚨 Troubleshooting

### Application won't start
```bash
# Check logs
pm2 logs proxygpt

# Verify port isn't in use
lsof -i :3000  # Linux
netstat -ano | findstr :3000  # Windows

# Check dependencies
npm install
npm run build
```

### Database connection issues
```bash
# Check database file exists
ls -la data/db.json

# Check permissions
chmod 644 data/db.json

# Clear database cache (restart app)
pm2 restart proxygpt
```

### SSL certificate expired
```bash
# Renew Let's Encrypt certificate
certbot renew --dry-run  # Test renewal
certbot renew  # Actual renewal

# Restart Nginx
nginx -s reload
```

### High memory usage
```bash
# Restart PM2
pm2 restart proxygpt

# Monitor memory
pm2 monit

# Check for memory leaks in logs
pm2 logs proxygpt
```

---

## 📞 Support

For issues or questions:
1. Check application logs: `pm2 logs proxygpt`
2. Review GitHub issues: https://github.com/ahmad-ramzan/online-proxy/issues
3. Contact support team

---

**Last Updated:** August 2026
**Version:** 1.0.0
