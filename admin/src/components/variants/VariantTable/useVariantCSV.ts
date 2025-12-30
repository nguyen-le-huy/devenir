/**
 * CSV Import/Export Hook
 * Handles CSV import and export functionality for variants
 */
import { useCallback } from 'react'
import axiosInstance from '@/services/axiosConfig'
import { toast } from 'sonner'
import { generateCSVContent, downloadCSV } from './utils'
import type { Variant, Color, CSVImportRow } from './types'

interface UseVariantCSVProps {
  variants: Variant[]
  colors: Color[]
}

export function useVariantCSV({ variants, colors }: UseVariantCSVProps) {
  const handleExportCSV = useCallback(() => {
    try {
      const content = generateCSVContent(variants)
      downloadCSV(content)
      toast.success('CSV exported successfully')
    } catch (error) {
      console.error('Error exporting CSV:', error)
      toast.error('Failed to export CSV')
    }
  }, [variants])

  const handleImportCSV = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.csv'
    input.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement
      const file = target.files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = async (event: ProgressEvent<FileReader>) => {
        try {
          const csv = event.target?.result as string
          const lines = csv.split('\n').filter((line) => line.trim())
          const headers = lines[0].split(',').map((h) => h.trim().toLowerCase())

          const requiredColumns = ['sku', 'size', 'color', 'price', 'stock']
          const missingCols = requiredColumns.filter((col) => !headers.includes(col))

          if (missingCols.length > 0) {
            toast.error(`Missing required columns: ${missingCols.join(', ')}`)
            return
          }

          const importedVariants: CSVImportRow[] = lines.slice(1).map((line) => {
            const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''))
            const row: CSVImportRow = {}
            headers.forEach((header, index) => {
              row[header] = values[index]
            })
            return row
          })

          // Validate and create variants
          let successCount = 0
          let errorCount = 0

          for (const variant of importedVariants) {
            try {
              const colorObj = colors.find((c) => c.name === variant.color)
              await axiosInstance.post('/products/admin/variants', {
                sku: variant.sku,
                size: variant.size,
                colorId: colorObj?._id,
                price: parseFloat(variant.price || '0'),
                stock: parseInt(variant.stock || '0'),
              })
              successCount++
            } catch (error) {
              console.error('Error importing variant:', variant.sku, error)
              errorCount++
            }
          }

          if (errorCount > 0) {
            toast.warning(`Imported ${successCount} variants, ${errorCount} failed`)
          } else {
            toast.success(`Imported ${successCount} variants successfully`)
          }
          // React Query will auto-refetch after mutation
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
