"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Users, 
  Building2, 
  TestTube, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign
} from "lucide-react"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Pie, PieChart, Cell } from "recharts"
import { ClientWrapper } from "@/components/ClientWrapper"
import { auth, firebaseEnabled } from "@/lib/firebase"

interface DashboardStats {
  totalUsers: number
  totalOrganizations: number
  totalInterviews: number
  monthlyRevenue: number
  activeUsers: number
  pendingSupport: number
  systemHealth: number
}

interface TrendData {
  testUsageData: Array<{ month: string; tests: number }>
  organizationTypeData: Array<{ name: string; value: number; color: string }>
}

interface Activity {
  id: string
  type: string
  message: string
  time: string
  status: 'success' | 'warning' | 'info' | 'error'
}

export function DashboardOverview() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [trends, setTrends] = useState<TrendData | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!firebaseEnabled) {
      setLoading(false)
      return
    }

    let mounted = true

    async function loadDashboardData() {
      try {
        const token = await auth.currentUser?.getIdToken()
        if (!token) {
          throw new Error('Not authenticated')
        }

        const headers = { Authorization: `Bearer ${token}` }

        // Fetch all data in parallel
        const [statsRes, trendsRes, logsRes] = await Promise.all([
          fetch('/api/admin/stats/overview', { headers }),
          fetch('/api/admin/stats/trends', { headers }),
          fetch('/api/admin/audit-logs?limit=4', { headers }),
        ])

        if (!statsRes.ok || !trendsRes.ok || !logsRes.ok) {
          throw new Error('Failed to load dashboard data')
        }

        const statsData = await statsRes.json()
        const trendsData = await trendsRes.json()
        const logsData = await logsRes.json()

        if (!mounted) return

        setStats(statsData)
        setTrends(trendsData)
        setActivities(logsData.logs || [])
        setError(null)
      } catch (e: any) {
        console.error('[DashboardOverview] Load error', e)
        if (mounted) {
          setError(e?.message || 'Failed to load dashboard data')
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadDashboardData()

    // Refresh every 30 seconds
    const interval = setInterval(loadDashboardData, 30000)

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error || !stats || !trends) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-lg font-medium mb-2">Failed to load dashboard</p>
          <p className="text-sm text-muted-foreground">{error || 'Unknown error'}</p>
        </div>
      </div>
    )
  }
  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Real-time from Firestore
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organizations</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrganizations}</div>
            <p className="text-xs text-muted-foreground">
              Real-time from Firestore
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interviews Completed</CardTitle>
            <TestTube className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalInterviews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Real-time from Firestore
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.monthlyRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              From organization plans
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Test Usage Trend</CardTitle>
            <CardDescription>Monthly mock test completions over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends.testUsageData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip />
                  <Line 
                    type="monotone" 
                    dataKey="tests" 
                    stroke="hsl(var(--chart-1))" 
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--chart-1))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Organization Types</CardTitle>
            <CardDescription>Distribution of registered organizations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={trends.organizationTypeData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {trends.organizationTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>Platform performance and status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Health</span>
              <Badge variant="default" className="bg-[hsla(var(--success),0.15)] text-[hsl(var(--success))]">
                {stats.systemHealth}% Healthy
              </Badge>
            </div>
            <Progress value={stats.systemHealth} className="h-2" />
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Active Users (30d)</span>
                <span className="font-medium">{stats.activeUsers.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Pending Support Tickets</span>
                <Badge variant="outline" className="text-orange-600">
                  {stats.pendingSupport}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest platform events and notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent activity</p>
              ) : (
                activities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className={`mt-1 h-2 w-2 rounded-full ${
                      activity.status === 'success' ? 'bg-[hsl(var(--success))]' :
                      activity.status === 'warning' ? 'bg-[hsl(var(--warn))]' :
                      activity.status === 'error' ? 'bg-destructive' :
                      'bg-[hsl(var(--primary))]'
                    }`} />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.time).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
