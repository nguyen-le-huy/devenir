/**
 * Product Form Utilities
 * Helper functions for product form operations
 */

import type { Color } from "@/services/colorService"

/**
 * Auto-generate SKU from product name, color and size
 */
export const generateSKU = (productName: string, color: string, size: string): string => {
  const name = productName.substring(0, 3).toUpperCase()
  const cleanColor = color.replace(/\s+/g, "-").toUpperCase()
  const sizeForSKU = size.replace(/\s+/g, "-").toUpperCase()
  return `${name}-${sizeForSKU}-${cleanColor}`
}

/**
 * Get stock status from quantity
 */
export const getStockStatus = (quantity: number): { label: string; color: string } => {
  if (quantity === 0) return { label: "Out", color: "bg-red-500" }
  if (quantity < 10) return { label: "Low", color: "bg-yellow-500" }
  return { label: "In", color: "bg-green-500" }
}

/**
 * Get color display information
 */
export const getColorDisplay = (
  colorIdOrName: string,
  colors: Color[]
): { hex: string; name: string } => {
  const colorObj = colors.find(c => c._id === colorIdOrName || c.name === colorIdOrName)
  return {
    hex: colorObj?.hex || "#CCCCCC",
    name: colorObj?.name || colorIdOrName,
  }
}

/**
 * Extract ObjectId from populated reference
 */
export const extractId = (ref: string | { _id: string } | null | undefined): string => {
  if (!ref) return ""
  if (typeof ref === 'object' && '_id' in ref) return ref._id
  return ref as string
}

/**
 * Calculate total stock from variants
 */
export const calculateTotalStock = (variants: Array<{ quantity: number }>): number => {
  return variants.reduce((sum, v) => sum + v.quantity, 0)
}

/**
 * Calculate total value from variants
 */
export const calculateTotalValue = (variants: Array<{ price: number; quantity: number }>): number => {
  return variants.reduce((sum, v) => sum + v.price * v.quantity, 0)
}

/**
 * Get stock distribution by size
 */
export const getStockDistributionBySize = (
  variants: Array<{ size: string; quantity: number }>
): Record<string, number> => {
  return variants.reduce((acc, v) => {
    acc[v.size] = (acc[v.size] || 0) + v.quantity
    return acc
  }, {} as Record<string, number>)
}

/**
 * Get stock distribution by color
 */
export const getStockDistributionByColor = (
  variants: Array<{ color: string; quantity: number }>
): Record<string, number> => {
  return variants.reduce((acc, v) => {
    const colorKey = v.color || "None"
    acc[colorKey] = (acc[colorKey] || 0) + v.quantity
    return acc
  }, {} as Record<string, number>)
}

/**
 * Get unique sizes from variants
 */
export const getUniqueSizes = (variants: Array<{ size: string }>): string[] => {
  return Array.from(new Set(variants.map(v => v.size)))
}

/**
 * Get unique colors from variants
 */
export const getUniqueColors = (variants: Array<{ color: string }>): string[] => {
  return Array.from(new Set(variants.map(v => v.color).filter(Boolean)))
}

/**
 * Filter variants by criteria
 */
export const filterVariants = <T extends { sku: string; size: string; color: string }>(
  variants: T[],
  filters: {
    size?: string
    color?: string
    search?: string
  }
): T[] => {
  return variants.filter(v => {
    const matchesSize = !filters.size || filters.size === "all" || v.size === filters.size
    const matchesColor = !filters.color || filters.color === "all" || v.color === filters.color
    const matchesSearch = !filters.search || 
      v.sku.toLowerCase().includes(filters.search.toLowerCase()) ||
      v.size.includes(filters.search) ||
      v.color.toLowerCase().includes(filters.search.toLowerCase())

    return matchesSize && matchesColor && matchesSearch
  })
}
