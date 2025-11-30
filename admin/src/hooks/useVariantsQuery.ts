import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axiosInstance from '@/services/axiosConfig'
import { QUERY_KEYS } from '@/lib/queryClient'

// ==================== TYPES ====================
interface Variant {
  _id: string
  sku: string
  product: string
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
  updatedAt: string
}

interface VariantFilters {
  page?: number
  limit?: number
  search?: string
  product?: string
  size?: string
  color?: string
  stockStatus?: 'all' | 'in-stock' | 'low-stock' | 'out-of-stock'
}

// ==================== FETCH FUNCTIONS ====================

/**
 * Fetch all variants with filters and pagination
 */
async function fetchVariants(filters: VariantFilters = {}): Promise<{ data: Variant[], total: number }> {
  const params = new URLSearchParams()
  
  if (filters.page) params.append('page', filters.page.toString())
  if (filters.limit) params.append('limit', filters.limit.toString())
  if (filters.search) params.append('search', filters.search)
  if (filters.product && filters.product !== 'all') params.append('product', filters.product)
  if (filters.size && filters.size !== 'all') params.append('size', filters.size)
  if (filters.color && filters.color !== 'all') params.append('color', filters.color)

  const response = await axiosInstance.get(`/products/admin/variants?${params.toString()}`)
  
  let variants = response.data?.data || response.data || []
  
  // Apply stock status filter on client side if needed
  if (filters.stockStatus && filters.stockStatus !== 'all') {
    variants = variants.filter((v: Variant) => {
      const stock = v.stock || 0
      if (filters.stockStatus === 'out-of-stock') return stock === 0
      if (filters.stockStatus === 'low-stock') return stock > 0 && stock <= v.lowStockThreshold
      if (filters.stockStatus === 'in-stock') return stock > v.lowStockThreshold
      return true
    })
  }

  return {
    data: variants,
    total: variants.length
  }
}

/**
 * Fetch single variant by ID
 */
async function fetchVariantById(id: string): Promise<Variant> {
  const response = await axiosInstance.get(`/variants/${id}`)
  return response.data?.data || response.data
}

/**
 * Fetch variants for specific product
 */
async function fetchVariantsByProduct(productId: string): Promise<Variant[]> {
  const response = await axiosInstance.get(`/products/${productId}/variants`)
  return response.data?.data || response.data || []
}

// ==================== QUERY HOOKS ====================

/**
 * Hook to fetch variants list with automatic caching
 * 
 * Features:
 * - 30sec cache - Realtime updates for admin panel
 * - Survives navigation between Product List ↔ SKU Management Table
 * - Background refetch when stale
 * - Pagination support
 * 
 * Usage:
 * ```tsx
 * const { data, isLoading, error } = useVariantsQuery({ 
 *   page: 1, 
 *   limit: 10,
 *   stockStatus: 'low-stock' 
 * })
 * ```
 */
export function useVariantsQuery(filters: VariantFilters = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.variants.list(filters),
    queryFn: () => fetchVariants(filters),
    staleTime: 30 * 1000, // 30 seconds - realtime for admin
    gcTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: (previousData: any) => previousData,
  })
}

/**
 * Hook to fetch single variant details
 * 
 * Usage:
 * ```tsx
 * const { data: variant, isLoading } = useVariantQuery(variantId)
 * ```
 */
export function useVariantQuery(id: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.variants.detail(id || ''),
    queryFn: () => fetchVariantById(id!),
    enabled: !!id,
    staleTime: 15 * 60 * 1000, // 15 minutes
  })
}

/**
 * Hook to fetch variants by product ID
 * 
 * Usage:
 * ```tsx
 * const { data: variants } = useVariantsByProductQuery(productId)
 * ```
 */
export function useVariantsByProductQuery(productId: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.variants.byProduct(productId || ''),
    queryFn: () => fetchVariantsByProduct(productId!),
    enabled: !!productId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// ==================== MUTATION HOOKS ====================

/**
 * Hook to create new variant - Realtime refetch
 * 
 * Features:
 * - Instant UI update via refetchType: 'active'
 * - Invalidates variants + products + categories
 * - Simple and reliable - no cache manipulation
 * 
 * Usage:
 * ```tsx
 * const createVariant = useCreateVariant()
 * await createVariant.mutateAsync({ product: '...', sku: 'ABC-123', ... })
 * ```
 */
export function useCreateVariant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ productId, data }: { productId: string, data: any }) => {
      const response = await axiosInstance.post(`/products/admin/${productId}/variants`, data)
      return response.data
    },
    onSuccess: (newVariant) => {
      // Realtime refetch - invalidate all variant & product queries
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.variants.lists(),
        refetchType: 'active'
      })
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.products.lists(),
        refetchType: 'active'
      })
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.categories.all,
        refetchType: 'active'
      })
      
      if (newVariant?.product) {
        queryClient.invalidateQueries({ 
          queryKey: QUERY_KEYS.variants.byProduct(newVariant.product),
          refetchType: 'active'
        })
      }
    },
  })
}

/**
 * Hook to update variant - Realtime refetch
 * 
 * Features:
 * - Instant UI update via refetchType: 'active'
 * - Invalidates variants + products + categories
 * - Simple and reliable - no cache manipulation
 */
export function useUpdateVariant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string, data: any }) => {
      const response = await axiosInstance.put(`/products/admin/variants/${id}`, data)
      return response.data
    },
    onSuccess: (updatedVariant, { id }) => {
      // Realtime refetch - invalidate all variant & product queries
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.variants.detail(id),
        refetchType: 'active'
      })
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.variants.lists(),
        refetchType: 'active'
      })
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.products.lists(),
        refetchType: 'active'
      })
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.categories.all,
        refetchType: 'active'
      })
      
      if (updatedVariant?.product) {
        queryClient.invalidateQueries({ 
          queryKey: QUERY_KEYS.variants.byProduct(updatedVariant.product),
          refetchType: 'active'
        })
      }
    },
  })
}

/**
 * Hook to delete variant - Realtime refetch
 * 
 * Features:
 * - Instant UI update via refetchType: 'active'
 * - Invalidates variants + products + categories
 * - Simple and reliable - no cache manipulation
 */
export function useDeleteVariant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await axiosInstance.delete(`/products/admin/variants/${id}`)
      return id
    },
    onSuccess: () => {
      // Realtime refetch - invalidate all variant & product queries
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.variants.lists(),
        refetchType: 'active'
      })
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.products.lists(),
        refetchType: 'active'
      })
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.categories.all,
        refetchType: 'active'
      })
    },
  })
}

/**
 * Hook to bulk update variant stock - Realtime refetch
 * 
 * Features:
 * - Instant UI update via refetchType: 'active'
 * - Invalidates all variant + product + category queries
 * - Simple and reliable - no cache manipulation
 * 
 * Usage:
 * ```tsx
 * const updateStock = useBulkUpdateVariantStock()
 * await updateStock.mutateAsync([
 *   { id: '123', stock: 50 },
 *   { id: '456', stock: 30 }
 * ])
 * ```
 */
export function useBulkUpdateVariantStock() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: { skus: string[], operation: 'set' | 'add' | 'subtract', amount: number }) => {
      const response = await axiosInstance.put('/products/admin/variants/bulk-update', payload)
      return response.data
    },
    onSuccess: () => {
      // Realtime refetch - invalidate all variant & product queries
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.variants.all,
        refetchType: 'active'
      })
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.products.lists(),
        refetchType: 'active'
      })
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.categories.all,
        refetchType: 'active'
      })
    },
  })
}
