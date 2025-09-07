"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Search, 
  Download, 
  CreditCard, 
  DollarSign,
  TrendingUp,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react"

interface Invoice {
  id: string
  organizationName: string
  amount: number
  status: 'paid' | 'pending' | 'overdue'
  dueDate: string
  paidDate?: string
  plan: string
  period: string
}

interface Subscription {
  id: string
  organizationName: string
  plan: 'basic' | 'premium' | 'enterprise'
  status: 'active' | 'cancelled' | 'suspended'
  monthlyAmount: number
  nextBilling: string
  startDate: string
  quota: number
}

const mockInvoices: Invoice[] = [
  {
    id: "INV-001",
    organizationName: "Global Visa Services",
    amount: 299,
    status: "paid",
    dueDate: "2024-01-01",
    paidDate: "2023-12-28",
    plan: "Premium",
    period: "January 2024"
  },
  {
    id: "INV-002",
    organizationName: "ABC Immigration",
    amount: 99,
    status: "pending",
    dueDate: "2024-01-15",
    plan: "Basic",
    period: "January 2024"
  },
  {
    id: "INV-003",
    organizationName: "Education Plus",
    amount: 599,
    status: "overdue",
    dueDate: "2023-12-01",
    plan: "Enterprise",
    period: "December 2023"
  }
]

const mockSubscriptions: Subscription[] = [
  {
    id: "SUB-001",
    organizationName: "Global Visa Services",
    plan: "premium",
    status: "active",
    monthlyAmount: 299,
    nextBilling: "2024-02-01",
    startDate: "2023-06-01",
    quota: 500
  },
  {
    id: "SUB-002",
    organizationName: "ABC Immigration",
    plan: "basic",
    status: "active",
    monthlyAmount: 99,
    nextBilling: "2024-02-15",
    startDate: "2023-12-15",
    quota: 100
  },
  {
    id: "SUB-003",
    organizationName: "Education Plus",
    plan: "enterprise",
    status: "suspended",
    monthlyAmount: 599,
    nextBilling: "2024-01-01",
    startDate: "2023-01-01",
    quota: 1000
  }
]

export function BillingManagement() {
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices)
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(mockSubscriptions)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const getStatusBadge = (status: string) => {
    const configs = {
      paid: { variant: "default" as const, icon: CheckCircle, color: "text-green-600" },
      pending: { variant: "secondary" as const, icon: Clock, color: "text-orange-600" },
      overdue: { variant: "destructive" as const, icon: AlertCircle, color: "text-red-600" },
      active: { variant: "default" as const, icon: CheckCircle, color: "text-green-600" },
      cancelled: { variant: "secondary" as const, icon: AlertCircle, color: "text-gray-600" },
      suspended: { variant: "destructive" as const, icon: AlertCircle, color: "text-red-600" }
    }
    
    const config = configs[status as keyof typeof configs]
    const Icon = config?.icon || CheckCircle
    
    return (
      <Badge variant={config?.variant || "secondary"} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    )
  }

  const getPlanBadge = (plan: string) => {
    const colors = {
      basic: "bg-blue-100 text-blue-800",
      premium: "bg-purple-100 text-purple-800",
      enterprise: "bg-amber-100 text-amber-800"
    }
    
    return (
      <Badge className={colors[plan as keyof typeof colors] || colors.basic}>
        {plan.toUpperCase()}
      </Badge>
    )
  }

  const billingStats = {
    totalRevenue: invoices.reduce((sum, inv) => sum + inv.amount, 0),
    paidInvoices: invoices.filter(inv => inv.status === 'paid').length,
    pendingInvoices: invoices.filter(inv => inv.status === 'pending').length,
    overdueInvoices: invoices.filter(inv => inv.status === 'overdue').length,
    activeSubscriptions: subscriptions.filter(sub => sub.status === 'active').length,
    monthlyRecurring: subscriptions.filter(sub => sub.status === 'active').reduce((sum, sub) => sum + sub.monthlyAmount, 0)
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Revenue Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">${billingStats.monthlyRecurring.toLocaleString()}</div>
                    <p className="text-sm text-muted-foreground">Monthly Recurring Revenue</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">${billingStats.totalRevenue.toLocaleString()}</div>
                <p className="text-sm text-muted-foreground">Total Revenue (This Month)</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">{billingStats.activeSubscriptions}</div>
                <p className="text-sm text-muted-foreground">Active Subscriptions</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-red-600">{billingStats.overdueInvoices}</div>
                <p className="text-sm text-muted-foreground">Overdue Invoices</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Invoices */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Invoices</CardTitle>
              <CardDescription>Latest billing activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {invoices.slice(0, 5).map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        <CreditCard className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-medium">{invoice.organizationName}</div>
                        <div className="text-sm text-muted-foreground">
                          {invoice.id} • {invoice.period}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">${invoice.amount}</div>
                      <div className="text-sm">{getStatusBadge(invoice.status)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Invoice Management</CardTitle>
                  <CardDescription>Track and manage all invoices</CardDescription>
                </div>
                <Button>
                  <Download className="h-4 w-4 mr-2" />
                  Export Invoices
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search invoices..."
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
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Invoices Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice ID</TableHead>
                      <TableHead>Organization</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.id}</TableCell>
                        <TableCell>{invoice.organizationName}</TableCell>
                        <TableCell className="font-bold">${invoice.amount}</TableCell>
                        <TableCell>{getPlanBadge(invoice.plan.toLowerCase())}</TableCell>
                        <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {new Date(invoice.dueDate).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Management</CardTitle>
              <CardDescription>Manage organization subscriptions and plans</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Organization</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Monthly Amount</TableHead>
                      <TableHead>Quota</TableHead>
                      <TableHead>Next Billing</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscriptions.map((subscription) => (
                      <TableRow key={subscription.id}>
                        <TableCell className="font-medium">{subscription.organizationName}</TableCell>
                        <TableCell>{getPlanBadge(subscription.plan)}</TableCell>
                        <TableCell>{getStatusBadge(subscription.status)}</TableCell>
                        <TableCell className="font-bold">${subscription.monthlyAmount}</TableCell>
                        <TableCell>{subscription.quota} tests</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {new Date(subscription.nextBilling).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm">
                              Edit
                            </Button>
                            <Button variant="ghost" size="sm">
                              Suspend
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Reports</CardTitle>
                <CardDescription>Generate financial reports</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Report Type</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select report type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly Revenue</SelectItem>
                      <SelectItem value="quarterly">Quarterly Revenue</SelectItem>
                      <SelectItem value="annual">Annual Revenue</SelectItem>
                      <SelectItem value="subscription">Subscription Report</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date Range</label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input type="date" />
                    <Input type="date" />
                  </div>
                </div>
                <Button className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Analytics</CardTitle>
                <CardDescription>Payment trends and insights</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Average Payment Time</span>
                  <span className="font-bold">5.2 days</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Payment Success Rate</span>
                  <span className="font-bold text-green-600">94.7%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Failed Payments</span>
                  <span className="font-bold text-red-600">5.3%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Churn Rate</span>
                  <span className="font-bold">2.1%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
