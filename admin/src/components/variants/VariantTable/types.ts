/**
 * Variant Table Types
 */

// Variant product reference type
export type VariantProductRef = string | { _id: string }

// Main Variant type
export interface Variant {
  _id: string
  sku: string
  product?: VariantProductRef
  product_id?: string
  productName?: string
  size: string
  color: string | null
  colorId?: string
  price: number
  stock: number
  lowStockThreshold: number
  mainImage?: string
  hoverImage?: string
  images?: string[]
  createdAt: string
}

// Product type for filtering
export interface Product {
  _id: string
  name: string
  slug: string
  description?: string
  category: string | { _id: string; name?: string }
  brand?: string | { _id: string; name?: string }
  basePrice: number
  status: 'draft' | 'published' | 'archived'
  isActive: boolean
  images?: string[]
  createdAt: string
  updatedAt: string
}

// Color type
export interface Color {
  _id: string
  name: string
  hex: string
  isActive: boolean
}

// Quick stats type
export interface QuickStats {
  totalSkus: number
  inStock: number
  lowStock: number
  outOfStock: number
  inventoryValue: number
}

// Filter state type
export interface VariantFilters {
  searchTerm: string
  filterProduct: string
  filterSize: string
  filterColor: string
  filterStockStatus: string
}

// CSV import row type
export interface CSVImportRow {
  sku?: string
  size?: string
  color?: string
  price?: string
  stock?: string
  [key: string]: string | undefined
}
