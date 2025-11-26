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
import { IconPlus, IconTrash, IconEdit, IconUpload } from "@tabler/icons-react"
import { categoryService, type Category } from "@/services/categoryService"
import { colorService, type Color } from "@/services/colorService"
import { uploadImage } from "@/services/uploadService"

interface ProductFormProps {
  onSave?: (data: ProductFormData) => void
  onDraft?: (data: ProductFormData) => void
  initialData?: Partial<ProductFormData>
}

export interface ProductFormData {
  // Basic Info
  name: string
  description: string
  category: string
  brand: string
  tags: string[]
  status: "draft" | "published" | "archived"

  // Variants - Mỗi variant có đầy đủ info (color, size, price, quantity, ảnh)
  variants: Array<{
    id?: string
    sku: string
    color: string
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
const BRANDS = ["DEV", "GUCCI", "PRADA", "LOUIS VUITTON"]

export function ProductFormSimplified({ onSave, onDraft, initialData }: ProductFormProps) {
  const defaultFormData: ProductFormData = {
    name: "",
    description: "",
    category: "",
    brand: "DEV",
    tags: [],
    status: "draft",
    variants: [],
    seoTitle: "",
    seoDescription: "",
    urlSlug: "",
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

  const [categories, setCategories] = useState<Category[]>([])
  const [colors, setColors] = useState<Color[]>([])
  const [loadingColors, setLoadingColors] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [variantImages, setVariantImages] = useState<Array<{ url: string; id: string }>>([])
  const [selectedMainImage, setSelectedMainImage] = useState<string>("")
  const [selectedHoverImage, setSelectedHoverImage] = useState<string>("")
  const [editingVariantIndex, setEditingVariantIndex] = useState<number | null>(null)
  const [newVariant, setNewVariant] = useState<ProductFormData["variants"][0]>({
    sku: "",
    color: "",
    size: "",
    price: 0,
    quantity: 0,
    mainImage: "",
    hoverImage: "",
    images: [],
  })

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
        alert("Upload failed")
      }
    } catch (error: any) {
      alert(`Upload error: ${error.message}`)
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

  // Handle add/edit variant
  const handleAddOrUpdateVariant = () => {
    if (!newVariant.color || !newVariant.size || !newVariant.price || newVariant.quantity === undefined) {
      alert("Please fill all required fields")
      return
    }

    if (!selectedMainImage || !selectedHoverImage) {
      alert("Please select both main and hover images")
      return
    }

    const updatedVariant = {
      ...newVariant,
      sku: generateSKU(newVariant.color, newVariant.size),
      mainImage: selectedMainImage,
      hoverImage: selectedHoverImage,
      images: variantImages.map((img) => img.url),
    }

    if (editingVariantIndex !== null) {
      // Update existing
      const updatedVariants = [...formData.variants]
      updatedVariants[editingVariantIndex] = updatedVariant
      setFormData((prev) => ({ ...prev, variants: updatedVariants }))
      setEditingVariantIndex(null)
    } else {
      // Add new
      setFormData((prev) => ({
        ...prev,
        variants: [...prev.variants, updatedVariant],
      }))
    }

    // Reset form
    setNewVariant({
      sku: "",
      color: "",
      size: "",
      price: 0,
      quantity: 0,
      mainImage: "",
      hoverImage: "",
      images: [],
    })
    setVariantImages([])
    setSelectedMainImage("")
    setSelectedHoverImage("")
  }

  // Handle edit variant
  const handleEditVariant = (index: number) => {
    const variant = formData.variants[index]
    setNewVariant(variant)
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
          <Button onClick={() => onSave?.(formData)}>Publish Product</Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="variants">Variants</TabsTrigger>
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
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, category: value }))
                  }
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat._id} value={cat._id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Brand */}
              <div className="space-y-2">
                <Label htmlFor="brand">Brand</Label>
                <Select
                  value={formData.brand}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, brand: value }))
                  }
                >
                  <SelectTrigger id="brand">
                    <SelectValue placeholder="Select a brand" />
                  </SelectTrigger>
                  <SelectContent>
                    {BRANDS.map((brand) => (
                      <SelectItem key={brand} value={brand}>
                        {brand}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      status: value as "draft" | "published" | "archived",
                    }))
                  }
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
                    <Select
                      value={newVariant.color}
                      onValueChange={(value) =>
                        setNewVariant((prev) => ({ ...prev, color: value }))
                      }
                    >
                      <SelectTrigger id="color">
                        <SelectValue placeholder="Select color" />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingColors ? (
                          <SelectItem value="loading" disabled>
                            Loading colors...
                          </SelectItem>
                        ) : colors.length === 0 ? (
                          <SelectItem value="empty" disabled>
                            No colors available
                          </SelectItem>
                        ) : (
                          colors.map((color) => (
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

                  {/* Size */}
                  <div className="space-y-2">
                    <Label htmlFor="size">Size *</Label>
                    <Select
                      value={newVariant.size}
                      onValueChange={(value) =>
                        setNewVariant((prev) => ({ ...prev, size: value }))
                      }
                    >
                      <SelectTrigger id="size">
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        {SIZES.map((size) => (
                          <SelectItem key={size} value={size}>
                            {size}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Price */}
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (USD) *</Label>
                    <Input
                      id="price"
                      type="number"
                      placeholder="0"
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
                    <Label htmlFor="quantity">Quantity *</Label>
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
                          size: "",
                          price: 0,
                          quantity: 0,
                          mainImage: "",
                          hoverImage: "",
                          images: [],
                        })
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>

              {/* Variants List */}
              <div className="space-y-2">
                <h3 className="font-semibold">Variants List ({formData.variants.length})</h3>
                {formData.variants.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No variants added yet</p>
                ) : (
                  <div className="space-y-2">
                    {formData.variants.map((variant, index) => (
                      <div
                        key={index}
                        className="p-3 border rounded-lg flex items-center justify-between"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{variant.sku}</p>
                          <p className="text-sm text-muted-foreground">
                            {variant.color} / {variant.size} - ${variant.price.toFixed(2)} - Qty: {variant.quantity}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditVariant(index)}
                          >
                            <IconEdit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteVariant(index)}
                          >
                            <IconTrash className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: SEO */}
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
    </div>
  )
}

export default ProductFormSimplified
