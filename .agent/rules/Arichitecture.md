---
trigger: always_on
---

# Devenir System Architecture

## 1. Executive Summary

This document outlines the technical architecture for **Devenir**, a premium AI-powered fashion e-commerce platform. The system adopts a monorepo structure, integrating a fast, interactive consumer-facing frontend (Client), a robust administration panel (Admin), and a powerful Node.js/Express backend enhanced with advanced AI capabilities like RAG-powered chatbots and Visual Search. Key design goals include providing a premium "wow" user experience, seamless AI integration, and high scalability.

## 2. Technology Stack

### 2.1 Frontend Client (`client/`)
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: CSS Modules, Vanilla CSS, GSAP (Animations)
- **State Management**: React Query (Server State), Zustand (Global Client State)
- **Real-time**: Socket.IO Client
- **HTTP Client**: Axios (implied)

### 2.2 Frontend Admin (`admin/`)
- **Framework**: React 18
- **Language**: TypeScript
- **UI Library**: Shadcn/ui, TailwindCSS
- **State Management**: React Query, Zustand
- **Forms**: React Hook Form, Zod
- **Visualization**: Recharts

### 2.3 Backend (`server/`)
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB Atlas (Mongoose)
- **Vector Databases**: Pinecone (RAG), Qdrant (Visual Search)
- **AI Integration**: OpenAI API (LLM & Embeddings), FashionCLIP (Self-hosted)
- **Real-time**: Socket.IO
- **Auth**: JWT, Google OAuth 2.0
- **Payments**: PayOS (VND), NowPayments (Crypto/USDT)

## 3. Frontend Architecture

The frontend consists of two distinct applications: the Customer Client and the Admin Dashboard. Both follow a modular, feature-based directory structure.

### 3.1 Directory Structure (Client)

```
client/
├── src/
│   ├── components/              # Shared UI Components
│   │   ├── common/              # Buttons, Inputs, Modals
│   │   ├── layout/              # Header, Footer
│   │   └── product/             # Product cards, grids
│   ├── features/                # Feature-specific logic
│   │   ├── chat/                # AI Chat widget components & logic
│   │   └── nowpayments/         # Crypto payment integration
│   ├── pages/                   # Route-level components (Home, Shop, Cart)
│   ├── services/                # API communication layer
│   ├── stores/                  # Global Global Client State (Zustand)
│   ├── hooks/                   # Custom React hooks (e.g., useCart)
│   ├── assets/                  # Images, fonts, icons
│   └── utils/                   # Helper functions (currency formatting, dates)
└── ...
```

### 3.2 State Management: The Holy Trinity

We adopt a strictly optimized state management strategy dividing state into three distinct categories to maximize performance and code clarity.

#### 1. Server State: React Query (TanStack Query)
- **Role**: Manages all asynchronous data that originates from outside the application (DB/API).
- **Responsibilities**: Fetching, Caching, Synchronizing, Loading states, Error states.
- **Why**: Server data is mutable by others and needs distinct handling (stale-while-revalidate).
- **Examples**: Product lists, User profile, Chart data.

#### 2. Global Client State: Zustand
- **Role**: Manages synchronous state that needs to be accessed by multiple disparate components across the app.
- **Responsibilities**: Application settings, Session state (auth status), UI state (sidebar, modals).
- **Why**: Context API can cause unnecessary re-renders in complex apps; Zustand is atomic and performant.
- **Examples**: Theme (Dark/Light), Auth Token, Cart (pre-sync), Global Notifications.

#### 3. Local State: useState / useReducer
- **Role**: Manages state that is isolated to a single component.
- **Responsibilities**: Input values, Toggle switches, Hover states, Form logic (if not using a library).
- **Why**: Keeping state local ensures components are self-contained and reusable.
- **Examples**: Form input `onChange`, Dropdown open/close, Local modal visibility.

### 3.3 Performance Optimization Strategy

To achieve the sub-3s load time and high interactivity, we strictly enforce memoization techniques.

- **React.memo**:
  - Used for pure UI components (e.g., `ProductCard`, `Button`) to prevent re-renders when parent components update but props remain unchanged.
- **useMemo**:
  - Used for expensive calculations (e.g., filtering large product lists, complex data transformations for charts).
  - Used to ensure object references (like `filters` objects) remain stable across renders.
- **useCallback**:
  - **Mandatory** for any function passed as a prop to a `React.memo`-wrapped child. This ensures the child doesn't re-render unnecessarily because the parent created a new function reference.

## 4. Backend Architecture

The backend (`server/`) is designed as a centralized API serving both Frontend applications and handling intense AI processing tasks.

### 4.1 MVC Pattern
- **Models**: Defines Mongoose schemas for `User`, `Product`, `Order`, `Review`.
- **Controllers**: encapsulating business logic for request handling.
- **Routes**: API endpoint definitions mapping to controllers.
- **Services**: Isolated domain logic, heavily used for AI and external integrations.

### 4.2 Specialized Service Layers
The `services/` directory is further aimed at handling complexity:
- **rag/**: Dedicated RAG (Retrieval-Augmented Generation) system.
  - *Orchestrators*: Classifies user intent (product advice, size help, etc.).
  - *Retrieval*: Interfaces with Pinecone for vector search.
  - *Generation*: Constructs prompts and calls OpenAI.
- **imageSearch/**: Manages interaction with the self-hosted FashionCLIP service and Qdrant.
- **ingestion/**: Automatically processes product updates to sync with Vector DBs.
- **telegram/**: Handles notifications via n8n integration.

### 4.3 API Design
- **RESTful**: Standard resource-based endpoints (`/api/products`, `/api/orders`).
- **Real-time**: Socket.IO events for live chat and order status updates.
- **Secure**:
  - **JWT Authorization**: Required for protected routes.
  - **Rate Limiting**: Protects AI and Auth endpoints from abuse.

## 5. Development Standards

- **Code Style**:
  - Use **ES6+ features** and **Async/Await** patterns.
  - **Functional Components** with Hooks are mandatory for React.
- **Styling**:
  - **Client**: Use **CSS Modules** for component-scoped styling and **GSAP** for complex animations.
  - **Admin**: Use **TailwindCSS** and **Shadcn/ui** for rapid, consistent UI development.
- **Naming Conventions**:
  - **Components**: PascalCase (`ProductCard.jsx`).
  - **Functions/Vars**: camelCase (`fetchProducts`).
  - **Files**: camelCase for logic (`authService.js`), PascalCase for components.
- **AI Integration**:
  - All AI logic resides in the backend `services/` layer; frontends only send prompts/images and render responses.
