/**
 * CategoryTree Component - Complete Version
 * Added: Status filter, Level filter, Sort dropdown, Products count in stats
 */

import { useState, useMemo } from 'react'
import type { CategoryTreeNode } from '@/utils/categoryHelpers'
import { filterTree, countCategories, countRootCategories, countActiveCategories } from '@/utils/categoryHelpers'
import { CategoryTreeItem } from './CategoryTreeItem'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { IconSearch, IconChevronDown, IconChevronRight } from '@tabler/icons-react'
import type { Category } from '@/services/categoryService'

interface CategoryTreeProps {
  data: CategoryTreeNode[]
  allCategories: Category[]
  selectedCategoryId: string | null
  onSelectCategory: (category: CategoryTreeNode) => void
  onEditCategory: (category: CategoryTreeNode) => void
  onAddChild: (parent: CategoryTreeNode) => void
  onDeleteCategory: (categoryId: string) => void
}

export function CategoryTree({
  data,
  allCategories,
  selectedCategoryId,
  onSelectCategory,
  onEditCategory,
  onAddChild,
  onDeleteCategory,
}: CategoryTreeProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [levelFilter, setLevelFilter] = useState<number | 'all'>('all')
  const [sortBy, setSortBy] = useState<'name' | 'created' | 'updated' | 'products'>('name')

  const tree = data || []

  // Filter tree based on search, status, and level
  const filteredTree = useMemo(() => {
    let filtered = tree

    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filterTree(filtered, searchTerm)
    }

    // Filter by active status
    if (statusFilter === 'active') {
      const filterByActive = (nodes: CategoryTreeNode[]): CategoryTreeNode[] => {
        return nodes
          .filter((node) => node.isActive)
          .map((node) => ({
            ...node,
            children: filterByActive(node.children),
          }))
      }
      filtered = filterByActive(filtered)
    } else if (statusFilter === 'inactive') {
      const filterByInactive = (nodes: CategoryTreeNode[]): CategoryTreeNode[] => {
        return nodes
          .filter((node) => !node.isActive)
          .map((node) => ({
            ...node,
            children: filterByInactive(node.children),
          }))
      }
      filtered = filterByInactive(filtered)
    }

    // Filter by level (show categories at this level AND their parents for context)
    if (levelFilter !== 'all') {
      const filterByLevel = (nodes: CategoryTreeNode[], currentLevel: number = 0): CategoryTreeNode[] => {
        return nodes
          .map((node) => {
            const children = filterByLevel(node.children, currentLevel + 1)
            // Show if: matches level OR has matching children
            if (node.level === levelFilter || children.length > 0) {
              return {
                ...node,
                children,
              }
            }
            return null
          })
          .filter(Boolean) as CategoryTreeNode[]
      }
      filtered = filterByLevel(filtered)
    }

    // Sort
    const sortNodes = (nodes: CategoryTreeNode[]): CategoryTreeNode[] => {
      const sorted = [...nodes].sort((a, b) => {
        switch (sortBy) {
          case 'name':
            return a.name.localeCompare(b.name)
          case 'created':
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          case 'updated':
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          case 'products':
            return (b.productCount || 0) - (a.productCount || 0)
          default:
            return 0
        }
      })
      return sorted.map((node) => ({
        ...node,
        children: sortNodes(node.children),
      }))
    }
    filtered = sortNodes(filtered)

    return filtered
  }, [tree, searchTerm, statusFilter, levelFilter, sortBy])

  // Calculate stats including products count
  const stats = useMemo(() => {
    const totalProducts = allCategories.reduce((sum, cat) => sum + (cat.productCount || 0), 0)
    return {
      total: countCategories(tree),
      root: countRootCategories(tree),
      active: countActiveCategories(allCategories),
      products: totalProducts,
    }
  }, [tree, allCategories])

  // Toggle expand/collapse
  const handleToggleExpand = (categoryId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev)
      if (next.has(categoryId)) {
        next.delete(categoryId)
      } else {
        next.add(categoryId)
      }
      return next
    })
  }

  // Expand/Collapse all
  const handleToggleAll = () => {
    if (expandedNodes.size > 0) {
      setExpandedNodes(new Set())
    } else {
      const getAllIds = (nodes: CategoryTreeNode[]): string[] => {
        return nodes.flatMap((node) => [node._id, ...getAllIds(node.children)])
      }
      setExpandedNodes(new Set(getAllIds(tree)))
    }
  }

  // Render tree recursively with proper indentation based on level
  const renderTree = (nodes: CategoryTreeNode[]) => {
    if (!nodes || nodes.length === 0) return null

    return nodes.map((node) => (
      <div key={node._id}>
        <div style={{ marginLeft: `${node.level * 24}px` }}>
          <CategoryTreeItem
            category={node}
            level={node.level}
            isSelected={selectedCategoryId === node._id}
            isExpanded={expandedNodes.has(node._id)}
            onSelect={onSelectCategory}
            onToggleExpand={handleToggleExpand}
            onEdit={onEditCategory}
            onAddChild={onAddChild}
            onDelete={onDeleteCategory}
          />
        </div>
        {expandedNodes.has(node._id) && node.children.length > 0 && (
          <div>{renderTree(node.children)}</div>
        )}
      </div>
    ))
  }

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          {/* Search & quick actions */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleAll}
              className="gap-2 w-full sm:w-auto"
            >
              {expandedNodes.size > 0 ? (
                <>
                  <IconChevronDown className="h-4 w-4" />
                  Collapse All
                </>
              ) : (
                <>
                  <IconChevronRight className="h-4 w-4" />
                  Expand All
                </>
              )}
            </Button>
          </div>

          {/* Filters Row */}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {/* Status Filter */}
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Status</label>
              <select
                className="w-full border rounded-md p-2 text-sm bg-background"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
              >
                <option value="all">All</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>

            {/* Level Filter */}
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Level</label>
              <select
                className="w-full border rounded-md p-2 text-sm bg-background"
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              >
                <option value="all">All Levels</option>
                <option value="0">Level 0 (Root)</option>
                <option value="1">Level 1</option>
                <option value="2">Level 2</option>
                <option value="3">Level 3</option>
                <option value="4">Level 4</option>
                <option value="5">Level 5</option>
              </select>
            </div>

            {/* Sort Filter */}
            <div className="space-y-1 xl:col-span-1 col-span-full">
              <label className="text-xs text-muted-foreground">Sort By</label>
              <select
                className="w-full border rounded-md p-2 text-sm bg-background"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
              >
                <option value="name">Name (A-Z)</option>
                <option value="created">Recently Created</option>
                <option value="updated">Recently Updated</option>
                <option value="products">Most Products</option>
              </select>
            </div>
          </div>

          {/* Stats Row */}
          <div className="border-t pt-4">
            <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2 xl:flex xl:flex-wrap xl:items-center xl:gap-4">
              <div className="flex items-center gap-1">
                <span className="font-medium">{stats.root}</span>
                <span>Root</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-medium">{stats.total}</span>
                <span>Total</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-medium text-blue-600">{stats.products}</span>
                <span>Products</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-medium text-green-600">{stats.active}</span>
                <span>Active</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tree View */}
      <Card>
        <CardContent className="p-4">
          {filteredTree.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchTerm ? 'No categories match your search' : 'No categories yet'}
            </div>
          ) : (
            <div className="space-y-1">{renderTree(filteredTree)}</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
