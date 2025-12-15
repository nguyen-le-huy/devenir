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
import { IconDownload, IconLoader2, IconFileSpreadsheet } from "@tabler/icons-react"
import { toast } from "sonner"
import axiosInstance from "@/services/axiosConfig"

interface ExportOptions {
    fileType: "csv" | "excel"
    columns: string[]
    reportType: "all" | "pending" | "paid" | "shipped" | "delivered" | "cancelled" | "completed" | "custom"
    filters: {
        statusFilter?: string
        paymentMethodFilter?: string
        dateFilter?: {
            from?: string
            to?: string
        }
    }
    sorting: {
        field: "createdAt" | "totalPrice" | "status"
        order: "asc" | "desc"
    }
}

interface OrderExportDialogProps {
    open: boolean
    onClose: () => void
}

const defaultColumns = [
    { id: "orderId", label: "Mã Đơn", checked: true },
    { id: "customerName", label: "Khách Hàng", checked: true },
    { id: "customerEmail", label: "Email", checked: true },
    { id: "customerPhone", label: "Số Điện Thoại", checked: false },
    { id: "products", label: "Sản Phẩm (xuống dòng)", checked: true },
    { id: "totalItems", label: "Số Lượng", checked: false },
    { id: "shippingAddress", label: "Địa Chỉ", checked: false },
    { id: "totalPrice", label: "Tổng Tiền", checked: true },
    { id: "shippingPrice", label: "Phí Vận Chuyển", checked: false },
    { id: "paymentMethod", label: "Thanh Toán", checked: true },
    { id: "paymentGateway", label: "Cổng Thanh Toán", checked: false },
    { id: "status", label: "Trạng Thái", checked: true },
    { id: "createdAt", label: "Ngày Đặt", checked: true },
    { id: "paidAt", label: "Ngày Thanh Toán", checked: false },
    { id: "deliveredAt", label: "Ngày Giao", checked: false },
    { id: "appliedGiftCode", label: "Mã Giảm Giá", checked: false },
]

const reportTypes = [
    { value: "all", label: "Tất Cả Đơn Hàng" },
    { value: "pending", label: "Đơn Chờ Xử Lý" },
    { value: "paid", label: "Đơn Đã Thanh Toán" },
    { value: "shipped", label: "Đơn Đang Giao" },
    { value: "delivered", label: "Đơn Hoàn Thành" },
    { value: "cancelled", label: "Đơn Đã Hủy" },
    { value: "completed", label: "Đơn Thành Công (Paid/Shipped/Delivered)" },
]

const sortFields = [
    { value: "createdAt", label: "Ngày Đặt" },
    { value: "totalPrice", label: "Tổng Tiền" },
    { value: "status", label: "Trạng Thái" },
]

export default function OrderExportDialog({ open, onClose }: OrderExportDialogProps) {
    const [isExporting, setIsExporting] = useState(false)
    const [fileType, setFileType] = useState<"csv" | "excel">("csv")
    const [reportType, setReportType] = useState<ExportOptions["reportType"]>("all")
    const [sortField, setSortField] = useState<ExportOptions["sorting"]["field"]>("createdAt")
    const [sortOrder, setSortOrder] = useState<ExportOptions["sorting"]["order"]>("desc")
    const [columns, setColumns] = useState(() =>
        defaultColumns.map(col => ({ ...col }))
    )

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

            const response = await axiosInstance.post("/admin/orders/export", exportOptions, {
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
                all: "tat_ca",
                pending: "cho_xu_ly",
                paid: "da_thanh_toan",
                shipped: "dang_giao",
                delivered: "hoan_thanh",
                cancelled: "da_huy",
                completed: "don_thanh_cong",
                custom: "tuy_chinh",
            }
            const now = new Date()
            const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "")
            const timeStr = now.toTimeString().slice(0, 5).replace(":", "")
            const filename = `baocao_donhang_${reportTypeNames[reportType] || "all"}_${dateStr}_${timeStr}.csv`

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
                        Xuất Báo Cáo Đơn Hàng
                    </DialogTitle>
                    <DialogDescription>
                        Chọn định dạng file và các cột dữ liệu cần xuất
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
