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
import { toast } from "sonner"

export type OrgStudent = {
  id: string
  name: string
  email: string
  lastActive?: Date
  interviewsCompleted?: number
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Student</DialogTitle>
              <DialogDescription>Create a database-only student record for your organization.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Full name" />
              </div>
              <div className="space-y-2">
                <Label>Email (optional)</Label>
                <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="name@example.com" />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setAddOpen(false)} disabled={creating}>Cancel</Button>
                <Button
                  onClick={async () => {
                    if (!newName.trim()) { toast.error('Name is required'); return }
                    try {
                      setCreating(true)
                      const token = await auth.currentUser?.getIdToken()
                      if (!token) throw new Error('Not authenticated')
                      const res = await fetch('/api/org/students', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({ name: newName.trim(), email: newEmail.trim() })
                      })
                      const data = await res.json()
                      if (!res.ok) throw new Error(data?.error || 'Failed to add student')
                      toast.success('Student added')
                      setAddOpen(false)
                      setNewName(''); setNewEmail('')
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
