/**
 * Utility functions for Variants Page
 */
import type { Variant, Color, QuickStats } from './types'

/**
 * Calculate quick stats from variants array
 */
export function calculateQuickStats(variants: Variant[]): QuickStats {
  let inStock = 0
  let lowStock = 0
  let outOfStock = 0
  let inventoryValue = 0

  variants.forEach((v) => {
    const stockQty = v.stock ?? 0

    if (stockQty === 0) {
      outOfStock++
    } else if (stockQty <= v.lowStockThreshold) {
      lowStock++
    } else {
      inStock++
    }
    inventoryValue += (v.price || 0) * stockQty
  })

  return {
    totalSkus: variants.length,
    inStock,
    lowStock,
    outOfStock,
    inventoryValue,
  }
}

/**
 * Get responsive font size based on inventory value length
 */
export function getInventoryValueFontSize(inventoryValue: number): string {
  const value = inventoryValue.toLocaleString('en-US', { maximumFractionDigits: 0 })
  const length = value.length

  if (length <= 10) return 'text-2xl'
  if (length <= 13) return 'text-xl'
  if (length <= 16) return 'text-lg'
  return 'text-base'
}

/**
 * Resolve variant product ID from different formats
 */
export function resolveVariantProductId(variant: Variant): string {
  if (variant.product_id) {
    return variant.product_id
  }

  if (!variant.product) return ''

  if (typeof variant.product === 'string') {
    return variant.product
  }

  return variant.product._id || ''
}

/**
 * Get stock badge variant based on stock level
 */
export function getStockBadgeVariant(stock: number, threshold: number): 'destructive' | 'secondary' | 'default' {
  if (stock === 0) return 'destructive'
  if (stock <= threshold) return 'secondary'
  return 'default'
}

/**
 * Get stock status text
 */
export function getStockStatus(stock: number, threshold: number): string {
  if (stock === 0) return 'Out of Stock'
  if (stock <= threshold) return 'Low Stock'
  return 'In Stock'
}

/**
 * Get stock icon emoji
 */
export function getStockIcon(stock: number, threshold: number): string {
  if (stock === 0) return '🔴'
  if (stock <= threshold) return '⚠️'
  return '✅'
}

/**
 * Filter variants based on search and filter criteria
 */
export function filterVariants(
  variants: Variant[],
  searchTerm: string,
  filterProduct: string,
  filterSize: string,
  filterColor: string,
  filterStockStatus: string
): Variant[] {
  let filtered = [...variants]

  // Search filter
  if (searchTerm.trim()) {
    const term = searchTerm.toLowerCase()
    filtered = filtered.filter(
      (v) =>
        v.sku.toLowerCase().includes(term) ||
        (v.productName || '').toLowerCase().includes(term) ||
        (v.color || '').toLowerCase().includes(term) ||
        v.size.toLowerCase().includes(term)
    )
  }

  // Product filter
  if (filterProduct !== 'all') {
    filtered = filtered.filter((v) => resolveVariantProductId(v) === filterProduct)
  }

  // Size filter
  if (filterSize !== 'all') {
    filtered = filtered.filter((v) => v.size === filterSize)
  }

  // Color filter
  if (filterColor !== 'all') {
    filtered = filtered.filter((v) => v.color === filterColor)
  }

  // Stock status filter
  if (filterStockStatus !== 'all') {
    filtered = filtered.filter((v) => {
      if (filterStockStatus === 'inStock') return v.stock > v.lowStockThreshold
      if (filterStockStatus === 'low') return v.stock > 0 && v.stock <= v.lowStockThreshold
      if (filterStockStatus === 'out') return v.stock === 0
      return true
    })
  }

  return filtered
}

/**
 * Export variants to CSV
 */
export function exportVariantsToCSV(variants: Variant[]): void {
  try {
    const headers = ['SKU', 'Product Name', 'Size', 'Color', 'Price', 'Stock', 'Status']
    const csvContent = [
      headers.join(','),
      ...variants.map((v) =>
        [
          `"${v.sku}"`,
          `"${v.productName || ''}"`,
          `"${v.size}"`,
          `"${v.color || ''}"`,
          v.price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
          v.stock,
          getStockStatus(v.stock, v.lowStockThreshold),
        ].join(',')
      ),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `variants_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (error) {
    console.error('Error exporting CSV:', error)
    throw error
  }
}

/**
 * Parse CSV file content
 */
export function parseCSVContent(csv: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = csv.split('\n').filter((line) => line.trim())
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase())

  const rows = lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''))
    const row: Record<string, string> = {}
    headers.forEach((header, index) => {
      row[header] = values[index]
    })
    return row
  })

  return { headers, rows }
}

/**
 * Get color display info
 */
export function getColorDisplayInfo(colorName: string | null, colors: Color[]): { hex: string; name: string } {
  if (!colorName) return { hex: '#CCCCCC', name: '-' }
  const colorInfo = colors.find((c) => c.name === colorName)
  return {
    hex: colorInfo?.hex || '#CCCCCC',
    name: colorName,
  }
}
