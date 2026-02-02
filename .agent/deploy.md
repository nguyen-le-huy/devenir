# Devenir Full-Stack Self-Hosted Deployment Guide

Complete guide to deploy Client + Admin + Server on Linux VPS with Docker, Nginx, and Tailscale Funnel.

---

## 🎯 Overview

**Architecture:**
```
Internet
    ↓
GoDaddy Domain (devenir.shop)
    ↓
Tailscale Funnel (HTTPS)
    ↓
Nginx Reverse Proxy
    ↓
Docker Containers (Client + Admin + Server)
```

**Tech Stack:**
- Docker & Docker Compose
- Nginx (Reverse Proxy)
- Tailscale Funnel (Public HTTPS)
- GoDaddy DNS (Domain)

---

## 📋 Prerequisites Checklist

### On Linux Server:

- [ ] Ubuntu 20.04+ or Debian 11+
- [ ] Docker installed
- [ ] Docker Compose installed
- [ ] Nginx installed
- [ ] Tailscale installed and authenticated
- [ ] Git installed
- [ ] At least 2GB RAM
- [ ] At least 10GB disk space

### Required Access:

- [ ] SSH access to Linux server
- [ ] GoDaddy account with domain
- [ ] GitHub repository access
- [ ] MongoDB Atlas connection string
- [ ] API keys (OpenAI, Cloudinary, Pinecone, etc.)

---

## 🚀 PART 1: Install Required Tools

### Step 1.1: Update System

```bash
# Update package list
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y git curl wget nano htop
```

### Step 1.2: Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group (no sudo required)
sudo usermod -aG docker $USER

# Enable Docker service
sudo systemctl enable --now docker

# Verify installation
docker --version
```

### Step 1.3: Install Docker Compose

```bash
# Docker Compose v2 (plugin)
sudo apt install -y docker-compose-plugin

# Verify installation
docker compose version
```

### Step 1.4: Install Nginx

```bash
# Install Nginx
sudo apt install -y nginx

# Enable Nginx service
sudo systemctl enable nginx

# Start Nginx
sudo systemctl start nginx

# Verify
sudo systemctl status nginx
```

### Step 1.5: Install Tailscale

```bash
# Install Tailscale
curl -fsSL https://tailscale.com/install.sh | sh

# Enable service
sudo systemctl enable --now tailscaled

# Authenticate (opens browser)
sudo tailscale up

# Verify
tailscale status
```

**⚠️ IMPORTANT:** Logout and login again to apply docker group:
```bash
exit
# SSH back into the server
```

---

## 📦 PART 2: Clone Repository & Setup

### Step 2.1: Clone Project

```bash
# Navigate to home directory
cd ~

# Clone repository
git clone https://github.com/nguyen-le-huy/devenir.git

# Navigate to project
cd devenir
```

### Step 2.2: Create Environment Files

**Server `.env`:**
```bash
cd ~/devenir/server
nano .env
```

```env
# Node Environment
NODE_ENV=production
PORT=3111

# MongoDB
MONGO_URI=mongodb+srv://your-mongodb-atlas-uri

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRE=7d

# AI Services
OPENAI_API_KEY=sk-your-openai-key
PINECONE_API_KEY=your-pinecone-key
PINECONE_ENVIRONMENT=your-pinecone-env
PINECONE_INDEX=clothing-store

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-cloudinary-key
CLOUDINARY_API_SECRET=your-cloudinary-secret

# Payment Gateways
PAYOS_CLIENT_ID=your-payos-client-id
PAYOS_API_KEY=your-payos-api-key
PAYOS_CHECKSUM_KEY=your-payos-checksum-key

NOWPAYMENTS_API_KEY=your-nowpayments-key
NOWPAYMENTS_IPN_SECRET=your-nowpayments-ipn-secret

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# CORS (Update after getting Tailscale hostname)
CORS_ORIGINS=https://your-tailscale-hostname.ts.net,http://localhost:5173

# Qdrant (Optional)
QDRANT_URL=http://localhost:6333
DISABLE_QDRANT=false

# Redis (Optional)
REDIS_URL=redis://localhost:6379
DISABLE_REDIS=false
```

*Save: Ctrl+O, Enter, Ctrl+X*

**Client `.env.production`:**
```bash
cd ~/devenir/client
nano .env.production
```

```env
# API will be proxied by nginx
VITE_API_URL=/api
VITE_SOCKET_URL=

# Google OAuth
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

*Save: Ctrl+O, Enter, Ctrl+X*

**Admin `.env.production`:**
```bash
cd ~/devenir/admin
nano .env.production
```

```env
# API will be proxied by nginx
VITE_API_URL=/api
```

*Save: Ctrl+O, Enter, Ctrl+X*

---

## 🐳 PART 3: Build & Start Docker Containers

### Step 3.1: Verify Docker Compose File

```bash
cd ~/devenir

# View docker-compose.yml
cat docker-compose.yml
```

Should see services: `server`, `client`, `admin`

### Step 3.2: Build Docker Images

```bash
cd ~/devenir

# Build all images (takes 5-10 minutes)
docker compose build --no-cache

# Verify images
docker images | grep devenir
```

### Step 3.3: Start Containers

```bash
# Start all containers in detached mode
docker compose up -d

# Check status
docker compose ps

# Should see 3 containers: devenir-server, devenir-client, devenir-admin
```

### Step 3.4: Verify Containers

```bash
# Check logs
docker compose logs -f

# Test server health (in another terminal)
curl http://localhost:3111

# Test client (should see HTML)
curl http://localhost:5173

# Test admin
curl http://localhost:5174
```

**Expected Output:**
- Server: API response or HTML
- Client: HTML with React app
- Admin: HTML with admin app

---

## 🌐 PART 4: Configure Nginx Reverse Proxy

### Step 4.1: Get Tailscale Hostname

```bash
# Get your Tailscale hostname
tailscale status | grep $(hostname)

# Example output: nguyenlehuy-vivobook.tail86e288.ts.net
# Save this hostname for later
```

### Step 4.2: Create Nginx Config

```bash
sudo nano /etc/nginx/sites-available/devenir
```

**Replace `YOUR_TAILSCALE_HOSTNAME` with your actual hostname:**

```nginx
# Main server block for Client (Public)
server {
    listen 8080;
    server_name YOUR_TAILSCALE_HOSTNAME.ts.net;

    # Client - Serve static React app
    location / {
        proxy_pass http://127.0.0.1:5173;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API - Proxy to server
    location /api {
        proxy_pass http://127.0.0.1:3111;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Socket.IO - WebSocket support
    location /socket.io {
        proxy_pass http://127.0.0.1:3111;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}

# Admin server block (Separate port)
server {
    listen 8081;
    server_name YOUR_TAILSCALE_HOSTNAME.ts.net;

    # Admin - Serve static React app
    location / {
        proxy_pass http://127.0.0.1:5174;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API - Proxy to server
    location /api {
        proxy_pass http://127.0.0.1:3111;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

*Save: Ctrl+O, Enter, Ctrl+X*

### Step 4.3: Enable Site

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/devenir /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Should see: "syntax is ok" and "test is successful"
```

### Step 4.4: Update nginx.conf for Long Hostnames

```bash
sudo nano /etc/nginx/nginx.conf
```

Add this line inside `http { ... }` block:

```nginx
http {
    server_names_hash_bucket_size 128;
    
    # ... rest of config
}
```

*Save: Ctrl+O, Enter, Ctrl+X*

### Step 4.5: Restart Nginx

```bash
# Reload Nginx
sudo systemctl reload nginx

# Check status
sudo systemctl status nginx

# Verify nginx is listening
sudo netstat -tlnp | grep nginx
# Should see ports 8080 and 8081
```

---

## 🔒 PART 5: Setup Tailscale Funnel (Public HTTPS)

### Step 5.1: Stop Old Funnel (if exists)

```bash
sudo tailscale funnel off
```

### Step 5.2: Enable Funnel for Client (Port 443)

```bash
# Start funnel: HTTPS (443) -> HTTP (8080)
sudo tailscale funnel --bg --https=443 http://127.0.0.1:8080

# Verify
tailscale funnel status
```

**Expected Output:**
```
https://YOUR_TAILSCALE_HOSTNAME.ts.net (Funnel on)
    |-- / proxy http://127.0.0.1:8080
```

### Step 5.3: Enable Funnel for Admin (Port 8443)

```bash
# Start funnel for admin: HTTPS (8443) -> HTTP (8081)
sudo tailscale funnel --bg --https=8443 http://127.0.0.1:8081

# Verify
tailscale funnel status
```

**Expected Output:**
```
https://YOUR_TAILSCALE_HOSTNAME.ts.net (Funnel on)
    |-- / proxy http://127.0.0.1:8080

https://YOUR_TAILSCALE_HOSTNAME.ts.net:8443 (Funnel on)
    |-- / proxy http://127.0.0.1:8081
```

### Step 5.4: Test Public URLs

**From your Mac/Phone:**

```bash
# Test client
curl https://YOUR_TAILSCALE_HOSTNAME.ts.net

# Test admin
curl https://YOUR_TAILSCALE_HOSTNAME.ts.net:8443

# Or open in browser:
# https://YOUR_TAILSCALE_HOSTNAME.ts.net
# https://YOUR_TAILSCALE_HOSTNAME.ts.net:8443
```

---

## 🌍 PART 6: Configure GoDaddy Domain

### Step 6.1: Get Tailscale Hostname

From previous step, you have:
```
YOUR_TAILSCALE_HOSTNAME.ts.net
```

Example: `nguyenlehuy-vivobook.tail86e288.ts.net`

### Step 6.2: Login to GoDaddy

1. Go to https://dcc.godaddy.com/
2. Login with your account
3. Navigate to **My Products**
4. Click **DNS** next to your domain

### Step 6.3: Add CNAME Records

**For Client (Main Site):**

```
Type: CNAME
Name: @
Value: YOUR_TAILSCALE_HOSTNAME.ts.net
TTL: 600 (10 minutes)
```

**For Admin (Subdomain):**

```
Type: CNAME
Name: admin
Value: YOUR_TAILSCALE_HOSTNAME.ts.net
TTL: 600 (10 minutes)
```

**Optional - www subdomain:**

```
Type: CNAME
Name: www
Value: YOUR_TAILSCALE_HOSTNAME.ts.net
TTL: 600 (10 minutes)
```

### Step 6.4: Wait for DNS Propagation

```bash
# Check DNS propagation (takes 5-30 minutes)
nslookup devenir.shop

# Or use online tool:
# https://dnschecker.org
```

### Step 6.5: Update Server CORS

```bash
cd ~/devenir/server
nano .env
```

Update `CORS_ORIGINS`:

```env
CORS_ORIGINS=https://devenir.shop,https://www.devenir.shop,https://admin.devenir.shop,https://YOUR_TAILSCALE_HOSTNAME.ts.net
```

*Save and restart server:*

```bash
docker compose restart server
```

---

## ✅ PART 7: Testing & Verification

### Step 7.1: Test Local Services

```bash
# Test server
curl http://localhost:3111

# Test client
curl http://localhost:5173

# Test admin
curl http://localhost:5174

# Check Docker containers
docker compose ps
# All should be "Up (healthy)"
```

### Step 7.2: Test via Tailscale URLs

```bash
# Client
curl https://YOUR_TAILSCALE_HOSTNAME.ts.net

# Admin (note port 8443)
curl https://YOUR_TAILSCALE_HOSTNAME.ts.net:8443

# API
curl https://YOUR_TAILSCALE_HOSTNAME.ts.net/api/categories
```

### Step 7.3: Test via Domain (After DNS Propagation)

**Open in Browser:**

- Client: `https://devenir.shop`
- Admin: `https://admin.devenir.shop:8443`
- API: `https://devenir.shop/api/categories`

**Expected:**
- ✅ Client loads with products
- ✅ Admin login page appears
- ✅ API returns JSON data
- ✅ Socket.IO connects (check browser console)
- ✅ No CORS errors

---

## 🔧 PART 8: Troubleshooting

### Issue: Docker containers not starting

```bash
# Check logs
docker compose logs -f

# Check if ports are available
sudo netstat -tlnp | grep -E '3111|5173|5174'

# Rebuild containers
docker compose down
docker compose up --build -d
```

### Issue: Nginx 502 Bad Gateway

```bash
# Check nginx error logs
sudo tail -f /var/log/nginx/error.log

# Verify upstream services are running
curl http://localhost:5173
curl http://localhost:3111

# Restart nginx
sudo systemctl restart nginx
```

### Issue: Tailscale Funnel not working

```bash
# Check funnel status
tailscale funnel status

# Restart funnel
sudo tailscale funnel off
sudo tailscale funnel --bg --https=443 http://127.0.0.1:8080
sudo tailscale funnel --bg --https=8443 http://127.0.0.1:8081
```

### Issue: CORS errors

```bash
# Update CORS_ORIGINS in server/.env
nano ~/devenir/server/.env

# Add all your domains
CORS_ORIGINS=https://devenir.shop,https://admin.devenir.shop,https://YOUR_TAILSCALE_HOSTNAME.ts.net

# Restart server
docker compose restart server
```

### Issue: DNS not resolving

```bash
# Check DNS propagation
nslookup devenir.shop
dig devenir.shop

# Wait 30 minutes for propagation
# Check on: https://dnschecker.org
```

---

## 🔄 PART 9: Maintenance & Updates

### Update Code

```bash
cd ~/devenir

# Pull latest code
git pull origin main

# Rebuild and restart
docker compose down
docker compose up --build -d

# Check logs
docker compose logs -f
```

### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f server
docker compose logs -f client
docker compose logs -f admin

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Restart Services

```bash
# Restart all containers
docker compose restart

# Restart specific container
docker compose restart server

# Restart nginx
sudo systemctl restart nginx
```

### Monitor Resources

```bash
# Docker stats
docker stats

# System resources
htop

# Disk usage
df -h
```

### Backup

```bash
# Backup Docker volumes
docker run --rm -v devenir_uploads:/data -v $(pwd):/backup ubuntu tar czf /backup/uploads-backup.tar.gz /data

# Backup environment files
tar czf env-backup.tar.gz server/.env client/.env.production admin/.env.production
```

---

## 📊 PART 10: Post-Deployment Checklist

- [ ] All Docker containers running (`docker compose ps`)
- [ ] Nginx status active (`sudo systemctl status nginx`)
- [ ] Tailscale Funnel active (`tailscale funnel status`)
- [ ] Client accessible: `https://devenir.shop`
- [ ] Admin accessible: `https://admin.devenir.shop:8443`
- [ ] API responding: `https://devenir.shop/api/categories`
- [ ] Socket.IO connected (check browser console)
- [ ] No CORS errors
- [ ] Images loading from Cloudinary
- [ ] Google OAuth working
- [ ] Payment gateways configured
- [ ] Database connected (MongoDB Atlas)

---

## 🎯 Access URLs

After successful deployment:

| Service | URL | Purpose |
|---------|-----|---------|
| **Client** | https://devenir.shop | Public website |
| **Admin** | https://admin.devenir.shop:8443 | Admin dashboard |
| **API** | https://devenir.shop/api | Backend API |
| **Tailscale Client** | https://YOUR_TAILSCALE_HOSTNAME.ts.net | Alternative URL |
| **Tailscale Admin** | https://YOUR_TAILSCALE_HOSTNAME.ts.net:8443 | Alternative admin URL |

---

## 🚨 Common Commands Reference

```bash
# Check everything
docker compose ps && sudo systemctl status nginx && tailscale funnel status

# Restart everything
docker compose restart && sudo systemctl restart nginx

# View all logs
docker compose logs -f

# Update and restart
git pull && docker compose up --build -d

# Stop everything
docker compose down && sudo tailscale funnel off
```

---

## 📝 Notes

- **Port 443**: Client (HTTPS, public)
- **Port 8443**: Admin (HTTPS, requires :8443 in URL)
- **Port 8080**: Nginx proxy for client (internal)
- **Port 8081**: Nginx proxy for admin (internal)
- **Port 3111**: Server API (internal)
- **Port 5173**: Client nginx (internal)
- **Port 5174**: Admin nginx (internal)

---

## ✅ Success Indicators

Your deployment is successful when:

1. ✅ You can access `https://devenir.shop` from any device
2. ✅ Products load without errors
3. ✅ Cart functionality works
4. ✅ Checkout flow completes
5. ✅ Admin login works at `https://admin.devenir.shop:8443`
6. ✅ No console errors (F12)
7. ✅ Images load from Cloudinary
8. ✅ API calls succeed

---

**Deployment Complete! 🎉**

Your full-stack application is now self-hosted and publicly accessible via your custom domain!
