"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Filter,
  UserPlus,
  Building2,
  GraduationCap,
  Shield
} from "lucide-react"

interface User {
  id: string
  name: string
  email: string
  role: 'student' | 'organization' | 'admin'
  status: 'active' | 'inactive' | 'suspended'
  organization?: string
  joinDate: string
  lastActive: string
  testsCompleted: number
}

const mockUsers: User[] = [
  {
    id: "1",
    name: "John Smith",
    email: "john@example.com",
    role: "student",
    status: "active",
    organization: "ABC Consultancy",
    joinDate: "2024-01-15",
    lastActive: "2024-01-20",
    testsCompleted: 5
  },
  {
    id: "2",
    name: "Sarah Johnson",
    email: "sarah@globalvisa.com",
    role: "organization",
    status: "active",
    organization: "Global Visa Services",
    joinDate: "2024-01-10",
    lastActive: "2024-01-19",
    testsCompleted: 0
  },
  {
    id: "3",
    name: "Mike Admin",
    email: "mike@platform.com",
    role: "admin",
    status: "active",
    joinDate: "2023-12-01",
    lastActive: "2024-01-20",
    testsCompleted: 0
  },
  {
    id: "4",
    name: "Emma Wilson",
    email: "emma@student.com",
    role: "student",
    status: "inactive",
    organization: "XYZ Immigration",
    joinDate: "2024-01-05",
    lastActive: "2024-01-18",
    testsCompleted: 12
  },
  {
    id: "5",
    name: "David Brown",
    email: "david@education.com",
    role: "organization",
    status: "suspended",
    organization: "Education Plus",
    joinDate: "2023-11-20",
    lastActive: "2024-01-15",
    testsCompleted: 0
  }
]

export function UserManagement() {
  const [users, setUsers] = useState<User[]>(mockUsers)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.organization?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === "all" || user.role === roleFilter
    const matchesStatus = statusFilter === "all" || user.status === statusFilter
    
    return matchesSearch && matchesRole && matchesStatus
  })

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'student': return <GraduationCap className="h-4 w-4" />
      case 'organization': return <Building2 className="h-4 w-4" />
      case 'admin': return <Shield className="h-4 w-4" />
      default: return null
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "default",
      inactive: "secondary",
      suspended: "destructive"
    } as const
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {status}
      </Badge>
    )
  }

  const userStats = {
    total: users.length,
    students: users.filter(u => u.role === 'student').length,
    organizations: users.filter(u => u.role === 'organization').length,
    admins: users.filter(u => u.role === 'admin').length,
    active: users.filter(u => u.status === 'active').length
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{userStats.total}</div>
            <p className="text-sm text-muted-foreground">Total Users</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{userStats.students}</div>
            <p className="text-sm text-muted-foreground">Students</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{userStats.organizations}</div>
            <p className="text-sm text-muted-foreground">Organizations</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{userStats.admins}</div>
            <p className="text-sm text-muted-foreground">Admins</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-emerald-600">{userStats.active}</div>
            <p className="text-sm text-muted-foreground">Active Users</p>
          </CardContent>
        </Card>
      </div>

      {/* User Management Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage all platform users, roles, and permissions</CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New User</DialogTitle>
                  <DialogDescription>Add a new user to the platform</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Name</label>
                    <Input placeholder="Enter full name" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <Input type="email" placeholder="Enter email address" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Role</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="organization">Organization</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={() => setIsCreateDialogOpen(false)}>
                      Create User
                    </Button>
                  </div>
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
                placeholder="Search users by name, email, or organization..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="student">Students</SelectItem>
                <SelectItem value="organization">Organizations</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Users Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tests Completed</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={`https://avatar.vercel.sh/${user.email}`} />
                          <AvatarFallback>
                            {user.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getRoleIcon(user.role)}
                        <span className="capitalize">{user.role}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.organization || "-"}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(user.status)}
                    </TableCell>
                    <TableCell>
                      {user.testsCompleted}
                    </TableCell>
                    <TableCell>
                      {new Date(user.lastActive).toLocaleDateString()}
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
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No users found matching your criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
