Đây là file `.md` tổng hợp các hạng mục nâng cấp UI/UX để biến trang quản lý thành "Facebook Campaign Command Center" chuyên nghiệp. Bạn có thể copy nội dung này vào dự án để theo dõi.

```markdown
# 🚀 UI/UX UPGRADE PLAN: FACEBOOK CAMPAIGN MANAGER

## 1. Enterprise Data Grid (Nâng cấp Bảng Dữ liệu)
Chuyển đổi từ bảng danh sách đơn giản sang bảng điều khiển giàu thông tin để hỗ trợ ra quyết định nhanh.

### 1.1. Cấu trúc Cột (Column Structure)
| Cột Cũ | **Cột Mới (Đề xuất)** | **Mô tả & Chức năng UI** |
| :--- | :--- | :--- |
| **Image** | **Creative Asset** | • **Thumbnail:** Hiển thị ảnh/video dạng `aspect-ratio-square` hoặc `16:9` bo góc.<br>• **Type Badge:** Icon nhỏ góc ảnh phân loại: 🖼️ Carousel, 🎬 Reel, 📸 Photo.<br>• **Quick View:** Hover vào ảnh để phóng to (Zoom/Preview) mà không cần click. |
| **Name** | **Content Preview** | • **Title:** Tên sản phẩm (Bold).<br>• **Caption Snippet:** Hiển thị 2 dòng đầu của nội dung bài post (Text-gray-500).<br>• **Hashtags:** Hiển thị dạng Tags/Chips nhỏ (e.g., `#Sale`, `#New`). |
| **Status** | **Workflow Stage** | • Thay thế text đơn giản bằng **Status Badge** có màu sắc:<br>  🔴 `Draft` (Nháp)<br>  🟡 `AI Generating` (Đang viết)<br>  🟠 `Approval Needed` (Cần duyệt)<br>  🔵 `Scheduled` (Đã lên lịch)<br>  🟢 `Published` (Đã đăng)<br>  ⚫ `Failed` (Lỗi - Kèm Tooltip lý do). |
| *(Mới)* | **Live Metrics** | • Chỉ hiện với trạng thái `Published`.<br>• Hiển thị các chỉ số mini (Sparkline hoặc số liệu):<br>  👁️ **Reach** \| 👍 **Engagement** \| 💬 **Comments** |
| *(Mới)* | **Platform** | • Icon logo Facebook/Instagram nhỏ để biết bài post sẽ lên kênh nào (nếu mở rộng sau này). |
| **Action** | **Smart Actions** | • Thay nút "Post" to bằng **Icon Button** (`MoreHorizontal`) mở Dropdown Menu:<br>  📝 *Edit Caption*<br>  🚀 *Boost Post* (Quảng cáo)<br>  📱 *Preview Mobile*<br>  🔗 *View on Facebook* |

---

## 2. Bulk Operations (Thao tác Hàng loạt)
Tính năng bắt buộc cho doanh nghiệp để xử lý số lượng lớn sản phẩm.

### 2.1. Floating Action Bar (Thanh công cụ nổi)
*   **Trigger:** Chỉ xuất hiện ở dưới cùng (hoặc trên cùng) bảng khi user tick chọn >= 1 sản phẩm.
*   **UI Components:**
    *   **Counter:** "Đang chọn 5 sản phẩm".
    *   **Action Buttons:**
        *   🗓️ **Bulk Schedule:** Mở modal chọn ngày bắt đầu + khoảng cách giữa các bài (e.g., "Post cách nhau 2h").
        *   ✨ **AI Rewrite:** Viết lại caption cho toàn bộ bài đã chọn theo tone mới.
        *   🏷️ **Add Tags:** Gắn thẻ quản lý nội bộ.
        *   ▶️ **Force Run:** Kích hoạt n8n workflow ngay lập tức cho các bài này.

---

## 3. Automation & AI Visibility (Trực quan hóa Tự động hóa)
Làm cho người dùng cảm thấy hệ thống "thông minh" và minh bạch.

### 3.1. Real-time Feedback
*   **Processing State:** Khi n8n đang chạy, row tương ứng chuyển sang trạng thái "Loading" nhẹ (Skeleton hoặc Opacity giảm).
*   **Progress Toast:** Hiển thị thông báo góc màn hình: *"🤖 AI đang viết nội dung cho 3 sản phẩm..."*.
*   **Error Handling:** Nếu workflow lỗi, đừng chỉ hiện "Failed". Hãy hiện icon ⚠️, hover vào hiện chi tiết lỗi từ n8n (e.g., *"Token hết hạn"*, *"Ảnh quá kích thước"*).

### 3.2. AI Content Generator (Drawer/Modal)
*   Thêm nút **"✨ Magic Generate"** cạnh ô tìm kiếm.
*   **Chức năng:**
    *   Tự động quét các sản phẩm chưa có caption (`Status: Draft`).
    *   Cho phép chọn **Template Prompt**: "Sale sập sàn", "Review chi tiết", "Hài hước".
    *   Preview kết quả trước khi lưu vào bảng.

---

## 4. Advanced Filtering & Views (Bộ lọc & Chế độ xem)
Giúp quản lý khi số lượng bài lên tới hàng trăm/ngàn.

### 4.1. Filter Bar (Thanh bộ lọc)
*   **Tabs:** Chia nhanh theo trạng thái: `All` | `Drafts` | `Scheduled` | `Published` | `Errors`.
*   **Dropdown Filters:**
    *   *Category:* Áo, Quần, Phụ kiện...
    *   *Time Range:* Tuần này, Tháng trước.
    *   *Performance:* Bài có Reach > 1,000.

### 4.2. View Modes (Chế độ hiển thị)
*   **List View (Mặc định):** Tối ưu cho việc quản lý, check trạng thái hàng loạt.
*   **Grid/Gallery View:** Hiển thị dạng thẻ ảnh lớn (giống Instagram Profile) để xem tổng thể visual của Feed Facebook trông sẽ như thế nào.
*   **Calendar View:** Xem lịch đăng bài dạng lịch tháng để tránh việc đăng quá dày hoặc quá thưa.

---

## 5. Mobile Preview (Xem trước)
*   Thêm nút **👁️ Preview** trên mỗi dòng.
*   **Chức năng:** Mở một Modal mô phỏng chính xác giao diện bài post trên app Facebook điện thoại (Avatar, Tên Page, Caption có "See more", Ảnh layout).
*   **Mục đích:** Đảm bảo caption không bị ngắt dòng vô duyên hoặc ảnh bị crop sai trước khi đăng thật.
```