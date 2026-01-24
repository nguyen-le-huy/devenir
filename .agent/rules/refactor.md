# Kế hoạch Refactor Client (Devenir)

Tài liệu này định nghĩa lộ trình refactor dự án `client` từ JavaScript sang TypeScript và tái cấu trúc theo kiến trúc Feature-Based (Enterprise Standard).

## 1. Mục tiêu (Goals)
*   **Type Safety:** Chuyển đổi 100% code sang TypeScript để giảm runtime errors.
*   **Scalability:** Áp dụng Feature-Based Architecture để dễ dàng mở rộng và bảo trì.
*   **Performance:** Tối ưu hóa bundle size và code splitting.
*   **Professionalism:** Chuẩn hóa code style, naming convention và commit flow.

## 2. Lộ trình Thực hiện (Roadmap)

### Giai đoạn 1: Thiết lập Cơ sở hạ tầng (Infrastructure)
*   [ ] **Cài đặt TypeScript:**
    *   Install: `typescript`, `@types/node`, `@types/react`, `@types/react-dom`, `@types/react-router-dom`.
    *   Tạo `tsconfig.json` (Strict Mode).
    *   Tạo `vite.config.ts` thay thế `vite.config.js`.
*   [ ] **Cấu hình Path Aliases:**
    *   Setup `@/*` mapping trong `tsconfig.json` và `vite.config.ts`.
    *   Structure dự kiến: `@/core`, `@/shared`, `@/features`.
*   [ ] **Linting & Formatting:**
    *   Cấu hình ESLint hỗ trợ TypeScript.
    *   Setup Prettier.

### Giai đoạn 2: Tái cấu trúc Thư mục (Restructuring)
Di chuyển file từ cấu trúc cũ (Layer-based) sang cấu trúc mới (Feature-based).

**Cấu trúc Đích:**
```
src/
├── core/                    # Infrastructure code
│   ├── api/                 # Axios client, Interceptors
│   ├── config/              # Env variables, Constants
│   ├── libs/                # 3rd party setup (QueryClient, Socket)
│   ├── routes/              # Route definitions
│   └── stores/              # Global Stores (Zustand)
│
├── shared/                  # Reusable code
│   ├── components/          # UI Kit (Button, Input, Modal...)
│   ├── hooks/               # Generic Hooks (useDebounce, useClickOutside)
│   └── utils/               # Helper functions (formatMoney, validators)
│
└── features/                # Business Logic Modules
    ├── auth/                # Login, Register, Profile
    ├── products/            # Listen, Detail, Search
    ├── cart/                # Cart management
    ├── checkout/            # Checkout flow
    └── home/                # Landing page elements
```

**Ví dụ chi tiết: Cấu trúc 1 Feature (`features/auth`)**
```typescript
features/auth/
├── api/                     # API calls thuần (Axios)
│   └── authApi.ts           # getLogin, postRegister
│
├── hooks/                   # Logic hooks (React Query + Stores)
│   └── useAuth.ts           # useLoginMutation, useUserQuery
│
├── components/              # UI Components chỉ dùng trong Auth Feature                 # Pages (Login, Register)
├── types/                   # Types
└── index.ts                 # Public API
```

**Kế hoạch Map File Cũ -> Mới (Mapping Strategy):**

| Feature | File Cũ (Legacy) | File Mới (New Structure) | Ghi chú |
| :--- | :--- | :--- | :--- |
| **Auth** | `services/authService.js` | `features/auth/api/authApi.ts` | |
| | `stores/useAuthStore.js` | `core/stores/authStore.ts` | Global store giữ ở `core` |
| **Products** | `services/productService.js` | `features/products/api/productApi.ts` | Axios calls only |
| | `hooks/useProducts.js` | `features/products/hooks/useProducts.ts` | React Query hooks |
| | `hooks/useProductFilter.js` | `features/products/hooks/useProductFilter.ts` | UI Logic only |
| | `services/categoryService.js` | `features/products/api/categoryApi.ts` | Gộp vào products domain |
| | `services/colorService.js` | `features/products/api/attributeApi.ts` | Hoặc tách feature attributes |
| **Cart** | `services/cartService.js` | `features/cart/api/cartApi.ts` | |
| | `hooks/useCart.js` | `features/cart/hooks/useCart.ts` | |
| **Orders** | `services/orderService.js` | `features/orders/api/orderApi.ts` | |
| | `hooks/useOrders.js` | `features/orders/hooks/useOrders.ts` | |
| | `services/trackingService.ts` | `features/tracking/api/trackingApi.ts` | |
| **Common** | `services/api.js` | `core/api/apiClient.ts` | |
| | `hooks/useScrollLock.js` | `shared/hooks/useScrollLock.ts` | |
| | `hooks/useLenis.js` | `shared/hooks/useSmoothScroll.ts` | |

### Giai đoạn 3: Chuyển đổi sang TypeScript (Migration)
Thực hiện từng Feature một để tránh break toàn bộ dự án.

1.  **Utils & Types:**
    *   Chuyển đổi các file `utils/*.js` sang `.ts`.
    *   Định nghĩa các `types/*.ts` cơ bản (Product, User, APIResponse).
2.  **Components (Shared):**
    *   Rename `.jsx` -> `.tsx`.
    *   Thay thế `prop-types` bằng `interface Props`.
3.  **Features & Pages:**
    *   Chuyển đổi từng page và các component con.
    *   Sử dụng Generics cho React Query hooks.

## 3. Quy chuẩn Code (Coding Standards)

### TypeScript
*   **No ANY:** Hạn chế tối đa sử dụng `any`. Dùng `unknown` nếu chưa rõ type.
*   **Interfaces:** Luôn define Interface cho Props và API Response.
*   **Enums:** Sử dụng Enum hoặc Union Types cho các trạng thái (Status, Role).

### Naming
*   **Components:** PascalCase (`ProductCard.tsx`).
*   **Hooks:** camelCase (`useAuth.ts`).
*   **Constants:** SCREAMING_SNAKE_CASE.

### State Management
*   **Server State:** React Query (trong `features/*/hooks`).
*   **Client State:** Zustand (trong `core/stores`).

---
**Trạng thái Refactor:**
*   [ ] Phase 1: Setup Infrastructure
*   [ ] Phase 2: Restructure Folders
*   [ ] Phase 3: Convert to TS
