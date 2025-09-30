"use client"

import { useEffect, useMemo, useState } from "react"
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
import { sendPasswordResetEmail } from "firebase/auth"
import { auth, firebaseEnabled } from "@/lib/firebase"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"

interface UserRow {
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

// Live data is loaded from Firestore; mock is not used anymore.

export function UserManagement() {
  const { userProfile } = useAuth()
  const [users, setUsers] = useState<UserRow[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [newRole, setNewRole] = useState<string>("") // 'student' | 'organization' | 'admin'
  const [newOrgId, setNewOrgId] = useState("")
  const [orgNames, setOrgNames] = useState<Record<string, string>>({})
  const [orgOptions, setOrgOptions] = useState<Array<{ id: string; name: string }>>([])

  // Load users via API (avoids Firestore permission issues)
  useEffect(() => {
    if (!firebaseEnabled) return
    if (!userProfile) return

    let intervalId: NodeJS.Timeout | undefined

    async function loadUsers() {
      try {
        const token = await auth.currentUser?.getIdToken()
        if (!token) return

        // Fetch users via API
        const usersRes = await fetch('/api/admin/users/list?type=all', {
          headers: { Authorization: `Bearer ${token}` }
        })

        if (!usersRes.ok) {
          const error = await usersRes.json()
          throw new Error(error.error || 'Failed to load users')
        }

        const usersJson = await usersRes.json()
        const usersData = usersJson.users || []

        // Load organization names for dropdown and display
        let orgMap: Record<string, string> = {}
        const opts: Array<{ id: string; name: string }> = []

        try {
          const orgsRes = await fetch('/api/admin/organizations/list', {
            headers: { Authorization: `Bearer ${token}` }
          })

          if (orgsRes.ok) {
            const orgsJson = await orgsRes.json()
            const orgs = orgsJson.organizations || []
            orgs.forEach((org: any) => {
              const name = org.name || org.id
              orgMap[org.id] = name
              opts.push({ id: org.id, name })
            })
          }
        } catch (e) {
          console.warn('Failed to load organizations for dropdown', e)
        }

        setOrgNames(orgMap)
        setOrgOptions(opts)

        // Map API response to UserRow format
        const rows: UserRow[] = usersData.map((data: any) => {
          // Safe timestamp parsing
          let createdAt = new Date()
          try {
            if (data?.createdAt?.seconds) {
              createdAt = new Date(data.createdAt.seconds * 1000)
            } else if (data?.createdAt) {
              const parsed = new Date(data.createdAt)
              if (!isNaN(parsed.getTime())) createdAt = parsed
            }
          } catch (e) {
            console.warn('Failed to parse createdAt', e)
          }

          let lastActive = new Date()
          try {
            if (data?.lastLoginAt) {
              const parsed = new Date(data.lastLoginAt)
              if (!isNaN(parsed.getTime())) lastActive = parsed
            } else if (data?.updatedAt?.seconds) {
              lastActive = new Date(data.updatedAt.seconds * 1000)
            } else if (data?.updatedAt) {
              const parsed = new Date(data.updatedAt)
              if (!isNaN(parsed.getTime())) lastActive = parsed
            }
          } catch (e) {
            console.warn('Failed to parse lastActive', e)
          }

          const derivedRole: UserRow['role'] = data?.role === 'admin' || data?.role === 'super_admin'
            ? 'admin'
            : (data?.orgId ? 'organization' : 'student')

          const status: UserRow['status'] = data?.isActive === false ? 'inactive' : 'active'

          return {
            id: data.id,
            name: data?.displayName || data?.name || 'Unknown',
            email: data?.email || '',
            role: derivedRole,
            status,
            organization: data?.orgId ? (orgMap[data.orgId] || data.orgId) : undefined,
            joinDate: createdAt.toISOString(),
            lastActive: lastActive.toISOString(),
            testsCompleted: 0,
          }
        })

        setUsers(rows)
      } catch (err: any) {
        console.error('[UserManagement] Load error', err)
        setUsers([])
        toast.error('Unable to load users', { description: err?.message || 'Failed to fetch user data' })
      }
    }

    // Initial load
    loadUsers()

    // Refresh every 30 seconds for near real-time updates
    intervalId = setInterval(loadUsers, 30000)

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [userProfile])

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

  const userStats = useMemo(() => {
    const orgSet = new Set<string>()
    users.forEach(u => { if (u.organization) orgSet.add(u.organization) })
    return {
      total: users.length,
      students: users.filter(u => u.role === 'student').length,
      organizations: orgSet.size,
      admins: users.filter(u => u.role === 'admin').length,
      active: users.filter(u => u.status === 'active').length
    }
  }, [users])

  async function handleCreateUser() {
    if (!newEmail || !newName || !newRole) {
      toast.error('Please fill in name, email, and role')
      return
    }
    if (newRole === 'organization' && !newOrgId) {
      toast.error('Please select an organization for the Organization Member role')
      return
    }
    try {
      setCreating(true)
      const token = await auth.currentUser?.getIdToken()
      if (!token) throw new Error('Not authenticated')

      // Map UI role to backend role
      const backendRole = newRole === 'admin' ? 'admin' : 'user'
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: newEmail,
          displayName: newName,
          role: backendRole,
          orgId: newRole === 'organization' ? newOrgId : '',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to create user')

      // Attempt to send password setup email via Firebase Auth (uses project email templates)
      let emailSent = false
      try {
        await sendPasswordResetEmail(auth, newEmail)
        emailSent = true
        toast.success('User created', { description: 'Password setup email sent to the user.' })
      } catch {
        // ignore and fall back to resetLink if available
      }

      if (!emailSent) {
        if (data.resetLink) {
          // Try to copy to clipboard for convenience
          try {
            await navigator?.clipboard?.writeText?.(data.resetLink)
            toast.success('User created', { description: 'Password link generated and copied to clipboard.' })
          } catch {
            toast.success('User created', { description: 'Password link generated. Opening link...' })
            // As a fallback, open a small window the admin can copy from
            try {
              window.open(data.resetLink, '_blank', 'noopener,noreferrer')
            } catch {}
          }
        } else {
          toast.success('User created')
        }
      }
      setIsCreateDialogOpen(false)
      setNewEmail(''); setNewName(''); setNewRole(''); setNewOrgId('')
    } catch (e: any) {
      toast.error('Create user failed', { description: e?.message })
    } finally {
      setCreating(false)
    }
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
                    <Input placeholder="Enter full name" value={newName} onChange={(e) => setNewName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <Input type="email" placeholder="Enter email address" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Role</label>
                    <Select value={newRole} onValueChange={setNewRole}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="organization">Organization Member</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {newRole === 'organization' && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Organization</label>
                      <Select value={newOrgId} onValueChange={setNewOrgId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select organization" />
                        </SelectTrigger>
                        <SelectContent>
                          {orgOptions.map(o => (
                            <SelectItem key={o.id} value={o.id}>{o.name} ({o.id.slice(0,6)}…)</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">Choose the organization to assign this user.</p>
                    </div>
                  )}
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={creating}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateUser} disabled={creating}>
                      {creating ? 'Creating…' : 'Create User'}
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
