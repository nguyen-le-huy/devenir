# Quick Start: Using the New Product Management System

## 🚀 Quick Integration (5 mins)

### Step 1: Import Components in Your Page

```tsx
import { ProductForm } from "@/components/ProductForm";
import { VariantsMatrix } from "@/components/VariantsMatrix";
import { VariantDetailModal } from "@/components/VariantDetailModal";
import { generateSKU, generateVariantMatrix } from "@/utils/skuGenerator";
```

### Step 2: ProductsPage Implementation

```tsx
import { useState } from "react";
import { ProductForm, type ProductFormData } from "@/components/ProductForm";
import { Button } from "@/components/ui/button";

export default function ProductsPage() {
  const [showForm, setShowForm] = useState(false);

  const handleSaveProduct = async (data: ProductFormData) => {
    try {
      // Call your backend API
      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        alert("Product saved successfully!");
        setShowForm(false);
        // Refresh product list
      }
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Failed to save product");
    }
  };

  if (showForm) {
    return (
      <ProductForm onSave={handleSaveProduct} onDraft={handleSaveProduct} />
    );
  }

  return (
    <>
      <Button onClick={() => setShowForm(true)}>Add Product</Button>
      {/* Product list here */}
    </>
  );
}
```

---

## 📋 Component Usage Examples

### ProductForm (5-Tab Form)

```tsx
<ProductForm
  onSave={(data) => {
    console.log("Full product data:", data);
    // API: POST /api/products
  }}
  onDraft={(data) => {
    console.log("Save draft:", data);
    // API: POST /api/products (status: "draft")
  }}
  initialData={{
    name: "Existing Product",
    // ... other fields
  }}
/>
```

**Form Data Structure:**

```typescript
{
  // Tab 1: Basic
  name: "Áo Sơ Mi Oxford",
  description: "...",
  category: "SM", // Code from CATEGORY_CODES
  brand: "DEV",
  basePrice: 350000,
  status: "published",
  tags: ["công sở", "thoáng mát"],

  // Tab 2: Media
  images: [
    {
      id: "img1",
      url: "https://res.cloudinary.com/...",
      isMain: true,
      altText: "Front view"
    }
  ],

  // Tab 3: Variants (Auto-generated)
  variants: [
    {
      sku: "DEV-SM-W-M",
      size: "M",
      color: "W",
      price: 350000,
      stock: 75,
      lowStockThreshold: 10,
      images: []
    }
    // ... more variants
  ],

  // Tab 5: SEO
  seoTitle: "Áo Sơ Mi Oxford Nam Devenir",
  seoDescription: "...",
  urlSlug: "ao-so-mi-oxford-nam",
  focusKeyword: "áo sơ mi nam",
  relatedProducts: ["prod_2", "prod_3"],
  upsellProducts: ["prod_5"]
}
```

---

### VariantsMatrix (Table View)

```tsx
import { useState } from "react"
import { VariantsMatrix } from "@/components/VariantsMatrix"
import { VariantDetailModal } from "@/components/VariantDetailModal"

function ProductInventory() {
  const [variants, setVariants] = useState([...])
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      <VariantsMatrix
        variants={variants}
        onVariantEdit={(variant) => {
          setSelectedVariant(variant)
          setModalOpen(true)
        }}
        onVariantDelete={(sku) => {
          setVariants(variants.filter(v => v.sku !== sku))
        }}
        onBulkAction={(skus, action, data) => {
          if (action === "setPrices") {
            // Update prices for selected variants
          }
        }}
      />

      <VariantDetailModal
        open={modalOpen}
        variant={selectedVariant}
        onClose={() => setModalOpen(false)}
        onSave={(updatedVariant) => {
          setVariants(
            variants.map(v => v.sku === updatedVariant.sku ? updatedVariant : v)
          )
          setModalOpen(false)
        }}
      />
    </>
  )
}
```

---

## 🔧 SKU Generator Usage

### Generate SKU

```typescript
import { generateSKU } from "@/utils/skuGenerator";

const sku = generateSKU({
  brand: "DEV",
  category: "SM",
  color: "W",
  size: "M",
});
// → "DEV-SM-W-M"
```

### Generate Variant Matrix

```typescript
import { generateVariantMatrix } from "@/utils/skuGenerator";

const variants = generateVariantMatrix({
  brand: "DEV",
  category: "SM",
  sizes: ["S", "M", "L", "XL"],
  colors: ["W", "B", "N"],
});

// Returns: 12 variant configs
// [
//   { brand: "DEV", category: "SM", color: "W", size: "S" },
//   { brand: "DEV", category: "SM", color: "W", size: "M" },
//   ...
// ]
```

### Parse SKU

```typescript
import { parseSKU } from "@/utils/skuGenerator";

const config = parseSKU("DEV-SM-W-M");
// → { brand: "DEV", category: "SM", color: "W", size: "M" }
```

---

## 🎯 Common Scenarios

### Create New Product with Variants

```typescript
// User flow:
// 1. Click "Add Product"
// 2. ProductForm opens
// 3. Fill Tab 1-2 (basic info + images)
// 4. Tab 3: Select sizes [S, M, L, XL] & colors [White, Black, Navy]
// 5. Click "Generate Variants" → Creates 12 SKUs automatically
// 6. Tab 4: Review totals (auto-calculated)
// 7. Tab 5: Fill SEO
// 8. Click "Publish" → POST to /api/products with full data

const handlePublish = async (formData: ProductFormData) => {
  const response = await fetch("/api/admin/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      product: {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        brand: formData.brand,
        basePrice: formData.basePrice,
        status: "published",
        // ... other product fields
      },
      variants: formData.variants.map((v) => ({
        sku: v.sku,
        size: v.size,
        color: v.color,
        price: v.price,
        stock: v.stock,
        // ... other variant fields
      })),
    }),
  });
};
```

### Restock Products

```typescript
// Option 1: Single variant
const updateStock = async (sku: string, newStock: number) => {
  await fetch(`/api/admin/variants/${sku}`, {
    method: "PUT",
    body: JSON.stringify({ stock: newStock }),
  });
};

// Option 2: Bulk update
const bulkRestock = async (
  skus: string[],
  operation: "set" | "add" | "subtract",
  amount: number
) => {
  await fetch("/api/admin/variants/bulk-update", {
    method: "PUT",
    body: JSON.stringify({
      skus,
      operation,
      amount,
    }),
  });
};
```

### Add New Color to Product

```typescript
// User flow:
// 1. ProductsPage → Find product → Edit
// 2. ProductForm opens with existing data
// 3. Tab 3: Add new color [Xám]
// 4. Select sizes that need this color
// 5. Click "Generate" → Adds 4 more variants (DEV-SM-GR-S/M/L/XL)
// 6. Save

const addColorToProduct = async (
  productId: string,
  newColor: "GR",
  sizes: ["S", "M", "L", "XL"]
) => {
  const variants = generateVariantMatrix({
    brand: "DEV",
    category: "SM",
    sizes,
    colors: [newColor],
  });

  await fetch(`/api/admin/products/${productId}/variants`, {
    method: "POST",
    body: JSON.stringify(variants),
  });
};
```

---

## 📊 Data Constants Reference

```typescript
// Categories
CATEGORY_CODES = {
  SM: "Áo Sơ Mi",
  TH: "Áo Thun",
  PO: "Áo Polo",
  QT: "Quần Tây",
  QJ: "Quần Jean",
  AK: "Áo Khoác",
};

// Colors (with hex codes)
COLOR_CODES = {
  W: { name: "Trắng", hex: "#FFFFFF" },
  B: { name: "Đen", hex: "#000000" },
  N: { name: "Xanh Navy", hex: "#001F3F" },
  GR: { name: "Xám", hex: "#808080" },
  BL: { name: "Xanh Dương", hex: "#0074D9" },
  BG: { name: "Be", hex: "#F5DEB3" },
  BR: { name: "Nâu", hex: "#8B4513" },
};

// Sizes
SIZE_CODES = {
  S: "S",
  M: "M",
  L: "L",
  XL: "XL",
  XXL: "XXL",
  XXXL: "XXXL",
};

// Brands
BRAND_CODES = {
  DEV: "Devenir Collection",
};
```

---

## ❌ Common Mistakes to Avoid

❌ **DON'T:** Edit SKU manually in VariantDetailModal
✅ **DO:** Always auto-generate using `generateVariantMatrix()`

❌ **DON'T:** Create variants without product images
✅ **DO:** Upload min 4 product images first (Tab 2)

❌ **DON'T:** Set price to 0
✅ **DO:** Validate price > 0 before saving

❌ **DON'T:** Mix variant-specific data with product data
✅ **DO:** Keep Product and Variant data separate

---

## 🧪 Testing Checklist

- [ ] Create product with 4 variants (2 sizes × 2 colors)
- [ ] Verify SKUs auto-generate correctly
- [ ] Edit one variant's price
- [ ] Bulk update stock for multiple variants
- [ ] Change product status to "archived"
- [ ] Generate CSV export
- [ ] Search by SKU in VariantsMatrix
- [ ] Filter by size and color
- [ ] Add new color to existing product
- [ ] Delete a variant

---

**Need Help?** See `PRODUCT_MANAGEMENT_GUIDE.md` for detailed documentation.
