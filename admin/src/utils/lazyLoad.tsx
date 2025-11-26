import { lazy, Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

/**
 * Loading fallback component for lazy-loaded pages
 */
export function PageLoader() {
  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-[250px]" />
        <Skeleton className="h-4 w-[400px]" />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-[200px]" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Lazy load wrapper with loading fallback
 */
export function lazyLoad<T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
) {
  const LazyComponent = lazy(importFunc)
  
  return (props: React.ComponentProps<T>) => (
    <Suspense fallback={<PageLoader />}>
      <LazyComponent {...props} />
    </Suspense>
  )
}

// Lazy loaded pages
export const DashboardPage = lazyLoad(() => import('@/pages/Dashboard'))
export const ProductsPageLazy = lazyLoad(() => import('@/pages/products/ProductsPage'))
export const VariantsPageLazy = lazyLoad(() => import('@/pages/products/VariantsPage'))
export const CategoriesPage = lazyLoad(() => import('@/pages/categories/CategoriesPage'))
export const ColorsPage = lazyLoad(() => import('@/pages/colors/ColorsPage'))
export const CustomersPage = lazyLoad(() => import('@/pages/customers/CustomersPage'))
export const OrdersPage = lazyLoad(() => import('@/pages/orders/OrdersPage'))
