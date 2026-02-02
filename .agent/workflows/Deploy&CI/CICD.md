# TỔNG HỢP FULL LỆNH SETUP CI/CD TỪ ĐẦU

## PHẦN 1: CÀI ĐẶT NODE.JS 20

```bash
# Xóa Node.js cũ (nếu có)
sudo apt remove -y nodejs npm

# Cài NodeSource repo cho Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Cài Node.js 20
sudo apt install -y nodejs

# Verify version
node -v # Phải v20.x.x
npm -v
```

## PHẦN 2: TẠO RUNNER TRÊN GITHUB

### Bước 2.1: Tạo runner token trên GitHub
1. Mở GitHub repository: `https://github.com/yourusername/your-repo`
2. Click tab **"Settings"**
3. Sidebar trái: **"Actions"** -> **"Runners"**
4. Click **"New self-hosted runner"**
5. Chọn:
   - OS: **Linux**
   - Architecture: **x64**
6. **Giữ trang này mở** (có token và lệnh cần copy)

## PHẦN 3: CÀI GITHUB ACTIONS RUNNER TRÊN LINUX

### Bước 3.1: Download và cài runner

```bash
# Tạo thư mục
mkdir -p ~/github-runners/your-repo-name
cd ~/github-runners/your-repo-name

# Download runner (copy lệnh từ GitHub, ví dụ:)
curl -o actions-runner-linux-x64-2.329.0.tar.gz -L \
https://github.com/actions/runner/releases/download/v2.329.0/actions-runner-linux-x64-2.329.0.tar.gz

# Giải nén
tar xzf ./actions-runner-linux-x64-2.329.0.tar.gz
```

### Bước 3.2: Cấu hình runner

```bash
# Chạy config (copy lệnh + token từ GitHub)
./config.sh --url https://github.com/yourusername/your-repo --token YOUR_GITHUB_TOKEN

# Khi hỏi:
# Runner name: [Enter hoặc đặt tên]
# Runner group: [Enter]
# Labels: [Enter]
# Work folder: [Enter]
```

### Bước 3.3: Cài runner như systemd service

```bash
cd ~/github-runners/your-repo-name

# Cài service
sudo ./svc.sh install

# Start service
sudo ./svc.sh start

# Kiểm tra
sudo ./svc.sh status
```

### Bước 3.4: Verify runner online
- Quay lại GitHub -> Settings -> Actions -> Runners
- Thấy runner status **"Idle"** (màu xanh) ✅

## PHẦN 4: TẠO WORKFLOW FILE

### Bước 4.1: Tạo thư mục workflow

```bash
cd /path/to/your-project

# Tạo thư mục
mkdir -p .github/workflows
```

### Bước 4.2: Tạo file workflow

```bash
nano .github/workflows/deploy.yml
```

**Nội dung file (ví dụ cho MERN monorepo):**

```yaml
name: Deploy App

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  deploy-backend:
    runs-on: self-hosted
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Check Node version
        run: |
          echo "=== Node & NPM Versions ==="
          node -v
          npm -v

      - name: Install server dependencies
        run: |
          cd server
          npm ci

      - name: Run server tests
        run: |
          cd server
          npm test || echo "No tests found"
        continue-on-error: true

      - name: Restart backend with PM2
        run: |
          cd server
          pm2 restart your-app-name || pm2 start server.js --name your-app-name
          pm2 save

  deploy-frontend:
    runs-on: self-hosted
    needs: deploy-backend
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Check Node version
        run: |
          echo "=== Node & NPM Versions ==="
          node -v
          npm -v

      - name: Install client dependencies
        run: |
          cd client
          npm ci

      - name: Build React app
        run: |
          cd client
          npm run build
        env:
          NODE_ENV: production

      - name: Verify build output
        run: |
          ls -la client/dist/ || ls -la client/build/
          echo "✅ Build completed successfully!"

  notify:
    runs-on: self-hosted
    needs: [deploy-backend, deploy-frontend]
    if: always()
    steps:
      - name: Deployment status
        run: |
          if [ "${{ needs.deploy-frontend.result }}" == "success" ]; then
            echo "✅ Deployment successful!"
          else
            echo "❌ Deployment failed!"
            exit 1
          fi
```
*(Lưu: Ctrl+O, Enter, Ctrl+X)*

### Bước 4.3: Commit và push workflow

```bash
git add .github/workflows/deploy.yml
git commit -m "Add GitHub Actions CI/CD pipeline"
git push origin main
```

## PHẦN 5: KIỂM TRA WORKFLOW

### Bước 5.1: Xem workflow chạy trên GitHub
1. Mở GitHub repository
2. Tab **"Actions"**
3. Thấy workflow **"Deploy App"** đang chạy
4. Click vào để xem logs real-time

### Bước 5.2: Xem logs runner trên Linux

```bash
cd ~/github-runners/your-repo-name
tail -f _diag/Runner_*.log
```

### Bước 5.3: Kiểm tra PM2

```bash
# Xem danh sách apps
pm2 list

# Xem logs
pm2 logs your-app-name
```

## PHẦN 6: XỬ LÝ VẤN ĐỀ THƯỜNG GẶP

### Vấn đề 1: Workflow vẫn dùng Node cũ

```bash
cd ~/github-runners/your-repo-name

# Stop runner
sudo ./svc.sh stop

# Xóa cache Node cũ
rm -rf _work/_tool/node
rm -rf _work/_temp

# Start lại
sudo ./svc.sh start
```

### Vấn đề 2: Thiếu quyền sudo trong workflow

```bash
# Thêm passwordless sudo
sudo visudo
```
Thêm dòng này vào cuối file:
```text
your-username ALL=(ALL) NOPASSWD: /usr/bin/nginx, /usr/bin/systemctl, /usr/bin/cp, /usr/bin/pm2
```

### Vấn đề 3: PM2 không tìm thấy app

```bash
# Kiểm tra PM2 đang chạy
pm2 list

# Nếu app không có, start thủ công
cd /path/to/your-project/server
pm2 start server.js --name your-app-name
pm2 save
```

## PHẦN 7: QUẢN LÝ RUNNER

**Xem status runner**
```bash
cd ~/github-runners/your-repo-name
sudo ./svc.sh status
```

**Stop runner**
```bash
sudo ./svc.sh stop
```

**Start runner**
```bash
sudo ./svc.sh start
```

**Restart runner**
```bash
sudo ./svc.sh stop
sudo ./svc.sh start
```

**Xem logs runner**
```bash
tail -f ~/github-runners/your-repo-name/_diag/Runner_*.log
# Hoặc xem systemd logs
sudo journalctl -u actions.runner.*.service -f
```

**Uninstall runner**
```bash
cd ~/github-runners/your-repo-name

# Stop service
sudo ./svc.sh stop

# Uninstall service
sudo ./svc.sh uninstall

# Remove config (cần token từ GitHub)
./config.sh remove --token YOUR_REMOVAL_TOKEN
```

## PHẦN 8: WORKFLOW NÂNG CAO (TÙY CHỌN)

### Thêm deployment vào nginx:
```yaml
- name: Deploy frontend to nginx
  run: |
    sudo mkdir -p /var/www/your-app/current
    sudo cp -r client/dist/* /var/www/your-app/current/
    sudo systemctl reload nginx
```

### Thêm environment variables:
GitHub -> Settings -> Secrets and variables -> Actions -> New repository secret

Trong workflow:
```yaml
- name: Build with env
  run: |
    cd client
    npm run build
  env:
    VITE_API_URL: ${{ secrets.API_URL }}
    NODE_ENV: production
```

### Thêm Slack notification:
```yaml
- name: Slack notification
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
  if: always()
```

## CHECKLIST SETUP HOÀN CHỈNH

1. **Cài Node.js 20**: `node -v` -> v20.x.x
2. **Download và cài runner**: `./config.sh`, `sudo ./svc.sh install`, `start`
3. **Verify runner online**: Status **Idle**
4. **Tạo workflow file**: `.github/workflows/deploy.yml`
5. **Commit và push**: `git push origin main`
6. **Xem workflow chạy**: GitHub Actions Logs
7. **Verify kết quả**: `pm2 list` (App restart), `ls -la client/dist/` (Build OK)

## QUY TRÌNH LÀM VIỆC SAU KHI SETUP

1. Sửa code trên local/Mac
2. `git commit` + `git push`
3. **GitHub Actions tự động:**
   - Pull code mới
   - Install dependencies
   - Run tests (nếu có)
   - Build frontend
   - Restart backend
4. Nhận thông báo Success/Failed
5. App đã update trên server

## KẾT LUẬN

Bạn đã có hệ thống CI/CD hoàn chỉnh với:
- ✅ GitHub Actions self-hosted runner
- ✅ Auto-deploy khi push code
- ✅ Backend auto-restart với PM2
- ✅ Frontend auto-build
- ✅ Chạy trên Node.js 20

Mỗi lần push code, server sẽ tự động build và deploy!