import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import InventoryTable from "../InventoryTable"
import type { InventoryListItem } from "@/hooks/useInventory"

describe("InventoryTable", () => {
  const baseItem: InventoryListItem = {
    _id: "variant-1",
    sku: "SKU-001",
    color: "Đen",
    size: "M",
    price: 250000,
    quantity: 15,
    reserved: 2,
    incoming: 5,
    available: 13,
    inventoryValue: 3750000,
    lowStockThreshold: 5,
    binLocation: "A-01",
    reorderPoint: 10,
    healthStatus: "healthy",
    updatedAt: new Date().toISOString(),
    product: {
      _id: "product-1",
      name: "Áo thun basic",
      category: "category-1",
      brand: "brand-1",
    },
  }

  it("renders empty state when không có dữ liệu", () => {
    render(<InventoryTable items={[]} pagination={{ page: 1, limit: 20, total: 0, pages: 0 }} />)

    expect(screen.getByText(/Không tìm thấy sản phẩm phù hợp/i)).toBeInTheDocument()
  })

  it("gọi callback khi click hành động", () => {
    const inspectSpy = vi.fn()
    const adjustSpy = vi.fn()

    render(
      <InventoryTable
        items={[baseItem]}
        pagination={{ page: 1, limit: 20, total: 1, pages: 1 }}
        onInspect={inspectSpy}
        onAdjust={adjustSpy}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: /Chi tiết/i }))
    fireEvent.click(screen.getByRole("button", { name: /Điều chỉnh/i }))

    expect(inspectSpy).toHaveBeenCalledTimes(1)
    expect(adjustSpy).toHaveBeenCalledTimes(1)
    expect(inspectSpy).toHaveBeenCalledWith(expect.objectContaining({ _id: baseItem._id }))
    expect(adjustSpy).toHaveBeenCalledWith(expect.objectContaining({ _id: baseItem._id }))
  })
})
