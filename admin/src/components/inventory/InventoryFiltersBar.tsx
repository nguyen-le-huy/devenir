import { useMemo } from "react"
import { IconFilter, IconRefresh, IconSearch, IconX } from "@tabler/icons-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCategoriesQuery } from "@/hooks/useCategoriesQuery"
import { useBrandsQuery } from "@/hooks/useBrandsQuery"
import { useLocale } from "@/contexts/LocaleContext"

interface InventoryFiltersBarProps {
	search: string
	onSearchChange: (value: string) => void
	category: string
	onCategoryChange: (value: string) => void
	brand: string
	onBrandChange: (value: string) => void
	stockStatus: string
	onStockStatusChange: (value: string) => void
	productStatus: string
	onProductStatusChange: (value: string) => void
	onRefresh?: () => void
	onReset?: () => void
	isRefreshing?: boolean
}

type NamedEntity = { _id: string; name: string }

export default function InventoryFiltersBar({
	search,
	onSearchChange,
	category,
	onCategoryChange,
	brand,
	onBrandChange,
	stockStatus,
	onStockStatusChange,
	productStatus,
	onProductStatusChange,
	onRefresh,
	onReset,
	isRefreshing,
}: InventoryFiltersBarProps) {
	const { t } = useLocale()
	const { data: categories } = useCategoriesQuery()
	const { data: brandsResponse } = useBrandsQuery({ limit: 100, isActive: true })

	const stockStatusOptions = useMemo(() => ([
		{ value: "all", label: t("inventory.filters.stockStatus.all") },
		{ value: "healthy", label: t("inventory.filters.stockStatus.healthy") },
		{ value: "low-stock", label: t("inventory.filters.stockStatus.low") },
		{ value: "out-of-stock", label: t("inventory.filters.stockStatus.out") },
		{ value: "overstock", label: t("inventory.filters.stockStatus.over") },
	]), [t])

	const productStatusOptions = useMemo(() => ([
		{ value: "all", label: t("inventory.filters.productStatus.all") },
		{ value: "published", label: t("inventory.filters.productStatus.published") },
		{ value: "draft", label: t("inventory.filters.productStatus.draft") },
		{ value: "archived", label: t("inventory.filters.productStatus.archived") },
	]), [t])

	const normalizedCategories = useMemo<NamedEntity[]>(() => {
		if (!categories) return []
		return (categories as NamedEntity[])
			.filter((item) => item?._id && item?.name)
			.map((item) => ({ _id: item._id, name: item.name }))
	}, [categories])

	const normalizedBrands = useMemo<NamedEntity[]>(() => {
		if (!brandsResponse) return []
		const list = Array.isArray(brandsResponse) ? brandsResponse : brandsResponse.data ?? []
		return (list as NamedEntity[])
			.filter((item) => item?._id && item?.name)
			.map((item) => ({ _id: item._id, name: item.name }))
	}, [brandsResponse])

	const categoryOptions = useMemo(() => {
		return [{ _id: "all", name: t("inventory.filters.categoryAll") }, ...normalizedCategories]
	}, [normalizedCategories, t])

	const brandOptions = useMemo(() => {
		return [{ _id: "all", name: t("inventory.filters.brandAll") }, ...normalizedBrands]
	}, [normalizedBrands, t])

	const handleReset = () => {
		onSearchChange("")
		onCategoryChange("all")
		onBrandChange("all")
		onStockStatusChange("all")
		onProductStatusChange("all")
		onReset?.()
	}

	return (
		<div className="flex flex-col gap-3 lg:flex-row lg:items-end">
			<div className="flex flex-1 flex-col gap-3 md:flex-row">
				<div className="relative w-full md:max-w-sm">
					<IconSearch className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
					<Input
						value={search}
						onChange={(event) => onSearchChange(event.target.value)}
						placeholder={t("inventory.filters.searchPlaceholder")}
						className="pl-9"
					/>
					{search && (
						<button
							type="button"
							className="text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2"
							onClick={() => onSearchChange("")}
						>
							<IconX className="h-4 w-4" />
						</button>
					)}
				</div>

				<Select value={stockStatus} onValueChange={onStockStatusChange}>
					<SelectTrigger className="md:max-w-[200px]">
						<SelectValue placeholder={t("inventory.filters.stockPlaceholder")} />
					</SelectTrigger>
					<SelectContent>
						{stockStatusOptions.map((option) => (
							<SelectItem key={option.value} value={option.value}>
								{option.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				<Select value={productStatus} onValueChange={onProductStatusChange}>
					<SelectTrigger className="md:max-w-[200px]">
						<SelectValue placeholder={t("inventory.filters.productPlaceholder")} />
					</SelectTrigger>
					<SelectContent>
						{productStatusOptions.map((option) => (
							<SelectItem key={option.value} value={option.value}>
								{option.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<div className="flex flex-col gap-3 md:flex-row md:items-center">
				<Select value={category} onValueChange={onCategoryChange}>
					<SelectTrigger className="md:w-[200px]">
						<SelectValue placeholder={t("inventory.filters.categoryPlaceholder")} />
					</SelectTrigger>
					<SelectContent className="max-h-72">
						{categoryOptions.map((option) => (
							<SelectItem key={option._id} value={option._id}>
								{option.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				<Select value={brand} onValueChange={onBrandChange}>
					<SelectTrigger className="md:w-[200px]">
						<SelectValue placeholder={t("inventory.filters.brandPlaceholder")} />
					</SelectTrigger>
					<SelectContent className="max-h-72">
						{brandOptions.map((option) => (
							<SelectItem key={option._id} value={option._id}>
								{option.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				<div className="flex gap-2">
					<Button variant="outline" onClick={handleReset}>
						<IconFilter className="mr-2 h-4 w-4" />
						{t("inventory.filters.reset")}
					</Button>
					<Button variant="secondary" onClick={onRefresh} disabled={isRefreshing}>
						<IconRefresh className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
						{t("inventory.filters.refresh")}
					</Button>
				</div>
			</div>
		</div>
	)
}
