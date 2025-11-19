# Deployment Configuration Guide - Devenir

## 📋 Overview

Hướng dẫn setup đầy đủ để chạy Devenir trên 2 domain:

- **Server (Backend)**: `https://nguyenlehuy-vivobook-asuslaptop-x512fa-a512fa.tail86e288.ts.net/devenir`
- **Client (Frontend)**: `https://devenir-demo.vercel.app`

---

## 🚀 Server Setup (Tailscale)

### 1. Environment Variables (`.env`)

```dotenv
# Server Config
PORT=5000
NODE_ENV=production

# Database
MONGO_URI=mongodb+srv://dung1322003_db_user:yBIUQzibKKzphYYO@devenir.q0exfj0.mongodb.net/

# JWT
JWT_SECRET=7c508a4aee3e83e37bb45bfe437f0cae
JWT_EXPIRE=30d

# Cloudinary
CLOUDINARY_CLOUD_NAME=dghoiqbqy
CLOUDINARY_API_KEY=129229151143922
CLOUDINARY_API_SECRET=**********

# Payment Gateways
PAYOS_CLIENT_ID=e2e81d35-6c7c-43fe-9322-52a852192b9e
PAYOS_API_KEY=316a560b-629e-4d71-a197-74a60510de7c
PAYOS_CHECKSUM_KEY=0a123afb16fb836e7775b3ca2a1eb3f70805a647da7367f09ebd652315b1ea37

COINBASE_API_KEY=your-coinbase-api-key
COINBASE_WEBHOOK_SECRET=your-webhook-secret

# OpenAI (RAG)
OPENAI_API_KEY=sk-your-openai-api-key

# CORS - Developed URLs
CLIENT_URL_DEV=http://localhost:5174
ADMIN_URL_DEV=http://localhost:5173

# CORS - Production URLs
CLIENT_URL=https://devenir-demo.vercel.app
ADMIN_URL=https://devenir-admin.vercel.app
SERVER_URL=https://nguyenlehuy-vivobook-asuslaptop-x512fa-a512fa.tail86e288.ts.net/devenir

# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=dung1322003@gmail.com
EMAIL_PASS=qacz apsp duwk dkjx
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_FROM=noreply@devenir.com

# Google OAuth
GOOGLE_CLIENT_ID=308105274224-ei1pp9aqtp21t38gbs0j54ej5ci0tkpm.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
```

### 2. CORS Configuration (server.js)

Server đã cấu hình CORS cho:

- Development: `localhost:5173`, `localhost:5174`
- Production: `devenir-demo.vercel.app`
- Tailscale: `nguyenlehuy-vivobook-asuslaptop-x512fa-a512fa.tail86e288.ts.net`
- Preview deployments (wildcard): `devenir-demo-*.vercel.app`

### 3. API Route Structure

```
Server: https://nguyenlehuy-vivobook-asuslaptop-x512fa-a512fa.tail86e288.ts.net/devenir/api
├── /api/auth         - Authentication routes
├── /api/products     - Product management
├── /api/orders       - Order management
└── /api/users        - User management
```

### 4. Running Server on Tailscale

**For Development:**

```bash
cd server
npm install
npm start
```

**For Production:**

```bash
# Ensure NODE_ENV=production in .env
NODE_ENV=production npm start
```

Server will run on port 5000 and be accessible via Tailscale domain.

---

## 🌐 Client Setup (Vercel)

### 1. Environment Variables (`.env.local` for development, `.env.production` for Vercel)

**Development (.env.local)**:

```dotenv
VITE_GOOGLE_CLIENT_ID=308105274224-ei1pp9aqtp21t38gbs0j54ej5ci0tkpm.apps.googleusercontent.com
VITE_API_URL=http://localhost:5000/api
```

**Production (.env.production - set in Vercel dashboard)**:

```dotenv
VITE_GOOGLE_CLIENT_ID=308105274224-ei1pp9aqtp21t38gbs0j54ej5ci0tkpm.apps.googleusercontent.com
VITE_API_URL=https://nguyenlehuy-vivobook-asuslaptop-x512fa-a512fa.tail86e288.ts.net/devenir/api
```

### 2. Vercel Configuration

**vercel.json** (Already configured):

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### 3. Build Configuration (vite.config.js)

```javascript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    host: "localhost",
  },
});
```

### 4. API Service Configuration (src/services/api.js)

Client automatically uses `VITE_API_URL` from environment:

```javascript
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3111/api";
```

### 5. Deploying to Vercel

**Step 1: Install Vercel CLI**

```bash
npm install -g vercel
```

**Step 2: Login to Vercel**

```bash
vercel login
```

**Step 3: Deploy**

```bash
cd client
vercel
```

**Step 4: Set Environment Variables in Vercel Dashboard**

Go to: https://vercel.com/devenir-demo/settings/environment-variables

Add:

- `VITE_GOOGLE_CLIENT_ID`: `308105274224-ei1pp9aqtp21t38gbs0j54ej5ci0tkpm.apps.googleusercontent.com`
- `VITE_API_URL`: `https://nguyenlehuy-vivobook-asuslaptop-x512fa-a512fa.tail86e288.ts.net/devenir/api`

---

## ✅ Integration Checklist

### Backend (Server) Setup:

- [x] MongoDB connection (MongoDB Atlas)
- [x] JWT authentication
- [x] CORS configured for both domains
- [x] Email service (Gmail SMTP)
- [x] Google OAuth integration
- [x] Payment gateways (PayOS, Coinbase)
- [x] Cloudinary image hosting
- [x] API routes organized
- [x] Environment variables set

### Frontend (Client) Setup:

- [x] React + Vite configured
- [x] Google OAuth integration
- [x] API service with axios
- [x] Authentication context
- [x] Protected routes
- [x] Responsive design
- [x] Environment-based API URL
- [x] Vercel deployment configuration

### CORS & Domain Setup:

- [x] Server CORS allows Vercel domain
- [x] Server CORS allows Tailscale domain
- [x] Development localhost URLs configured
- [x] Production URLs configured

---

## 🔗 URLs Reference

| Service    | Development                 | Production                                                                            |
| ---------- | --------------------------- | ------------------------------------------------------------------------------------- |
| **Server** | `http://localhost:5000`     | `https://nguyenlehuy-vivobook-asuslaptop-x512fa-a512fa.tail86e288.ts.net/devenir`     |
| **Client** | `http://localhost:5174`     | `https://devenir-demo.vercel.app`                                                     |
| **Admin**  | `http://localhost:5173`     | `https://devenir-admin.vercel.app`                                                    |
| **API**    | `http://localhost:5000/api` | `https://nguyenlehuy-vivobook-asuslaptop-x512fa-a512fa.tail86e288.ts.net/devenir/api` |

---

## 🔒 Security Best Practices

### Production Environment:

1. ✅ Set `NODE_ENV=production` on server
2. ✅ Use HTTPS for all production URLs
3. ✅ Keep sensitive keys in environment variables
4. ✅ Enable CORS only for known domains
5. ✅ Use secure password for email service
6. ✅ Implement rate limiting on API endpoints
7. ✅ Use HTTPS for OAuth redirect URIs

### OAuth Redirect URLs:

Configure in Google Cloud Console:

```
Development:
- http://localhost:5174/auth/callback
- http://localhost:5173/auth/callback

Production:
- https://devenir-demo.vercel.app/auth/callback
- https://devenir-admin.vercel.app/auth/callback
```

---

## 🚨 Common Issues & Solutions

### Issue 1: CORS Error when calling API

**Solution**: Ensure `VITE_API_URL` in `.env.local` matches server origin

```dotenv
# If server is at Tailscale:
VITE_API_URL=https://nguyenlehuy-vivobook-asuslaptop-x512fa-a512fa.tail86e288.ts.net/devenir/api

# If server is local:
VITE_API_URL=http://localhost:5000/api
```

### Issue 2: Google OAuth fails

**Solution**: Update OAuth redirect URIs in Google Cloud Console

### Issue 3: API calls timeout on production

**Solution**: Check Tailscale connection and ensure server is running

### Issue 4: Build fails on Vercel

**Solution**: Ensure all environment variables are set in Vercel Dashboard

---

## 📱 Testing Integration

### Test 1: Local Development

```bash
# Terminal 1 - Server
cd server && npm start

# Terminal 2 - Client
cd client && npm run dev

# Visit: http://localhost:5174
```

### Test 2: Production Simulation

```bash
# Build client
cd client && npm run build

# Preview build
npm run preview

# Server should be accessible via Tailscale
# Update VITE_API_URL to production URL in .env.local
```

### Test 3: Full Production

```bash
# Visit: https://devenir-demo.vercel.app
# Should connect to: https://nguyenlehuy-vivobook-asuslaptop-x512fa-a512fa.tail86e288.ts.net/devenir/api
```

---

## 🔧 Maintenance

### Server Logs

```bash
# On server machine
cd server
npm start

# Watch logs in real-time
tail -f logs/error.log
```

### Database Maintenance

- Monitor MongoDB Atlas: https://cloud.mongodb.com
- Backup configuration: Enable automatic backups
- Index optimization: Ensure proper indexes on frequently queried fields

### Vercel Deployments

- Dashboard: https://vercel.com/devenir-demo
- Auto-deploy on git push to main branch
- Rollback available for previous deployments

---

**Last Updated**: November 2024
**Deployment Status**: Ready for production
