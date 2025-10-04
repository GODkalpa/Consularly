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
import { GraduationCap, Play, Search, Plus } from "lucide-react"
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

import type { DegreeLevel } from '@/lib/database'

export type OrgStudent = {
  id: string
  name: string
  email: string
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
  const [newName, setNewName] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [newProfile, setNewProfile] = useState({
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
    try {
      setLoading(true)
      const token = await auth.currentUser?.getIdToken()
      if (!token) throw new Error('Not authenticated')
      const res = await fetch('/api/org/students', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || `Failed to load students (${res.status})`)
      const rows: OrgStudent[] = (data.students || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        email: s.email,
        lastActive: s.lastActive ? new Date(s.lastActive) : undefined,
        interviewsCompleted: s.interviewsCompleted ?? 0,
      }))
      setStudents(rows)
      setError(null)
    } catch (e: any) {
      setError(e?.message || 'Failed to load students')
    } finally {
      setLoading(false)
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
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-sm text-muted-foreground">Total Students</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.completed}</div>
            <p className="text-sm text-muted-foreground">Completed Interviews</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold flex items-center gap-2"><GraduationCap className="h-5 w-5" /> Org Student Records</div>
            <p className="text-sm text-muted-foreground">Database-only students (no user accounts)</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search students by name or email" className="pl-8" />
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button>
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
                  <Label>Email (optional)</Label>
                  <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="name@example.com" />
                </div>
              </div>

              {/* Profile Info */}
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
                      <SelectItem value="undergraduate">Undergraduate (Bachelor's)</SelectItem>
                      <SelectItem value="graduate">Graduate (Master's)</SelectItem>
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
                    if (!newProfile.degreeLevel) { toast.error('Degree level is required'); return }
                    if (!newProfile.programName.trim()) { toast.error('Program name is required'); return }
                    if (!newProfile.universityName.trim()) { toast.error('University name is required'); return }
                    if (!newProfile.programLength.trim()) { toast.error('Program length is required'); return }
                    if (!newProfile.programCost.trim()) { toast.error('Program cost is required'); return }
                    
                    try {
                      setCreating(true)
                      const token = await auth.currentUser?.getIdToken()
                      if (!token) throw new Error('Not authenticated')
                      const res = await fetch('/api/org/students', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({ 
                          name: newName.trim(), 
                          email: newEmail.trim(),
                          studentProfile: {
                            degreeLevel: newProfile.degreeLevel,
                            programName: newProfile.programName.trim(),
                            universityName: newProfile.universityName.trim(),
                            programLength: newProfile.programLength.trim(),
                            programCost: newProfile.programCost.trim(),
                            fieldOfStudy: newProfile.fieldOfStudy.trim() || undefined,
                            intendedMajor: newProfile.intendedMajor.trim() || undefined,
                            profileCompleted: true
                          }
                        })
                      })
                      const data = await res.json()
                      if (!res.ok) throw new Error(data?.error || 'Failed to add student')
                      toast.success('Student added with complete profile')
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
      <Card>
        <CardHeader>
          <CardTitle>Students</CardTitle>
          <CardDescription>These students are defined by your organization for analysis. They do not have platform accounts.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead>Actions</TableHead>
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
                      <Badge variant="secondary">{s.interviewsCompleted ?? 0}</Badge>
                    </TableCell>
                    <TableCell>{s.lastActive ? new Date(s.lastActive).toLocaleDateString() : '-'}</TableCell>
                    <TableCell>
                      <Button size="sm" onClick={() => onStartInterview?.(s.id, s.name)}>
                        <Play className="h-4 w-4 mr-2" />
                        Start Interview
                      </Button>
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
    </div>
  )
}

export default OrgStudentManagement
