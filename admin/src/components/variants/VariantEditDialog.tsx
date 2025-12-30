import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerDescription,
} from "@/components/ui/drawer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { COLOR_CODES } from "@/utils/skuGenerator"
import { api } from "@/services/api"
import type { Variant } from "./VariantsMatrix"

interface VariantEditDialogProps {
  variant: Variant | null
  isOpen: boolean
  onClose: () => void
  onSave: (updatedVariant: Variant) => void
  customColors?: Record<string, { name: string; hex: string }>
}

export function VariantEditDialog({ variant, isOpen, onClose, onSave, customColors = {} }: VariantEditDialogProps) {
  const [editedVariant, setEditedVariant] = useState<Variant | null>(variant)
  const [uploadingImages, setUploadingImages] = useState(false)

  // Update editedVariant when variant prop changes
  useEffect(() => {
    if (variant && isOpen) {
      setEditedVariant({ ...variant })
    }
  }, [variant, isOpen])

  const handleSave = () => {
    if (editedVariant) {
      onSave(editedVariant)
      onClose()
    }
  }

  const handleChange = (field: keyof Variant, value: any) => {
    if (editedVariant) {
      setEditedVariant({
        ...editedVariant,
        [field]: value,
      })
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    try {
      setUploadingImages(true)
      const formData = new FormData()

      for (const file of Array.from(files)) {
        formData.append("images", file)
      }

      const response = await api.post("/upload/images", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })

      if (response.data.success) {
        const newImages = response.data.data.map((img: any) => img.url)
        handleChange("images", [...(editedVariant?.images || []), ...newImages])
        toast.success(`${newImages.length} image(s) uploaded successfully`)
      }
    } catch (error: any) {
      console.error("Upload error:", error)
      toast.error("Error uploading images")
    } finally {
      setUploadingImages(false)
      // Reset input
      e.target.value = ""
    }
  }



  const colorInfo = editedVariant
    ? (COLOR_CODES[editedVariant.color as keyof typeof COLOR_CODES] ||
      customColors[editedVariant.color || ""] ||
      Object.values(COLOR_CODES).find(c => c.hex.toLowerCase() === editedVariant.color?.toLowerCase()) ||
      (editedVariant.color?.startsWith('#') ? { name: editedVariant.color, hex: editedVariant.color } : null))
    : null

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="w-full md:w-1/2 ml-auto">
        <DrawerHeader>
          <DrawerTitle>Edit Variant: {editedVariant?.sku}</DrawerTitle>
          <DrawerDescription>
            Update pricing, inventory, and shipping information for this variant
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 py-6 max-h-[70vh] overflow-y-auto space-y-6">
          {editedVariant && (
            <>
              {/* SKU - Read Only */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">SKU (Read-only)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="font-mono font-semibold text-lg">{editedVariant.sku}</div>
                </CardContent>
              </Card>

              {/* Attributes - Read Only */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Attributes</CardTitle>
                  <CardDescription>Size and color cannot be changed</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm">Size</Label>
                      <div className="mt-2 p-2 bg-muted rounded font-semibold">{editedVariant.size}</div>
                    </div>
                    <div>
                      <Label className="text-sm">Color</Label>
                      <div className="mt-2 p-2 bg-muted rounded flex items-center gap-2">
                        {colorInfo && (
                          <div
                            className="w-6 h-6 rounded border-2 border-gray-300"
                            style={{ backgroundColor: colorInfo.hex }}
                          />
                        )}
                        <span className="font-semibold">{colorInfo?.name || editedVariant.color}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pricing */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Pricing</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="price" className="text-sm">
                      Price ($) *
                    </Label>
                    <Input
                      id="price"
                      type="number"
                      value={editedVariant.price}
                      onChange={(e) => handleChange("price", Number(e.target.value))}
                      placeholder="50.00"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="comparePrice" className="text-sm">
                      Compare at Price ($)
                    </Label>
                    <Input
                      id="comparePrice"
                      type="number"
                      value={editedVariant.comparePrice || ""}
                      onChange={(e) => handleChange("comparePrice", e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="60.00 (Optional)"
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">For showing discount</p>
                  </div>
                </CardContent>
              </Card>

              {/* Inventory */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Inventory</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="stock" className="text-sm">
                      Stock Quantity *
                    </Label>
                    <Input
                      id="stock"
                      type="number"
                      value={editedVariant.stock}
                      onChange={(e) => handleChange("stock", Number(e.target.value))}
                      placeholder="75"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lowStockThreshold" className="text-sm">
                      Low Stock Threshold
                    </Label>
                    <Input
                      id="lowStockThreshold"
                      type="number"
                      value={editedVariant.lowStockThreshold}
                      onChange={(e) => handleChange("lowStockThreshold", Number(e.target.value))}
                      placeholder="10"
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Alert when stock is below this value</p>
                  </div>
                </CardContent>
              </Card>



              {/* Variant Images */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Variant Images</CardTitle>
                  <CardDescription>Upload images specific to this color variant</CardDescription>
                </CardHeader>
                <CardContent>
                  <input
                    id="variant-image-input"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImages}
                    style={{ display: "none" }}
                  />
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {editedVariant.images && editedVariant.images.map((image, idx) => (
                      <div key={idx} className="relative group border rounded-lg overflow-hidden">
                        <div className="aspect-square">
                          <img
                            src={image}
                            alt={`Variant image ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Overlay Actions */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-2 p-2">
                          <Button
                            size="sm"
                            variant={editedVariant.thumbnail === image ? "default" : "secondary"}
                            className="w-full h-7 text-xs"
                            onClick={() => handleChange("thumbnail", image)}
                          >
                            {editedVariant.thumbnail === image ? "✓ Thumb" : "Set Thumb"}
                          </Button>
                          <Button
                            size="sm"
                            variant={editedVariant.hoverThumbnail === image ? "default" : "secondary"}
                            className="w-full h-7 text-xs"
                            onClick={() => handleChange("hoverThumbnail", image)}
                          >
                            {editedVariant.hoverThumbnail === image ? "✓ Hover" : "Set Hover"}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="w-full h-7 text-xs"
                            onClick={() => {
                              const newImages = editedVariant.images.filter((_, i) => i !== idx)
                              handleChange("images", newImages)
                              // Also clear thumb/hover if deleted
                              if (editedVariant.thumbnail === image) handleChange("thumbnail", "")
                              if (editedVariant.hoverThumbnail === image) handleChange("hoverThumbnail", "")
                            }}
                          >
                            Delete
                          </Button>
                        </div>

                        {/* Badges */}
                        <div className="absolute top-1 left-1 flex flex-col gap-1">
                          {editedVariant.thumbnail === image && (
                            <span className="text-[10px] font-bold text-white bg-green-600 px-1.5 py-0.5 rounded shadow-sm">
                              Thumb
                            </span>
                          )}
                          {editedVariant.hoverThumbnail === image && (
                            <span className="text-[10px] font-bold text-white bg-purple-600 px-1.5 py-0.5 rounded shadow-sm">
                              Hover
                            </span>
                          )}
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => document.getElementById("variant-image-input")?.click()}
                      disabled={uploadingImages}
                      className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-muted transition disabled:opacity-50 disabled:cursor-not-allowed gap-2"
                    >
                      {uploadingImages ? (
                        <>
                          <div className="animate-spin text-2xl">⏳</div>
                          <span className="text-xs text-muted-foreground">Uploading...</span>
                        </>
                      ) : (
                        <>
                          <span className="text-3xl text-muted-foreground">+</span>
                          <span className="text-xs text-muted-foreground font-medium">Add Image</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Upload images for this color. Hover over an image to set as Thumbnail or Hover image.
                  </p>
                </CardContent>
              </Card>

              {/* Weight & Dimensions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Shipping Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="weight" className="text-sm">
                      Weight (g)
                    </Label>
                    <Input
                      id="weight"
                      type="number"
                      value={editedVariant.weight || ""}
                      onChange={(e) => handleChange("weight", e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="200"
                      className="mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label htmlFor="length" className="text-sm">
                        Length (cm)
                      </Label>
                      <Input
                        id="length"
                        type="number"
                        value={editedVariant.dimensions?.length || ""}
                        onChange={(e) =>
                          handleChange("dimensions", {
                            ...(editedVariant.dimensions || { width: 0, height: 0 }),
                            length: Number(e.target.value),
                          })
                        }
                        placeholder="30"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="width" className="text-sm">
                        Width (cm)
                      </Label>
                      <Input
                        id="width"
                        type="number"
                        value={editedVariant.dimensions?.width || ""}
                        onChange={(e) =>
                          handleChange("dimensions", {
                            ...(editedVariant.dimensions || { length: 0, height: 0 }),
                            width: Number(e.target.value),
                          })
                        }
                        placeholder="25"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="height" className="text-sm">
                        Height (cm)
                      </Label>
                      <Input
                        id="height"
                        type="number"
                        value={editedVariant.dimensions?.height || ""}
                        onChange={(e) =>
                          handleChange("dimensions", {
                            ...(editedVariant.dimensions || { length: 0, width: 0 }),
                            height: Number(e.target.value),
                          })
                        }
                        placeholder="5"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Barcode */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Barcode</CardTitle>
                </CardHeader>
                <CardContent>
                  <Input
                    type="text"
                    value={editedVariant.barcode || ""}
                    onChange={(e) => handleChange("barcode", e.target.value)}
                    placeholder="1234567890123 (Optional)"
                  />
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <DrawerFooter>
          <Button onClick={handleSave} className="w-full">
            Save Variant
          </Button>
          <DrawerClose asChild>
            <Button variant="outline" className="w-full">
              Cancel
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
