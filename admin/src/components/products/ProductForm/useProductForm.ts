/**
 * useProductForm Hook
 * Manages product form state and data fetching
 */

import { useState, useEffect, useMemo } from "react"
import { categoryService, type Category } from "@/services/categoryService"
import { colorService, type Color } from "@/services/colorService"
import { brandService, type Brand } from "@/services/brandService"
import { useBrandsQuery, useBrandsRealtimeSync } from "@/hooks/useBrandsQuery"
import { extractId } from "./utils"
import type { ProductFormData, ProductFormProps, VariantData } from "./types"
import { defaultFormData } from "./types"

export function useProductForm(initialData: ProductFormProps["initialData"]) {
  // Form data state
  const [formData, setFormData] = useState<ProductFormData>(() => {
    if (initialData) {
      const categoryId = extractId(initialData.category)
      const brandId = extractId(initialData.brand)

      return {
        ...defaultFormData,
        ...(initialData as Partial<ProductFormData>),
        category: categoryId,
        brand: brandId,
      }
    }
    return defaultFormData
  })

  // Reference data states
  const [categories, setCategories] = useState<Category[]>([])
  const [colors, setColors] = useState<Color[]>([])
  const [loadingColors, setLoadingColors] = useState(false)
  const [fallbackBrand, setFallbackBrand] = useState<Brand | null>(null)

  // Search states
  const [categorySearch, setCategorySearch] = useState("")
  const [brandSearch, setBrandSearch] = useState("")
  const [colorSearchTerm, setColorSearchTerm] = useState("")

  // Facebook posting state
  const [postToFacebook, setPostToFacebook] = useState(false)

  // Brands query
  const brandQueryParams = useMemo(() => ({ status: 'active', sort: 'name-asc', limit: 200 }), [])
  const { data: brandsResponse, isLoading: brandsLoading } = useBrandsQuery(brandQueryParams)
  useBrandsRealtimeSync()

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoryService.getAllCategories({ limit: 100, isActive: true })
        setCategories(Array.isArray(response.data) ? response.data : response.data?.data || [])
      } catch (error) {
        console.error("Error loading categories:", error)
      }
    }
    fetchCategories()
  }, [])

  // Fetch colors
  useEffect(() => {
    const fetchColors = async () => {
      setLoadingColors(true)
      try {
        const response = await colorService.getAllColors()
        setColors(Array.isArray(response.data) ? response.data : response.data?.data || response || [])
      } catch (error) {
        console.error("Error loading colors:", error)
      } finally {
        setLoadingColors(false)
      }
    }
    fetchColors()
  }, [])

  // Computed values
  const brandOptions = useMemo(() => brandsResponse?.data || [], [brandsResponse?.data])
  
  const availableBrands = useMemo(() => {
    const base = [...brandOptions]
    if (fallbackBrand && !base.some((brand) => brand._id === fallbackBrand._id)) {
      base.push(fallbackBrand)
    }
    return base
  }, [brandOptions, fallbackBrand])

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(categorySearch.toLowerCase())
  )

  const filteredBrands = useMemo(() => {
    if (!brandSearch.trim()) return availableBrands
    const term = brandSearch.trim().toLowerCase()
    return availableBrands.filter((brand) => {
      return (
        brand.name.toLowerCase().includes(term) ||
        brand.originCountry?.toLowerCase().includes(term) ||
        brand.tagline?.toLowerCase().includes(term)
      )
    })
  }, [availableBrands, brandSearch])

  const filteredColorOptions = useMemo(() => {
    if (!colorSearchTerm.trim()) return colors
    const term = colorSearchTerm.trim().toLowerCase()
    return colors.filter((color) => {
      return (
        color.name.toLowerCase().includes(term) ||
        (color.hex ? color.hex.toLowerCase().includes(term) : false)
      )
    })
  }, [colors, colorSearchTerm])

  const selectedBrandDetails = useMemo(() => {
    if (!formData.brand) return null
    return availableBrands.find((brand) => brand._id === formData.brand) || null
  }, [availableBrands, formData.brand])

  // Auto-select first brand if none selected
  useEffect(() => {
    if (!availableBrands.length) return
    setFormData((prev) => {
      if (prev.brand) return prev
      return { ...prev, brand: availableBrands[0]._id }
    })
  }, [availableBrands])

  // Fetch fallback brand if not in available brands
  useEffect(() => {
    let ignore = false
    if (!formData.brand) {
      setFallbackBrand(null)
      return
    }
    if (!/^[a-fA-F0-9]{24}$/.test(formData.brand)) {
      setFallbackBrand(null)
      return
    }
    if (availableBrands.some((brand) => brand._id === formData.brand)) {
      setFallbackBrand(null)
      return
    }

    const fetchBrand = async () => {
      try {
        const response = await brandService.getBrandById(formData.brand)
        const brandRecord = response?.data ?? response
        if (!ignore && brandRecord?._id) {
          setFallbackBrand(brandRecord as Brand)
        }
      } catch {
        if (!ignore) {
          setFallbackBrand(null)
        }
      }
    }

    fetchBrand()
    return () => { ignore = true }
  }, [formData.brand, availableBrands])

  // Update form field
  const updateFormField = <K extends keyof ProductFormData>(
    field: K,
    value: ProductFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // Update variants
  const updateVariants = (variants: VariantData[]) => {
    setFormData((prev) => ({ ...prev, variants }))
  }

  return {
    // State
    formData,
    setFormData,
    categories,
    colors,
    loadingColors,
    brandsLoading,
    postToFacebook,
    setPostToFacebook,

    // Search states
    categorySearch,
    setCategorySearch,
    brandSearch,
    setBrandSearch,
    colorSearchTerm,
    setColorSearchTerm,

    // Computed
    filteredCategories,
    filteredBrands,
    filteredColorOptions,
    availableBrands,
    selectedBrandDetails,

    // Actions
    updateFormField,
    updateVariants,
  }
}

export default useProductForm
