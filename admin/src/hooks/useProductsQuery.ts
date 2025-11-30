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
 * - Automatic cache management (30sec stale time for admin responsiveness)
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
    staleTime: 30 * 1000, // 30 seconds - admin panel needs immediate feedback
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
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
 * Hook to create new product - Realtime refetch
 * 
 * Features:
 * - Instant UI update via refetchType: 'active'
 * - Invalidates products + variants + categories
 * - Simple and reliable - mirrors category management
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
      const response = await axiosInstance.post('/products/admin', productData)
      return response.data
    },
    onSuccess: () => {
      // Invalidate all related queries to refetch fresh data
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.products.lists(),
        refetchType: 'active'
      })
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.variants.lists(),
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
 * Hook to update product - Realtime refetch
 * 
 * Features:
 * - Instant UI update via refetchType: 'active'
 * - Invalidates both detail and list queries
 * - Simple and reliable - no cache manipulation
 */
export function useUpdateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string, data: any }) => {
      const response = await axiosInstance.put(`/products/admin/${id}`, data)
      return response.data
    },
    onSuccess: (_, variables) => {
      // Invalidate specific product and all lists
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.products.detail(variables.id),
        refetchType: 'active'
      })
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.products.lists(),
        refetchType: 'active'
      })
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.variants.lists(),
        refetchType: 'active'
      })
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.categories.all,
        refetchType: 'active'
      })

      // Optimistically patch cached product data so UI reflects changes instantly
      const patchProduct = (product: Product) => {
        if (product._id !== variables.id) return product
        return {
          ...product,
          ...variables.data,
          category: variables.data.category ?? product.category,
          updatedAt: new Date().toISOString(),
        }
      }

      queryClient.setQueriesData({ queryKey: QUERY_KEYS.products.lists() }, (oldData: any) => {
        if (!oldData?.data) return oldData
        return {
          ...oldData,
          data: oldData.data.map((product: Product) => patchProduct(product)),
        }
      })

      queryClient.setQueryData(QUERY_KEYS.products.detail(variables.id), (oldProduct: Product | undefined) => {
        if (!oldProduct) return oldProduct
        return patchProduct(oldProduct)
      })
    },
  })
}

/**
 * Hook to delete product - Simple realtime refetch
 */
export function useDeleteProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await axiosInstance.delete(`/products/admin/${id}`)
      return id
    },
    onSuccess: () => {
      // Realtime refetch - invalidate all product-related queries
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.products.lists(),
        refetchType: 'active'
      })
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.variants.lists(),
        refetchType: 'active'
      })
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.categories.all,
        refetchType: 'active'
      })
    },
  })
}
