"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  Pause,
  Globe
} from "lucide-react"
import { collection, onSnapshot, orderBy, query, where, getCountFromServer, documentId, getDocs } from "firebase/firestore"
import type { QuerySnapshot, DocumentData, QueryDocumentSnapshot } from "firebase/firestore"
import { auth, db, firebaseEnabled } from "@/lib/firebase"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"
import SubdomainManager from "./SubdomainManager"

type OrgRow = {
  id: string
  name: string
  email?: string
  contactPerson?: string
  phone?: string
  type: 'visa_consultancy' | 'educational' | 'corporate'
  status: 'active' | 'suspended' | 'pending'
  subscriptionPlan: 'basic' | 'plus' | 'premium' | 'enterprise'
  monthlyQuota: number
  usedQuota: number
  joinDate?: string
  nextBilling?: string
  subdomain?: string
  subdomainEnabled?: boolean
}

export function OrganizationManagement() {
  const { user, userProfile } = useAuth()
  const [organizations, setOrganizations] = useState<OrgRow[]>([])
  const [userCounts, setUserCounts] = useState<Record<string, number>>({})
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)

  // Create dialog state
  const [newName, setNewName] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [newContactPerson, setNewContactPerson] = useState("")
  const [newPhone, setNewPhone] = useState("")
  const [newType, setNewType] = useState<string>("")
  const [newPlan, setNewPlan] = useState<string>("")
  const [newQuota, setNewQuota] = useState<string>("")

  // Edit dialog state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingOrg, setEditingOrg] = useState<OrgRow | null>(null)
  const [editName, setEditName] = useState("")
  const [editEmail, setEditEmail] = useState("")
  const [editContactPerson, setEditContactPerson] = useState("")
  const [editPhone, setEditPhone] = useState("")
  const [editType, setEditType] = useState<string>("")
  const [editStatus, setEditStatus] = useState<string>("")
  const [editPlan, setEditPlan] = useState<string>("")
  const [editQuota, setEditQuota] = useState<string>("")
  const [editing, setEditing] = useState(false)

  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingOrg, setDeletingOrg] = useState<OrgRow | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Real-time subscription to organizations
  useEffect(() => {
    if (!firebaseEnabled) return
    if (!userProfile || !user) {
      setOrganizations([])
      setUserCounts({})
      return
    }

    // All admins see all organizations
    const baseCol = collection(db, 'organizations')
    const isAdmin = userProfile?.role === 'admin'

    if (!isAdmin) {
      // Not an admin, no access
      setOrganizations([])
      setUserCounts({})
      return
    }

    // Admins see all organizations
    const q = query(baseCol, orderBy('createdAt', 'desc'))

    const unsub = onSnapshot(
      q,
      async (snap: QuerySnapshot<DocumentData>) => {
        const orgs: OrgRow[] = snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => {
          const data = d.data() as any
          const createdAt = (data?.createdAt?.toDate?.() as Date | undefined)
          return {
            id: d.id,
            name: data?.name || d.id,
            email: data?.email || '',
            contactPerson: data?.contactPerson || '',
            phone: data?.phone || '',
            type: (data?.type || 'visa_consultancy') as OrgRow['type'],
            status: (data?.status || 'active') as OrgRow['status'],
            subscriptionPlan: (data?.plan || 'basic') as OrgRow['subscriptionPlan'],
            monthlyQuota: Number(data?.quotaLimit || data?.monthlyQuota || 0),
            usedQuota: Number(data?.quotaUsed || 0),
            joinDate: createdAt ? createdAt.toISOString() : undefined,
            nextBilling: data?.nextBilling || undefined,
            subdomain: data?.subdomain || undefined,
            subdomainEnabled: data?.subdomainEnabled || false,
          }
        })
        setOrganizations(orgs)

        // Fetch per-org user counts efficiently using getCountFromServer (doesn't download documents)
        try {
          const entries = await Promise.all(
            orgs.map(async (o) => {
              try {
                // Use count aggregation instead of fetching all documents
                const totalCount = await getCountFromServer(
                  query(collection(db, 'users'), where('orgId', '==', o.id))
                )

                // Get admin count for this org
                const adminCount = await getCountFromServer(
                  query(
                    collection(db, 'users'),
                    where('orgId', '==', o.id),
                    where('role', '==', 'admin')
                  )
                )

                // Non-admin count = total - admins
                const nonAdminCount = totalCount.data().count - adminCount.data().count
                return [o.id, nonAdminCount] as const
              } catch (err) {
                console.warn(`[OrganizationManagement] Failed to count users for org ${o.id}:`, err)
                return [o.id, 0] as const
              }
            })
          )
          setUserCounts(Object.fromEntries(entries))
        } catch (err) {
          console.error('[OrganizationManagement] Failed to fetch user counts:', err)
          // ignore count errors
        }
      },
      (error) => {
        // Handle snapshot errors
        console.error('[OrganizationManagement] Snapshot error:', error)
        if (error.code === 'permission-denied') {
          toast.error('Permission denied', {
            description: 'Unable to load organizations. Please check your permissions.'
          })
        }
        setOrganizations([])
        setUserCounts({})
      })

    return () => unsub()
  }, [userProfile, user])

  const filteredOrganizations = organizations.filter(org => {
    const matchesSearch = org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (org.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (org.contactPerson || '').toLowerCase().includes(searchTerm.toLowerCase())
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
      plus: "bg-green-100 text-green-800",
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

  const orgStats = useMemo(() => ({
    total: organizations.length,
    active: organizations.filter(o => o.status === 'active').length,
    suspended: organizations.filter(o => o.status === 'suspended').length,
    pending: organizations.filter(o => o.status === 'pending').length,
    totalQuota: organizations.reduce((sum, o) => sum + (o.monthlyQuota || 0), 0),
    totalUsed: organizations.reduce((sum, o) => sum + (o.usedQuota || 0), 0)
  }), [organizations])

  async function handleCreateOrganization() {
    if (!newName || !newPlan || !newQuota) {
      toast.error('Please fill in organization name, plan and monthly quota')
      return
    }
    try {
      setCreating(true)
      const token = await auth.currentUser?.getIdToken()
      if (!token) throw new Error('Not authenticated')

      const res = await fetch('/api/admin/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          contactPerson: newContactPerson,
          phone: newPhone,
          type: newType || 'visa_consultancy',
          plan: newPlan,
          quotaLimit: Number(newQuota),
          status: 'active',
          settings: {
            allowSelfRegistration: false,
            defaultInterviewDuration: 30,
            enableMetricsCollection: true,
            customBranding: { companyName: newName }
          }
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to create organization')

      // Build success message based on what happened
      let description = ''
      if (data.userCreated) {
        description = `✅ Account created for ${newEmail}\n`
        if (data.resetLink) {
          // Copy reset link to clipboard
          try {
            await navigator.clipboard.writeText(data.resetLink)
            description += '📋 Password reset link copied to clipboard'
          } catch {
            description += `🔗 Reset link: ${data.resetLink.substring(0, 50)}...`
          }
        }
      } else if (newEmail) {
        description = `✅ Existing user ${newEmail} assigned to organization`
      }

      // Add subdomain info
      if (data.subdomain) {
        description += description ? `\n🌐 Subdomain: ${data.subdomain}.consularly.com` : `🌐 Subdomain: ${data.subdomain}.consularly.com`
        if (data.subdomainEnabled) {
          description += ' (Active)'
        }
      }

      // Add email status
      if (data.emailSent) {
        description += description ? '\n📧 Welcome email sent' : '📧 Welcome email sent'
      } else if (data.emailError) {
        description += description ? `\n⚠️ Email failed: ${data.emailError} ` : `⚠️ Email failed: ${data.emailError} `
      }

      toast.success('Organization created successfully', {
        description: description || 'Organization is ready to use',
        duration: 8000, // Longer duration so user can read the reset link message
      })

      setIsCreateDialogOpen(false)
      setNewName(''); setNewEmail(''); setNewContactPerson(''); setNewPhone(''); setNewType(''); setNewPlan(''); setNewQuota('')
    } catch (e: any) {
      toast.error('Create organization failed', { description: e?.message })
    } finally {
      setCreating(false)
    }
  }

  function openEditDialog(org: OrgRow) {
    setEditingOrg(org)
    setEditName(org.name)
    setEditEmail(org.email || '')
    setEditContactPerson(org.contactPerson || '')
    setEditPhone(org.phone || '')
    setEditType(org.type)
    setEditStatus(org.status)
    setEditPlan(org.subscriptionPlan)
    setEditQuota(org.monthlyQuota.toString())
    setIsEditDialogOpen(true)
  }

  async function handleEditOrganization() {
    if (!editingOrg || !editName || !editPlan || !editQuota) {
      toast.error('Please fill in organization name, plan and quota')
      return
    }
    try {
      setEditing(true)
      const token = await auth.currentUser?.getIdToken()
      if (!token) throw new Error('Not authenticated')

      const res = await fetch(`/api/admin/organizations/${editingOrg.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          quotaLimit: Number(editQuota),
          plan: editPlan,
          settings: {
            customBranding: {
              companyName: editName
            }
          }
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to update organization')

      toast.success('Organization updated successfully')
      setIsEditDialogOpen(false)
      setEditingOrg(null)
    } catch (e: any) {
      toast.error('Update organization failed', { description: e?.message })
    } finally {
      setEditing(false)
    }
  }

  function openDeleteDialog(org: OrgRow) {
    setDeletingOrg(org)
    setIsDeleteDialogOpen(true)
  }

  async function handleDeleteOrganization() {
    if (!deletingOrg) return
    try {
      setDeleting(true)
      const token = await auth.currentUser?.getIdToken()
      if (!token) throw new Error('Not authenticated')

      const res = await fetch(`/api/admin/organizations/${deletingOrg.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to delete organization')

      toast.success('Organization deleted successfully')
      setIsDeleteDialogOpen(false)
      setDeletingOrg(null)
    } catch (e: any) {
      toast.error('Delete organization failed', { description: e?.message })
    } finally {
      setDeleting(false)
    }
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
                    <Input placeholder="Enter organization name" value={newName} onChange={(e) => setNewName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <Input type="email" placeholder="Enter email address" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Contact Person</label>
                    <Input placeholder="Enter contact person name" value={newContactPerson} onChange={(e) => setNewContactPerson(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Phone</label>
                    <Input placeholder="Enter phone number" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Organization Type</label>
                    <Select value={newType} onValueChange={setNewType}>
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
                    <Select value={newPlan} onValueChange={(value) => {
                      setNewPlan(value)
                      // Auto-fill quota based on plan
                      if (value === 'basic') setNewQuota('10')
                      else if (value === 'plus') setNewQuota('25')
                      else if (value === 'premium') setNewQuota('50')
                      else if (value === 'enterprise') setNewQuota('') // Clear for custom entry
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select plan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Basic (10 interviews/month)</SelectItem>
                        <SelectItem value="plus">Plus (25 interviews/month)</SelectItem>
                        <SelectItem value="premium">Premium (50 interviews/month)</SelectItem>
                        <SelectItem value="enterprise">Enterprise (Custom quota)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2 space-y-2">
                    <label className="text-sm font-medium">Monthly Test Quota</label>
                    <Input type="number" placeholder="Enter monthly quota" value={newQuota} onChange={(e) => setNewQuota(e.target.value)} />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateOrganization} disabled={creating}>
                    {creating ? 'Creating…' : 'Create Organization'}
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
                  <TableHead>Subdomain</TableHead>
                  <TableHead>Quota Usage</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrganizations.map((org) => {
                  const quotaPercentage = org.monthlyQuota > 0 ? (org.usedQuota / org.monthlyQuota) * 100 : 0

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
                        {org.subdomain ? (
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            <div className="flex flex-col">
                              <span className="text-sm font-mono">{org.subdomain}</span>
                              {org.subdomainEnabled ? (
                                <Badge variant="default" className="w-fit text-xs">Active</Badge>
                              ) : (
                                <Badge variant="secondary" className="w-fit text-xs">Disabled</Badge>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Not set</span>
                        )}
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
                          {userCounts[org.id] ?? 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(org)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600"
                            onClick={() => openDeleteDialog(org)}
                          >
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
              {userProfile?.role === 'admin' && !(userProfile as any)?.orgId ? (
                <p className="text-muted-foreground">Your admin account is not assigned to any organization yet. Please contact a super admin.</p>
              ) : (
                <p className="text-muted-foreground">No organizations found matching your criteria.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Organization Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Organization</DialogTitle>
            <DialogDescription>Update organization information, quota, and subdomain</DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="general">General Settings</TabsTrigger>
              <TabsTrigger value="subdomain">
                <Globe className="h-4 w-4 mr-2" />
                Subdomain
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4">
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Organization Name</label>
                  <Input placeholder="Enter organization name" value={editName} onChange={(e) => setEditName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input type="email" placeholder="Enter email address" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} disabled />
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Contact Person</label>
                  <Input placeholder="Enter contact person name" value={editContactPerson} onChange={(e) => setEditContactPerson(e.target.value)} disabled />
                  <p className="text-xs text-muted-foreground">Contact info cannot be changed via edit</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone</label>
                  <Input placeholder="Enter phone number" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} disabled />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Organization Type</label>
                  <Select value={editType} onValueChange={setEditType} disabled>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="visa_consultancy">Visa Consultancy</SelectItem>
                      <SelectItem value="educational">Educational Institution</SelectItem>
                      <SelectItem value="corporate">Corporate Training</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Type cannot be changed</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select value={editStatus} onValueChange={setEditStatus} disabled>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Use separate API for status changes</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Subscription Plan</label>
                  <Select value={editPlan} onValueChange={(value) => {
                    setEditPlan(value)
                    // Auto-fill quota based on plan
                    if (value === 'basic') setEditQuota('10')
                    else if (value === 'plus') setEditQuota('25')
                    else if (value === 'premium') setEditQuota('50')
                    else if (value === 'enterprise') setEditQuota('') // Clear for custom entry
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select plan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic (10 interviews/month)</SelectItem>
                      <SelectItem value="plus">Plus (25 interviews/month)</SelectItem>
                      <SelectItem value="premium">Premium (50 interviews/month)</SelectItem>
                      <SelectItem value="enterprise">Enterprise (Custom quota)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Monthly Test Quota</label>
                  <Input type="number" placeholder="Enter monthly quota" value={editQuota} onChange={(e) => setEditQuota(e.target.value)} />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={editing}>
                  Cancel
                </Button>
                <Button onClick={handleEditOrganization} disabled={editing}>
                  {editing ? 'Updating…' : 'Update Organization'}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="subdomain" className="space-y-4">
              {editingOrg && (
                <SubdomainManager
                  orgId={editingOrg.id}
                  orgName={editingOrg.name}
                  currentSubdomain={editingOrg.subdomain}
                  currentEnabled={editingOrg.subdomainEnabled}
                  onUpdate={() => {
                    // Refresh will happen automatically via real-time listener
                    toast.success('Subdomain updated successfully')
                  }}
                />
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Delete Organization Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Organization</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this organization? This action cannot be undone.
              All users must be deleted or reassigned before deleting an organization.
            </DialogDescription>
          </DialogHeader>
          {deletingOrg && (
            <div className="py-4">
              <div className="rounded-lg border p-4 space-y-2">
                <div className="font-medium">{deletingOrg.name}</div>
                <div className="text-sm text-muted-foreground">{deletingOrg.email}</div>
                <div className="text-sm">
                  <span className="font-medium">Type:</span> {deletingOrg.type.replace('_', ' ')}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Users:</span> {userCounts[deletingOrg.id] ?? 0}
                </div>
                {(userCounts[deletingOrg.id] ?? 0) > 0 && (
                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                    ⚠️ This organization has {userCounts[deletingOrg.id]} user(s). Please delete or reassign them first.
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteOrganization} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete Organization'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
