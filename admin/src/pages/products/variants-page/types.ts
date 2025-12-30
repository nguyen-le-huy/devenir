/**
 * Types for Variants Page
 */

export type VariantProductRef = string | { _id: string }

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

export interface Product {
  _id: string
  name: string
  slug: string
  description?: string
  category: string | { _id: string; name: string }
  brand?: string | { _id: string; name: string }
  basePrice: number
  status: 'draft' | 'published' | 'archived'
  isActive: boolean
  images?: string[]
  createdAt: string
  updatedAt: string
}

export interface Color {
  _id: string
  name: string
  hex: string
  isActive: boolean
}

export interface QuickStats {
  totalSkus: number
  inStock: number
  lowStock: number
  outOfStock: number
  inventoryValue: number
}

export interface VariantFilters {
  searchTerm: string
  filterProduct: string
  filterSize: string
  filterColor: string
  filterStockStatus: string
}
