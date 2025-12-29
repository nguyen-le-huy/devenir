## 📋 MÔ TẢ BÀI TOÁN DEVENIR

### **Bài toán**

Trong thị trường thương mại điện tử thời trang ngày càng bão hòa, người dùng thường gặp khó khăn trong việc tìm kiếm sản phẩm thực sự phù hợp với phong cách và số đo của mình giữa hàng nghìn lựa chọn ("Analysis Paralysis"). Các bộ lọc truyền thống (theo màu, size) là chưa đủ để giải quyết bài toán tư vấn phong cách. Ngoài ra, việc chủ cửa hàng phải quản lý thủ công hàng tồn kho, đơn hàng và các kênh marketing (Facebook) tiêu tốn nhiều nguồn lực.

### **Giải pháp**

**DEVENIR** là nền tảng Premium Fashion E-commerce tích hợp sâu AI để tái định nghĩa trải nghiệm mua sắm. Hệ thống cung cấp một **AI Personal Shopper** (Trợ lý mua sắm ảo) có khả năng tư vấn, chọn size và phối đồ như người thật. Đồng thời, hệ thống tự động hóa vận hành doanh nghiệp (đăng bài social, thông báo đơn hàng) giúp tối ưu hóa quy trình quản lý.

## 🛠️ CÔNG NGHỆ SỬ DỤNG

### **Nền tảng chính**

-   **Frontend**: React 18 + Vite.
    -   **Server State**: **React Query** (Quản lý data API, caching, loading state).
    -   **Global Client State**: **Zustand** (Quản lý theme, session, giỏ hàng tạm tính).
    -   **Optimization**: Sử dụng triệt để `React.memo`, `useCallback`, `useMemo` để tối ưu performance.
-   **Backend**: Node.js + Express.
-   **Database**: MongoDB (Dữ liệu quan hệ), **Pinecone** & **Qdrant** (Vector Database phục vụ AI).
-   **Automation**: **n8n** (Tự động hóa quy trình nghiệp vụ).

### **Kiến trúc AI (Dual-Engine)**

1.  **Text Engine (RAG)**: Sử dụng OpenAI API kết hợp với Pinecone để xây dựng Chatbot thông minh, có khả năng tra cứu thông tin sản phẩm và chính sách theo thời gian thực.
2.  **Visual Engine**: Sử dụng mô hình **FashionCLIP** (Self-hosted) kết hợp Qdrant để cho phép tìm kiếm sản phẩm bằng hình ảnh (Visual Search).

## 📊 CẤU TRÚC DỮ LIỆU CHÍNH

### **Collection Products**

Trung tâm dữ liệu của hệ thống.
-   Lưu trữ thông tin chi tiết: Tên, giá, mô tả, biến thể (size/màu).
-   **Cơ chế Dual-Sync**: Khi sản phẩm được tạo/sửa, hệ thống tự động vector hóa dữ liệu text đẩy sang Pinecone (cho Chatbot) và vector hóa hình ảnh đẩy sang Qdrant (cho Visual Search).

### **Collection Users**

Lưu trữ hồ sơ khách hàng.
-   Hỗ trợ đăng nhập đa kênh: Email/Password và Google OAuth.
-   Lưu lịch sử đơn hàng để AI có thể đưa ra gợi ý tái mua hàng (Re-marketing) cá nhân hóa.

### **Collection Orders**

Quản lý vòng đời giao dịch.
-   Hỗ trợ đa phương thức thanh toán: **PayOS** (Chuyển khoản NH Việt Nam) và **NowPayments** (Tiền điện tử / USDT).
-   Trạng thái đơn hàng được cập nhật Real-time qua Socket.IO.

### **Collection Messages**

Lưu trữ lịch sử hội thoại giữa User và AI.
-   Đóng vai trò "Short-term Memory" giúp AI hiểu ngữ cảnh để tư vấn liên tục (Zero-shot/Few-shot learning).

## 🔄 LUỒNG HOẠT ĐỘNG

### **AI Advisory (RAG Chatbot)**

1.  User hỏi: "Tôi cao 1m7 nặng 60kg, nên mặc size nào cho áo sơ mi dự tiệc?"
2.  Hệ thống:
    -   Phân loại ý định (Intent Classification).
    -   Gọi **Size Advisor Service** và **Product Advisor Service**.
    -   Truy vấn Vector DB (Pinecone) tìm sản phẩm phù hợp.
3.  AI trả lời kèm các Product Card để người dùng thêm vào giỏ ngay lập tức.

### **Visual Search (Tìm kiếm bằng hình ảnh)**

1.  User upload ảnh một bộ đồ họ thích.
2.  Hệ thống gửi ảnh tới **FashionCLIP Service** để mã hóa thành vector 512 chiều.
3.  So khớp vector này trong **Qdrant** để tìm các sản phẩm có độ tương đồng cao nhất về mặt thị giác trong kho hàng.

### **Business Automation Workflow**

1.  **Đơn hàng mới**:
    -   Gửi thông báo Real-time cho Admin.
    -   Gửi tin nhắn Telegram vào nhóm quản lý qua n8n.
2.  **Sản phẩm mới**:
    -   Admin thêm sản phẩm -> Hệ thống tự động tạo bài viết quảng cáo và đăng lên Fanpage Facebook qua n8n.

## ✨ ĐIỂM NỔI BẬT

**Trải nghiệm "Wow"**: Giao diện Premium, hiệu ứng mượt mà (GSAP), Visual Search giúp tìm đồ cực nhanh mà không cần từ khóa.

**Tư vấn 24/7**: Không chỉ là Chatbot hỏi đáp, đây là một chuyên gia thời trang ảo biết tư vấn size chính xác và gợi ý phối đồ (Mix & Match).

**Thanh toán hiện đại**: Tiên phong tích hợp thanh toán Crypto (USDT) song song với chuyển khoản ngân hàng Việt Nam.

**Vận hành tự động**: Giảm thiểu tối đa tác vụ thủ công cho chủ shop nhờ hệ thống n8n (Auto-posting, Auto-notification).
