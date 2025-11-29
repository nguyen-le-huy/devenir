# Product Management System - Implementation Guide

## Overview

This document outlines the professional, production-ready product management system for Devenir e-commerce platform, implementing best practices from the `productmanage.md` specification.

---

## Architecture

### 2-Level Product Structure

```
Product (Sản phẩm chính)
├── Name, Description, Category, Brand, Base Price
├── Status (Draft, Published, Archived)
├── Tags, SEO Info, Relationships
└── Variants (Biến thể chi tiết)
    ├── SKU (Auto-generated: BRAND-CATEGORY-COLOR-SIZE)
    ├── Size, Color
    ├── Price, Compare Price (Individual override)
    ├── Stock Quantity, Low Stock Threshold
    ├── Images (Color-specific)
    ├── Weight, Dimensions, Barcode
    └── Product Variant in Database
```

**Why This Structure?**

- ✅ Matches database schema (Product + ProductVariant)
- ✅ Supports complex fashion attributes (size × color)
- ✅ Allows flexible pricing & inventory per variant
- ✅ Scales to hundreds of variants efficiently

---

## Components

### 1. **ProductForm.tsx**

Main product creation/editing form with 5 tabs.

**Location:** `src/components/ProductForm.tsx`

**Features:**

- Tab 1: Basic Info (Name, Description, Category, Brand, Base Price, Status)
- Tab 2: Media (Product images - Cloudinary)
- Tab 3: Variants (Generator + Matrix)
  - Generate variants by selecting sizes × colors
  - Auto-creates SKUs using naming convention
  - Preview count: "12 variants will be generated (4 sizes × 3 colors)"
- Tab 4: Inventory Summary (Auto-calculated totals)
- Tab 5: SEO & Relationships (Meta tags, URL slug, related products)

**Key Props:**

```typescript
interface ProductFormProps {
  onSave?: (data: ProductFormData) => void;
  onDraft?: (data: ProductFormData) => void;
  initialData?: Partial<ProductFormData>;
}

interface ProductFormData {
  name: string;
  description: string;
  category: string;
  brand: string;
  basePrice: number;
  tags: string[];
  status: "draft" | "published" | "archived";
  images: ImageData[];
  variants: Variant[];
  seoTitle: string;
  seoDescription: string;
  urlSlug: string;
  focusKeyword: string;
  relatedProducts: string[];
  upsellProducts: string[];
}
```

**Usage Example:**

```tsx
import { ProductForm } from "@/components/ProductForm";

function CreateProductPage() {
  const handleSave = (data: ProductFormData) => {
    // API call to save
    console.log("Saving product:", data);
  };

  return <ProductForm onSave={handleSave} onDraft={handleSave} />;
}
```

---

### 2. **VariantsMatrix.tsx**

Interactive table displaying variant matrix with filtering, search, and bulk actions.

**Location:** `src/components/VariantsMatrix.tsx`

**Features:**

- **Filtering:** By size, color, or search SKU
- **Selection:** Checkbox for bulk operations
- **Inline Indicators:**
  - Stock status badges (In Stock=green, Low=yellow, Out=red)
  - Color swatches
  - Image count
- **Bulk Actions:** Set prices, update stock, export
- **Summary Stats:** Total variants, total stock, total value

**Key Props:**

```typescript
interface VariantsMatrixProps {
  variants: Variant[];
  onVariantEdit?: (variant: Variant) => void;
  onVariantDelete?: (sku: string) => void;
  onVariantAdd?: () => void;
  onBulkAction?: (selectedSkus: string[], action: string, data?: any) => void;
}
```

**Visual Example:**

```
┌─ Variants Matrix ─────────────────────────────────┐
│ [Search] [Filter Size ▼] [Filter Color ▼]        │
│ Summary: 12 variants | 438 stock | 153.3M VNĐ    │
├─────────────────────────────────────────────────┤
│ [✓] Preview │ SKU │ Size │ Color │ Price │ Stock │
├─────────────────────────────────────────────────┤
│ [ ] [📷]   │ DEV-SM-W-M │ M │ ⚪ Trắng │ 350K │ 75 ✓ │
│ [ ] [📷]   │ DEV-SM-B-L │ L │ ⚫ Đen   │ 350K │ 8 ⚠️ │
│ [ ] [📷]   │ DEV-SM-N-XL│ XL│ 🔵 Navy │ 350K │ 0 🔴 │
└─────────────────────────────────────────────────┘
```

---

### 3. **VariantDetailModal.tsx**

Modal for editing individual variant details.

**Location:** `src/components/VariantDetailModal.tsx`

**Fields:**

- SKU (Read-only, with copy button)
- Size, Color (Read-only)
- Price & Compare Price
- Stock & Low Stock Threshold
- Variant-specific Images
- Weight & Dimensions
- Barcode

**Key Props:**

```typescript
interface VariantDetailModalProps {
  open: boolean;
  variant: Variant | null;
  onClose: () => void;
  onSave: (variant: Variant) => void;
  readonly?: boolean;
}
```

---

### 4. **SKU Generator Utility**

Auto-generates and parses SKUs using naming convention.

**Location:** `src/utils/skuGenerator.ts`

**SKU Format:**

```
BRAND-CATEGORY-COLOR-SIZE
├─ DEV      (Brand code)
├─ SM       (Category: Sơ Mi)
├─ W        (Color: White/Trắng)
└─ M        (Size: Medium)
→ Result: DEV-SM-W-M
```

**Functions:**

```typescript
// Generate single SKU
generateSKU({ brand: "DEV", category: "SM", color: "W", size: "M" });
// → "DEV-SM-W-M"

// Generate variant matrix (sizes × colors)
generateVariantMatrix({
  brand: "DEV",
  category: "SM",
  sizes: ["S", "M", "L", "XL"],
  colors: ["W", "B", "N"],
});
// → 12 variant configs

// Parse SKU back to config
parseSKU("DEV-SM-W-M");
// → { brand: "DEV", category: "SM", color: "W", size: "M" }
```

**Brand Codes:**

```typescript
DEV → Devenir Collection
(Extensible for future brands)
```

**Category Codes:**

```typescript
SM → Áo Sơ Mi
TH → Áo Thun
PO → Áo Polo
QT → Quần Tây
QJ → Quần Jean
AK → Áo Khoác
```

**Color Codes:**

```typescript
W  → Trắng (#FFFFFF)
B  → Đen (#000000)
N  → Xanh Navy (#001F3F)
GR → Xám (#808080)
BL → Xanh Dương (#0074D9)
BG → Be (#F5DEB3)
BR → Nâu (#8B4513)
```

**Size Codes:**

```typescript
S, M, L, XL, XXL, XXXL;
```

---

## Workflows

### **Workflow 1: Create New Product**

```
1. ProductsPage → Click "Add Product"
   ↓
2. ProductForm opens with empty form
   ├─ Tab 1: Enter basic info (name, description, category, brand, base price)
   ├─ Tab 2: Upload product images (Cloudinary)
   ├─ Tab 3: Generate variants
   │  ├─ Select sizes: [✓S] [✓M] [✓L] [✓XL]
   │  ├─ Select colors: [⚪Trắng] [⚫Đen] [🔵Navy]
   │  └─ Click "Generate Variants Matrix" → Creates 12 variants
   ├─ Tab 4: Review inventory summary (auto-calculated)
   ├─ Tab 5: Fill SEO info
   └─ Click "Publish Product" or "Save as Draft"
   ↓
3. Product saved to database with all variants
```

**Example Output:**

```
Product: "Áo Sơ Mi Oxford Nam"
├─ 12 Variants Created
├─ SKUs: DEV-SM-W-S, DEV-SM-W-M, DEV-SM-W-L, DEV-SM-W-XL,
│         DEV-SM-B-S, DEV-SM-B-M, DEV-SM-B-L, DEV-SM-B-XL,
│         DEV-SM-N-S, DEV-SM-N-M, DEV-SM-N-L, DEV-SM-N-XL
└─ Status: Published
```

### **Workflow 2: Add New Color to Existing Product**

```
1. ProductsPage → Find existing product → Click "Edit"
   ↓
2. ProductForm opens with existing data
   ├─ Tab 1: Review/update basic info
   ├─ Tab 2: Review/add images
   ├─ Tab 3: Generate additional color
   │  ├─ Current colors: [Trắng] [Đen]
   │  ├─ Add new: [Xám] (select sizes again)
   │  └─ Click "Generate" → Adds 4 more variants (Xám in all sizes)
   └─ Tab 4: View updated inventory
   ↓
3. 4 new variants created: DEV-SM-GR-S/M/L/XL
```

### **Workflow 3: Restock Products**

**Option A: Single Variant**

```
1. VariantsMatrix → Click edit (✏️) on variant
   ↓
2. VariantDetailModal opens
   ├─ Stock: 75 → 150
   ├─ Click "Save Variant"
   ↓
3. Stock updated
```

**Option B: Bulk Restock**

```
1. VariantsMatrix → Select multiple variants [✓]
   ↓
2. Click "Bulk Actions" → "Update Stock"
   ├─ Choose: ○ Set to value: [100]
   │          ● Add to current: [+50]
   │          ○ Reduce: [-10]
   ↓
3. Click "Apply to 5 selected"
   ↓
4. Stock updated for all selected variants
```

---

## Database Schema Mapping

### ProductFormData → Database Models

**Product Model:**

```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  category: String,
  brand: String,
  basePrice: Number,
  tags: [String],
  status: String, // draft, published, archived
  images: [{
    id: String,
    url: String,
    isMain: Boolean,
    altText: String
  }],
  seoTitle: String,
  seoDescription: String,
  urlSlug: String,
  focusKeyword: String,
  relatedProducts: [ObjectId],
  upsellProducts: [ObjectId],
  createdAt: Date,
  updatedAt: Date
}
```

**ProductVariant Model:**

```javascript
{
  _id: ObjectId,
  productId: ObjectId, // Reference to Product
  sku: String, // UNIQUE: DEV-SM-W-M
  size: String,
  color: String,
  price: Number,
  comparePrice: Number,
  stock: Number,
  lowStockThreshold: Number,
  images: [String],
  weight: Number,
  dimensions: {
    length: Number,
    width: Number,
    height: Number
  },
  barcode: String,
  createdAt: Date,
  updatedAt: Date
}
```

---

## Best Practices

### ✅ Form Usage

1. **Always use ProductForm for product creation/editing**

   - Don't create variants manually
   - Always use generator for consistency

2. **Validate before save**

   - Minimum 4 product images
   - At least 1 variant
   - SEO title min 30 chars, max 60
   - Description min 100 chars

3. **Handle errors gracefully**
   - Show SKU uniqueness errors
   - Validate dimensions > 0
   - Price must be > 0

### ✅ Variant Management

1. **Use VariantsMatrix for overview**

   - Filter by size/color/search
   - Bulk operations for efficiency
   - Real-time stock alerts

2. **Use VariantDetailModal for details**

   - Edit one variant at a time
   - Update weight/dimensions per color (affects shipping)
   - Track compare prices for promotions

3. **SKU Naming**
   - Never manually edit SKU
   - Use auto-generation
   - Keep naming consistent

### ✅ Image Management

1. **Product Images** (Tab 2)

   - Shared across all variants
   - Min 4 images
   - Resolution: 1200×1200px

2. **Variant Images** (VariantDetailModal)
   - Color-specific
   - Replaces main image when user selects color
   - Can be same as product images

---

## Integration Checklist

- [ ] **Backend APIs Created**

  - [ ] POST /api/products (Create)
  - [ ] PUT /api/products/:id (Update)
  - [ ] GET /api/products/:id (Read)
  - [ ] DELETE /api/products/:id (Delete)
  - [ ] POST /api/products/:id/variants (Create variants)
  - [ ] PUT /api/variants/:sku (Update variant)
  - [ ] DELETE /api/variants/:sku (Delete variant)

- [ ] **Validation**

  - [ ] SKU uniqueness check
  - [ ] Image upload to Cloudinary
  - [ ] Price/stock > 0
  - [ ] Required fields filled

- [ ] **UI Polish**

  - [ ] Loading states while saving
  - [ ] Success/error toasts
  - [ ] Confirmation dialogs for delete
  - [ ] Auto-save drafts every 30 seconds

- [ ] **Features**
  - [ ] Product search/filter on list
  - [ ] Bulk import from CSV
  - [ ] Bulk export to Excel
  - [ ] Stock alerts & notifications
  - [ ] Variant cloning (copy variant to new color)

---

## Code Examples

### Creating Products Programmatically

```typescript
import { generateVariantMatrix } from "@/utils/skuGenerator";

async function createProductWithVariants(productData: ProductFormData) {
  // 1. Create product
  const productRes = await fetch("/api/products", {
    method: "POST",
    body: JSON.stringify({
      name: productData.name,
      description: productData.description,
      category: productData.category,
      brand: productData.brand,
      basePrice: productData.basePrice,
      images: productData.images,
      status: productData.status,
    }),
  });
  const product = await productRes.json();

  // 2. Create variants
  const variantRes = await fetch(`/api/products/${product._id}/variants`, {
    method: "POST",
    body: JSON.stringify(productData.variants),
  });
  const variants = await variantRes.json();

  return { product, variants };
}
```

### Restocking Variants

```typescript
async function restockVariants(
  skus: string[],
  quantity: number,
  mode: "set" | "add" | "subtract"
) {
  const updates = skus.map((sku) => {
    if (mode === "set") return { sku, stock: quantity };
    if (mode === "add") return { sku, stock: { $inc: quantity } };
    if (mode === "subtract") return { sku, stock: { $dec: quantity } };
  });

  const res = await fetch("/api/variants/bulk-update", {
    method: "PUT",
    body: JSON.stringify({ updates }),
  });

  return res.json();
}
```

---

## Performance Considerations

- **Lazy Load Images:** Use Cloudinary CDN with transformation parameters
- **Pagination:** Max 50 products per page
- **Variant Caching:** Cache generated variant matrix
- **Bulk Operations:** Batch API calls (max 100 variants per request)
- **Search Index:** Index SKU, name, category for fast search

---

## Future Enhancements

1. **Variant Templates**

   - Save variant configurations as templates
   - Re-use for similar products

2. **AI-Assisted**

   - Auto-generate descriptions from images
   - SKU suggestions based on product type

3. **Inventory Sync**

   - Real-time sync with warehouse systems
   - Automatic low-stock alerts
   - Predictive restocking

4. **Multi-Language**

   - Translate product names/descriptions
   - Localized SKU variants

5. **Advanced Analytics**
   - Variant performance metrics
   - Size/color popularity trends
   - Revenue by variant

---

This implementation provides a professional, scalable product management system following e-commerce best practices and Devenir's business requirements.
