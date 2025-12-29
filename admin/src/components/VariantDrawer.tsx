import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { IconTrash, IconUpload, IconX } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import axiosInstance from '@/services/axiosConfig'
import { uploadImage } from '@/services/uploadService'
import { useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/lib/queryClient'
import { toast } from 'sonner'

interface VariantDrawerProps {
  isOpen: boolean
  variantId?: string
  variantData?: any // Pass variant data directly to avoid fetch
  isEdit?: boolean
  onClose: () => void
  onSuccess: () => void
}

interface Product {
  _id: string
  name: string
}

interface Color {
  _id: string
  name: string
  hex: string
}

interface VariantImage {
  url: string
  id: string
}

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL', 'Free Size']

export default function VariantDrawer({ isOpen, variantId, variantData, isEdit = false, onClose, onSuccess }: VariantDrawerProps) {
  const queryClient = useQueryClient()
  const [products, setProducts] = useState<Product[]>([])
  const [colors, setColors] = useState<Color[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [colorSearchTerm, setColorSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [variantImages, setVariantImages] = useState<VariantImage[]>([])
  const [selectedMainImage, setSelectedMainImage] = useState<string>('')
  const [selectedHoverImage, setSelectedHoverImage] = useState<string>('')

  const [formData, setFormData] = useState({
    product: '',
    sku: '',
    size: '',
    color: '',
    price: 0,
    stock: 0,
    lowStockThreshold: 10,
  })

  useEffect(() => {
    if (isOpen) {
      fetchProducts()
      fetchColors()
      document.documentElement.style.overflow = 'hidden'
      
      if (isEdit && variantData) {
        // Use pre-loaded variant data (FAST!)
        loadVariantData(variantData)
      } else if (isEdit && variantId) {
        // Fallback: fetch if data not provided
        fetchVariant()
      } else {
        resetForm()
      }
    } else {
      document.documentElement.style.overflow = 'unset'
    }

    return () => {
      document.documentElement.style.overflow = 'unset'
    }
  }, [isOpen, variantId, variantData, isEdit])

  const resetForm = () => {
    setFormData({
      product: '',
      sku: '',
      size: '',
      color: '',
      price: 0,
      stock: 0,
      lowStockThreshold: 10,
    })
    setVariantImages([])
    setSelectedMainImage('')
    setSelectedHoverImage('')
    setSearchTerm('')
    setColorSearchTerm('')
  }

  const fetchProducts = async () => {
    // Check cache first
    const cached = sessionStorage.getItem('products_cache')
    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached)
        // Cache valid for 5 minutes
        if (Date.now() - timestamp < 5 * 60 * 1000) {
          setProducts(data)
          return
        }
      } catch (e) {}
    }

    try {
      const response = await axiosInstance.get('/products?limit=500')
      const data = response.data.data || []
      setProducts(data)
      sessionStorage.setItem('products_cache', JSON.stringify({ data, timestamp: Date.now() }))
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const fetchColors = async () => {
    // Check cache first
    const cached = sessionStorage.getItem('colors_cache')
    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached)
        if (Date.now() - timestamp < 5 * 60 * 1000) {
          setColors(data)
          return
        }
      } catch (e) {}
    }

    try {
      const response = await axiosInstance.get('/colors')
      const data = response.data.data || []
      setColors(data)
      sessionStorage.setItem('colors_cache', JSON.stringify({ data, timestamp: Date.now() }))
    } catch (error) {
      console.error('Error fetching colors:', error)
    }
  }

  const fetchVariant = async () => {
    try {
      const response = await axiosInstance.get('/products/admin/variants?limit=500')
      const allVariants = response.data.data || []
      const variant = allVariants.find((v: any) => v._id === variantId)

      if (variant) {
        loadVariantData(variant)
      }
    } catch (error) {
      console.error('Error fetching variant:', error)
    }
  }

  // Helper function to load variant data into form
  const loadVariantData = (variant: any) => {
    setFormData({
      product: variant.product_id || variant.product || '',
      sku: variant.sku || '',
      size: variant.size || '',
      color: variant.color || '',
      price: variant.price || 0,
      stock: variant.stock || variant.quantity || 0,
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
      variant.images.forEach((img: string, idx: number) => {
        if (img !== variant.mainImage && img !== variant.hoverImage) {
          images.push({ url: img, id: `img-${idx}` })
        }
      })
    }
    setVariantImages(images)
  }

  const handleMultipleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploadingImage(true)
    try {
      const fileArray = Array.from(files)
      const uploadPromises = fileArray.map((file) => uploadImage(file))

      const responses = await Promise.all(uploadPromises)
      const uploadedUrls = responses
        .filter((res) => res.success && res.data?.url)
        .map((res, idx) => ({
          url: res.data.url,
          id: `img-${Date.now()}-${idx}`,
        }))

      if (uploadedUrls.length > 0) {
        setVariantImages((prev) => [...prev, ...uploadedUrls])
      } else {
        toast.error('Upload failed')
      }
    } catch (error: any) {
      toast.error(error?.message || 'Upload error')
    } finally {
      setUploadingImage(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveImage = (imageId: string) => {
    const imageToRemove = variantImages.find((img) => img.id === imageId)
    if (!imageToRemove) return

    setVariantImages((prev) => prev.filter((img) => img.id !== imageId))

    if (imageToRemove.url === selectedMainImage) {
      setSelectedMainImage('')
    }
    if (imageToRemove.url === selectedHoverImage) {
      setSelectedHoverImage('')
    }
  }

  const filteredProducts = searchTerm
    ? products.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : products

  const filteredColors = colorSearchTerm
    ? colors.filter((color) => {
        const term = colorSearchTerm.toLowerCase()
        return (
          color.name.toLowerCase().includes(term) ||
          (color.hex ? color.hex.toLowerCase().includes(term) : false)
        )
      })
    : colors

  // Auto-generate SKU based on product, color, and size
  const generateSKU = (productId: string, color: string, size: string) => {
    const product = products.find((p) => p._id === productId)
    if (!product) return ''
    
    const productCode = product.name.substring(0, 3).toUpperCase()
    const cleanColor = color.replace(/\s+/g, '-').toUpperCase()
    const sizeCode = size.replace(/\s+/g, '-').toUpperCase()
    return `${productCode}-${sizeCode}-${cleanColor}`
  }

  // Auto-update SKU when product, color, or size changes (add mode only)
  useEffect(() => {
    if (!isEdit && formData.product && formData.color && formData.size) {
      const newSKU = generateSKU(formData.product, formData.color, formData.size)
      if (newSKU) {
        setFormData((prev) => ({ ...prev, sku: newSKU }))
      }
    }
  }, [formData.product, formData.color, formData.size, isEdit, products])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.product || !formData.sku || !formData.size || !formData.color) {
      toast.error('Please fill all required fields')
      return
    }

    if (!isEdit && (variantImages.length === 0 || !selectedMainImage || !selectedHoverImage)) {
      toast.error('Please upload and select main and hover images')
      return
    }

    if (isEdit && (!selectedMainImage || !selectedHoverImage)) {
      toast.error('Please select main and hover images')
      return
    }

    setLoading(true)

    try {
      const allImages = variantImages.map((img) => img.url)

      const payload = {
        sku: formData.sku,
        size: formData.size,
        color: formData.color, // Send color name as string, not colorId
        price: formData.price,
        stock: formData.stock,
        mainImage: selectedMainImage,
        hoverImage: selectedHoverImage,
        images: allImages,
        lowStockThreshold: formData.lowStockThreshold,
        syncColorGroup: true, // ✨ NEW: Enable auto-sync for same-color variants
      }

      if (isEdit) {
        const response = await axiosInstance.put(`/products/admin/variants/${formData.sku}`, payload)
        
        // Display success message with sync count if available
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

      // Realtime refetch similar to category logic
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

      const productKey = formData.product || variantData?.product || variantData?.product_id
      if (productKey) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.variants.byProduct(productKey),
          refetchType: 'active'
        })
      }

      onSuccess()
      resetForm()
      onClose()
    } catch (error: any) {
      console.error('Error saving variant:', error)
      const errorMsg = error?.response?.data?.message || error?.message || 'Failed to save variant'
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return createPortal(
    <>
      {/* Overlay - Smooth fade in/out */}
      <div
        className="fixed inset-0 z-40 bg-black/50 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Drawer - Smooth slide in from right */}
      <div
        className={`fixed right-0 top-0 bottom-0 z-50 w-96 bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out overflow-hidden ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header - Sticky */}
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between shrink-0 z-10">
          <h2 className="text-lg font-bold">
            {isEdit ? 'Edit Variant' : 'Add Variant'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
          >
            <IconX className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-5">
          {/* Product Selection - Only show on Add mode */}
          {!isEdit && (
            <div className="space-y-2">
              <Label htmlFor="product" className="font-medium">
                Product *
              </Label>
              <div className="space-y-2">
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="text-sm"
                />
                <Select
                  value={formData.product}
                  onValueChange={(value) => setFormData({ ...formData, product: value })}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredProducts.map((product) => (
                      <SelectItem key={product._id} value={product._id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Upload Images Section - Only on Add mode or Edit mode with images */}
          {!isEdit || variantImages.length > 0 || selectedMainImage || selectedHoverImage ? (
            <div className="space-y-3 border-b pb-4">
              <Label className="font-medium">Images</Label>

              {/* Upload Area */}
              <label
                className="flex flex-col items-center justify-center gap-2 px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
              >
                <IconUpload className="w-5 h-5 text-gray-400" />
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700">
                    {uploadingImage ? 'Uploading...' : 'Click to upload images'}
                  </p>
                  <p className="text-xs text-gray-500">or drag and drop</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleMultipleImageUpload}
                  disabled={uploadingImage}
                />
              </label>

              {/* Uploaded Images Grid */}
              {variantImages.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-600">
                    Images ({variantImages.length})
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {variantImages.map((img) => (
                      <div key={img.id} className="relative group">
                        <img
                          src={img.url}
                          alt="Variant"
                          className="w-full aspect-square object-cover rounded border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(img.id)}
                          className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <IconTrash className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Main Image Selection */}
              {variantImages.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Main Image *</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {variantImages.map((img) => (
                      <div
                        key={`main-${img.id}`}
                        onClick={() => setSelectedMainImage(img.url)}
                        className={`cursor-pointer relative rounded-lg overflow-hidden border-2 transition-all ${
                          selectedMainImage === img.url
                            ? 'border-blue-500'
                            : 'border-gray-200'
                        }`}
                      >
                        <img
                          src={img.url}
                          alt="Main"
                          className="w-full aspect-square object-cover"
                        />
                        {selectedMainImage === img.url && (
                          <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                            <span className="text-white text-sm font-bold">✓</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Hover Image Selection */}
              {variantImages.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Hover Image *</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {variantImages.map((img) => (
                      <div
                        key={`hover-${img.id}`}
                        onClick={() => setSelectedHoverImage(img.url)}
                        className={`cursor-pointer relative rounded-lg overflow-hidden border-2 transition-all ${
                          selectedHoverImage === img.url
                            ? 'border-green-500'
                            : 'border-gray-200'
                        }`}
                      >
                        <img
                          src={img.url}
                          alt="Hover"
                          className="w-full aspect-square object-cover"
                        />
                        {selectedHoverImage === img.url && (
                          <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                            <span className="text-white text-sm font-bold">✓</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {/* SKU */}
          <div className="space-y-2">
            <Label htmlFor="sku" className="font-medium">
              SKU {!isEdit && <span className="text-xs text-gray-500">(Auto-generated)</span>}
            </Label>
            <Input
              id="sku"
              value={formData.sku}
              onChange={(e) => {
                if (isEdit) {
                  setFormData({ ...formData, sku: e.target.value })
                }
              }}
              disabled={!isEdit}
              placeholder="e.g., DEV-M-RED"
              required
              className="text-sm"
            />
          </div>

          {/* Size */}
          <div className="space-y-2">
            <Label htmlFor="size" className="font-medium">
              Size *
            </Label>
            <Select value={formData.size} onValueChange={(value) => setFormData({ ...formData, size: value })}>
              <SelectTrigger className="text-sm">
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

          {/* Color */}
          <div className="space-y-2">
            <Label htmlFor="color" className="font-medium">
              Color *
            </Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Select value={formData.color} onValueChange={(value) => setFormData({ ...formData, color: value })}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Select color" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredColors.length === 0 ? (
                      <SelectItem value="no-color" disabled>
                        No colors match search
                      </SelectItem>
                    ) : (
                      filteredColors.map((color) => (
                        <SelectItem key={color._id} value={color.name}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-sm border border-gray-300"
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
                className="w-36 text-sm"
              />
            </div>
          </div>

          {/* Price */}
          <div className="space-y-2">
            <Label htmlFor="price" className="font-medium">
              Price (VNĐ) *
            </Label>
            <Input
              id="price"
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
              placeholder="0"
              required
              className="text-sm"
            />
          </div>

          {/* Stock */}
          <div className="space-y-2">
            <Label htmlFor="stock" className="font-medium">
              Stock Quantity *
            </Label>
            <Input
              id="stock"
              type="number"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
              placeholder="0"
              required
              className="text-sm"
            />
          </div>

          {/* Low Stock Threshold */}
          <div className="space-y-2">
            <Label htmlFor="lowStockThreshold" className="font-medium">
              Low Stock Threshold
            </Label>
            <Input
              id="lowStockThreshold"
              type="number"
              value={formData.lowStockThreshold}
              onChange={(e) => setFormData({ ...formData, lowStockThreshold: parseInt(e.target.value) || 10 })}
              placeholder="10"
              className="text-sm"
            />
          </div>
        </form>

        {/* Action Buttons - Sticky Footer */}
        <div className="sticky bottom-0 bg-white border-t p-4 space-y-2 shrink-0">
          <Button type="submit" onClick={handleSubmit} className="w-full text-sm" disabled={loading}>
            {loading ? 'Saving...' : isEdit ? 'Update Variant' : 'Create Variant'}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full text-sm"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      </div>
    </>,
    document.body
  )
}
