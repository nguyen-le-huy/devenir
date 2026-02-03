---
description: Chức năng Xuất File Báo Cáo Kho Hàng
---

# Chức Năng Xuất File Báo Cáo Kho Hàng

## Tổng Quan

Chức năng cho phép admin xuất báo cáo tồn kho dưới dạng file CSV với đầy đủ thông tin sản phẩm, hỗ trợ nhiều loại báo cáo và bộ lọc linh hoạt.

---

## Kiến Trúc Triển Khai

### Files Đã Tạo/Chỉnh Sửa

```
📁 server/
├── controllers/
│   └── InventoryController.js    ← Thêm function exportInventoryReport()
└── routes/
    └── inventoryRoutes.js        ← Thêm route POST /export

📁 admin/src/
├── components/inventory/
│   └── InventoryExportDialog.tsx ← Component modal xuất file (MỚI)
├── pages/inventory/
│   └── InventoryPage.tsx         ← Thêm nút "Xuất File" và state
└── locales/
    └── translations.ts           ← Thêm key i18n "inventory.page.export"
```

---

## API Endpoint

### POST `/api/admin/inventory/export`

**Headers Required:**
- `Authorization: Bearer <token>` (Admin role)
- `Content-Type: application/json`

**Request Body:**
```json
{
  "fileType": "csv" | "excel",
  "columns": ["sku", "productName", "attributes", "inventory", "available", ...],
  "reportType": "all" | "top_value" | "needs_restock" | "slow_moving" | "custom",
  "filters": {
    "statusFilters": {
      "stockStatus": ["low_stock", "out_of_stock"],
      "hasWarning": true
    },
    "quantityFilters": {
      "availableOnly": true
    }
  },
  "sorting": {
    "field": "inventory" | "available" | "totalValue" | "unitPrice" | "lastUpdated",
    "order": "asc" | "desc"
  }
}
```

**Response:** File CSV với UTF-8 BOM encoding

---

## Các Loại Báo Cáo (reportType)

| Report Type | Mô Tả | Logic |
|-------------|-------|-------|
| `all` | Tất cả sản phẩm | Không filter, sắp xếp theo sorting |
| `top_value` | Top sản phẩm giá trị cao | Sort theo inventoryValue DESC, limit 100 |
| `needs_restock` | Cần nhập thêm hàng | Filter: quantity < lowStockThreshold |
| `slow_moving` | Hàng tồn lâu (>90 ngày) | Filter: updatedAt < 90 days ago |
| `custom` | Lọc tùy chỉnh | Áp dụng filters từ request body |

---

## Cột Dữ Liệu Hỗ Trợ

| Column ID | Header Tiếng Việt | Mô Tả |
|-----------|-------------------|-------|
| `sku` | SKU | Mã SKU sản phẩm |
| `productName` | Tên Sản Phẩm | Tên product từ collection products |
| `attributes` | Thuộc Tính | Format: "Màu - Size" |
| `inventory` | Tồn Kho | Số lượng tồn kho (quantity) |
| `available` | Khả Dụng | quantity - reserved |
| `onHold` | Đang Giữ | Số lượng reserved |
| `incoming` | Đang Nhập | Số lượng đang nhập về |
| `unitPrice` | Giá Đơn Vị (US$) | Giá bán (price) |
| `totalValue` | Tổng Giá Trị (US$) | quantity × price |
| `status` | Trạng Thái | Đủ Hàng/Cảnh Báo/Hết Hàng/Tồn Kho Cao |
| `warningLevel` | Mức Cảnh Báo | lowStockThreshold |
| `lastUpdated` | Cập Nhật Cuối | Format: DD/MM/YYYY HH:mm |

---

## Cấu Trúc File CSV Xuất Ra

```csv
"BÁO CÁO TỒN KHO - TẤT CẢ SẢN PHẨM"
"Ngày xuất: 13/12/2025 22:51"
"Tổng số SKU: 150 | Tổng giá trị: $25,680.50"

SKU,Tên Sản Phẩm,Thuộc Tính,Tồn Kho,Khả Dụng,Giá Đơn Vị (US$),Tổng Giá Trị (US$),Trạng Thái
DEV-001,Áo Jacket Premium,Navy - M,25,23,89.00,2225.00,Đủ Hàng
DEV-002,Khăn Len Cashmere,Beige - Free Size,5,5,45.00,225.00,Cảnh Báo
...

"TỔNG CỘNG","150 SKU","","","","","","$25,680.50"
```

---

## Đặt Tên File

Format: `baocao_kho_[loai_bao_cao]_[YYYYMMDD]_[HHmm].csv`

| Loại Báo Cáo | Tên File Ví Dụ |
|--------------|----------------|
| Tất cả sản phẩm | `baocao_kho_tat_ca_san_pham_20251213_2251.csv` |
| Top giá trị cao | `baocao_kho_top_gia_tri_cao_20251213_2251.csv` |
| Cần nhập thêm | `baocao_kho_can_nhap_them_20251213_2251.csv` |
| Hàng tồn lâu | `baocao_kho_hang_ton_lau_20251213_2251.csv` |
| Lọc tùy chỉnh | `baocao_kho_loc_tuy_chinh_20251213_2251.csv` |

---

## Frontend Component Flow

### 1. InventoryPage.tsx
```tsx
// State quản lý dialog
const [exportDialogOpen, setExportDialogOpen] = useState(false)

// Nút trigger
<Button variant="outline" onClick={() => setExportDialogOpen(true)}>
  <IconDownload /> {t("inventory.page.export")}
</Button>

// Render dialog
<InventoryExportDialog
  open={exportDialogOpen}
  onClose={() => setExportDialogOpen(false)}
/>
```

### 2. InventoryExportDialog.tsx

**States quản lý:**
- `fileType`: "csv" | "excel"
- `reportType`: Loại báo cáo
- `columns`: Mảng các cột được chọn
- `sortField` + `sortOrder`: Cách sắp xếp
- `filterLowStock`, `filterOutOfStock`, `filterAvailableOnly`: Bộ lọc custom

**Flow xuất file:**
1. User chọn các tùy chọn trong dialog
2. Click "Xuất Báo Cáo"
3. Gọi API với `responseType: "blob"`
4. Tạo Blob từ response
5. Tạo download link với filename động
6. Trigger download
7. Show toast thành công

---

## Backend Logic Flow

### InventoryController.js - exportInventoryReport()

```
1. Validate fileType (csv | excel)
2. Build MongoDB Aggregation Pipeline:
   a. Match active variants
   b. Lookup products
   c. Add computed fields (available, inventoryValue, healthStatus)
   d. Apply status filters
   e. Apply attribute filters (sizes, colors)
   f. Apply value filters (price range, value range)
   g. Apply quantity filters (hasOnHold, hasIncoming, availableOnly)
   h. Apply date filters (lastUpdated range, newItemsDays)
   i. Apply special report logic (needs_restock, top_value, slow_moving)
   j. Sort and limit (max 10,000 rows)
3. Execute aggregation
4. Format data với columnMapping
5. Build CSV content với:
   - Title header (tên báo cáo)
   - Ngày giờ xuất
   - Summary (tổng SKU, tổng giá trị)
   - Data headers
   - Data rows
   - Summary row (nếu fileType = excel)
6. Set response headers (Content-Type, Content-Disposition)
7. Send CSV với UTF-8 BOM
```

---

## Giới Hạn & Performance

| Giới Hạn | Giá Trị |
|----------|---------|
| Max rows per export | 10,000 SKU |
| File encoding | UTF-8 với BOM (hỗ trợ Excel) |
| Date format | DD/MM/YYYY HH:mm |
| Number format | 2 decimal places cho giá trị tiền |

---

## Đa Ngôn Ngữ (i18n)

Thêm vào `locales/translations.ts`:

```typescript
// English
inventory: {
  page: {
    export: "Export",
    // ...
  }
}

// Vietnamese  
inventory: {
  page: {
    export: "Xuất File",
    // ...
  }
}
```

---

## Cách Sử Dụng

1. Đăng nhập Admin Panel
2. Vào trang **Quản lý tồn kho** (`/inventory`)
3. Click nút **"Xuất File"** ở góc trên phải
4. Trong dialog:
   - Chọn **Định dạng file**: CSV hoặc Excel
   - Chọn **Loại báo cáo**: Tất cả, Top giá trị, Cần nhập thêm, Hàng tồn lâu, Tùy chỉnh
   - Nếu chọn "Tùy chỉnh", tick các bộ lọc mong muốn
   - Chọn **Sắp xếp theo** và **Thứ tự**
   - Check/uncheck các **Cột dữ liệu** cần xuất
5. Click **"Xuất Báo Cáo"**
6. File CSV được tải về tự động

---

## Error Handling

| Error Code | Mô Tả | HTTP Status |
|------------|-------|-------------|
| `INVALID_FILTERS` | fileType không hợp lệ | 400 |
| `NO_DATA` | Không có dữ liệu khớp filter | 200 (success: false) |
| `EXPORT_FAILED` | Lỗi server khi xuất | 500 |

---

## Ví Dụ Request/Response

### Request - Xuất sản phẩm cần nhập thêm
```json
{
  "fileType": "excel",
  "columns": ["sku", "productName", "inventory", "available", "warningLevel", "status"],
  "reportType": "needs_restock",
  "sorting": {
    "field": "inventory",
    "order": "asc"
  }
}
```

### Response
File CSV với nội dung:
```
"BÁO CÁO TỒN KHO - SẢN PHẨM CẦN NHẬP THÊM"
"Ngày xuất: 13/12/2025 22:51"
"Tổng số SKU: 25 | Tổng giá trị: $3,450.00"

SKU,Tên Sản Phẩm,Tồn Kho,Khả Dụng,Mức Cảnh Báo,Trạng Thái
DEV-015,Áo Khoác Dạ,0,0,10,Hết Hàng
DEV-023,Khăn Len Premium,3,3,15,Cảnh Báo
...

"TỔNG CỘNG","25 SKU","","","","$3,450.00"
```
