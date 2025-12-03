import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import type { InventoryListItem, InventoryListResponse } from "@/hooks/useInventory"
import { IconAlertTriangle, IconArrowLeft, IconArrowRight, IconClipboardList, IconPencil } from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import { getHealthConfig } from "@/components/inventory/constants"
import { useLocale } from "@/contexts/LocaleContext"

interface InventoryTableProps {
	items: InventoryListItem[]
	loading?: boolean
	pagination?: InventoryListResponse["pagination"]
	onPageChange?: (page: number) => void
	onAdjust?: (item: InventoryListItem) => void
	onInspect?: (item: InventoryListItem) => void
}


interface EmptyStateProps {
	title: string
	description: string
}

function EmptyState({ title, description }: EmptyStateProps) {
	return (
		<div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
			<IconClipboardList className="text-muted-foreground h-10 w-10" />
			<div>
				<p className="font-semibold">{title}</p>
				<p className="text-muted-foreground text-sm">{description}</p>
			</div>
		</div>
	)
}

const formatTemplate = (template: string, values: Record<string, string | number>) =>
	Object.entries(values).reduce((acc, [key, value]) => acc.replace(new RegExp(`\\{${key}\\}`, "g"), String(value)), template)

export default function InventoryTable({ items, loading, pagination, onPageChange, onAdjust, onInspect }: InventoryTableProps) {
	const { t, locale } = useLocale()
	const numberFormatter = useMemo(() => new Intl.NumberFormat(locale === "vi" ? "vi-VN" : "en-US"), [locale])
	const currencyFormatter = useMemo(
		() =>
			new Intl.NumberFormat(locale === "vi" ? "vi-VN" : "en-US", {
				style: "currency",
				currency: "USD",
				minimumFractionDigits: 0,
				maximumFractionDigits: 2,
			}),
		[locale],
	)
	const renderRows = () => {
		if (loading) {
			return Array.from({ length: 10 }).map((_, idx) => (
				<TableRow key={`skeleton-${idx}`}>
					{Array.from({ length: 7 }).map((__, cellIdx) => (
						<TableCell key={cellIdx}>
							<Skeleton className="h-4 w-full" />
						</TableCell>
					))}
				</TableRow>
			))
		}

		if (!items.length) {
			return (
				<TableRow>
					<TableCell colSpan={7}>
						<EmptyState title={t("inventory.table.emptyTitle")} description={t("inventory.table.emptyDescription")} />
					</TableCell>
				</TableRow>
			)
		}

		return items.map((item) => {
			const health = getHealthConfig(item.healthStatus)
			return (
				<TableRow key={item._id} className="hover:bg-muted/40">
					<TableCell className="font-medium">
						<div className="flex flex-col">
							<span>{item.product?.name}</span>
							<span className="text-muted-foreground text-xs">{t("inventory.table.skuLabel")}: {item.sku}</span>
						</div>
					</TableCell>
					<TableCell>
						<div className="flex flex-col">
							<span>{item.color || "--"}</span>
							<span className="text-muted-foreground text-xs">{t("inventory.table.size")}: {item.size || "N/A"}</span>
						</div>
					</TableCell>
					<TableCell>
						<div className="font-semibold">{numberFormatter.format(item.quantity ?? 0)}</div>
						<p className="text-muted-foreground text-xs">{t("inventory.table.reserved")}: {numberFormatter.format(item.reserved ?? 0)}</p>
					</TableCell>
					<TableCell>
						<div className="font-semibold text-emerald-600">{numberFormatter.format(item.available ?? 0)}</div>
						<p className="text-muted-foreground text-xs">{t("inventory.table.incoming")}: {numberFormatter.format(item.incoming ?? 0)}</p>
					</TableCell>
					<TableCell>
						<div className="font-semibold">{currencyFormatter.format(item.inventoryValue || 0)}</div>
						<p className="text-muted-foreground text-xs">{t("inventory.table.price")}: {currencyFormatter.format(item.price || 0)}</p>
					</TableCell>
					<TableCell>
						<Badge variant="outline" className={cn("capitalize", health.color)}>
							{t(health.labelKey)}
						</Badge>
						{item.lowStockThreshold && item.quantity <= item.lowStockThreshold && (
							<p className="text-destructive flex items-center gap-1 text-xs">
								<IconAlertTriangle className="h-3.5 w-3.5" /> {t("inventory.table.warningLabel")}: {numberFormatter.format(item.lowStockThreshold)}
							</p>
						)}
					</TableCell>
					<TableCell className="text-right">
						<div className="flex justify-end gap-2">
							<Button size="sm" variant="outline" onClick={() => onInspect?.(item)}>
								{t("inventory.table.details")}
							</Button>
							<Button size="sm" onClick={() => onAdjust?.(item)}>
								<IconPencil className="mr-1 h-4 w-4" /> {t("inventory.table.adjust")}
							</Button>
						</div>
					</TableCell>
				</TableRow>
			)
		})
	}

	const currentPage = pagination?.page || 1
	const totalPages = pagination?.pages || 1
	const pageLimit = pagination?.limit || 20
	const startIndex = (currentPage - 1) * pageLimit + 1
	const endIndex = Math.min(currentPage * pageLimit, pagination?.total || 0)
	const paginationSummary =
		pagination && pagination.total > 0
			? formatTemplate(t("inventory.table.paginationSummary"), {
				start: numberFormatter.format(startIndex),
				end: numberFormatter.format(endIndex),
				total: numberFormatter.format(pagination.total),
			})
			: ""
	const paginationPageLabel = formatTemplate(t("inventory.table.paginationPage"), {
		current: numberFormatter.format(currentPage),
		total: numberFormatter.format(totalPages),
	})

	return (
		<div className="space-y-4">
			<div className="overflow-x-auto">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>{t("inventory.table.product")}</TableHead>
							<TableHead>{t("inventory.table.attributes")}</TableHead>
							<TableHead>{t("inventory.table.stock")}</TableHead>
							<TableHead>{t("inventory.table.available")}</TableHead>
							<TableHead>{t("inventory.table.value")}</TableHead>
							<TableHead>{t("inventory.table.status")}</TableHead>
							<TableHead className="text-right">{t("inventory.table.actions")}</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>{renderRows()}</TableBody>
				</Table>
			</div>

			{pagination && pagination.total > 0 && (
				<div className="flex flex-col gap-3 rounded-lg border bg-card p-3 text-sm md:flex-row md:items-center md:justify-between">
					<div>{paginationSummary}</div>
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => onPageChange?.(currentPage - 1)}
							disabled={currentPage <= 1}
						>
							<IconArrowLeft className="mr-1 h-4 w-4" /> {t("inventory.table.previous")}
						</Button>
						<span>{paginationPageLabel}</span>
						<Button
							variant="outline"
							size="sm"
							onClick={() => onPageChange?.(currentPage + 1)}
							disabled={currentPage >= totalPages}
						>
							{t("inventory.table.next")} <IconArrowRight className="ml-1 h-4 w-4" />
						</Button>
					</div>
				</div>
			)}
		</div>
	)
}
