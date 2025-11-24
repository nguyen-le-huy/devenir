import { Badge } from "@/components/ui/badge"

export type OrderStatus = "pending" | "paid" | "shipped" | "delivered" | "cancelled"
export type InventoryStatus = "in-stock" | "low-stock" | "out-of-stock"
export type ProductStatus = "active" | "inactive" | "draft"

interface StatusBadgeProps {
  status: OrderStatus | InventoryStatus | ProductStatus | string
  variant?: "default" | "secondary" | "outline" | "destructive"
}

const statusStyles: Record<string, { badge: "default" | "secondary" | "outline" | "destructive", label: string }> = {
  pending: { badge: "secondary", label: "Pending" },
  paid: { badge: "default", label: "Paid" },
  shipped: { badge: "default", label: "Shipped" },
  delivered: { badge: "secondary", label: "Delivered" },
  cancelled: { badge: "destructive", label: "Cancelled" },
  "in-stock": { badge: "default", label: "In Stock" },
  "low-stock": { badge: "secondary", label: "Low Stock" },
  "out-of-stock": { badge: "destructive", label: "Out of Stock" },
  active: { badge: "default", label: "Active" },
  inactive: { badge: "secondary", label: "Inactive" },
  draft: { badge: "outline", label: "Draft" },
}

export function StatusBadge({ status, variant }: StatusBadgeProps) {
  const style = statusStyles[status]
  if (!style) return null

  return (
    <Badge variant={variant || style.badge}>
      {style.label}
    </Badge>
  )
}
