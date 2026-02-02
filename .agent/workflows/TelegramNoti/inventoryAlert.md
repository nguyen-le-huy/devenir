---
description: 🤖 Tài liệu kỹ thuật: Bot Cảnh Báo & Báo Cáo Tồn Kho (Devenir)
---

Tài liệu này mô tả luồng hoạt động (workflow) của hệ thống tự động hóa trên n8n, kết nối giữa **MongoDB** và **Telegram** để quản lý tồn kho.

## 📋 Tổng quan
Workflow này có 2 chức năng chính:
1.  **Tự động (Automation):** Quét tồn kho định kỳ mỗi giờ, nếu phát hiện sản phẩm sắp hết hàng sẽ gửi cảnh báo lên nhóm Telegram.
2.  **Tương tác (Interaction):** Cho phép người dùng tải báo cáo Excel chi tiết thông qua các nút bấm (Buttons) trên Telegram.

---

## 🛠 Cấu trúc Workflow

Hệ thống được chia thành 2 luồng xử lý chính:

### 1. Luồng Tự Động & Lệnh Chat (`/inventory`)
Luồng này chạy định kỳ hoặc khi ai đó gõ lệnh kiểm tra.

* **Trigger:**
    * `Schedule Hourly Check`: Chạy tự động mỗi 1 tiếng.
    * `Telegram Trigger` (Lệnh `/inventory`): Kích hoạt khi người dùng gõ lệnh.
* **Xử lý dữ liệu:**
    * **MongoDB Get Inventory:** Query database lấy toàn bộ sản phẩm có `isActive: true`.
    * **Process Data (Code Node):**
        * Phân loại sản phẩm: *Còn hàng (>10)*, *Sắp hết (<=10)*, *Hết hàng (=0)*.
        * Tính toán thống kê phần trăm (%).
        * Lọc ra Top 5 sản phẩm cần nhập gấp (Critical products).
    * **IF Auto Alert?:** Kiểm tra điều kiện `low_stock_count > 0`. Nếu không có gì báo động, workflow dừng lại.
* **Output:**
    * **Send Alert:** Gửi tin nhắn tổng hợp thống kê lên Telegram kèm theo **Inline Keyboard** (các nút bấm để tải báo cáo).

### 2. Luồng Xuất Báo Cáo Excel (Callback Query)
Luồng này kích hoạt khi người dùng nhấn vào các nút trên tin nhắn cảnh báo.

* **Trigger:** Người dùng nhấn nút (Button Click) trên Telegram.
* **Routing (Điều hướng):**
    * `Main Router` & `Check Button Action`: Xác định xem người dùng muốn tải loại báo cáo nào:
        * `report_all`: Tất cả sản phẩm.
        * `report_low_stock`: Chỉ sản phẩm sắp hết.
        * `report_out_of_stock`: Chỉ sản phẩm đã hết.
* **Chuẩn bị dữ liệu (Prepare Filter):**
    * Tạo query MongoDB động dựa trên nút bấm.
    * Đặt tên file Excel tự động theo format: `Ton_Kho_Devenir_{Loại}_{Ngày}.xlsx`.
* **Truy xuất & Tạo file:**
    * **Get Report Data (MongoDB):** Chạy Aggregation query để lấy dữ liệu chi tiết (SKU, Màu, Size, Vị trí...).
    * **Create Excel File:** Chuyển đổi JSON thành file `.xlsx`.
* **Output:**
    * **Send Excel to Telegram:** Gửi file tài liệu về lại khung chat.
    * **Stop Loading:** Xóa biểu tượng "loading" trên nút bấm Telegram để hoàn tất UX.

---

## 💾 Cấu trúc dữ liệu (Database)

Workflow sử dụng 2 collection chính trong MongoDB:
1.  **`productvariants`**: Chứa thông tin biến thể (SKU, quantity, color, size, price...).
2.  **`products`**: Chứa tên gốc của sản phẩm (dùng `$lookup` để nối bảng).

**Logic trạng thái tồn kho:**
* 🔴 **Out of Stock:** `quantity == 0`
* ⚠️ **Low Stock:** `0 < quantity <= 10`
* 🟢 **In Stock:** `quantity > 10`

---

## ⚙️ Cài đặt & Môi trường (Environment)

Các Credentials cần thiết để chạy workflow:
* **Telegram API:** Kết nối với Bot Father (Devenir Bot).
* **MongoDB:** Chuỗi kết nối đến cơ sở dữ liệu kho hàng.

---

## 📝 Hướng dẫn sử dụng (User Guide)

1.  **Xem nhanh:** Bot sẽ tự nhắn tin vào nhóm nếu có hàng sắp hết.
2.  **Chủ động kiểm tra:** Gõ `/inventory` vào nhóm chat.
3.  **Tải báo cáo:**
    * Nhấn nút **"📊 Tất cả sản phẩm"** để lấy file kiểm kê toàn bộ.
    * Nhấn nút **"⚠️ Sắp hết"** để lấy danh sách cần nhập hàng gấp.