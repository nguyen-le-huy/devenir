/**
 * CategoriesPage - Refactored with Tree View Layout
 * 70% Tree Panel + 30% Detail Panel
 * Preserves all CRUD operations
 */

import { useState, useMemo } from 'react'
import { AdminLayout } from '@/layouts/AdminLayout'
import { Button } from '@/components/ui/button'
import { IconPlus } from '@tabler/icons-react'
import { CategoryTree } from '@/components/CategoryTree'
import { CategoryTableView } from '@/components/CategoryTableView'
import { CategoryDetailPanel } from '@/components/CategoryDetailPanel'
import { CategoryFormModal } from '@/components/CategoryFormModal'
import { buildCategoryTree } from '@/utils/categoryHelpers'
import type { CategoryTreeNode } from '@/utils/categoryHelpers'
import { categoryService, type CategoryFormData } from '@/services/categoryService'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export default function CategoriesPage() {
  const queryClient = useQueryClient()
  const [selectedCategory, setSelectedCategory] = useState<CategoryTreeNode | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<CategoryTreeNode | null>(null)
  const [parentForNewCategory, setParentForNewCategory] = useState<CategoryTreeNode | null>(null)
  const [viewMode, setViewMode] = useState<'tree' | 'table'>('tree')

  // Fetch categories tree (with levels calculated by backend)
  const {
    data: treeData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['categories', 'tree'],
    queryFn: async () => {
      const response = await categoryService.getCategoriesTree()
      return response.data || []
    },
    staleTime: 1000 * 60 * 15, // 15 minutes
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

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CategoryFormData) => categoryService.createCategory(data),
    onSuccess: (response) => {
      if (response.success) {
        alert('✅ Category created successfully!')
        queryClient.invalidateQueries({ queryKey: ['categories'] })
        setIsFormOpen(false)
        setEditingCategory(null)
        setParentForNewCategory(null)
      } else {
        alert('❌ Failed to create category')
      }
    },
    onError: (error: any) => {
      console.error('Error creating category:', error)
      const errorMsg = error?.response?.data?.message || error?.message || 'Error creating category'
      alert(`❌ Error: ${errorMsg}`)
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CategoryFormData }) =>
      categoryService.updateCategory(id, data),
    onSuccess: (response) => {
      if (response.success) {
        alert('✅ Category updated successfully!')
        queryClient.invalidateQueries({ queryKey: ['categories'] })
        setIsFormOpen(false)
        setEditingCategory(null)
        setParentForNewCategory(null)
      } else {
        alert('❌ Failed to update category')
      }
    },
    onError: (error: any) => {
      console.error('Error updating category:', error)
      const errorMsg = error?.response?.data?.message || error?.message || 'Error updating category'
      alert(`❌ Error: ${errorMsg}`)
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (categoryId: string) => categoryService.deleteCategory(categoryId),
    onSuccess: (response, deletedId) => {
      if (response.success) {
        alert('✅ Category deleted successfully!')
        queryClient.invalidateQueries({ queryKey: ['categories'] })
        if (selectedCategory?._id === deletedId) {
          setSelectedCategory(null)
        }
      } else {
        alert('❌ Failed to delete category')
      }
    },
    onError: (error: any) => {
      console.error('Error deleting category:', error)
      const errorMsg = error?.response?.data?.message || error?.message || 'Error deleting category'
      alert(`❌ Error: ${errorMsg}`)
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
            <p className="text-muted-foreground">Manage product categories with tree structure</p>
          </div>
          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex items-center bg-muted rounded-lg p-1">
              <Button
                variant={viewMode === 'tree' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('tree')}
                className="gap-2"
              >
                🌳 Tree View
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="gap-2"
              >
                📋 Table View
              </Button>
            </div>
            
            <Button onClick={handleAddCategory}>
              <IconPlus className="mr-2 h-4 w-4" />
              Add Root Category
            </Button>
          </div>
        </div>

        {/* Main Layout: 70% Tree/Table + 30% Detail */}
        <div className="grid grid-cols-[70%_30%] gap-6">
          {/* Left Panel: Category Tree or Table */}
          <div>
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
                onSelectCategory={setSelectedCategory}
                onEditCategory={handleEditCategory}
                onAddChild={handleAddChild}
                onDeleteCategory={handleDeleteCategory}
              />
            ) : (
              <CategoryTableView
                data={treeData || []}
                onSelectCategory={setSelectedCategory}
                onEditCategory={handleEditCategory}
                onDeleteCategory={handleDeleteCategory}
              />
            )}
          </div>

          {/* Right Panel: Category Detail */}
          <div className="sticky top-6 h-fit">
            <CategoryDetailPanel
              category={selectedCategory}
              allCategories={flatCategories}
              onEdit={handleEditCategory}
              onAddChild={handleAddChild}
              onDelete={(categoryId) => handleDeleteCategory(categoryId)}
            />
          </div>
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
      </div>
    </AdminLayout>
  )
}
