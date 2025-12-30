import { useEffect, useMemo, useState } from 'react'
import { AdminLayout } from '@/layouts/AdminLayout'
import { Button } from '@/components/ui/button'
import { IconPlus, IconRefresh } from '@tabler/icons-react'
import { BrandFormModal } from '@/components/brands/BrandFormModal'
import { BrandStatsHighlight } from '@/components/brands/BrandStatsHighlight'
import { BrandTopPerformers } from '@/components/brands/BrandTopPerformers'
import { BrandDetailPanel } from '@/components/brands/BrandDetailPanel'
import { BrandFiltersBar } from '@/components/brands/BrandFiltersBar'
import { BrandListTable } from '@/components/brands/BrandListTable'
import { BrandListGrid } from '@/components/brands/BrandListGrid'
import { BrandEmptyState } from '@/components/brands/BrandEmptyState'
import { useDebounce } from '@/hooks/useDebounce'
import { useBrandsQuery, useCreateBrandMutation, useUpdateBrandMutation, useDeleteBrandMutation, useBrandsRealtimeSync } from '@/hooks/useBrandsQuery'
import type { Brand, BrandFormData } from '@/services/brandService'
import { toast } from 'sonner'

export default function BrandsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null)
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [countryFilter, setCountryFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')

  const debouncedSearch = useDebounce(search, 300)

  const queryParams = useMemo(() => {
    const params: Record<string, unknown> = {}
    if (debouncedSearch) params.search = debouncedSearch
    if (statusFilter !== 'all') params.status = statusFilter
    if (countryFilter !== 'all') params.originCountry = countryFilter
    return params
  }, [debouncedSearch, statusFilter, countryFilter])

  const { data, isLoading, isFetching, refetch } = useBrandsQuery(queryParams)
  const isInitialLoading = isLoading && !data
  const isRefreshing = isFetching && !!data
  const isBusy = isLoading || isFetching
  useBrandsRealtimeSync()
  const brands = useMemo(() => data?.data || [], [data?.data])
  const stats = data?.meta
  const topBrands = data?.topBrands

  const createBrandMutation = useCreateBrandMutation()
  const updateBrandMutation = useUpdateBrandMutation()
  const deleteBrandMutation = useDeleteBrandMutation()

  useEffect(() => {
    if (!brands.length) {
      setSelectedBrand(null)
      return
    }
    setSelectedBrand((current) => {
      if (current) {
        const fresh = brands.find((brand) => brand._id === current._id)
        if (fresh) return fresh
      }
      return brands[0]
    })
  }, [brands])

  const availableCountries = useMemo(() => {
    const set = new Set<string>()
    brands.forEach((brand) => {
      if (brand.originCountry) {
        set.add(brand.originCountry)
      }
    })
    return Array.from(set).sort()
  }, [brands])

  const handleOpenCreate = () => {
    setEditingBrand(null)
    setIsFormOpen(true)
  }

  const handleSelectBrand = (brand: Brand) => {
    setSelectedBrand(brand)
  }

  const handleEditBrand = (brand: Brand) => {
    setEditingBrand(brand)
    setIsFormOpen(true)
  }

  const handleSubmitBrand = async (payload: BrandFormData) => {
    try {
      if (editingBrand) {
        await updateBrandMutation.mutateAsync({ id: editingBrand._id, data: payload })
        toast.success('Brand updated')
      } else {
        await createBrandMutation.mutateAsync(payload)
        toast.success('Brand created')
      }
      setIsFormOpen(false)
      setEditingBrand(null)
    } catch (error: unknown) {
      const err = error as Error & { response?: { data?: { message?: string } } }
      const message = err?.response?.data?.message || err?.message || 'Unable to save brand'
      toast.error(message)
    }
  }

  const handleDeleteBrand = async (brand: Brand) => {
    const confirmed = window.confirm('Archive this brand? Products keep their association but brand will be hidden from storefront.')
    if (!confirmed) return
    try {
      await deleteBrandMutation.mutateAsync(brand._id)
      toast.success('Brand archived')
      if (selectedBrand?._id === brand._id) {
        setSelectedBrand(null)
      }
    } catch (error: unknown) {
      const err = error as Error & { response?: { data?: { message?: string } } }
      const message = err?.response?.data?.message || err?.message || 'Unable to archive brand'
      toast.error(message)
    }
  }

  const handleResetFilters = () => {
    setSearch('')
    setStatusFilter('all')
    setCountryFilter('all')
  }

  const isEmpty = !isInitialLoading && brands.length === 0

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Collections</p>
            <h1 className="text-3xl font-semibold">Brand Management</h1>
            <p className="text-muted-foreground">Control merchandising partners, highlight top performers, and keep catalog data consistent.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => refetch()} disabled={isBusy}>
              <IconRefresh className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} /> Refresh
            </Button>
            <Button onClick={handleOpenCreate}>
              <IconPlus className="mr-2 h-4 w-4" /> New brand
            </Button>
          </div>
        </div>

        <BrandStatsHighlight stats={stats} />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
          <div className="space-y-4">
            <BrandFiltersBar
              search={search}
              onSearchChange={setSearch}
              status={statusFilter}
              onStatusChange={setStatusFilter}
              country={countryFilter}
              onCountryChange={setCountryFilter}
              countries={availableCountries}
              view={viewMode}
              onViewChange={(value) => value && setViewMode(value)}
              onReset={handleResetFilters}
            />

            {isEmpty && <BrandEmptyState onCreate={handleOpenCreate} />}

            {!isEmpty && (
              <>
                {viewMode === 'table' ? (
                  <BrandListTable
                    data={brands}
                    isLoading={isInitialLoading}
                    selectedId={selectedBrand?._id}
                    onSelect={handleSelectBrand}
                    onEdit={handleEditBrand}
                    onDelete={handleDeleteBrand}
                  />
                ) : (
                  <BrandListGrid
                    data={brands}
                    selectedId={selectedBrand?._id}
                    onSelect={handleSelectBrand}
                    onEdit={handleEditBrand}
                    onDelete={handleDeleteBrand}
                  />
                )}
              </>
            )}
          </div>

          <div className="space-y-4">
            <BrandDetailPanel brand={selectedBrand} onEdit={handleEditBrand} onDelete={handleDeleteBrand} />
            <BrandTopPerformers items={topBrands} />
          </div>
        </div>
      </div>

      <BrandFormModal
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false)
          setEditingBrand(null)
        }}
        onSubmit={handleSubmitBrand}
        initialData={editingBrand}
      />
    </AdminLayout>
  )
}
