/**
 * VariantFormSection
 * Form for adding/editing variants
 */

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { IconPlus } from "@tabler/icons-react"
import type { VariantData, VariantImage } from "./types"
import type { Color } from "@/services/colorService"
import { SIZES } from "./types"

interface VariantFormSectionProps {
  newVariant: VariantData
  setNewVariant: React.Dispatch<React.SetStateAction<VariantData>>
  selectedSizes: string[]
  setSelectedSizes: React.Dispatch<React.SetStateAction<string[]>>
  colors: Color[]
  filteredColorOptions: Color[]
  colorSearchTerm: string
  setColorSearchTerm: (value: string) => void
  loadingColors: boolean
  variantImages: VariantImage[]
  selectedMainImage: string
  setSelectedMainImage: (value: string) => void
  selectedHoverImage: string
  setSelectedHoverImage: (value: string) => void
  editingVariantIndex: number | null
  onAddOrUpdate: () => void
  onCancel: () => void
}

export function VariantFormSection({
  newVariant,
  setNewVariant,
  selectedSizes,
  setSelectedSizes,
  colors,
  filteredColorOptions,
  colorSearchTerm,
  setColorSearchTerm,
  loadingColors,
  variantImages,
  selectedMainImage,
  setSelectedMainImage,
  selectedHoverImage,
  setSelectedHoverImage,
  editingVariantIndex,
  onAddOrUpdate,
  onCancel,
}: VariantFormSectionProps) {
  return (
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
                      if (checked) {
                        setSelectedSizes(["Free Size"])
                      } else {
                        setSelectedSizes([])
                      }
                    } else {
                      if (checked) {
                        setSelectedSizes((prev) =>
                          prev.filter((s) => s !== "Free Size")
                        )
                        setSelectedSizes((prev) => [...prev, size])
                      } else {
                        setSelectedSizes((prev) => prev.filter((s) => s !== size))
                      }
                    }
                  }}
                />
                <Label
                  htmlFor={`size-${size}`}
                  className={`font-normal cursor-pointer ${
                    size === "Free Size" ? "font-semibold text-blue-600" : ""
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
        <Button onClick={onAddOrUpdate}>
          <IconPlus className="w-4 h-4 mr-2" />
          {editingVariantIndex !== null ? "Update Variant" : "Add Variant"}
        </Button>
        {editingVariantIndex !== null && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  )
}

export default VariantFormSection
