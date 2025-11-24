import { useState, useCallback } from "react"
import { api } from "@/services/api"

export interface Product {
  _id: string
  name: string
  description: string
  basePrice: number
  category: string
  brand?: string
  images: string[]
  tags: string[]
  status: "draft" | "published" | "archived"
  variants: Variant[]
  // SEO fields
  seoTitle?: string
  seoDescription?: string
  urlSlug?: string
  focusKeyword?: string
  relatedProducts?: string[]
  upsellProducts?: string[]
  createdAt: string
  updatedAt: string
}

export interface Variant {
  _id: string
  sku: string
  size: string
  color: string
  price: number
  comparePrice?: number
  stock: number
  lowStockThreshold: number
  images: string[]
  weight?: number
  barcode?: string
  dimensions?: {
    length: number
    width: number
    height: number
  }
}

interface PaginationMeta {
  page: number
  limit: number
  total: number
  pages: number
}

interface UseProductsResult {
  products: Product[]
  loading: boolean
  error: string | null
  pagination: PaginationMeta
  
  // Fetch operations
  fetchProducts: (page?: number, limit?: number, filters?: Record<string, any>) => Promise<void>
  getProductById: (id: string) => Promise<Product | null>
  
  // Create operations
  createProduct: (data: Partial<Product>) => Promise<Product | null>
  
  // Update operations
  updateProduct: (id: string, data: Partial<Product>) => Promise<Product | null>
  updateVariant: (variantId: string, data: Partial<Variant>) => Promise<Variant | null>
  
  // Delete operations
  deleteProduct: (id: string) => Promise<boolean>
  deleteVariant: (variantId: string) => Promise<boolean>
  
  // Variant operations
  createVariant: (productId: string, variantData: Partial<Variant>) => Promise<Variant | null>
  getProductVariants: (productId: string) => Promise<Variant[]>
  bulkUpdateVariants: (skus: string[], operation: "set" | "add" | "subtract", amount: number) => Promise<boolean>
}

/**
 * Hook for managing products and variants
 * Handles all CRUD operations
 */
export function useProducts(): UseProductsResult {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  })

  /**
   * Fetch products with optional pagination and filters
   */
  const fetchProducts = useCallback(
    async (page = 1, limit = 10, filters?: Record<string, any>) => {
      try {
        setLoading(true)
        setError(null)

        const queryParams = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          ...filters,
        })

        const response = await api.get(`/products?${queryParams}`)

        if (response.data.success) {
          setProducts(response.data.data)
          setPagination(response.data.pagination)
        } else {
          setError(response.data.message || "Failed to fetch products")
        }
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || "Error fetching products")
        setProducts([])
      } finally {
        setLoading(false)
      }
    },
    []
  )

  /**
   * Get single product by ID
   */
  const getProductById = useCallback(async (id: string) => {
    try {
      const response = await api.get(`/products/${id}`)
      if (response.data.success) {
        return response.data.data
      } else {
        setError(response.data.message || "Product not found")
        return null
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Error fetching product")
      return null
    }
  }, [])

  /**
   * Create new product
   */
  const createProduct = useCallback(async (data: Partial<Product>) => {
    try {
      setError(null)
      const response = await api.post(`/products/admin`, data, {
        headers: { "Content-Type": "application/json" },
      })

      if (response.data.success) {
        // Refresh product list
        await fetchProducts()
        return response.data.data
      } else {
        setError(response.data.message || "Failed to create product")
        return null
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Error creating product")
      return null
    }
  }, [fetchProducts])

  /**
   * Update product
   */
  const updateProduct = useCallback(
    async (id: string, data: Partial<Product>) => {
      try {
        setError(null)
        const response = await api.put(`/products/admin/${id}`, data)

        if (response.data.success) {
          // Update local state
          setProducts((prev) =>
            prev.map((p) => (p._id === id ? { ...p, ...data } : p))
          )
          return response.data.data
        } else {
          setError(response.data.message || "Failed to update product")
          return null
        }
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || "Error updating product")
        return null
      }
    },
    []
  )

  /**
   * Delete product
   */
  const deleteProduct = useCallback(async (id: string) => {
    try {
      setError(null)
      const response = await api.delete(`/products/admin/${id}`)

      if (response.data.success) {
        // Update local state
        setProducts((prev) => prev.filter((p) => p._id !== id))
        return true
      } else {
        setError(response.data.message || "Failed to delete product")
        return false
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Error deleting product")
      return false
    }
  }, [])

  /**
   * Create variant for product
   */
  const createVariant = useCallback(
    async (productId: string, variantData: Partial<Variant>) => {
      try {
        setError(null)
        const response = await api.post(`/products/admin/${productId}/variants`, variantData)

        if (response.data.success) {
          return response.data.data
        } else {
          setError(response.data.message || "Failed to create variant")
          return null
        }
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || "Error creating variant")
        return null
      }
    },
    []
  )

  /**
   * Update variant
   */
  const updateVariant = useCallback(async (variantId: string, data: Partial<Variant>) => {
    try {
      setError(null)
      const response = await api.put(`/products/admin/variants/${variantId}`, data)

      if (response.data.success) {
        return response.data.data
      } else {
        setError(response.data.message || "Failed to update variant")
        return null
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Error updating variant")
      return null
    }
  }, [])

  /**
   * Delete variant
   */
  const deleteVariant = useCallback(async (variantId: string) => {
    try {
      setError(null)
      const response = await api.delete(`/products/admin/variants/${variantId}`)

      if (response.data.success) {
        return true
      } else {
        setError(response.data.message || "Failed to delete variant")
        return false
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Error deleting variant")
      return false
    }
  }, [])

  /**
   * Get all variants for product
   */
  const getProductVariants = useCallback(async (productId: string) => {
    try {
      const response = await api.get(`/products/${productId}/variants`)

      if (response.data.success) {
        return response.data.data
      } else {
        setError(response.data.message || "Failed to fetch variants")
        return []
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Error fetching variants")
      return []
    }
  }, [])

  /**
   * Bulk update variants (restock, set prices, etc)
   */
  const bulkUpdateVariants = useCallback(
    async (skus: string[], operation: "set" | "add" | "subtract", amount: number) => {
      try {
        setError(null)
        const response = await api.put(`/products/admin/variants/bulk-update`, {
          skus,
          operation,
          amount,
        })

        if (response.data.success) {
          return true
        } else {
          setError(response.data.message || "Failed to bulk update variants")
          return false
        }
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || "Error bulk updating variants")
        return false
      }
    },
    []
  )

  return {
    products,
    loading,
    error,
    pagination,
    fetchProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    createVariant,
    updateVariant,
    deleteVariant,
    getProductVariants,
    bulkUpdateVariants,
  }
}
