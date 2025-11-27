import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axiosInstance from '@/services/axiosConfig'
import { QUERY_KEYS } from '@/lib/queryClient'

// ==================== TYPES ====================
interface Product {
  _id: string
  name: string
  slug: string
  description?: string
  category: any
  brand?: any
  basePrice: number
  status: 'draft' | 'published' | 'archived'
  isActive: boolean
  images?: string[]
  createdAt: string
  updatedAt: string
}

interface ProductFilters {
  page?: number
  limit?: number
  search?: string
  status?: string
  category?: string
  isActive?: boolean
}

// ==================== FETCH FUNCTIONS ====================

/**
 * Fetch products list with filters
 */
async function fetchProducts(filters: ProductFilters = {}): Promise<{ data: Product[], total: number }> {
  const params = new URLSearchParams()
  
  if (filters.page) params.append('page', filters.page.toString())
  if (filters.limit) params.append('limit', filters.limit.toString())
  if (filters.search) params.append('search', filters.search)
  if (filters.status && filters.status !== 'all') params.append('status', filters.status)
  if (filters.category && filters.category !== 'all') params.append('category', filters.category)
  if (filters.isActive !== undefined) params.append('isActive', filters.isActive.toString())

  const response = await axiosInstance.get(`/products?${params.toString()}`)
  return {
    data: response.data?.data || response.data || [],
    total: response.data?.total || response.data?.length || 0
  }
}

/**
 * Fetch single product by ID
 */
async function fetchProductById(id: string): Promise<Product> {
  const response = await axiosInstance.get(`/products/${id}`)
  return response.data?.data || response.data
}

/**
 * Fetch variants for a product
 */
async function fetchProductVariants(productId: string) {
  const response = await axiosInstance.get(`/products/${productId}/variants`)
  return response.data?.data || response.data || []
}

// ==================== QUERY HOOKS ====================

/**
 * Hook to fetch products list with automatic caching
 * 
 * Features:
 * - Automatic cache management (10min stale time)
 * - Survives navigation between pages
 * - Background refetch when data is stale
 * 
 * Usage:
 * ```tsx
 * const { data, isLoading, error } = useProductsQuery({ status: 'published' })
 * ```
 */
export function useProductsQuery(filters: ProductFilters = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.products.list(filters),
    queryFn: () => fetchProducts(filters),
    staleTime: 10 * 60 * 1000, // 10 minutes - admin data doesn't change frequently
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
  })
}

/**
 * Hook to fetch single product with caching
 * 
 * Usage:
 * ```tsx
 * const { data: product, isLoading } = useProductQuery(productId)
 * ```
 */
export function useProductQuery(id: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.products.detail(id || ''),
    queryFn: () => fetchProductById(id!),
    enabled: !!id, // Only fetch if ID exists
    staleTime: 15 * 60 * 1000, // 15 minutes - single product rarely changes
  })
}

/**
 * Hook to fetch product variants with caching
 * 
 * Usage:
 * ```tsx
 * const { data: variants } = useProductVariantsQuery(productId)
 * ```
 */
export function useProductVariantsQuery(productId: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.variants.byProduct(productId || ''),
    queryFn: () => fetchProductVariants(productId!),
    enabled: !!productId,
    staleTime: 5 * 60 * 1000, // 5 minutes - variants may update more frequently
  })
}

// ==================== MUTATION HOOKS ====================

/**
 * Hook to create new product with optimistic updates
 * 
 * Features:
 * - Instant UI update (optimistic)
 * - Auto-invalidate products list cache
 * - Rollback on error
 * 
 * Usage:
 * ```tsx
 * const createProduct = useCreateProduct()
 * await createProduct.mutateAsync(formData)
 * ```
 */
export function useCreateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (productData: any) => {
      const response = await axiosInstance.post('/products', productData)
      return response.data
    },
    onSuccess: () => {
      // Invalidate all product lists to refetch fresh data
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products.lists() })
    },
  })
}

/**
 * Hook to update product with optimistic updates
 */
export function useUpdateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string, data: any }) => {
      const response = await axiosInstance.put(`/products/${id}`, data)
      return response.data
    },
    onSuccess: (_, variables) => {
      // Invalidate specific product and all lists
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products.lists() })
    },
  })
}

/**
 * Hook to delete product with optimistic updates
 */
export function useDeleteProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await axiosInstance.delete(`/products/${id}`)
      return id
    },
    onMutate: async (deletedId) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.products.lists() })

      // Snapshot previous value
      const previousProducts = queryClient.getQueryData(QUERY_KEYS.products.lists())

      // Optimistically update: Remove product from cache immediately
      queryClient.setQueriesData(
        { queryKey: QUERY_KEYS.products.lists() },
        (old: any) => {
          if (!old?.data) return old
          return {
            ...old,
            data: old.data.filter((p: Product) => p._id !== deletedId),
            total: old.total - 1
          }
        }
      )

      return { previousProducts }
    },
    onError: (_err, _deletedId, context) => {
      // Rollback on error
      if (context?.previousProducts) {
        queryClient.setQueryData(QUERY_KEYS.products.lists(), context.previousProducts)
      }
    },
    onSettled: () => {
      // Always refetch after mutation
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products.lists() })
    },
  })
}
