"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { auth, firebaseEnabled } from "@/lib/firebase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { GraduationCap, Play, Search, Plus, Pencil, Trash2, Eye } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { fetchWithCache, cache, invalidate } from "@/lib/cache"

import type { DegreeLevel } from '@/lib/database'

export type OrgStudent = {
  id: string
  name: string
  email: string
  interviewCountry?: 'usa' | 'uk' | 'france'
  lastActive?: Date
  interviewsCompleted?: number
  studentProfile?: {
    degreeLevel?: DegreeLevel
    programName?: string
    universityName?: string
    programLength?: string
    programCost?: string
    fieldOfStudy?: string
    intendedMajor?: string
  }
}

interface OrgStudentManagementProps {
  onStartInterview?: (studentId: string, studentName: string) => void
}

export function OrgStudentManagement({ onStartInterview }: OrgStudentManagementProps) {
  const { userProfile } = useAuth()
  const [students, setStudents] = useState<OrgStudent[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<OrgStudent | null>(null)
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newCountry, setNewCountry] = useState<'usa' | 'uk' | 'france' | ''>('')
  const [newProfile, setNewProfile] = useState({
    degreeLevel: '' as DegreeLevel | '',
    programName: '',
    universityName: '',
    programLength: '',
    programCost: '',
    fieldOfStudy: '',
    intendedMajor: ''
  })
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editCountry, setEditCountry] = useState<'usa' | 'uk' | 'france' | ''>('')
  const [editProfile, setEditProfile] = useState({
    degreeLevel: '' as DegreeLevel | '',
    programName: '',
    universityName: '',
    programLength: '',
    programCost: '',
    fieldOfStudy: '',
    intendedMajor: ''
  })

  async function loadStudents() {
    if (!firebaseEnabled) { setLoading(false); return }
    
    const orgId = userProfile?.orgId
    if (!orgId) { setLoading(false); return }
    
    // Check cache first for instant display
    const cached = cache.get<OrgStudent[]>(`students_${orgId}`)
    if (cached.data) {
      setStudents(cached.data)
      setLoading(false) // Show cached data instantly
    }
    
    try {
      const token = await auth.currentUser?.getIdToken()
      if (!token) throw new Error('Not authenticated')
      
      // Fetch with cache (background refresh if already displayed)
      const rows = await fetchWithCache(
        `students_${orgId}`,
        async () => {
          const res = await fetch('/api/org/students', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
          })
          const data = await res.json()
          if (!res.ok) throw new Error(data?.error || `Failed to load students (${res.status})`)
          
          // Process and return the array (this is what gets cached)
          return (data.students || []).map((s: any) => ({
            id: s.id,
            name: s.name,
            email: s.email,
            interviewCountry: s.interviewCountry,
            lastActive: s.lastActive ? new Date(s.lastActive) : undefined,
            interviewsCompleted: s.interviewsCompleted ?? 0,
            studentProfile: s.studentProfile,
          })) as OrgStudent[]
        },
        { ttl: 2 * 60 * 1000 } // 2-minute cache
      )
      
      setStudents(rows)
      setError(null)
    } catch (e: any) {
      setError(e?.message || 'Failed to load students')
    } finally {
      setLoading(false)
    }
  }

  function openViewDialog(student: OrgStudent) {
    setSelectedStudent(student)
    setViewOpen(true)
  }

  function openEditDialog(student: OrgStudent) {
    setSelectedStudent(student)
    setEditName(student.name)
    setEditEmail(student.email)
    setEditCountry(student.interviewCountry || '')
    setEditProfile({
      degreeLevel: student.studentProfile?.degreeLevel || '',
      programName: student.studentProfile?.programName || '',
      universityName: student.studentProfile?.universityName || '',
      programLength: student.studentProfile?.programLength || '',
      programCost: student.studentProfile?.programCost || '',
      fieldOfStudy: student.studentProfile?.fieldOfStudy || '',
      intendedMajor: student.studentProfile?.intendedMajor || ''
    })
    setEditOpen(true)
  }

  async function handleUpdateStudent() {
    if (!selectedStudent) return
    if (!editName.trim()) { toast.error('Name is required'); return }
    if (!editEmail.trim()) { toast.error('Email is required'); return }
    if (!editCountry) { toast.error('Interview country is required'); return }

    // Only validate profile fields for USA
    if (editCountry === 'usa') {
      if (!editProfile.degreeLevel) { toast.error('Degree level is required'); return }
      if (!editProfile.programName.trim()) { toast.error('Program name is required'); return }
      if (!editProfile.universityName.trim()) { toast.error('University name is required'); return }
      if (!editProfile.programLength.trim()) { toast.error('Program length is required'); return }
      if (!editProfile.programCost.trim()) { toast.error('Program cost is required'); return }
    }

    try {
      setUpdating(true)
      const token = await auth.currentUser?.getIdToken()
      if (!token) throw new Error('Not authenticated')

      const payload: any = {
        name: editName.trim(),
        email: editEmail.trim(),
        interviewCountry: editCountry
      }

      // Only include profile for USA
      if (editCountry === 'usa') {
        payload.studentProfile = {
          degreeLevel: editProfile.degreeLevel,
          programName: editProfile.programName.trim(),
          universityName: editProfile.universityName.trim(),
          programLength: editProfile.programLength.trim(),
          programCost: editProfile.programCost.trim(),
          fieldOfStudy: editProfile.fieldOfStudy.trim() || undefined,
          intendedMajor: editProfile.intendedMajor.trim() || undefined,
          profileCompleted: true
        }
      } else {
        // Clear profile for non-USA students
        payload.studentProfile = null
      }

      const res = await fetch(`/api/org/students/${selectedStudent.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to update student')
      toast.success('Student updated successfully')
      setEditOpen(false)
      setSelectedStudent(null)
      // Invalidate cache to force fresh fetch
      invalidate('students_')
      await loadStudents()
    } catch (e: any) {
      toast.error('Update failed', { description: e?.message })
    } finally {
      setUpdating(false)
    }
  }

  async function handleDeleteStudent(student: OrgStudent) {
    if (!confirm(`Are you sure you want to delete ${student.name}? This action cannot be undone.`)) {
      return
    }

    try {
      setDeleting(true)
      const token = await auth.currentUser?.getIdToken()
      if (!token) throw new Error('Not authenticated')

      const res = await fetch(`/api/org/students/${student.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to delete student')
      toast.success('Student deleted successfully')
      // Invalidate cache to force fresh fetch
      invalidate('students_')
      await loadStudents()
    } catch (e: any) {
      toast.error('Delete failed', { description: e?.message })
    } finally {
      setDeleting(false)
    }
  }

  useEffect(() => {
    let canceled = false
    ;(async () => {
      await loadStudents()
      if (canceled) return
    })()
    return () => { canceled = true }
  }, [])

  const filtered = useMemo(() => {
    const s = search.toLowerCase()
    return students.filter(st =>
      st.name.toLowerCase().includes(s) || st.email.toLowerCase().includes(s)
    )
  }, [students, search])

  const stats = useMemo(() => {
    return {
      total: students.length,
      completed: students.reduce((acc, s) => acc + (s.interviewsCompleted || 0), 0)
    }
  }, [students])

  if (!firebaseEnabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Students</CardTitle>
          <CardDescription>Firebase is not configured in this environment.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Students</h1>
        <p className="text-muted-foreground mt-1">Manage student records and simulation access</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Total Students</p>
            <div className="text-4xl font-bold">{stats.total.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Completed Interviews</p>
            <div className="text-4xl font-bold">{stats.completed}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-primary rounded-lg">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <p className="text-sm font-medium text-primary">Org Student Records</p>
            </div>
            <p className="text-xs text-primary/70">Database-only students (no user accounts)</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Actions */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            placeholder="Search students by name or email" 
            className="pl-9 h-10" 
          />
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 h-10 px-4 text-white">
              <Plus className="h-4 w-4 mr-2" /> Add Student
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Student</DialogTitle>
              <DialogDescription>Create a database-only student record for your organization with complete profile information.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {/* Basic Info */}
              <div className="space-y-4 pb-4 border-b">
                <h3 className="font-medium text-sm">Basic Information</h3>
                <div className="space-y-2">
                  <Label>Name <span className="text-destructive">*</span></Label>
                  <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Full name" />
                </div>
                <div className="space-y-2">
                  <Label>Email <span className="text-destructive">*</span></Label>
                  <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="name@example.com" required />
                </div>
                <div className="space-y-2">
                  <Label>Interview Country <span className="text-destructive">*</span></Label>
                  <Select value={newCountry} onValueChange={(value) => setNewCountry(value as 'usa' | 'uk' | 'france')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select interview country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="usa">🇺🇸 United States (F1 Visa)</SelectItem>
                      <SelectItem value="uk">🇬🇧 United Kingdom</SelectItem>
                      <SelectItem value="france">🇫🇷 France</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Profile Info - USA Only */}
              {newCountry === 'usa' && (
              <div className="space-y-4">
                <h3 className="font-medium text-sm">Program Information</h3>
                <div className="space-y-2">
                  <Label>Degree Level <span className="text-destructive">*</span></Label>
                  <Select
                    value={newProfile.degreeLevel}
                    onValueChange={(value) => setNewProfile(prev => ({ ...prev, degreeLevel: value as DegreeLevel }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select degree level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="undergraduate">Undergraduate (Bachelor&apos;s)</SelectItem>
                      <SelectItem value="graduate">Graduate (Master&apos;s)</SelectItem>
                      <SelectItem value="doctorate">Doctorate (PhD)</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Program Name <span className="text-destructive">*</span></Label>
                  <Input 
                    value={newProfile.programName} 
                    onChange={(e) => setNewProfile(prev => ({ ...prev, programName: e.target.value }))} 
                    placeholder="e.g., Master's in Computer Science" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>University Name <span className="text-destructive">*</span></Label>
                  <Input 
                    value={newProfile.universityName} 
                    onChange={(e) => setNewProfile(prev => ({ ...prev, universityName: e.target.value }))} 
                    placeholder="e.g., Stanford University" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Program Length <span className="text-destructive">*</span></Label>
                    <Input 
                      value={newProfile.programLength} 
                      onChange={(e) => setNewProfile(prev => ({ ...prev, programLength: e.target.value }))} 
                      placeholder="e.g., 2 years" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Total Cost <span className="text-destructive">*</span></Label>
                    <Input 
                      value={newProfile.programCost} 
                      onChange={(e) => setNewProfile(prev => ({ ...prev, programCost: e.target.value }))} 
                      placeholder="e.g., $50,000" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Field of Study (Optional)</Label>
                  <Input 
                    value={newProfile.fieldOfStudy} 
                    onChange={(e) => setNewProfile(prev => ({ ...prev, fieldOfStudy: e.target.value }))} 
                    placeholder="e.g., Computer Science" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Intended Major (Optional)</Label>
                  <Input 
                    value={newProfile.intendedMajor} 
                    onChange={(e) => setNewProfile(prev => ({ ...prev, intendedMajor: e.target.value }))} 
                    placeholder="e.g., Artificial Intelligence" 
                  />
                </div>
              </div>
              )}

              {/* UK/France Info */}
              {newCountry && newCountry !== 'usa' && (
                <div className="bg-muted/50 border rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">
                      {newCountry === 'uk' ? '🇬🇧 UK' : '🇫🇷 France'} Student:
                    </strong> Name and email are sufficient. No additional profile information required.
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => {
                  setAddOpen(false)
                  setNewName('')
                  setNewEmail('')
                  setNewProfile({
                    degreeLevel: '',
                    programName: '',
                    universityName: '',
                    programLength: '',
                    programCost: '',
                    fieldOfStudy: '',
                    intendedMajor: ''
                  })
                }} disabled={creating}>Cancel</Button>
                <Button
                  onClick={async () => {
                    if (!newName.trim()) { toast.error('Name is required'); return }
                    if (!newEmail.trim()) { toast.error('Email is required'); return }
                    if (!newCountry) { toast.error('Interview country is required'); return }
                    
                    // Only validate profile fields for USA
                    if (newCountry === 'usa') {
                      if (!newProfile.degreeLevel) { toast.error('Degree level is required'); return }
                      if (!newProfile.programName.trim()) { toast.error('Program name is required'); return }
                      if (!newProfile.universityName.trim()) { toast.error('University name is required'); return }
                      if (!newProfile.programLength.trim()) { toast.error('Program length is required'); return }
                      if (!newProfile.programCost.trim()) { toast.error('Program cost is required'); return }
                    }
                    
                    try {
                      setCreating(true)
                      const token = await auth.currentUser?.getIdToken()
                      if (!token) throw new Error('Not authenticated')
                      // Build payload based on country
                      const payload: any = {
                        name: newName.trim(), 
                        email: newEmail.trim(),
                        interviewCountry: newCountry
                      }
                      
                      // Only include profile for USA
                      if (newCountry === 'usa') {
                        payload.studentProfile = {
                          degreeLevel: newProfile.degreeLevel,
                          programName: newProfile.programName.trim(),
                          universityName: newProfile.universityName.trim(),
                          programLength: newProfile.programLength.trim(),
                          programCost: newProfile.programCost.trim(),
                          fieldOfStudy: newProfile.fieldOfStudy.trim() || undefined,
                          intendedMajor: newProfile.intendedMajor.trim() || undefined,
                          profileCompleted: true
                        }
                      }
                      
                      const res = await fetch('/api/org/students', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify(payload)
                      })
                      const data = await res.json()
                      if (!res.ok) throw new Error(data?.error || 'Failed to add student')
                      toast.success('Student added successfully')
                      // Invalidate cache to force fresh fetch
                      invalidate('students_')
                      setAddOpen(false)
                      setNewName('')
                      setNewEmail('')
                      setNewCountry('')
                      setNewProfile({
                        degreeLevel: '',
                        programName: '',
                        universityName: '',
                        programLength: '',
                        programCost: '',
                        fieldOfStudy: '',
                        intendedMajor: ''
                      })
                      await loadStudents()
                    } catch (e: any) {
                      toast.error('Add student failed', { description: e?.message })
                    } finally {
                      setCreating(false)
                    }
                  }}
                  disabled={creating}
                >{creating ? 'Adding…' : 'Add Student'}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      <Card className="bg-white">
        <CardContent className="p-0">
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="font-semibold text-xs uppercase text-gray-600">Student</TableHead>
                  <TableHead className="font-semibold text-xs uppercase text-gray-600">Email</TableHead>
                  <TableHead className="font-semibold text-xs uppercase text-gray-600">Completed</TableHead>
                  <TableHead className="font-semibold text-xs uppercase text-gray-600">Last Active</TableHead>
                  <TableHead className="font-semibold text-xs uppercase text-gray-600">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(s => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={`https://avatar.vercel.sh/${s.email}`} />
                          <AvatarFallback>{s.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{s.name}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{s.email || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="rounded-full px-3">{s.interviewsCompleted ?? 0}</Badge>
                    </TableCell>
                    <TableCell>{s.lastActive ? new Date(s.lastActive).toLocaleDateString() : '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openViewDialog(s)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openEditDialog(s)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive hover:text-destructive" onClick={() => handleDeleteStudent(s)} disabled={deleting}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button size="sm" className="bg-primary hover:bg-primary/90 ml-2 text-white" onClick={() => onStartInterview?.(s.id, s.name)}>
                          <Play className="h-4 w-4 mr-1.5" />
                          Start Interview
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-8">
              {loading ? (
                <p className="text-muted-foreground">Loading students…</p>
              ) : error ? (
                <p className="text-destructive">{error}</p>
              ) : (
                <p className="text-muted-foreground">No students yet. Add your first student to begin.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Student Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Student Details</DialogTitle>
            <DialogDescription>View complete information about this student</DialogDescription>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-4 py-2">
              <div className="space-y-4 pb-4 border-b">
                <h3 className="font-medium text-sm">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Name</Label>
                    <p className="text-sm font-medium">{selectedStudent.name}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Email</Label>
                    <p className="text-sm font-medium">{selectedStudent.email}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Interview Country</Label>
                    <p className="text-sm font-medium">
                      {selectedStudent.interviewCountry === 'usa' && '🇺🇸 United States (F1 Visa)'}
                      {selectedStudent.interviewCountry === 'uk' && '🇬🇧 United Kingdom'}
                      {selectedStudent.interviewCountry === 'france' && '🇫🇷 France'}
                      {!selectedStudent.interviewCountry && '-'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Interviews Completed</Label>
                    <p className="text-sm font-medium">{selectedStudent.interviewsCompleted ?? 0}</p>
                  </div>
                </div>
              </div>

              {selectedStudent.interviewCountry === 'usa' && selectedStudent.studentProfile && (
                <div className="space-y-4">
                  <h3 className="font-medium text-sm">Program Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Degree Level</Label>
                      <p className="text-sm font-medium capitalize">{selectedStudent.studentProfile.degreeLevel || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Program Name</Label>
                      <p className="text-sm font-medium">{selectedStudent.studentProfile.programName || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">University Name</Label>
                      <p className="text-sm font-medium">{selectedStudent.studentProfile.universityName || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Program Length</Label>
                      <p className="text-sm font-medium">{selectedStudent.studentProfile.programLength || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Total Cost</Label>
                      <p className="text-sm font-medium">{selectedStudent.studentProfile.programCost || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Field of Study</Label>
                      <p className="text-sm font-medium">{selectedStudent.studentProfile.fieldOfStudy || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Intended Major</Label>
                      <p className="text-sm font-medium">{selectedStudent.studentProfile.intendedMajor || '-'}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setViewOpen(false)}>Close</Button>
                <Button onClick={() => {
                  setViewOpen(false)
                  openEditDialog(selectedStudent)
                }}>
                  <Pencil className="h-4 w-4 mr-2" /> Edit Student
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Student Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
            <DialogDescription>Update student information and profile details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Basic Info */}
            <div className="space-y-4 pb-4 border-b">
              <h3 className="font-medium text-sm">Basic Information</h3>
              <div className="space-y-2">
                <Label>Name <span className="text-destructive">*</span></Label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Full name" />
              </div>
              <div className="space-y-2">
                <Label>Email <span className="text-destructive">*</span></Label>
                <Input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder="name@example.com" />
              </div>
              <div className="space-y-2">
                <Label>Interview Country <span className="text-destructive">*</span></Label>
                <Select value={editCountry} onValueChange={(value) => setEditCountry(value as 'usa' | 'uk' | 'france')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select interview country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="usa">🇺🇸 United States (F1 Visa)</SelectItem>
                    <SelectItem value="uk">🇬🇧 United Kingdom</SelectItem>
                    <SelectItem value="france">🇫🇷 France</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Profile Info - USA Only */}
            {editCountry === 'usa' && (
              <div className="space-y-4">
                <h3 className="font-medium text-sm">Program Information</h3>
                <div className="space-y-2">
                  <Label>Degree Level <span className="text-destructive">*</span></Label>
                  <Select
                    value={editProfile.degreeLevel}
                    onValueChange={(value) => setEditProfile(prev => ({ ...prev, degreeLevel: value as DegreeLevel }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select degree level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="undergraduate">Undergraduate (Bachelor&apos;s)</SelectItem>
                      <SelectItem value="graduate">Graduate (Master&apos;s)</SelectItem>
                      <SelectItem value="doctorate">Doctorate (PhD)</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Program Name <span className="text-destructive">*</span></Label>
                  <Input 
                    value={editProfile.programName} 
                    onChange={(e) => setEditProfile(prev => ({ ...prev, programName: e.target.value }))} 
                    placeholder="e.g., Master's in Computer Science" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>University Name <span className="text-destructive">*</span></Label>
                  <Input 
                    value={editProfile.universityName} 
                    onChange={(e) => setEditProfile(prev => ({ ...prev, universityName: e.target.value }))} 
                    placeholder="e.g., Stanford University" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Program Length <span className="text-destructive">*</span></Label>
                    <Input 
                      value={editProfile.programLength} 
                      onChange={(e) => setEditProfile(prev => ({ ...prev, programLength: e.target.value }))} 
                      placeholder="e.g., 2 years" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Total Cost <span className="text-destructive">*</span></Label>
                    <Input 
                      value={editProfile.programCost} 
                      onChange={(e) => setEditProfile(prev => ({ ...prev, programCost: e.target.value }))} 
                      placeholder="e.g., $50,000" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Field of Study (Optional)</Label>
                  <Input 
                    value={editProfile.fieldOfStudy} 
                    onChange={(e) => setEditProfile(prev => ({ ...prev, fieldOfStudy: e.target.value }))} 
                    placeholder="e.g., Computer Science" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Intended Major (Optional)</Label>
                  <Input 
                    value={editProfile.intendedMajor} 
                    onChange={(e) => setEditProfile(prev => ({ ...prev, intendedMajor: e.target.value }))} 
                    placeholder="e.g., Artificial Intelligence" 
                  />
                </div>
              </div>
            )}

            {/* UK/France Info */}
            {editCountry && editCountry !== 'usa' && (
              <div className="bg-muted/50 border rounded-lg p-4">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">
                    {editCountry === 'uk' ? '🇬🇧 UK' : '🇫🇷 France'} Student:
                  </strong> Name and email are sufficient. No additional profile information required.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => {
                setEditOpen(false)
                setSelectedStudent(null)
              }} disabled={updating}>Cancel</Button>
              <Button onClick={handleUpdateStudent} disabled={updating}>
                {updating ? 'Updating…' : 'Update Student'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default OrgStudentManagement
