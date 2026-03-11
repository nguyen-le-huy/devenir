# Bài Trình Bày Bảo Vệ Đồ Án: Tự Động Hóa Đăng Bài Facebook (Với n8n & AI)

Kính thưa Hội đồng bảo vệ đồ án,

Tiếp theo, em xin trình bày về một luồng nghiệp vụ tự động hóa (Automation) cốt lõi dành cho phía Quản trị viên (Admin) của nền tảng: **Tính năng tự động đăng sản phẩm lên Fanpage Facebook sử dụng AI và Webhook.**

Mục tiêu của tính năng này là giải phóng hoàn toàn sức lao động thủ công của người vận hành. Thay vì phải copy ảnh, tự nghĩ nội dung (caption) và đăng bài bằng tay lên mạng xã hội, Admin chỉ cần "Một chạm" (One-click) trực tiếp từ hệ thống quản trị, toàn bộ phần việc còn lại sẽ do hệ thống tự xử lý.

---

## 1. Tổng quan về Kiến trúc Giải pháp

Để giải quyết bài toán này mà không làm phình to (bloat) mã nguồn của Node.js Backend chính, nhóm chúng em quyết định sử dụng **Kiến trúc hướng sự kiện (Event-Driven Architecture)** kết hợp với công cụ Automation mã nguồn mở: **n8n**.

*   **Node.js Server (Proxy Layer):** Đóng vai trò làm cầu nối trung gian, tiếp nhận yêu cầu từ Admin Dashboard và chuyển tiếp (forward) lệnh đi.
*   **n8n Workflow (Xử lý nghiệp vụ):** Đây là bộ não thực sự của quá trình này. Nó là một luồng (workflow) độc lập được kích hoạt thông qua một URL đặc biệt gọi là **Webhook**.
*   **OpenAI:** Được tích hợp trực tiếp vào luồng của n8n để tự động sáng tạo nội dung (Caption generation) dựa trên thông tin sản phẩm.
*   **Facebook Graph API:** Được n8n sử dụng để tự động upload hình ảnh và xuất bản (publish) bài viết lên Fanpage.

---

## 2. Luồng hoạt động chi tiết (Data Flow)

Toàn bộ quy trình diễn ra xuyên suốt qua 3 lớp: Frontend (Admin UI) -> Backend Node.js -> n8n Workflow.

### Bước 1: Thao tác từ Admin (Frontend)
1. Giám đốc hoặc Quản lý cửa hàng (Admin) thiết lập cấu hình kết nối một lần duy nhất, bao gồm `Webhook URL` (địa chỉ của luồng xử lý trên máy chủ n8n) và `Page ID` (ID của Fanpage Facebook).
2. Tại trang danh sách sản phẩm, Admin nhấn nút **"Post"** cho một sản phẩm cụ thể.
3. Giao diện (UI) ngay lập tức chuyển sang trạng thái "Đang xử lý AI" (Loading spinner) để thông báo cho người dùng biết thao tác đang được thực thi.

### Bước 2: Vai trò của Node.js Backend (Proxy Pattern)
Một câu hỏi đặt ra là: *"Tại sao Frontend trình duyệt lại không gọi thẳng trực tiếp sang n8n Webhook mà phải vòng qua Server Node.js?"*. Trả lời Hội đồng:
*   Đó là để giải quyết bài toán **Bảo mật và CORS** (Cross-Origin Resource Sharing). Trình duyệt sẽ chặn các request gọi trực tiếp (AJAX) khác domain (từ Admin domain sang n8n domain). Do đó, Node.js server đóng vai trò là một **Proxy an toàn (Server-to-Server call)**, không bị giới hạn bởi CORS.
*   Server Node.js lúc này làm nhiệm vụ Validate (kiểm tra tính hợp lệ của data input) và gọi HTTP POST sang `Webhook URL`.

### Bước 3: Quy trình của n8n Workflow (Sự kết hợp giữa AI và API)
Khi n8n nhận được tín hiệu Webhook chứa `productId`, hệ thống sẽ tuần tự chạy các Node (Hộp chức năng) sau:
1.  **Lấy Data:** Gọi ngược lại API của hệ thống để lấy toàn bộ thông tin chi tiết của sản phẩm (Tên, Giá, Mô tả, Array Hình ảnh).
2.  **Sinh Caption nhờ AI:** Hệ thống truyền các thông tin thô của sản phẩm như *{Tên: Áo Vest, Giá: 500k, Chất liệu: Kaki,...}* cho mô hình ngôn ngữ lớn (ví dụ: OpenAI / ChatGPT). Trí tuệ nhân tạo sẽ tự động tổng hợp và 'viết ngắn gọn, có chèn cả emoji' để ra một bài Content hấp dẫn, chuẩn văn phong quảng cáo mạng xã hội.
3.  **Upload & Publish:** n8n gọi đến Facebook Graph API để upload các bức ảnh lên Album, sau đó đính kèm nội dung (Caption) vừa được AI sinh ra và tiến hành xuất bản công khai lên luồng thông báo (Feed) của Fanpage.
4.  n8n trả về kết quả (ID của bài viết trên FB) báo hiệu thành công.

### Bước 4: Hoàn thành
Node.js nhận kết quả thành công, trả về cho Frontend hiển thị thông báo "Posted successfully!" và đổi trạng thái sản phẩm sang màu xanh "Published".

---

## 3. Các Vấn Đề Kỹ Thuật Đã Xử Lý & Định Hướng Mở Rộng

Thưa hội đồng, trong quá trình phát triển quy trình này, em đã phải giải quyết một số vấn đề rủi ro kỹ thuật:
1.  **Vấn đề Timeout (Trễ thời gian):** Quá trình để AI suy nghĩ viết văn cộng với việc đẩy nhiều ảnh HQ (High Quality) lên máy chủ Facebook tốn khá nhiều thời gian (thường từ 10 - 20 giây). Em đã phải điều chỉnh thời gian Timeout của luồng Request để trình duyệt không báo lỗi "Server Not Responding" trước khi n8n chạy xong.
2.  **Quản lý lỗi (Error Handling):** Hệ thống Backend được thiết kế bắt lỗi (catch) rất chi tiết. Nếu n8n gặp trục trặc, hay lỗi như 502 (Bad Gateway), 500 (Internal Error), thông báo sẽ được parse cẩn thận và đẩy về cho người dùng (Admin) hiểu rõ vấn đề để gọi hỗ trợ IT, tránh hiện tượng Load mãi mãi không có hồi kết.

**Định hướng mở rộng tới:**
Hiện tại, trạng thái "Bài viết đã đăng" (Published) đang được lưu cục bộ ở máy tính của Admin (LocalStorage). Trong phiên bản tiếp theo, nhóm sẽ cập nhật trường `social_publish_status` trực tiếp vào Model Product trong MongoDB, giúp dữ liệu đồng bộ trên mọi thiết bị khi nhiều quản trị viên cùng truy cập. Đồng thời, kiến trúc kết nối lỏng (Loose coupling) hiện tại sẵn sàng cho phép cắm (plug-in) tự động đăng bài lê Tiktok hoặc Instagram một cách rất dễ dàng mà không phá vỡ logic cũ.

Em xin kết thúc phần trình bày tính năng Autotmation Đăng bài Facebook. Cảm ơn Hội đồng!
