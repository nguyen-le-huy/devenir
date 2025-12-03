import { useEffect, useMemo, useState } from "react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { getHealthConfig } from "@/components/inventory/constants"
import type { InventoryListItem } from "@/hooks/useInventory"
import { useInventoryAdjustmentMutation } from "@/hooks/useInventory"
import { useLocale } from "@/contexts/LocaleContext"

interface InventoryAdjustmentDrawerProps {
  open: boolean
  variant?: InventoryListItem | null
  onClose: () => void
  onSuccess?: () => void
}

const operationOptions = [
  { value: "add", labelKey: "inventory.adjustment.operations.add" },
  { value: "subtract", labelKey: "inventory.adjustment.operations.subtract" },
  { value: "set", labelKey: "inventory.adjustment.operations.set" },
] as const

type OperationValue = (typeof operationOptions)[number]["value"]

const reasonOptions = [
  { value: "manual", labelKey: "inventory.adjustment.reasonLabels.manual" },
  { value: "cycle_count", labelKey: "inventory.adjustment.reasonLabels.cycle_count" },
  { value: "damage", labelKey: "inventory.adjustment.reasonLabels.damage" },
  { value: "return", labelKey: "inventory.adjustment.reasonLabels.return" },
  { value: "transfer_in", labelKey: "inventory.adjustment.reasonLabels.transfer_in" },
  { value: "transfer_out", labelKey: "inventory.adjustment.reasonLabels.transfer_out" },
] as const

type ReasonValue = (typeof reasonOptions)[number]["value"]

const defaultReason = reasonOptions[0].value

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === "string") return error
  if (error && typeof error === "object" && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response
    const message = response?.data?.message
    if (typeof message === "string" && message.trim()) {
      return message
    }
  }
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: string }).message
    if (typeof message === "string" && message.trim()) {
      return message
    }
  }
  return fallback
}

export default function InventoryAdjustmentDrawer({ open, variant, onClose, onSuccess }: InventoryAdjustmentDrawerProps) {
  const { t, locale } = useLocale()
  const [operation, setOperation] = useState<OperationValue>("add")
  const [quantity, setQuantity] = useState("1")
  const [reason, setReason] = useState<ReasonValue>(defaultReason)
  const [note, setNote] = useState("")
  const [costPerUnit, setCostPerUnit] = useState("")

  const adjustmentMutation = useInventoryAdjustmentMutation()
  const numericQty = Number(quantity)
  const costValue = costPerUnit ? Number(costPerUnit) : undefined
  const currentStock = variant?.quantity ?? 0
  const reservedQuantity = variant?.reserved || 0

  const numberFormatter = useMemo(() => new Intl.NumberFormat(locale === "vi" ? "vi-VN" : "en-US"), [locale])

  const previewQuantity = useMemo(() => {
    if (!variant) return currentStock
    if (Number.isNaN(numericQty)) return currentStock
    if (operation === "set") {
      return numericQty
    }
    if (operation === "add") {
      return currentStock + numericQty
    }
    return currentStock - numericQty
  }, [variant, numericQty, operation, currentStock])

  const handleClose = () => {
    onClose()
  }

  useEffect(() => {
    if (!open) {
      setOperation("add")
      setQuantity("1")
      setReason(defaultReason)
      setNote("")
      setCostPerUnit("")
    }
  }, [open])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!variant?._id) {
      toast.error(t("inventory.adjustment.missingSku"))
      return
    }
    if (Number.isNaN(numericQty) || (operation !== "set" && numericQty <= 0)) {
      toast.error(t("inventory.adjustment.qtyMustBePositive"))
      return
    }
    if (operation === "set" && numericQty < 0) {
      toast.error(t("inventory.adjustment.qtyCannotBeNegative"))
      return
    }
    if (operation === "subtract" && numericQty > currentStock) {
      toast.error(t("inventory.adjustment.qtyExceedsStock"))
      return
    }

    try {
      await adjustmentMutation.mutateAsync({
        variantId: variant._id,
        operation,
        quantity: numericQty,
        reason,
        note: note || undefined,
        costPerUnit: costValue,
      })
      toast.success(t("inventory.adjustment.success"))
      onSuccess?.()
      handleClose()
    } catch (error) {
      toast.error(getErrorMessage(error, t("inventory.adjustment.errorFallback")))
    }
  }

  const health = getHealthConfig(variant?.healthStatus)
  const disableSubmit = !variant?._id || adjustmentMutation.isPending

  return (
    <Sheet open={open} onOpenChange={(value) => { if (!value) handleClose() }}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{t("inventory.adjustment.title")}</SheetTitle>
          <SheetDescription>{t("inventory.adjustment.description")}</SheetDescription>
        </SheetHeader>

        {variant ? (
          <div className="space-y-4 px-4 pb-8">
            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="text-sm text-muted-foreground">{variant.product?.name}</p>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xl font-semibold">{variant.sku}</p>
                <Badge variant="outline" className={health.color}>{t(health.labelKey)}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{t("inventory.adjustment.currentStock")}: {numberFormatter.format(currentStock)}</p>
            </div>

            <section className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border p-3">
                <p className="text-muted-foreground">{t("inventory.adjustment.reserved")}</p>
                <p className="text-xl font-semibold">{numberFormatter.format(reservedQuantity)}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-muted-foreground">{t("inventory.adjustment.incoming")}</p>
                <p className="text-xl font-semibold">{numberFormatter.format(variant.incoming || 0)}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-muted-foreground">{t("inventory.adjustment.availableAfter")}</p>
                <p className="text-xl font-semibold">{numberFormatter.format(Math.max(previewQuantity - reservedQuantity, 0))}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-muted-foreground">{t("inventory.adjustment.projectedStock")}</p>
                <p className="text-xl font-semibold">{numberFormatter.format(Math.max(previewQuantity, 0))}</p>
              </div>
            </section>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label>{t("inventory.adjustment.operation")}</Label>
                <Select value={operation} onValueChange={(value) => setOperation(value as OperationValue)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("inventory.adjustment.operationPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {operationOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {t(option.labelKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t("inventory.adjustment.quantity")}</Label>
                  <Input type="number" min={operation === "set" ? 0 : 1} value={quantity} onChange={(event) => setQuantity(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{t("inventory.adjustment.reason")}</Label>
                  <Select value={reason} onValueChange={(value) => setReason(value as ReasonValue)}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("inventory.adjustment.reasonPlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      {reasonOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {t(option.labelKey)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t("inventory.adjustment.cost")}</Label>
                <Input type="number" min={0} value={costPerUnit} onChange={(event) => setCostPerUnit(event.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>{t("inventory.adjustment.note")}</Label>
                <Textarea rows={3} value={note} onChange={(event) => setNote(event.target.value)} placeholder={t("inventory.adjustment.notePlaceholder")} />
              </div>

              <Button type="submit" className="w-full" disabled={disableSubmit}>
                {adjustmentMutation.isPending ? t("inventory.adjustment.loading") : t("inventory.adjustment.submit")}
              </Button>
            </form>
          </div>
        ) : (
          <div className="px-4 pb-8 text-sm text-muted-foreground">{t("inventory.adjustment.missingSku")}</div>
        )}
      </SheetContent>
    </Sheet>
  )
}
