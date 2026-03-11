# Bài Trình Bày Bảo Vệ Đồ Án: Microservice AI Phân Tích Hình Ảnh (FashionCLIP)

Kính thưa Hội đồng bảo vệ đồ án, 

Sau đây, em xin phép trình bày chi tiết về phần lõi của tính năng **Tìm kiếm bằng hình ảnh (Visual Search)** trong dự án. Để xử lý tính năng này một cách tối ưu nhất, hệ thống không thực hiện các tác vụ tính toán AI trực tiếp trên Node.js backend chính, mà được tách riêng thành một **AI Microservice độc lập** được viết bằng ngôn ngữ Python.

---

## 1. Tổng quan về Service AI này là gì?

*   **Framework sử dụng:** Microservice này được xây dựng trên framework **FastAPI**. Lý do em chọn FastAPI là vì hiệu năng cực kỳ cao, hỗ trợ tốt xử lý bất đồng bộ (Asynchronous) và đặc biệt tối ưu để làm các API giao tiếp cho mô hình Machine Learning.
*   **Mô hình (Model) cốt lõi:** Trái tim của service này là một Pre-trained model có tên là **FashionCLIP** (`patrickjohncyh/fashion-clip`). Đây là một model được fine-tune (huấn luyện tinh chỉnh) từ CLIP model nguyên bản của OpenAI, nhưng được đào tạo chuyên biệt trên hơn **800.000 hình ảnh sản phẩm thời trang**. Nhờ đó, model này "hiểu" rất sâu về quần áo, màu sắc, họa tiết, và kiểu dáng thời trang hơn so với các model thông thường.
*   **Nhiệm vụ chính yếu:** Nhận vào một hình ảnh từ người dùng (đã mã hóa dưới dạng Base64) và biến đổi hình ảnh đó thành một **Vector** (cụ thể là một mảng gồm 512 con số thực - hay còn gọi là không gian 512 chiều). Mảng số này gói gọn toàn bộ "ý nghĩa đặc trưng" của bức ảnh đó.

---

## 2. Luồng hoạt động chi tiết diễn ra như thế nào?

Hoạt động của file `main.py` tuân theo một luồng xử lý cực kỳ chặt chẽ gồm 3 giai đoạn:

### Giai đoạn 1: Khởi động Service (Server Startup)
*   **Pre-loading Model:** Ngay khi server Python vừa khởi động, ở sự kiện `@app.on_event("startup")`, hệ thống sẽ tải toàn bộ model FashionCLIP vào sẵn bộ nhớ RAM.
*   **Mục đích:** Việc này giúp service luôn ở trạng thái sẵn sàng (eval mode). Thay vì mỗi lần người dùng gửi ảnh lên mới tốn thời gian load model, hệ thống có thể phản hồi gần như ngay lập tức.

### Giai đoạn 2: Quá trình xử lý (Khi User ấn tìm kiếm)
Khi Node.js Server gọi vào endpoint `POST /encode`, service Python sẽ thực hiện 4 bước toán học/logic tuần tự:
1.  **Decode Image (Giải mã):** Nhận chuỗi ảnh (Base64) và chuyển đổi ngược lại thành đối tượng hình ảnh số (RGB Image) sử dụng thư viện xử lý ảnh Pillow (PIL).
2.  **Preprocess (Tiền xử lý):** Hình ảnh được đưa qua `CLIPProcessor`. Tại đây ảnh được tự động cắt, phóng to/thu nhỏ (resize) và chuẩn hóa màu sắc về đúng định dạng ma trận Tensor mà model FashionCLIP yêu cầu.
3.  **Inference (Trích xuất đặc trưng AI):** Chuyển Tensor vào hàm `model.get_image_features()`. Một mạng nơ-ron sâu (Deep Neural Network) sẽ tính toán và trích xuất ra Vector biểu diễn bức ảnh (ví dụ model nhận diện được đây là "áo khoác, màu đen, chất liệu da").
4.  **Normalize (Chuẩn hóa Vector):** Đây là bước toán học rất quan trọng (`image_features / image_features.norm()`). Hệ thống áp dụng **L2 Normalization** để đưa độ dài của vector về giá trị 1. Việc này đảm bảo tính chính xác tuyệt đối khi sử dụng công thức **Cosine Similarity** (Đo lường góc giữa hai vector) để so sánh độ tương đồng giữa các ảnh trong Vector Database (Qdrant) sau này.

### Giai đoạn 3: Trả về kết quả (Response)
Hệ thống kết thúc bằng việc trả về cho Node.js một chuỗi JSON chứa: Mảng 512 con số đặc trưng (`embedding`) và tổng số thời gian tính bằng mili-giây đã dùng để xử lý (`processing_time_ms`) để phục vụ cho việc thống kê (Logging).

---

## 3. Lý do lựa chọn Kiến trúc này (Câu hỏi bảo vệ)

*   **Tại sao không đưa luôn thư viện AI này vào chung với Backend Node.js cho tiện mà phải tách ra Python?**
    1.  **Hệ sinh thái phù hợp:** Ngôn ngữ Python là "vua" trong lĩnh vực AI/Machine Learning. Các thư viện xử lý ma trận (PyTorch) và quản lý mô hình (HuggingFace Transformers) chạy trên Python có hiệu năng tốt nhất, hỗ trợ xử lý bằng GPU/CPU cực kỳ tối ưu. Node.js vốn được tối ưu cho các thao tác IO (Vào/Ra dữ liệu) thay vì tính toán đa luồng nặng nề.
    2.  **Kiến trúc Microservices (Dễ dàng mở rộng mở rộng - Scalability):** Việc tách riêng AI service giúp đảm bảo hiệu năng toàn bộ hệ thống. Tính toán AI tốn rất nhiều chu kỳ CPU. Nếu tích hợp chung với Node.js, khi có nhiều người cùng lúc tìm kiếm bằng hình ảnh, server Node.js sẽ bị "nghẽn cổ chai" (block Event Loop), có thể làm sập hoặc treo toàn bộ các luồng quan trọng khác như Đặt hàng, Thanh toán. Việc tách khối giúp Backend chính luôn mượt mà. Đạt chuẩn thiết kế hệ thống phần mềm chuyên nghiệp.

Đặc biệt, bên cạnh endpoint cho viêc encode ảnh, service em thiết kế còn có sẵn các endpoint như `/encode-batch` (xử lý nhiều ảnh cùng lúc lúc crawl data), và `/encode-text` (để hỗ trợ Semantic Search - tìm kiếm ngữ nghĩa thay vì text matching thông thường) giúp hệ thống sẵn sàng nâng cấp khả năng mở rộng ở các phiên bản tiếp theo.

Xin cảm ơn Hội đồng đã lắng nghe!
