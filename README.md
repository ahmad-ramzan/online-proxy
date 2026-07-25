# ProxyGPT Online

Premium proxy-selling platform — React + Vite frontend, Express API, and a
Proxy-Seller Residential API integration. Data is stored in a simple JSON file,
so there is no external database to set up.

## Tech stack
- **Frontend:** React 19 + Vite + Tailwind CSS v4
- **Backend:** Express (same Node process serves the API and the built frontend)
- **Storage:** JSON file at `data/db.json`
- **Proxy provider:** [Proxy-Seller Residential API](https://docs.proxy-seller.com/api-v1/residential-proxy)

## Run locally

**Prerequisite:** Node.js 18+

```bash
npm install
npm run dev
```

Open http://localhost:3000

Default logins:
- **Admin:** `admin@proxygpt.online` / `admin123`
- **Demo user:** `demo@proxygpt.online` / `demo123`

Configure the Proxy-Seller key in **Admin → Settings → Proxy-Seller Residential API**
(leave blank to run in demo mode).

---

## Deploy on an Ubuntu VPS

### 1. Install Node.js 20 (once)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v
```

### 2. Get the code and build
```bash
git clone <your-repo-url> proxygpt && cd proxygpt   # or scp/rsync the folder up
cp .env.example .env                                 # optional, edit if needed
npm ci
npm run build          # builds the frontend + bundles the server into dist/
```

`npm run build` produces everything under `dist/` (static frontend + `dist/server.cjs`).

### 3. Run it with PM2 (keeps it alive + restarts on reboot)
```bash
sudo npm i -g pm2
pm2 start npm --name proxygpt -- start   # runs `npm start` = node dist/server.cjs on :3000
pm2 save
pm2 startup            # follow the printed command to enable boot startup
```

Check it: `curl http://localhost:3000/api/health`

> **Alternative to PM2 — systemd:** create `/etc/systemd/system/proxygpt.service`:
> ```ini
> [Unit]
> Description=ProxyGPT Online
> After=network.target
>
> [Service]
> WorkingDirectory=/home/YOUR_USER/proxygpt
> ExecStart=/usr/bin/npm start
> Restart=always
> Environment=NODE_ENV=production
> User=YOUR_USER
>
> [Install]
> WantedBy=multi-user.target
> ```
> Then: `sudo systemctl enable --now proxygpt`

### 4. Put nginx in front (port 80/443 → 3000)
```bash
sudo apt-get install -y nginx
```
Create `/etc/nginx/sites-available/proxygpt`:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $http_host;   # $http_host keeps the port (needed for payment redirect URLs)
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
Enable + reload:
```bash
sudo ln -s /etc/nginx/sites-available/proxygpt /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo ufw allow 'Nginx Full'   # if the firewall is on
```

### 5. HTTPS (optional but recommended)
```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### Updating after code changes
```bash
git pull
npm ci
npm run build
pm2 restart proxygpt      # or: sudo systemctl restart proxygpt
```

---

## Important: Proxy-Seller IP whitelist
The Proxy-Seller API only accepts requests from **whitelisted IP addresses**
(up to 3, max 60 requests/min). Add your **VPS public IP** in the Proxy-Seller
API panel, otherwise live calls return `IP not allowed` and the app falls back to
demo data. Find the VPS IP with `curl ifconfig.me`.

## Notes
- The JSON database lives at `data/db.json`. Back it up to keep users/orders.
  Set `DB_DIR` to store it outside the project dir (e.g. `/var/lib/proxygpt`).
- Provider/payment keys are configured at runtime in the Admin panel, not via env.
