'use client'

import { useState, useEffect } from 'react'
import { StudentAuthGuard } from '@/components/student/StudentAuthGuard'
import { useStudentAuth } from '@/contexts/StudentAuthContext'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface CreditHistory {
  id: string
  type: 'allocation' | 'deallocation' | 'usage'
  amount: number
  balanceAfter: number
  reason: string
  timestamp: string
  interviewId?: string
}

export default function StudentProfilePage() {
  const { student, refreshProfile } = useStudentAuth()
  const [loading, setLoading] = useState(false)
  const [creditHistory, setCreditHistory] = useState<CreditHistory[]>([])
  const [formData, setFormData] = useState({
    name: '',
    studentProfile: {
      degreeLevel: '',
      programName: '',
      universityName: '',
      programLength: '',
      fieldOfStudy: '',
      intendedMajor: ''
    }
  })

  useEffect(() => {
    if (student) {
      setFormData({
        name: student.name || '',
        studentProfile: {
          degreeLevel: student.studentProfile?.degreeLevel || '',
          programName: student.studentProfile?.programName || '',
          universityName: student.studentProfile?.universityName || '',
          programLength: student.studentProfile?.programLength || '',
          fieldOfStudy: student.studentProfile?.fieldOfStudy || '',
          intendedMajor: student.studentProfile?.intendedMajor || ''
        }
      })
      fetchCreditHistory()
    }
  }, [student])

  const fetchCreditHistory = async () => {
    try {
      const user = (await import('@/lib/firebase')).auth.currentUser
      if (!user) return

      const token = await user.getIdToken()
      const response = await fetch(`/api/org/students/${student?.id}/credits`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setCreditHistory(data.history || [])
      }
    } catch (err) {
      console.error('Failed to fetch credit history:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const user = (await import('@/lib/firebase')).auth.currentUser
      if (!user) return

      const token = await user.getIdToken()
      const response = await fetch('/api/student/profile', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success('Profile updated successfully!')
        await refreshProfile()
      } else {
        const errorData = await response.json()
        toast.error(errorData.message || 'Failed to update profile')
      }
    } catch (err) {
      console.error('Failed to update profile:', err)
      toast.error('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'allocation':
        return '💰'
      case 'deallocation':
        return '💸'
      case 'usage':
        return '🎯'
      default:
        return '📊'
    }
  }

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'allocation':
        return 'text-green-600'
      case 'deallocation':
        return 'text-red-600'
      case 'usage':
        return 'text-blue-600'
      default:
        return 'text-gray-600'
    }
  }

  if (!student) return null

  const primaryColor = student.organization?.branding?.primaryColor || '#3B82F6'
  const orgLogo = student.organization?.branding?.logoUrl
  const orgName = student.organization?.branding?.companyName || student.organization?.name || 'Your Organization'

  return (
    <StudentAuthGuard>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                {orgLogo && (
                  <img 
                    src={orgLogo} 
                    alt={orgName}
                    className="h-8 w-auto mr-4 bg-white rounded shadow-sm p-1"
                  />
                )}
                <div className="flex items-center space-x-4">
                  <Link 
                    href="/student"
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Dashboard
                  </Link>
                  <span className="text-gray-400">/</span>
                  <span className="text-gray-900 font-medium">Profile</span>
                </div>
              </div>
              <Link
                href="/student"
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Student Profile</h1>
            <p className="text-gray-600 mt-1">
              Manage your personal information and view your credit history
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Form */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                    <CardDescription>
                      Update your personal details
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter your full name"
                      />
                    </div>

                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={student.email}
                        disabled
                        className="bg-gray-50"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Email address cannot be changed
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="country">Interview Country</Label>
                      <Input
                        id="country"
                        value={student.interviewCountry?.toUpperCase() || 'Not set'}
                        disabled
                        className="bg-gray-50"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Managed by your organization
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Academic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Academic Information</CardTitle>
                    <CardDescription>
                      Details about your academic background and goals
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="degreeLevel">Degree Level</Label>
                      <Input
                        id="degreeLevel"
                        value={formData.studentProfile.degreeLevel}
                        onChange={(e) => setFormData({
                          ...formData,
                          studentProfile: { ...formData.studentProfile, degreeLevel: e.target.value }
                        })}
                        placeholder="e.g., Bachelor's, Master's, PhD"
                      />
                    </div>

                    <div>
                      <Label htmlFor="fieldOfStudy">Field of Study</Label>
                      <Input
                        id="fieldOfStudy"
                        value={formData.studentProfile.fieldOfStudy}
                        onChange={(e) => setFormData({
                          ...formData,
                          studentProfile: { ...formData.studentProfile, fieldOfStudy: e.target.value }
                        })}
                        placeholder="e.g., Computer Science, Business"
                      />
                    </div>

                    <div>
                      <Label htmlFor="universityName">University/Institution</Label>
                      <Input
                        id="universityName"
                        value={formData.studentProfile.universityName}
                        onChange={(e) => setFormData({
                          ...formData,
                          studentProfile: { ...formData.studentProfile, universityName: e.target.value }
                        })}
                        placeholder="University name"
                      />
                    </div>

                    <div>
                      <Label htmlFor="programLength">Program Duration</Label>
                      <Input
                        id="programLength"
                        value={formData.studentProfile.programLength}
                        onChange={(e) => setFormData({
                          ...formData,
                          studentProfile: { ...formData.studentProfile, programLength: e.target.value }
                        })}
                        placeholder="e.g., 2 years, 4 years"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Label htmlFor="programName">Program Name</Label>
                      <Input
                        id="programName"
                        value={formData.studentProfile.programName}
                        onChange={(e) => setFormData({
                          ...formData,
                          studentProfile: { ...formData.studentProfile, programName: e.target.value }
                        })}
                        placeholder="Full program name"
                      />
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="px-6"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </div>

            {/* Credit Information & History */}
            <div className="space-y-6">
              {/* Credit Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Credit Balance</CardTitle>
                  <CardDescription>
                    Your current interview credits
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-6">
                    <div className="text-4xl font-bold text-blue-600 mb-2">
                      {student.creditsRemaining}
                    </div>
                    <div className="text-sm text-gray-600 mb-4">
                      Credits Remaining
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-lg font-semibold text-green-600">
                          {student.creditsAllocated}
                        </div>
                        <div className="text-gray-600">Total Allocated</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-purple-600">
                          {student.creditsUsed}
                        </div>
                        <div className="text-gray-600">Credits Used</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Account Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Account Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status</span>
                    <Badge 
                      variant={student.accountStatus === 'active' ? 'default' : 'secondary'}
                    >
                      {student.accountStatus}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Dashboard Access</span>
                    <Badge variant={student.dashboardEnabled ? 'default' : 'secondary'}>
                      {student.dashboardEnabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Organization</span>
                    <span className="text-sm font-medium">{orgName}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Member Since</span>
                    <span className="text-sm text-gray-900">
                      {student.createdAt ? formatDate(typeof student.createdAt === 'string' ? student.createdAt : student.createdAt.toDate().toISOString()) : 'Recently'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Credit History */}
              <Card>
                <CardHeader>
                  <CardTitle>Credit History</CardTitle>
                  <CardDescription>
                    Recent credit transactions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {creditHistory.length > 0 ? (
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {creditHistory.slice(0, 10).map((transaction) => (
                        <div key={transaction.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                          <div className="flex items-center space-x-3">
                            <span className="text-lg">
                              {getTransactionIcon(transaction.type)}
                            </span>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {transaction.reason}
                              </div>
                              <div className="text-xs text-gray-500">
                                {formatDate(transaction.timestamp)}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-sm font-medium ${getTransactionColor(transaction.type)}`}>
                              {transaction.type === 'deallocation' ? '-' : ''}
                              {transaction.type === 'usage' ? '-' : ''}
                              {transaction.type === 'allocation' ? '+' : ''}
                              {transaction.amount}
                            </div>
                            <div className="text-xs text-gray-500">
                              Balance: {transaction.balanceAfter}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-xl">💳</span>
                      </div>
                      <p className="text-sm">No credit history yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </StudentAuthGuard>
  )
}
