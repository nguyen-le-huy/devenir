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
 * - 10min cache - Variants don't change frequently
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
    staleTime: 10 * 60 * 1000, // 10 minutes - perfect for SKU table
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    // Keep previous data while fetching (prevents table flicker)
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
 * Hook to create new variant with optimistic updates
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
    mutationFn: async (variantData: any) => {
      const response = await axiosInstance.post('/variants', variantData)
      return response.data
    },
    onSuccess: (newVariant) => {
      // Invalidate all variant lists
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.variants.lists() })
      
      // Invalidate variants for this product
      if (newVariant?.product) {
        queryClient.invalidateQueries({ 
          queryKey: QUERY_KEYS.variants.byProduct(newVariant.product) 
        })
      }
    },
  })
}

/**
 * Hook to update variant with instant UI feedback
 */
export function useUpdateVariant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string, data: any }) => {
      const response = await axiosInstance.put(`/variants/${id}`, data)
      return response.data
    },
    onMutate: async ({ id, data }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.variants.detail(id) })

      // Snapshot previous value
      const previousVariant = queryClient.getQueryData(QUERY_KEYS.variants.detail(id))

      // Optimistically update the cache
      queryClient.setQueryData(QUERY_KEYS.variants.detail(id), (old: any) => ({
        ...old,
        ...data,
      }))

      return { previousVariant }
    },
    onError: (_err, { id }, context) => {
      // Rollback on error
      if (context?.previousVariant) {
        queryClient.setQueryData(QUERY_KEYS.variants.detail(id), context.previousVariant)
      }
    },
    onSuccess: (updatedVariant, { id }) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.variants.detail(id) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.variants.lists() })
      
      if (updatedVariant?.product) {
        queryClient.invalidateQueries({ 
          queryKey: QUERY_KEYS.variants.byProduct(updatedVariant.product) 
        })
      }
    },
  })
}

/**
 * Hook to delete variant with optimistic updates
 */
export function useDeleteVariant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await axiosInstance.delete(`/variants/${id}`)
      return id
    },
    onMutate: async (deletedId) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.variants.lists() })

      // Snapshot previous value
      const previousVariants = queryClient.getQueryData(QUERY_KEYS.variants.lists())

      // Optimistically remove from cache
      queryClient.setQueriesData(
        { queryKey: QUERY_KEYS.variants.lists() },
        (old: any) => {
          if (!old?.data) return old
          return {
            ...old,
            data: old.data.filter((v: Variant) => v._id !== deletedId),
            total: old.total - 1
          }
        }
      )

      return { previousVariants }
    },
    onError: (_err, _deletedId, context) => {
      // Rollback on error
      if (context?.previousVariants) {
        queryClient.setQueryData(QUERY_KEYS.variants.lists(), context.previousVariants)
      }
    },
    onSettled: () => {
      // Always refetch
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.variants.lists() })
    },
  })
}

/**
 * Hook to bulk update variant stock
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
    mutationFn: async (updates: { id: string, stock: number }[]) => {
      const promises = updates.map(({ id, stock }) =>
        axiosInstance.patch(`/variants/${id}/stock`, { stock })
      )
      return Promise.all(promises)
    },
    onSuccess: () => {
      // Invalidate all variant queries
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.variants.all })
    },
  })
}
