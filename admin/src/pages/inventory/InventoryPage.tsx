import { useEffect, useMemo, useState } from "react"
import { AdminLayout } from "@/layouts/AdminLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { IconPlus, IconRefresh } from "@tabler/icons-react"
import { useInventoryList, useInventoryOverview } from "@/hooks/useInventory"
import type { InventoryListItem, InventoryListFilters } from "@/hooks/useInventory"
import InventorySummaryCards from "@/components/inventory/InventorySummaryCards"
import InventoryFiltersBar from "@/components/inventory/InventoryFiltersBar"
import InventoryTable from "@/components/inventory/InventoryTable"
import InventoryVariantDrawer from "@/components/inventory/InventoryVariantDrawer"
import InventoryAdjustmentDrawer from "@/components/inventory/InventoryAdjustmentDrawer"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { useLocale } from "@/contexts/LocaleContext"

type FilterState = {
  search: string
  category: string | "all"
  brand: string | "all"
  stockStatus: NonNullable<InventoryListFilters["stockStatus"]>
  productStatus: NonNullable<InventoryListFilters["productStatus"]>
}

const defaultFilters: FilterState = {
  search: "",
  category: "all",
  brand: "all",
  stockStatus: "all",
  productStatus: "all",
}

export default function InventoryPage() {
  const { t, locale } = useLocale()
  const currencyFormatter = useMemo(() => new Intl.NumberFormat(locale === "vi" ? "vi-VN" : "en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }), [locale])
  const numberFormatter = useMemo(() => new Intl.NumberFormat(locale === "vi" ? "vi-VN" : "en-US"), [locale])
  const [filters, setFilters] = useState<FilterState>(() => ({ ...defaultFilters }))
  const [page, setPage] = useState(1)
  const pageSize = 20
  const [inspectDrawerOpen, setInspectDrawerOpen] = useState(false)
  const [inspectVariantId, setInspectVariantId] = useState<string | null>(null)
  const [inspectSummary, setInspectSummary] = useState<InventoryListItem | null>(null)
  const [adjustDrawerOpen, setAdjustDrawerOpen] = useState(false)
  const [adjustVariant, setAdjustVariant] = useState<InventoryListItem | null>(null)
  const [selectedVariant, setSelectedVariant] = useState<InventoryListItem | null>(null)

  const normalizedFilters = useMemo<InventoryListFilters>(() => (
    {
      page,
      limit: pageSize,
      search: filters.search || undefined,
      category: filters.category !== "all" ? filters.category : undefined,
      brand: filters.brand !== "all" ? filters.brand : undefined,
      stockStatus: filters.stockStatus === "all" ? undefined : filters.stockStatus,
      productStatus: filters.productStatus === "all" ? undefined : filters.productStatus,
    }
  ), [filters, page])

  const {
    data: overview,
    isLoading: overviewLoading,
    isFetching: overviewFetching,
    refetch: refetchOverview,
  } = useInventoryOverview()

  const {
    data: listResponse,
    isLoading: listLoading,
    isFetching: listFetching,
    refetch: refetchList,
  } = useInventoryList(normalizedFilters)

  const isRefreshing = overviewFetching || listFetching

  const handleRefresh = () => {
    void Promise.all([refetchOverview(), refetchList()])
  }

  const handleFilterChange = <K extends keyof FilterState>(key: K, value: FilterState[K] | string) => {
    setFilters((prev) => ({ ...prev, [key]: value as FilterState[K] }))
    setPage(1)
  }

  const handleResetFilters = () => {
    setFilters({ ...defaultFilters })
    setPage(1)
  }

  const handleInspect = (item: InventoryListItem) => {
    setSelectedVariant(item)
    setInspectSummary(item)
    setInspectVariantId(item._id)
    setInspectDrawerOpen(true)
  }

  const handleAdjust = (item: InventoryListItem) => {
    setSelectedVariant(item)
    setAdjustVariant(item)
    setAdjustDrawerOpen(true)
  }

  useEffect(() => {
    const firstItem = listResponse?.data?.[0]
    const existsInPage = selectedVariant && listResponse?.data?.some((item) => item._id === selectedVariant._id)
    if (firstItem && (!selectedVariant || !existsInPage)) {
      setSelectedVariant(firstItem)
    }
  }, [listResponse?.data, selectedVariant])

  const openAdjustFromToolbar = () => {
    const target = selectedVariant || listResponse?.data?.[0]
    if (!target) {
      toast.info("Chưa có SKU nào để điều chỉnh")
      return
    }
    handleAdjust(target)
  }

  const closeInspectDrawer = () => {
    setInspectDrawerOpen(false)
    setInspectVariantId(null)
    setInspectSummary(null)
  }

  const closeAdjustDrawer = () => {
    setAdjustDrawerOpen(false)
    setAdjustVariant(null)
  }

  const summary = listResponse?.summary
  const summaryValue = typeof summary?.totalValue === "number" ? currencyFormatter.format(summary.totalValue) : "--"
  const summaryUnits = typeof summary?.totalUnits === "number" ? numberFormatter.format(summary.totalUnits) : "--"

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{t("inventory.page.subtitle")}</p>
            <h1 className="text-3xl font-bold tracking-tight">{t("inventory.page.title")}</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
              <IconRefresh className="mr-2 h-4 w-4" /> {t("inventory.page.refresh")}
            </Button>
            <Button onClick={openAdjustFromToolbar}>
              <IconPlus className="mr-2 h-4 w-4" />
              {t("inventory.page.adjust")}
            </Button>
          </div>
        </div>

        <InventorySummaryCards overview={overview} loading={overviewLoading || overviewFetching} />

        <Card>
          <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>{t("inventory.page.skuOverview")}</CardTitle>
              <p className="text-sm text-muted-foreground">{t("inventory.page.skuOverviewDescription")}</p>
            </div>
            <Badge variant="secondary">
              {t("inventory.page.totalValue")}: {summaryValue} | {t("inventory.page.totalSku")}: {summaryUnits}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <InventoryFiltersBar
              search={filters.search}
              onSearchChange={(value) => handleFilterChange("search", value)}
              category={filters.category}
              onCategoryChange={(value) => handleFilterChange("category", value)}
              brand={filters.brand}
              onBrandChange={(value) => handleFilterChange("brand", value)}
              stockStatus={filters.stockStatus}
              onStockStatusChange={(value) => handleFilterChange("stockStatus", value)}
              productStatus={filters.productStatus}
              onProductStatusChange={(value) => handleFilterChange("productStatus", value)}
              onRefresh={handleRefresh}
              onReset={handleResetFilters}
              isRefreshing={isRefreshing}
            />

            <InventoryTable
              items={listResponse?.data || []}
              loading={listLoading || listFetching}
              pagination={listResponse?.pagination}
              onPageChange={setPage}
              onInspect={handleInspect}
              onAdjust={handleAdjust}
            />
          </CardContent>
        </Card>
      </div>

      <InventoryVariantDrawer
        open={inspectDrawerOpen}
        variantId={inspectVariantId}
        summary={inspectSummary}
        onClose={closeInspectDrawer}
      />
      <InventoryAdjustmentDrawer
        open={adjustDrawerOpen}
        variant={adjustVariant}
        onClose={closeAdjustDrawer}
        onSuccess={handleRefresh}
      />
    </AdminLayout>
  )
}
