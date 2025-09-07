"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Pie, PieChart, Cell, Area, AreaChart } from "recharts"
import { 
  TrendingUp, 
  TrendingDown,
  Users, 
  Building2, 
  TestTube, 
  Clock,
  Target,
  Award,
  Globe,
  Calendar
} from "lucide-react"

const platformMetrics = {
  totalUsers: 2847,
  totalOrganizations: 156,
  totalTests: 18924,
  averageScore: 78.5,
  completionRate: 92.3,
  userGrowth: 12.5,
  testGrowth: 23.1,
  revenueGrowth: 15.3
}

const userGrowthData = [
  { month: "Aug", students: 1200, organizations: 45 },
  { month: "Sep", students: 1450, organizations: 52 },
  { month: "Oct", students: 1680, organizations: 67 },
  { month: "Nov", students: 1890, organizations: 89 },
  { month: "Dec", students: 2100, organizations: 123 },
  { month: "Jan", students: 2340, organizations: 156 }
]

const testPerformanceData = [
  { category: "Speaking", avgScore: 82, totalTests: 4200 },
  { category: "Listening", avgScore: 78, totalTests: 3800 },
  { category: "Reading", avgScore: 75, totalTests: 4100 },
  { category: "Writing", avgScore: 73, totalTests: 3900 },
  { category: "Overall", avgScore: 77, totalTests: 2900 }
]

const geographicData = [
  { region: "North America", users: 1200, tests: 8500, color: "#0088FE" },
  { region: "Europe", users: 800, tests: 5200, color: "#00C49F" },
  { region: "Asia", users: 600, tests: 3800, color: "#FFBB28" },
  { region: "Others", users: 247, tests: 1424, color: "#FF8042" }
]

const dailyActivityData = [
  { time: "00:00", tests: 12 },
  { time: "04:00", tests: 8 },
  { time: "08:00", tests: 45 },
  { time: "12:00", tests: 89 },
  { time: "16:00", tests: 67 },
  { time: "20:00", tests: 34 }
]

const organizationTypeData = [
  { type: "Visa Consultancy", count: 89, percentage: 57 },
  { type: "Educational", count: 45, percentage: 29 },
  { type: "Corporate", count: 22, percentage: 14 }
]

export function PlatformAnalytics() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="tests">Tests</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="geographic">Geographic</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">{platformMetrics.totalUsers.toLocaleString()}</div>
                    <p className="text-sm text-muted-foreground">Total Users</p>
                  </div>
                  <div className="flex items-center gap-1 text-green-600">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm">+{platformMetrics.userGrowth}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">{platformMetrics.totalOrganizations}</div>
                    <p className="text-sm text-muted-foreground">Organizations</p>
                  </div>
                  <Building2 className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">{platformMetrics.totalTests.toLocaleString()}</div>
                    <p className="text-sm text-muted-foreground">Tests Completed</p>
                  </div>
                  <div className="flex items-center gap-1 text-green-600">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm">+{platformMetrics.testGrowth}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">{platformMetrics.averageScore}%</div>
                    <p className="text-sm text-muted-foreground">Avg Score</p>
                  </div>
                  <Award className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Growth Trends */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>User Growth Trend</CardTitle>
                <CardDescription>Students and organizations over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    students: {
                      label: "Students",
                      color: "hsl(var(--chart-1))",
                    },
                    organizations: {
                      label: "Organizations",
                      color: "hsl(var(--chart-2))",
                    },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer>
                    <AreaChart data={userGrowthData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area 
                        type="monotone" 
                        dataKey="students" 
                        stackId="1"
                        stroke="var(--color-students)" 
                        fill="var(--color-students)"
                        fillOpacity={0.6}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="organizations" 
                        stackId="1"
                        stroke="var(--color-organizations)" 
                        fill="var(--color-organizations)"
                        fillOpacity={0.6}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Daily Activity Pattern</CardTitle>
                <CardDescription>Test completion by time of day</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    tests: {
                      label: "Tests",
                      color: "hsl(var(--chart-3))",
                    },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer>
                    <BarChart data={dailyActivityData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="tests" fill="var(--color-tests)" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* Organization Types */}
          <Card>
            <CardHeader>
              <CardTitle>Organization Distribution</CardTitle>
              <CardDescription>Breakdown by organization type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {organizationTypeData.map((item) => (
                  <div key={item.type} className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold">{item.count}</div>
                    <div className="text-sm text-muted-foreground">{item.type}</div>
                    <Badge variant="outline" className="mt-2">{item.percentage}%</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>User Registration Trend</CardTitle>
                <CardDescription>New user signups over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    students: {
                      label: "Students",
                      color: "hsl(var(--chart-1))",
                    },
                    organizations: {
                      label: "Organizations",
                      color: "hsl(var(--chart-2))",
                    },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer>
                    <LineChart data={userGrowthData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line 
                        type="monotone" 
                        dataKey="students" 
                        stroke="var(--color-students)" 
                        strokeWidth={2}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="organizations" 
                        stroke="var(--color-organizations)" 
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Engagement Metrics</CardTitle>
                <CardDescription>Key user activity indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Daily Active Users</span>
                  <span className="text-2xl font-bold">1,234</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Weekly Active Users</span>
                  <span className="text-2xl font-bold">5,678</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Monthly Active Users</span>
                  <span className="text-2xl font-bold">12,345</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Average Session Duration</span>
                  <span className="text-2xl font-bold">24m</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tests" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Test Performance by Category</CardTitle>
              <CardDescription>Average scores and completion rates</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  avgScore: {
                    label: "Average Score",
                    color: "hsl(var(--chart-1))",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer>
                  <BarChart data={testPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="avgScore" fill="var(--color-avgScore)" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{platformMetrics.completionRate}%</div>
                <p className="text-sm text-muted-foreground">Completion Rate</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">45m</div>
                <p className="text-sm text-muted-foreground">Avg Test Duration</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">2.3</div>
                <p className="text-sm text-muted-foreground">Avg Attempts</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">87%</div>
                <p className="text-sm text-muted-foreground">Pass Rate</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="geographic" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Geographic Distribution</CardTitle>
                <CardDescription>Users by region</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    users: {
                      label: "Users",
                    },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={geographicData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="users"
                        label={({ region, percent }) => `${region} ${(percent * 100).toFixed(0)}%`}
                      >
                        {geographicData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Regional Statistics</CardTitle>
                <CardDescription>Detailed breakdown by region</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {geographicData.map((region) => (
                    <div key={region.region} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded" 
                          style={{ backgroundColor: region.color }}
                        />
                        <span className="font-medium">{region.region}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{region.users.toLocaleString()} users</div>
                        <div className="text-sm text-muted-foreground">{region.tests.toLocaleString()} tests</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
