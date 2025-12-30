/**
 * ProductSEOTab
 * Tab 4: SEO settings (title, description, slug)
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { ProductFormData } from "./types"

interface ProductSEOTabProps {
  formData: ProductFormData
  onUpdateField: <K extends keyof ProductFormData>(field: K, value: ProductFormData[K]) => void
}

export function ProductSEOTab({ formData, onUpdateField }: ProductSEOTabProps) {
  return (
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
            onChange={(e) => onUpdateField("seoTitle", e.target.value)}
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
            onChange={(e) => onUpdateField("seoDescription", e.target.value)}
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
            onChange={(e) => onUpdateField("urlSlug", e.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  )
}

export default ProductSEOTab
