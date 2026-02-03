# Hướng dẫn Deploy Devenir lên Server Linux (Home Server)

> **Tài liệu này hướng dẫn chi tiết cách deploy dự án Devenir lên Server Linux tại gia (Home Server) và public ra Internet an toàn bằng Cloudflare Tunnel (không cần mở Port).**

---

## 📋 Yêu cầu trước khi bắt đầu

- ✅ Server Linux (Ubuntu/Linux Mint)
- ✅ Docker & Docker Compose đã cài đặt
- ✅ Tên miền riêng (Domain) đã trỏ DNS về Cloudflare
- ✅ Source code Devenir đã clone về

---

## 🚀 Các bước thực hiện

### **Bước 1: Setup Hostname cho Server** (Tùy chọn)

```bash
# Đổi hostname thành tên ngắn gọn (VD: hystudio-server)
sudo hostnamectl set-hostname hystudio-server

# Verify hostname mới
hostnamectl
```

---

### **Bước 2: Build & Start Docker Containers**

Lần đầu chạy cần build và start hệ thống core.

```bash
cd ~/Development/devenir

# Build và chạy ngầm (Detached mode)
docker compose up -d --build
```

Kiểm tra trạng thái containers:
```bash
docker compose ps
```
Đảm bảo tất cả services (server, client, admin, redis, qdrant...) đều `Up` hoặc `Healthy`.

---

### **Bước 3: Setup Cloudflare Tunnel (Public Internet)**

Đây là phương pháp an toàn nhất để public home server.

#### 3.1. Cài đặt `cloudflared`

```bash
# Thêm GPG key & Repo
sudo mkdir -p --mode=0755 /usr/share/keyrings
curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | sudo tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null
echo 'deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared noble main' | sudo tee /etc/apt/sources.list.d/cloudflared.list

# Cài đặt
sudo apt-get update && sudo apt-get install cloudflared -y
```
*(Lưu ý: `noble` là codename cho Ubuntu 24.04/Linux Mint 22. Nếu bản cũ hơn thay bằng `jammy` hoặc `focal`)*

#### 3.2. Authenticate & Create Tunnel

```bash
# Login (Copy link hiện ra -> Mở trên browser -> Chọn domain -> Authorize)
cloudflared tunnel login

# Tạo tunnel (đặt tên là devenir)
cloudflared tunnel create devenir
# -> Output sẽ cho Tunnel ID (Lưu lại ID này)
```

#### 3.3. Map Domains (DNS)

Trỏ các subdomains về Tunnel vừa tạo:

```bash
# Domain chính (Client)
cloudflared tunnel route dns devenir devenir.shop

# Admin
cloudflared tunnel route dns devenir admin.devenir.shop

# API
cloudflared tunnel route dns devenir api.devenir.shop

# N8N (Optional)
cloudflared tunnel route dns devenir n8n.devenir.shop

# WWW (Optional)
cloudflared tunnel route dns devenir www.devenir.shop
```

#### 3.4. Create Configuration File

Tạo cấu hình routing cho Tunnel tại `~/.cloudflared/config.yml`:

```yaml
tunnel: <TUNNEL_UUID>
credentials-file: /etc/cloudflared/<TUNNEL_UUID>.json

ingress:
  # Admin -> Container port 5174
  - hostname: admin.devenir.shop
    service: http://localhost:5174

  # API -> Container port 3111
  - hostname: api.devenir.shop
    service: http://localhost:3111

  # N8N -> Container port 5678
  - hostname: n8n.devenir.shop
    service: http://localhost:5678

  # Main Site -> Container port 5173
  - hostname: devenir.shop
    service: http://localhost:5173

  # WWW -> Container Client (5173)
  - hostname: www.devenir.shop
    service: http://localhost:5173

  # Bắt buộc: Catch-all rule
  - service: http_status:404
```

#### 3.5. Install System Service

Cài đặt để Tunnel tự chạy khi khởi động máy.

```bash
# Tạo thư mục config hệ thống
sudo mkdir -p /etc/cloudflared

# Copy config và credentials vào /etc/cloudflared/
sudo cp ~/.cloudflared/config.yml /etc/cloudflared/
sudo cp ~/.cloudflared/*.json /etc/cloudflared/

# Install & Start service
sudo cloudflared service install
sudo systemctl start cloudflared
sudo systemctl enable cloudflared
```

---

### **Bước 4: Cấu hình Production & Rebuild**

Sau khi có domain thật, cần update code để nhận diện domain (Fix CORS, API URL).

#### 4.1. Update Backend (CORS)
Sửa `server/server.js`, thêm domain mới vào `allowedOrigins`:
```javascript
const allowedOrigins = [
  // ...
  'https://devenir.shop',
  'https://www.devenir.shop',
  'https://admin.devenir.shop',
  'https://api.devenir.shop',
  // ...
];
```

#### 4.2. Update Client & Admin Env
Tạo file `.env.production` cho Client và Admin để trỏ về API domain thật (thay vì localhost).

**client/.env.production:**
```env
VITE_API_URL=https://api.devenir.shop/api
VITE_SOCKET_URL=https://api.devenir.shop
VITE_GOOGLE_CLIENT_ID=...
```

**admin/.env.production:**
```env
VITE_API_URL=https://api.devenir.shop/api
```

#### 4.3. Rebuild Containers
Force build lại để code mới và env mới có hiệu lực.

```bash
docker compose up -d --build
```

---

## 🔧 Quản lý Hệ thống

### Kiểm tra Logs
```bash
# Docker logs
docker compose logs -f server

# Cloudflare Tunnel logs
sudo systemctl status cloudflared
# Hoặc
sudo journalctl -u cloudflared -f
```

### Restart Services
```bash
docker compose restart
sudo systemctl restart cloudflared
```

---

## 🌐 Public URLs

Sau khi setup xong, hệ thống sẽ chạy tại:

- 🛍️ **Store:** https://devenir.shop
- ⚙️ **Admin:** https://admin.devenir.shop
- 🔌 **API:** https://api.devenir.shop
- 🤖 **N8N:** https://n8n.devenir.shop

---

## ⚠️ Lưu ý về Tailscale

Nếu trước đó dùng **Tailscale Funnel**, hãy tắt đi để tránh conflict:

```bash
sudo tailscale funnel reset
sudo tailscale serve reset
```
Vẫn nên giữ Tailscale chạy ngầm để có thể SSH vào server từ xa (qua IP `100.x.x.x`) khi cần bảo trì.

---
**Last Updated:** February 2026
**Author:** HyStudio Development Team