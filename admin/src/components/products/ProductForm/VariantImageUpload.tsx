/**
 * VariantImageUpload
 * Component for uploading and managing variant images
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { IconUpload, IconTrash } from "@tabler/icons-react"
import type { VariantImage } from "./types"

interface VariantImageUploadProps {
  images: VariantImage[]
  selectedMainImage: string
  selectedHoverImage: string
  uploadingImage: boolean
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemove: (index: number) => void
}

export function VariantImageUpload({
  images,
  uploadingImage,
  onUpload,
  onRemove,
}: VariantImageUploadProps) {
  return (
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
              onChange={onUpload}
              disabled={uploadingImage}
            />
          </label>
        </div>

        {/* Uploaded Images Grid */}
        {images.length > 0 && (
          <div className="space-y-2">
            <p className="font-medium">Uploaded Images ({images.length})</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {images.map((img, idx) => (
                <div key={idx} className="relative group">
                  <img
                    src={img.url}
                    alt={`Variant ${idx + 1}`}
                    className="w-full aspect-square object-cover rounded border"
                  />
                  <button
                    type="button"
                    onClick={() => onRemove(idx)}
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
  )
}

export default VariantImageUpload
