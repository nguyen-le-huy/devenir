---
trigger: always_on
---

# Kiến trúc Dự án Devenir

## 1. Tổng quan & Tech Stack
**Devenir** là nền tảng E-commerce thời trang nam cao cấp, Visual-First.
*   **Client:** React, Vite, TypeScript
*   **Admin:** React, TypeScript
*   **Server:** Node.js, Express, MongoDB (Mongoose)
*   **Database:** MongoDB (Data), Pinecone/Qdrant (Vector Search), Redis (Caching - Future)
*   **Automation:** n8n (Visual workflows)

## 2. Cấu trúc Frontend (Feature-Based Architecture)
Dự án tuân thủ cấu trúc Feature-Based để đảm bảo tính module và dễ mở rộng.

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
└── features/                # Feature modules (Self-contained)
    ├── [feature-name]/      # e.g., auth, products, cart
    │   ├── api/             # API calls
    │   ├── components/      # Feature-specific components
    │   ├── hooks/           # Logic hooks (React Query + Stores)
    │   ├── pages/           # Pages for this feature
    │   └── types/           # Types specific to feature
```

## 3. Chiến lược Quản lý State (State Management)
Phân tách rõ ràng trách nhiệm của các thư viện quản lý state:

| Loại State | Công nghệ | Mục đích | Ví dụ |
|------------|----------|----------|-------|
| **Server State** | **React Query** | Quản lý data từ API (caching, sync, loading/error states). | Products list, Order status, User profile load từ DB. |
| **UI Global State** | **Zustand** | Quản lý state toàn cục Client-side, không phụ thuộc server. | Auth Token, Theme mode, Sidebar toggle, Toast messages. |
| **Local State** | **useState / useReducer** | State nội bộ của component. | Form inputs, Toggle modal visibility, Active tab. |

**Quy tắc:**
*   Không dùng Zustand để lưu trữ dữ liệu server (dùng React Query thay thế).
*   Không dùng React Query cho các UI state thuần túy.

## 4. Kiến trúc Backend
*   **Pattern:** Service Layer Pattern.
    *   `Controllers`: Tiếp nhận request, validate input ngắn gọn, gọi Service, trả response. Không chứa business logic phức tạp.
    *   `Services`: Chứa toàn bộ logic nghiệp vụ, giao tiếp với Database.
    *   `Utils/Helpers`: Các hàm tiện ích dùng chung (Email, Formatters).
*   **Database Strategy:**
    *   Sử dụng Mongoose ODM.
    *   Bắt buộc Indexing cho các trường frequent query (`sku`, `slug`, `status`).
    *   Aggregation Pipeline cho báo cáo/thống kê.
