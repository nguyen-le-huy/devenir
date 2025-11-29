/**
 * CategoryDetailPanel Component - Complete Version
 * Fixed: Empty state, full image, variants count, sticky header spacing
 */

import type { CategoryTreeNode } from '@/utils/categoryHelpers'
import { getCategoryPath } from '@/utils/categoryHelpers'
import type { Category } from '@/services/categoryService'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { IconEdit, IconPlus, IconTrash, IconFolder } from '@tabler/icons-react'

interface CategoryDetailPanelProps {
  category: CategoryTreeNode | null
  allCategories: Category[]
  onEdit: (category: CategoryTreeNode) => void
  onAddChild: (parent: CategoryTreeNode) => void
  onDelete: (categoryId: string) => void
}

export function CategoryDetailPanel({
  category,
  allCategories,
  onEdit,
  onAddChild,
  onDelete,
}: CategoryDetailPanelProps) {
  // Empty State
  if (!category) {
    return (
      <Card className="sticky top-6 h-[calc(100vh-10rem)]">
        <CardContent className="flex flex-col items-center justify-center h-full text-center p-8">
          <IconFolder className="h-24 w-24 text-muted-foreground/50 mb-6" />
          <h3 className="font-semibold text-xl mb-2">No Category Selected</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Select a category from the tree to view details
          </p>
        </CardContent>
      </Card>
    )
  }

  const hierarchyPath = getCategoryPath(category._id, allCategories)
  const hasChildren = category.children && category.children.length > 0

  return (
    <Card className="sticky top-6 h-[calc(100vh-10rem)] overflow-hidden flex flex-col">
      {/* Fixed Header */}
      <CardHeader className="pb-3 border-b shrink-0">
        <CardTitle className="text-lg">Category Details</CardTitle>
      </CardHeader>

      {/* Scrollable Content */}
      <CardContent className="p-6 space-y-6 overflow-y-auto flex-1">
        {/* Selected Category Name */}
        <div>
          <h3 className="text-2xl font-bold mb-2">{category.name}</h3>
          <Badge
            variant={category.isActive ? 'default' : 'secondary'}
            className={category.isActive ? 'bg-green-500/10 text-green-700' : ''}
          >
            {category.isActive ? '🟢 Active' : '⚪ Inactive'}
          </Badge>
        </div>

        <Separator />

        {/* Thumbnail Preview - Full Image (No Hover Zoom) */}
        {category.thumbnailUrl && (
          <div>
            <h4 className="text-sm font-semibold mb-2">Thumbnail</h4>
            <div className="relative w-full">
              <img
                src={category.thumbnailUrl}
                alt={category.name}
                className="w-full h-48 object-cover rounded-lg border"
              />
            </div>
          </div>
        )}

        {/* Basic Info */}
        <div>
          <h4 className="text-sm font-semibold mb-3">Basic Information</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name:</span>
              <span className="font-medium">{category.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Level:</span>
              <span className="font-medium">{category.level}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created:</span>
              <span className="text-xs">
                {new Date(category.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Last Updated:</span>
              <span className="text-xs">
                {new Date(category.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Hierarchy Path */}
        <div>
          <h4 className="text-sm font-semibold mb-3">Hierarchy Path</h4>
          <div className="space-y-1">
            {hierarchyPath.map((name, index) => (
              <div key={index} className="flex items-start gap-2 text-sm">
                <span className="text-muted-foreground">
                  {'└─'.repeat(index)}
                  {index > 0 && ' '}
                </span>
                <span className={index === hierarchyPath.length - 1 ? 'font-semibold' : ''}>
                  {name}
                </span>
              </div>
            ))}
            {hierarchyPath.length > 0 && (
              <div className="flex items-start gap-2 text-sm">
                <span className="text-muted-foreground">
                  {'└─'.repeat(hierarchyPath.length)}
                </span>
                <span className="font-semibold text-primary">{category.name} [YOU ARE HERE]</span>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Statistics with Variants Count */}
        <div>
          <h4 className="text-sm font-semibold mb-3">Statistics</h4>
          <div className="grid grid-cols-2 gap-3">
            <button 
              className="bg-muted hover:bg-muted/70 p-3 rounded-lg transition-colors cursor-pointer text-left"
              onClick={() => window.location.href = `/products?category=${category._id}`}
              title="Click to view products in this category"
            >
              <p className="text-xs text-muted-foreground mb-1">Products</p>
              <p className="text-2xl font-bold">{category.productCount || 0}</p>
            </button>
            <button 
              className="bg-muted hover:bg-muted/70 p-3 rounded-lg transition-colors cursor-pointer text-left"
              onClick={() => window.location.href = `/products?category=${category._id}&view=variants`}
              title="Click to view variants in this category"
            >
              <p className="text-xs text-muted-foreground mb-1">Variants</p>
              <p className="text-2xl font-bold">{category.variantCount || 0}</p>
            </button>
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Child Categories</p>
              <p className="text-2xl font-bold">{category.children?.length || 0}</p>
            </div>
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Sort Order</p>
              <p className="text-2xl font-bold">{category.sortOrder || 0}</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Description */}
        {category.description && (
          <div>
            <h4 className="text-sm font-semibold mb-2">Description</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {category.description}
            </p>
          </div>
        )}

        <Separator />

        {/* Quick Actions */}
        <div>
          <h4 className="text-sm font-semibold mb-3">Quick Actions</h4>
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => onEdit(category)}
            >
              <IconEdit className="h-4 w-4 mr-2" />
              Edit Category
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => onAddChild(category)}
            >
              <IconPlus className="h-4 w-4 mr-2" />
              Add Child Category
            </Button>
            <Button
              variant="destructive"
              className="w-full justify-start"
              onClick={() => onDelete(category._id)}
              disabled={hasChildren}
            >
              <IconTrash className="h-4 w-4 mr-2" />
              {hasChildren ? 'Delete (has children)' : 'Delete Category'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
