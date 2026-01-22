# Admin RAG Workflow - Devenir Operational Intelligence

Tài liệu này mô tả kiến trúc và quy trình hoạt động của Chatbot RAG dành riêng cho Admin, tập trung vào khả năng **Truy xuất dữ liệu vận hành (Operational Analytics)** thay vì chỉ tìm kiếm văn bản đơn thuần.

---

## 1. Tổng quan Chiến lược: Context-Injected Analytics

Khác với Client RAG (tập trung vào Vector Search & Similarity để tư vấn sản phẩm), Admin RAG cần sự **Chính xác tuyệt đối (High Precision)** về số liệu.

| Đặc điểm | Client RAG (Product Advisor) | Admin RAG (Operational Bot) |
| :--- | :--- | :--- |
| **Mục tiêu** | Gợi ý sản phẩm phù hợp style | Báo cáo số liệu chính xác (Doanh thu, Tồn kho) |
| **Dữ liệu** | Tĩnh/Ít thay đổi (Mô tả SP, Blog) | **Động/Real-time** (Đơn hàng, User, Kho) |
| **Công nghệ** | Vector Database (Pinecone) | **Function Calling / Database Query** (MongoDB) |
| **Độ trễ** | Chấp nhận độ trễ index (vài phút) | Yêu cầu số liệu tức thì (Zero latency) |

---

## 2. Kiến trúc Hệ thống

Admin RAG hoạt động theo mô hình **Tool Use Router**: Chatbot đóng vai trò giao diện ngôn ngữ tự nhiên (Natural Language Interface) để điều khiển các truy vấn cơ sở dữ liệu.

```mermaid
flowchart TB
    subgraph AdminLayer["👮 Admin Dashboard"]
        UI[Chat Interface]
    end

    subgraph RouterLayer["🔀 Router & Security"]
        IC[Intent Classifier]
        Auth[Role Guard (Admin Only)]
    end

    subgraph ServiceLayer["⚙️ Admin Analytics Service"]
        Analysis[Intent Analysis (Mini-LLM)]
        
        subgraph Handlers["Data Handlers"]
            Rev[Revenue Handler]
            Cust[Customer CRM Handler]
            Ord[Order Tracker]
            Inv[Inventory Checker]
        end
    end

    subgraph DataLayer["🗄️ Database"]
        DB[(MongoDB Primary)]
    end

    subgraph Generation["✨ Response"]
        Prompt[Context Injection]
        LLM[GPT-4o / LLM Generation]
    end

    UI --> IC
    IC --> Auth
    Auth -- Pass --> Analysis
    Analysis --> Rev & Cust & Ord & Inv
    Rev & Cust & Ord & Inv <--> DB
    Rev & Cust & Ord & Inv --> Prompt
    Prompt --> LLM
    LLM --> UI
```

---

## 3. Quy trình Xử lý Chi tiết (Workflow)

### Bước 1: Intent Classification & Security
*   **Input:** User nhập câu hỏi (VD: *"Doanh thu hôm nay thế nào?"*).
*   **Classifier:** `intent-classifier.js` phát hiện các keyword đặc thù của Admin:
    *   Keyword cơ bản: `doanh thu`, `stock`, `đơn hàng`, `khách`.
    *   Keyword ưu tiên cao (Confidence 0.95): `thông tin khách`, `tìm user`, `user`, `khách hàng`, `check kho`, `kiểm kho`, `số lượng`.
    *   Logic đặc biệt: Bắt các câu bắt đầu bằng "Thông tin...", "Tìm..." nếu không chứa từ khóa sản phẩm.
    *   Result: `{ intent: 'admin_analytics', confidence: 0.95 }`
*   **Security Guard:** `admin-analytics.service.js` kiểm tra `context.customerProfile.role`. Nếu không phải `admin` -> Trả về thông báo từ chối & log cảnh báo.

### Bước 2: Sub-Intent Recognition (Phân tích sâu)
Service `admin-analytics.service.js` gọi `classifyAdminIntent` (Lightweight LLM call) để trích xuất tham số JSON chi tiết:

*   **Prompt:** Input query -> Output JSON với cấu trúc linh hoạt.
*   **Các loại Intent & Metadata:**
    1.  **Revenue (`revenue`)**:
        *   `period`: 'today', 'this_week', 'this_month', 'custom'...
        *   `startDate` / `endDate`: ISO String (AI tự tính dựa trên Current Date được inject vào prompt).
    2.  **Customer (`customer_lookup`)**:
        *   `target`: Tên riêng, Email, hoặc Số điện thoại (VD: "Huy", "098...", "a@gmail.com").
    3.  **Inventory (`product_inventory`)**:
        *   `target`: Tên sản phẩm cụ thể (nếu có).
        *   `status`: 'low_stock', 'out_of_stock', 'all' (nếu hỏi "sắp hết", "kiểm kho").
        *   `threshold`: Số lượng cảnh báo (mặc định 10, hoặc tự điền "dưới 5").
    4.  **Order (`order_status`)**:
        *   `target`: Mã đơn hàng.
    5.  **Export (`inventory_export`, `revenue_export`, `customer_export`)**:
        *   `scope`: 'all', 'low_stock', 'out_of_stock' (Inventory).
        *   `period`: 'today', 'this_week', 'last_month', 'custom' (Revenue).
        *   `context`: Tự động suy luận từ hội thoại trước (VD: Hỏi "sắp hết" -> "export" -> export low_stock).
    6.  **Stats (`customer_stats`)**:
        *   Không cần metadata, trả về tổng số lượng user.

### Bước 3: Data Retrieval (Truy vấn Dữ liệu)
Hệ thống map `type` sang hàm xử lý MongoDB Aggregation/Query tương ứng:

| Sub-Intent | Hàm Xử lý | Logic DB & Tính năng |
| :--- | :--- | :--- |
| `revenue` | `getRevenueData` | Tính tổng doanh thu `paid`/`delivered`. Lấy 5 GD gần nhất. Định dạng tiền tệ **VNĐ**. |
| `customer_lookup` | `getCustomerData` | Tìm kiếm linh hoạt (Regex) trên: `email`, `phone`, `username`, `firstName`, `lastName`. Trả về Profile, Tổng chi tiêu, Hạng Loyalty, **Danh sách địa chỉ**. |
| `customer_stats` | `User.countDocuments()` | Đếm tổng số lượng user trong hệ thống. |
| `order_status` | `getOrderAdminData` | Tìm theo OrderID, Tracking Number. |
| `product_inventory`| `getProductInventoryData`| **Chế độ 1 (Target):** Tìm variants của SP cụ thể.<br>**Chế độ 2 (Scan):** Quét toàn bộ kho tìm SP có `quantity <= threshold`. |
| `inventory_export` | `generateInventoryCSV` | Tạo file CSV báo cáo tồn kho (All/Low/Out) và trả về link download. |
| `revenue_export` | `generateRevenueCSV` | Tạo file CSV báo cáo doanh thu theo kỳ (Ngày/Tuần/Tháng/Qúy/Tùy chỉnh). |
| `customer_export` | `generateCustomerCSV` | Tạo file CSV danh sách khách hàng (Name, Email, Phone, Role, Total Spent, Total Orders). |

### Bước 4: Context Injection & Generation
Dữ liệu thô (Raw JSON) được inject vào System Prompt.
*   **Quy tắc:** Bắt buộc định dạng tiền tệ là **VNĐ** hoặc **đ**.
*   **Output:** LLM sinh câu trả lời tự nhiên, chính xác dựa trên số liệu.

---

## 4. Chi tiết Triển khai File

### `server/services/rag/specialized/admin-analytics.service.js`
Đây là Service chuyên biệt cho Admin, bao gồm:
1.  **Security Layer**: Chặn user thường ngay đầu hàm.
2.  **Smart Date Parsing**: LLM tự động tính ngày tháng (VD: "hôm qua", "tuần trước") rồi gửi ISO String cho DB query.
3.  **Defensive Programming**: Luôn kiểm tra `null`/`undefined` cho mảng dữ liệu (đơn hàng, variants) để tránh crash backend.

### `admin/src/components/assistant/ChatWindow.tsx`
Giao diện Chat Assistant tích hợp:
*   **UI/UX**: Welcome Screen, Typing Indicator, Message Bubbles.
*   **Scroll-to-Bottom**: Nút mũi tên tự động hiện khi cuộn lên xem tin cũ.
*   **Effects**: Fade-in animation nhẹ nhàng (đã bỏ zoom-in gây chóng mặt).

---

## 5. Các Use-Case Điển hình

### Case A: Kiểm soát Doanh thu (Time-Aware)
*   **User:** "Doanh thu hôm qua thế nào?"
*   **Process:** AI nhận biết ngày hôm qua -> Tính `startDate`/`endDate` -> Query DB -> Trả về số liệu VNĐ.

### Case B: Tra cứu Khách hàng Đa năng
*   **User:** "Thông tin user Huy" (hoặc "Tìm sđt 0909...")
*   **Process:** Hệ thống quét DB tìm user khớp tên/sđt -> Trả về Profile + Địa chỉ + Tổng chi tiêu.

### Case C: Quản lý Kho & Cảnh báo Tồn kho
*   **User:** "Check kho vớ" (Specific)
    *   -> Báo số lượng từng màu/size của sản phẩm "Vớ".
*   **User:** "Sản phẩm nào sắp hết?" (Scanner)
    *   -> Quét toàn bộ DB -> Liệt kê các SP có `quantity <= 10`.

### Case D: Tracking Đơn hàng
*   **User:** "Check đơn DH9999"
    *   -> Trả về trạng thái vận chuyển, thanh toán.

### Case E: Xuất Báo Cáo & Context Awareness
*   **User:** "Danh sách sản phẩm sắp hết hàng"
    *   -> Bot liệt kê list trên UI.
*   **User:** "Xuất file csv cho tôi" (Bot hiểu ngữ cảnh)
    *   -> Bot tự biết user muốn xuất file **Low Stock** (dựa trên câu trước) -> Sinh file CSV -> Trả về Card Download.

---

## 6. Mở rộng Tương lai (Hybrid Knowledge Base)

Ngoài số liệu, Admin đôi khi cần tra cứu **Quy trình làm việc (SOP)**. Khi đó ta sẽ kết hợp lại Vector DB:

*   Nếu Sub-Intent trả về `general` hoặc `policy` (VD: *"Quy trình hoàn tiền cho khách VIP là gì?"*).
*   Hệ thống sẽ **Fallback** sang Vector Search (tương tự Client RAG) để tìm trong bộ tài liệu `Internal Docs PDF` đã được index.

👉 **Kết luận:** Admin RAG là sự kết hợp mạnh mẽ giữa **Database Query (cho số liệu)** và **Vector Search (cho tri thức)**.
