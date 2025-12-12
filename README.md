# Devenir - Premium Fashion E-commerce Platform

<div align="center">
  <img src="https://res.cloudinary.com/dghoiqbqy/image/upload/v1764563611/devenir/logo.png" alt="Devenir Logo" width="200"/>
  
  **A next-generation fashion e-commerce platform powered by AI**
  
  [![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
  [![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
  [![MongoDB](https://img.shields.io/badge/MongoDB-7.0-green.svg)](https://mongodb.com/)
  [![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
</div>

---

## 🌟 Overview

**Devenir** is a premium e-commerce solution designed for the fashion industry. Built on the MERN stack, it integrates cutting-edge AI features including:

- **RAG-powered AI Chatbot** for intelligent product recommendations
- **Visual Search** using FashionCLIP for image-based product discovery
- **Auto Social Media Posting** via n8n automation
- **Multi-gateway Payments** supporting VND (PayOS) and Crypto (USDT BSC)

---

## 📋 Table of Contents

- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [Prerequisites](#-prerequisites)
- [Installation & Setup](#-installation--setup)
- [Configuration](#-configuration)
- [AI Features](#-ai-features)
- [Payment Integration](#-payment-integration)
- [Deployment](#-deployment)
- [API Reference](#-api-reference)
- [Workflows](#-workflows)
- [License](#-license)

---

## 🚀 Key Features

### Customer Experience

| Feature | Description |
|---------|-------------|
| **AI Shopping Assistant** | RAG-powered chatbot with product advice, size recommendations, and order tracking |
| **Visual Search** | Upload an image to find similar products using FashionCLIP + Qdrant |
| **Smart Filtering** | Filter by size, color, price range, category, and brand |
| **Multi-payment** | VND bank transfer (PayOS) + Cryptocurrency (USDT BSC) |
| **Real-time Updates** | Socket.io for live order status and chat notifications |
| **OAuth Login** | Google OAuth 2.0 + Email/Password authentication |

### Admin Dashboard

| Feature | Description |
|---------|-------------|
| **Analytics Dashboard** | Revenue charts, top products, user metrics (Recharts) |
| **Product Management** | CRUD with variants, auto-ingestion to Pinecone & Qdrant |
| **Order Management** | Status tracking, returns, and shipping integration |
| **Social Media Posting** | One-click Facebook posting via n8n automation |
| **Inventory Alerts** | Low stock warnings and reorder notifications |
| **Brand & Category Management** | Full control over taxonomy and branding |

### AI-Powered Features

| Service | Capability |
|---------|------------|
| **Product Advisor** | Smart recommendations based on query understanding |
| **Size Advisor** | Personalized sizing from height/weight |
| **Style Matcher** | Outfit coordination suggestions |
| **Order Lookup** | Real-time order tracking via chat |
| **Policy FAQ** | Automated shipping/return policy answers |
| **Visual Search** | Find products by image similarity |

---

## 🛠 Tech Stack

### Frontend - Client (React)

| Category | Technology |
|----------|------------|
| Framework | React 18 + Vite |
| State | React Query, Context API |
| Styling | CSS Modules, Vanilla CSS |
| Animations | GSAP, ScrollTrigger, SplitText |
| Real-time | Socket.io Client |

### Frontend - Admin (React + TypeScript)

| Category | Technology |
|----------|------------|
| Framework | React 18 + TypeScript + Vite |
| UI Library | Shadcn/ui, TailwindCSS |
| State | React Query, Zustand |
| Charts | Recharts |
| Forms | React Hook Form, Zod |

### Backend (Node.js)

| Category | Technology |
|----------|------------|
| Runtime | Node.js 18+ |
| Framework | Express.js |
| Database | MongoDB Atlas |
| Vector DB | Pinecone (RAG), Qdrant (Visual Search) |
| AI/ML | OpenAI API, FashionCLIP |
| Auth | JWT, Google OAuth 2.0 |
| Payments | PayOS, NowPayments |
| Media | Cloudinary |
| Email | Nodemailer |
| Real-time | Socket.io |

### Infrastructure

| Component | Platform |
|-----------|----------|
| Client & Admin | Vercel |
| Backend API | Self-hosted (PM2 + Nginx) |
| FashionCLIP Service | Docker (Self-hosted) |
| n8n Automation | Docker (Self-hosted) |
| Vector Databases | Qdrant Cloud, Pinecone |

---

## 🏗 System Architecture

```
devenir/
├── server/                        # Backend API
│   ├── config/                    # DB, Pinecone, Payment configs
│   ├── controllers/               # Business logic
│   ├── models/                    # Mongoose schemas
│   ├── routes/                    # API endpoints
│   ├── middleware/                # Auth, validation
│   ├── services/
│   │   ├── rag/                   # RAG AI System
│   │   │   ├── core/              # RAGService, context builder
│   │   │   ├── embeddings/        # OpenAI embeddings, propositions
│   │   │   ├── generation/        # LLM response, prompts
│   │   │   ├── orchestrators/     # Intent classification
│   │   │   ├── retrieval/         # Vector search
│   │   │   └── specialized/       # Domain services
│   │   │       ├── product-advisor.service.js
│   │   │       ├── size-advisor.service.js
│   │   │       ├── style-matcher.service.js
│   │   │       ├── order-lookup.service.js
│   │   │       └── policy-faq.service.js
│   │   ├── imageSearch/           # Visual Search System
│   │   │   ├── clipServiceClient.js
│   │   │   └── qdrantVectorStore.js
│   │   ├── ingestion/             # Auto-ingestion service
│   │   ├── payos/                 # PayOS integration
│   │   └── nowpayments/           # NowPayments integration
│   ├── scripts/
│   │   └── ingestion/             # Pinecone & Qdrant ingestion scripts
│   └── server.js
│
├── client/                        # Customer Frontend
│   ├── src/
│   │   ├── components/            # UI components
│   │   ├── pages/                 # Route pages
│   │   ├── features/
│   │   │   ├── chat/              # AI Chat widget
│   │   │   └── nowpayments/       # Crypto payment
│   │   └── services/              # API clients
│
├── admin/                         # Admin Dashboard
│   ├── src/
│   │   ├── components/            # Shadcn/ui components
│   │   ├── pages/
│   │   │   ├── products/          # Product management
│   │   │   ├── orders/            # Order management
│   │   │   └── content/           # Social media posting
│   │   ├── hooks/                 # React Query hooks
│   │   └── services/              # API clients
│
├── clip-service/                  # FashionCLIP Docker Service
│   ├── app.py                     # FastAPI server
│   ├── Dockerfile
│   └── requirements.txt
│
└── .agent/workflows/              # Development workflows
    ├── UploadingPost.md           # Facebook posting guide
    ├── image-search-selfhost.md   # Visual search setup
    └── nowpayments-integration.md # Crypto payment guide
```

---

## 📦 Prerequisites

- **Node.js** v18.x or higher
- **npm** or **yarn**
- **MongoDB** (Atlas recommended)
- **Docker** (for FashionCLIP service)

### External Services

| Service | Purpose | Required |
|---------|---------|----------|
| MongoDB Atlas | Primary database | ✅ Yes |
| Pinecone | RAG vector search | ✅ Yes |
| OpenAI API | Embeddings & LLM | ✅ Yes |
| Cloudinary | Image storage | ✅ Yes |
| Qdrant | Visual search vectors | Optional |
| PayOS | VND payments | Optional |
| NowPayments | Crypto payments | Optional |
| n8n | Social media automation | Optional |

---

## ⚙️ Installation & Setup

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/devenir.git
cd devenir
```

### 2. Backend Setup

```bash
cd server
npm install
cp .env.example .env
# Edit .env with your credentials
npm run dev
```

### 3. Client Setup

```bash
cd ../client
npm install
cp .env.example .env
npm run dev
```

### 4. Admin Setup

```bash
cd ../admin
npm install
cp .env.example .env
npm run dev
```

### 5. FashionCLIP Service (Optional - for Visual Search)

```bash
cd ../clip-service
docker build -t fashion-clip .
docker run -d -p 8000:8000 --name clip-service fashion-clip
```

---

## 🔧 Configuration

### Server Environment Variables

```env
# Database
MONGO_URI=mongodb+srv://...
PINECONE_API_KEY=...
PINECONE_INDEX=clothing-store

# Vector Search (Visual Search)
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=...
QDRANT_COLLECTION=devenir_products
CLIP_SERVICE_URL=http://localhost:8000

# Security
JWT_SECRET=your_secure_secret
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# AI Services
OPENAI_API_KEY=...

# Media Storage
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Payment - PayOS (VND)
PAYOS_CLIENT_ID=...
PAYOS_API_KEY=...
PAYOS_CHECKSUM_KEY=...

# Payment - NowPayments (Crypto)
NOWPAYMENTS_API_KEY=...
NOWPAYMENTS_IPN_SECRET=...
NOWPAYMENTS_SANDBOX=false

# URLs
SERVER_URL=https://api.devenir.shop
CLIENT_URL=https://www.devenir.shop
ADMIN_URL=https://admin.devenir.shop
```

### Client Environment Variables

```env
VITE_API_URL=http://localhost:3111/api
VITE_SOCKET_URL=http://localhost:3111
```

---

## 🤖 AI Features

### RAG Chatbot Architecture

```
User Query
    ↓
Intent Classification (Quick + LLM)
    ↓
┌─────────────────────────────────────┐
│ product_advice → ProductAdvisor    │
│ size_advice    → SizeAdvisor       │
│ style_match    → StyleMatcher      │
│ order_lookup   → OrderLookup       │
│ policy_faq     → PolicyFAQ         │
│ general        → GeneralHelper     │
└─────────────────────────────────────┘
    ↓
Vector Search (Pinecone) + Color Matching
    ↓
Context Building + Reranking
    ↓
LLM Response Generation (GPT-4o-mini)
    ↓
Response with Product Cards
```

### Visual Search Flow

```
Image Upload
    ↓
FashionCLIP Encoding (512-dim)
    ↓
Qdrant Similarity Search
    ↓
Product Recommendations
```

### Data Ingestion

Products are automatically ingested to both vector databases when created/updated:

```javascript
// Auto-triggered on product CRUD operations
triggerProductIngestion(productId, variantIds)
// → Pinecone: Text propositions for RAG
// → Qdrant: Image embeddings for Visual Search
```

---

## 💳 Payment Integration

### PayOS (Vietnam Bank Transfer)

- **Currency:** VND
- **Methods:** QR Code, Bank Transfer
- **Confirmation:** Real-time webhook (IPN)

### NowPayments (Cryptocurrency)

- **Currency:** USDT (BEP-20 on BSC)
- **Fees:** ~$0.10 per transaction
- **Confirmation:** Blockchain webhook (IPN)
- **Sandbox:** Available for testing

---

## 🚢 Deployment

### Frontend (Vercel)

1. Connect GitHub repository to Vercel
2. Configure build:
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. Add environment variables in Vercel dashboard

### Backend (Self-hosted)

```bash
# Install PM2
npm install -g pm2

# Start server
pm2 start server.js --name "devenir-api"
pm2 save
pm2 startup
```

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name api.devenir.shop;

    location / {
        proxy_pass http://localhost:3111;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 📚 API Reference

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login with email/password |
| POST | `/api/auth/google` | Google OAuth callback |
| GET | `/api/auth/me` | Get current user |

### Products

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List products (paginated) |
| GET | `/api/products/:id` | Get product details |
| POST | `/api/products/admin` | Create product (Admin) |
| PUT | `/api/products/admin/:id` | Update product (Admin) |
| DELETE | `/api/products/admin/:id` | Delete product (Admin) |

### Visual Search

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/image-search/search` | Search by image upload |

### AI Chat

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat` | Send message (authenticated) |
| POST | `/api/chat/guest` | Send message (guest) |
| GET | `/api/chat/history` | Get conversation history |

### Payments

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payments/payos/session` | Create PayOS payment |
| POST | `/api/payments/payos/webhook` | PayOS IPN callback |
| POST | `/api/payments/nowpayments/session` | Create crypto invoice |
| POST | `/api/payments/nowpayments/webhook` | NowPayments IPN |

### Social Media

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/social/webhook-proxy` | Proxy to n8n for FB posting |

---

## 📖 Workflows

Development workflows are documented in `.agent/workflows/`:

| Workflow | Description |
|----------|-------------|
| `/UploadingPost` | Auto Facebook posting via n8n |
| `/image-search-selfhost` | Visual search with FashionCLIP + Qdrant |
| `/nowpayments-integration` | USDT BSC payment integration |

---

## 🔒 Security

- **JWT Authentication** with httpOnly cookies
- **Rate Limiting** on API endpoints
- **CORS** configured for specific origins
- **Input Validation** with Express Validator
- **Password Hashing** with bcrypt
- **HTTPS** enforced in production

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">
  <strong>Built with ❤️ by Devenir Team</strong>
  
  [Website](https://devenir.shop) · [Documentation](https://docs.devenir.shop) · [Support](mailto:support@devenir.shop)
</div>
