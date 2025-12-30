/**
 * CategoriesPage - Refactored with Tree View Layout
 * 70% Tree Panel + 30% Detail Panel
 * Preserves all CRUD operations
 */

import { useState, useMemo } from 'react'
import { AdminLayout } from '@/layouts/AdminLayout'
import { Button } from '@/components/ui/button'
import { IconPlus } from '@tabler/icons-react'
import { CategoryTree } from '@/components/categories/CategoryTree'
import { CategoryTableView } from '@/components/categories/CategoryTable'
import { CategoryDetailPanel } from '@/components/categories/CategoryDetail'
import { CategoryFormModal } from '@/components/categories/CategoryForm'
import type { CategoryTreeNode } from '@/utils/categoryHelpers'
import { categoryService, type CategoryFormData } from '@/services/categoryService'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/lib/queryClient'
import { toast } from 'sonner'
import { useIsMobile } from '@/hooks/use-mobile'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'

export default function CategoriesPage() {
  const queryClient = useQueryClient()
  const [selectedCategory, setSelectedCategory] = useState<CategoryTreeNode | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<CategoryTreeNode | null>(null)
  const [parentForNewCategory, setParentForNewCategory] = useState<CategoryTreeNode | null>(null)
  const [viewMode, setViewMode] = useState<'tree' | 'table'>('tree')
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false)
  const isMobile = useIsMobile()

  // Fetch categories tree (with levels calculated by backend)
  const {
    data: treeData,
    isLoading,
    error,
  } = useQuery({
    queryKey: QUERY_KEYS.categories.tree(),
    queryFn: async () => {
      const response = await categoryService.getCategoriesTree()
      return response.data || []
    },
    staleTime: 30 * 1000, // 30 seconds - realtime for admin
    gcTime: 5 * 60 * 1000, // 5 minutes
  })

  // Flatten tree for easy lookup (for form parent selection)
  const flatCategories = useMemo(() => {
    const flatten = (nodes: CategoryTreeNode[]): CategoryTreeNode[] => {
      return nodes.reduce((acc, node) => {
        return [...acc, node, ...flatten(node.children || [])]
      }, [] as CategoryTreeNode[])
    }
    return flatten(treeData || [])
  }, [treeData])

  const invalidateCategories = () => {
    queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.categories.all,
      refetchType: 'all',
    })
  }

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CategoryFormData) => categoryService.createCategory(data),
    onSuccess: (response) => {
      if (response.success) {
        toast.success('Category created successfully')
        invalidateCategories()
        queryClient.invalidateQueries({ 
          queryKey: QUERY_KEYS.products.lists(),
          refetchType: 'active'
        })
        setIsFormOpen(false)
        setEditingCategory(null)
        setParentForNewCategory(null)
      } else {
        toast.error('Failed to create category')
      }
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      console.error('Error creating category:', error)
      const errorMsg = error?.response?.data?.message || error?.message || 'Error creating category'
      toast.error(errorMsg)
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CategoryFormData }) =>
      categoryService.updateCategory(id, data),
    onSuccess: (response) => {
      if (response.success) {
        toast.success('Category updated successfully')
        invalidateCategories()
        queryClient.invalidateQueries({ 
          queryKey: QUERY_KEYS.products.lists(),
          refetchType: 'active'
        })
        setIsFormOpen(false)
        setEditingCategory(null)
        setParentForNewCategory(null)
      } else {
        toast.error('Failed to update category')
      }
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      console.error('Error updating category:', error)
      const errorMsg = error?.response?.data?.message || error?.message || 'Error updating category'
      toast.error(errorMsg)
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (categoryId: string) => categoryService.deleteCategory(categoryId),
    onSuccess: (response, deletedId) => {
      if (response.success) {
        toast.success('Category deleted successfully')
        invalidateCategories()
        queryClient.invalidateQueries({ 
          queryKey: QUERY_KEYS.products.lists(),
          refetchType: 'active'
        })
        if (selectedCategory?._id === deletedId) {
          setSelectedCategory(null)
        }
      } else {
        toast.error('Failed to delete category')
      }
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      console.error('Error deleting category:', error)
      const errorMsg = error?.response?.data?.message || error?.message || 'Error deleting category'
      toast.error(errorMsg)
    },
  })

  // Event Handlers
  const handleAddCategory = () => {
    setEditingCategory(null)
    setParentForNewCategory(null)
    setIsFormOpen(true)
  }

  const handleAddChild = (parent: CategoryTreeNode) => {
    setEditingCategory(null)
    setParentForNewCategory(parent)
    setIsFormOpen(true)
  }

  const handleEditCategory = (category: CategoryTreeNode) => {
    setEditingCategory(category)
    setParentForNewCategory(null)
    setIsFormOpen(true)
  }

  const handleDeleteCategory = async (categoryId: string) => {
    const confirmed = window.confirm(
      '⚠️ Are you sure you want to delete this category?\n\n' +
      'WARNING: All child categories will also be deleted!\n' +
      'This action cannot be undone.'
    )
    if (!confirmed) return

    deleteMutation.mutate(categoryId)
  }

  const handleSelectCategory = (category: CategoryTreeNode | null) => {
    setSelectedCategory(category)

    if (isMobile && category) {
      setIsDetailSheetOpen(true)
    }
  }

  const handleSaveCategory = async (data: CategoryFormData) => {
    if (editingCategory) {
      // Update existing category
      await updateMutation.mutateAsync({ id: editingCategory._id, data })
    } else {
      // Create new category
      await createMutation.mutateAsync(data)
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
            <p className="text-muted-foreground">Manage product categories with tree structure</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <div className="flex items-center justify-between gap-2 bg-muted rounded-lg p-1 sm:w-auto">
              <Button
                variant={viewMode === 'tree' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('tree')}
                className="gap-2 flex-1"
              >
                🌳 Tree View
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="gap-2 flex-1"
              >
                📋 Table View
              </Button>
            </div>

            <Button onClick={handleAddCategory} className="w-full sm:w-auto">
              <IconPlus className="mr-2 h-4 w-4" />
              Add Root Category
            </Button>
          </div>
        </div>

        {/* Main Layout: responsive grid */}
        <div className="grid gap-6 lg:grid-cols-[70%_30%]">
          {/* Left Panel: Category Tree or Table */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-96 bg-muted rounded-lg">
                <p className="text-muted-foreground">Loading categories...</p>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-96 bg-destructive/10 rounded-lg">
                <p className="text-destructive">Error loading categories. Please refresh the page.</p>
              </div>
            ) : viewMode === 'tree' ? (
              <CategoryTree
                data={treeData || []}
                allCategories={flatCategories}
                selectedCategoryId={selectedCategory?._id || null}
                onSelectCategory={handleSelectCategory}
                onEditCategory={handleEditCategory}
                onAddChild={handleAddChild}
                onDeleteCategory={handleDeleteCategory}
              />
            ) : (
              <CategoryTableView
                data={treeData || []}
                onSelectCategory={handleSelectCategory}
                onEditCategory={handleEditCategory}
                onDeleteCategory={handleDeleteCategory}
              />
            )}

            {isMobile && selectedCategory && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setIsDetailSheetOpen(true)}
              >
                View Category Details
              </Button>
            )}
          </div>

          {/* Right Panel: Category Detail */}
          {!isMobile && (
            <div className="sticky top-6 h-fit">
              <CategoryDetailPanel
                category={selectedCategory}
                allCategories={flatCategories}
                onEdit={handleEditCategory}
                onAddChild={handleAddChild}
                onDelete={(categoryId) => handleDeleteCategory(categoryId)}
              />
            </div>
          )}
        </div>

        {/* Category Form Modal */}
        <CategoryFormModal
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false)
            setEditingCategory(null)
            setParentForNewCategory(null)
          }}
          onSave={handleSaveCategory}
          initialData={editingCategory || undefined}
          allCategories={flatCategories}
          parentCategory={parentForNewCategory}
        />

        {/* Mobile Detail Sheet */}
        {isMobile && (
          <Sheet open={isDetailSheetOpen} onOpenChange={setIsDetailSheetOpen}>
            <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
              <SheetHeader className="text-left">
                <SheetTitle>Category Details</SheetTitle>
                <SheetDescription>
                  Review structure, metadata, and quick actions for the selected category.
                </SheetDescription>
              </SheetHeader>
              <div className="mt-4">
                <CategoryDetailPanel
                  category={selectedCategory}
                  allCategories={flatCategories}
                  onEdit={(category) => {
                    handleEditCategory(category)
                    setIsDetailSheetOpen(false)
                  }}
                  onAddChild={(category) => {
                    handleAddChild(category)
                    setIsDetailSheetOpen(false)
                  }}
                  onDelete={(categoryId) => {
                    handleDeleteCategory(categoryId)
                    setIsDetailSheetOpen(false)
                  }}
                />
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>
    </AdminLayout>
  )
}
