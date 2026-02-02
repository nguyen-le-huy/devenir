Dưới đây là nội dung từ file PDF đã được chuyển đổi sang định dạng Markdown để bạn dễ dàng sao chép và sử dụng. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/85133415/9f1b6c0e-10b4-4ce7-b5e4-d2285872f347/TONG_HOP_FULL_LENH__SETUP_DEVENIR__N8N_CHAY_24.pdf)

# TỔNG HỢP FULL LỆNH: SETUP DEVENIR + N8N CHẠY 24/7 & PUBLIC

Dưới đây là toàn bộ lệnh từ đầu đến cuối để thiết lập hệ thống **1 MERN app (devenir) + n8n** chạy 24/7 và public ra internet qua Tailscale Funnel.

## PHẦN 1: CÀI ĐẶT CÔNG CỤ CƠ BẢN

```bash
# Cập nhật Ubuntu
sudo apt update && sudo apt upgrade -y

# Cài Node.js & npm
sudo apt install -y nodejs npm

# Cài PM2
sudo npm install -g pm2

# Cài Docker & Docker Compose
sudo apt install -y docker.io
sudo systemctl enable --now docker
sudo apt install -y docker-compose-plugin

# Thêm user vào group docker
sudo usermod -aG docker $USER

# Cài Nginx
sudo apt install -y nginx

# Cài Tailscale (nếu chưa có)
curl -fsSL https://tailscale.com/install.sh | sh
sudo systemctl enable --now tailscaled

# Logout và login lại để áp dụng docker group
exit
# SSH lại vào máy Linux
```

## PHẦN 2: SETUP PM2 CHO DEVENIR

### Bước 2.1: Chuẩn bị project devenir

```bash
# Kiểm tra path project
ls -la ~/projects/devenir/server.js
# Hoặc path nào bạn đang dùng
```

Đảm bảo file `server.js` có đọc PORT từ environment:

```javascript
const port = process.env.PORT || 3111;
app.listen(port, '0.0.0.0', () => {
    console.log(`Devenir server listening on port ${port}`);
});
```

### Bước 2.2: Dọn dẹp PM2 cũ (nếu có)

```bash
# Xóa tất cả apps cũ
pm2 delete all

# Kiểm tra đã sạch
pm2 list
```

### Bước 2.3: Tạo file PM2 ecosystem config

```bash
# Tạo thư mục
mkdir -p ~/server

# Tạo file config
nano ~/server/ecosystem.config.js
```

**Nội dung file `ecosystem.config.js`:**

```javascript
module.exports = {
  apps: [
    {
      name: 'devenir-server',
      script: 'server.js',
      cwd: '/home/nguyenlehuy/projects/devenir', // ▲ Thay path này nếu khác
      env: {
        PORT: 3111,
        NODE_ENV: 'production'
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M'
    }
  ]
};
```
*Lưu: Ctrl+O, Enter, Ctrl+X*

### Bước 2.4: Khởi động PM2

```bash
# Chuyển đến thư mục config
cd ~/server

# Khởi động app
pm2 start ecosystem.config.js

# Kiểm tra
pm2 list
# Phải thấy "devenir-server" status "online"

# Xem logs
pm2 logs devenir-server --lines 50
```

### Bước 2.5: Setup auto-start

```bash
# Tạo startup script
pm2 startup systemd
# ▲ Copy và chạy lệnh mà PM2 in ra (dạng: sudo env PATH=...)

# Sau đó lưu danh sách apps
pm2 save
```

## PHẦN 3: SETUP N8N VỚI DOCKER

### Bước 3.1: Tạo docker-compose.yml

```bash
# Tạo thư mục
mkdir -p ~/n8n-server
cd ~/n8n-server

# Tạo file
nano docker-compose.yml
```

**Nội dung file `docker-compose.yml`:**

```yaml
version: '3.8'

services:
  n8n:
    image: n8nio/n8n:latest
    restart: unless-stopped
    ports:
      - "5678:5678"
    environment:
      - TZ=Asia/Ho_Chi_Minh
      - N8N_PORT=5678
      - N8N_PROTOCOL=https
      - N8N_HOST=nguyenlehuy-vivobook-asuslaptop-x512fa-a512fa.tail86e288.ts.net
      - N8N_PATH=/n8n/
      - WEBHOOK_URL=https://nguyenlehuy-vivobook-asuslaptop-x512fa-a512fa.tail86e288.ts.net/n8n/
      - N8N_PROXY_HOPS=1
    volumes:
      - n8n_data:/home/node/.n8n
    user: "1000:1000"

volumes:
  n8n_data:
```
*Lưu: Ctrl+O, Enter, Ctrl+X*

### Bước 3.2: Khởi động n8n

```bash
cd ~/n8n-server
docker compose up -d

# Kiểm tra
docker compose ps
# Phải thấy n8n status "Up"

# Xem logs
docker compose logs -f n8n
# Nhấn Ctrl+C để thoát
```

### Bước 3.3: Test local

```bash
curl http://localhost:5678
curl http://localhost:3111

# Kiểm tra ports
ss -tlnp | grep -E '3111|5678'
```

## PHẦN 4: SETUP NGINX REVERSE PROXY

### Bước 4.1: Tạo file nginx config

```bash
sudo nano /etc/nginx/nginx.conf
```

**Thêm dòng này vào khối `http { ... }`:**

```nginx
http {
    server_names_hash_bucket_size 128;
    # ... các dòng khác
}
```
*Lưu: Ctrl+O, Enter, Ctrl+X*

### Bước 4.2: Tạo file site config

```bash
sudo nano /etc/nginx/sites-available/devenir-n8n
```

**Nội dung file:**

```nginx
# Server block cho Tailscale Funnel (HTTP trên port 8080)
server {
    listen 8080;
    server_name nguyenlehuy-vivobook-asuslaptop-x512fa-a512fa.tail86e288.ts.net;

    # Devenir MERN app
    location /devenir/ {
        proxy_pass http://127.0.0.1:3111/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # n8n
    location /n8n/ {
        proxy_pass http://127.0.0.1:5678/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Root
    location / {
        return 200 "Devenir Server is running!\n\nAccess:\n- Devenir: /devenir/\n- n8n: /n8n/";
        add_header Content-Type text/plain;
    }
}

# Server block HTTPS cho local testing (tùy chọn)
server {
    listen 443 ssl;
    server_name nguyenlehuy-vivobook-asuslaptop-x512fa-a512fa.tail86e288.ts.net;

    ssl_certificate /etc/ssl/certs/ssl-cert-snakeoil.pem;
    ssl_certificate_key /etc/ssl/private/ssl-cert-snakeoil.key;
    
    location /devenir/ {
        proxy_pass http://127.0.0.1:3111/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /n8n/ {
        proxy_pass http://127.0.0.1:5678/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    location / {
        return 200 "Devenir Server is running!\n\nAccess:\n- Devenir: /devenir/\n- n8n: /n8n/";
        add_header Content-Type text/plain;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name nguyenlehuy-vivobook-asuslaptop-x512fa-a512fa.tail86e288.ts.net;
    return 301 https://$host$request_uri;
}
```
*Lưu: Ctrl+O, Enter, Ctrl+X*

### Bước 4.3: Enable và reload Nginx

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/devenir-n8n /etc/nginx/sites-enabled/

# Xóa default site
sudo rm /etc/nginx/sites-enabled/default

# Test config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx

# Enable auto-start
sudo systemctl enable nginx
```

### Bước 4.4: Test local

```bash
# Test HTTP port 8080
curl http://localhost:8080/n8n/
curl http://localhost:8080/devenir/

# Test HTTPS port 443
curl -k https://localhost/n8n/
curl -k https://localhost/devenir/
```

## PHẦN 5: PUBLIC RA INTERNET VỚI TAILSCALE FUNNEL

### Bước 5.1: Tắt funnel cũ (nếu có)

```bash
sudo tailscale funnel off
```

### Bước 5.2: Bật Tailscale Funnel

```bash
# Bật funnel: HTTPS từ internet, forward HTTP tới localhost:8080
sudo tailscale funnel --bg --https=443 http://127.0.0.1:8080

# Kiểm tra
tailscale funnel status
```

### Bước 5.3: Test từ Mac/điện thoại

Mở browser:
*   `https://nguyenlehuy-vivobook-asuslaptop-x512fa-a512fa.tail86e288.ts.net/n8n/`
*   `https://nguyenlehuy-vivobook-asuslaptop-x512fa-a512fa.tail86e288.ts.net/devenir/`

## PHẦN 6: KIỂM TRA TOÀN BỘ HỆ THỐNG

```bash
# Kiểm tra tất cả services
pm2 list                        # devenir-server: online
docker compose ps               # n8n: Up
sudo systemctl status nginx     # nginx: active
tailscale funnel status         # funnel: active

# Kiểm tra ports
ss -tlnp | grep -E '3111|5678|8080|443'
```

## PHẦN 7: TEST SAU REBOOT

```bash
# Reboot máy
sudo reboot

# Đợi 2 phút, SSH lại

# Kiểm tra lại tất cả
pm2 list
docker compose ps
sudo systemctl status nginx
tailscale funnel status

# Nếu funnel không tự động bật, chạy lại:
sudo tailscale funnel --bg --https=443 http://127.0.0.1:8080
```

## LỆNH QUẢN LÝ HỮU ÍCH

**Xem logs**

```bash
# PM2
pm2 logs devenir-server

# Docker
cd ~/n8n-server
docker compose logs -f n8n

# Nginx
sudo journalctl -u nginx -f
```

**Restart services**

```bash
# Restart devenir
pm2 restart devenir-server

# Restart n8n
cd ~/n8n-server
docker compose restart

# Restart nginx
sudo systemctl restart nginx

# Restart funnel
sudo tailscale funnel off
sudo tailscale funnel --bg --https=443 http://127.0.0.1:8080
```

**Stop services**

```bash
# Stop PM2
pm2 stop all

# Stop n8n
cd ~/n8n-server
docker compose down

# Stop nginx
sudo systemctl stop nginx

# Stop funnel
sudo tailscale funnel off
```

## CHECKLIST HOÀN THÀNH

*   [x] PM2 chạy devenir-server (port 3111)
*   [x] Docker chạy n8n (port 5678)
*   [x] Nginx listen HTTP port 8080 (cho Funnel)
*   [x] Nginx listen HTTPS port 443 (cho local)
*   [x] Tailscale Funnel public ra internet
*   [x] Test local thành công
*   [x] Test public thành công
*   [x] Test sau reboot thành công

Hoàn thành! Hệ thống của bạn giờ đây chạy 24/7, tự động khởi động sau reboot, và public an toàn ra internet qua Tailscale Funnel!