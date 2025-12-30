/**
 * CSV Import/Export Hook for Variants Page
 */
import { useCallback } from 'react'
import { toast } from 'sonner'
import axiosInstance from '@/services/axiosConfig'
import type { Variant, Color } from './types'
import { exportVariantsToCSV, parseCSVContent } from './utils'

interface UseVariantsCSVProps {
  filteredVariants: Variant[]
  colors: Color[]
}

export function useVariantsCSV({ filteredVariants, colors }: UseVariantsCSVProps) {
  const handleExportCSV = useCallback(() => {
    try {
      exportVariantsToCSV(filteredVariants)
      toast.success('CSV exported successfully')
    } catch (error) {
      console.error('Error exporting CSV:', error)
      toast.error('Failed to export CSV')
    }
  }, [filteredVariants])

  const handleImportCSV = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.csv'
    input.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement
      const file = target.files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = async (event) => {
        try {
          const csv = event.target?.result as string
          const { headers, rows } = parseCSVContent(csv)

          const requiredColumns = ['sku', 'size', 'color', 'price', 'stock']
          const missingCols = requiredColumns.filter((col) => !headers.includes(col))

          if (missingCols.length > 0) {
            toast.error(`Missing required columns: ${missingCols.join(', ')}`)
            return
          }

          // Validate and create variants
          let successCount = 0
          for (const variant of rows) {
            try {
              const colorObj = colors.find((c) => c.name === variant.color)
              await axiosInstance.post('/products/admin/variants', {
                sku: variant.sku,
                size: variant.size,
                colorId: colorObj?._id,
                price: parseFloat(variant.price),
                stock: parseInt(variant.stock),
              })
              successCount++
            } catch (error) {
              console.error('Error importing variant:', variant.sku, error)
            }
          }

          toast.success(`Imported ${successCount} variants successfully`)
        } catch (error) {
          console.error('Error reading CSV:', error)
          toast.error('Failed to import CSV')
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }, [colors])

  return {
    handleExportCSV,
    handleImportCSV,
  }
}
