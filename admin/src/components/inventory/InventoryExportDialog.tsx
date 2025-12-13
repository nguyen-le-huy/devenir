import { useState, useMemo, useCallback } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { IconDownload, IconLoader2, IconFileSpreadsheet, IconAlertCircle } from "@tabler/icons-react"
import { useLocale } from "@/contexts/LocaleContext"
import { toast } from "sonner"
import axiosInstance from "@/services/axiosConfig"

interface ExportOptions {
    fileType: "csv" | "excel"
    columns: string[]
    reportType: "all" | "top_value" | "needs_restock" | "slow_moving" | "custom"
    filters: {
        statusFilters?: {
            stockStatus?: string[]
            hasWarning?: boolean
        }
        quantityFilters?: {
            availableOnly?: boolean
        }
    }
    sorting: {
        field: "inventory" | "available" | "totalValue" | "unitPrice" | "lastUpdated"
        order: "asc" | "desc"
    }
}

interface InventoryExportDialogProps {
    open: boolean
    onClose: () => void
}

const defaultColumns = [
    { id: "sku", label: "SKU", checked: true },
    { id: "productName", label: "Tên Sản Phẩm", checked: true },
    { id: "attributes", label: "Thuộc Tính (Màu, Size)", checked: true },
    { id: "inventory", label: "Tồn Kho", checked: true },
    { id: "available", label: "Khả Dụng", checked: true },
    { id: "onHold", label: "Đang Giữ", checked: false },
    { id: "incoming", label: "Đang Nhập", checked: false },
    { id: "unitPrice", label: "Giá Đơn Vị (US$)", checked: true },
    { id: "totalValue", label: "Tổng Giá Trị (US$)", checked: true },
    { id: "status", label: "Trạng Thái", checked: true },
    { id: "warningLevel", label: "Mức Cảnh Báo", checked: false },
    { id: "lastUpdated", label: "Cập Nhật Cuối", checked: false },
]

const reportTypes = [
    { value: "all", label: "Tất Cả Sản Phẩm" },
    { value: "top_value", label: "Top Sản Phẩm Giá Trị Cao" },
    { value: "needs_restock", label: "Cần Nhập Thêm Hàng" },
    { value: "slow_moving", label: "Hàng Tồn Lâu (>90 ngày)" },
    { value: "custom", label: "Tùy Chỉnh" },
]

const sortFields = [
    { value: "lastUpdated", label: "Ngày Cập Nhật" },
    { value: "inventory", label: "Số Lượng Tồn Kho" },
    { value: "available", label: "Số Lượng Khả Dụng" },
    { value: "totalValue", label: "Tổng Giá Trị" },
    { value: "unitPrice", label: "Giá Đơn Vị" },
]

export default function InventoryExportDialog({ open, onClose }: InventoryExportDialogProps) {
    const { t } = useLocale()
    const [isExporting, setIsExporting] = useState(false)
    const [fileType, setFileType] = useState<"csv" | "excel">("csv")
    const [reportType, setReportType] = useState<ExportOptions["reportType"]>("all")
    const [sortField, setSortField] = useState<ExportOptions["sorting"]["field"]>("lastUpdated")
    const [sortOrder, setSortOrder] = useState<ExportOptions["sorting"]["order"]>("desc")
    const [columns, setColumns] = useState(() =>
        defaultColumns.map(col => ({ ...col }))
    )

    // Filters for custom report
    const [filterLowStock, setFilterLowStock] = useState(false)
    const [filterOutOfStock, setFilterOutOfStock] = useState(false)
    const [filterAvailableOnly, setFilterAvailableOnly] = useState(false)

    const selectedColumns = useMemo(
        () => columns.filter(col => col.checked).map(col => col.id),
        [columns]
    )

    const handleColumnToggle = useCallback((columnId: string) => {
        setColumns(prev =>
            prev.map(col =>
                col.id === columnId ? { ...col, checked: !col.checked } : col
            )
        )
    }, [])

    const handleSelectAllColumns = useCallback(() => {
        const allChecked = columns.every(col => col.checked)
        setColumns(prev => prev.map(col => ({ ...col, checked: !allChecked })))
    }, [columns])

    const handleExport = async () => {
        if (selectedColumns.length === 0) {
            toast.error("Vui lòng chọn ít nhất một cột dữ liệu")
            return
        }

        setIsExporting(true)

        try {
            const exportOptions: ExportOptions = {
                fileType,
                columns: selectedColumns,
                reportType,
                filters: {},
                sorting: {
                    field: sortField,
                    order: sortOrder,
                },
            }

            // Build filters for custom report type
            if (reportType === "custom") {
                const stockStatus: string[] = []
                if (filterLowStock) stockStatus.push("low_stock")
                if (filterOutOfStock) stockStatus.push("out_of_stock")

                if (stockStatus.length > 0) {
                    exportOptions.filters.statusFilters = { stockStatus }
                }

                if (filterAvailableOnly) {
                    exportOptions.filters.quantityFilters = { availableOnly: true }
                }
            }

            const response = await axiosInstance.post("/admin/inventory/export", exportOptions, {
                responseType: "blob",
            })

            // Check if response is an error (JSON)
            if (response.data.type === "application/json") {
                const text = await response.data.text()
                const errorData = JSON.parse(text)
                if (!errorData.success) {
                    throw new Error(errorData.error?.message || "Export failed")
                }
            }

            // Create download link
            const blob = new Blob([response.data], { type: "text/csv;charset=utf-8" })
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement("a")

            // Generate filename based on reportType
            const reportTypeNames: Record<string, string> = {
                all: "tat_ca_san_pham",
                top_value: "top_gia_tri_cao",
                needs_restock: "can_nhap_them",
                slow_moving: "hang_ton_lau",
                custom: "loc_tuy_chinh",
            }
            const now = new Date()
            const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "")
            const timeStr = now.toTimeString().slice(0, 5).replace(":", "")
            const filename = `baocao_kho_${reportTypeNames[reportType] || "all"}_${dateStr}_${timeStr}.csv`

            link.href = url
            link.setAttribute("download", filename)
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)

            toast.success("Xuất báo cáo thành công!", {
                description: `File ${filename} đã được tải xuống`,
            })

            onClose()
        } catch (error) {
            console.error("Export error:", error)
            toast.error("Xuất báo cáo thất bại", {
                description: error instanceof Error ? error.message : "Vui lòng thử lại",
            })
        } finally {
            setIsExporting(false)
        }
    }

    const handleClose = () => {
        if (!isExporting) {
            onClose()
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <IconFileSpreadsheet className="h-5 w-5" />
                        {t("inventory.export.title") || "Xuất Báo Cáo Kho Hàng"}
                    </DialogTitle>
                    <DialogDescription>
                        {t("inventory.export.description") || "Chọn định dạng file và các cột dữ liệu cần xuất"}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* File Type Selection */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Định Dạng File</Label>
                        <div className="flex gap-3">
                            <Button
                                type="button"
                                variant={fileType === "csv" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setFileType("csv")}
                                className="flex-1"
                            >
                                CSV
                            </Button>
                            <Button
                                type="button"
                                variant={fileType === "excel" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setFileType("excel")}
                                className="flex-1"
                            >
                                Excel (CSV + Summary)
                            </Button>
                        </div>
                    </div>

                    {/* Report Type Selection */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Loại Báo Cáo</Label>
                        <Select
                            value={reportType}
                            onValueChange={(value) => setReportType(value as ExportOptions["reportType"])}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {reportTypes.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                        {type.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Custom Filters - Only show when reportType is "custom" */}
                    {reportType === "custom" && (
                        <div className="space-y-3 rounded-lg border p-4 bg-muted/30">
                            <Label className="text-sm font-medium flex items-center gap-2">
                                <IconAlertCircle className="h-4 w-4" />
                                Bộ Lọc Tùy Chỉnh
                            </Label>
                            <div className="grid grid-cols-2 gap-3">
                                <label className="flex items-center gap-2 text-sm cursor-pointer">
                                    <Checkbox
                                        checked={filterLowStock}
                                        onCheckedChange={(checked) => setFilterLowStock(checked === true)}
                                    />
                                    <span>Sản phẩm sắp hết</span>
                                </label>
                                <label className="flex items-center gap-2 text-sm cursor-pointer">
                                    <Checkbox
                                        checked={filterOutOfStock}
                                        onCheckedChange={(checked) => setFilterOutOfStock(checked === true)}
                                    />
                                    <span>Hết hàng</span>
                                </label>
                                <label className="flex items-center gap-2 text-sm cursor-pointer">
                                    <Checkbox
                                        checked={filterAvailableOnly}
                                        onCheckedChange={(checked) => setFilterAvailableOnly(checked === true)}
                                    />
                                    <span>Chỉ sản phẩm còn hàng</span>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Sorting */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Sắp Xếp Theo</Label>
                            <Select
                                value={sortField}
                                onValueChange={(value) => setSortField(value as ExportOptions["sorting"]["field"])}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {sortFields.map((field) => (
                                        <SelectItem key={field.value} value={field.value}>
                                            {field.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Thứ Tự</Label>
                            <Select
                                value={sortOrder}
                                onValueChange={(value) => setSortOrder(value as "asc" | "desc")}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="desc">Giảm Dần</SelectItem>
                                    <SelectItem value="asc">Tăng Dần</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Column Selection */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">Cột Dữ Liệu Xuất</Label>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={handleSelectAllColumns}
                                className="text-xs h-7"
                            >
                                {columns.every(col => col.checked) ? "Bỏ Chọn Tất Cả" : "Chọn Tất Cả"}
                            </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 rounded-lg border p-4">
                            {columns.map((column) => (
                                <label
                                    key={column.id}
                                    className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 p-1 rounded"
                                >
                                    <Checkbox
                                        checked={column.checked}
                                        onCheckedChange={() => handleColumnToggle(column.id)}
                                    />
                                    <span>{column.label}</span>
                                </label>
                            ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Đã chọn {selectedColumns.length}/{columns.length} cột
                        </p>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={handleClose} disabled={isExporting}>
                        Hủy
                    </Button>
                    <Button onClick={handleExport} disabled={isExporting || selectedColumns.length === 0}>
                        {isExporting ? (
                            <>
                                <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                                Đang Xuất...
                            </>
                        ) : (
                            <>
                                <IconDownload className="mr-2 h-4 w-4" />
                                Xuất Báo Cáo
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
