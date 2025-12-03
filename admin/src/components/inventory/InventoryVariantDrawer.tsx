import { useMemo } from "react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { IconAlertTriangle, IconInfoCircle, IconArrowDownRight, IconArrowUpRight } from "@tabler/icons-react"
import { getHealthConfig } from "@/components/inventory/constants"
import { useInventoryVariantDetail } from "@/hooks/useInventory"
import type { InventoryListItem, InventoryAdjustment } from "@/hooks/useInventory"
import { ResponsiveContainer, LineChart, Line, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import { useLocale } from "@/contexts/LocaleContext"

interface InventoryVariantDrawerProps {
  open: boolean
  variantId?: string | null
  summary?: InventoryListItem | null
  onClose: () => void
}

export default function InventoryVariantDrawer({ open, variantId, summary, onClose }: InventoryVariantDrawerProps) {
  const { t, locale } = useLocale()
  const numberFormatter = useMemo(() => new Intl.NumberFormat(locale === "vi" ? "vi-VN" : "en-US"), [locale])
  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale === "vi" ? "vi-VN" : "en-US", {
        style: "currency",
        currency: "USD",
      }),
    [locale],
  )
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    [locale],
  )
  const overviewFields = useMemo(
    () => [
      { key: "quantity", label: t("inventory.table.stock"), formatter: (value: number | undefined) => numberFormatter.format(value || 0) },
      { key: "reserved", label: t("inventory.table.reserved"), formatter: (value: number | undefined) => numberFormatter.format(value || 0) },
      { key: "available", label: t("inventory.table.available"), formatter: (value: number | undefined) => numberFormatter.format(value || 0) },
      { key: "incoming", label: t("inventory.table.incoming"), formatter: (value: number | undefined) => numberFormatter.format(value || 0) },
      { key: "inventoryValue", label: t("inventory.table.value"), formatter: (value: number | undefined) => currencyFormatter.format(value || 0) },
      { key: "lowStockThreshold", label: t("inventory.table.warningLabel"), formatter: (value: number | undefined) => numberFormatter.format(value || 0) },
    ],
    [numberFormatter, currencyFormatter, t],
  )
  const enabledVariantId = open ? variantId : undefined
  const { data, isLoading, isFetching } = useInventoryVariantDetail(enabledVariantId)
  const adjustments = data?.adjustments || []
  const variant = useMemo(() => {
    if (!data?.variant) return summary
    const merged: any = { ...data.variant }
    if (summary) {
      merged.product = summary.product || merged.product
      merged.healthStatus = summary.healthStatus || merged.healthStatus
      merged.sku = merged.sku || summary.sku
      merged.color = merged.color || summary.color
      merged.size = merged.size || summary.size
      merged.price = merged.price ?? summary.price
      merged.reserved = merged.reserved ?? summary.reserved
      merged.available = merged.available ?? summary.available
      merged.incoming = merged.incoming ?? summary.incoming
      merged.inventoryValue = merged.inventoryValue ?? summary.inventoryValue
      merged.lowStockThreshold = merged.lowStockThreshold ?? summary.lowStockThreshold
      merged.binLocation = merged.binLocation ?? summary.binLocation
      merged.reorderPoint = merged.reorderPoint ?? summary.reorderPoint
    }
    return merged
  }, [data?.variant, summary]) as InventoryListItem | undefined | null
  const isBusy = isLoading || isFetching
  const health = getHealthConfig(variant?.healthStatus)
  const trendData = useMemo(() => {
    if (!adjustments.length) {
      return variant
        ? [{ date: variant.updatedAt || new Date().toISOString(), quantity: variant.quantity ?? 0 }]
        : []
    }
    return [...adjustments]
      .slice(0, 12)
      .reverse()
      .map((item) => ({
        date: new Date(item.createdAt).toLocaleDateString(locale === "vi" ? "vi-VN" : "en-US", { month: "short", day: "numeric" }),
        quantity: item.quantityAfter ?? 0,
      }))
  }, [adjustments, variant, locale])

  return (
    <Sheet open={open} onOpenChange={(value) => { if (!value) onClose() }}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>{t("inventory.variantDrawer.title")}</SheetTitle>
          <SheetDescription>{t("inventory.variantDrawer.description")}</SheetDescription>
        </SheetHeader>

        <div className="space-y-6 px-4 pb-8">
          {isBusy ? (
            <div className="space-y-3">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : variant ? (
            <>
              <section className="rounded-lg border bg-muted/20 p-4">
                <p className="text-sm text-muted-foreground">{variant.product?.name}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <p className="text-2xl font-semibold">{variant.sku}</p>
                  <Badge variant="outline" className={health.color}>{t(health.labelKey)}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{t("inventory.variantDrawer.colorLabel")}: {variant.color || "--"} · {t("inventory.variantDrawer.sizeLabel")}: {variant.size || "--"}</p>
                <p className="text-sm text-muted-foreground">{t("inventory.variantDrawer.priceLabel")}: {currencyFormatter.format(variant.price || 0)}</p>
              </section>

              <section className="grid gap-3 sm:grid-cols-2">
                {overviewFields.map((field) => (
                  <div key={field.key as string} className="rounded-lg border p-3 text-sm">
                    <p className="text-muted-foreground">{field.label}</p>
                    <p className="text-2xl font-semibold">
                      {field.formatter ? field.formatter((variant as any)?.[field.key]) : numberFormatter.format((variant as any)?.[field.key] || 0)}
                    </p>
                  </div>
                ))}
                {variant.binLocation ? (
                  <div className="rounded-lg border p-3 text-sm">
                    <p className="text-muted-foreground">{t("inventory.variantDrawer.warehouseLocation")}</p>
                    <p className="text-xl font-semibold">{variant.binLocation}</p>
                  </div>
                ) : null}
                {variant.reorderPoint ? (
                  <div className="rounded-lg border p-3 text-sm">
                    <p className="text-muted-foreground">{t("inventory.variantDrawer.reorderPoint")}</p>
                    <p className="text-xl font-semibold">{numberFormatter.format(variant.reorderPoint)}</p>
                  </div>
                ) : null}
              </section>

              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <IconInfoCircle className="text-muted-foreground h-4 w-4" />
                  <p className="text-sm text-muted-foreground">{t("inventory.variantDrawer.lastUpdated")}: {variant.updatedAt ? dateFormatter.format(new Date(variant.updatedAt)) : "--"}</p>
                </div>
                {variant.lowStockThreshold && (variant.quantity || 0) <= variant.lowStockThreshold ? (
                  <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    <IconAlertTriangle className="mt-0.5 h-4 w-4" />
                    {t("inventory.variantDrawer.belowThreshold")}
                  </div>
                ) : null}
              </section>

              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold">{t("inventory.variantDrawer.trendTitle")}</h3>
                  {variant?.sku && (
                    <Button asChild size="sm" variant="outline">
                      <Link to={`/admin/orders?sku=${variant.sku}`}>{t("inventory.variantDrawer.orderHistory")}</Link>
                    </Button>
                  )}
                </div>
                <div className="rounded-lg border p-3">
                  {trendData.length ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={trendData} margin={{ left: -20, right: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                        <Tooltip formatter={(value: number) => numberFormatter.format(value)} />
                        <Line type="monotone" dataKey="quantity" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name={t("inventory.variantDrawer.chartQuantity")} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-sm text-muted-foreground">{t("inventory.variantDrawer.noTrend")}</p>
                  )}
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold">{t("inventory.variantDrawer.adjustmentHistory")}</h3>
                  <p className="text-sm text-muted-foreground">{adjustments.length} {t("inventory.variantDrawer.adjustmentCount")}</p>
                </div>
                <Separator className="my-3" />
                <div className="max-h-72 space-y-3 overflow-y-auto pr-2">
                  {adjustments.length ? (
                    adjustments.map((item: InventoryAdjustment) => {
                      const deltaPositive = item.delta >= 0
                      const reasonKey = item.reason ? `inventory.adjustment.reasonLabels.${item.reason}` : null
                      const reasonLabel = reasonKey ? t(reasonKey) : item.reason?.replace(/_/g, " ") || "manual"
                      return (
                        <div key={item._id} className="rounded-lg border p-3">
                          <div className="flex items-center justify-between">
                            <p className="font-medium">{reasonLabel}</p>
                            <div className={`flex items-center gap-1 text-sm font-semibold ${deltaPositive ? "text-emerald-600" : "text-red-600"}`}>
                              {deltaPositive ? <IconArrowUpRight className="h-4 w-4" /> : <IconArrowDownRight className="h-4 w-4" />}
                              {deltaPositive ? "+" : "-"}
                              {numberFormatter.format(Math.abs(item.delta))}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">{dateFormatter.format(new Date(item.createdAt))}</p>
                          {item.note ? <p className="text-sm">{item.note}</p> : null}
                        </div>
                      )
                    })
                  ) : (
                    <p className="text-sm text-muted-foreground">{t("inventory.variantDrawer.notePlaceholder")}</p>
                  )}
                </div>
              </section>
            </>
          ) : (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              {t("inventory.variantDrawer.noSelection")}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
