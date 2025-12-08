# Category Slug & Level Fix - Summary

## 🐛 Vấn đề (Problem)

Khi tạo category mới trong Admin Panel, các trường `level` và `slug`:

- ✅ Được hiển thị đúng trong F12 (DevTools)
- ❌ **KHÔNG** được lưu vào MongoDB

## 🔍 Nguyên nhân (Root Cause)

1. **CategoryModel.js**: Trường `slug` có `default: null`, khiến MongoDB bỏ qua giá trị được gửi từ frontend nếu là `null`/`undefined`
2. **Duplicate Index Warning**: Trường `name` có cả `unique: true` và `index: true`, gây conflict

## ✅ Giải pháp (Solution)

### 1. Sửa CategoryModel (`server/models/CategoryModel.js`)

**Trước:**

```javascript
slug: {
  type: String,
  trim: true,
  default: null, // ❌ Vấn đề ở đây
},
```

**Sau:**

```javascript
slug: {
  type: String,
  trim: true,
  required: true, // ✅ Bắt buộc phải có slug
},
```

**Index optimization:**

```javascript
// Xóa duplicate index
// categorySchema.index({ name: 1 }); // ❌ Removed

// Thêm index cho slug
categorySchema.index({ slug: 1 }); // ✅ Added
categorySchema.index({ parentCategory: 1 });
```

### 2. Cải thiện CategoryController (`server/controllers/CategoryController.js`)

**Cải thiện logic tạo category:**

```javascript
// Calculate level based on parent category
let categoryLevel = 0;
if (parentCategory) {
  const parent = await Category.findById(parentCategory);
  if (!parent) {
    return res.status(404).json({
      success: false,
      message: "Parent category not found",
    });
  }
  // Calculate level from parent
  categoryLevel = (parent.level || 0) + 1;
}

// Override with frontend level if provided (for manual control)
if (level !== undefined && level !== null) {
  categoryLevel = level;
}

// Generate slug if not provided
const categorySlug =
  slug && slug.trim() !== ""
    ? slug.trim()
    : name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

// Create category with all fields
const category = await Category.create({
  name,
  description: description || "",
  thumbnailUrl: thumbnailUrl || "",
  slug: categorySlug, // ✅ Always has value
  sortOrder: sortOrder !== undefined ? sortOrder : 0,
  parentCategory: parentCategory || null,
  level: categoryLevel, // ✅ Calculated from hierarchy
  isActive: isActive !== undefined ? isActive : true,
});
```

### 3. Migration Script cho categories hiện có

Tạo script `server/scripts/fixCategorySlugLevel.js` để:

- Tạo slug cho các category không có slug
- Tính toán lại level dựa trên hierarchy

**Kết quả migration:**

```
✅ Migration complete! Fixed 8 categories

📋 All categories after migration:
  - Bags | Level: 0 | Slug: "bags" | Parent: (none)
  - Jackets | Level: 0 | Slug: "jackets" | Parent: (none)
  - Scarves | Level: 0 | Slug: "scarves" | Parent: (none)
  - Shirts | Level: 0 | Slug: "shirts" | Parent: (none)
  - Sweaters | Level: 0 | Slug: "sweaters" | Parent: (none)
  ...
```

### 4. Test Script để verify

Tạo `server/scripts/testCreateCategory.js` để test:

- Tạo parent category (level 0)
- Tạo child category (level 1)
- Verify dữ liệu trong MongoDB

**Kết quả test:**

```
🎉 All tests passed!

✅ Parent category from DB:
   - Slug: "test-parent-category" ✓
   - Level: 0 ✓

✅ Child category from DB:
   - Slug: "test-child-category" ✓
   - Level: 1 ✓
```

## 📁 Files Changed

1. ✏️ `server/models/CategoryModel.js` - Sửa schema slug & indexes
2. ✏️ `server/controllers/CategoryController.js` - Cải thiện logic create category
3. ✅ `server/scripts/fixCategorySlugLevel.js` - Migration script (NEW)
4. ✅ `server/scripts/testCreateCategory.js` - Test script (NEW)

## 🧪 Testing

### Run migration để fix categories hiện có:

```bash
cd server
node scripts/fixCategorySlugLevel.js
```

### Run test để verify:

```bash
node scripts/testCreateCategory.js
```

### Test thủ công trong Admin Panel:

1. Mở Admin Panel → Categories
2. Tạo category mới với tên bất kỳ
3. Mở F12 → Network tab
4. Check response từ API
5. Verify trong MongoDB Compass/Atlas

## ✅ Kết quả

- ✅ `slug` và `level` giờ được lưu **chính xác** vào MongoDB
- ✅ Slug tự động generate từ tên category (có normalize tiếng Việt)
- ✅ Level tự động tính từ parent category hierarchy
- ✅ Không còn duplicate index warning
- ✅ Tất cả test cases đều pass

## 🎯 Next Steps (Optional)

1. Thêm validation để đảm bảo slug là unique
2. Thêm API endpoint để update slug bulk
3. Thêm UI để edit slug trực tiếp trong Admin Panel
4. Thêm tính năng generate slug preview khi người dùng nhập tên

---

**Created:** November 29, 2025  
**Author:** GitHub Copilot  
**Status:** ✅ Complete & Tested
