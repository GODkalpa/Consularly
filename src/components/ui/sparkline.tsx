import React, { useMemo } from 'react'

interface SparklineProps {
  data: number[]
  trend: string
  width?: number
  height?: number
}

export const Sparkline = React.memo<SparklineProps>(({ 
  data, 
  trend,
  width = 80,
  height = 32
}) => {
  const isPositive = trend.startsWith('+')
  const color = isPositive ? '#10b981' : '#ef4444'
  
  // Memoize data transformation calculations
  const points = useMemo(() => {
    const dataPoints = (!data || data.length === 0) 
      ? [10, 12, 8, 15, 14, 18, 16] // fallback
      : data
    
    const max = Math.max(...dataPoints)
    const min = Math.min(...dataPoints)
    const range = max - min || 1
    
    return dataPoints.map((value, index) => {
      const x = (index / (dataPoints.length - 1)) * (width - 8)
      const y = (height - 8) - ((value - min) / range) * (height - 16) + 4
      return `${x},${y}`
    }).join(' ')
  }, [data, width, height])
  
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none" className="mt-2">
      <polyline
        points={points}
        stroke={color}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}, (prevProps, nextProps) => {
  // Custom comparison function to prevent unnecessary re-renders
  return (
    prevProps.trend === nextProps.trend &&
    prevProps.width === nextProps.width &&
    prevProps.height === nextProps.height &&
    prevProps.data.length === nextProps.data.length &&
    prevProps.data.every((val, idx) => val === nextProps.data[idx])
  )
})

Sparkline.displayName = 'Sparkline'
