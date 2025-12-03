import { useMemo } from "react"
import { AdminLayout } from "@/layouts/AdminLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { IconRefresh } from "@tabler/icons-react"
import { MetricCard } from "@/components/metric-card"
import InventoryAlertsPanel from "@/components/inventory/InventoryAlertsPanel"
import { useInventoryAlerts } from "@/hooks/useInventory"
import { useLocale } from "@/contexts/LocaleContext"

export default function InventoryAlertsPage() {
  const { data, isLoading, isFetching, refetch } = useInventoryAlerts()
  const { t, locale } = useLocale()
  const numberFormatter = useMemo(() => new Intl.NumberFormat(locale === "vi" ? "vi-VN" : "en-US"), [locale])
  const totalAlerts = (data?.lowStock?.length || 0) + (data?.outOfStock?.length || 0) + (data?.overstock?.length || 0) + (data?.reservationIssues?.length || 0)

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{t("inventory.alerts.subtitle")}</p>
            <h1 className="text-3xl font-bold tracking-tight">{t("inventory.alerts.pageTitle")}</h1>
          </div>
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <IconRefresh className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} /> {t("inventory.alerts.refresh")}
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard title={t("inventory.alerts.total")} value={numberFormatter.format(totalAlerts)} trend="up" />
          <MetricCard title={t("inventory.alerts.low")} value={numberFormatter.format(data?.lowStock?.length || 0)} trend="neutral" />
          <MetricCard title={t("inventory.alerts.out")} value={numberFormatter.format(data?.outOfStock?.length || 0)} trend="down" />
          <MetricCard title={t("inventory.alerts.over")} value={numberFormatter.format(data?.overstock?.length || 0)} trend="up" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("inventory.alerts.guidanceTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border p-3 text-sm">
              <p className="font-semibold">{t("inventory.alerts.tabs.lowStock")}</p>
              <p className="text-muted-foreground">{t("inventory.alerts.guidanceLow")}</p>
            </div>
            <div className="rounded-lg border p-3 text-sm">
              <p className="font-semibold">{t("inventory.alerts.tabs.outOfStock")}</p>
              <p className="text-muted-foreground">{t("inventory.alerts.guidanceOut")}</p>
            </div>
            <div className="rounded-lg border p-3 text-sm">
              <p className="font-semibold">{t("inventory.alerts.tabs.overstock")}</p>
              <p className="text-muted-foreground">{t("inventory.alerts.guidanceOver")}</p>
            </div>
          </CardContent>
        </Card>

        <InventoryAlertsPanel data={data} loading={isLoading} refreshing={isFetching} onRefresh={() => refetch()} />
      </div>
    </AdminLayout>
  )
}
