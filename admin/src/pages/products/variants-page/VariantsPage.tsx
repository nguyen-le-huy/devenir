/**
 * Variants Page - Refactored
 * Main orchestrator component for variant management
 */
import React, { useState, useMemo, useEffect } from 'react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { AdminLayout } from '@/layouts/AdminLayout'
import VariantDrawer from '@/components/variants/VariantDrawer'
import { useDebounce } from '@/hooks/useDebounce'
import { useVariantsQuery, useDeleteVariant } from '@/hooks/useVariantsQuery'
import { useProductsQuery } from '@/hooks/useProductsQuery'
import { useColorsQuery } from '@/hooks/useColorsQuery'
import { toast } from 'sonner'

// Import local components
import { VariantQuickStats } from './VariantQuickStats'
import { VariantFiltersCard } from './VariantFiltersCard'
import { VariantsTable } from './VariantsTable'
import { useVariantsCSV } from './useVariantsCSV'
import { calculateQuickStats, filterVariants } from './utils'
import type { Variant, Product } from './types'

export default function VariantsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()

  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [filterProduct, setFilterProduct] = useState('all')
  const [filterSize, setFilterSize] = useState('all')
  const [filterColor, setFilterColor] = useState('all')
  const [filterStockStatus, setFilterStockStatus] = useState('all')

  // Pagination
  const initialPage = parseInt(searchParams.get('page') || '1', 10)
  const [page, setPage] = useState(initialPage)
  const [limit] = useState(10)

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingVariantId, setEditingVariantId] = useState<string | undefined>()

  // Debounce search
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  // Fetch data with React Query
  const { data: variantsData, isLoading: variantsLoading } = useVariantsQuery({ limit: 500 })
  const { data: productsData } = useProductsQuery({ limit: 100 })
  const { data: colors = [] } = useColorsQuery()
  const deleteVariantMutation = useDeleteVariant()

  // Memoize data arrays to prevent unnecessary re-renders
  const variants: Variant[] = useMemo(() => variantsData?.data || [], [variantsData?.data])
  const products: Product[] = useMemo(() => productsData?.data || [], [productsData?.data])

  // Memoized calculations
  const quickStats = useMemo(() => calculateQuickStats(variants), [variants])

  const filteredVariants = useMemo(
    () => filterVariants(variants, debouncedSearchTerm, filterProduct, filterSize, filterColor, filterStockStatus),
    [variants, debouncedSearchTerm, filterProduct, filterSize, filterColor, filterStockStatus]
  )

  const paginatedVariants = useMemo(
    () => filteredVariants.slice((page - 1) * limit, page * limit),
    [filteredVariants, page, limit]
  )

  const totalPages = useMemo(() => Math.ceil(filteredVariants.length / limit), [filteredVariants.length, limit])

  const sizes = useMemo(() => [...new Set(variants.map((v) => v.size))].sort(), [variants])

  // CSV handlers
  const { handleExportCSV, handleImportCSV } = useVariantsCSV({
    filteredVariants,
    colors,
  })

  // Auto-open drawer if edit param exists
  const editId = searchParams.get('edit')
  if (editId && !drawerOpen) {
    setEditingVariantId(editId)
    setDrawerOpen(true)
  }

  // Sync page to URL
  useEffect(() => {
    const currentPage = searchParams.get('page')
    if (currentPage !== page.toString()) {
      setSearchParams({ page: page.toString() }, { replace: true })
    }
  }, [page, searchParams, setSearchParams])

  // Reset page when filters change
  const prevFiltersRef = React.useRef({ debouncedSearchTerm, filterProduct, filterSize, filterColor, filterStockStatus })
  useEffect(() => {
    const prev = prevFiltersRef.current
    const hasFilterChanged =
      prev.debouncedSearchTerm !== debouncedSearchTerm ||
      prev.filterProduct !== filterProduct ||
      prev.filterSize !== filterSize ||
      prev.filterColor !== filterColor ||
      prev.filterStockStatus !== filterStockStatus

    if (hasFilterChanged) {
      setPage(1)
      prevFiltersRef.current = { debouncedSearchTerm, filterProduct, filterSize, filterColor, filterStockStatus }
    }
  }, [debouncedSearchTerm, filterProduct, filterSize, filterColor, filterStockStatus])

  // Handle direct URL navigation to edit variant
  useEffect(() => {
    const editMatch = location.pathname.match(/\/admin\/variants\/edit\/([a-fA-F0-9]+)/)
    if (editMatch && variants.length > 0) {
      const variantId = editMatch[1]
      const variant = variants.find((v) => v._id === variantId)
      if (variant) {
        setEditingVariantId(variantId)
        setDrawerOpen(true)
      }
    }
  }, [location.pathname, variants])

  // Event handlers
  const handleDeleteVariant = async (variantId: string) => {
    if (confirm('Are you sure you want to delete this variant? This action cannot be undone.')) {
      try {
        await deleteVariantMutation.mutateAsync(variantId)
        toast.success('Variant deleted successfully')
      } catch (error) {
        console.error('Error deleting variant:', error)
        toast.error('Failed to delete variant')
      }
    }
  }

  const handleResetFilters = () => {
    setSearchTerm('')
    setFilterProduct('all')
    setFilterSize('all')
    setFilterColor('all')
    setFilterStockStatus('all')
  }

  const handleViewVariant = (variant: Variant) => {
    navigate(`/admin/variants/view/${variant._id}?page=${page}`, {
      state: { variantData: variant },
    })
  }

  const handleEditVariant = (variant: Variant) => {
    setEditingVariantId(variant._id)
    setDrawerOpen(true)
  }

  const handleAddVariant = () => {
    setEditingVariantId(undefined)
    setDrawerOpen(true)
  }

  const handleDrawerClose = () => {
    setDrawerOpen(false)
    setEditingVariantId(undefined)
    navigate(`/admin/variants?page=${page}`)
  }

  // Prepare variant data for drawer
  const drawerVariantData = editingVariantId
    ? (() => {
        const v = variants.find((v) => v._id === editingVariantId)
        if (!v) return undefined
        return {
          ...v,
          product: typeof v.product === 'object' && v.product ? v.product._id : v.product,
          color: v.color ?? undefined,
        }
      })()
    : undefined

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Product Variants / SKU Management</h1>
          <p className="text-muted-foreground">Manage your product variants and inventory</p>
        </div>

        {/* Quick Stats */}
        <VariantQuickStats stats={quickStats} />

        {/* Filters & Search */}
        <VariantFiltersCard
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filterProduct={filterProduct}
          onFilterProductChange={setFilterProduct}
          filterSize={filterSize}
          onFilterSizeChange={setFilterSize}
          filterColor={filterColor}
          onFilterColorChange={setFilterColor}
          filterStockStatus={filterStockStatus}
          onFilterStockStatusChange={setFilterStockStatus}
          products={products}
          sizes={sizes}
          colors={colors}
          onImportCSV={handleImportCSV}
          onExportCSV={handleExportCSV}
          onAddVariant={handleAddVariant}
          onReset={handleResetFilters}
        />

        {/* Variants Table */}
        <VariantsTable
          variants={paginatedVariants}
          colors={colors}
          loading={variantsLoading}
          page={page}
          limit={limit}
          totalPages={totalPages}
          totalItems={filteredVariants.length}
          onPageChange={setPage}
          onView={handleViewVariant}
          onEdit={handleEditVariant}
          onDelete={handleDeleteVariant}
        />
      </div>

      {/* Variant Drawer */}
      <VariantDrawer
        isOpen={drawerOpen}
        variantId={editingVariantId}
        variantData={drawerVariantData}
        isEdit={!!editingVariantId}
        onClose={handleDrawerClose}
        onSuccess={handleDrawerClose}
      />
    </AdminLayout>
  )
}
