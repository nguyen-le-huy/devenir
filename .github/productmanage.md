Kiến trúc Form: 2 Cấp độ Quản lý
Vì bạn có products và productVariants riêng biệt trong database, form cần phản ánh đúng cấu trúc này:​

Level 1: Product (Sản phẩm chính) - Thông tin chung
Level 2: Product Variants (Biến thể) - Thông tin chi tiết SKU

Cấu trúc Form Chính
Layout Tổng Quan

┌─────────────────────────────────────────────────────┐
│  Header: [Product Name]          [Save Draft] [Publish]
├─────────────────────────────────────────────────────┤
│  [Tab 1] [Tab 2] [Tab 3] [Tab 4] [Tab 5]           │
├─────────────────────────────────────────────────────┤
│                                                       │
│              Content Area                             │
│                                                       │
└─────────────────────────────────────────────────────┘

Tab 1: Basic Information (Thông tin cơ bản)
Phần Product Information:
┌─ Product Details ────────────────────────────────┐
│ Product Name * [____________________________]     │
│ Example: "Áo Sơ Mi Oxford"                       │
│                                                   │
│ Description * [Rich Text Editor - TinyMCE]       │
│ - Toolbar: Bold, Italic, List, Link              │
│ - Min 100 characters                             │
│                                                   │
│ Category *         Brand                          │
│ [Áo Sơ Mi ▼]      [Devenir Collection ▼]        │
│                                                   │
│ Base Price (VNĐ) *                               │
│ [350,000]                                         │
│ ℹ️ Giá cơ sở - variants có thể override          │
│                                                   │
│ Tags (Multi-select chips)                         │
│ [công sở] [thoáng mát] [+ Add tag]              │
│                                                   │
│ Status                                            │
│ ○ Draft  ● Published  ○ Archived                 │
└───────────────────────────────────────────────────┘
Lưu ý:

Base price là giá tham chiếu, mỗi variant có thể có giá riêng​

Category và Brand dùng searchable dropdown (không phải dropdown thông thường)​

Tab 2: Media Library (Hình ảnh sản phẩm)
┌─ Main Product Images (Cloudinary) ───────────────┐
│                                                   │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐                    │
│  │IMG1│ │IMG2│ │IMG3│ │ +  │  [Upload from      │
│  │ ⋮  │ │    │ │    │ │Add │   Cloudinary]      │
│  └────┘ └────┘ └────┘ └────┘                    │
│   Main   Alt    Alt    More                      │
│                                                   │
│  - Drag & drop to reorder                        │
│  - Click to set as main image                    │
│  - Each image: Edit, Delete, Alt Text            │
│                                                   │
│  ℹ️ Ảnh này hiển thị chung cho sản phẩm          │
│  ℹ️ Mỗi variant màu có thể có ảnh riêng (Tab 3)  │
└───────────────────────────────────────────────────┘
Best practices:

Tối thiểu 4 ảnh cho mỗi sản phẩm thời trang​

Resolution: 1200x1200px minimum

Format: JPG/PNG, WebP for better performance

Alt text cho SEO​

Tab 3: Variants Management (★ QUAN TRỌNG NHẤT)
Đây là phần cốt lõi cho shop thời trang. Có 2 modes:​

Mode 1: Variant Generator (Tạo tự động)
┌─ Generate Variants ──────────────────────────────┐
│                                                   │
│ Step 1: Select Attributes                         │
│                                                   │
│ Sizes (Select multiple) *                         │
│ [✓] S  [✓] M  [✓] L  [✓] XL  [ ] XXL             │
│                                                   │
│ Colors (Select multiple) *                        │
│ ┌────────────────────────────────────┐           │
│ │ ⊕ Trắng    #FFFFFF  [Color Picker] │ [Remove]  │
│ │ ⊕ Đen      #000000  [Color Picker] │ [Remove]  │
│ │ ⊕ Xanh Navy #001F3F [Color Picker] │ [Remove]  │
│ └────────────────────────────────────┘           │
│ [+ Add Color]                                     │
│                                                   │
│ Preview: 12 variants will be generated            │
│ (4 sizes × 3 colors)                             │
│                                                   │
│ [Generate Matrix] [Cancel]                        │
└───────────────────────────────────────────────────┘
Sau khi generate → Mode 2:

Mode 2: Variants Matrix Table (Bảng quản lý chi tiết)
jsx
┌─ Product Variants Matrix ────────────────────────────────────────┐
│ Filter: [All Colors ▼] [All Sizes ▼]  Search: [___________] 🔍  │
│                                                                   │
│ Bulk Actions: [Select All] [Set Price] [Set Stock] [Export CSV]  │
├───────────────────────────────────────────────────────────────────┤
│ [✓] │ Preview │  SKU          │ Size │ Color  │ Price │ Stock │ Images │ Actions │
├─────┼─────────┼───────────────┼──────┼────────┼───────┼───────┼────────┼─────────┤
│ [ ] │ [📷]   │ DEV-SM-W-S    │  S   │ ⚪Trắng │ 350K  │  50   │  3 📎  │ [✏️] [🗑️] │
│ [ ] │ [📷]   │ DEV-SM-W-M    │  M   │ ⚪Trắng │ 350K  │  75   │  3 📎  │ [✏️] [🗑️] │
│ [ ] │ [📷]   │ DEV-SM-W-L    │  L   │ ⚪Trắng │ 350K  │ ⚠️ 8  │  3 📎  │ [✏️] [🗑️] │
│ [ ] │ [📷]   │ DEV-SM-W-XL   │  XL  │ ⚪Trắng │ 350K  │  30   │  3 📎  │ [✏️] [🗑️] │
├─────┼─────────┼───────────────┼──────┼────────┼───────┼───────┼────────┼─────────┤
│ [ ] │ [📷]   │ DEV-SM-B-S    │  S   │ ⚫Đen  │ 350K  │  45   │  4 📎  │ [✏️] [🗑️] │
│ [ ] │ [📷]   │ DEV-SM-B-M    │  M   │ ⚫Đen  │ 350K  │  80   │  4 📎  │ [✏️] [🗑️] │
│ [ ] │ [📷]   │ DEV-SM-B-L    │  L   │ ⚫Đen  │ 360K  │  60   │  4 📎  │ [✏️] [🗑️] │
│ [ ] │ [📷]   │ DEV-SM-B-XL   │  XL  │ ⚫Đen  │ 360K  │  0    │  4 📎  │ [✏️] [🗑️] │
└───────────────────────────────────────────────────────────────────────┘

Visual Indicators:
⚠️ Low Stock (< 10)
🔴 Out of Stock (0)
Chức năng quan trọng:

Inline Editing: Click vào cell để edit nhanh​

Bulk Operations: Select nhiều variants → update cùng lúc​

Color-coded Rows: Group theo màu để dễ nhìn​

Stock Alerts: Highlight variants sắp hết hàng​

Variant Detail Modal (Click vào edit icon)
┌─ Edit Variant: DEV-SM-W-M ───────────────────────┐
│                                                   │
│ SKU: DEV-SM-W-M          [Auto-generate]          │
│                                                   │
│ Attributes (Read-only)                            │
│ Size: M                                           │
│ Color: Trắng (#FFFFFF) ⚪                         │
│                                                   │
│ Pricing                                           │
│ Price (VNĐ): [350,000]                           │
│ Compare at Price: [450,000] (Optional)            │
│ ℹ️ For showing discount                           │
│                                                   │
│ Inventory                                         │
│ Stock Quantity: [75]                              │
│ Low Stock Threshold: [10]                         │
│ ☑️ Continue selling when out of stock             │
│                                                   │
│ Variant Images (Specific to this color)           │
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐                      │
│ │IMG │ │IMG │ │IMG │ │ +  │                      │
│ └────┘ └────┘ └────┘ └────┘                      │
│                                                   │
│ Weight & Dimensions (For shipping)                │
│ Weight (g): [200]                                 │
│ L x W x H (cm): [30] x [25] x [5]               │
│                                                   │
│ Barcode: [________________] (Optional)            │
│                                                   │
│         [Save Variant] [Cancel]                   │
└───────────────────────────────────────────────────┘
Tab 4: Pricing & Inventory (Tổng quan)
┌─ Inventory Summary ──────────────────────────────┐
│                                                   │
│ Total Variants: 12                                │
│ Total Stock: 438 units                            │
│ Total Value: 153,300,000 VNĐ                     │
│                                                   │
│ Stock Distribution by Size:                       │
│ ┌─────────────────────────────────────┐          │
│ │ S:   95 units ████████░░  (22%)     │          │
│ │ M:  155 units ████████████  (35%)   │          │
│ │ L:  128 units ██████████░  (29%)    │          │
│ │ XL:  60 units █████░░░░░░  (14%)    │          │
│ └─────────────────────────────────────┘          │
│                                                   │
│ Stock Distribution by Color:                      │
│ ⚪ Trắng: 163 units (37%)                         │
│ ⚫ Đen: 185 units (42%)                           │
│ 🔵 Xanh Navy: 90 units (21%)                      │
│                                                   │
│ ⚠️ Variants Need Attention: 3                     │
│ - DEV-SM-W-L (8 units - Low stock)               │
│ - DEV-SM-B-XL (0 units - Out of stock)           │
│ - DEV-SM-N-S (5 units - Low stock)               │
│                                                   │
│ [Export Stock Report] [Bulk Restock]              │
└───────────────────────────────────────────────────┘
Tab 5: SEO & Additional
┌─ Search Engine Optimization ─────────────────────┐
│                                                   │
│ SEO Title (60 chars max)                          │
│ [Áo Sơ Mi Oxford Nam Devenir - Chất Liệu Cao Cấp]│
│ 45/60 characters                                  │
│                                                   │
│ Meta Description (160 chars max)                  │
│ [_____________________________________________]   │
│ [_____________________________________________]   │
│ 120/160 characters                                │
│                                                   │
│ URL Slug                                          │
│ [ao-so-mi-oxford-nam-devenir]                     │
│ Preview: devenir.com/products/ao-so-mi-oxford... │
│                                                   │
│ Focus Keyword                                     │
│ [áo sơ mi nam công sở]                           │
│                                                   │
└───────────────────────────────────────────────────┘

┌─ Product Relationships ──────────────────────────┐
│                                                   │
│ Related Products (Cross-sell)                     │
│ [Select products...]                              │
│ ┌────┐ ┌────┐ ┌────┐                             │
│ │Quần│ │Giày│ │Thắt│                             │
│ │Tây │ │Tây │ │Lưng│                             │
│ └────┘ └────┘ └────┘                             │
│                                                   │
│ Upsell Products (Premium alternatives)            │
│ [Select products...]                              │
│                                                   │
└───────────────────────────────────────────────────┘
SKU Naming Convention (Chuẩn hóa mã SKU)
Format chuẩn cho shop thời trang​
[BRAND]-[CATEGORY]-[COLOR]-[SIZE]

Ví dụ:
DEV-SM-W-M
└┬┘ └┬┘ └┬ └┬
 │   │   │  └─ Size: M
 │   │   └──── Color: W (White/Trắng)
 │   └──────── Category: SM (Sơ Mi)
 └──────────── Brand: DEV (Devenir)

Bảng mã hóa chuẩn:
Brand codes:

DEV = Devenir Collection

(Mở rộng cho brands khác)

Category codes:​

SM = Áo Sơ Mi

TH = Áo Thun

PO = Áo Polo

QT = Quần Tây

QJ = Quần Jean

AK = Áo Khoác

Color codes:​

W = White (Trắng)

B = Black (Đen)

N = Navy (Xanh Navy)

GR = Gray (Xám)

BL = Blue (Xanh Dương)

BG = Beige (Be)

BR = Brown (Nâu)

Size codes:

S, M, L, XL, XXL, XXXL

(Giữ nguyên)

Auto-generate SKU Logic
// Function tự động tạo SKU
function generateSKU(product, variant) {
  const brand = product.brand.code; // "DEV"
  const category = product.category.code; // "SM"
  const color = variant.color.code; // "W"
  const size = variant.size; // "M"
  
  return `${brand}-${category}-${color}-${size}`;
  // Output: "DEV-SM-W-M"
}

Workflow Quản lý Variants
Kịch bản 1: Tạo sản phẩm mới hoàn toàn
1. Tab 1: Nhập Basic Info (Name, Description, Category, Brand, Base Price)
   └→ Click [Next] hoặc chuyển Tab 2

2. Tab 2: Upload ảnh sản phẩm chung
   └→ Click [Next]

3. Tab 3: Generate Variants
   ├─ Chọn Sizes: [✓ S] [✓ M] [✓ L] [✓ XL]
   ├─ Chọn Colors: [Trắng #FFF] [Đen #000] [Navy #001F3F]
   └─ Click [Generate Matrix]
      └→ Hệ thống tạo 12 variants (4×3)

4. Trong Variants Matrix:
   ├─ Auto-generate SKUs cho tất cả
   ├─ Set giá cho từng variant (hoặc bulk set)
   ├─ Set stock cho từng variant
   └─ Upload ảnh riêng cho từng màu

5. Tab 4: Review tổng quan inventory

6. Tab 5: Điền SEO

7. [Save Draft] hoặc [Publish]

Kịch bản 2: Thêm màu mới cho sản phẩm đã có
1. Vào Products List → Click [Edit] sản phẩm cũ

2. Tab 3: Variants Management
   └→ Click [+ Add Color Variant]

3. Modal xuất hiện:
   ├─ New Color: [Xám] #808080
   ├─ Sizes to create: [✓ S] [✓ M] [✓ L] [✓ XL]
   └─ Click [Generate]
      └→ Hệ thống tạo 4 variants mới cho màu Xám

4. Set giá + stock + upload ảnh cho màu mới

5. [Save Changes]

Kịch bản 3: Restock (Nhập thêm hàng)
Option A: Single Variant Update
1. Variants Matrix → Click [✏️] variant cần restock
2. Update Stock Quantity: 75 → 150
3. [Save]

Option B: Bulk Restock
1. Variants Matrix → [✓] Select các variants cần restock
2. Click [Bulk Actions] → [Update Stock]
3. Modal: Choose operation
   ├─ ○ Set to value: [100]
   ├─ ● Add to current: [+50]
   └─ ○ Reduce from current: [-10]
4. [Apply to 5 selected variants]
Best Practices Tóm tắt
Tách biệt rõ ràng Product và Variant​

Product = Thông tin chung (name, description, category)

Variant = Thông tin cụ thể (size, color, SKU, price, stock)

SKU phải unique và có quy tắc rõ ràng​

Format: BRAND-CATEGORY-COLOR-SIZE

Auto-generate để tránh lỗi manual

Ảnh sản phẩm phân cấp​

Ảnh chung: Hiển thị trên listing page

Ảnh variant: Thay đổi khi user chọn màu

Stock management theo variant​

Mỗi SKU có số lượng riêng

Alert khi low stock (< 10 units)

Reserved stock (trong cart chưa checkout)

Matrix view cho variants​

Size × Color = Matrix

Dễ nhìn, dễ bulk edit

Filter và search nhanh

Pricing flexibility​

Base price là tham chiếu

Variant có thể override (VD: Size XXL đắt hơn)

Visual indicators rõ ràng​

Color swatches thực tế

Stock badges (green/yellow/red)

Size distribution charts

Cấu trúc này đảm bảo team admin của bạn có thể quản lý hàng trăm variants hiệu quả, phù hợp với đặc thù shop thời trang có nhiều size/màu.​