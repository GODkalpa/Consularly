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
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Building2,
  Users,
  TestTube,
  AlertTriangle,
  CheckCircle,
  Pause
} from "lucide-react"

interface Organization {
  id: string
  name: string
  email: string
  contactPerson: string
  phone: string
  type: 'visa_consultancy' | 'educational' | 'corporate'
  status: 'active' | 'suspended' | 'pending'
  subscriptionPlan: 'basic' | 'premium' | 'enterprise'
  monthlyQuota: number
  usedQuota: number
  totalUsers: number
  joinDate: string
  lastPayment: string
  nextBilling: string
}

const mockOrganizations: Organization[] = [
  {
    id: "1",
    name: "Global Visa Services",
    email: "admin@globalvisa.com",
    contactPerson: "Sarah Johnson",
    phone: "+1-555-0123",
    type: "visa_consultancy",
    status: "active",
    subscriptionPlan: "premium",
    monthlyQuota: 500,
    usedQuota: 342,
    totalUsers: 45,
    joinDate: "2024-01-10",
    lastPayment: "2024-01-01",
    nextBilling: "2024-02-01"
  },
  {
    id: "2",
    name: "ABC Immigration Consultancy",
    email: "contact@abcimmigration.com",
    contactPerson: "Michael Chen",
    phone: "+1-555-0456",
    type: "visa_consultancy",
    status: "active",
    subscriptionPlan: "basic",
    monthlyQuota: 100,
    usedQuota: 85,
    totalUsers: 12,
    joinDate: "2023-12-15",
    lastPayment: "2024-01-01",
    nextBilling: "2024-02-01"
  },
  {
    id: "3",
    name: "Education Plus Institute",
    email: "info@educationplus.edu",
    contactPerson: "Dr. Emily Watson",
    phone: "+1-555-0789",
    type: "educational",
    status: "suspended",
    subscriptionPlan: "enterprise",
    monthlyQuota: 1000,
    usedQuota: 0,
    totalUsers: 150,
    joinDate: "2023-11-20",
    lastPayment: "2023-12-01",
    nextBilling: "2024-01-01"
  },
  {
    id: "4",
    name: "Corporate Training Solutions",
    email: "admin@corptraining.com",
    contactPerson: "James Wilson",
    phone: "+1-555-0321",
    type: "corporate",
    status: "pending",
    subscriptionPlan: "premium",
    monthlyQuota: 300,
    usedQuota: 0,
    totalUsers: 0,
    joinDate: "2024-01-18",
    lastPayment: "-",
    nextBilling: "2024-02-18"
  }
]

export function OrganizationManagement() {
  const [organizations, setOrganizations] = useState<Organization[]>(mockOrganizations)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  const filteredOrganizations = organizations.filter(org => {
    const matchesSearch = org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         org.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         org.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === "all" || org.type === typeFilter
    const matchesStatus = statusFilter === "all" || org.status === statusFilter
    
    return matchesSearch && matchesType && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    const variants = {
      active: { variant: "default" as const, icon: CheckCircle },
      suspended: { variant: "destructive" as const, icon: Pause },
      pending: { variant: "secondary" as const, icon: AlertTriangle }
    }
    
    const config = variants[status as keyof typeof variants]
    const Icon = config?.icon || CheckCircle
    
    return (
      <Badge variant={config?.variant || "secondary"} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    )
  }

  const getSubscriptionBadge = (plan: string) => {
    const colors = {
      basic: "bg-blue-100 text-blue-800",
      premium: "bg-purple-100 text-purple-800",
      enterprise: "bg-gold-100 text-gold-800"
    }
    
    return (
      <Badge className={colors[plan as keyof typeof colors] || colors.basic}>
        {plan.toUpperCase()}
      </Badge>
    )
  }

  const getQuotaUsageColor = (percentage: number) => {
    if (percentage >= 90) return "text-red-600"
    if (percentage >= 75) return "text-orange-600"
    return "text-green-600"
  }

  const orgStats = {
    total: organizations.length,
    active: organizations.filter(o => o.status === 'active').length,
    suspended: organizations.filter(o => o.status === 'suspended').length,
    pending: organizations.filter(o => o.status === 'pending').length,
    totalQuota: organizations.reduce((sum, o) => sum + o.monthlyQuota, 0),
    totalUsed: organizations.reduce((sum, o) => sum + o.usedQuota, 0)
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{orgStats.total}</div>
            <p className="text-sm text-muted-foreground">Total Organizations</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{orgStats.active}</div>
            <p className="text-sm text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{orgStats.suspended}</div>
            <p className="text-sm text-muted-foreground">Suspended</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">{orgStats.pending}</div>
            <p className="text-sm text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{orgStats.totalQuota.toLocaleString()}</div>
            <p className="text-sm text-muted-foreground">Total Quota</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{orgStats.totalUsed.toLocaleString()}</div>
            <p className="text-sm text-muted-foreground">Quota Used</p>
          </CardContent>
        </Card>
      </div>

      {/* Organization Management Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Organization Management</CardTitle>
              <CardDescription>Manage organizations, quotas, and subscriptions</CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Organization
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Organization</DialogTitle>
                  <DialogDescription>Add a new organization to the platform</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Organization Name</label>
                    <Input placeholder="Enter organization name" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <Input type="email" placeholder="Enter email address" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Contact Person</label>
                    <Input placeholder="Enter contact person name" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Phone</label>
                    <Input placeholder="Enter phone number" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Organization Type</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="visa_consultancy">Visa Consultancy</SelectItem>
                        <SelectItem value="educational">Educational Institution</SelectItem>
                        <SelectItem value="corporate">Corporate Training</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Subscription Plan</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select plan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Basic (100 tests/month)</SelectItem>
                        <SelectItem value="premium">Premium (500 tests/month)</SelectItem>
                        <SelectItem value="enterprise">Enterprise (1000 tests/month)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2 space-y-2">
                    <label className="text-sm font-medium">Monthly Test Quota</label>
                    <Input type="number" placeholder="Enter monthly quota" />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setIsCreateDialogOpen(false)}>
                    Create Organization
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search organizations by name, email, or contact..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="visa_consultancy">Visa Consultancy</SelectItem>
                <SelectItem value="educational">Educational</SelectItem>
                <SelectItem value="corporate">Corporate</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Organizations Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Quota Usage</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Next Billing</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrganizations.map((org) => {
                  const quotaPercentage = (org.usedQuota / org.monthlyQuota) * 100
                  
                  return (
                    <TableRow key={org.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                            <Building2 className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="font-medium">{org.name}</div>
                            <div className="text-sm text-muted-foreground">{org.contactPerson}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="capitalize">{org.type.replace('_', ' ')}</span>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(org.status)}
                      </TableCell>
                      <TableCell>
                        {getSubscriptionBadge(org.subscriptionPlan)}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className={getQuotaUsageColor(quotaPercentage)}>
                              {org.usedQuota} / {org.monthlyQuota}
                            </span>
                            <span className="text-muted-foreground">
                              {quotaPercentage.toFixed(0)}%
                            </span>
                          </div>
                          <Progress value={quotaPercentage} className="h-2" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          {org.totalUsers}
                        </div>
                      </TableCell>
                      <TableCell>
                        {org.nextBilling !== "-" ? new Date(org.nextBilling).toLocaleDateString() : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {filteredOrganizations.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No organizations found matching your criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
