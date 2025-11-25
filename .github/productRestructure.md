
# README: Product & Variant Schema for E-Commerce

## Mục đích
Giải thích cách thiết kế schema sản phẩm với nhiều biến thể (màu, size, hình ảnh riêng biệt) giúp tối ưu quản lý, truy vấn và hiển thị trên website.

***

## 1. Product Collection

Chứa thông tin chung, không bị trùng lặp giữa các biến thể.

```json
{
  "_id": "ObjectId",
  "name": "Áo sơ mi Classic",
  "description": "Áo sơ mi cotton cổ điển, phù hợp cho nhiều dịp.",
  "category": "Áo sơ mi"
}
```

***

## 2. ProductVariant Collection

Mỗi bản ghi ứng với một biến thể theo màu và size. Lưu ảnh và giá riêng cho từng màu/size.

```json
{
  "_id": "ObjectId",
  "product_id": "ObjectId", 
  "sku": "SHIRT-RED-M",
  "color": "red",
  "size": "M",
  "price": 654,
  "quantity": 50,
  "mainImage": "/images/red-shirt-main.jpg",
  "hoverImage": "/images/red-shirt-hover.jpg",
  "images": [
    "/images/red-shirt-1.jpg",
    "/images/red-shirt-2.jpg"
  ]
}
```

***

## 3. Nguyên tắc thiết kế

- **Mỗi biến thể** có hình ảnh riêng: mainImage dùng cho ảnh chính, hoverImage cho hiệu ứng, images cho tất cả hình của màu.
- **SKU** nên là duy nhất cho từng màu/size.
- **Tồn kho/giá** gắn cho từng biến thể, không lưu ở bảng Product.
- **Category và Description**: chỉ lưu tại bảng Product, không cần lặp lại ở bảng biến thể.
- Tìm kiếm nhanh theo màu/size bằng truy vấn trực tiếp bảng ProductVariant.

***

## 4. Cách truy vấn lấy đúng biến thể

```javascript
const variant = await ProductVariant.findOne({
  product_id: <ProductId>,
  color: <selectedColor>,
  size: <selectedSize>
});
```

***

## 5. Các điểm mở rộng

- Có thể bổ sung các trường như: discount, ratings, status cho bảng biến thể.
- Hỗ trợ dễ dàng cho sản phẩm có nhiều biến thể và ảnh riêng biệt.
- Tương thích tốt với các frontend như React, Next.js, và các workflow thêm/xóa/sửa biến thể.