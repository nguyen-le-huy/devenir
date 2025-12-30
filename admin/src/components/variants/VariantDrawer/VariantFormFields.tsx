/**
 * Variant Form Fields Component
 * Form inputs for variant data
 */
import React, { useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Product, Color, VariantFormState } from './types'
import { SIZES } from './types'

interface VariantFormFieldsProps {
  isEdit: boolean
  formData: VariantFormState
  products: Product[]
  colors: Color[]
  searchTerm: string
  colorSearchTerm: string
  onFormDataChange: (data: VariantFormState) => void
  onSearchTermChange: (value: string) => void
  onColorSearchTermChange: (value: string) => void
}

export function VariantFormFields({
  isEdit,
  formData,
  products,
  colors,
  searchTerm,
  colorSearchTerm,
  onFormDataChange,
  onSearchTermChange,
  onColorSearchTermChange,
}: VariantFormFieldsProps) {
  // Filter products based on search
  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products
    return products.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
  }, [products, searchTerm])

  // Filter colors based on search
  const filteredColors = useMemo(() => {
    if (!colorSearchTerm) return colors
    const term = colorSearchTerm.toLowerCase()
    return colors.filter(
      (color) =>
        color.name.toLowerCase().includes(term) ||
        (color.hex ? color.hex.toLowerCase().includes(term) : false)
    )
  }, [colors, colorSearchTerm])

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
  React.useEffect(() => {
    if (!isEdit && formData.product && formData.color && formData.size) {
      const newSKU = generateSKU(formData.product, formData.color, formData.size)
      if (newSKU && newSKU !== formData.sku) {
        onFormDataChange({ ...formData, sku: newSKU })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.product, formData.color, formData.size, isEdit])

  return (
    <>
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
              onChange={(e) => onSearchTermChange(e.target.value)}
              className="text-sm"
            />
            <Select
              value={formData.product}
              onValueChange={(value) => onFormDataChange({ ...formData, product: value })}
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
              onFormDataChange({ ...formData, sku: e.target.value })
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
        <Select
          value={formData.size}
          onValueChange={(value) => onFormDataChange({ ...formData, size: value })}
        >
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
            <Select
              value={formData.color}
              onValueChange={(value) => onFormDataChange({ ...formData, color: value })}
            >
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
            onChange={(e) => onColorSearchTermChange(e.target.value)}
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
          onChange={(e) => onFormDataChange({ ...formData, price: parseFloat(e.target.value) || 0 })}
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
          onChange={(e) => onFormDataChange({ ...formData, stock: parseInt(e.target.value) || 0 })}
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
          onChange={(e) =>
            onFormDataChange({ ...formData, lowStockThreshold: parseInt(e.target.value) || 10 })
          }
          placeholder="10"
          className="text-sm"
        />
      </div>
    </>
  )
}
