import { useState, useEffect } from "react"
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
import { IconUpload, IconPlus, IconTrash, IconEdit, IconX } from "@tabler/icons-react"
import { CATEGORY_CODES, COLOR_CODES, SIZE_CODES, BRAND_CODES, generateVariantMatrix } from "@/utils/skuGenerator"
import { api } from "@/services/api"
import { VariantsMatrix } from "./VariantsMatrix"
import { VariantEditDialog } from "./VariantEditDialog"

interface ProductFormProps {
  onSave?: (data: ProductFormData) => void
  onDraft?: (data: ProductFormData) => void
  initialData?: Partial<ProductFormData>
}

export interface ProductFormData {
  // Tab 1: Basic Info
  name: string
  description: string
  category: string
  brand: string
  basePrice: number
  tags: string[]
  status: "draft" | "published" | "archived"

  // Tab 2: Media
  images: Array<{
    id: string
    url: string
    isMain: boolean
    altText: string
  }>

  // Tab 3: Variants
  variants: Array<{
    id?: string
    sku: string
    size: string
    color?: string | null
    price: number
    comparePrice?: number
    stock: number
    lowStockThreshold: number
    images: string[]
    weight?: number
    dimensions?: {
      length: number
      width: number
      height: number
    }
    barcode?: string
  }>

  // Tab 4: Pricing & Inventory - Auto calculated

  // Tab 5: SEO
  seoTitle: string
  seoDescription: string
  urlSlug: string
  focusKeyword: string
  relatedProducts: string[]
  upsellProducts: string[]
}

export function ProductForm({ onSave, onDraft, initialData }: ProductFormProps) {
  const defaultFormData: ProductFormData = {
    name: "",
    description: "",
    category: "",
    brand: "DEV",
    basePrice: 0,
    tags: [],
    status: "draft",
    images: [],
    variants: [],
    seoTitle: "",
    seoDescription: "",
    urlSlug: "",
    focusKeyword: "",
    relatedProducts: [],
    upsellProducts: [],
  }

  const [formData, setFormData] = useState<ProductFormData>(() => {
    if (initialData) {
      return {
        ...defaultFormData,
        ...(initialData as Partial<ProductFormData>),
      }
    }
    return defaultFormData
  })

  const [selectedSizes, setSelectedSizes] = useState<string[]>([])
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [customColors, setCustomColors] = useState<Record<string, { name: string; hex: string }>>({})
  const [uploadingImages, setUploadingImages] = useState(false)
  const [editingVariant, setEditingVariant] = useState<any>(null)
  const [isVariantEditOpen, setIsVariantEditOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)

  // Update form when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData((prev) => ({
        ...prev,
        ...(initialData as Partial<ProductFormData>),
      }))

      // Check if we're in edit mode (has variants)
      if (initialData.variants && initialData.variants.length > 0) {
        setIsEditMode(true)
        
        // Extract unique sizes and colors from existing variants
        const uniqueSizes = [...new Set(initialData.variants.map((v) => v.size))]
        // Filter out null/undefined colors
        const uniqueColors = [...new Set(initialData.variants.map((v) => v.color).filter((c) => c !== null && c !== undefined))] as string[]
        
        setSelectedSizes(uniqueSizes)
        setSelectedColors(uniqueColors)

        // Extract custom colors (those not in COLOR_CODES)
        const customColorsMap: Record<string, { name: string; hex: string }> = {}
        uniqueColors.forEach((color) => {
          if (color && !COLOR_CODES[color as keyof typeof COLOR_CODES]) {
            customColorsMap[color] = {
              name: color,
              hex: "#999999",
            }
          }
        })
        setCustomColors(customColorsMap)
      } else {
        setIsEditMode(false)
        setSelectedSizes(["S", "M", "L", "XL"])
        setSelectedColors([])
        setCustomColors({})
      }
    }
  }, [initialData])

  // Cloudinary upload via backend
  const uploadToCloudinary = async (files: File[]) => {
    try {
      setUploadingImages(true)
      const formDataUpload = new FormData()

      // Append all files
      files.forEach((file) => {
        formDataUpload.append("images", file)
      })

      // Call backend upload endpoint
      const response = await api.post("/upload/images", formDataUpload, {
        headers: { "Content-Type": "multipart/form-data" },
      })

      if (response.data.success) {
        const uploadedUrls: Array<{ id: string; url: string; isMain: boolean; altText: string }> = 
          response.data.data.map((img: any, idx: number) => ({
            id: img.id,
            url: img.url,
            isMain: idx === 0 && formData.images.length === 0, // First image is main only if no images yet
            altText: formData.name || "Product image",
          }))

        setFormData({
          ...formData,
          images: [...formData.images, ...uploadedUrls],
        })

        alert(`${uploadedUrls.length} image(s) uploaded successfully!`)
      } else {
        alert(response.data.message || "Upload failed")
      }
    } catch (error: any) {
      console.error("Upload error:", error)
      const errorMsg = error?.response?.data?.message || error?.message || "Error uploading images"
      alert(`Error: ${errorMsg}`)
    } finally {
      setUploadingImages(false)
    }
  }

  const handleSaveSizeOnly = () => {
    // Create variants with only sizes, no colors
    const newVariants = selectedSizes.map((size) => {
      const skuParts = [formData.brand, formData.category, "NULL", size]
      return {
        sku: skuParts.join("-"),
        size: size,
        color: null as any,
        price: formData.basePrice,
        stock: 0,
        lowStockThreshold: 10,
        images: [],
      }
    })

    // If editing, merge with existing variants
    if (isEditMode && formData.variants.length > 0) {
      const existingSkus = new Set(formData.variants.map((v) => v.sku))
      const variantsToAdd = newVariants.filter((v) => !existingSkus.has(v.sku))
      setFormData((prev) => ({
        ...prev,
        variants: [...prev.variants, ...variantsToAdd],
      }))
      if (variantsToAdd.length > 0) {
        alert(`✅ Added ${variantsToAdd.length} size-only variant(s)!`)
      } else {
        alert(`ℹ️ All size variants already exist.`)
      }
    } else {
      // New product
      setFormData((prev) => ({
        ...prev,
        variants: newVariants,
      }))
      alert(`✅ Created ${newVariants.length} size-only variant(s)!`)
    }
  }

  const handleGenerateVariants = () => {
    const matrix = generateVariantMatrix({
      brand: formData.brand as any,
      category: formData.category as any,
      sizes: selectedSizes as any,
      colors: selectedColors as any,
    })

    const newVariants = matrix.map((config) => {
      const skuParts = [config.brand, config.category, config.color, config.size]
      return {
        sku: skuParts.join("-"),
        size: config.size,
        color: config.color,
        price: formData.basePrice,
        stock: 0,
        lowStockThreshold: 10,
        images: [],
      }
    })

    // If editing, merge with existing variants (avoid duplicates by SKU)
    if (isEditMode && formData.variants.length > 0) {
      const existingSkus = new Set(formData.variants.map((v) => v.sku))
      const variantsToAdd = newVariants.filter((v) => !existingSkus.has(v.sku))
      setFormData((prev) => ({
        ...prev,
        variants: [...prev.variants, ...variantsToAdd],
      }))
      if (variantsToAdd.length > 0) {
        alert(`✅ Added ${variantsToAdd.length} new variant(s)!`)
      } else {
        alert(`ℹ️ All variants already exist. No duplicates added.`)
      }
    } else {
      // New product, replace entirely
      setFormData((prev) => ({
        ...prev,
        variants: newVariants,
      }))
    }
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
          <Button onClick={() => onSave?.(formData)}>Publish Product</Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="variants">Variants</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>

        {/* Tab 1: Basic Information */}
        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Product Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Áo Sơ Mi Oxford"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <textarea
                  id="description"
                  placeholder="Detailed product description (min 100 characters)"
                  className="w-full min-h-32 p-2 border rounded-md"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.description.length} characters
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CATEGORY_CODES).map(([code, name]) => (
                        <SelectItem key={code} value={code}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="brand">Brand</Label>
                  <Select value={formData.brand} onValueChange={(value) => setFormData({ ...formData, brand: value })}>
                    <SelectTrigger id="brand">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(BRAND_CODES).map(([code, name]) => (
                        <SelectItem key={code} value={code}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="basePrice">Base Price (VNĐ) *</Label>
                <Input
                  id="basePrice"
                  type="number"
                  placeholder="350,000"
                  value={formData.basePrice}
                  onChange={(e) => setFormData({ ...formData, basePrice: parseInt(e.target.value) })}
                />
                <p className="text-xs text-muted-foreground mt-1">ℹ️ Base price - variants can override</p>
              </div>

              {/* Tags */}
              <div>
                <Label>Tags (Multi-select)</Label>
                <div className="flex flex-wrap gap-2 mb-3 p-2 border rounded-md min-h-10">
                  {formData.tags.map((tag, idx) => (
                    <div key={idx} className="flex items-center gap-1 bg-blue-100 text-blue-900 px-3 py-1 rounded-full">
                      <span className="text-sm">{tag}</span>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, tags: formData.tags.filter((_, i) => i !== idx) })}
                        className="hover:text-blue-700"
                      >
                        <IconX className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add tag (e.g., công sở, thoáng mát, cao cấp)"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.currentTarget.value.trim()) {
                        const newTag = e.currentTarget.value.trim()
                        if (!formData.tags.includes(newTag)) {
                          setFormData({ ...formData, tags: [...formData.tags, newTag] })
                        }
                        e.currentTarget.value = ""
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const input = document.querySelector('input[placeholder*="Add tag"]') as HTMLInputElement
                      if (input?.value.trim() && !formData.tags.includes(input.value.trim())) {
                        setFormData({ ...formData, tags: [...formData.tags, input.value.trim()] })
                        input.value = ""
                      }
                    }}
                  >
                    <IconPlus className="h-4 w-4 mr-1" />
                    Add Tag
                  </Button>
                </div>
              </div>

              <div>
                <Label>Status</Label>
                <div className="flex gap-4 mt-2">
                  {(["draft", "published", "archived"] as const).map((status) => (
                    <label key={status} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="status"
                        value={status}
                        checked={formData.status === status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      />
                      <span className="capitalize">{status}</span>
                    </label>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Media */}
        <TabsContent value="media" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Main Product Images</CardTitle>
              <CardDescription>Minimum 4 images recommended. Resolution: 1200x1200px. Main image displays first on product page.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Upload Section */}
              <div>
                <Label className="mb-3 block">Add Images</Label>
                <label className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center hover:bg-muted/50 transition cursor-pointer relative max-w-xs">
                  <div className="flex flex-col items-center gap-2">
                    {uploadingImages ? (
                      <>
                        <div className="animate-spin">⏳</div>
                        <span className="text-xs">Uploading...</span>
                      </>
                    ) : (
                      <>
                        <IconUpload className="h-6 w-6" />
                        <span className="text-sm">Add Image</span>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={uploadingImages}
                    className="hidden"
                    onChange={(e) => {
                      if (!e.target.files) return
                      const files = Array.from(e.target.files)
                      uploadToCloudinary(files)
                    }}
                  />
                </label>
              </div>

              {/* Images Grid with Alt Text */}
              <div>
                <Label className="mb-3 block">Images ({formData.images.length})</Label>
                <div className="space-y-4">
                  {formData.images.map((img, idx) => (
                    <div key={img.id} className="border rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Image Preview */}
                        <div className="col-span-1">
                          <div className="relative aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center overflow-hidden group bg-muted">
                            <img src={img.url} alt={img.altText} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                              <Button
                                size="sm"
                                variant={img.isMain ? "default" : "secondary"}
                                onClick={() =>
                                  setFormData({
                                    ...formData,
                                    images: formData.images.map((i, i2) => ({
                                      ...i,
                                      isMain: i2 === idx,
                                    })),
                                  })
                                }
                              >
                                {img.isMain ? "✓ Main" : "Set Main"}
                              </Button>
                            </div>
                          </div>
                          {img.isMain && (
                            <div className="mt-2 text-xs font-semibold text-center text-blue-600 bg-blue-50 py-1 rounded">
                              Main Image
                            </div>
                          )}
                        </div>

                        {/* Image Details */}
                        <div className="col-span-1 md:col-span-3 space-y-3">
                          <div>
                            <Label htmlFor={`alt-${idx}`} className="text-sm">
                              Alt Text (SEO)
                            </Label>
                            <textarea
                              id={`alt-${idx}`}
                              placeholder="Describe the image for search engines (e.g., Áo sơ mi trắng Oxford nam)"
                              className="w-full min-h-20 p-2 border rounded-md text-sm"
                              value={img.altText}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  images: formData.images.map((i, i2) =>
                                    i2 === idx ? { ...i, altText: e.target.value } : i
                                  ),
                                })
                              }
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              {img.altText.length} characters
                            </p>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  images: formData.images.filter((_, i2) => i2 !== idx),
                                })
                              }
                            >
                              <IconTrash className="h-4 w-4 mr-1" />
                              Delete Image
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Variants */}
        <TabsContent value="variants" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Generate Variants</CardTitle>
              <CardDescription>Select sizes and colors to generate variant matrix</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Sizes Selection */}
              <div>
                <Label className="mb-3 block">Sizes (Select multiple) *</Label>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(SIZE_CODES).map(([code, label]) => (
                    <label key={code} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedSizes.includes(code)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSizes([...selectedSizes, code])
                          } else {
                            setSelectedSizes(selectedSizes.filter((s) => s !== code))
                          }
                        }}
                      />
                      <span className="text-sm font-medium">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Colors Selection */}
              <div>
                <Label className="mb-3 block">Colors (Select multiple) *</Label>
                
                {/* All Available Colors */}
                <div className="space-y-2 mb-4 border rounded-lg p-3 bg-muted/20 max-h-64 overflow-y-auto">
                  {(() => {
                    // Merge COLOR_CODES with custom colors
                    const allColors = { ...COLOR_CODES, ...customColors }
                    return Object.entries(allColors).map(([code, color]) => (
                      <div key={code} className="flex items-center gap-3 p-2 rounded hover:bg-muted/50">
                        <input
                          type="checkbox"
                          checked={selectedColors.includes(code)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedColors([...selectedColors, code])
                            } else {
                              setSelectedColors(selectedColors.filter((c) => c !== code))
                            }
                          }}
                          className="cursor-pointer"
                        />
                        <div
                          className="w-6 h-6 rounded border-2 border-gray-300"
                          style={{ backgroundColor: color.hex }}
                          title={color.name}
                        />
                        <span className="text-sm font-medium flex-1">{color.name}</span>
                        <span className="text-xs text-muted-foreground font-mono">{color.hex}</span>
                        
                        {/* Only show remove button for custom colors */}
                        {customColors[code] && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              // Remove from customColors
                              const newCustomColors = { ...customColors }
                              delete newCustomColors[code]
                              setCustomColors(newCustomColors)
                              
                              // Remove from selectedColors if selected
                              setSelectedColors(selectedColors.filter((c) => c !== code))
                            }}
                            className="h-6 w-6 p-0"
                          >
                            <IconTrash className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    ))
                  })()}
                </div>

                {/* Add Custom Color */}
                <div className="border rounded-lg p-3 bg-muted/30">
                  <p className="text-xs font-semibold mb-2">➕ Add Custom Color</p>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Color name (e.g., Hồng nhạt)"
                      id="customColorName"
                      className="flex-1 text-sm"
                    />
                    <Input
                      type="color"
                      id="customColorPicker"
                      className="w-16 h-9 p-1 cursor-pointer"
                      defaultValue="#CCCCCC"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        const nameInput = document.getElementById("customColorName") as HTMLInputElement
                        const colorPicker = document.getElementById("customColorPicker") as HTMLInputElement
                        const name = nameInput?.value.trim()
                        const hex = colorPicker?.value.toUpperCase()

                        if (name && hex) {
                          // Create unique code from first 2 chars of name
                          let newCode = name.substring(0, 2).toUpperCase()
                          let counter = 1
                          
                          // Make sure code is unique (check both standard and custom colors)
                          const allExistingCodes = { ...COLOR_CODES, ...customColors }
                          while (newCode in allExistingCodes) {
                            newCode = name.substring(0, 1).toUpperCase() + counter
                            counter++
                          }

                          // Add to custom colors
                          setCustomColors({
                            ...customColors,
                            [newCode]: { name, hex },
                          })
                          
                          // Auto-select the new color
                          setSelectedColors([...selectedColors, newCode])
                          
                          // Clear input
                          if (nameInput) nameInput.value = ""
                          if (colorPicker) colorPicker.value = "#CCCCCC"
                        } else {
                          alert("Please enter color name and pick a color")
                        }
                      }}
                    >
                      <IconPlus className="h-4 w-4" />
                      Add
                    </Button>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 w-full"
                  onClick={() => {
                    const allColors = { ...COLOR_CODES, ...customColors }
                    const allColorCodes = Object.keys(allColors)
                    setSelectedColors(
                      selectedColors.length === allColorCodes.length ? [] : allColorCodes
                    )
                  }}
                >
                  {(() => {
                    const allColors = { ...COLOR_CODES, ...customColors }
                    const allColorCodes = Object.keys(allColors)
                    return selectedColors.length === allColorCodes.length
                      ? "Deselect All"
                      : "Select All"
                  })()}
                </Button>
              </div>

              {/* Preview */}
              <div className="bg-muted/50 p-4 rounded-lg">
                {selectedColors.length > 0 ? (
                  <>
                    <p className="text-sm font-medium">
                      Preview: {selectedSizes.length * selectedColors.length} variants will be generated
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ({selectedSizes.length} sizes × {selectedColors.length} colors)
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium">
                      Preview: {selectedSizes.length} size-only variant(s) will be created
                    </p>
                    <p className="text-xs text-muted-foreground">
                      (Colors: None, Images: None)
                    </p>
                  </>
                )}
              </div>

              {/* Save Size Button - Only show when sizes selected but no colors */}
              {selectedSizes.length > 0 && selectedColors.length === 0 && (
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleSaveSizeOnly}
                  variant="secondary"
                >
                  <IconPlus className="h-4 w-4 mr-2" />
                  💾 Save Size Only
                </Button>
              )}

              <Button
                className="w-full"
                size="lg"
                onClick={handleGenerateVariants}
                disabled={selectedSizes.length === 0 || selectedColors.length === 0}
              >
                <IconPlus className="h-4 w-4 mr-2" />
                {isEditMode ? "Add More Variants" : "Generate Variants Matrix"}
              </Button>
            </CardContent>
          </Card>

          {/* Variants Matrix - Editable Table */}
          {formData.variants.length > 0 && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Variants Matrix Management</CardTitle>
                  <CardDescription>
                    View, edit, and manage all variants. Use Bulk Actions for quick updates.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full" />
                      <span>In Stock</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-amber-500 rounded-full" />
                      <span>Low Stock (&lt;10)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full" />
                      <span>Out of Stock</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <IconEdit className="h-4 w-4" />
                      <span>Click to edit</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <VariantsMatrix
                variants={formData.variants}
                customColors={customColors}
                onVariantEdit={(variant) => {
                  setEditingVariant(variant)
                  setIsVariantEditOpen(true)
                }}
                onVariantDelete={(sku) => {
                  setFormData((prev) => ({
                    ...prev,
                    variants: prev.variants.filter((v) => v.sku !== sku),
                  }))
                }}
                onBulkAction={(selectedSkus, action, data) => {
                  setFormData((prev) => ({
                    ...prev,
                    variants: prev.variants.map((v) => {
                      if (selectedSkus.includes(v.sku)) {
                        switch (action) {
                          case "setStock":
                            return { ...v, stock: data.stock }
                          case "addStock":
                            return { ...v, stock: v.stock + data.quantity }
                          case "setPrice":
                            return { ...v, price: data.price }
                          default:
                            return v
                        }
                      }
                      return v
                    }),
                  }))
                }}
              />
            </>
          )}
        </TabsContent>

        {/* Tab 4: Inventory Summary */}
        <TabsContent value="inventory" className="space-y-6">
          {formData.variants.length === 0 ? (
            <Card className="p-6">
              <p className="text-center text-muted-foreground">
                Generate variants first to manage inventory
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
                      {formData.variants.reduce((sum, v) => sum + v.stock, 0)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Value
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formData.variants
                        .reduce((sum, v) => sum + v.price * v.stock, 0)
                        .toLocaleString()}{" "}
                      VNĐ
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
                        acc[v.size] = (acc[v.size] || 0) + v.stock
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
                        acc[colorKey] = (acc[colorKey] || 0) + v.stock
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
                        const colorHex = isNone ? "#999999" : (COLOR_CODES[color as keyof typeof COLOR_CODES]?.hex || "#999999")
                        const colorName = isNone ? "None (Size Only)" : (COLOR_CODES[color as keyof typeof COLOR_CODES]?.name || color)

                        return (
                          <div key={color} className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-4 h-4 rounded-full border"
                                style={{ backgroundColor: colorHex }}
                              />
                              <span className="text-sm font-medium">{colorName}</span>
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
                  (v) => v.stock === 0 || v.stock < 10
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
                              className={`text-sm font-medium ${
                                v.stock === 0
                                  ? "text-red-600"
                                  : "text-amber-600"
                              }`}
                            >
                              {v.stock === 0 ? "Out of Stock" : `Low Stock (${v.stock} units)`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : null
              })()}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    const csvContent = [
                      ["SKU", "Size", "Color", "Price", "Stock", "Low Threshold"].join(","),
                      ...formData.variants.map((v) =>
                        [v.sku, v.size, v.color, v.price, v.stock, v.lowStockThreshold].join(",")
                      ),
                    ].join("\n")

                    const blob = new Blob([csvContent], { type: "text/csv" })
                    const url = window.URL.createObjectURL(blob)
                    const a = document.createElement("a")
                    a.href = url
                    a.download = `${formData.name}_inventory_${new Date().toISOString().split("T")[0]}.csv`
                    document.body.appendChild(a)
                    a.click()
                    window.URL.revokeObjectURL(url)
                    document.body.removeChild(a)
                  }}
                >
                  📊 Export Stock Report
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    const quantity = prompt("Add how many units to all variants?", "10")
                    if (quantity && !isNaN(Number(quantity))) {
                      setFormData((prev) => ({
                        ...prev,
                        variants: prev.variants.map((v) => ({
                          ...v,
                          stock: v.stock + parseInt(quantity),
                        })),
                      }))
                    }
                  }}
                >
                  📦 Bulk Restock
                </Button>
              </div>
            </>
          )}
        </TabsContent>

        {/* Tab 5: SEO & Relationships */}
        <TabsContent value="seo" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Search Engine Optimization</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="seoTitle">SEO Title (60 chars max)</Label>
                <Input
                  id="seoTitle"
                  placeholder="Áo Sơ Mi Oxford Nam Devenir - Chất Liệu Cao Cấp"
                  maxLength={60}
                  value={formData.seoTitle}
                  onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">{formData.seoTitle.length}/60</p>
              </div>

              <div>
                <Label htmlFor="seoDescription">Meta Description (160 chars max)</Label>
                <textarea
                  id="seoDescription"
                  placeholder="Product description for search engines"
                  maxLength={160}
                  className="w-full min-h-20 p-2 border rounded-md"
                  value={formData.seoDescription}
                  onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">{formData.seoDescription.length}/160</p>
              </div>

              <div>
                <Label htmlFor="urlSlug">URL Slug</Label>
                <Input
                  id="urlSlug"
                  placeholder="ao-so-mi-oxford-nam-devenir"
                  value={formData.urlSlug}
                  onChange={(e) => setFormData({ ...formData, urlSlug: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Preview: devenir.com/products/{formData.urlSlug}
                </p>
              </div>

              <div>
                <Label htmlFor="focusKeyword">Focus Keyword</Label>
                <Input
                  id="focusKeyword"
                  placeholder="áo sơ mi nam công sở"
                  value={formData.focusKeyword}
                  onChange={(e) => setFormData({ ...formData, focusKeyword: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Variant Edit Dialog */}
      <VariantEditDialog
        variant={editingVariant}
        isOpen={isVariantEditOpen}
        onClose={() => {
          setIsVariantEditOpen(false)
          setEditingVariant(null)
        }}
        onSave={(updatedVariant) => {
          setFormData((prev) => ({
            ...prev,
            variants: prev.variants.map((v) =>
              v.sku === updatedVariant.sku ? updatedVariant : v
            ),
          }))
        }}
      />
    </div>
  )
}
