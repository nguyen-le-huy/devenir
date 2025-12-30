/**
 * Variant Drawer Types
 */

export interface VariantDrawerProps {
  isOpen: boolean
  variantId?: string
  variantData?: VariantFormData
  isEdit?: boolean
  onClose: () => void
  onSuccess: () => void
}

export interface Product {
  _id: string
  name: string
}

export interface Color {
  _id: string
  name: string
  hex: string
}

export interface VariantImage {
  url: string
  id: string
}

export interface VariantFormState {
  product: string
  sku: string
  size: string
  color: string
  price: number
  stock: number
  lowStockThreshold: number
}

export interface VariantFormData {
  _id?: string
  product?: string
  product_id?: string
  sku?: string
  size?: string
  color?: string
  price?: number
  stock?: number
  quantity?: number
  lowStockThreshold?: number
  mainImage?: string
  hoverImage?: string
  images?: string[]
}

// Default form state
export const defaultFormState: VariantFormState = {
  product: '',
  sku: '',
  size: '',
  color: '',
  price: 0,
  stock: 0,
  lowStockThreshold: 10,
}

// Available sizes
export const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL', 'Free Size']
