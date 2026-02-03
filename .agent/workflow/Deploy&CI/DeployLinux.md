# Hướng dẫn Deploy Devenir lên Server Linux

> **Tài liệu này hướng dẫn chi tiết cách deploy dự án Devenir lên Linux server và public ra Internet bằng Tailscale Funnel + Nginx**

---

## 📋 Yêu cầu trước khi bắt đầu

- ✅ Server Linux (Ubuntu/Linux Mint)
- ✅ Docker & Docker Compose đã cài đặt
- ✅ Tailscale account (miễn phí tại https://tailscale.com)
- ✅ Source code Devenir đã clone về

---

## 🚀 Các bước thực hiện

### **Bước 1: Setup Hostname cho Server**

```bash
# Đổi hostname thành tên ngắn gọn (VD: hystudio-server)
sudo hostnamectl set-hostname hystudio-server

# Verify hostname mới
hostnamectl
```

**Output mong đợi:**
```
Static hostname: hystudio-server
...
```

---

### **Bước 2: Cài đặt & Cấu hình Tailscale**

#### 2.1. Cài đặt Tailscale

```bash
# Download & install Tailscale
curl -fsSL https://tailscale.com/install.sh | sh
```

#### 2.2. Đăng nhập Tailscale

```bash
# Login Tailscale (sẽ mở browser để authenticate)
sudo tailscale up

# Verify kết nối
tailscale status
```

**Output mong đợi:**
```
100.x.x.x  hystudio-server  your-email@  linux  -
```

---

### **Bước 3: Build & Start Docker Containers**

#### 3.1. Build Docker images

```bash
cd ~/Development/devenir

# Build tất cả services
docker compose build
```

#### 3.2. Start containers

```bash
# Start tất cả services
docker compose up -d

# Verify containers đang chạy
docker compose ps
```

**Output mong đợi:**
```
NAME             STATUS          PORTS
devenir-admin    Up X minutes    0.0.0.0:5174->80/tcp
devenir-client   Up X minutes    0.0.0.0:5173->80/tcp
devenir-server   Up X minutes    0.0.0.0:3111->3111/tcp
devenir-clip     Up X minutes    0.0.0.0:8899->8899/tcp
devenir-qdrant   Up X minutes    0.0.0.0:6333-6334->6333-6334/tcp
devenir-redis    Up X minutes    0.0.0.0:6379->6379/tcp
```

#### 3.3. Test local services

```bash
# Test Client
curl -I http://localhost:5173

# Test Admin
curl -I http://localhost:5174

# Test API
curl -I http://localhost:3111
```

Tất cả phải trả về **HTTP/1.1 200 OK**

---

### **Bước 4: Cài đặt & Cấu hình Nginx**

#### 4.1. Cài đặt Nginx

```bash
# Install Nginx
sudo apt update
sudo apt install nginx -y

# Start Nginx
sudo systemctl start nginx

# Enable auto-start
sudo systemctl enable nginx
```

#### 4.2. Tạo Nginx configuration

```bash
# Tạo file config mới
sudo nano /etc/nginx/sites-available/hystudio-server
```

**Paste nội dung sau:**

```nginx
server {
    listen 80;
    server_name localhost;
    
    # Root - Client
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Admin - QUAN TRỌNG: trailing slash để strip path
    location /admin/ {
        proxy_pass http://localhost:5174/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Admin redirect (without trailing slash)
    location = /admin {
        return 301 /admin/;
    }
    
    # API
    location /api {
        proxy_pass http://localhost:3111;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # Socket.io
    location /socket.io {
        proxy_pass http://localhost:3111;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
    
    # N8N - QUAN TRỌNG: trailing slash để strip path
    location /n8n/ {
        proxy_pass http://localhost:5678/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        
        proxy_buffering off;
        proxy_cache off;
        chunked_transfer_encoding off;
        
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
    
    # N8N redirect (without trailing slash)
    location = /n8n {
        return 301 /n8n/;
    }
}
```

**Lưu file:** `Ctrl+O` → `Enter` → `Ctrl+X`

#### 4.3. Enable site & Reload Nginx

```bash
# Enable site (symlink)
sudo ln -sf /etc/nginx/sites-available/hystudio-server /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo nginx -s reload
```

**Output mong đợi:**
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

#### 4.4. Test Nginx proxy

```bash
# Test qua Nginx
curl -I http://localhost/
curl -I http://localhost/admin
curl -I http://localhost/api
```

---

### **Bước 5: Setup Tailscale Funnel (Public to Internet)**

#### 5.1. Reset Tailscale config (nếu đã setup trước đó)

```bash
# Tắt tất cả Funnel/Serve hiện tại
sudo tailscale serve reset
sudo tailscale funnel reset

# Verify đã tắt
sudo tailscale funnel status
```

**Output:** `No serve config`

#### 5.2. Enable Tailscale Funnel

```bash
# Enable Funnel trên port 80 (Nginx listen HTTP)
sudo tailscale funnel --bg 80

# Verify Funnel đang chạy
sudo tailscale funnel status
```

**Output mong đợi:**
```
# Funnel on:
#     - https://hystudio-server.tail86e288.ts.net

https://hystudio-server.tail86e288.ts.net (Funnel on)
|-- / proxy http://127.0.0.1:80
```

---

### **Bước 6: Testing & Verification**

#### 6.1. Test từ terminal

```bash
# Test Client
curl -I https://hystudio-server.tail86e288.ts.net/

# Test Admin
curl -I https://hystudio-server.tail86e288.ts.net/admin

# Test API
curl -I https://hystudio-server.tail86e288.ts.net/api

# Test N8N
curl -I https://hystudio-server.tail86e288.ts.net/n8n
```

**Tất cả phải trả về:** `HTTP/2 200`

#### 6.2. Test từ Browser

Mở browser và truy cập:

- 🌐 **Client:** https://hystudio-server.tail86e288.ts.net/
- 🎨 **Admin:** https://hystudio-server.tail86e288.ts.net/admin
- 🔌 **API:** https://hystudio-server.tail86e288.ts.net/api
- 🤖 **N8N:** https://hystudio-server.tail86e288.ts.net/n8n

---

## 🏗️ Kiến trúc Hệ thống

```
Internet (HTTPS - Public)
    ↓
Tailscale Funnel
  - SSL/TLS Termination
  - Domain: hystudio-server.tail86e288.ts.net
    ↓
Nginx (localhost:80 - HTTP)
  - Reverse Proxy
  - Path-based Routing
    ↓
Docker Containers
  ├─ Client (port 5173)
  ├─ Admin (port 5174)
  ├─ API Server (port 3111)
  ├─ N8N Workflow (port 5678)
  ├─ CLIP Service (port 8899)
  ├─ Qdrant Vector DB (port 6333)
  └─ Redis Cache (port 6379)
```

---

## 🔧 Quản lý Hệ thống

### Restart Services

```bash
# Restart Docker containers
docker compose restart

# Restart Nginx
sudo systemctl restart nginx

# Restart Tailscale
sudo systemctl restart tailscaled
```

### Stop Services

```bash
# Stop Docker containers
docker compose down

# Stop Nginx
sudo systemctl stop nginx

# Stop Tailscale Funnel
sudo tailscale funnel --https=443 off
```

### View Logs

```bash
# Docker logs
docker compose logs -f [service-name]
# VD: docker compose logs -f server

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Tailscale status
sudo tailscale status
```

---

## 🛠️ Troubleshooting

### Problem: ERR_CONNECTION_CLOSED

**Nguyên nhân:** Nginx hoặc Docker containers không chạy

**Giải pháp:**
```bash
# Check Docker containers
docker compose ps

# Check Nginx
sudo systemctl status nginx

# Restart services
docker compose restart
sudo systemctl restart nginx
```

### Problem: SSL Certificate Error

**Nguyên nhân:** Nginx listen port 443 với self-signed cert

**Giải pháp:** Nginx phải listen port 80 (HTTP), để Tailscale Funnel xử lý SSL

```bash
# Verify Nginx config
grep "listen" /etc/nginx/sites-available/hystudio-server

# Output phải là: listen 80;
# KHÔNG phải: listen 443 ssl;
```

### Problem: 502 Bad Gateway

**Nguyên nhân:** Nginx proxy tới sai port hoặc service chưa ready

**Giải pháp:**
```bash
# Test từng service local
curl -I http://localhost:5173  # Client
curl -I http://localhost:5174  # Admin
curl -I http://localhost:3111  # API

# Nếu fail, check Docker logs
docker compose logs [service-name]
```

### Problem: Tailscale hostname không update

**Nguyên nhân:** Chưa logout/login lại sau khi đổi hostname

**Giải pháp:**
```bash
# Logout Tailscale
sudo tailscale logout

# Login lại
sudo tailscale up

# Verify hostname mới
tailscale status
```

### Problem: Admin/N8N static files 404

**Nguyên nhân:** Nginx không strip path prefix khi proxy

**Giải pháp:** Phải dùng trailing slash trong cả `location` và `proxy_pass`

```nginx
# SAI - Không có trailing slash trong proxy_pass
location /admin/ {
    proxy_pass http://localhost:5174;  # Path sẽ không được strip
}

# ĐÚNG - Có trailing slash trong cả location và proxy_pass
location /admin/ {
    proxy_pass http://localhost:5174/;  # Path sẽ được strip
}

# Thêm redirect cho URL không có trailing slash
location = /admin {
    return 301 /admin/;
}
```

### Problem: N8N "Wrong username or password"

**Nguyên nhân:** Quên password hoặc chưa setup owner account

**Giải pháp - Reset password KHÔNG mất workflows:**

```bash
# 1. Tìm N8N container
docker ps | grep n8n
# Output: n8n-server-n8n-1 (hoặc tên khác)

# 2. Reset password (thay email và password)
docker exec n8n-server-n8n-1 n8n user-management:reset --email=your@email.com --password=NewPassword123

# 3. Restart N8N
docker restart n8n-server-n8n-1

# 4. Login lại với email/password mới
```

### Problem: Code thay đổi nhưng không apply

**Nguyên nhân:** Docker container đang chạy image cũ

**Giải pháp - Rebuild Docker image:**

```bash
# Option 1: Rebuild tất cả
docker compose up -d --build

# Option 2: Rebuild service cụ thể
docker compose build server
docker compose up -d server

# Option 3: Rebuild + force recreate
docker compose up -d --build --force-recreate server
```

### Problem: CORS blocked origin

**Nguyên nhân:** Domain mới chưa được thêm vào CORS whitelist

**Giải pháp:**

```bash
# 1. Sửa file server/server.js
# Thêm domain mới vào allowedOrigins:
'https://hystudio-server.tail86e288.ts.net',

# 2. Rebuild server
docker compose up -d --build server

# 3. Verify logs
docker compose logs -f server
```

---

## 📝 Notes

### URLs Public

- **Client (Main):** https://hystudio-server.tail86e288.ts.net/
- **Admin Panel:** https://hystudio-server.tail86e288.ts.net/admin/
- **API Backend:** https://hystudio-server.tail86e288.ts.net/api
- **N8N Workflow:** https://hystudio-server.tail86e288.ts.net/n8n/

**Lưu ý:** Admin và N8N cần trailing slash `/` ở cuối URL

### Ports Mapping

| Service | Internal Port | Exposed Port | Public Path |
|---------|---------------|--------------|-------------|
| Client | 5173 | 5173 | `/` |
| Admin | 5174 | 5174 | `/admin/` |
| API | 3111 | 3111 | `/api` |
| N8N | 5678 | 5678 | `/n8n/` |
| CLIP | 8899 | 8899 | - |
| Qdrant | 6333-6334 | 6333-6334 | - |
| Redis | 6379 | 6379 | - |

### Tailscale Funnel Limits (Free Plan)

- ✅ HTTPS only (auto SSL)
- ✅ Unlimited bandwidth
- ✅ No rate limiting
- ⚠️ Chỉ dùng cho development/testing
- ⚠️ Production cần custom domain hoặc VPS riêng

---

## 🔐 Security Considerations

### Current Setup (Development)

- ✅ HTTPS encryption (Tailscale Funnel)
- ✅ Tailnet authentication (chỉ người trong tailnet)
- ⚠️ Public internet accessible (sau khi enable Funnel)

### Recommended for Production

1. **Firewall:** Cấu hình UFW/iptables
2. **Rate Limiting:** Nginx rate limit cho API endpoints
3. **Environment Variables:** Không hardcode secrets
4. **CORS:** Config CORS cho API
5. **Custom Domain:** Dùng domain riêng thay vì `.ts.net`
6. **Monitoring:** Setup Prometheus + Grafana
7. **Backup:** Automated backup cho MongoDB + Qdrant

---

## 📚 Tham khảo

- [Tailscale Documentation](https://tailscale.com/kb)
- [Nginx Reverse Proxy Guide](https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)

---

**Last Updated:** February 2, 2026  
**Author:** HyStudio Development Team