import { useState, useEffect, useMemo } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { IconPlus, IconTrash, IconEdit, IconUpload, IconEye, IconBrandFacebook } from "@tabler/icons-react"
import { Switch } from "@/components/ui/switch"
import { categoryService, type Category } from "@/services/categoryService"
import { colorService, type Color } from "@/services/colorService"
import { uploadImage } from "@/services/uploadService"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from 'sonner'
import { brandService, type Brand } from "@/services/brandService"
import { useBrandsQuery, useBrandsRealtimeSync } from "@/hooks/useBrandsQuery"
import { Badge } from "@/components/ui/badge"

type PopulatedReference = string | { _id: string }

interface ProductFormProps {
  onSave?: (data: ProductFormData) => void
  onDraft?: (data: ProductFormData) => void
  initialData?: (Partial<ProductFormData> & {
    category?: PopulatedReference | null
    brand?: PopulatedReference | null
  }) | null
}

export interface ProductFormData {
  // Basic Info
  name: string
  description: string
  category: string
  brand: string
  tags: string[]
  status: "draft" | "published" | "archived"
  postToFacebook?: boolean

  // Variants - Mỗi variant có đầy đủ info (color, size, price, quantity, ảnh)
  variants: Array<{
    id?: string
    sku: string
    color: string
    colorId?: string // Color ID từ database để lấy hex color
    size: string
    price: number
    quantity: number
    mainImage?: string
    hoverImage?: string
    images: string[]
  }>

  // SEO
  seoTitle: string
  seoDescription: string
  urlSlug: string
}

const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "2XL", "3XL", "Free Size"]

export function ProductFormSimplified({ onSave, onDraft, initialData }: ProductFormProps) {
  const defaultFormData: ProductFormData = {
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

  const [formData, setFormData] = useState<ProductFormData>(() => {
    if (initialData) {
      // Handle category field - could be ObjectId string or populated object
      const categoryId = initialData.category
        ? (typeof initialData.category === 'object' && initialData.category !== null && '_id' in initialData.category
          ? (initialData.category as { _id: string })._id
          : (initialData.category as string))
        : ""

      // Handle brand field - could be ObjectId string or populated object
      const brandId = initialData.brand
        ? (typeof initialData.brand === 'object' && initialData.brand !== null && '_id' in initialData.brand
          ? (initialData.brand as { _id: string })._id
          : (initialData.brand as string))
        : ""

      return {
        ...defaultFormData,
        ...(initialData as Partial<ProductFormData>),
        category: categoryId as string,
        brand: brandId as string,
      }
    }
    return defaultFormData
  })

  const [categories, setCategories] = useState<Category[]>([])
  const [colors, setColors] = useState<Color[]>([])
  const [loadingColors, setLoadingColors] = useState(false)
  const [colorSearchTerm, setColorSearchTerm] = useState("")
  const [uploadingImage, setUploadingImage] = useState(false)
  const [variantImages, setVariantImages] = useState<Array<{ url: string; id: string }>>([])
  const [selectedMainImage, setSelectedMainImage] = useState<string>("")
  const [selectedHoverImage, setSelectedHoverImage] = useState<string>("")
  const [editingVariantIndex, setEditingVariantIndex] = useState<number | null>(null)
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])
  const [newVariant, setNewVariant] = useState<ProductFormData["variants"][0]>({
    sku: "",
    color: "",
    colorId: "",
    size: "",
    price: 0,
    quantity: 0,
    mainImage: "",
    hoverImage: "",
    images: [],
  })
  // Variant list filters
  const [filterSize, setFilterSize] = useState<string>("all")
  const [filterColor, setFilterColor] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedVariants, setSelectedVariants] = useState<Set<number>>(new Set())
  const [viewDetailIndex, setViewDetailIndex] = useState<number | null>(null)
  const [variantPage, setVariantPage] = useState(1)
  const [variantItemsPerPage] = useState(10)
  const [categorySearch, setCategorySearch] = useState("")
  const [brandSearch, setBrandSearch] = useState("")
  const brandQueryParams = useMemo(() => ({ status: 'active', sort: 'name-asc', limit: 200 }), [])
  const { data: brandsResponse, isLoading: brandsLoading } = useBrandsQuery(brandQueryParams)
  const [fallbackBrand, setFallbackBrand] = useState<Brand | null>(null)
  useBrandsRealtimeSync()

  // Facebook posting state
  const [postToFacebook, setPostToFacebook] = useState(false)

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoryService.getAllCategories({ limit: 100, isActive: true })
        // Handle both direct array and data wrapper
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
        // Handle both direct array and data wrapper
        setColors(Array.isArray(response.data) ? response.data : response.data?.data || response || [])
      } catch (error) {
        console.error("Error loading colors:", error)
      } finally {
        setLoadingColors(false)
      }
    }
    fetchColors()
  }, [])

  // Handle image upload (multiple files)
  const handleMultipleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploadingImage(true)
    try {
      const fileArray = Array.from(files)
      const uploadPromises = fileArray.map((file) =>
        uploadImage(file)
      )

      const responses = await Promise.all(uploadPromises)
      const uploadedUrls = responses
        .filter((res) => res.success && res.data?.url)
        .map((res) => ({
          url: res.data.url,
          id: res.data.id,
        }))

      if (uploadedUrls.length > 0) {
        setVariantImages((prev) => [...prev, ...uploadedUrls])
      } else {
        toast.error("Upload failed")
      }
    } catch (error: any) {
      toast.error(error?.message || 'Upload error')
    } finally {
      setUploadingImage(false)
    }
  }

  // Remove image from list
  const handleRemoveImage = (index: number) => {
    setVariantImages((prev) => prev.filter((_, i) => i !== index))
    // Reset main/hover if removed
    if (variantImages[index].url === selectedMainImage) setSelectedMainImage("")
    if (variantImages[index].url === selectedHoverImage) setSelectedHoverImage("")
  }

  // Auto-generate SKU
  // NOTE: Size must match enum exactly, so we don't clean it
  const generateSKU = (color: string, size: string) => {
    const productName = formData.name.substring(0, 3).toUpperCase()
    const cleanColor = color.replace(/\s+/g, "-").toUpperCase()
    // Size kept as-is for URL-friendly SKU (spaces replaced with dashes for SKU only, not for DB)
    const sizeForSKU = size.replace(/\s+/g, "-").toUpperCase()
    return `${productName}-${sizeForSKU}-${cleanColor}`
  }

  // Get stock status
  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { label: "Out", color: "bg-red-500" }
    if (quantity < 10) return { label: "Low", color: "bg-yellow-500" }
    return { label: "In", color: "bg-green-500" }
  }

  // Get unique sizes and colors from variants
  const variantSizes = Array.from(new Set(formData.variants.map((v) => v.size)))
  const variantColors = Array.from(new Set(formData.variants.map((v) => v.color).filter(Boolean)))
  const filteredColorOptions = useMemo(() => {
    if (!colorSearchTerm.trim()) {
      return colors
    }
    const term = colorSearchTerm.trim().toLowerCase()
    return colors.filter((color) => {
      return (
        color.name.toLowerCase().includes(term) ||
        (color.hex ? color.hex.toLowerCase().includes(term) : false)
      )
    })
  }, [colors, colorSearchTerm])
  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(categorySearch.toLowerCase())
  )
  const brandOptions = brandsResponse?.data || []
  const availableBrands = useMemo(() => {
    const base = [...brandOptions]
    if (fallbackBrand && !base.some((brand) => brand._id === fallbackBrand._id)) {
      base.push(fallbackBrand)
    }
    return base
  }, [brandOptions, fallbackBrand])
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
  const selectedBrandDetails = useMemo(() => {
    if (!formData.brand) return null
    return availableBrands.find((brand) => brand._id === formData.brand) || null
  }, [availableBrands, formData.brand])

  useEffect(() => {
    if (!availableBrands.length) return
    setFormData((prev) => {
      if (prev.brand) return prev
      return { ...prev, brand: availableBrands[0]._id }
    })
  }, [availableBrands])

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
      } catch (error) {
        if (!ignore) {
          setFallbackBrand(null)
        }
      }
    }

    fetchBrand()

    return () => {
      ignore = true
    }
  }, [formData.brand, availableBrands])

  // Filter variants
  const filteredVariants = formData.variants.filter((v) => {
    const matchesSize = filterSize === "all" || v.size === filterSize
    const matchesColor = filterColor === "all" || v.color === filterColor
    const matchesSearch =
      v.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.size.includes(searchTerm) ||
      v.color.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesSize && matchesColor && matchesSearch
  })

  // Get filtered variant indices for selection
  const filteredIndices = formData.variants
    .map((_, idx) => idx)
    .filter((idx) => {
      const v = formData.variants[idx]
      const matchesSize = filterSize === "all" || v.size === filterSize
      const matchesColor = filterColor === "all" || v.color === filterColor
      const matchesSearch =
        v.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.size.includes(searchTerm) ||
        v.color.toLowerCase().includes(searchTerm.toLowerCase())
      return matchesSize && matchesColor && matchesSearch
    })

  // Toggle variant selection
  const toggleVariantSelection = (idx: number) => {
    const newSelected = new Set(selectedVariants)
    if (newSelected.has(idx)) {
      newSelected.delete(idx)
    } else {
      newSelected.add(idx)
    }
    setSelectedVariants(newSelected)
  }

  // Toggle all variants
  const toggleAllVariants = () => {
    if (selectedVariants.size === filteredIndices.length) {
      setSelectedVariants(new Set())
    } else {
      setSelectedVariants(new Set(filteredIndices))
    }
  }

  // Handle add/edit variant
  const handleAddOrUpdateVariant = () => {
    if (!newVariant.color || selectedSizes.length === 0 || !newVariant.price || newVariant.quantity === undefined) {
      toast.error("Please fill all required fields (Color, Size(s), Price, Quantity)")
      return
    }

    if (!selectedMainImage || !selectedHoverImage) {
      toast.error("Please select both main and hover images")
      return
    }

    if (editingVariantIndex !== null) {
      // Edit mode
      const originalVariant = formData.variants[editingVariantIndex]
      const originalSize = originalVariant.size
      const originalColor = originalVariant.color

      if (selectedSizes.length === 1 && selectedSizes[0] === originalSize) {
        // Case 1: Only editing the current variant (same size) - update it
        const updatedVariant = {
          ...newVariant,
          sku: generateSKU(newVariant.color, newVariant.size),
          mainImage: selectedMainImage,
          hoverImage: selectedHoverImage,
          images: variantImages.map((img) => img.url),
          colorId: newVariant.colorId,
        }
        
        let updatedVariants = [...formData.variants]
        updatedVariants[editingVariantIndex] = updatedVariant

        // ✨ NEW: Auto-sync same-color variants (exclude quantity)
        // If color unchanged, update all same-color variants with new data (except quantity)
        if (newVariant.color === originalColor) {
          const sameColorIndices = formData.variants
            .map((v, idx) => ({ variant: v, idx }))
            .filter(({ variant, idx }) => 
              variant.color === originalColor && 
              idx !== editingVariantIndex
            )
            .map(({ idx }) => idx)

          if (sameColorIndices.length > 0) {
            sameColorIndices.forEach(idx => {
              const variant = updatedVariants[idx]
              updatedVariants[idx] = {
                ...variant,
                price: newVariant.price,
                mainImage: selectedMainImage,
                hoverImage: selectedHoverImage,
                images: variantImages.map((img) => img.url),
                // Keep original quantity for each size
              }
            })
            setFormData((prev) => ({ ...prev, variants: updatedVariants }))
            setEditingVariantIndex(null)
            toast.success(`Variant updated! ${sameColorIndices.length} same-color variant(s) synced (prices, images).`)
            return
          }
        }

        setFormData((prev) => ({ ...prev, variants: updatedVariants }))
        setEditingVariantIndex(null)
        toast.success("Variant updated successfully")
      } else {
        // Case 2: Added new sizes - update original + create new variants for new sizes
        const newSizesToAdd = selectedSizes.filter(size => size !== originalSize)

        if (newSizesToAdd.length > 0) {
          // Update the original variant
          const updatedOriginalVariant = {
            ...newVariant,
            sku: generateSKU(newVariant.color, originalSize),
            size: originalSize,
            mainImage: selectedMainImage,
            hoverImage: selectedHoverImage,
            images: variantImages.map((img) => img.url),
            colorId: newVariant.colorId,
          }

          // Create new variants for the new sizes
          const newVariants = newSizesToAdd.map((size) => ({
            sku: generateSKU(newVariant.color, size),
            color: newVariant.color,
            colorId: newVariant.colorId,
            size: size,
            price: newVariant.price,
            quantity: newVariant.quantity,
            mainImage: selectedMainImage,
            hoverImage: selectedHoverImage,
            images: variantImages.map((img) => img.url),
          }))

          const updatedVariants = [...formData.variants]
          updatedVariants[editingVariantIndex] = updatedOriginalVariant

          setFormData((prev) => ({
            ...prev,
            variants: [...updatedVariants, ...newVariants],
          }))

          setEditingVariantIndex(null)
          toast.success(`Variant updated! Created ${newVariants.length} additional variant(s) for new size(s)`)
        } else {
          toast.info("No new sizes selected")
        }
      }
    } else {
      // Add mode: create multiple variants (one for each selected size)
      const newVariants = selectedSizes.map((size) => ({
        sku: generateSKU(newVariant.color, size),
        color: newVariant.color,
        colorId: newVariant.colorId,
        size: size,
        price: newVariant.price,
        quantity: newVariant.quantity,
        mainImage: selectedMainImage,
        hoverImage: selectedHoverImage,
        images: variantImages.map((img) => img.url),
      }))

      setFormData((prev) => ({
        ...prev,
        variants: [...prev.variants, ...newVariants],
      }))

      toast.success(`Created ${newVariants.length} variant(s) for color "${newVariant.color}" with ${selectedSizes.length} size(s)`)
    }

    // Reset form
    setNewVariant({
      sku: "",
      color: "",
      colorId: "",
      size: "",
      price: 0,
      quantity: 0,
      mainImage: "",
      hoverImage: "",
      images: [],
    })
    setSelectedSizes([])
    setVariantImages([])
    setSelectedMainImage("")
    setSelectedHoverImage("")
  }

  // Handle edit variant
  const handleEditVariant = (index: number) => {
    const variant = formData.variants[index]
    setNewVariant(variant)
    setSelectedSizes([variant.size]) // Set single size for editing
    // Populate images from variant
    if (variant.images && variant.images.length > 0) {
      setVariantImages(
        variant.images.map((url, idx) => ({
          url,
          id: `${index}-${idx}`,
        }))
      )
    }
    setSelectedMainImage(variant.mainImage || "")
    setSelectedHoverImage(variant.hoverImage || "")
    setEditingVariantIndex(index)
  }

  // Handle delete variant
  const handleDeleteVariant = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }))
  }



  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{formData.name || "New Product"}</h1>
          <p className="text-muted-foreground">Manage product information and variants</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => onDraft?.(formData)}>
            Save as Draft
          </Button>
          <Button onClick={() => onSave?.({ ...formData, postToFacebook })}>Publish Product</Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="variants">Variants</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>

        {/* Tab 1: Basic Information */}
        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Product name, description, category, and brand</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Product Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Wool Scarf"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <textarea
                  id="description"
                  placeholder="Detailed product description..."
                  className="w-full min-h-32 px-3 py-2 border rounded-md"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center max-w-xl">
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, category: value }))
                    }
                  >
                    <SelectTrigger id="category" className="w-full sm:w-60">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredCategories.length ? (
                        filteredCategories.map((cat) => (
                          <SelectItem key={cat._id} value={cat._id}>
                            {cat.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-category" disabled>
                          No categories found
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Search category"
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    className="w-full sm:w-64"
                  />
                </div>
              </div>

              {/* Brand */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="brand">Brand *</Label>
                  <Button variant="link" size="sm" className="px-0" asChild>
                    <Link to="/admin/brands" target="_blank" rel="noreferrer">
                      Manage brands
                    </Link>
                  </Button>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center max-w-xl">
                  <Select
                    value={formData.brand || undefined}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, brand: value }))
                    }
                    disabled={brandsLoading || availableBrands.length === 0}
                  >
                    <SelectTrigger id="brand" className="w-full sm:w-60">
                      <SelectValue placeholder={brandsLoading ? "Loading brands..." : "Select a brand"} />
                    </SelectTrigger>
                    <SelectContent>
                      {brandsLoading ? (
                        <SelectItem value="loading" disabled>
                          Loading brands...
                        </SelectItem>
                      ) : filteredBrands.length ? (
                        filteredBrands.map((brand) => (
                          <SelectItem key={brand._id} value={brand._id}>
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="font-medium leading-tight">{brand.name}</p>
                                {(brand.tagline || brand.originCountry) && (
                                  <p className="text-xs text-muted-foreground">
                                    {brand.tagline || brand.originCountry}
                                  </p>
                                )}
                              </div>
                              {!brand.isActive && (
                                <Badge variant="outline" className="text-[10px] uppercase">
                                  Inactive
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-brand" disabled>
                          No brands found
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Search brand"
                    value={brandSearch}
                    onChange={(e) => setBrandSearch(e.target.value)}
                    className="w-full sm:w-64"
                    disabled={brandsLoading || availableBrands.length === 0}
                  />
                </div>
                {!brandsLoading && availableBrands.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No brands available yet.{' '}
                    <Link to="/admin/brands" className="underline" target="_blank" rel="noreferrer">
                      Create one from the Brands page.
                    </Link>
                  </p>
                )}
                {selectedBrandDetails && (
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant={selectedBrandDetails.isActive ? 'secondary' : 'outline'}>
                      {selectedBrandDetails.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    {selectedBrandDetails.originCountry && (
                      <span>Origin: {selectedBrandDetails.originCountry}</span>
                    )}
                    {selectedBrandDetails.foundedYear && (
                      <span>Since {selectedBrandDetails.foundedYear}</span>
                    )}
                    {selectedBrandDetails.tagline && (
                      <span className="truncate max-w-full">"{selectedBrandDetails.tagline}"</span>
                    )}
                  </div>
                )}
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma separated)</Label>
                <Input
                  id="tags"
                  placeholder="e.g., wool, winter, luxury"
                  value={formData.tags.join(", ")}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      tags: e.target.value.split(",").map((t) => t.trim()),
                    }))
                  }
                />
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => {
                    setFormData((prev) => ({
                      ...prev,
                      status: value as "draft" | "published" | "archived",
                    }))
                    // Reset postToFacebook when status changes from published
                    if (value !== "published") {
                      setPostToFacebook(false)
                    }
                  }}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Post to Facebook - Only show when status is published */}
              {formData.status === "published" && (
                <div className="space-y-2 p-4 border rounded-lg bg-blue-50/50 dark:bg-blue-950/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <IconBrandFacebook className="h-5 w-5 text-blue-600" />
                      <div>
                        <Label htmlFor="post-to-facebook" className="text-sm font-medium">
                          Post to Facebook
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Automatically post this product to your Facebook Page
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="post-to-facebook"
                      checked={postToFacebook}
                      onCheckedChange={setPostToFacebook}
                    />
                  </div>
                  {postToFacebook && (
                    <p className="text-xs text-blue-600 mt-2">
                      ✓ Product will be posted to Facebook after publishing
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Variants */}
        <TabsContent value="variants" className="space-y-6">
          {/* Upload Images Section */}
          <Card>
            <CardHeader>
              <CardTitle>Upload Variant Images</CardTitle>
              <CardDescription>Upload all images for this variant, then select main and hover images</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Upload Multiple Images */}
              <div className="space-y-2">
                <Label htmlFor="multipleImages">Upload Images (select multiple files)</Label>
                <label
                  htmlFor="multipleImages"
                  className="flex items-center justify-center gap-2 px-6 py-8 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50"
                >
                  <IconUpload className="w-5 h-5" />
                  <div className="text-center">
                    <p className="font-medium">
                      {uploadingImage ? "Uploading..." : "Click to upload images"}
                    </p>
                    <p className="text-xs text-muted-foreground">or drag and drop</p>
                  </div>
                  <input
                    id="multipleImages"
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleMultipleImageUpload}
                    disabled={uploadingImage}
                  />
                </label>
              </div>

              {/* Uploaded Images Grid */}
              {variantImages.length > 0 && (
                <div className="space-y-2">
                  <p className="font-medium">Uploaded Images ({variantImages.length})</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {variantImages.map((img, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={img.url}
                          alt={`Variant ${idx + 1}`}
                          className="w-full aspect-square object-cover rounded border"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition"
                        >
                          <IconTrash className="w-4 h-4" />
                        </button>
                        <p className="text-xs text-center mt-1 text-muted-foreground">
                          Image {idx + 1}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Variant Form */}
          <Card>
            <CardHeader>
              <CardTitle>Product Variants</CardTitle>
              <CardDescription>
                Each variant is a unique combination of color and size with its own price and quantity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Variant Form */}
              <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                <h3 className="font-semibold">
                  {editingVariantIndex !== null ? "Edit Variant" : "Add New Variant"}
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  {/* Color */}
                  <div className="space-y-2">
                    <Label htmlFor="color">Color *</Label>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Select
                          value={newVariant.color}
                          onValueChange={(value) => {
                            const selectedColor = colors.find(c => c.name === value)
                            setNewVariant((prev) => ({
                              ...prev,
                              color: value,
                              colorId: selectedColor?._id || "",
                            }))
                          }}
                        >
                          <SelectTrigger id="color">
                            <SelectValue placeholder="Select color" />
                          </SelectTrigger>
                          <SelectContent>
                            {loadingColors ? (
                              <SelectItem value="loading" disabled>
                                Loading colors...
                              </SelectItem>
                            ) : filteredColorOptions.length === 0 ? (
                              <SelectItem value="no-results" disabled>
                                No colors match search
                              </SelectItem>
                            ) : (
                              filteredColorOptions.map((color) => (
                                <SelectItem key={color._id} value={color.name}>
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-4 h-4 rounded border"
                                      style={{ backgroundColor: color.hex }}
                                    />
                                    {color.name}
                                  </div>
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <Input
                        placeholder="Search color"
                        value={colorSearchTerm}
                        onChange={(event) => setColorSearchTerm(event.target.value)}
                        className="w-44"
                      />
                    </div>
                  </div>

                  {/* Size - Checkboxes (Horizontal) */}
                  <div className="space-y-2 col-span-2">
                    <Label>Size * (Select multiple)</Label>
                    <div className="flex flex-wrap gap-3">
                      {SIZES.map((size) => (
                        <div key={size} className="flex items-center gap-2">
                          <Checkbox
                            id={`size-${size}`}
                            checked={selectedSizes.includes(size)}
                            onCheckedChange={(checked) => {
                              if (size === "Free Size") {
                                // Free Size is exclusive
                                if (checked) {
                                  setSelectedSizes(["Free Size"])
                                } else {
                                  setSelectedSizes([])
                                }
                              } else {
                                // Other sizes
                                if (checked) {
                                  // Remove Free Size if it was selected
                                  setSelectedSizes((prev) =>
                                    prev.filter((s) => s !== "Free Size")
                                  )
                                  // Add this size
                                  setSelectedSizes((prev) => [...prev, size])
                                } else {
                                  // Remove this size
                                  setSelectedSizes((prev) => prev.filter((s) => s !== size))
                                }
                              }
                            }}
                          />
                          <Label
                            htmlFor={`size-${size}`}
                            className={`font-normal cursor-pointer ${size === "Free Size" ? "font-semibold text-blue-600" : ""
                              }`}
                          >
                            {size}
                          </Label>
                        </div>
                      ))}
                    </div>
                    {selectedSizes.length > 0 && (
                      <p className="text-xs text-blue-600">
                        ℹ️ {selectedSizes.length} size(s) selected
                        {selectedSizes.includes("Free Size") && " (Free Size - exclusive)"}
                      </p>
                    )}
                  </div>

                  {/* Price */}
                  <div className="space-y-2">
                    <Label htmlFor="price">Price ($) *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={newVariant.price || ""}
                      onChange={(e) =>
                        setNewVariant((prev) => ({
                          ...prev,
                          price: e.target.value === "" ? 0 : parseFloat(e.target.value),
                        }))
                      }
                    />
                  </div>

                  {/* Quantity */}
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity (Stock) *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      placeholder="0"
                      value={newVariant.quantity || ""}
                      onChange={(e) =>
                        setNewVariant((prev) => ({
                          ...prev,
                          quantity: e.target.value === "" ? 0 : parseInt(e.target.value),
                        }))
                      }
                    />
                  </div>
                </div>

                {/* Main Image */}
                <div className="space-y-2">
                  <Label>Main Image</Label>
                  <Select value={selectedMainImage} onValueChange={setSelectedMainImage}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select main image from uploaded" />
                    </SelectTrigger>
                    <SelectContent>
                      {variantImages.map((img, idx) => (
                        <SelectItem key={idx} value={img.url}>
                          Image {idx + 1}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedMainImage && (
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground mb-1">Preview:</p>
                      <img
                        src={selectedMainImage}
                        alt="Main preview"
                        className="w-24 h-24 object-cover rounded border-2 border-blue-500"
                      />
                    </div>
                  )}
                </div>

                {/* Hover Image */}
                <div className="space-y-2">
                  <Label>Hover Image</Label>
                  <Select value={selectedHoverImage} onValueChange={setSelectedHoverImage}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select hover image from uploaded" />
                    </SelectTrigger>
                    <SelectContent>
                      {variantImages.map((img, idx) => (
                        <SelectItem key={idx} value={img.url}>
                          Image {idx + 1}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedHoverImage && (
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground mb-1">Preview:</p>
                      <img
                        src={selectedHoverImage}
                        alt="Hover preview"
                        className="w-24 h-24 object-cover rounded border-2 border-green-500"
                      />
                    </div>
                  )}
                </div>

                {/* Buttons */}
                <div className="flex gap-2">
                  <Button onClick={handleAddOrUpdateVariant}>
                    <IconPlus className="w-4 h-4 mr-2" />
                    {editingVariantIndex !== null ? "Update Variant" : "Add Variant"}
                  </Button>
                  {editingVariantIndex !== null && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditingVariantIndex(null)
                        setNewVariant({
                          sku: "",
                          color: "",
                          colorId: "",
                          size: "",
                          price: 0,
                          quantity: 0,
                          mainImage: "",
                          hoverImage: "",
                          images: [],
                        })
                        setSelectedSizes([])
                        setVariantImages([])
                        setSelectedMainImage("")
                        setSelectedHoverImage("")
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>

              {/* Variants List with Filters */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Variants List ({formData.variants.length})</h3>
                  <div className="flex gap-2">
                  </div>
                </div>

                {formData.variants.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No variants added yet</p>
                ) : (
                  <>
                    {/* Filters Section */}
                    <Card className="bg-muted/30">
                      <CardContent className="pt-4 pb-4">
                        {/* Mobile: Search + Delete (first row) */}
                        <div className="md:hidden flex gap-2 items-end mb-3">
                          {/* Search SKU */}
                          <div className="space-y-2 flex-1">
                            <Label className="text-xs font-medium">Search</Label>
                            <Input
                              placeholder="SKU, size, color..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="text-sm"
                            />
                          </div>

                          {/* Delete Selected Button - Mobile */}
                          {selectedVariants.size > 0 && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                if (confirm(`Delete ${selectedVariants.size} selected variant(s)?`)) {
                                  const indicesToDelete = Array.from(selectedVariants).sort((a, b) => b - a)
                                  let updatedVariants = [...formData.variants]
                                  indicesToDelete.forEach(idx => {
                                    updatedVariants.splice(idx, 1)
                                  })
                                  setFormData((prev) => ({ ...prev, variants: updatedVariants }))
                                  setSelectedVariants(new Set())
                                  toast.success(`Deleted ${selectedVariants.size} variant(s)`)
                                }
                              }}
                              className="h-9 w-9 p-0"
                              title="Delete selected variants"
                            >
                              <IconTrash className="w-4 h-4" />
                            </Button>
                          )}
                        </div>

                        {/* Mobile: Filters (second row) */}
                        <div className="md:hidden flex gap-2.5 items-end">
                          {/* Filter by Size */}
                          <div className="space-y-2">
                            <Label className="text-xs font-medium">Filter by Size</Label>
                            <Select value={filterSize} onValueChange={setFilterSize}>
                              <SelectTrigger className="text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Sizes</SelectItem>
                                {variantSizes.map((size) => (
                                  <SelectItem key={size} value={size}>
                                    {size}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Filter by Color */}
                          <div className="space-y-2">
                            <Label className="text-xs font-medium">Filter by Color</Label>
                            <Select value={filterColor} onValueChange={setFilterColor}>
                              <SelectTrigger className="text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Colors</SelectItem>
                                {variantColors.map((color) => {
                                  const colorObj = colors.find(c => c._id === color || c.name === color)
                                  const hexColor = colorObj?.hex || "#CCCCCC"
                                  return (
                                    <SelectItem key={color} value={color}>
                                      <div className="flex items-center gap-2">
                                        <div
                                          className="w-3 h-3 rounded border border-gray-400"
                                          style={{
                                            backgroundColor: hexColor,
                                          }}
                                        />
                                        <span>{colorObj?.name || color}</span>
                                      </div>
                                    </SelectItem>
                                  )
                                })}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Results Counter */}
                          <div className="px-3 py-2 border rounded bg-background text-sm font-medium whitespace-nowrap">
                            {filteredVariants.length} of {formData.variants.length}
                          </div>
                        </div>

                        {/* Desktop: All filters in one row */}
                        <div className="hidden md:flex flex-col md:flex-row gap-2 md:gap-4 items-end">
                          {/* Search SKU */}
                          <div className="space-y-2 flex-1">
                            <Label className="text-xs font-medium">Search SKU</Label>
                            <Input
                              placeholder="Search SKU, size, color..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="text-sm"
                            />
                          </div>

                          {/* Filter by Size + Color + Results + Delete */}
                          <div className="flex gap-2.5 items-end">
                            {/* Filter by Size */}
                            <div className="space-y-2">
                              <Label className="text-xs font-medium">Filter by Size</Label>
                              <Select value={filterSize} onValueChange={setFilterSize}>
                                <SelectTrigger className="text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">All Sizes</SelectItem>
                                  {variantSizes.map((size) => (
                                    <SelectItem key={size} value={size}>
                                      {size}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Filter by Color */}
                            <div className="space-y-2">
                              <Label className="text-xs font-medium">Filter by Color</Label>
                              <Select value={filterColor} onValueChange={setFilterColor}>
                                <SelectTrigger className="text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">All Colors</SelectItem>
                                  {variantColors.map((color) => {
                                    const colorObj = colors.find(c => c._id === color || c.name === color)
                                    const hexColor = colorObj?.hex || "#CCCCCC"
                                    return (
                                      <SelectItem key={color} value={color}>
                                        <div className="flex items-center gap-2">
                                          <div
                                            className="w-3 h-3 rounded border border-gray-400"
                                            style={{
                                              backgroundColor: hexColor,
                                            }}
                                          />
                                          <span>{colorObj?.name || color}</span>
                                        </div>
                                      </SelectItem>
                                    )
                                  })}
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Results Counter */}
                            <div className="space-y-2 px-3 py-2 border rounded bg-background text-sm font-medium whitespace-nowrap">
                              {filteredVariants.length} of {formData.variants.length}
                            </div>

                            {/* Delete Selected Button - Desktop */}
                            {selectedVariants.size > 0 && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  if (confirm(`Delete ${selectedVariants.size} selected variant(s)?`)) {
                                    const indicesToDelete = Array.from(selectedVariants).sort((a, b) => b - a)
                                    let updatedVariants = [...formData.variants]
                                    indicesToDelete.forEach(idx => {
                                      updatedVariants.splice(idx, 1)
                                    })
                                    setFormData((prev) => ({ ...prev, variants: updatedVariants }))
                                    setSelectedVariants(new Set())
                                    toast.success(`Deleted ${selectedVariants.size} variant(s)`)
                                  }
                                }}
                                className="h-9 w-9 p-0"
                                title="Delete selected variants"
                              >
                                <IconTrash className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Variants Table */}
                    <Card>
                      <CardContent className="p-0">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b bg-muted/50">
                                <th className="text-left py-3 px-3 w-12">
                                  <Checkbox
                                    checked={selectedVariants.size === filteredIndices.length && filteredIndices.length > 0}
                                    onCheckedChange={() => toggleAllVariants()}
                                  />
                                </th>
                                <th className="text-left py-3 px-3 font-mono text-xs">SKU & Size</th>
                                <th className="text-left py-3 px-3"></th>
                                <th className="text-left py-3 px-3">Color</th>
                                <th className="text-right py-3 px-3">Price</th>
                                <th className="text-right py-3 px-3">Stock</th>
                                <th className="text-center py-3 px-3">Image</th>
                                <th className="text-center py-3 px-3">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredVariants.length === 0 ? (
                                <tr>
                                  <td colSpan={8} className="text-center py-8 text-muted-foreground">
                                    No variants found
                                  </td>
                                </tr>
                              ) : (
                                (() => {
                                  const paginatedVariants = filteredVariants.slice(
                                    (variantPage - 1) * variantItemsPerPage,
                                    variantPage * variantItemsPerPage
                                  )
                                  return paginatedVariants.map((filteredVariant) => {
                                    const index = formData.variants.findIndex(
                                      (v) => v.sku === filteredVariant.sku
                                    )
                                    if (index === -1) return null

                                    const variant = formData.variants[index]
                                    const stockStatus = getStockStatus(variant.quantity)
                                    const isSelected = selectedVariants.has(index)

                                    return (
                                      <tr
                                        key={`${variant.sku}-${index}`}
                                        className={`border-b hover:bg-muted/50 transition ${isSelected ? "bg-muted/70" : ""
                                          }`}
                                      >
                                        <td className="py-3 px-3">
                                          <Checkbox
                                            checked={isSelected}
                                            onCheckedChange={() => toggleVariantSelection(index)}
                                          />
                                        </td>
                                        <td className="py-3 px-3 font-mono text-xs font-semibold">
                                          <div className="flex flex-col gap-1">
                                            <span className="text-lg font-bold text-foreground">{variant.sku}</span>
                                            <span className="text-xs text-muted-foreground font-medium">Size: {variant.size}</span>
                                          </div>
                                        </td>
                                        <td className="py-3 px-3">
                                        </td>
                                        <td className="py-3 px-3">
                                          <div className="flex items-center gap-2">
                                            {(() => {
                                              const colorObj = colors.find(c => c._id === variant.colorId || c.name === variant.color)
                                              const hexColor = colorObj?.hex || "#CCCCCC"
                                              return (
                                                <>
                                                  <div
                                                    className="w-5 h-5 rounded border border-gray-400 shadow-sm"
                                                    style={{
                                                      backgroundColor: hexColor,
                                                    }}
                                                    title={`${colorObj?.name || variant.color} (${hexColor})`}
                                                  />
                                                  <span className="text-sm font-medium">{colorObj?.name || variant.color}</span>
                                                </>
                                              )
                                            })()}
                                          </div>
                                        </td>
                                        <td className="py-3 px-3 text-right font-semibold">
                                          ${variant.price.toFixed(2)}
                                        </td>
                                        <td className="py-3 px-3 text-right">
                                          <div className="flex items-center justify-end gap-2">
                                            <span className="font-semibold">{variant.quantity}</span>
                                            <span
                                              className={`${stockStatus.color} text-white text-xs font-bold px-2 py-1 rounded`}
                                            >
                                              {stockStatus.label}
                                            </span>
                                          </div>
                                        </td>
                                        <td className="py-3 px-3 text-center">
                                          <div className="flex flex-col items-center gap-2">
                                            {variant.mainImage ? (
                                              <img
                                                src={variant.mainImage}
                                                alt="variant main"
                                                className="h-12 w-12 object-cover rounded border border-gray-300"
                                              />
                                            ) : (
                                              <div className="h-12 w-12 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                                                No img
                                              </div>
                                            )}
                                            <span className="text-xs text-muted-foreground font-medium">
                                              +{variant.images.length}
                                            </span>
                                          </div>
                                        </td>
                                        <td className="py-3 px-3">
                                          <div className="flex justify-center gap-1">
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() => setViewDetailIndex(index)}
                                              className="h-8 w-8 p-0"
                                              title="View details"
                                            >
                                              <IconEye className="w-4 h-4" />
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() => handleEditVariant(index)}
                                              className="h-8 w-8 p-0"
                                              title="Edit variant"
                                            >
                                              <IconEdit className="w-4 h-4" />
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="destructive"
                                              onClick={() => {
                                                if (confirm("Delete this variant?")) {
                                                  handleDeleteVariant(index)
                                                }
                                              }}
                                              className="h-8 w-8 p-0"
                                              title="Delete variant"
                                            >
                                              <IconTrash className="w-4 h-4" />
                                            </Button>
                                          </div>
                                        </td>
                                      </tr>
                                    )
                                  })
                                })()
                              )}
                            </tbody>
                          </table>
                        </div>

                        {/* Pagination Controls */}
                        {Math.ceil(filteredVariants.length / variantItemsPerPage) > 1 && (
                          <div className="flex items-center justify-between mt-4 pt-4 border-t">
                            <div className="text-sm text-muted-foreground">
                              Showing {(variantPage - 1) * variantItemsPerPage + 1}-{Math.min(variantPage * variantItemsPerPage, filteredVariants.length)} of{" "}
                              {filteredVariants.length} variants
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setVariantPage(Math.max(1, variantPage - 1))}
                                disabled={variantPage === 1}
                              >
                                ← Previous
                              </Button>
                              <div className="flex items-center gap-1">
                                {Array.from({ length: Math.ceil(filteredVariants.length / variantItemsPerPage) }).map((_, idx) => (
                                  <Button
                                    key={idx + 1}
                                    variant={variantPage === idx + 1 ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setVariantPage(idx + 1)}
                                    className="w-8"
                                  >
                                    {idx + 1}
                                  </Button>
                                ))}
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setVariantPage(Math.min(Math.ceil(filteredVariants.length / variantItemsPerPage), variantPage + 1))}
                                disabled={variantPage === Math.ceil(filteredVariants.length / variantItemsPerPage)}
                              >
                                Next →
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Selection Info */}
                    {selectedVariants.size > 0 && (
                      <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded">
                        {selectedVariants.size} variant(s) selected
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedVariants(new Set())}
                          className="ml-2 h-7"
                        >
                          Clear Selection
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Inventory Summary */}
        <TabsContent value="inventory" className="space-y-6">
          {formData.variants.length === 0 ? (
            <Card className="p-6">
              <p className="text-center text-muted-foreground">
                Add variants first to view inventory summary
              </p>
            </Card>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Variants
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formData.variants.length}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Stock
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formData.variants.reduce((sum, v) => sum + v.quantity, 0)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Value (USD)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ${formData.variants
                        .reduce((sum, v) => sum + v.price * v.quantity, 0)
                        .toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Stock Distribution by Size */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Stock Distribution by Size</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(() => {
                    const sizeDistribution = formData.variants.reduce(
                      (acc, v) => {
                        acc[v.size] = (acc[v.size] || 0) + v.quantity
                        return acc
                      },
                      {} as Record<string, number>
                    )
                    const totalStock = Object.values(sizeDistribution).reduce((a, b) => a + b, 0)

                    return Object.entries(sizeDistribution)
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([size, stock]) => {
                        const percentage = ((stock / totalStock) * 100).toFixed(1)
                        const barWidth = (stock / totalStock) * 100
                        return (
                          <div key={size} className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">Size {size}</span>
                              <span className="text-sm text-muted-foreground">
                                {stock} units ({percentage}%)
                              </span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-blue-500 h-full rounded-full transition-all"
                                style={{ width: `${barWidth}%` }}
                              />
                            </div>
                          </div>
                        )
                      })
                  })()}
                </CardContent>
              </Card>

              {/* Stock Distribution by Color */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Stock Distribution by Color</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(() => {
                    const colorDistribution = formData.variants.reduce(
                      (acc, v) => {
                        const colorKey = v.color || "None"
                        acc[colorKey] = (acc[colorKey] || 0) + v.quantity
                        return acc
                      },
                      {} as Record<string, number>
                    )
                    const totalStock = Object.values(colorDistribution).reduce((a, b) => a + b, 0)

                    return Object.entries(colorDistribution)
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([color, stock]) => {
                        const percentage = ((stock / totalStock) * 100).toFixed(1)
                        const isNone = color === "None"

                        // Find color from the colors list
                        const colorObj = colors.find(c => c.name === color)
                        const colorHex = isNone ? "#999999" : (colorObj?.hex || "#999999")

                        return (
                          <div key={color} className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-4 h-4 rounded-full border"
                                style={{ backgroundColor: colorHex }}
                              />
                              <span className="text-sm font-medium">
                                {isNone ? "None (Size Only)" : color}
                              </span>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {stock} units ({percentage}%)
                            </span>
                          </div>
                        )
                      })
                  })()}
                </CardContent>
              </Card>

              {/* Variants Needing Attention */}
              {(() => {
                const needsAttention = formData.variants.filter(
                  (v) => v.quantity === 0 || v.quantity < 10
                )
                return needsAttention.length > 0 ? (
                  <Card className="border-red-200 bg-red-50">
                    <CardHeader>
                      <CardTitle className="text-base text-red-900">
                        ⚠️ Variants Needing Attention ({needsAttention.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {needsAttention.map((v, idx) => (
                          <div key={idx} className="flex justify-between items-center p-2 bg-white rounded border border-red-200">
                            <span className="text-sm font-mono font-medium">{v.sku}</span>
                            <span
                              className={`text-sm font-medium ${v.quantity === 0
                                ? "text-red-600"
                                : "text-amber-600"
                                }`}
                            >
                              {v.quantity === 0 ? "Out of Stock" : `Low Stock (${v.quantity} units)`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : null
              })()}
            </>
          )}
        </TabsContent>

        {/* Tab 4: SEO */}
        <TabsContent value="seo" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
              <CardDescription>Optimize product for search engines</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* SEO Title */}
              <div className="space-y-2">
                <Label htmlFor="seoTitle">SEO Title (max 60 characters)</Label>
                <Input
                  id="seoTitle"
                  maxLength={60}
                  placeholder="SEO title for search results"
                  value={formData.seoTitle}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, seoTitle: e.target.value }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  {formData.seoTitle.length}/60
                </p>
              </div>

              {/* SEO Description */}
              <div className="space-y-2">
                <Label htmlFor="seoDescription">SEO Description (max 160 characters)</Label>
                <textarea
                  id="seoDescription"
                  maxLength={160}
                  placeholder="SEO description for search results"
                  className="w-full min-h-24 px-3 py-2 border rounded-md"
                  value={formData.seoDescription}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, seoDescription: e.target.value }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  {formData.seoDescription.length}/160
                </p>
              </div>

              {/* URL Slug */}
              <div className="space-y-2">
                <Label htmlFor="urlSlug">URL Slug</Label>
                <Input
                  id="urlSlug"
                  placeholder="e.g., wool-scarf-red"
                  value={formData.urlSlug}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, urlSlug: e.target.value }))
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Variant Details Modal */}
      {viewDetailIndex !== null && formData.variants[viewDetailIndex] && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>Variant Details</CardTitle>
                <CardDescription>{formData.variants[viewDetailIndex].sku}</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewDetailIndex(null)}
                className="h-8 w-8 p-0"
              >
                ✕
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {(() => {
                const variant = formData.variants[viewDetailIndex]
                const colorObj = colors.find(c => c._id === variant.colorId || c.name === variant.color)
                const hexColor = colorObj?.hex || "#CCCCCC"

                return (
                  <>
                    {/* Main Image */}
                    {variant.mainImage && (
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">Main Image</Label>
                        <img
                          src={variant.mainImage}
                          alt={`${variant.sku} main`}
                          className="w-full h-80 object-cover rounded border"
                        />
                      </div>
                    )}

                    {/* Hover Image */}
                    {variant.hoverImage && (
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">Hover Image</Label>
                        <img
                          src={variant.hoverImage}
                          alt={`${variant.sku} hover`}
                          className="w-full h-80 object-cover rounded border"
                        />
                      </div>
                    )}

                    {/* Additional Images */}
                    {variant.images && variant.images.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">All Images ({variant.images.length})</Label>
                        <div className="grid grid-cols-3 gap-3">
                          {variant.images.map((img, idx) => (
                            <img
                              key={idx}
                              src={img}
                              alt={`${variant.sku} image ${idx + 1}`}
                              className="w-full h-32 object-cover rounded border"
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-4 border-t pt-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">Product</Label>
                        <p className="font-semibold">{formData.name}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">SKU</Label>
                        <p className="font-semibold font-mono">{variant.sku}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Size</Label>
                        <p className="font-semibold">{variant.size}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Color</Label>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded border-2 border-gray-400"
                            style={{ backgroundColor: hexColor }}
                          />
                          <p className="font-semibold">{colorObj?.name || variant.color}</p>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Price</Label>
                        <p className="font-semibold text-lg">${variant.price.toFixed(2)}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Stock</Label>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{variant.quantity} units</p>
                          <span
                            className={`${getStockStatus(variant.quantity).color} text-white text-xs font-bold px-2 py-1 rounded`}
                          >
                            {getStockStatus(variant.quantity).label}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 border-t pt-4">
                      <Button
                        onClick={() => {
                          handleEditVariant(viewDetailIndex)
                          setViewDetailIndex(null)
                        }}
                        variant="outline"
                      >
                        <IconEdit className="w-4 h-4 mr-2" />
                        Edit Variant
                      </Button>
                      <Button
                        onClick={() => {
                          if (confirm("Delete this variant?")) {
                            handleDeleteVariant(viewDetailIndex)
                            setViewDetailIndex(null)
                            toast.success("Variant deleted")
                          }
                        }}
                        variant="destructive"
                      >
                        <IconTrash className="w-4 h-4 mr-2" />
                        Delete Variant
                      </Button>
                      <Button
                        onClick={() => setViewDetailIndex(null)}
                        variant="ghost"
                        className="ml-auto"
                      >
                        Close
                      </Button>
                    </div>
                  </>
                )
              })()}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default ProductFormSimplified
