import React, { useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Sparkline } from '@/components/ui/sparkline'

interface StatCardProps {
  label: string
  value: string | number
  trend: string
  sparklineData: number[]
}

export const StatCard = React.memo<StatCardProps>(({ 
  label, 
  value, 
  trend, 
  sparklineData 
}) => {
  const trendColor = useMemo(() => {
    return trend.startsWith('+') ? 'text-green-600' : 'text-red-600'
  }, [trend])

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{label}</p>
          <span className={`text-sm font-medium ${trendColor}`}>
            {trend}
          </span>
        </div>
        <div className="text-3xl font-bold mt-2">{value}</div>
        <Sparkline data={sparklineData} trend={trend} />
      </CardContent>
    </Card>
  )
}, (prevProps, nextProps) => {
  // Only re-render if props actually changed
  return (
    prevProps.label === nextProps.label &&
    prevProps.value === nextProps.value &&
    prevProps.trend === nextProps.trend &&
    prevProps.sparklineData.length === nextProps.sparklineData.length &&
    prevProps.sparklineData.every((val, idx) => val === nextProps.sparklineData[idx])
  )
})

StatCard.displayName = 'StatCard'
