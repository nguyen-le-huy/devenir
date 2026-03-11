# Bài Trình Bày Bảo Vệ Đồ Án: Hệ Thống AI Chat Assistant (RAG Pipeline)

Kính thưa Hội đồng bảo vệ đồ án,

Tiếp theo, em xin trình bày về tính năng phức tạp nhất và cũng là "bộ não" của dự án: **Hệ thống AI Chat Assistant sử dụng kiến trúc RAG (Retrieval-Augmented Generation)**. Đây không đơn thuần là một chatbot kịch bản (rule-based) mà là một AI Agent có khả năng tự suy luận, tìm kiếm dữ liệu thực tế từ database của cửa hàng và tư vấn tự nhiên như một nhân viên Sale thực thụ.

---

## 1. Tổng Quan Kiến Trúc RAG 
*   **Vấn đề của ChatGPT thông thường:** Nếu chỉ dùng ChatGPT API, AI sẽ trả lời chung chung hoặc "bịa" ra sản phẩm không có thật (Hallucination) vì nó không biết kho hàng của "Devenir" đang bán gì.
*   **Giải pháp (RAG):** Em xây dựng một RAG Pipeline. Hiểu đơn giản, mỗi khi người dùng hỏi, hệ thống sẽ tự động đi "Tìm kiếm" (Retrieval) thông tin sản phẩm, giá cả, size cộ thực tế trong hệ thống, sau đó nhét các thông tin này vào ngữ cảnh (Context) để ép AI "Sinh ra" (Generation) câu trả lời dựa trên chính xác dữ liệu của cửa hàng.

---

## 2. Trả lời câu hỏi: Chat này có "Realtime" không? Và sử dụng công nghệ kết nối nào?

Đây có lẽ là câu hỏi về kỹ thuật giao tiếp mạng mà các thầy cô khá quan tâm đối với tính năng Chat. Em xin phép được làm rõ:

Tính năng Chat hiện tại **KHÔNG sử dụng kết nối Real-time song hướng (như WebSockets hay Socket.io)** và cũng **chưa sử dụng Streaming (Server-Sent Events - SSE)**. 

*   **Phương thức kết nối:** Hệ thống sử dụng kết nối **HTTP POST truyền thống (REST API)**. 
*   **Luồng hoạt động thực tế:**
    1. Khi User bấm gửi tin nhắn, Frontend gọi một lệnh `POST /api/chat`.
    2. Server Node.js sẽ dành khoảng thời gian (từ 2 đến 5 giây) để xử lý một lượng công việc khổng lồ ngầm bên dưới (Chạy LLM, tìm kiếm Vector Pinecone, query MongoDB). 
    3. Sau khi có toàn bộ câu trả lời hoàn chỉnh, Server đóng gói lại thành chuỗi JSON và gửi trả về 1 lần duy nhất cho Frontend.

*   **Ảo giác Realtime (Illusion of Realtime):** Mặc dù Response trả về cục bộ 1 lần, nhưng trải nghiệm người dùng trên màn hình lại thấy chữ "chạy ra từ từ" giống hệt ChatGPT. Nguyên lý ở đây là do **Frontend tự giả lập (Simulate)**. Bọn em viết một hooks sử dụng `RequestAnimationFrame (RAF - 60fps)` để mô phỏng "Typewriter Effect" (hiệu ứng gõ chữ rải tiệm cận). Trải nghiệm UI/UX hoàn toàn mượt mà như Realtime mà không cần tốn chi phí duy trì WebSockets cồng kềnh.
*   **Định hướng (Future Work):** Nhóm đã đưa việc áp dụng chuẩn *Streaming Responses (Chunk by chunk - SSE)* vào kế hoạch tương lai (như đã ghi trong tài liệu thiết kế) để tối ưu thời gian chờ đợi (TTFB - Time to First Byte) xuống dưới 1 giây. Tuy nhiên, với Scale hiện tại, REST API Request hoàn toàn đảm bảo được độ ổn định (timeout hard limit set là 30s).

---

## 3. Quá trình giải quyết 1 câu hỏi (4 Giai đoạn RAG)

Để chứng minh hệ thống này không chỉ đơn giản là "phẩy API", em xin trình bày 4 bước hệ thống Node.js xử lý khi nhận 1 câu hỏi như *"Có áo polo nào màu đen mặc đi làm không?"*:

### Giai đoạn 1: Chuẩn bị (Preparation) - Hiểu ý đồ
Hệ thống không chạy tìm kiếm lộn xộn. Nó đưa câu hỏi cho AI để phân loại ý định (Intent Classification). Nó phân thành 7 ý định: *Tìm sản phẩm, Tra đơn hàng, Hay chỉ hỏi size?*
Đồng thời, hệ thống truy vấn hồ sơ khách hàng (Customer Profiling) từ DB xem khách này hay mua size gì, budget bao nhiêu.

### Giai đoạn 2: Tìm kiếm lai (Hybrid Search) - Nòng cốt của RAG
Em kết hợp sức mạnh của 3 công nghệ tìm kiếm cùng lúc:
1.  **Vector Search (Pinecone):** Dịch câu nói "mặc đi làm" thành Vector để hiểu concept "Lịch sự/Formal", từ đó lấy ra 50 sản phẩm phù hợp.
2.  **Keyword Search + Filter DB:** Lọc cứng những sản phẩm Tên có chữ "Polo" và "Màu Đen". Lọc tuyệt đối những sản phẩm Hết Hàng (Stock > 0).
3.  **Reranking (Sắp xếp thông minh):** Nén 50 kết quả lại, gọi qua `Cohere Rerank API` để chấm điểm sự phù hợp, chọn ra 10 sản phẩm tốt nhất. Cuối cùng, boost điểm (+15%) nếu sản phẩm đó có size phù hợp với khách hàng từ Giai đoạn 1.

### Giai đoạn 3: Sinh câu trả lời (Generation)
Hệ thống lắp ráp 10 sản phẩm tìm được + Lịch sử Chat + Hồ sơ khách hàng tạo thành cục Prompt lớn đẩy cho mô hình LLM `gpt-4.1-mini`. Bắt AI phải trả lời tư vấn một cách tự nhiên dựa trên data vừa mớm.

### Giai đoạn 4: Kiểm soát chất lượng (Quality Assurance/Fact Check)
Đây là điểm tự hào của dự án so với các chatbot rác. Trước khi trả lời Client, hệ thống tự động chạy "Fact Check":
*   Check xem AI có "bịa" sai giá sản phẩm không?
*   Check xem AI có báo "Áo này còn hàng" trong khi Database báo hết không?
*   Nếu AI nói sai, hệ thống Block tự động và yêu cầu tạo lại. Nếu đúng, Server mới đóng gói gửi về Client làm kết quả cuối cùng.

---

## 4. AI có nhớ được Lịch sử trò chuyện không? Lưu và nhớ như thế nào?

Một câu hỏi rất hay gặp là: *"Nếu hệ thống dùng REST API gọi từng lần một thì làm sao con AI nhớ được câu hỏi trước đó của em là gì?"*

Em xin khẳng định là **AI HOÀN TOÀN NHỚ ĐƯỢC NGỮ CẢNH (Context Awareness)**. Quá trình này được quản lý bởi module `ConversationManager` trên server.

### Về cách lưu trữ (How it is stored):
Toàn bộ cuộc hội thoại không bị vứt đi sau khi kết nối HTTP kết thúc, mà được lưu bền vững vào trong cơ sở dữ liệu **MongoDB** thông qua Collection `ChatLog`:
*   Với User đã đăng nhập: Phân biệt và lưu theo `userId`.
*   Với Khách vãng lai (Guest): Frontend sẽ sinh ra một cái chuỗi định danh tạm thời `session_id`, và Server vẫn lưu lịch sử theo session này.
*   Cấu trúc lưu là một mảng: Mỗi tin nhắn gồm `Role` (ai nói: User hay AI), `Content` (nói gì), và đặc biệt là `Metadata` (chứa các sản phẩn mà AI vừa gợi ý). Để chống tràn RAM và giảm chi phí chạy AI, hệ thống thiết lập **chỉ query ra tối đa 50 tin nhắn gần nhất** của phiên làm việc.

### Về cơ chế ghi nhớ (How it remembers):
Nguyên lý của AI (LLM) bản chất là "Không có trí nhớ" (Stateless). Nên cách chúng em làm nó nhớ như sau:
1. Khi User gõ một câu hỏi mới, ví dụ: *"Cái áo này có màu đỏ không?"*
2. Server Node.js khoan gọi AI vội. Nó sẽ xuống MongoDB kéo lên toàn bộ Lịch sử chat trước đó của User này.
3. Node.js sẽ rà soát trong lịch sử để trích xuất ra Context (Ví dụ: Từ tin nhắn trước, phát hiện ra "Cái áo này" là thao tác đang nói về *Product ID: Áo Polo Classic*).
4. Cuối cùng, Server **đóng gói cả Câu hỏi mới + Lịch sử Cũ + Ngữ cảnh Sản phẩm** thành một cục văn bản (Prompt) cực lớn và quăng cho OpenAI.
5. Lúc này AI đọc 1 phát cả quá khứ lẫn hiện tại, nên nó tự khắc hiểu "Cái áo này" mà User nhắc đến là cái áo nào và trả lời đúng màu đỏ của áo đó. Không hề bị đứt đoạn tư duy.

Em xin kết thúc phần trình bày về RAG Chatbot. Cảm ơn Hội đồng!
