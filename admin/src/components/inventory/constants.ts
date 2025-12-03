import type { InventoryHealth } from "@/hooks/useInventory"

export const HEALTH_LABELS: Record<InventoryHealth | "default", { labelKey: string; color: string }> = {
  healthy: { labelKey: "inventory.health.healthy", color: "bg-emerald-100 text-emerald-700" },
  "low-stock": { labelKey: "inventory.health.low", color: "bg-amber-100 text-amber-700" },
  "out-of-stock": { labelKey: "inventory.health.out", color: "bg-red-100 text-red-700" },
  overstock: { labelKey: "inventory.health.over", color: "bg-blue-100 text-blue-700" },
  default: { labelKey: "inventory.health.default", color: "bg-muted text-foreground" },
}

export const getHealthConfig = (status?: InventoryHealth | null) => HEALTH_LABELS[status || "default"]
