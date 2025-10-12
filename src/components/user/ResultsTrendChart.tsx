"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"

export type ResultsPoint = {
  date: string // ISO date string
  score: number
  avg?: number
}

export function ResultsTrendChart({
  data,
  title = "Score Trend",
  description = "Your performance over time",
  height = 260,
}: {
  data: ResultsPoint[]
  title?: string
  description?: string
  height?: number
}) {
  const chartConfig = React.useMemo(() => ({
    score: { label: "Score", color: "hsl(var(--chart-1))" },
    avg: { label: "Trend", color: "hsl(var(--chart-2))" },
  }) satisfies ChartConfig, [])

  // Guard empty
  const hasData = Array.isArray(data) && data.length > 0

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="px-2 pt-2 sm:px-6 sm:pt-4">
        {!hasData ? (
          <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">
            No scored interviews yet.
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="aspect-auto w-full" style={{ height }}>
            <AreaChart data={data} margin={{ left: 6, right: 6, top: 6 }}>
              <defs>
                <linearGradient id="fillScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-score)" stopOpacity={0.9} />
                  <stop offset="95%" stopColor="var(--color-score)" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="fillAvg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-avg)" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="var(--color-avg)" stopOpacity={0.08} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={24}
                tickFormatter={(value: string) => {
                  const d = new Date(value)
                  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" })
                }}
              />
              <YAxis
                domain={[0, 100]}
                tickCount={6}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    indicator="dot"
                    labelKey="date"
                    labelFormatter={(value) => {
                      try {
                        return new Date(String(value)).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                      } catch {
                        return String(value)
                      }
                    }}
                  />
                }
              />
              {/* Trend (avg) behind */}
              <Area
                dataKey="avg"
                type="monotone"
                fill="url(#fillAvg)"
                stroke="var(--color-avg)"
                strokeWidth={2}
                connectNulls
              />
              {/* Actual scores */}
              <Area
                dataKey="score"
                type="monotone"
                fill="url(#fillScore)"
                stroke="var(--color-score)"
                strokeWidth={2}
                connectNulls
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
