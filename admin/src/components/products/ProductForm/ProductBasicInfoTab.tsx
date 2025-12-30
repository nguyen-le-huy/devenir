/**
 * ProductBasicInfoTab
 * Tab 1: Basic product information (name, description, category, brand, tags, status)
 */

import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { IconBrandFacebook } from "@tabler/icons-react"
import type { ProductFormData } from "./types"
import type { Category } from "@/services/categoryService"
import type { Brand } from "@/services/brandService"

interface ProductBasicInfoTabProps {
  formData: ProductFormData
  categories: Category[]
  filteredCategories: Category[]
  categorySearch: string
  setCategorySearch: (value: string) => void
  availableBrands: Brand[]
  filteredBrands: Brand[]
  brandSearch: string
  setBrandSearch: (value: string) => void
  brandsLoading: boolean
  selectedBrandDetails: Brand | null
  postToFacebook: boolean
  setPostToFacebook: (value: boolean) => void
  onUpdateField: <K extends keyof ProductFormData>(field: K, value: ProductFormData[K]) => void
}

export function ProductBasicInfoTab({
  formData,
  filteredCategories,
  categorySearch,
  setCategorySearch,
  filteredBrands,
  brandSearch,
  setBrandSearch,
  brandsLoading,
  availableBrands,
  selectedBrandDetails,
  postToFacebook,
  setPostToFacebook,
  onUpdateField,
}: ProductBasicInfoTabProps) {
  return (
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
            onChange={(e) => onUpdateField("name", e.target.value)}
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
            onChange={(e) => onUpdateField("description", e.target.value)}
          />
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center max-w-xl">
            <Select
              value={formData.category}
              onValueChange={(value) => onUpdateField("category", value)}
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
              onValueChange={(value) => onUpdateField("brand", value)}
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
              onUpdateField("tags", e.target.value.split(",").map((t) => t.trim()))
            }
          />
        </div>

        {/* Status */}
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => {
              onUpdateField("status", value as "draft" | "published" | "archived")
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
  )
}

export default ProductBasicInfoTab
