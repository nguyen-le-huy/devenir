/**
 * Stats Grid Component
 * Grid layout for multiple stat cards
 */
import React from 'react'
import { StatCard } from './StatCard'
import { cn } from '@/lib/utils'

export interface StatItem {
  title: string
  value: string | number
  icon?: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  valueClassName?: string
}

interface StatsGridProps {
  stats: StatItem[]
  columns?: 2 | 3 | 4 | 5
  className?: string
}

export function StatsGrid({ stats, columns = 4, className }: StatsGridProps) {
  const gridCols = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
    5: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5',
  }

  return (
    <div className={cn('grid gap-4', gridCols[columns], className)}>
      {stats.map((stat, index) => (
        <StatCard
          key={index}
          title={stat.title}
          value={stat.value}
          icon={stat.icon}
          trend={stat.trend}
          valueClassName={stat.valueClassName}
        />
      ))}
    </div>
  )
}
