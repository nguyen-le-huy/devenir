import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { MetricCard } from "@/components/common/Stats/MetricCard"
import type { InventoryOverviewResponse, InventoryAdjustment } from "@/hooks/useInventory"
import { IconArrowDownRight, IconArrowUpRight, IconPackageExport } from "@tabler/icons-react"
import { useLocale } from "@/contexts/LocaleContext"
import { useMemo } from "react"

type TranslateFn = (key: string, fallback?: string) => string

interface InventorySummaryCardsProps {
	overview?: InventoryOverviewResponse
	loading?: boolean
}

function AdjustmentRow({ item, numberFormatter, t }: { item: InventoryAdjustment; numberFormatter: Intl.NumberFormat; t: TranslateFn }) {
	const isOutbound = item.delta < 0
	const icon = isOutbound ? <IconArrowDownRight className="h-4 w-4 text-red-500" /> : <IconArrowUpRight className="h-4 w-4 text-emerald-500" />
	const quantity = numberFormatter.format(Math.abs(item.delta))
	const fallbackReason = item.reason ? item.reason.replace(/_/g, " ") : t("inventory.adjustment.reasonLabels.manual", "manual")
	const reasonKey = item.reason ? `inventory.adjustment.reasonLabels.${item.reason}` : "inventory.adjustment.reasonLabels.manual"
	const reasonLabel = t(reasonKey, fallbackReason)

	return (
		<div className="flex items-start justify-between rounded-lg border p-3 text-sm">
			<div>
				<div className="font-medium">{item.sku}</div>
				<p className="text-muted-foreground">
					{reasonLabel}
					{item.performedByName ? ` - ${item.performedByName}` : ""}
				</p>
			</div>
			<div className="flex items-center gap-2">
				{icon}
				<span className={`font-semibold ${isOutbound ? "text-red-600" : "text-emerald-600"}`}>
					{isOutbound ? "-" : "+"}
					{quantity}
				</span>
			</div>
		</div>
	)
}

export function InventorySummaryCards({ overview, loading }: InventorySummaryCardsProps) {
	const { t, locale } = useLocale()
	const numberFormatter = useMemo(() => new Intl.NumberFormat(locale === "vi" ? "vi-VN" : "en-US"), [locale])
	const currencyFormatter = useMemo(() => new Intl.NumberFormat(locale === "vi" ? "vi-VN" : "en-US", {
		style: "currency",
		currency: "USD",
		minimumFractionDigits: 0,
		maximumFractionDigits: 2,
	}), [locale])
	const metrics = useMemo(() => ([
		{
			title: t("inventory.summary.totalValue"),
			value: overview ? currencyFormatter.format(overview.totalValue || 0) : "--",
			trend: "up" as const,
		},
		{
			title: t("inventory.summary.totalSkus"),
			value: overview ? numberFormatter.format(overview.totalSkus || 0) : "--",
		},
		{
			title: t("inventory.summary.alertSkus"),
			value: overview ? numberFormatter.format((overview.lowStockCount || 0) + (overview.outOfStockCount || 0)) : "--",
			trend: "down" as const,
		},
		{
			title: t("inventory.summary.reservedUnits"),
			value: overview ? numberFormatter.format(overview.reservedUnits || 0) : "--",
		},
	]), [currencyFormatter, numberFormatter, overview, t])
	const recentAdjustments = overview?.recentAdjustments?.slice(0, 4) || []

	return (
		<div className="space-y-4">
			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				{metrics.map((metric) => (
					<MetricCard key={metric.title} title={metric.title} value={metric.value} trend={metric.trend} />
				))}
			</div>

			<div className="grid gap-4 lg:grid-cols-3">
				<Card className="lg:col-span-2">
					<CardHeader>
						<CardTitle>{t("inventory.summary.performanceTitle")}</CardTitle>
					</CardHeader>
					<CardContent>
						{loading ? (
							<div className="grid gap-4 sm:grid-cols-2">
								{Array.from({ length: 4 }).map((_, idx) => (
									<Skeleton key={idx} className="h-16 w-full" />
								))}
							</div>
						) : (
							<dl className="grid gap-4 sm:grid-cols-2">
								<div className="rounded-lg border p-4">
									<dt className="text-sm text-muted-foreground">{t("inventory.summary.turnover")}</dt>
									<dd className="text-2xl font-semibold">{overview?.turnoverRate ? overview.turnoverRate.toFixed(2) : "--"}</dd>
								</div>
								<div className="rounded-lg border p-4">
									<dt className="text-sm text-muted-foreground">{t("inventory.summary.daysOfSupply")}</dt>
									<dd className="text-2xl font-semibold">{overview?.daysOfSupply ? overview.daysOfSupply.toFixed(0) : "--"}</dd>
								</div>
								<div className="rounded-lg border p-4">
									<dt className="text-sm text-muted-foreground">{t("inventory.summary.inTransit")}</dt>
									<dd className="text-2xl font-semibold">{numberFormatter.format(overview?.incomingUnits || 0)}</dd>
								</div>
								<div className="rounded-lg border p-4">
									<dt className="text-sm text-muted-foreground">{t("inventory.summary.reserved")}</dt>
									<dd className="text-2xl font-semibold">{numberFormatter.format(overview?.reservedUnits || 0)}</dd>
								</div>
							</dl>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>{t("inventory.summary.adjustmentsTitle")}</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						{loading ? (
							Array.from({ length: 4 }).map((_, idx) => <Skeleton key={idx} className="h-12 w-full" />)
						) : recentAdjustments.length ? (
							<div className="max-h-60 space-y-3 overflow-y-auto pr-2">
								{recentAdjustments.map((item) => (
									<AdjustmentRow key={item._id} item={item} numberFormatter={numberFormatter} t={t} />
								))}
							</div>
						) : (
							<div className="text-sm text-muted-foreground">{t("inventory.summary.noAdjustments")}</div>
						)}
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<div>
						<CardTitle>{t("inventory.summary.distributionTitle")}</CardTitle>
						<p className="text-sm text-muted-foreground">{t("inventory.summary.distributionDescription")}</p>
					</div>
					<Badge variant="outline" className="flex items-center gap-2">
						<IconPackageExport className="h-4 w-4" />
						{numberFormatter.format(overview?.totalUnits || 0)} {t("inventory.summary.totalProducts")}
					</Badge>
				</CardHeader>
				<CardContent>
					{loading ? (
						<Skeleton className="h-32 w-full" />
					) : (
						<dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
							<div className="rounded-lg border p-4">
								<dt className="text-sm text-muted-foreground">{t("inventory.summary.outOfStock")}</dt>
								<dd className="text-2xl font-semibold text-red-600">{numberFormatter.format(overview?.outOfStockCount || 0)}</dd>
							</div>
							<div className="rounded-lg border p-4">
								<dt className="text-sm text-muted-foreground">{t("inventory.summary.lowStock")}</dt>
								<dd className="text-2xl font-semibold text-amber-600">{numberFormatter.format(overview?.lowStockCount || 0)}</dd>
							</div>
							<div className="rounded-lg border p-4">
								<dt className="text-sm text-muted-foreground">{t("inventory.summary.healthy")}</dt>
								<dd className="text-2xl font-semibold text-emerald-600">
									{numberFormatter.format(
										(overview?.totalSkus || 0) - (overview?.lowStockCount || 0) - (overview?.outOfStockCount || 0)
									)}
								</dd>
							</div>
							<div className="rounded-lg border p-4">
								<dt className="text-sm text-muted-foreground">{t("inventory.summary.incoming")}</dt>
								<dd className="text-2xl font-semibold text-blue-600">{numberFormatter.format(overview?.incomingUnits || 0)}</dd>
							</div>
						</dl>
					)}
				</CardContent>
			</Card>
		</div>
	)
}

export default InventorySummaryCards
