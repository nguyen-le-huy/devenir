# Devenir - Fashion E-commerce Platform

**Devenir** is a premium e-commerce solution designed for the fashion industry. Built on the MERN stack, it integrates advanced features such as Retrieval-Augmented Generation (RAG) for AI assistance and multi-channel payment gateways including fiat (PayOS) and cryptocurrency (NowPayments - USDT BSC).

## Table of Contents

- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [API Overview](#api-overview)
- [License](#license)

## Key Features

### Customer Interface

- **Authentication:** Secure login via Email/Password and Google OAuth.
- **Product Discovery:** Advanced filtering (size, color, price range) and search capabilities.
- **AI Assistant (RAG):** An intelligent chatbot powered by OpenAI and Pinecone with specialized services:
  - **Product Advisor:** Smart product recommendations based on user preferences
  - **Size Advisor:** Personalized sizing advice based on height/weight
  - **Style Matcher:** Outfit coordination and style suggestions
  - **Order Lookup:** Real-time order tracking and status updates
  - **Policy FAQ:** Shipping, payment, and return policy information
- **Payments:** Seamless checkout supporting:
  - **PayOS:** Domestic bank transfers (VND) with QR code
  - **NowPayments:** Cryptocurrency payment (USDT on BSC network)
- **User Dashboard:** Comprehensive account management and order history tracking.

### Admin Dashboard

- **Analytics:** Real-time overview of revenue, top-selling products, and user metrics.
- **Inventory Management:** Full CRUD operations for products and SKUs (variants, stock levels).
- **Order Management:** Centralized processing for orders, shipments, and returns.
- **Customer Management:** User accounts, order history, and analytics.

## Tech Stack

### Frontend - Client

| Category | Technology |
|----------|------------|
| Framework | React 18 |
| Build Tool | Vite |
| State Management | React Query, Context API |
| Styling | CSS Modules, Vanilla CSS |
| Animations | GSAP, SplitText, ScrollTrigger |
| HTTP Client | Axios |
| Routing | React Router v6 |

### Frontend - Admin

| Category | Technology |
|----------|------------|
| Framework | React 18 + TypeScript |
| Build Tool | Vite |
| State Management | React Query, Zustand |
| Styling | TailwindCSS, Shadcn/ui |
| Charts | Recharts |
| HTTP Client | Axios |

### Backend

| Category | Technology |
|----------|------------|
| Runtime | Node.js (v18+) |
| Framework | Express.js |
| Database | MongoDB (Primary), Pinecone (Vector DB for RAG) |
| AI & NLP | OpenAI API (GPT-4o-mini, Embeddings) |
| Authentication | JWT, Google OAuth 2.0 |
| Payment Gateways | PayOS (VND), NowPayments (USDT BSC) |
| Media Storage | Cloudinary |
| Email | Nodemailer |

### Infrastructure

| Component | Platform |
|-----------|----------|
| Client Frontend | Vercel |
| Admin Frontend | Vercel |
| Backend API | Self-hosted Linux Server (PM2 + Nginx) |

## System Architecture

```
devenir/
├── server/                     # Backend API (Node.js/Express)
│   ├── config/                 # Configuration (DB, Pinecone, Payments)
│   ├── controllers/            # Business logic
│   ├── models/                 # Mongoose schemas
│   ├── routes/                 # API endpoints
│   ├── middleware/             # Auth, validation, error handling
│   ├── services/
│   │   ├── rag/                # RAG AI System
│   │   │   ├── core/           # Vector search, context builder
│   │   │   ├── embeddings/     # OpenAI embeddings
│   │   │   ├── generation/     # LLM response generation
│   │   │   ├── orchestrators/  # Intent classification, routing
│   │   │   ├── retrieval/      # Document retrieval
│   │   │   └── specialized/    # Domain-specific services
│   │   │       ├── product-advisor.service.js
│   │   │       ├── size-advisor.service.js
│   │   │       ├── style-matcher.service.js
│   │   │       ├── order-lookup.service.js
│   │   │       └── policy-faq.service.js
│   │   ├── payos/              # PayOS payment integration
│   │   └── nowpayments/        # NowPayments crypto integration
│   └── server.js               # Entry point
│
├── client/                     # Customer Frontend
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # Route pages
│   │   │   ├── HomePage/       # Landing page with GSAP animations
│   │   │   ├── ProductDetail/  # Product details, size selection
│   │   │   ├── Checkout/       # Shipping, payment flow
│   │   │   ├── PayOS/          # PayOS payment result
│   │   │   └── NowPayments/    # Crypto payment result
│   │   ├── features/           # Feature modules
│   │   │   ├── nowpayments/    # NowPayments API
│   │   │   └── chat/           # AI Chat components
│   │   └── services/           # API integration
│
├── admin/                      # Administration Frontend (TypeScript)
│   ├── src/
│   │   ├── components/         # Dashboard widgets (Shadcn/ui)
│   │   ├── pages/              # Management views
│   │   └── services/           # API integration
```

## Prerequisites

Ensure the following are installed on your local machine:

- Node.js (v18.x or higher)
- npm or yarn
- MongoDB (Local or Atlas)

## Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/devenir.git
cd devenir
```

### 2. Backend Setup

```bash
cd server
npm install
cp .env.example .env
# Update .env with your credentials
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

## Configuration

Create a `.env` file in the `server` directory with the following variables:

```env
# Database
MONGO_URI=mongodb+srv://...
PINECONE_API_KEY=...
PINECONE_INDEX=...

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
NOWPAYMENTS_SANDBOX=false  # Set to 'true' for testing

# URLs
SERVER_URL=https://your-server-domain.com
CLIENT_URL=https://your-client-domain.com
```

## Deployment

### Frontend (Client & Admin)

Both frontend applications are optimized for deployment on **Vercel**.

1. Connect your GitHub repository to Vercel.
2. Configure the build settings:
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. Add the necessary environment variables (`VITE_API_URL`, etc.) in the Vercel dashboard.

### Backend

The backend is designed to run on a **Linux Server** (e.g., Ubuntu/Debian).

1. **Environment:** Ensure Node.js and PM2 are installed on the server.
2. **Setup:**
   ```bash
   git pull origin main
   npm install --production
   ```
3. **Process Management:** Use PM2 to keep the server running.
   ```bash
   pm2 start server.js --name "devenir-api"
   ```
4. **Reverse Proxy:** Configure Nginx to forward requests from port 80/443 to your Node.js port.

## API Overview

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Authenticate user |
| POST | `/api/auth/google` | Handle Google OAuth |

### Products

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | Retrieve product list with pagination and filters |
| GET | `/api/products/:id` | Retrieve product details |
| POST | `/api/products` | Create new product (Admin only) |

### Cart

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cart` | Get user's cart |
| POST | `/api/cart/add` | Add item to cart |
| PUT | `/api/cart/update` | Update cart item quantity |
| DELETE | `/api/cart/remove/:variantId` | Remove item from cart |

### Payments

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payments/payos/session` | Create PayOS payment link |
| POST | `/api/payments/payos/webhook` | PayOS IPN callback |
| GET | `/api/payments/payos/order/:orderCode` | Get PayOS order status |
| POST | `/api/payments/nowpayments/session` | Create NowPayments invoice (USDT BSC) |
| POST | `/api/payments/nowpayments/webhook` | NowPayments IPN callback |
| GET | `/api/payments/nowpayments/status/:orderId` | Get NowPayments order status |

### AI Chat

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat` | Send message to AI assistant |
| GET | `/api/chat/history` | Get chat history |

## Payment Integration

### PayOS (Vietnam Bank Transfer)

- Supports QR code and bank transfer
- Currency: VND
- Real-time payment confirmation via webhook

### NowPayments (Cryptocurrency)

- Supports USDT on BSC (BEP-20) network
- Low transaction fees (~$0.10)
- Blockchain confirmation via IPN webhook
- Sandbox mode available for testing

## License

Distributed under the MIT License. See `LICENSE` for more information.

---

**Built with ❤️ by Devenir Team**
