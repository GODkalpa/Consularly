"use client"

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

const mockData = {
  totalUsers: 2847,
  totalOrganizations: 156,
  totalTests: 18924,
  monthlyRevenue: 45600,
  activeUsers: 1892,
  pendingSupport: 23,
  systemHealth: 98.5
}

const testUsageData = [
  { month: "Jan", tests: 1200 },
  { month: "Feb", tests: 1450 },
  { month: "Mar", tests: 1680 },
  { month: "Apr", tests: 1890 },
  { month: "May", tests: 2100 },
  { month: "Jun", tests: 2340 }
]

const organizationTypeData = [
  { name: "Visa Consultancies", value: 89, color: "#0088FE" },
  { name: "Educational Institutions", value: 45, color: "#00C49F" },
  { name: "Corporate Training", value: 22, color: "#FFBB28" }
]

const recentActivities = [
  { id: 1, type: "user", message: "New organization 'Global Visa Services' registered", time: "2 hours ago", status: "success" },
  { id: 2, type: "quota", message: "ABC Consultancy approaching quota limit (85% used)", time: "4 hours ago", status: "warning" },
  { id: 3, type: "system", message: "Monthly quota reset completed for all organizations", time: "1 day ago", status: "info" },
  { id: 4, type: "billing", message: "Payment received from XYZ Immigration Services", time: "2 days ago", status: "success" }
]

export function DashboardOverview() {
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
            <div className="text-2xl font-bold">{mockData.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+12.5%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organizations</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockData.totalOrganizations}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+8.2%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tests Completed</CardTitle>
            <TestTube className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockData.totalTests.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+23.1%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${mockData.monthlyRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+15.3%</span> from last month
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
                <LineChart data={testUsageData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip />
                  <Line 
                    type="monotone" 
                    dataKey="tests" 
                    stroke="#0088FE" 
                    strokeWidth={2}
                    dot={{ fill: "#0088FE" }}
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
                    data={organizationTypeData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {organizationTypeData.map((entry, index) => (
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
              <Badge variant="default" className="bg-green-100 text-green-800">
                {mockData.systemHealth}% Healthy
              </Badge>
            </div>
            <Progress value={mockData.systemHealth} className="h-2" />
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Active Users</span>
                <span className="font-medium">{mockData.activeUsers.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Pending Support Tickets</span>
                <Badge variant="outline" className="text-orange-600">
                  {mockData.pendingSupport}
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
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className={`mt-1 h-2 w-2 rounded-full ${
                    activity.status === 'success' ? 'bg-green-500' :
                    activity.status === 'warning' ? 'bg-orange-500' :
                    'bg-blue-500'
                  }`} />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">{activity.message}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
