# Hướng dẫn & Nguyên tắc Phát triển Dự án Devenir (Copilot Instructions)

Tài liệu này định nghĩa các tiêu chuẩn, nguyên tắc và hướng dẫn tối ưu hóa để đảm bảo dự án **Devenir** đạt hiệu suất cao nhất, code chất lượng và trải nghiệm người dùng xuất sắc.

## 1. Tầm nhìn & Quy mô (Scope)

**Devenir** là nền tảng E-commerce thời trang nam cao cấp, Visual-First, tích hợp AI (RAG, Visual Search) và Tự động hóa (n8n).
*   **Tech Stack:** MERN (MongoDB, Express, React, Node.js) + Vite + Pinecone/Qdrant.
*   **Architecture:** Client (React), Admin (React + Typescript), Server (Node.js).

---

## 2. Nguyên tắc Cốt lõi (Core Principles)

### 🚀 Performance First (Tối ưu Hiệu năng)
*   **Lazy Loading:** Luôn áp dụng `React.lazy` và `Suspense` cho các Route components và các thành phần nặng (Charts, Maps, Modals).
*   **Image Optimization:** Sử dụng format **WebP** cho tất cả ảnh tĩnh. Với ảnh động từ Cloudinary, luôn dùng tham số `f_auto,q_auto`.
*   **Minimize Re-renders:** Sử dụng `useMemo` cho các tính toán phức tạp và `useCallback` cho các function prop. Hạn chế passing object/array literals trực tiếp vào props.
*   **Backend Response:** API response phải dưới **200ms**. Sử dụng `.lean()` trong Mongoose cho các query `GET`. Index database đầy đủ.

### 🎨 Visual & UX Excellence (Trải nghiệm & Thẩm mỹ)
*   **Premium Feel:** Giao diện phải mang cảm giác cao cấp. Sử dụng khoảng trắng hợp lý, typography sang trọng (Inter/Outfit).
*   **Micro-interactions:** Thêm hiệu ứng hover, transition mượt mà (0.3s ease) cho mọi phần tử tương tác. Sử dụng thư viện `framer-motion` hoặc `GSAP` cho animations.
*   **Loading States:** **KHÔNG BAO GIỜ** để màn hình trắng. Sử dụng Skeleton loading hoặc Spinner (Loading component) cho mọi trạng thái chờ.
*   **Feedback:** Luôn thông báo trạng thái thành công/thất bại (Toast notification) cho mọi hành động của user (Thêm giỏ hàng, Thanh toán, Lưu thay đổi).

### 🛠 Clean Code & Maintainability
*   **DRY (Don't Repeat Yourself):** Tách logic lặp lại thành Custom Hooks (Frontend) hoặc Service functions (Backend).
*   **Modular Architecture:** Mỗi component/function chỉ làm một việc duy nhất (Single Responsibility).
*   **Consistensy:** Tuân thủ chặt chẽ Naming Convention đã định nghĩa.

---

## 3. Hướng dẫn Tối ưu hóa Cụ thể

### Frontend (React/Vite)

1.  **Component Structure:**
    *   Tách biệt `Presentational Components` (UI) và `Container Components` (Logic/Data fetching).
    *   Đặt file CSS Module ngay cạnh component (`Component.jsx`, `Component.module.css`).

3.  **Data Fetching (React Query / TanStack Query):**
    *   **Architecture:** Move all `useQuery` and `useMutation` hooks into dedicated custom hooks in `client/src/hooks/` or `client/src/services/` (e.g., `useProducts.js`, `useCart.js`). Don't call `useQuery` directly in components.
    *   **Caching Strategy:**
        *   Set proper `staleTime` (e.g., 5 mins for categories, 30s for order status) to prevent unnecessary re-fetches.
        *   Use `gcTime` (garbage collection) to keep unused data in cache for quick navigations.
    *   **Query Keys:** Use consistent query key factories (arrays) like `['products', 'list', { category: 'men' }]` for easy invalidation.
    *   **UX Optimization:**
        *   Use `placeholderData: keepPreviousData` for pagination to prevent layout shift.
        *   Prefetch critical data on hover/interaction.
        *   Handle `isLoading` and `isError` states gracefully with dedicated UI components.

4.  **HTTP Requests (Axios):**
    *   **Architecture:** Use a centralized Axios instance (`client/src/api/axiosClient.js`) with base URL and timeout configuration.
    *   **Interceptors:** 
        *   **Request:** Auto-attach access tokens (JWT) to headers.
        *   **Response:** Centralized error handling (e.g., auto-logout on 401, refresh token logic, standardized error messages).
    *   **Usage:** Use this Axios instance inside your Custom Hooks or Service functions. Avoid `fetch` API for consistency.

5.  **Bundle Optimization:**
    *   Tránh import toàn bộ thư viện lớn (vd: `import { button } from 'lodash'` thay vì `import _ from 'lodash'`).
    *   Sử dụng Dynamic Imports cho các tính năng ít dùng.

4.  **Admin Dashboard:**
    *   Xử lý data lớn phía server (Pagination), không load toàn bộ database về client.

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

### Frontend (React)
*   **Components:** `PascalCase` (e.g., `ProductCard.jsx`).
*   **Hooks:** `use` prefix, camelCase (e.g., `useCart.js`).
*   **Utils/Helpers:** camelCase (e.g., `formatCurrency.js`).
*   **Constants:** SCREAMING_SNAKE_CASE (e.g., `API_BASE_URL`).

---

## 5. Workflows & Automation (n8n)

*   **Webhook Security:** Luôn verify webhook signature hoặc dùng secret token cho các endpoint gọi từ n8n.
*   **Error Reporting:** Nếu workflow n8n fail, phải có cơ chế log hoặc báo về Telegram Admin.
*   **Documentation:** Mọi workflow mới phải được document trong `.agent/workflows/`.

---

## 6. Git Workflow

*   **Branches:** `main` (production), `develop` (staging).
*   **Commit Message:** Rõ ràng, bắt đầu bằng động từ (e.g., "Add Telegram notification", "Fix loading spinner").