/**
 * Variant Drawer Hooks
 * Data fetching and state management for variant drawer
 */
import { useState, useCallback } from 'react'
import axiosInstance from '@/services/axiosConfig'
import { useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/lib/queryClient'
import { toast } from 'sonner'
import type {
  Product,
  Color,
  VariantImage,
  VariantFormState,
  VariantFormData,
} from './types'
import { defaultFormState } from './types'

// Cache helpers
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

interface CacheItem<T> {
  data: T
  timestamp: number
}

function getFromCache<T>(key: string): T | null {
  const cached = sessionStorage.getItem(key)
  if (!cached) return null

  try {
    const { data, timestamp } = JSON.parse(cached) as CacheItem<T>
    if (Date.now() - timestamp < CACHE_DURATION) {
      return data
    }
  } catch {
    return null
  }
  return null
}

function setToCache<T>(key: string, data: T): void {
  sessionStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }))
}

/**
 * Hook to manage product and color data fetching
 */
export function useVariantData() {
  const [products, setProducts] = useState<Product[]>([])
  const [colors, setColors] = useState<Color[]>([])

  const fetchProducts = useCallback(async () => {
    const cached = getFromCache<Product[]>('products_cache')
    if (cached) {
      setProducts(cached)
      return
    }

    try {
      const response = await axiosInstance.get('/products?limit=500')
      const data = response.data.data || []
      setProducts(data)
      setToCache('products_cache', data)
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }, [])

  const fetchColors = useCallback(async () => {
    const cached = getFromCache<Color[]>('colors_cache')
    if (cached) {
      setColors(cached)
      return
    }

    try {
      const response = await axiosInstance.get('/colors')
      const data = response.data.data || []
      setColors(data)
      setToCache('colors_cache', data)
    } catch (error) {
      console.error('Error fetching colors:', error)
    }
  }, [])

  return {
    products,
    colors,
    fetchProducts,
    fetchColors,
  }
}

/**
 * Hook to manage variant form state
 */
export function useVariantForm(
  isEdit: boolean,
  variantId?: string,
  variantData?: VariantFormData
) {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState<VariantFormState>(defaultFormState)
  const [variantImages, setVariantImages] = useState<VariantImage[]>([])
  const [selectedMainImage, setSelectedMainImage] = useState<string>('')
  const [selectedHoverImage, setSelectedHoverImage] = useState<string>('')
  const [loading, setLoading] = useState(false)

  // Reset form to defaults
  const resetForm = useCallback(() => {
    setFormData(defaultFormState)
    setVariantImages([])
    setSelectedMainImage('')
    setSelectedHoverImage('')
  }, [])

  // Load variant data into form
  const loadVariantData = useCallback((variant: VariantFormData) => {
    setFormData({
      product: variant.product_id || variant.product || '',
      sku: variant.sku || '',
      size: variant.size || '',
      color: variant.color || '',
      price: variant.price || 0,
      stock: variant.stock ?? variant.quantity ?? 0,
      lowStockThreshold: variant.lowStockThreshold || 10,
    })

    // Load variant images
    const images: VariantImage[] = []
    if (variant.mainImage) {
      images.push({ url: variant.mainImage, id: 'main' })
      setSelectedMainImage(variant.mainImage)
    }
    if (variant.hoverImage) {
      images.push({ url: variant.hoverImage, id: 'hover' })
      setSelectedHoverImage(variant.hoverImage)
    }
    if (variant.images && Array.isArray(variant.images)) {
      variant.images.forEach((img, idx) => {
        if (img !== variant.mainImage && img !== variant.hoverImage) {
          images.push({ url: img, id: `img-${idx}` })
        }
      })
    }
    setVariantImages(images)
  }, [])

  // Fetch variant data if not provided
  const fetchVariant = useCallback(async () => {
    if (!variantId) return

    try {
      const response = await axiosInstance.get('/products/admin/variants?limit=500')
      const allVariants = response.data.data || []
      const variant = allVariants.find((v: VariantFormData) => v._id === variantId)

      if (variant) {
        loadVariantData(variant)
      }
    } catch (error) {
      console.error('Error fetching variant:', error)
    }
  }, [variantId, loadVariantData])

  // Submit form
  const handleSubmit = async () => {
    // Validation
    if (!formData.product || !formData.sku || !formData.size || !formData.color) {
      toast.error('Please fill all required fields')
      return false
    }

    if (!isEdit && (variantImages.length === 0 || !selectedMainImage || !selectedHoverImage)) {
      toast.error('Please upload and select main and hover images')
      return false
    }

    if (isEdit && (!selectedMainImage || !selectedHoverImage)) {
      toast.error('Please select main and hover images')
      return false
    }

    setLoading(true)

    try {
      const allImages = variantImages.map((img) => img.url)

      const payload = {
        sku: formData.sku,
        size: formData.size,
        color: formData.color,
        price: formData.price,
        stock: formData.stock,
        mainImage: selectedMainImage,
        hoverImage: selectedHoverImage,
        images: allImages,
        lowStockThreshold: formData.lowStockThreshold,
        syncColorGroup: true,
      }

      if (isEdit) {
        const response = await axiosInstance.put(`/products/admin/variants/${formData.sku}`, payload)
        const syncedCount = response.data?.syncedCount || 0
        if (syncedCount > 0) {
          toast.success(`Variant updated! ${syncedCount} same-color variant(s) also synced.`, {
            duration: 5000,
          })
        } else {
          toast.success('Variant updated successfully')
        }
      } else {
        await axiosInstance.post(`/products/admin/${formData.product}/variants`, payload)
        toast.success('Variant created successfully')
      }

      // Invalidate queries for realtime update
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.variants.lists(),
        refetchType: 'active',
      })
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.products.lists(),
        refetchType: 'active',
      })
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.categories.all,
        refetchType: 'active',
      })

      const productKey = formData.product || variantData?.product || variantData?.product_id
      if (productKey) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.variants.byProduct(productKey),
          refetchType: 'active',
        })
      }

      return true
    } catch (error: unknown) {
      console.error('Error saving variant:', error)
      const axiosError = error as { response?: { data?: { message?: string } }; message?: string }
      const errorMsg = axiosError?.response?.data?.message || axiosError?.message || 'Failed to save variant'
      toast.error(errorMsg)
      return false
    } finally {
      setLoading(false)
    }
  }

  return {
    formData,
    setFormData,
    variantImages,
    setVariantImages,
    selectedMainImage,
    setSelectedMainImage,
    selectedHoverImage,
    setSelectedHoverImage,
    loading,
    resetForm,
    loadVariantData,
    fetchVariant,
    handleSubmit,
  }
}
