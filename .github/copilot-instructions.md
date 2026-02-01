# Hướng dẫn & Nguyên tắc Phát triển Dự án Devenir (Copilot Instructions)

Tài liệu này định nghĩa các tiêu chuẩn, nguyên tắc và hướng dẫn tối ưu hóa để đảm bảo dự án **Devenir** đạt hiệu suất cao nhất, code chất lượng và trải nghiệm người dùng xuất sắc.

## 1. Tầm nhìn & Quy mô (Scope)

**Devenir** là nền tảng E-commerce thời trang cao cấp, Visual-First, tích hợp AI (RAG, Visual Search) và Tự động hóa (n8n).
*   **Tech Stack:** MERN (MongoDB, Express, React, Node.js) + Vite + Pinecone/Qdrant.
*   **Architecture:** Client (React + Typescript), Admin (React + Typescript), Server (Node.js).

---

## 2. Nguyên tắc Cốt lõi (Core Principles)

### Performance First (Tối ưu Hiệu năng)
*   **Lazy Loading:** Luôn áp dụng `React.lazy` và `Suspense` cho các Route components và các thành phần nặng (Charts, Maps, Modals).
*   **Image Optimization:** Sử dụng format **WebP** cho tất cả ảnh tĩnh. Với ảnh động từ Cloudinary, luôn dùng tham số `f_auto,q_auto`.
*   **Minimize Re-renders:** Sử dụng `useMemo` cho các tính toán phức tạp và `useCallback` cho các function prop. Hạn chế passing object/array literals trực tiếp vào props.
*   **Backend Response:** API response phải dưới **200ms**. Sử dụng `.lean()` trong Mongoose cho các query `GET`. Index database đầy đủ.

### Visual & UX Excellence (Trải nghiệm & Thẩm mỹ)
*   **Premium Feel:** Giao diện phải mang cảm giác cao cấp. Sử dụng khoảng trắng hợp lý, typography sang trọng (Inter/Outfit).
*   **Micro-interactions:** Thêm hiệu ứng hover, transition mượt mà (0.3s ease) cho mọi phần tử tương tác. Sử dụng thư viện `framer-motion` hoặc `GSAP` cho animations.
*   **Loading States:** **KHÔNG BAO GIỜ** để màn hình trắng. Sử dụng Skeleton loading hoặc Spinner (Loading component) cho mọi trạng thái chờ.
*   **Feedback:** Luôn thông báo trạng thái thành công/thất bại (Toast notification) cho mọi hành động của user (Thêm giỏ hàng, Thanh toán, Lưu thay đổi).

### Clean Code & Maintainability
*   **DRY (Don't Repeat Yourself):** Tách logic lặp lại thành Custom Hooks (Frontend) hoặc Service functions (Backend).
*   **Modular Architecture:** Mỗi component/function chỉ làm một việc duy nhất (Single Responsibility).
*   **Consistensy:** Tuân thủ chặt chẽ Naming Convention đã định nghĩa.

---

## 3. Hướng dẫn Tối ưu hóa Cụ thể

### Frontend (React/Vite + TypeScript)

1.  **Project Structure (Feature-Based Architecture):**
    ```
    src/
    ├── core/                    # Core infrastructure
    │   ├── api/                 # Axios client, interceptors
    │   ├── stores/              # Zustand global stores (auth, ui)
    │   ├── providers/           # React providers
    │   └── lib/                 # Third-party configs (queryClient, socket)
    │
    ├── shared/                  # Shared/reusable code
    │   ├── components/          # UI components (Button, Modal, etc.)
    │   ├── hooks/               # Shared hooks (useDebounce, useMediaQuery)
    │   ├── utils/               # Utility functions
    │   └── types/               # Shared TypeScript types
    │
    └── features/                # Feature modules (self-contained)
        ├── auth/
        │   ├── api/             # Auth API calls
        │   ├── components/      # Auth-specific components
        │   ├── hooks/           # useAuth (React Query + Zustand)
        │   ├── pages/           # Auth pages
        │   └── types/           # Auth types
        ├── products/
        ├── cart/
        └── checkout/
    ```

2.  **State Management Strategy (Critical Rule):**
    
    **Rule: Chọn đúng tool cho đúng loại state**
    
    | Loại State | Tool | Ví dụ | Lý do |
    |------------|------|-------|-------|
    | **Server State** | **React Query** | Products, Cart, Orders, User data từ API | Auto caching, refetching, sync với server |
    | **UI Global State** | **Zustand** | Auth (token, user), Theme, Sidebar open/close | Share giữa nhiều components, persist localStorage |
    | **Local State** | **useState/useReducer** | Form inputs, Modal visibility, Accordion expanded | Chỉ dùng trong component, không cần share |
    
    **KHÔNG BAO GIỜ:**
    - Dùng Zustand cho server data (products, orders) → Dùng React Query
    - Dùng React Query cho UI state (theme, sidebar) → Dùng Zustand
    - Lift state up quá mức → Giữ state ở component gần nhất cần nó
    
    **Ví dụ chuẩn:**
    ```typescript
    // Server State - React Query
    const { data: products, isLoading } = useProducts({ category: 'men' });
    
    // UI Global State - Zustand
    const { user, isAuthenticated, login } = useAuthStore();
    const { theme, setTheme } = useUIStore();
    
    // Local State - useState
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    ```

3.  **React Query (Server State) - Best Practices:**
    *   **Architecture:** 
        - Tất cả `useQuery`/`useMutation` phải nằm trong custom hooks tại `features/*/hooks/`
        - API calls thuần (không hook) nằm trong `features/*/api/`
        - **KHÔNG BAO GIỜ** gọi `useQuery` trực tiếp trong component
    
    *   **Query Keys Factory:**
        ```typescript
        // core/lib/queryClient.ts
        export const queryKeys = {
          products: {
            all: ['products'],
            lists: () => [...queryKeys.products.all, 'list'],
            list: (filters) => [...queryKeys.products.lists(), filters],
            detail: (id) => [...queryKeys.products.all, 'detail', id],
          },
        };
        ```
    
    *   **Caching Strategy:**
        - `staleTime`: 5 phút cho data ít thay đổi (categories), 30s cho data realtime (order status)
        - `gcTime`: 10 phút để giữ cache cho navigation nhanh
        - `placeholderData: keepPreviousData` cho pagination (tránh layout shift)
    
    *   **UX Optimization:**
        - Prefetch data on hover (product cards)
        - Luôn handle `isLoading`, `isError`, `isFetching` states
        - Optimistic updates cho mutations (add to cart)

4.  **Zustand (UI Global State) - Best Practices:**
    *   **Location:** Tất cả stores nằm trong `core/stores/`
    *   **Persist:** Dùng `persist` middleware cho auth, theme
    *   **Atomic Selectors:** Chỉ subscribe vào data cần thiết
        ```typescript
        // Bad - re-render khi bất kỳ auth state nào thay đổi
        const authStore = useAuthStore();
        
        // Good - chỉ re-render khi user thay đổi
        const user = useAuthStore((state) => state.user);
        ```
    
    *   **Stores:**
        - `authStore.ts`: user, token, isAuthenticated, login(), logout()
        - `uiStore.ts`: theme, sidebarOpen, chatOpen, modals

5.  **HTTP Requests (Axios):**
    *   **Centralized Client:** `core/api/apiClient.ts` với base URL, timeout, interceptors
    *   **Request Interceptor:** Auto-attach JWT token từ Zustand authStore
    *   **Response Interceptor:** Standardize error messages, handle 401 (logout)
    *   **Usage:** Chỉ import `apiClient` trong API layer (`features/*/api/`), KHÔNG trong components

6.  **TypeScript:**
    *   **Strict mode:** Enable `strict: true` trong `tsconfig.json`
    *   **Path Aliases:** `@/features/*`, `@/shared/*`, `@/core/*`
    *   **Type Exports:** Mỗi feature export types qua barrel file `index.ts`
    *   **No `any`:** Sử dụng `unknown` hoặc define proper types

7.  **Component Structure:**
    *   **Presentational vs Container:** Tách UI (JSX) khỏi logic (hooks, data fetching)
    *   **File Collocation:** Component + CSS Module + Types cùng folder
        ```
        Button/
        ├── index.ts
        ├── Button.tsx
        ├── Button.module.css
        └── Button.types.ts
        ```
    *   **Single Responsibility:** Mỗi component làm 1 việc duy nhất

8.  **Bundle Optimization:**
    *   Lazy load routes và heavy components (Charts, Modals)
    *   Named imports để tree-shaking (`import { debounce } from 'lodash-es'`)
    *   Dynamic imports cho features ít dùng

### Backend (Node.js/Express)

1.  **Database Strategy:**
    *   **Indexing:** Đảm bảo các trường hay query (`sku`, `slug`, `category`, `status`) đều được đánh index.
    *   **Pipeline Optimization:** Sử dụng Aggregation Pipeline cho các báo cáo thống kê thay vì xử lý loop trong JS.

2.  **Architecture Pattern:**
    *   **Service Layer:** Logic nghiệp vụ nằm trong `services/`, Controller chỉ điều phối request/response.
    *   **Helper:** Các hàm tiện ích (gửi mail, format date) nằm trong `services/` hoặc `utils/`.

3.  **Caching (Redis - Tương lai):**
    *   Cache các dữ liệu ít thay đổi (Config, Categories, Product Details) để giảm tải DB.

4.  **Error Handling:**
    *   Sử dụng `asyncHandler` cho mọi async route.
    *   Log lỗi chi tiết nhưng trả về message thân thiện cho Client.

### AI & RAG Features

1.  **Context Window:** Giới hạn context gửi lên LLM để tối ưu chi phí và tốc độ. Chỉ gửi thông tin sản phẩm liên quan nhất.
2.  **Streaming:** (Nếu có thể) Stream response từ LLM về client để giảm cảm giác chờ đợi.
3.  **Fallback:** Luôn có kịch bản xử lý khi AI service (OpenAI/Pinecone) bị lỗi hoặc timeout.

---

## 4. Naming Conventions (Quy chuẩn Đặt tên)

### Database (MongoDB)
*   **Collections:** Plural, lowercase (e.g., `users`, `products`, `orders`).
*   **Fields:** camelCase (e.g., `basePrice`, `isPublished`).

### Backend (Node.js)
*   **Files:**
    *   Models: `PascalCase` (e.g., `ProductModel.js`)
    *   Controllers: `PascalCase` (e.g., `PaymentController.js`)
    *   Services: `camelCase` (e.g., `emailService.js`, `telegramNotification.js`)
    *   Routes: `camelCase` (e.g., `productRoutes.js`)

### Frontend (React + TypeScript)
*   **Files & Folders:**
    *   Components: `PascalCase` (e.g., `ProductCard/`, `ProductCard.tsx`)
    *   Hooks: `use` prefix, camelCase (e.g., `useCart.ts`, `useProducts.ts`)
    *   Utils: camelCase (e.g., `formatCurrency.ts`, `validation.ts`)
    *   Types: `*.types.ts` hoặc `*.model.ts` (e.g., `product.types.ts`, `user.model.ts`)
    *   API: camelCase với suffix `Api` (e.g., `productApi.ts`, `authApi.ts`)
    *   Stores: camelCase với suffix `Store` (e.g., `authStore.ts`, `uiStore.ts`)
    
*   **Variables & Functions:**
    *   Variables: camelCase (e.g., `isLoading`, `userProfile`)
    *   Functions: camelCase (e.g., `fetchProducts`, `handleSubmit`)
    *   React Components: PascalCase (e.g., `const ProductCard = () => {}`)
    *   Constants: SCREAMING_SNAKE_CASE (e.g., `API_BASE_URL`, `MAX_ITEMS`)
    
*   **TypeScript Types:**
    *   Interfaces: `PascalCase` với prefix `I` optional (e.g., `User`, `IProduct`)
    *   Types: `PascalCase` (e.g., `ProductParams`, `AuthState`)
    *   Enums: `PascalCase` cho enum name, SCREAMING_SNAKE_CASE cho values
        ```typescript
        enum OrderStatus {
          PENDING = 'PENDING',
          PROCESSING = 'PROCESSING',
          COMPLETED = 'COMPLETED',
        }
        ```

---

## 5. Workflows & Automation (n8n)

*   **Webhook Security:** Luôn verify webhook signature hoặc dùng secret token cho các endpoint gọi từ n8n.
*   **Error Reporting:** Nếu workflow n8n fail, phải có cơ chế log hoặc báo về Telegram Admin.
*   **Documentation:** Mọi workflow mới phải được document trong `.agent/workflows/`.

---

## 6. Git Workflow

*   **Branches:** `main` (production), `develop` (staging).
*   **Commit Message:** Rõ ràng, bắt đầu bằng động từ (e.g., "Add Telegram notification", "Fix loading spinner").