/**
 * Category Helper Utilities
 * Functions to build tree structure, calculate stats, and manage category hierarchy
 */

import type { Category } from '@/services/categoryService'

export interface CategoryTreeNode extends Category {
  children: CategoryTreeNode[]
  level: number
  productCount?: number
  variantCount?: number
  revenue?: number
  sortOrder?: number
  isExpanded?: boolean
}

/**
 * Calculate level of a category based on parent hierarchy
 */
function calculateLevel(categoryId: string, categoryMap: Map<string, Category>): number {
  let level = 0
  let currentId: string | null = categoryId
  
  // Traverse up the tree to count levels
  while (currentId) {
    const category = categoryMap.get(currentId)
    if (!category || !category.parentCategory) break
    
    level++
    currentId = category.parentCategory
    
    // Safety: prevent infinite loop
    if (level > 10) break
  }
  
  return level
}

/**
 * Build hierarchical tree structure from flat category list
 */
export function buildCategoryTree(categories: Category[]): CategoryTreeNode[] {
  const categoryMap = new Map<string, Category>()
  const nodeMap = new Map<string, CategoryTreeNode>()
  const rootCategories: CategoryTreeNode[] = []

  // First pass: Create maps
  categories.forEach((cat) => {
    categoryMap.set(cat._id, cat)
  })

  // Second pass: Calculate levels and create nodes
  categories.forEach((cat) => {
    const level = calculateLevel(cat._id, categoryMap)
    
    nodeMap.set(cat._id, {
      ...cat,
      children: [],
      level,
      isExpanded: false,
    })
  })

  // Third pass: Build tree structure
  categories.forEach((cat) => {
    const node = nodeMap.get(cat._id)!
    
    if (!cat.parentCategory) {
      // Root category
      rootCategories.push(node)
    } else {
      // Child category
      const parent = nodeMap.get(cat.parentCategory)
      if (parent) {
        parent.children.push(node)
      } else {
        // Parent not found, treat as root
        rootCategories.push(node)
      }
    }
  })

  // Sort categories by sortOrder, then by name
  const sortCategories = (cats: CategoryTreeNode[]) => {
    cats.sort((a, b) => {
      const orderA = a.sortOrder ?? 0
      const orderB = b.sortOrder ?? 0
      if (orderA !== orderB) return orderA - orderB
      return a.name.localeCompare(b.name)
    })
    cats.forEach((cat) => {
      if (cat.children.length > 0) {
        sortCategories(cat.children)
      }
    })
  }

  sortCategories(rootCategories)

  return rootCategories
}

/**
 * Get full hierarchy path for a category
 */
export function getCategoryPath(
  categoryId: string,
  categories: Category[]
): string[] {
  const path: string[] = []
  let currentId: string | null | undefined = categoryId

  while (currentId) {
    const category = categories.find((c) => c._id === currentId)
    if (!category) break

    path.unshift(category.name)
    currentId = category.parentCategory
  }

  return path
}

/**
 * Get all descendant IDs of a category (for preventing circular references)
 */
export function getDescendantIds(
  categoryId: string,
  categories: Category[]
): string[] {
  const descendants: string[] = []

  const findDescendants = (id: string) => {
    const children = categories.filter((c) => c.parentCategory === id)
    children.forEach((child) => {
      descendants.push(child._id)
      findDescendants(child._id)
    })
  }

  findDescendants(categoryId)
  return descendants
}

/**
 * Count total categories (including children)
 */
export function countCategories(tree: CategoryTreeNode[] | undefined): number {
  if (!tree || tree.length === 0) return 0
  
  let count = 0

  const traverse = (nodes: CategoryTreeNode[]) => {
    nodes.forEach((node) => {
      count++
      if (node.children.length > 0) {
        traverse(node.children)
      }
    })
  }

  traverse(tree)
  return count
}

/**
 * Count root categories
 */
export function countRootCategories(tree: CategoryTreeNode[] | undefined): number {
  return tree?.length || 0
}

/**
 * Count active categories
 */
export function countActiveCategories(categories: Category[] | undefined): number {
  return categories?.filter((cat) => cat.isActive).length || 0
}

/**
 * Flatten tree to array (for search/filter)
 */
export function flattenTree(tree: CategoryTreeNode[]): CategoryTreeNode[] {
  const flattened: CategoryTreeNode[] = []

  const traverse = (nodes: CategoryTreeNode[]) => {
    nodes.forEach((node) => {
      flattened.push(node)
      if (node.children.length > 0) {
        traverse(node.children)
      }
    })
  }

  traverse(tree)
  return flattened
}

/**
 * Filter tree by search term
 */
export function filterTree(
  tree: CategoryTreeNode[],
  searchTerm: string
): CategoryTreeNode[] {
  if (!searchTerm.trim()) return tree

  const term = searchTerm.toLowerCase()

  const filterNode = (node: CategoryTreeNode): CategoryTreeNode | null => {
    const matchesSearch = node.name.toLowerCase().includes(term)
    const filteredChildren = node.children
      .map(filterNode)
      .filter((n): n is CategoryTreeNode => n !== null)

    if (matchesSearch || filteredChildren.length > 0) {
      return {
        ...node,
        children: filteredChildren,
        isExpanded: filteredChildren.length > 0, // Auto-expand if has matching children
      }
    }

    return null
  }

  return tree.map(filterNode).filter((n): n is CategoryTreeNode => n !== null)
}

/**
 * Expand/collapse all nodes in tree
 */
export function toggleAllNodes(
  tree: CategoryTreeNode[],
  expanded: boolean
): CategoryTreeNode[] {
  const toggleNode = (node: CategoryTreeNode): CategoryTreeNode => ({
    ...node,
    isExpanded: expanded,
    children: node.children.map(toggleNode),
  })

  return tree.map(toggleNode)
}

/**
 * Toggle single node expansion
 */
export function toggleNode(
  tree: CategoryTreeNode[],
  categoryId: string
): CategoryTreeNode[] {
  const toggle = (nodes: CategoryTreeNode[]): CategoryTreeNode[] => {
    return nodes.map((node) => {
      if (node._id === categoryId) {
        return {
          ...node,
          isExpanded: !node.isExpanded,
        }
      }
      return {
        ...node,
        children: toggle(node.children),
      }
    })
  }

  return toggle(tree)
}
