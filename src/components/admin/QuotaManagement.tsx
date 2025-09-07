"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Line, LineChart } from "recharts"
import { 
  Search, 
  Plus, 
  Edit, 
  AlertTriangle,
  TrendingUp,
  Calendar,
  RefreshCw,
  Settings,
  TestTube
} from "lucide-react"

interface QuotaData {
  organizationId: string
  organizationName: string
  currentQuota: number
  usedQuota: number
  resetDate: string
  plan: string
  status: 'healthy' | 'warning' | 'critical'
  lastUsage: string
  monthlyTrend: number[]
}

const mockQuotaData: QuotaData[] = [
  {
    organizationId: "1",
    organizationName: "Global Visa Services",
    currentQuota: 500,
    usedQuota: 425,
    resetDate: "2024-02-01",
    plan: "Premium",
    status: "warning",
    lastUsage: "2024-01-20",
    monthlyTrend: [320, 380, 410, 425]
  },
  {
    organizationId: "2",
    organizationName: "ABC Immigration",
    currentQuota: 100,
    usedQuota: 95,
    resetDate: "2024-02-01",
    plan: "Basic",
    status: "critical",
    lastUsage: "2024-01-19",
    monthlyTrend: [65, 78, 89, 95]
  },
  {
    organizationId: "3",
    organizationName: "Education Plus",
    currentQuota: 1000,
    usedQuota: 234,
    resetDate: "2024-02-01",
    plan: "Enterprise",
    status: "healthy",
    lastUsage: "2024-01-18",
    monthlyTrend: [180, 200, 220, 234]
  }
]

const usageTrendData = [
  { month: "Sep", usage: 12500 },
  { month: "Oct", usage: 14200 },
  { month: "Nov", usage: 15800 },
  { month: "Dec", usage: 17200 },
  { month: "Jan", usage: 18900 }
]

const quotaDistributionData = [
  { plan: "Basic", organizations: 45, totalQuota: 4500 },
  { plan: "Premium", organizations: 89, totalQuota: 44500 },
  { plan: "Enterprise", organizations: 22, totalQuota: 22000 }
]

export function QuotaManagement() {
  const [quotaData, setQuotaData] = useState<QuotaData[]>(mockQuotaData)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isQuotaDialogOpen, setIsQuotaDialogOpen] = useState(false)
  const [selectedOrg, setSelectedOrg] = useState<string>("")

  const filteredData = quotaData.filter(item => {
    const matchesSearch = item.organizationName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || item.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string, percentage: number) => {
    const configs = {
      healthy: { variant: "default" as const, color: "text-green-600" },
      warning: { variant: "secondary" as const, color: "text-orange-600" },
      critical: { variant: "destructive" as const, color: "text-red-600" }
    }
    
    const config = configs[status as keyof typeof configs] || configs.healthy
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {status === 'critical' && <AlertTriangle className="h-3 w-3" />}
        {percentage.toFixed(0)}% Used
      </Badge>
    )
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 95) return "bg-red-500"
    if (percentage >= 85) return "bg-orange-500"
    return "bg-green-500"
  }

  const totalStats = {
    totalQuota: quotaData.reduce((sum, item) => sum + item.currentQuota, 0),
    totalUsed: quotaData.reduce((sum, item) => sum + item.usedQuota, 0),
    criticalOrgs: quotaData.filter(item => item.status === 'critical').length,
    warningOrgs: quotaData.filter(item => item.status === 'warning').length
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="organizations">Organizations</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{totalStats.totalQuota.toLocaleString()}</div>
                <p className="text-sm text-muted-foreground">Total Monthly Quota</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{totalStats.totalUsed.toLocaleString()}</div>
                <p className="text-sm text-muted-foreground">Quota Used This Month</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-red-600">{totalStats.criticalOrgs}</div>
                <p className="text-sm text-muted-foreground">Critical Organizations</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-orange-600">{totalStats.warningOrgs}</div>
                <p className="text-sm text-muted-foreground">Warning Organizations</p>
              </CardContent>
            </Card>
          </div>

          {/* Usage Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Platform Usage Trend</CardTitle>
              <CardDescription>Monthly test usage across all organizations</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  usage: {
                    label: "Tests Used",
                    color: "hsl(var(--chart-1))",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer>
                  <LineChart data={usageTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line 
                      type="monotone" 
                      dataKey="usage" 
                      stroke="var(--color-usage)" 
                      strokeWidth={2}
                      dot={{ fill: "var(--color-usage)" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Critical Alerts */}
          <Card>
            <CardHeader>
              <CardTitle>Quota Alerts</CardTitle>
              <CardDescription>Organizations requiring immediate attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {quotaData.filter(item => item.status === 'critical' || item.status === 'warning').map((item) => {
                  const percentage = (item.usedQuota / item.currentQuota) * 100
                  return (
                    <div key={item.organizationId} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <AlertTriangle className={`h-5 w-5 ${item.status === 'critical' ? 'text-red-500' : 'text-orange-500'}`} />
                        <div>
                          <div className="font-medium">{item.organizationName}</div>
                          <div className="text-sm text-muted-foreground">
                            {item.usedQuota} / {item.currentQuota} tests used ({percentage.toFixed(0)}%)
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Increase Quota
                      </Button>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="organizations" className="space-y-6">
          {/* Organization Quota Management */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Organization Quotas</CardTitle>
                  <CardDescription>Manage test quotas for all organizations</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reset All Quotas
                  </Button>
                  <Dialog open={isQuotaDialogOpen} onOpenChange={setIsQuotaDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Adjust Quota
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Adjust Organization Quota</DialogTitle>
                        <DialogDescription>Modify the monthly test quota for an organization</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Organization</label>
                          <Select value={selectedOrg} onValueChange={setSelectedOrg}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select organization" />
                            </SelectTrigger>
                            <SelectContent>
                              {quotaData.map((org) => (
                                <SelectItem key={org.organizationId} value={org.organizationId}>
                                  {org.organizationName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">New Monthly Quota</label>
                          <Input type="number" placeholder="Enter new quota" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Effective Date</label>
                          <Input type="date" />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setIsQuotaDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={() => setIsQuotaDialogOpen(false)}>
                            Update Quota
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search organizations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="healthy">Healthy</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Quota Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Organization</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Quota Usage</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reset Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((item) => {
                      const percentage = (item.usedQuota / item.currentQuota) * 100
                      
                      return (
                        <TableRow key={item.organizationId}>
                          <TableCell>
                            <div className="font-medium">{item.organizationName}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{item.plan}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span>{item.usedQuota} / {item.currentQuota}</span>
                                <span className="text-muted-foreground">{percentage.toFixed(0)}%</span>
                              </div>
                              <Progress value={percentage} className="h-2" />
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(item.status, percentage)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              {new Date(item.resetDate).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <TestTube className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Quota Distribution Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Quota Distribution by Plan</CardTitle>
              <CardDescription>Total quota allocation across subscription plans</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  totalQuota: {
                    label: "Total Quota",
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
                  <BarChart data={quotaDistributionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="plan" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="totalQuota" fill="var(--color-totalQuota)" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          {/* Quota Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Quota Management Settings</CardTitle>
              <CardDescription>Configure global quota policies and rules</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Reset Policies</h3>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Auto Reset Frequency</label>
                    <Select defaultValue="monthly">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Reset Day of Month</label>
                    <Input type="number" min="1" max="31" defaultValue="1" />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Alert Thresholds</h3>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Warning Threshold (%)</label>
                    <Input type="number" min="0" max="100" defaultValue="85" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Critical Threshold (%)</label>
                    <Input type="number" min="0" max="100" defaultValue="95" />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button>Save Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
