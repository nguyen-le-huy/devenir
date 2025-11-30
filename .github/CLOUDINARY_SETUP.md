# Cloudinary Setup Guide (Hướng dẫn cấu hình Cloudinary)

Để upload ảnh trong Product Management, bạn cần cấu hình Cloudinary.

## Bước 1: Tạo tài khoản Cloudinary

1. Truy cập: https://cloudinary.com/
2. Click "Sign Up Free"
3. Đăng ký với email hoặc Google

## Bước 2: Lấy CLOUD_NAME

1. Sau khi đăng nhập, vào Dashboard
2. Ở phần **"Account Details"**, tìm **"Cloud Name"**
3. Copy giá trị này (ví dụ: `devenir`, `myshop-123`, etc.)

## Bước 3: Tạo Upload Preset (Unsigned)

Vì frontend upload trực tiếp, cần tạo unsigned preset:

1. Vào **Settings** → **Upload**
2. Scroll xuống **"Upload presets"**
3. Click **"Add upload preset"** (bên phải dòng "Upload presets")
4. Nhập các thông tin:
   - **Name:** `devenir_products` (bắt buộc - trùng với code)
   - **Signing Mode:** `Unsigned` (cho phép upload từ frontend)
   - **Folder:** `devenir/products` (optional - để tổ chức ảnh)
5. Click **"Save"**

## Bước 4: Cập nhật Code

Mở file: `admin/src/components/ProductForm.tsx`

Tìm dòng:

```tsx
const CLOUDINARY_NAME = "devenir"; // REPLACE WITH YOUR CLOUD_NAME
```

Thay `"devenir"` bằng **CLOUD_NAME** của bạn từ Bước 2.

Ví dụ:

```tsx
const CLOUDINARY_NAME = "my-company-cloud"; // Thay từ "devenir"
```

## Bước 5: Test Upload

1. Chạy admin app: `npm run dev` ở folder `/admin`
2. Vào `/admin/products`
3. Click "Add Product"
4. Ở Tab "Media", click "Add Image"
5. Chọn ảnh → upload

Nếu thành công:

- ✅ Alert hiển thị: `"N image(s) uploaded successfully!"`
- ✅ Ảnh xuất hiện trong grid

Nếu lỗi:

- ❌ Check console (F12) xem error
- ❌ Kiểm tra CLOUD_NAME có đúng không
- ❌ Kiểm tra Upload Preset tên `devenir_products` đã được tạo chưa

## Tùy chọn: Tối ưu ảnh

Khi upload, bạn có thể thêm transformations. Ví dụ:

```tsx
const response = await fetch(
  `https://api.cloudinary.com/v1_1/${CLOUDINARY_NAME}/image/upload?` +
    `w=1200&h=1200&c=fill&q=auto&f=auto`, // Tối ưu: resize 1200x1200, quality auto, format auto
  {
    method: "POST",
    body: formDataUpload,
  }
);
```

Các tham số:

- `w=1200` - chiều rộng
- `h=1200` - chiều cao
- `c=fill` - crop mode
- `q=auto` - quality tự động
- `f=auto` - format tự động (WebP cho browsers hỗ trợ)

## Bước tiếp theo

Sau khi upload hoạt động, bạn có thể:

1. **Tạo sản phẩm mới:**

   - Điền Basic Info
   - Upload ảnh
   - Generate variants
   - Click "Publish Product"

2. **Backend sẽ lưu:**
   - Ảnh URLs từ Cloudinary
   - SKU chuẩn (BRAND-CATEGORY-COLOR-SIZE)
   - Tất cả thông tin vào MongoDB

---

**Cần giúp?** Check console browser (F12) → Network tab để xem request Cloudinary.
