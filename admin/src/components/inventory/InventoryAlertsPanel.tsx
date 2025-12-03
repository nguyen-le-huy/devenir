import type { ReactNode } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { IconAlertTriangle, IconBoxSeam, IconRefresh, IconShieldHalf } from "@tabler/icons-react"
import type { InventoryAlertsResponse } from "@/hooks/useInventory"
import { useMemo } from "react"
import { useLocale } from "@/contexts/LocaleContext"

const ALERT_TABS: Array<{ key: keyof InventoryAlertsResponse; labelKey: string; descriptionKey: string; icon: ReactNode; badge: { labelKey: string; color: string } }> = [
  { key: "lowStock", labelKey: "inventory.alerts.tabs.lowStock", descriptionKey: "inventory.alerts.tabDescriptions.lowStock", icon: <IconAlertTriangle className="h-4 w-4" />, badge: { labelKey: "inventory.alerts.badges.low", color: "bg-amber-100 text-amber-700" } },
  { key: "outOfStock", labelKey: "inventory.alerts.tabs.outOfStock", descriptionKey: "inventory.alerts.tabDescriptions.outOfStock", icon: <IconBoxSeam className="h-4 w-4" />, badge: { labelKey: "inventory.alerts.badges.out", color: "bg-red-100 text-red-700" } },
  { key: "overstock", labelKey: "inventory.alerts.tabs.overstock", descriptionKey: "inventory.alerts.tabDescriptions.overstock", icon: <IconShieldHalf className="h-4 w-4" />, badge: { labelKey: "inventory.alerts.badges.over", color: "bg-blue-100 text-blue-700" } },
  { key: "reservationIssues", labelKey: "inventory.alerts.tabs.reservationIssues", descriptionKey: "inventory.alerts.tabDescriptions.reservationIssues", icon: <IconAlertTriangle className="h-4 w-4" />, badge: { labelKey: "inventory.alerts.badges.reservation", color: "bg-purple-100 text-purple-700" } },
]

function AlertList({
  items,
  badge,
  numberFormatter,
  t,
}: {
  items: InventoryAlertsResponse[keyof InventoryAlertsResponse] | undefined
  badge: { labelKey: string; color: string }
  numberFormatter: Intl.NumberFormat
  t: (key: string) => string
}) {
  if (!items || items.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("inventory.alerts.emptyGroup")}</p>
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item._id} className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <p className="font-semibold">{item.product?.name}</p>
            <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>
            <p className="text-xs text-muted-foreground">{t("inventory.adjustment.currentStock")}: {numberFormatter.format(item.quantity || 0)} · {t("inventory.adjustment.reserved")}: {numberFormatter.format(item.reserved || 0)}</p>
          </div>
          <Badge variant="outline" className={badge.color}>{t(badge.labelKey)}</Badge>
        </div>
      ))}
    </div>
  )
}

interface InventoryAlertsPanelProps {
  data?: InventoryAlertsResponse
  loading?: boolean
  refreshing?: boolean
  onRefresh?: () => void
}

export default function InventoryAlertsPanel({ data, loading, refreshing, onRefresh }: InventoryAlertsPanelProps) {
  const { t, locale } = useLocale()
  const numberFormatter = useMemo(() => new Intl.NumberFormat(locale === "vi" ? "vi-VN" : "en-US"), [locale])
  const handleRefresh = () => {
    onRefresh?.()
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <CardTitle>{t("inventory.alerts.panelTitle")}</CardTitle>
          <p className="text-sm text-muted-foreground">{t("inventory.alerts.panelDescription")}</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
          <IconRefresh className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} /> {t("inventory.alerts.panelRefresh")}
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, idx) => (
              <Skeleton key={idx} className="h-16 w-full" />
            ))}
          </div>
        ) : (
          <Tabs defaultValue="lowStock" className="space-y-4">
            <TabsList className="flex flex-wrap gap-2">
              {ALERT_TABS.map((tab) => (
                <TabsTrigger key={tab.key} value={tab.key} className="flex items-center gap-2">
                  {tab.icon}
                  {t(tab.labelKey)}
                  <Badge variant="secondary">
                    {numberFormatter.format(data?.[tab.key]?.length || 0)}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>
            {ALERT_TABS.map((tab) => (
              <TabsContent key={tab.key} value={tab.key} className="space-y-2">
                <p className="text-sm text-muted-foreground">{t(tab.descriptionKey)}</p>
                <AlertList items={data?.[tab.key]} badge={tab.badge} numberFormatter={numberFormatter} t={t} />
              </TabsContent>
            ))}
          </Tabs>
        )}
      </CardContent>
    </Card>
  )
}
