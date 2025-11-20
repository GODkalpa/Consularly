"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { fetchWithCache, cache } from "@/lib/cache"
import { 
  Users, Building2, TestTube, TrendingUp, TrendingDown, AlertTriangle,
  CheckCircle, Clock, DollarSign, Activity, Award, Target, BarChart3,
  Calendar, UserPlus, FileText, Zap, ArrowUpRight, ArrowDownRight,
  Globe, MessageSquare, Star, Filter, Download, RefreshCw
} from "lucide-react"
import { ChartContainer, ChartTooltip } from "@/components/ui/chart"
import { 
  Bar, BarChart, Line, LineChart, ResponsiveContainer, XAxis, YAxis, 
  CartesianGrid, Pie, PieChart, Cell, Area, AreaChart, RadarChart,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend
} from "recharts"
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

interface EnhancedStats extends DashboardStats {
  todayUsers: number
  todayInterviews: number
  weeklyGrowth: number
  completionRate: number
  averageScore: number
  topPerformingRoute: string
  peakHour: number
}

interface TrendData {
  testUsageData: Array<{ month: string; tests: number }>
  organizationTypeData: Array<{ name: string; value: number; color: string }>
}

interface EnhancedTrendData extends TrendData {
  dailyActivity: Array<{ day: string; interviews: number; users: number }>
  routePerformance: Array<{ route: string; avgScore: number; count: number }>
  hourlyDistribution: Array<{ hour: number; count: number }>
  scoreDistribution: Array<{ range: string; count: number }>
  weeklyComparison: { thisWeek: number; lastWeek: number; change: number }
}

interface Activity {
  id: string
  type: string
  message: string
  time: string
  status: 'success' | 'warning' | 'info' | 'error'
}

interface InterviewInsight {
  totalCompleted: number
  totalFailed: number
  averageDuration: number
  topRoute: string
  topRouteCount: number
}

export function EnhancedDashboardOverview() {
  const [stats, setStats] = useState<EnhancedStats | null>(null)
  const [trends, setTrends] = useState<EnhancedTrendData | null>(null)
  const [insights, setInsights] = useState<InterviewInsight | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d'>('30d')

  const loadDashboardData = async (forceRefresh = false) => {
    if (!firebaseEnabled) {
      setLoading(false)
      return
    }

    try {
      if (forceRefresh) setRefreshing(true)
      
      const token = await auth.currentUser?.getIdToken()
      if (!token) throw new Error('Not authenticated')

      const headers = { Authorization: `Bearer ${token}` }

      // Fetch all data in parallel
      const [statsData, trendsData, insightsData, logsData] = await Promise.all([
        fetch(`/api/admin/stats/enhanced-overview?timeRange=${selectedTimeRange}`, { 
          headers,
          cache: forceRefresh ? 'no-cache' : 'default'
        }).then(r => r.json()),
        fetch(`/api/admin/stats/enhanced-trends?timeRange=${selectedTimeRange}`, { 
          headers,
          cache: forceRefresh ? 'no-cache' : 'default'
        }).then(r => r.json()),
        fetch(`/api/admin/stats/interview-insights?timeRange=${selectedTimeRange}`, { 
          headers,
          cache: forceRefresh ? 'no-cache' : 'default'
        }).then(r => r.json()),
        fetch('/api/admin/audit-logs?limit=6', { headers }).then(r => r.json()).catch(() => ({ logs: [] })),
      ])

      setStats(statsData)
      setTrends(trendsData)
      setInsights(insightsData)
      setActivities(logsData.logs || [])
      setError(null)
    } catch (e: any) {
      console.error('[EnhancedDashboardOverview] Load error', e)
      setError(e?.message || 'Failed to load dashboard data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [selectedTimeRange])

  const handleRefresh = () => {
    loadDashboardData(true)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[400px] bg-muted rounded-lg animate-pulse" />
          ))}
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
          <Button onClick={handleRefresh} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  const totalNewUsers = trends.dailyActivity.reduce((acc, day) => acc + day.users, 0)
  const totalOrganizations = trends.organizationTypeData.reduce((acc, plan) => acc + plan.value, 0)

  const getChangeIndicator = (change: number) => {
    if (change > 0) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
          <TrendingUp className="h-3 w-3 mr-1" />
          +{change}%
        </Badge>
      )
    } else if (change < 0) {
      return (
        <Badge variant="default" className="bg-red-100 text-red-800 border-red-200">
          <TrendingDown className="h-3 w-3 mr-1" />
          {change}%
        </Badge>
      )
    }
    return <Badge variant="outline">No change</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
          <p className="text-muted-foreground mt-1">Real-time platform analytics and insights</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Select
              value={selectedTimeRange}
              onValueChange={(value) => setSelectedTimeRange(value as "7d" | "30d" | "90d")}
            >
              <SelectTrigger className="w-[160px] h-9">
                <SelectValue placeholder="Time range" />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleRefresh} variant="outline" size="sm" disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>
      </div>

      {/* Key Metrics - Enhanced */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
              <span>+{stats.todayUsers} today</span>
              {getChangeIndicator(stats.weeklyGrowth)}
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
            <p className="text-xs text-muted-foreground mt-1">
              ${stats.monthlyRevenue.toLocaleString()} MRR
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interviews</CardTitle>
            <TestTube className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalInterviews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
              <span>+{stats.todayInterviews} today</span>
              <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                {stats.completionRate}% success
              </Badge>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average score</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageScore}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Top route: {stats.topPerformingRoute}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats Bar */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="border border-border/60 bg-background/80 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                <Activity className="h-4 w-4" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-muted-foreground">Active now</p>
                <p className="text-lg font-semibold leading-tight">{stats.activeUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/60 bg-background/80 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                <CheckCircle className="h-4 w-4" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-muted-foreground">System health</p>
                <p className="text-lg font-semibold leading-tight">{stats.systemHealth}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/60 bg-background/80 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-50 text-amber-600 ring-1 ring-amber-100">
                <Clock className="h-4 w-4" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-muted-foreground">Peak hour</p>
                <p className="text-lg font-semibold leading-tight">{stats.peakHour}:00</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/60 bg-background/80 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-50 text-rose-600 ring-1 ring-rose-100">
                <MessageSquare className="h-4 w-4" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-muted-foreground">Support tickets</p>
                <p className="text-lg font-semibold leading-tight">{stats.pendingSupport}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Section */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Activity Trend */}
            <Card className="border border-border/60 bg-background/80 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
              <CardHeader>
                <CardTitle>Activity Trend</CardTitle>
                <CardDescription>Daily interviews and user activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trends.dailyActivity}>
                      <defs>
                        <linearGradient id="colorInterviews" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <ChartTooltip />
                      <Area type="monotone" dataKey="interviews" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorInterviews)" />
                      <Area type="monotone" dataKey="users" stroke="#3b82f6" fillOpacity={1} fill="url(#colorUsers)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Route Performance */}
            <Card className="border border-border/60 bg-background/80 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
              <CardHeader>
                <CardTitle>Route Performance</CardTitle>
                <CardDescription>Average scores by visa type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trends.routePerformance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="route" />
                      <YAxis />
                      <ChartTooltip />
                      <Bar dataKey="avgScore" fill="#10b981" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Hourly Distribution */}
            <Card className="border border-border/60 bg-background/80 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
              <CardHeader>
                <CardTitle>Usage by Hour</CardTitle>
                <CardDescription>Interview distribution throughout the day</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trends.hourlyDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <ChartTooltip />
                      <Line 
                        type="monotone" 
                        dataKey="count" 
                        stroke="#f59e0b" 
                        strokeWidth={3}
                        dot={{ fill: "#f59e0b", r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Score Distribution */}
            <Card className="border border-border/60 bg-background/80 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
              <CardHeader>
                <CardTitle>Score Distribution</CardTitle>
                <CardDescription>Interview performance ranges</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trends.scoreDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="range" />
                      <YAxis />
                      <ChartTooltip />
                      <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                        {trends.scoreDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={
                            entry.range.includes('90-100') ? '#10b981' :
                            entry.range.includes('80-89') ? '#84cc16' :
                            entry.range.includes('70-79') ? '#f59e0b' :
                            entry.range.includes('60-69') ? '#f97316' : '#ef4444'
                          } />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Interview Insights */}
          {insights && (
            <Card>
              <CardHeader>
                <CardTitle>Interview Insights</CardTitle>
                <CardDescription>Key metrics and patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium">Completed</span>
                    </div>
                    <p className="text-3xl font-bold">{insights.totalCompleted}</p>
                    <p className="text-xs text-muted-foreground">
                      {((insights.totalCompleted / (insights.totalCompleted + insights.totalFailed)) * 100).toFixed(1)}% success rate
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      <span className="text-sm font-medium">Failed</span>
                    </div>
                    <p className="text-3xl font-bold">{insights.totalFailed}</p>
                    <p className="text-xs text-muted-foreground">
                      Technical or user issues
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-blue-600" />
                      <span className="text-sm font-medium">Avg Duration</span>
                    </div>
                    <p className="text-3xl font-bold">{Math.round(insights.averageDuration)}m</p>
                    <p className="text-xs text-muted-foreground">
                      Per interview session
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-yellow-600" />
                      <span className="text-sm font-medium">Top Route</span>
                    </div>
                    <p className="text-2xl font-bold">{insights.topRoute}</p>
                    <p className="text-xs text-muted-foreground">
                      {insights.topRouteCount} interviews
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="border border-border/60 bg-background/80 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
              <CardHeader>
                <CardTitle>Monthly Test Usage</CardTitle>
                <CardDescription>Interview completions over time</CardDescription>
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

            <Card className="border border-border/60 bg-background/80 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
              <CardHeader>
                <CardTitle>Week Comparison</CardTitle>
                <CardDescription>This week vs last week performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">This Week</p>
                      <p className="text-3xl font-bold">{trends.weeklyComparison.thisWeek}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Last Week</p>
                      <p className="text-3xl font-bold">{trends.weeklyComparison.lastWeek}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-center">
                    {trends.weeklyComparison.change > 0 ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <ArrowUpRight className="h-8 w-8" />
                        <span className="text-4xl font-bold">+{trends.weeklyComparison.change}%</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-red-600">
                        <ArrowDownRight className="h-8 w-8" />
                        <span className="text-4xl font-bold">{trends.weeklyComparison.change}%</span>
                      </div>
                    )}
                  </div>
                  <Progress 
                    value={Math.abs(trends.weeklyComparison.change)} 
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="border border-border/60 bg-background/80 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
              <CardHeader>
                <CardTitle>User Growth</CardTitle>
                <CardDescription>
                  New user registrations over time 
                  <span className="mx-1">·</span>
                  {totalNewUsers.toLocaleString()} total
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trends.dailyActivity}>
                      <defs>
                        <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis domain={[0, 'dataMax + 1']} allowDecimals={false} />
                      <ChartTooltip />
                      <Area 
                        type="monotone" 
                        dataKey="users" 
                        stroke="#3b82f6" 
                        fillOpacity={1} 
                        fill="url(#colorGrowth)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border/60 bg-background/80 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
              <CardHeader>
                <CardTitle>User Engagement</CardTitle>
                <CardDescription>Active users and retention metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Daily Active Users</span>
                    <span className="text-2xl font-bold">{stats.activeUsers}</span>
                  </div>
                  <Progress value={(stats.activeUsers / stats.totalUsers) * 100} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Weekly Active Users</span>
                    <span className="text-2xl font-bold">{Math.round(stats.activeUsers * 1.5)}</span>
                  </div>
                  <Progress value={(stats.activeUsers * 1.5 / stats.totalUsers) * 100} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Monthly Active Users</span>
                    <span className="text-2xl font-bold">{Math.round(stats.activeUsers * 2.5)}</span>
                  </div>
                  <Progress value={(stats.activeUsers * 2.5 / stats.totalUsers) * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="border border-border/60 bg-background/80 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
              <CardHeader>
                <CardTitle>Organization Distribution</CardTitle>
                <CardDescription>Revenue by plan type</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-6 md:flex-row md:items-center">
                <div className="h-[260px] w-full md:w-1/2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={trends.organizationTypeData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        innerRadius={50}
                        paddingAngle={4}
                        dataKey="value"
                        labelLine={false}
                      >
                        {trends.organizationTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex-1 space-y-3">
                  {trends.organizationTypeData.map((plan) => {
                    const percent = totalOrganizations ? (plan.value / totalOrganizations) * 100 : 0
                    return (
                      <div key={plan.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block h-2 w-2 rounded-full"
                            style={{ backgroundColor: plan.color }}
                          />
                          <span>{plan.name}</span>
                        </div>
                        <span className="font-mono text-xs text-muted-foreground">
                          {percent.toFixed(0)}% 
                          <span className="mx-1">•</span>
                          {plan.value}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Metrics</CardTitle>
                <CardDescription>Monthly recurring revenue breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Monthly Recurring Revenue</span>
                      <span className="text-2xl font-bold">${stats.monthlyRevenue.toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Annual run rate: ${(stats.monthlyRevenue * 12).toLocaleString()}
                    </p>
                  </div>

                  <div className="space-y-3">
                    {trends.organizationTypeData.map((plan) => {
                      const planRevenue = plan.name.includes('Basic') ? plan.value * 99 :
                                         plan.name.includes('Premium') ? plan.value * 299 :
                                         plan.value * 999
                      const percentage = (planRevenue / stats.monthlyRevenue) * 100
                      
                      return (
                        <div key={plan.name}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm">{plan.name}</span>
                            <span className="text-sm font-medium">${planRevenue.toLocaleString()}</span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Bottom Section - System Status and Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border border-border/60 bg-background/80 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
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
            
            <div className="space-y-3 pt-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Active Users (30d)</span>
                </div>
                <span className="font-medium">{stats.activeUsers.toLocaleString()}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Completion Rate</span>
                </div>
                <span className="font-medium">{stats.completionRate}%</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-orange-600" />
                  <span className="text-sm">Pending Support</span>
                </div>
                <Badge variant="outline" className="text-orange-600">
                  {stats.pendingSupport}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/60 bg-background/80 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest platform events and notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
              ) : (
                activities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${
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
