/**
 * Product Form Types
 * Shared types for all product form components
 */

export type PopulatedReference = string | { _id: string }

export interface ProductFormData {
  // Basic Info
  name: string
  description: string
  category: string
  brand: string
  tags: string[]
  status: "draft" | "published" | "archived"
  postToFacebook?: boolean

  // Variants - Each variant has full info (color, size, price, quantity, images)
  variants: VariantData[]

  // SEO
  seoTitle: string
  seoDescription: string
  urlSlug: string
}

export interface VariantData {
  id?: string
  sku: string
  color: string
  colorId?: string // Color ID from database to get hex color
  size: string
  price: number
  quantity: number
  mainImage?: string
  hoverImage?: string
  images: string[]
}

export interface ProductFormProps {
  onSave?: (data: ProductFormData) => void
  onDraft?: (data: ProductFormData) => void
  initialData?: (Partial<ProductFormData> & {
    category?: PopulatedReference | null
    brand?: PopulatedReference | null
  }) | null
}

export interface VariantImage {
  url: string
  id: string
}

export const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "2XL", "3XL", "Free Size"] as const

export type SizeType = typeof SIZES[number]

export const defaultFormData: ProductFormData = {
  name: "",
  description: "",
  category: "",
  brand: "",
  tags: [],
  status: "draft",
  variants: [],
  seoTitle: "",
  seoDescription: "",
  urlSlug: "",
}

export const defaultVariant: VariantData = {
  sku: "",
  color: "",
  colorId: "",
  size: "",
  price: 0,
  quantity: 0,
  mainImage: "",
  hoverImage: "",
  images: [],
}
