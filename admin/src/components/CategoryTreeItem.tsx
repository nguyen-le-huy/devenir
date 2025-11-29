/**
 * CategoryTreeItem Component
 * Represents a single node in the category tree with actions and expand/collapse
 */

import { useState } from 'react'
import type { CategoryTreeNode } from '@/utils/categoryHelpers'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  IconChevronRight, 
  IconChevronDown, 
  IconEdit, 
  IconPlus, 
  IconTrash,
  IconFolder,
  IconFolderOpen,
  IconFile
} from '@tabler/icons-react'
import { cn } from '@/lib/utils'

interface CategoryTreeItemProps {
  category: CategoryTreeNode
  level: number
  isSelected: boolean
  isExpanded: boolean
  onSelect: (category: CategoryTreeNode) => void
  onToggleExpand: (categoryId: string) => void
  onEdit: (category: CategoryTreeNode) => void
  onAddChild: (parent: CategoryTreeNode) => void
  onDelete: (categoryId: string) => void
  isDeleting?: boolean
}

export function CategoryTreeItem({
  category,
  level,
  isSelected,
  isExpanded,
  onSelect,
  onToggleExpand,
  onEdit,
  onAddChild,
  onDelete,
  isDeleting = false,
}: CategoryTreeItemProps) {
  const [isHovered, setIsHovered] = useState(false)
  const hasChildren = category.children && category.children.length > 0

  // Icon based on level and expand state
  const getIcon = () => {
    if (level === 0) {
      return isExpanded && hasChildren ? (
        <IconFolderOpen className="h-4 w-4 text-blue-500" />
      ) : (
        <IconFolder className="h-4 w-4 text-blue-600" />
      )
    } else if (hasChildren) {
      return isExpanded ? (
        <IconFolderOpen className="h-4 w-4 text-amber-500" />
      ) : (
        <IconFolder className="h-4 w-4 text-amber-600" />
      )
    } else {
      return <IconFile className="h-4 w-4 text-gray-400" />
    }
  }

  return (
    <div
      className={cn(
        'group flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-accent/50 transition-colors',
        isSelected && 'bg-accent',
        'border border-transparent hover:border-border'
      )}
      style={{ paddingLeft: `${level * 20 + 8}px` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Expand/Collapse Button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-5 w-5 p-0"
        onClick={() => hasChildren && onToggleExpand(category._id)}
        disabled={!hasChildren}
      >
        {hasChildren ? (
          isExpanded ? (
            <IconChevronDown className="h-3 w-3" />
          ) : (
            <IconChevronRight className="h-3 w-3" />
          )
        ) : (
          <span className="w-3" />
        )}
      </Button>

      {/* Checkbox */}
      <Checkbox
        checked={isSelected}
        onCheckedChange={() => onSelect(category)}
        className="h-4 w-4"
      />

      {/* Icon */}
      <div className="shrink-0">{getIcon()}</div>

      {/* Category Name */}
      <button
        onClick={() => onSelect(category)}
        className="flex-1 text-left font-medium text-sm hover:text-primary transition-colors truncate"
      >
        {category.name}
      </button>

      {/* Stats Badge */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {category.productCount !== undefined && (
          <span className="flex items-center gap-1">
            <span className="text-muted-foreground">🏷️</span>
            {category.productCount}
          </span>
        )}
      </div>

      {/* Status Badge */}
      <Badge
        variant={category.isActive ? 'default' : 'secondary'}
        className={cn(
          'h-5 text-xs',
          category.isActive ? 'bg-green-500/10 text-green-700 dark:text-green-400' : ''
        )}
      >
        {category.isActive ? '🟢 Active' : '⚪ Inactive'}
      </Badge>

      {/* Action Buttons (Show on hover or selected) */}
      {(isHovered || isSelected) && (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={(e) => {
              e.stopPropagation()
              onEdit(category)
            }}
            title="Edit category"
          >
            <IconEdit className="h-3.5 w-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={(e) => {
              e.stopPropagation()
              onAddChild(category)
            }}
            title="Add child category"
          >
            <IconPlus className="h-3.5 w-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(category._id)
            }}
            disabled={isDeleting || hasChildren}
            title={hasChildren ? 'Cannot delete category with children' : 'Delete category'}
          >
            <IconTrash className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  )
}
