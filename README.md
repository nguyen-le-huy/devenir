# Devenir - Premium Fashion E-commerce Platform

<div align="center">
  
  **A next-generation fashion e-commerce platform powered by AI**
  
  [![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
  [![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
  [![MongoDB](https://img.shields.io/badge/MongoDB-7.0-green.svg)](https://mongodb.com/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)

</div>

---

## Overview

**Devenir** is an enterprise-grade e-commerce platform specialized in premium men's fashion, built on the MERN stack with advanced AI integration.

The platform delivers an intelligent, modern, and personalized shopping experience through the integration of cutting-edge technologies including AI-powered recommendations, automated workflows, and multi-gateway payment solutions.

---

## Key Features

### Customer Experience

**AI Shopping Assistant (RAG-powered Chatbot)**
- Intelligent product recommendations based on contextual understanding
- Personalized size suggestions based on height and weight
- Style matching and outfit coordination
- Real-time order tracking within chat interface
- Automated FAQ responses for policies and procedures
- Embedded Google Maps for store location requests

**Visual Search**
- Image-based product discovery
- Powered by FashionCLIP and Qdrant Vector Database
- Find similar products by uploading images

**Payment Solutions**
- VND bank transfer via PayOS integration
- Cryptocurrency payments (USDT BSC) via NowPayments
- Real-time payment confirmation and order processing

**Real-time Updates**
- Live order status tracking via Socket.io
- Instant notifications for order changes
- Seamless communication channel

**Authentication**
- Google OAuth 2.0 integration
- Traditional email/password authentication
- Secure session management with JWT

### Admin Dashboard

**Product Management**
- Full CRUD operations with variant support (colors, sizes)
- Automatic data synchronization to Pinecone and Qdrant vector databases
- Bulk operations and batch processing

**Order Management**
- Comprehensive order tracking and status updates
- Return and refund processing
- Shipping integration and logistics management

**Analytics & Reporting**
- Revenue visualization with Recharts
- Best-selling products analysis
- User behavior metrics and insights

**Automation via n8n**
- One-click Facebook Page posting
- Telegram order notifications
- Low inventory alerts with Excel exports

---

## System Architecture

```
devenir/
├── client/          # Customer-facing frontend (React + Vite + TypeScript)
├── admin/           # Admin dashboard (React + TypeScript + Shadcn UI)
├── server/          # Backend API (Node.js + Express + MongoDB)
├── clip-service/    # FashionCLIP microservice (FastAPI + Docker)
└── .agent/          # Development workflows and automation guides
```

### Technology Stack

**Frontend**
- React 18 with Vite and TypeScript
- State Management: React Query (server state) + Zustand (client state)
- Styling: CSS Modules, TailwindCSS (Admin)
- Animations: GSAP, ScrollTrigger, SplitText

**Backend**
- Node.js 18+ with Express.js
- MongoDB with Mongoose ODM
- Vector Databases: Pinecone (RAG), Qdrant (Visual Search)
- AI/ML: OpenAI API, FashionCLIP
- Real-time Communication: Socket.io

**Infrastructure**
- Client & Admin: Vercel deployment
- Backend API: Self-hosted with PM2 and Nginx
- FashionCLIP: Docker containerized service
- n8n Automation: Docker containerized workflows

---

## AI Capabilities

### RAG Chatbot (Retrieval-Augmented Generation)

The chatbot system is built on an **Intent-based Routing Architecture**, classifying user queries and routing them to specialized services:

**Specialized Services**
- **ProductAdvisor**: Product recommendations based on user needs
- **SizeAdvisor**: Size suggestions based on body measurements
- **StyleMatcher**: Outfit coordination and style matching
- **OrderLookup**: Real-time order status retrieval
- **PolicyFAQ**: Automated responses for return, payment, and shipping policies
- **GeneralHelper**: General inquiry handling

**Processing Pipeline**
```
User Query → Intent Classification → Specialized Service → 
Vector Search (Pinecone) → Context Building → LLM Response (GPT-4o-mini)
```

### Visual Search

Image-based product discovery powered by **FashionCLIP**:

```
Image Upload → FashionCLIP Encoding (512-dim vector) → 
Qdrant Similarity Search → Ranked Product Results
```

---

## Automation Workflows

Automated processes built with **n8n**:

**Facebook Auto-Posting**
- Automatic product publishing to Facebook Page
- Scheduled content distribution
- Multi-platform content management

**Telegram Order Notifications**
- Real-time order confirmations sent to Telegram groups
- Instant order status updates
- Team collaboration and monitoring

**Inventory Management**
- Automated low-stock alerts via Telegram
- Excel report generation and distribution
- Proactive inventory monitoring

---

## Security

**Authentication & Authorization**
- JWT-based authentication with httpOnly cookies
- Role-based access control (RBAC)
- OAuth 2.0 integration for third-party authentication

**API Security**
- Rate limiting on all endpoints
- CORS configuration for specific origins
- Input validation with Express Validator
- Password hashing with bcrypt

**Production Security**
- HTTPS enforcement
- Environment variable encryption
- Security headers configuration

---

## Project Structure

### Frontend - Feature-Based Architecture

```
client/src/
├── core/               # Core infrastructure (API, Stores, Libraries)
├── shared/             # Shared resources (Components, Hooks, Utilities)
└── features/           # Feature modules (Feature-Based)
    ├── auth/           # Authentication and authorization
    ├── products/       # Product listing and details
    ├── cart/           # Shopping cart management
    ├── checkout/       # Checkout and payment flow
    ├── chat/           # AI-powered chat widget (RAG)
    └── nowpayments/    # Cryptocurrency payment integration
```

### Backend - Service Layer Pattern

```
server/
├── models/             # Mongoose schemas and models
├── controllers/        # Request handlers and routing logic
├── services/           # Business logic and data processing
│   ├── rag/            # RAG AI system implementation
│   ├── imageSearch/    # Visual search engine
│   ├── telegram/       # Telegram notification service
│   ├── payos/          # PayOS payment gateway
│   └── nowpayments/    # NowPayments cryptocurrency gateway
└── routes/             # API endpoint definitions
```

---

## Getting Started

### Prerequisites

- Node.js 18 or higher
- MongoDB (MongoDB Atlas recommended)
- Docker (for FashionCLIP service)

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/devenir.git
cd devenir

# Backend setup
cd server
npm install
cp .env.example .env
npm run dev

# Client setup
cd ../client
npm install
cp .env.example .env
npm run dev

# Admin setup
cd ../admin
npm install
cp .env.example .env
npm run dev

# FashionCLIP service (optional)
cd ../clip-service
docker build -t fashion-clip .
docker run -d -p 8000:8000 fashion-clip
```

### Configuration

Required environment variables:

**Backend (.env)**
```env
MONGO_URI=mongodb+srv://your-mongodb-uri
PINECONE_API_KEY=your-pinecone-key
OPENAI_API_KEY=your-openai-key
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
JWT_SECRET=your-jwt-secret
```

**Client (.env)**
```env
VITE_API_URL=http://localhost:3111/api
VITE_SOCKET_URL=http://localhost:3111
```

---

## License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">
  <strong>Built by Hystudio</strong>
  <br/>
  <a href="https://devenir.shop">Website</a> · 
  <a href="mailto:support@devenir.shop">Support</a>
</div>
