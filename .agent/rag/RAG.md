# 🧠 Devenir RAG System Documentation (v3.1)

> **Tài liệu Kỹ thuật Tổng hợp**  
> *Phiên bản: 3.1 (Stable) - Cập nhật: 09/02/2026*

Chào mừng bạn đến với tài liệu kỹ thuật của hệ thống RAG (Retrieval-Augmented Generation) tại Devenir. Tài liệu này được thiết kế để giúp Developer mới nhanh chóng nắm bắt kiến trúc, luồng hoạt động và các component chính của hệ thống.

---

## 1. Tổng Quan Hệ Thống

Hệ thống RAG của Devenir không chỉ là một chatbot thông thường, mà là một **AI-Powered Commerce Engine** phục vụ 2 đối tượng chính:

1.  **Client RAG (Fashion Advisor)**: Trợ lý ảo cho khách hàng.
    *   Tư vấn phối đồ, chọn size.
    *   Tìm kiếm sản phẩm (Text/Image/Voice).
    *   Gợi ý quà tặng thông minh (Gift Intelligence).
2.  **Admin RAG (Business Analyst)**: Trợ lý cho quản trị viên.
    *   Phân tích doanh thu, tồn kho.
    *   Tra cứu thông tin khách hàng.
    *   Tạo báo cáo tự động.

---

## 2. Kiến Trúc & Tech Stack

### 🛠 Tech Stack
*   **Core**: Node.js, Express.js
*   **LLM**: OpenAI GPT-4o-mini (Primary), GPT-4o (Complex tasks).
*   **Databases**:
    *   **MongoDB**: Metadata sản phẩm, Orders, Text Search (Tier 1).
    *   **Pinecone**: Vector Search cho Semantic Product Search (Tier 3).
    *   **Redis**: Semantic Caching & Sticky Context.
*   **Tools**: LangChain (Orchestration), Cohere (Reranking).

### 🏗 Cấu trúc Thư mục (`server/services/rag/`)
```
rag/
├── core/                  # Core logic (RAGService, LLMProvider)
├── retrieval/             # Search logic (Vector, MongoDB Text, Hybrid)
├── generation/            # Prompt templates & Response generation
├── orchestrators/         # Context Manager, Intent Classifier
├── query-transformation/  # Query Expansion, Decomposer
├── specialized/           # Specialized Handlers (Product, Size, Gift)
├── tools/                 # Admin Tools (Analytics, CRM)
└── utils/                 # Helpers (Logger, Cache)
```

---

## 3. Luồng Hoạt Động (The Pipeline)

Khi một User Query được gửi đến, hệ thống xử lý qua 5 bước chính:

### Bước 1: Query Transformation (Biến đổi câu hỏi)
*   **Mục đích**: Hiểu ý định thực sự và làm giàu thông tin.
*   **Xử lý**:
    *   **Expansion**: "quà tặng mẹ" → mở rộng thành "nước hoa, trang sức, khăn choàng".
    *   **Correction**: Sửa lỗi chính tả phím tắt.

### Bước 2: Intent Classification (Phân loại ý định)
Sử dụng cơ chế **Hybrid Classification**:
1.  **Keyword (Ultra-fast)**: Bắt các từ khóa cứng ("mua", "size", "giá"). Độ tin cậy cao.
2.  **LLM (Flexible)**: Xử lý câu hỏi phức tạp hoăc mơ hồ.
*   *Các Intent chính*: `product_advice`, `size_recommendation`, `gift_recommendation`, `order_lookup`.

### Bước 3: Retrieval (Tìm kiếm dữ liệu)
Áp dụng chiến lược **Multi-Tier Search (RAG 3.1)** để tối ưu tốc độ/chính xác:
*   **Tier 1 - Text Search (MongoDB)**: Tìm chính xác tên sản phẩm (~5ms).
*   **Tier 2 - Regex Search**: Tìm theo pattern/viết tắt (~10ms).
*   **Tier 3 - Vector Search (Pinecone)**: Tìm theo ngữ nghĩa/mô tả (~150ms).

### Bước 4: Smart Context Management
Quản lý ngữ cảnh hội thoại thông minh (`EnhancedContextManager`):
*   **Sticky Context**: Nhớ sản phẩm đang thảo luận (ví dụ: đang nói về áo A, hỏi "giá bao nhiêu" -> biết là giá áo A).
*   **Smart Topic Detection**: Tự động phát hiện khi user chuyển chủ đề (ví dụ: đang hỏi size -> chuyển sang mua quà) để reset context, tránh nhầm lẫn.

### Bước 5: Generation (Sinh câu trả lời)
*   **Prompt Engineering**: Sử dụng kỹ thuật CoVe (Chain of Verification).
*   **Gift Intelligence**: Nếu là mua quà, prompt bắt buộc đề xuất 3-5 sản phẩm đa dạng kèm lý do.
*   **Format**: Trả về text + JSON metadata (để Frontend hiển thị Product Cards).

---

## 4. Các Tính Năng Nổi Bật (RAG 3.1)

### 🌟 1. Multi-Tier Product Search
Thay vì lạm dụng Vector Search (chậm & tốn kém), hệ thống ưu tiên tìm kiếm text chính xác trước.
*   **Kết quả**: Giảm 90% độ trễ cho các query tìm tên sản phẩm cụ thể.

### 🎁 2. Gift Shopping Intelligence
Hệ thống "hiểu" nhu cầu mua quà tặng:
*   Tự động mở rộng tìm kiếm sang các danh mục quà tặng (Nước hoa, Phụ kiện...).
*   Đề xuất đa dạng (Cross-category) thay vì chỉ 1 loại sản phẩm.

### 🧠 3. Smart Topic Change
Giải quyết vấn đề "Bot bị ngáo" khi user đổi chủ đề đột ngột.
*   Hệ thống dùng 3 quy tắc (Trigger words, Intent change, Rejection) để phát hiện và làm mới bộ nhớ đệm ngay lập tức.

---

## 5. Hướng Dẫn Debug & Monitor

*   **Logs**: Hệ thống log chi tiết tại `logs/rag-service.log`. Tìm kiếm theo `requestId`.
*   **Fact Checking**: Bật `ENABLE_FACT_CHECKING=true` trong `.env` để kiểm tra tồn kho (Stock) trước khi suggest.
*   **Testing**: Sử dụng UI DevTools hoặc Postman để test từng endpoint `/api/rag/chat`.

---
*Tài liệu này dùng cho mục đích nội bộ của team Development.*
