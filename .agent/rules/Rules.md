# Quy tắc & Hướng dẫn Phát triển (Rules & Guidelines)

## 1. Nguyên tắc Cốt lõi (Core Principles)
*   **Performance First:**
    *   Lazy loading cho Routing và Components nặng.
    *   Image Optimization: WebP, `f_auto,q_auto`.
    *   API Response time < 200ms. Sử dụng `.lean()` cho GET requests.
*   **Visual & UX Excellence:**
    *   Giao diện Premium, Typography chuẩn (Inter/Outfit).
    *   Micro-interactions: Hover effects, smooth transitions (0.3s).
    *   Luôn xử lý Loading states (Skeleton/Spinner) và không để màn hình trắng.
    *   Feedback đầy đủ (Toast notifications) cho hành động user.
*   **Clean Code:**
    *   DRY (Don't Repeat Yourself).
    *   SRP (Single Responsibility Principle).

## 2. Frontend Best Practices (React/TS)
*   **React Query:**
    *   Tách biệt API calls (`features/*/api`) và Hooks (`features/*/hooks`).
    *   Sử dụng **Query Keys Factory** (`core/lib/queryClient.ts`) để quản lý keys tập trung.
    *   Cấu hình `staleTime` (5m static / 30s realtime) và `gcTime` phù hợp.
*   **Zustand:**
    *   Lưu stores tại `core/stores/`.
    *   Sử dụng Atomic Selectors: `const user = useAuthStore(state => state.user)` để tối ưu render.
*   **TypeScript:**
    *   Cấu hình `strict: true`.
    *   Tuyệt đối hạn chế `any`. Sử dụng `unknown` hoặc define Type/Interface rõ ràng.
    *   Sử dụng Path Aliases (`@/features`, `@/shared`) thay vì relative paths dài.
*   **Component Design:**
    *   Tách biệt Presentational (UI) và Container (Logic) pattern khi cần thiết.
    *   File Collocation: Component (`.tsx`), Style (`.module.css`), Type (`.ts`) chung thư mục.

## 3. Backend Best Practices (Node.js)
*   **Error Handling:**
    *   Sử dụng `asyncHandler` wrapper cho routes.
    *   Log lỗi chi tiết (cho dev), trả message thân thiện (cho user).
*   **Database:**
    *   Đảm bảo Indexing đầy đủ.
    *   Tối ưu query, hạn chế N+1 problem.

## 4. Quy chuẩn Đặt tên (Naming Conventions)
*   **Frontend:**
    *   Components/Interfaces: `PascalCase` (e.g., `ProductCard`, `IUser`).
    *   Hooks: `camelCase` với prefix `use` (e.g., `useCart`).
    *   Variables/Functions: `camelCase`.
    *   Constants: `SCREAMING_SNAKE_CASE`.
*   **Backend:**
    *   Models: `PascalCase` (e.g., `ProductModel`).
    *   Controllers: `PascalCase` (e.g., `OrderController`).
    *   Services/Routes: `camelCase`.
    *   DB Collections: Plural, lowercase (e.g., `products`).
    *   DB Fields: `camelCase`.

## 5. Quy trình & Workflow
*   **Git:**
    *   Branches: `main` (Production), `develop` (Staging).
    *   Commits: Rõ ràng, bắt đầu bằng động từ (e.g., `Add login logic`, `Fix styling`).
*   **n8n Automation:**
    *   Bảo mật Webhook (Signature/Token).
    *   Cơ chế báo lỗi tự động khi workflow fail.
