import { render, screen, fireEvent } from "@testing-library/react"
import { vi } from "vitest"
import InventoryAlertsPanel from "../InventoryAlertsPanel"
import type { InventoryAlertsResponse } from "@/hooks/useInventory"
import { LocaleProvider } from "@/contexts/LocaleContext"
import type { ReactNode } from "react"

const mockAlerts: InventoryAlertsResponse = {
  lowStock: [
    { _id: "1", sku: "SKU1", quantity: 5, reserved: 1, product: { _id: "p1", name: "Áo sơ mi" } } as any,
  ],
  outOfStock: [
    { _id: "2", sku: "SKU2", quantity: 0, reserved: 0, product: { _id: "p2", name: "Quần jeans" } } as any,
  ],
  overstock: [],
  reservationIssues: [],
}


const renderWithLocale = (ui: ReactNode) => render(<LocaleProvider>{ui}</LocaleProvider>)

describe("InventoryAlertsPanel", () => {
  it("hiển thị số lượng cảnh báo cho từng tab", () => {
    renderWithLocale(<InventoryAlertsPanel data={mockAlerts} />)

    expect(screen.getByRole("tab", { name: /Cảnh báo thấp/ })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: /Hết hàng/ })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: /Tồn kho cao/ })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: /Giữ chỗ vượt mức/ })).toBeInTheDocument()

    expect(screen.getAllByText("1").length).toBeGreaterThan(0)
  })

  it("gọi onRefresh khi bấm nút cập nhật", () => {
    const refreshSpy = vi.fn()
    renderWithLocale(<InventoryAlertsPanel data={mockAlerts} onRefresh={refreshSpy} />)

    fireEvent.click(screen.getByRole("button", { name: /Cập nhật/i }))
    expect(refreshSpy).toHaveBeenCalled()
  })

  it("hiển thị skeleton khi loading", () => {
    const { container } = renderWithLocale(<InventoryAlertsPanel loading />)
    const skeletons = container.querySelectorAll('[data-slot="skeleton"]')
    expect(skeletons.length).toBeGreaterThan(0)
  })
})
