# Variant Color Group Sync Feature

## 🎯 Overview
Tính năng tự động đồng bộ thông tin (giá, ảnh, v.v.) cho các variants **cùng màu, khác size** khi chỉnh sửa 1 variant.

## 📋 Use Case
**Scenario:** Product A có 6 variants
- **Màu Trắng:** S, M, L (3 variants)
- **Màu Đen:** XL, XXL, 3XL (3 variants)

**Action:** Admin sửa variant "Đen XL" (giá 500k → 600k, thay ảnh mới)

**Result:** Variants "Đen XXL" và "Đen 3XL" cũng tự động update:
- ✅ Giá: 600k
- ✅ Ảnh chính, ảnh hover, gallery
- ✅ LowStockThreshold, binLocation, v.v.
- ❌ **Số lượng KHÔNG thay đổi** (mỗi size giữ stock riêng)

## 🔧 Technical Implementation

### Backend (Node.js)
**File:** `server/controllers/ProductController.js`

#### updateVariant() Enhancement
```javascript
export const updateVariant = asyncHandler(async (req, res) => {
  const { syncColorGroup = false, ...otherFields } = req.body;
  
  // ... existing update logic ...
  
  // NEW: Sync same-color variants
  if (syncColorGroup && originalColor) {
    const syncPayload = {
      price, mainImage, hoverImage, images,
      lowStockThreshold, weight, binLocation,
      // EXCLUDE: stock, quantity, reserved, incoming
    };
    
    await ProductVariant.updateMany(
      { 
        product_id: productId, 
        color: originalColor, 
        _id: { $ne: variant._id } 
      },
      { $set: syncPayload }
    );
  }
});
```

**Fields Synced:**
- ✅ `price` - Giá bán
- ✅ `mainImage` - Ảnh chính
- ✅ `hoverImage` - Ảnh hover
- ✅ `images` - Gallery ảnh
- ✅ `lowStockThreshold` - Ngưỡng cảnh báo hết hàng
- ✅ `weight` - Khối lượng
- ✅ `binLocation` - Vị trí kho
- ✅ `reorderPoint`, `reorderQuantity`, `safetyStock`

**Fields EXCLUDED (kept per-variant):**
- ❌ `stock` / `quantity` - Số lượng tồn kho
- ❌ `reserved` - Số lượng đang giữ chỗ
- ❌ `incoming` - Số lượng đang nhập về
- ❌ `sku` - Mã SKU (unique per variant)
- ❌ `size` - Kích thước

### Frontend (React + TypeScript)

#### 1. VariantDrawer.tsx (Standalone Variant Management)
**Location:** `admin/src/components/VariantDrawer.tsx`

**Implementation:**
```typescript
const payload = {
  // ... other fields ...
  syncColorGroup: true, // ✅ Always enable auto-sync
};

if (isEdit) {
  const response = await axiosInstance.put(
    `/products/admin/variants/${formData.sku}`, 
    payload
  );
  
  // Display success with sync count
  const syncedCount = response.data?.syncedCount || 0;
  if (syncedCount > 0) {
    toast.success(`Variant updated! ${syncedCount} same-color variant(s) synced.`);
  }
}
```

**UX Flow:**
1. User opens VariantDrawer (Edit mode)
2. Changes price from 500k → 600k
3. Clicks "Update Variant"
4. Backend updates current variant + 2 same-color variants
5. Toast: "Variant updated! 2 same-color variant(s) synced."
6. Table refreshes showing all 3 variants with new price

#### 2. ProductFormSimplified.tsx (Product Form Inline Edit)
**Location:** `admin/src/components/ProductFormSimplified.tsx`

**Implementation:**
```typescript
const handleAddOrUpdateVariant = () => {
  // ... validation ...
  
  if (editingVariantIndex !== null) {
    const originalColor = originalVariant.color;
    
    // ✨ Auto-sync same-color variants
    if (newVariant.color === originalColor) {
      const sameColorIndices = formData.variants
        .filter((v, idx) => v.color === originalColor && idx !== editingVariantIndex)
        .map((v, idx) => idx);
      
      if (sameColorIndices.length > 0) {
        sameColorIndices.forEach(idx => {
          updatedVariants[idx] = {
            ...updatedVariants[idx],
            price: newVariant.price,
            mainImage: selectedMainImage,
            hoverImage: selectedHoverImage,
            images: variantImages.map(img => img.url),
            // Keep original quantity
          };
        });
        
        toast.success(`Variant updated! ${sameColorIndices.length} same-color variant(s) synced.`);
      }
    }
  }
};
```

**Note:** Sync chỉ xảy ra **local state** trong form. Khi user submit product, tất cả variants (đã synced) sẽ được lưu vào database.

## 🎨 User Experience

### Before (Old Behavior)
1. Admin có Product với 6 variants (2 màu x 3 sizes)
2. Muốn đổi giá tất cả variants màu Đen từ 500k → 600k
3. Phải manually edit 3 variants riêng lẻ (Đen XL, Đen XXL, Đen 3XL)
4. Mất 3x thời gian, dễ sót variant

### After (New Behavior)
1. Admin edit 1 variant "Đen XL" (giá 500k → 600k)
2. Click "Update Variant"
3. Backend tự động sync 2 variants còn lại (Đen XXL, Đen 3XL)
4. Toast: "Variant updated! 2 same-color variant(s) synced."
5. Done! ⚡️

## 🔍 Testing Scenarios

### Scenario 1: VariantDrawer Edit (API Call)
**Setup:**
```
Product A:
- Trắng S (500k, stock: 10)
- Trắng M (500k, stock: 20)
- Trắng L (500k, stock: 30)
- Đen XL (500k, stock: 15)
- Đen XXL (500k, stock: 25)
- Đen 3XL (500k, stock: 35)
```

**Action:** Edit "Đen XL" via VariantDrawer
- Price: 500k → 600k
- Main Image: image1.jpg → image2.jpg

**Expected:**
```json
{
  "success": true,
  "message": "Variant updated successfully. 2 same-color variant(s) also synced.",
  "syncedCount": 2
}
```

**Database After:**
```
- Trắng S (500k, stock: 10) ✅ unchanged
- Trắng M (500k, stock: 20) ✅ unchanged
- Trắng L (500k, stock: 30) ✅ unchanged
- Đen XL (600k, stock: 15, image2.jpg) ✅ updated
- Đen XXL (600k, stock: 25, image2.jpg) ✅ synced
- Đen 3XL (600k, stock: 35, image2.jpg) ✅ synced
```

### Scenario 2: ProductFormSimplified Edit (Local State)
**Setup:** Same as above

**Action:** Edit "Trắng M" in Product Form
- Price: 500k → 550k
- Quantity: 20 → 25

**Expected Local State:**
```
- Trắng S (550k, stock: 10) ✅ price synced, stock kept
- Trắng M (550k, stock: 25) ✅ updated
- Trắng L (550k, stock: 30) ✅ price synced, stock kept
- Đen variants: unchanged
```

**Toast:** "Variant updated! 2 same-color variant(s) synced (prices, images)."

## 🚨 Important Notes

### 1. Stock Independence
**Số lượng (stock) KHÔNG BAO GIỜ được sync** vì:
- Mỗi size có số lượng riêng
- Stock tracking cần chính xác từng variant
- Tránh inventory errors

### 2. Color Matching Logic
Sync dựa trên **exact color name match**:
```javascript
color: "Đen" === "Đen" ✅
color: "Đen" !== "đen" ❌ (case-sensitive)
color: "Đen" !== "Black" ❌
```

**Best Practice:** Sử dụng Color dropdown (từ Colors collection) để đảm bảo consistency.

### 3. Performance Optimization
- Batch update sử dụng `updateMany()` (1 query cho tất cả variants)
- Không cần loop individual updates
- Cache invalidation chỉ gọi 1 lần

### 4. Realtime Updates
Sau khi sync, emit Socket.IO event:
```javascript
emitRealtimeEvent(req, 'variant:updated', {
  productId,
  syncedCount,
});
```

Frontend auto-refetch queries để hiển thị data mới nhất.

## 📊 API Response Examples

### Success Response (with sync)
```json
{
  "success": true,
  "message": "Variant updated successfully. 2 same-color variant(s) also synced.",
  "data": {
    "_id": "60a7...",
    "sku": "DEV-XL-BLACK",
    "color": "Đen",
    "size": "XL",
    "price": 600000,
    "quantity": 15
  },
  "syncedCount": 2
}
```

### Success Response (no sync)
```json
{
  "success": true,
  "message": "Variant updated successfully",
  "data": { ... },
  "syncedCount": 0
}
```

## 🔗 Related Files
- Backend: `server/controllers/ProductController.js` (line 449-550)
- Frontend Drawer: `admin/src/components/VariantDrawer.tsx` (line 286-356)
- Frontend Form: `admin/src/components/ProductFormSimplified.tsx` (line 370-450)
- Model: `server/models/ProductVariantModel.js`

## 🎯 Future Enhancements
1. **Batch Edit UI:** Select multiple variants → Edit all at once
2. **Sync History:** Log trong database khi có sync xảy ra
3. **Selective Sync:** Checkbox để chọn fields nào cần sync
4. **Color Groups:** Pre-define color groups (e.g., "Dark Colors", "Light Colors")
