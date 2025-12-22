# 🎯 Hướng dẫn & Nguyên tắc Phát triển - DEVENIR

Tài liệu này định nghĩa các tiêu chuẩn, nguyên tắc và hướng dẫn tối ưu hóa để đảm bảo hệ thống **DEVENIR** (cả Client và Admin) đạt hiệu suất cao, code chất lượng và trải nghiệm người dùng "Premium & Wow".

***

## 1. Tầm nhìn & Quy mô (Scope)

**DEVENIR** là nền tảng thương mại điện tử thời trang cao cấp, tích hợp AI Personal Shopper và Visual Search.

- **Tech Stack Client**: React 18 + Vite + JavaScript/TypeScript + CSS Modules + GSAP (Animations).
- **Tech Stack Admin**: React 18 + TypeScript + Shadcn/ui + TailwindCSS + Recharts.
- **State Management**: **The Holy Trinity** (React Query, Zustand, useState).
- **Target**: High interactivity ("Wow" factor), Seamless AI integration, Real-time updates.

***

## 2. Nguyên tắc Cốt lõi (Core Principles)

### 🚀 Performance First (Tối ưu Hiệu suất)

**BẮT BUỘC** áp dụng các kỹ thuật sau để đảm bảo ứng dụng luôn mượt mà (60fps):

1.  **React.memo**:
    - Wrap tất cả các UI Component thuần (Props không đổi -> Render giống hệt) bằng `React.memo`.
    - Ví dụ: `ProductCard`, `Button`, `ReviewItem`, `ColorSwatch`.
2.  **useCallback**:
    - Bất kỳ hàm nào được truyền xuống component con có sử dụng `React.memo` **BẮT BUỘC** phải được bọc trong `useCallback` để giữ reference ổn định.
3.  **useMemo**:
    - Sử dụng cho mọi tính toán phức tạp (filter product list, sort array, format data cho chart).
    - Sử dụng để lưu các object config static (ví dụ: `const chartConfig = useMemo(() => ({...}), [])`) để tránh tạo object mới mỗi lần render.

### 🎨 Visual & UX Excellence ("The Wow Factor")

- **Aesthetics**: Thiết kế phải toát lên vẻ "Premium". Sử dụng không gian trắng (whitespace), typography sang trọng và hình ảnh chất lượng cao.
- **Micro-interactions**:
    - Hover effects mượt mà trên sản phẩm.
    - Hiệu ứng chuyển trang (Page Transitions).
    - **Typing Indicators**: Hiệu ứng "AI đang suy nghĩ..." tự nhiên.
- **Feedback**:
    - Toast notifications cho mọi hành động (Thêm giỏ hàng, Thanh toán, Lưu lỗi).
    - Skeleton UI thay vì spinner đơn điệu khi tải danh sách sản phẩm.

### 🛠 Clean Code & Maintainability

- **Separation of Concerns**:
    - **UI Components**: Chỉ render UI (dumb components).
    - **Feature Hooks**: Chứa logic nghiệp vụ (`useCart`, `useChat`).
    - **Services**: Gọi API (`authService`, `productService`).
- **Admin vs Client**:
    - **Admin**: Ưu tiên tốc độ phát triển, dùng TailwindCSS + Shadcn/ui.
    - **Client**: Ưu tiên tùy biến giao diện cao cấp, dùng CSS Modules + Vanilla CSS.

***

## 3. Quy chuẩn Đặt tên (Naming Conventions)

### ⚛️ React Components

| Element | Convention | Example |
| :-- | :-- | :-- |
| **Components** | PascalCase | `ProductCard`, `ChatWidget`, `NavBar` |
| **Admin Pages** | PascalCase + `Page` | `ProductsPage.tsx`, `OrdersPage.tsx` |
| **Client Pages** | PascalCase | `Home.jsx`, `Shop.jsx`, `Cart.jsx` |

### 🪝 Hooks & Stores

| Element | Convention | Example |
| :-- | :-- | :-- |
| **Custom Hooks** | `use` + PascalCase | `useDebounce.ts`, `useSocket.ts` |
| **Zustand Stores** | `use` + Entity + `Store` | `useCartStore.ts`, `useUIStore.ts` |
| **Query Hooks** | `use` + Action | `useProducts.ts`, `useCreateOrder.ts` |

### 🎨 Styling (Client: CSS Modules)

| Element | Convention | Example |
| :-- | :-- | :-- |
| **File Name** | ComponentName + `.module.css` | `ProductCard.module.css` |
| **Class Name** | camelCase | `.productCard`, `.addToCartBtn` |

```jsx
// Usage in Client
import styles from './ProductCard.module.css';

<div className={styles.productCard}>
    <button className={styles.addToCartBtn}>Add to Cart</button>
</div>
```

***

## 4. Quản lý State: Mô hình "The Holy Trinity"

Chúng ta tuân thủ nghiêm ngặt mô hình phân chia state sau để code sạch và tối ưu:

| Loại State | Dùng cái gì? | Ví dụ cụ thể |
| --- | --- | --- |
| **Server State** <br> *(Dữ liệu API)* | **React Query** | Danh sách sản phẩm, thông tin User profile, data biểu đồ. |
| **Global Client State** <br> *(Dữ liệu dùng chung)* | **Zustand** | Dark mode, User đã login chưa, Giỏ hàng tạm tính, Notification toàn app, Toggle Sidebar/Modals. |
| **Local State** <br> *(Dữ liệu tại chỗ)* | **useState / useReducer** | Form input (`onChange`), Dropdown đóng mở, Tab active, Hover state. |

**Tóm lại:**
*   Dữ liệu từ **Backend** trả về? 👉 Vứt cho **React Query**.
*   Dữ liệu **Frontend** tự sinh ra, nhiều nơi cần dùng? 👉 Vứt cho **Zustand**.
*   Dữ liệu lặt vặt chỉ dùng ở **một chỗ**? 👉 Giữ lại **useState**.

**Quy tắc React Query:**
- Sử dụng `staleTime` hợp lý (e.g., 5 phút cho Products, Infinity cho Configs).
- Dùng `keepPreviousData: true` khi phân trang.

**Quy tắc Zustand:**
- Sử dụng Atomic Selectors để tránh re-render cả trang:
  ```javascript
  // ✅ GOOD
  const theme = useUIStore(state => state.theme);
  // ❌ BAD
  const { theme } = useUIStore();
  ```

***

## 5. Xử lý Lỗi (Error Handling)

### 🛡️ Chiến lược

1.  **API Level**:
    - Interceptor chặn 401: Thử refresh token, nếu fail -> Logout & Redirect Login.
    - Log lỗi 500 ra console/sentry để debug.
2.  **UI Level**:
    - **React Query**: Dùng `onError` callback để hiện Toast lỗi cụ thể (ví dụ: "Thanh toán thất bại: Số dư không đủ").
    - **Boundary**: Wrap các Widget độc lập (như `ChatWidget`) trong Error Boundary để lỗi AI không làm crash cả trang web.

***

## 6. Git Workflow & Checklist

### 🌳 Branching
- `main`: Production ready code.
- `dev`: Development branch.
- `feat/feature-name`: Tính năng mới (e.g., `feat/visual-search`).
- `fix/bug-name`: Sửa lỗi (e.g., `fix/cart-calculation`).

### ✅ Checklist trước khi Merge

- [ ] **Performance Review**: Đã dùng `useCallback` cho các function prop chưa? Đã dùng `React.memo` cho List Item chưa?
- [ ] **Animations**: Đã kiểm tra memory leak của GSAP? Animation có mượt trên mobile?
- [ ] **Responsive**: Giao diện có vỡ trên Mobile (<768px) không?
- [ ] **Console**: Không còn `console.log` thừa.
- [ ] **Types**: (Với Admin) Không còn warning TypeScript.

***

**🎯 Mục tiêu**: Xây dựng Devenir trở thành chuẩn mực mới về trải nghiệm mua sắm thời trang thông minh!
