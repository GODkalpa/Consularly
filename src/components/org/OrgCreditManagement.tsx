'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { auth } from '@/lib/firebase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { TrendingUp, TrendingDown, DollarSign, Users, AlertCircle, Plus, Minus } from 'lucide-react'

interface CreditSummary {
  organization: {
    quotaLimit: number
    quotaUsed: number
    quotaRemaining: number
    studentCreditsAllocated: number
    studentCreditsUsed: number
    unallocatedCredits: number
    utilizationPercent: number
    studentUtilizationPercent: number
  }
  students: {
    list: Array<{
      id: string
      name: string
      email: string
      creditsAllocated: number
      creditsUsed: number
      creditsRemaining: number
      utilizationPercent: number
      accountStatus: string
      dashboardEnabled: boolean
      lastLoginAt: string | null
    }>
    stats: {
      totalStudents: number
      activeStudents: number
      studentsWithCredits: number
      studentsWithRemainingCredits: number
      totalCreditsUsedByStudents: number
      averageUtilization: number
    }
    insights: {
      topPerformers: Array<{
        id: string
        name: string
        creditsUsed: number
        utilizationPercent: number
      }>
      underutilized: Array<{
        id: string
        name: string
        creditsAllocated: number
        utilizationPercent: number
      }>
    }
  }
  recommendations: string[]
}

export function OrgCreditManagement() {
  const { userProfile } = useAuth()
  const [summary, setSummary] = useState<CreditSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [allocateDialogOpen, setAllocateDialogOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [creditAmount, setCreditAmount] = useState('')
  const [reason, setReason] = useState('')
  const [allocating, setAllocating] = useState(false)

  useEffect(() => {
    if (userProfile?.orgId) {
      fetchCreditSummary()
    }
  }, [userProfile])

  const fetchCreditSummary = async () => {
    try {
      const token = await auth.currentUser?.getIdToken()
      if (!token) return

      const response = await fetch('/api/org/credits/summary', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setSummary(data)
      } else {
        setError('Failed to load credit summary')
      }
    } catch (err) {
      console.error('Failed to fetch credit summary:', err)
      setError('Failed to load credit summary')
    } finally {
      setLoading(false)
    }
  }

  const handleAllocateCredits = async (studentId: string, amount: number, isDeallocation = false) => {
    setAllocating(true)
    try {
      const token = await auth.currentUser?.getIdToken()
      if (!token) return

      const response = await fetch(`/api/org/students/${studentId}/credits`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: isDeallocation ? -amount : amount,
          reason: reason || (isDeallocation ? 'Credit deallocation' : 'Credit allocation')
        })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(`Successfully ${isDeallocation ? 'deallocated' : 'allocated'} ${amount} credits`)
        fetchCreditSummary() // Refresh data
        setAllocateDialogOpen(false)
        setCreditAmount('')
        setReason('')
        setSelectedStudent(null)
      } else {
        const errorData = await response.json()
        toast.error(errorData.message || `Failed to ${isDeallocation ? 'deallocate' : 'allocate'} credits`)
      }
    } catch (err) {
      console.error('Credit allocation error:', err)
      toast.error('An unexpected error occurred')
    } finally {
      setAllocating(false)
    }
  }

  const openAllocateDialog = (student: any) => {
    setSelectedStudent(student)
    setAllocateDialogOpen(true)
    setCreditAmount('')
    setReason('')
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    )
  }

  if (error || !summary) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <AlertCircle className="w-12 h-12 mx-auto" />
        </div>
        <p className="text-gray-600">{error}</p>
        <Button onClick={fetchCreditSummary} className="mt-4">
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Credit Management</h2>
        <p className="text-gray-600">Monitor and manage student credit allocations</p>
      </div>

      {/* Organization Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Quota</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <DollarSign className="w-4 h-4 text-blue-500 mr-2" />
              <span className="text-2xl font-bold">{summary.organization.quotaLimit}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Monthly allocation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Credits Used</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <TrendingUp className="w-4 h-4 text-green-500 mr-2" />
              <span className="text-2xl font-bold">{summary.organization.quotaUsed}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {summary.organization.utilizationPercent}% utilization
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Allocated to Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Users className="w-4 h-4 text-purple-500 mr-2" />
              <span className="text-2xl font-bold">{summary.organization.studentCreditsAllocated}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Distributed credits</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Unallocated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <TrendingDown className="w-4 h-4 text-yellow-500 mr-2" />
              <span className="text-2xl font-bold">{summary.organization.unallocatedCredits}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Available to allocate</p>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      {summary.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recommendations</CardTitle>
            <CardDescription>AI-powered insights to optimize your credit allocation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {summary.recommendations.map((rec, index) => (
                <div key={index} className="flex items-start bg-blue-50 p-3 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p className="text-sm text-blue-800">{rec}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Student Credit Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Student Credit Allocation</CardTitle>
              <CardDescription>
                Manage individual student credit balances
              </CardDescription>
            </div>
            <div className="text-sm text-gray-600">
              {summary.students.stats.activeStudents} active students
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Allocated</TableHead>
                  <TableHead>Used</TableHead>
                  <TableHead>Remaining</TableHead>
                  <TableHead>Usage %</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.students.list.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{student.name}</div>
                        <div className="text-sm text-gray-500">{student.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge 
                          variant={student.accountStatus === 'active' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {student.accountStatus}
                        </Badge>
                        {student.dashboardEnabled && (
                          <Badge variant="outline" className="text-xs">
                            Dashboard
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {student.creditsAllocated}
                    </TableCell>
                    <TableCell>
                      {student.creditsUsed}
                    </TableCell>
                    <TableCell>
                      <span className={student.creditsRemaining <= 0 ? 'text-red-600' : 'text-green-600'}>
                        {student.creditsRemaining}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">{student.utilizationPercent}%</span>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full transition-all"
                            style={{ 
                              width: `${Math.min(student.utilizationPercent, 100)}%`,
                              backgroundColor: student.utilizationPercent >= 80 ? '#10B981' : 
                                             student.utilizationPercent >= 50 ? '#3B82F6' : '#6B7280'
                            }}
                          ></div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {formatDate(student.lastLoginAt)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openAllocateDialog(student)}
                        className="text-xs"
                      >
                        Manage Credits
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Credit Allocation Dialog */}
      <Dialog open={allocateDialogOpen} onOpenChange={setAllocateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Credits</DialogTitle>
            <DialogDescription>
              {selectedStudent && `Allocate or deallocate credits for ${selectedStudent.name}`}
            </DialogDescription>
          </DialogHeader>
          
          {selectedStudent && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{selectedStudent.creditsAllocated}</div>
                    <div className="text-xs text-gray-600">Allocated</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{selectedStudent.creditsUsed}</div>
                    <div className="text-xs text-gray-600">Used</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">{selectedStudent.creditsRemaining}</div>
                    <div className="text-xs text-gray-600">Remaining</div>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="creditAmount">Credit Amount</Label>
                <Input
                  id="creditAmount"
                  type="number"
                  placeholder="Enter amount"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  min="1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Available to allocate: {summary.organization.unallocatedCredits} credits
                </p>
              </div>

              <div>
                <Label htmlFor="reason">Reason (Optional)</Label>
                <Input
                  id="reason"
                  placeholder="e.g., Additional practice sessions"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={() => handleAllocateCredits(selectedStudent.id, parseInt(creditAmount) || 0, false)}
                  disabled={!creditAmount || parseInt(creditAmount) <= 0 || allocating}
                  className="flex-1"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {allocating ? 'Allocating...' : 'Allocate Credits'}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => handleAllocateCredits(selectedStudent.id, parseInt(creditAmount) || 0, true)}
                  disabled={!creditAmount || parseInt(creditAmount) <= 0 || parseInt(creditAmount) > selectedStudent.creditsRemaining || allocating}
                  className="flex-1"
                >
                  <Minus className="w-4 h-4 mr-2" />
                  {allocating ? 'Deallocating...' : 'Deallocate Credits'}
                </Button>
              </div>

              <p className="text-xs text-gray-500">
                Note: You can only deallocate unused credits. Used credits cannot be reclaimed.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
