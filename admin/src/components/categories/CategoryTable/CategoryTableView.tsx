/**
 * CategoryTableView Component
 * Display categories in table format with Name, Level, Products, Revenue
 */

import { useMemo } from 'react'
import type { CategoryTreeNode } from '@/utils/categoryHelpers'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { IconEdit, IconTrash } from '@tabler/icons-react'

interface CategoryTableViewProps {
  data: CategoryTreeNode[]
  onSelectCategory: (category: CategoryTreeNode) => void
  onEditCategory: (category: CategoryTreeNode) => void
  onDeleteCategory: (categoryId: string) => void
}

export function CategoryTableView({
  data,
  onSelectCategory,
  onEditCategory,
  onDeleteCategory,
}: CategoryTableViewProps) {
  // Flatten tree to list
  const flattenedCategories = useMemo(() => {
    const flatten = (nodes: CategoryTreeNode[]): CategoryTreeNode[] => {
      return nodes.reduce((acc, node) => {
        return [...acc, node, ...flatten(node.children || [])]
      }, [] as CategoryTreeNode[])
    }
    return flatten(data)
  }, [data])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount)
  }

  const getLevelBadge = (level: number) => {
    const colors = {
      0: 'bg-blue-500',
      1: 'bg-green-500',
      2: 'bg-yellow-500',
      3: 'bg-orange-500',
    }
    return colors[level as keyof typeof colors] || 'bg-gray-500'
  }

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40%]">Name</TableHead>
            <TableHead className="text-center">Level</TableHead>
            <TableHead className="text-right">Products</TableHead>
            <TableHead className="text-right">Revenue</TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {flattenedCategories.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground h-32">
                No categories found
              </TableCell>
            </TableRow>
          ) : (
            flattenedCategories.map((category) => (
              <TableRow
                key={category._id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onSelectCategory(category)}
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span style={{ paddingLeft: `${category.level * 24}px` }}>
                      {category.level === 0 ? '📁' : category.children && category.children.length > 0 ? '📂' : '📄'}
                    </span>
                    <div>
                      <div className="font-medium">{category.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {category.slug}
                      </div>
                    </div>
                  </div>
                </TableCell>
                
                <TableCell className="text-center">
                  <Badge className={getLevelBadge(category.level)}>
                    Level {category.level}
                  </Badge>
                </TableCell>
                
                <TableCell className="text-right font-medium">
                  {category.productCount || 0}
                </TableCell>
                
                <TableCell className="text-right font-medium">
                  {formatCurrency(category.revenue || 0)}
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onEditCategory(category)
                      }}
                    >
                      <IconEdit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteCategory(category._id)
                      }}
                    >
                      <IconTrash className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
