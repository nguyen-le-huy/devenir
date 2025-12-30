/**
 * Stat Card Component
 * Reusable statistics card with icon
 */
import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  icon?: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
  valueClassName?: string
}

export function StatCard({ title, value, icon, trend, className, valueClassName }: StatCardProps) {
  return (
    <Card className={className}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-muted-foreground">{title}</div>
            <div className={cn('text-2xl font-bold', valueClassName)}>{value}</div>
            {trend && (
              <div
                className={cn(
                  'text-xs mt-1',
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                )}
              >
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </div>
            )}
          </div>
          {icon && <div className="text-muted-foreground">{icon}</div>}
        </div>
      </CardContent>
    </Card>
  )
}
