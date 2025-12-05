# Devenir - Fashion E-commerce Platform

**Devenir** is a premium e-commerce solution designed for the fashion industry. Built on the MERN stack, it integrates advanced features such as Retrieval-Augmented Generation (RAG) for AI assistance, n8n for workflow automation, and multi-channel payment gateways including fiat and cryptocurrency.

## Table of Contents

  - [Key Features](https://www.google.com/search?q=%23key-features)
  - [Tech Stack](https://www.google.com/search?q=%23tech-stack)
  - [System Architecture](https://www.google.com/search?q=%23system-architecture)
  - [Prerequisites](https://www.google.com/search?q=%23prerequisites)
  - [Installation & Setup](https://www.google.com/search?q=%23installation--setup)
  - [Configuration](https://www.google.com/search?q=%23configuration)
  - [Deployment](https://www.google.com/search?q=%23deployment)
  - [API Overview](https://www.google.com/search?q=%23api-overview)
  - [License](https://www.google.com/search?q=%23license)

## Key Features

### Customer Interface

  - **Authentication:** Secure login via Email/Password and Google OAuth.
  - **Product Discovery:** Advanced filtering (size, color, price range) and search capabilities.
  - **AI Assistant (RAG):** An intelligent chatbot powered by OpenAI and Pinecone to provide sizing advice, outfit coordination, and order tracking.
  - **Payments:** Seamless checkout supporting domestic transfers (PayOS) and cryptocurrency (Coinbase Commerce).
  - **User Dashboard:** comprehensive account management and order history tracking.

### Admin Dashboard

  - **Analytics:** Real-time overview of revenue, top-selling products, and user metrics.
  - **Inventory Management:** Full CRUD operations for products and SKUs (variants, stock levels).
  - **Order Management:** Centralized processing for orders, shipments, and returns.
  - **AI Admin Assistant:** Natural language querying for operational data.
  - **Automation:** Integrated n8n workflows for order confirmation emails and low-stock alerts.

## Tech Stack

### Frontend (Client & Admin)

  - **Framework:** React 18
  - **Build Tool:** Vite
  - **State Management & Data Fetching:** React Query, Context API
  - **Styling:** TailwindCSS, CSS Modules, Shadcn/ui
  - **Animations:** GSAP
  - **HTTP Client:** Axios

### Backend

  - **Runtime:** Node.js
  - **Framework:** Express.js
  - **Database:** MongoDB (Primary Data), Pinecone (Vector Database for RAG)
  - **AI & NLP:** OpenAI API, LangChain
  - **Authentication:** JWT, Google OAuth
  - **Payment Gateways:** PayOS, Coinbase Commerce
  - **Media Storage:** Cloudinary
  - **Automation:** n8n

### Infrastructure

  - **Frontend Hosting:** Vercel
  - **Backend Hosting:** Self-hosted Linux Server

## System Architecture

```text
devenir/
├── server/                 # Backend API (Node.js/Express)
│   ├── config/             # Configuration (DB, Pinecone, Payments)
│   ├── controllers/        # Business logic
│   ├── models/             # Mongoose schemas
│   ├── routes/             # API endpoints
│   ├── middleware/         # Auth, validation, error handling
│   ├── rag/                # AI logic (Pinecone vector search)
│   └── server.js           # Entry point
│
├── client/                 # Customer Frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Route pages
│   │   └── services/       # API integration
│
├── admin/                  # Administration Frontend
│   ├── src/
│   │   ├── components/     # Dashboard widgets
│   │   ├── pages/          # Management views
│   │   └── services/       # API integration
```

## Prerequisites

Ensure the following are installed on your local machine:

  - Node.js (v18.x or higher)
  - npm or yarn
  - MongoDB (Local or Atlas)

## Installation & Setup

### 1\. Clone the Repository

```bash
git clone https://github.com/yourusername/devenir.git
cd devenir
```

### 2\. Backend Setup

```bash
cd server
npm install
cp .env.example .env
# Update .env with your credentials
npm run dev
```

### 3\. Client Setup

```bash
cd ../client
npm install
cp .env.example .env
npm run dev
```

### 4\. Admin Setup

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
PINECONE_ENVIRONMENT=...
PINECONE_INDEX=...

# Security
JWT_SECRET=your_secure_secret
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Services
OPENAI_API_KEY=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Payments
PAYOS_CLIENT_ID=...
PAYOS_API_KEY=...
PAYOS_CHECKSUM_KEY=...
COINBASE_COMMERCE_API_KEY=...
```

## Deployment

### Frontend (Client & Admin)

Both frontend applications are optimized for deployment on **Vercel**.

1.  Connect your GitHub repository to Vercel.
2.  Configure the build settings (Output directory: `dist`).
3.  Add the necessary environment variables (`VITE_API_URL`, etc.) in the Vercel dashboard.

### Backend

The backend is designed to run on a **Linux Server** (e.g., Ubuntu/Debian).

1.  **Environment:** Ensure Node.js and PM2 are installed on the server.
2.  **Setup:**
    ```bash
    git pull origin main
    npm install --production
    ```
3.  **Process Management:** Use PM2 to keep the server running.
    ```bash
    pm2 start server.js --name "devenir-api"
    ```
4.  **Reverse Proxy:** Configure Nginx to forward requests from port 80/443 to your Node.js port.

## API Overview

### Authentication

  - `POST /api/auth/register`: Register a new user.
  - `POST /api/auth/login`: Authenticate user.
  - `POST /api/auth/google`: Handle Google OAuth.

### Products

  - `GET /api/products`: Retrieve product list with pagination and filters.
  - `GET /api/products/:id`: Retrieve product details.
  - `POST /api/products`: Create new product (Admin only).

### Orders

  - `POST /api/orders`: Create a new order.
  - `POST /api/orders/pay-os`: Initiate PayOS transaction.
  - `POST /api/orders/coinbase`: Initiate Coinbase transaction.

## License

Distributed under the MIT License. See `LICENSE` for more information.

-----

### Would you like me to generate a sample Nginx configuration file for your Linux backend server?
