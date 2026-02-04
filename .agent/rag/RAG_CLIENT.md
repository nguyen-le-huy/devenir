# 🛍️ Client RAG Documentation: AI Fashion Advisor

> **Tài liệu kỹ thuật Hệ thống RAG Tư vấn Khách hàng (AI Shopping Assistant)**
> *Last updated: 2026-02-04*

Tài liệu mô tả kiến trúc của **AI Shop Assistant** - hệ thống tư vấn thời trang thông minh sử dụng kỹ thuật RAG (Retrieval-Augmented Generation) để mang lại trải nghiệm mua sắm cá nhân hóa chuẩn doanh nghiệp.

---

## 1. 🏗️ Kiến trúc Hệ thống (System Architecture)

Hệ thống sử dụng kiến trúc **Advanced RAG** với cơ chế lấy lại thông tin đa tầng (Multi-stage Retrieval) để đảm bảo độ chính xác ngữ nghĩa và ngữ cảnh.

### Sơ đồ High-Level
```mermaid
flowchart TB
    User[Customer] -->|Query: 'Tìm áo polo đỏ'| Gateway[API Gateway]
    
    subgraph ContextEngine["🧠 Context & Intent Manager"]
        IC[Intent Classifier]
        Context[Context Manager]
        History[Chat History (MongoDB)]
    end
    
    subgraph RetrievalLayer["🔍 Retrieval Engine"]
        VectorDB[(Pinecone Vector DB)]
        TextSearch[Keyword Search]
        Reranker[Cohere Reranker]
    end
    
    subgraph KnowledgeLayer["📚 Knowledge Base"]
        Products[Product Catalog]
        Docs[Fashion Knowledge/FAQ]
        Colors[Color Mapping System]
    end
    
    subgraph GenerationLayer["✨ Response Generation"]
        Prompt[CoVe Prompt Builder]
        LLM[GPT-4o Mini]
    end

    Gateway --> IC
    IC --> Context
    Context --> History
    IC -->|Search Query| RetrievalLayer
    RetrievalLayer <-->|Embeddings| VectorDB
    RetrievalLayer <-->|Filter| Products
    VectorDB --> Reranker
    Reranker -->|Top relevant docs| Prompt
    History -->|Past Interactions| Prompt
    Prompt --> LLM
    LLM --> User
```

---

## 2. 🧩 Các Module Chuyên Biệt (Specialized Orchestrators)

Thay vì một LLM xử lý tất cả, chúng tôi sử dụng mô hình **Mixture of Experts (MoE)** ở tầng ứng dụng. Router sẽ điều hướng query đến chuyên gia phù hợp:

### A. Product Advisor (Tư vấn Sản phẩm)
*   **Nhiệm vụ:** Tìm kiếm sản phẩm theo ngữ nghĩa (Semantic Search).
*   **Tech Stack:** OpenAI Embeddings (3-small) + Pinecone + Cohere Rerank.
*   **Workflow:**
    1.  **Enrich Query:** Bổ sung ngữ cảnh (VD: "cái đó màu gì" -> "cái [áo polo] màu gì").
    2.  **Hybrid Search:** Kết hợp Vector Search (Semantic) và Keyword Search (Exact Match - SKU/Màu sắc).
    3.  **Color Intelligence:** Mapping màu sắc thông minh (VD: "đỏ đô" -> "wine red", "bordeaux").
    4.  **Reranking:** Sắp xếp lại kết quả để đảm bảo Relevance cao nhất.

### B. Size Advisor (Tư vấn Kích cỡ) - *Signature Feature*
*   **Nhiệm vụ:** Đề xuất size dựa trên chiều cao/cân nặng.
*   **Problem Solved:** LLM thường "ảo giác" (hallucinate) số đo hoặc đề xuất sai size chart.
*   **Giải pháp:**
    *   **Anti-Hallucination Guardrails:** Nếu thiếu chiều cao/cân nặng -> Bắt buộc hỏi lại.
    *   **Logic Deterministic:** So sánh số liệu với Bảng Size chuẩn (Hard-coded Logic) trước khi đưa vào LLM để viết lời văn.
    *   **Edge Case Handling:** Xử lý các trường hợp ngoại cỡ (quá nhỏ/quá lớn) với lời khuyên tinh tế, tránh body-shaming.

### C. Policy FAQ & Order Lookup
*   **Nhiệm vụ:** Giải đáp CSKH và tra cứu đơn hàng.
*   **Cơ chế:**
    *   **Zero-Shot Classification:** Nhận diện intent hỏi về "ship", "đổi trả".
    *   **Static Knowledge Injection:** Inject chính sách hiện hành vào prompt (không dùng Vector Search cho tin tĩnh để đảm bảo chính xác tuyệt đối).

---

## 3. 🛡️ Chiến lược Retrieval & Generation (ADR)

### Tại sao Hybrid Search?
*   **Vấn đề:** Vector Search thuần túy đôi khi thất bại với các từ khóa chính xác (Exact Term Match) như mã sản phẩm, hoặc tên màu sắc hiếm.
*   **Giải pháp:** Kết hợp Vector Search (hiểu "áo ấm" = "áo len", "áo khoác") và Metadata Filter (lọc đúng color="Red").

### Tại sao Reranking (Cohere)?
*   **Context:** Vector Database trả về Top 50 kết quả "có vẻ liên quan".
*   **Vấn đề:** Top 1 của Vector chưa chắc là câu trả lời tốt nhất cho *intent* của user.
*   **Giải pháp:** Sử dụng mô hình Cross-Encoder (Cohere) để chấm điểm lại Top 50 kết quả, chỉ chọn ra Top 5 thực sự liên quan nhất để đưa vào Prompt. Giúp giảm nhiễu (noise) cho LLM.

### Cơ chế Context Management (Sticky Context)
*   **Problem:** User nói "cái này giá bao nhiêu" -> AI không biết "cái này" là gì.
*   **Solution:** Hệ thống lưu `current_product` trong Session Context. Khi phát hiện từ chỉ trỏ (referring expressions) hoặc query ngắn, hệ thống tự động merge context sản phẩm trước đó vào query hiện tại.
    *   *User:* "Tìm áo len" -> AI show Áo Len A.
    *   *User:* "Có màu đen không?" -> AI hiểu: "Áo Len A có màu đen không?".

---

## 4. 🧠 Prompt Engineering Techniques

Hệ thống sử dụng kỹ thuật **Chain of Verification (CoVe)** và **Few-Shot Prompting**.

1.  **Role Persona:** "Bạn là chuyên gia thời trang Devenir, tone giọng chuyên nghiệp nhưng thân thiện..."
2.  **Constraints:**
    *   "CHỈ sử dụng thông tin trong [Context], KHÔNG bịa đặt."
    *   "Nếu không tìm thấy sản phẩm, hãy xin lỗi và gợi ý sản phẩm thay thế có trong list."
3.  **Structured Output:** Yêu cầu LLM trả về JSON trong các tác vụ logic (như Size Advisor) để Frontend dễ dàng render UI (Buttons, Cards).

---

## 5. 📈 Tối ưu Hiệu năng & Scalability

1.  **Parallel Execution:** Intent Classification và Retrieval chạy song song (`Promise.all`), giảm độ trễ phản hồi xuống < 2s.
2.  **Caching Strategy:** Cache các query phổ biến và metadata màu sắc tại Redis/Memory để giảm tải DB.
3.  **Graceful Degradation:** Nếu LLM quá tải, hệ thống tự động fallback về Keyword Search cơ bản để vẫn trả về danh sách sản phẩm.
