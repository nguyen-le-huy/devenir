import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  IconTrendingUp,
  IconTrendingDown,
} from "@tabler/icons-react"
import type { ReactNode } from "react"

export interface MetricCardProps {
  title: string
  value: string | number
  change?: number
  unit?: string
  icon?: ReactNode
  color?: "primary" | "success" | "warning" | "destructive" | "secondary"
  trend?: "up" | "down" | "neutral"
  className?: string
}

export function MetricCard({
  title,
  value,
  change,
  unit,
  icon,
  color = "primary",
  trend,
  className = "",
}: MetricCardProps) {
  const trendColor = trend === "up" ? "bg-green-100 text-green-800" : trend === "down" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"
  const formattedChange = change ? (change > 0 ? `+${change}` : `${change}`) : null

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && (
          <div className={`h-8 w-8 rounded-lg bg-${color}/10 p-1.5 text-${color}`}>
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-bold">{value}</div>
          {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
        </div>
        {formattedChange && (
          <p className={`mt-2 flex items-center gap-1 text-sm font-medium ${trendColor}`}>
            {trend === "up" && <IconTrendingUp className="h-4 w-4" />}
            {trend === "down" && <IconTrendingDown className="h-4 w-4" />}
            <span>
              {formattedChange}% from last period
            </span>
          </p>
        )}
      </CardContent>
    </Card>
  )
}
