import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { AdminLayout } from '@/layouts/AdminLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { IconPlus, IconChevronLeft, IconEdit, IconTrash } from '@tabler/icons-react'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { CategoryForm } from '@/components/CategoryForm'
import { categoryService, type Category, type CategoryFormData } from '@/services/categoryService'

export default function CategoriesPage() {
    const location = useLocation()
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editingCategory, setEditingCategory] = useState<Category | null>(null)
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(false)
    const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null)

    useEffect(() => {
        // Auto-open form if URL is /new
        if (location.pathname === '/admin/categories/new') {
            setIsFormOpen(true)
            setEditingCategory(null)
        }
        loadCategories()
    }, [location.pathname])

    const loadCategories = async () => {
        try {
            setLoading(true)
            const response = await categoryService.getAllCategories({ limit: 100 })
            setCategories(response.data || [])
        } catch (error) {
            console.error('Error loading categories:', error)
            alert('Failed to load categories')
        } finally {
            setLoading(false)
        }
    }

    const handleAddCategory = () => {
        setEditingCategory(null)
        setIsFormOpen(true)
    }

    const handleEditCategory = (category: Category) => {
        setEditingCategory(category)
        setIsFormOpen(true)
    }

    const handleCloseForm = () => {
        setIsFormOpen(false)
        setEditingCategory(null)
    }

    const handleSaveCategory = async (data: CategoryFormData) => {
        try {
            if (editingCategory) {
                // Update existing category
                const response = await categoryService.updateCategory(editingCategory._id, data)
                if (response.success) {
                    alert('✅ Category updated successfully!')
                    handleCloseForm()
                    await loadCategories()
                } else {
                    alert('❌ Failed to update category')
                }
            } else {
                // Create new category
                const response = await categoryService.createCategory(data)
                if (response.success) {
                    alert('✅ Category created successfully!')
                    handleCloseForm()
                    await loadCategories()
                } else {
                    alert('❌ Failed to create category')
                }
            }
        } catch (error: any) {
            console.error('Error saving category:', error)
            const errorMsg = error?.response?.data?.message || error?.message || 'Error saving category'
            alert(`❌ Error: ${errorMsg}`)
        }
    }

    const handleDeleteCategory = async (categoryId: string) => {
        const confirmed = window.confirm(
            '⚠️ Are you sure you want to delete this category? This action cannot be undone.'
        )
        if (!confirmed) return

        setDeletingCategoryId(categoryId)
        try {
            const response = await categoryService.deleteCategory(categoryId)
            if (response.success) {
                alert('✅ Category deleted successfully!')
                await loadCategories()
            } else {
                alert('❌ Failed to delete category')
            }
        } catch (error: any) {
            console.error('Error deleting category:', error)
            const errorMsg = error?.response?.data?.message || error?.message || 'Error deleting category'
            alert(`❌ Error: ${errorMsg}`)
        } finally {
            setDeletingCategoryId(null)
        }
    }

    // Get parent category name
    const getParentName = (parentId: string | null | undefined) => {
        if (!parentId) return '—'
        const parent = categories.find((cat) => cat._id === parentId)
        return parent?.name || '—'
    }

    if (isFormOpen) {
        return (
            <AdminLayout>
                <div className="space-y-4">
                    <Button variant="ghost" onClick={handleCloseForm} className="mb-4">
                        <IconChevronLeft className="mr-2 h-4 w-4" />
                        Back to Categories
                    </Button>
                    <CategoryForm
                        initialData={editingCategory || undefined}
                        categories={categories}
                        onSave={handleSaveCategory}
                        onCancel={handleCloseForm}
                    />
                </div>
            </AdminLayout>
        )
    }

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
                        <p className="text-muted-foreground">Manage product categories and hierarchy</p>
                    </div>
                    <Button onClick={handleAddCategory}>
                        <IconPlus className="mr-2 h-4 w-4" />
                        Add Category
                    </Button>
                </div>

                {/* Categories List */}
                <Card>
                    <CardHeader>
                        <CardTitle>Category List ({categories.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="text-center py-12">
                                <p className="text-muted-foreground">Loading...</p>
                            </div>
                        ) : categories.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-muted-foreground mb-4">No categories yet</p>
                                <Button onClick={handleAddCategory}>
                                    <IconPlus className="mr-2 h-4 w-4" />
                                    Create First Category
                                </Button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Thumbnail</TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Description</TableHead>
                                            <TableHead>Parent Category</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Created</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {categories.map((category) => (
                                            <TableRow key={category._id}>
                                                <TableCell>
                                                    {category.thumbnailUrl ? (
                                                        <img
                                                            src={category.thumbnailUrl}
                                                            alt={category.name}
                                                            className="w-12 h-12 object-cover rounded"
                                                        />
                                                    ) : (
                                                        <div className="w-12 h-12 bg-muted rounded flex items-center justify-center text-muted-foreground text-xs">
                                                            No img
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell className="font-medium">{category.name}</TableCell>
                                                <TableCell className="max-w-xs truncate">
                                                    {category.description || '—'}
                                                </TableCell>
                                                <TableCell>
                                                    {category.parentCategory ? (
                                                        <Badge variant="outline">{getParentName(category.parentCategory)}</Badge>
                                                    ) : (
                                                        <span className="text-muted-foreground text-sm">Top-level</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={category.isActive ? 'default' : 'secondary'}>
                                                        {category.isActive ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{new Date(category.createdAt).toLocaleDateString()}</TableCell>
                                                <TableCell className="text-right space-x-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleEditCategory(category)}
                                                        disabled={deletingCategoryId === category._id}
                                                    >
                                                        <IconEdit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => handleDeleteCategory(category._id)}
                                                        disabled={deletingCategoryId === category._id}
                                                    >
                                                        {deletingCategoryId === category._id ? (
                                                            <>
                                                                <span className="animate-spin mr-2">⏳</span>
                                                                Deleting...
                                                            </>
                                                        ) : (
                                                            <IconTrash className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    )
}
