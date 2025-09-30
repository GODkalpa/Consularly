'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Play, User } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { defaultVisaTypeForRoute, type InterviewRoute, routeDisplayName } from '@/lib/interview-routes'

export function UserInterviewSimulation() {
  const { user } = useAuth()
  const router = useRouter()
  const [studentName, setStudentName] = useState('')
  const [route, setRoute] = useState<InterviewRoute>('usa_f1')

  const startNewSession = async () => {
    if (!studentName.trim()) return

    try {
      const res = await fetch('/api/interview/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start',
          userId: user?.uid || 'guest',
          visaType: defaultVisaTypeForRoute(route),
          route,
          studentProfile: {
            name: studentName.trim(),
            country: 'Nepal'
          }
        })
      })

      if (!res.ok) {
        throw new Error(`Failed to start session: ${res.status}`)
      }

      const data = await res.json()
      const apiSess = data.session
      const firstQ = data.question

      // Seed the API session with the first question
      const seededApiSession = {
        ...apiSess,
        conversationHistory: [
          ...apiSess.conversationHistory,
          {
            question: firstQ.question,
            answer: '',
            timestamp: new Date().toISOString(),
            questionType: firstQ.questionType,
            difficulty: firstQ.difficulty,
          }
        ]
      }

      // Store in session/local storage
      try {
        const key = `interview:init:${apiSess.id}`
        const payload = JSON.stringify({
          apiSession: seededApiSession,
          firstQuestion: firstQ,
          route,
          studentName: studentName.trim(),
        })
        try { sessionStorage.setItem(key, payload) } catch {}
        try { localStorage.setItem(key, payload) } catch {}
      } catch {}

      // Open interview in a NEW TAB as requested
      try {
        const url = `/interview/${apiSess.id}`
        window.open(url, '_blank', 'noopener,noreferrer')
      } catch {
        // Fallback to same-tab navigation if popups are blocked
        router.push(`/interview/${apiSess.id}`)
      }
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">F1 Visa Mock Interview</h2>
        <p className="text-muted-foreground">Real-time speech transcription and analysis</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Start New Interview Session
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="studentName">Your Name</Label>
            <Input
              id="studentName"
              placeholder="Enter your full name"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && studentName.trim()) {
                  startNewSession()
                }
              }}
            />
          </div>
          <div className="space-y-2">
            <Label>Interview Type</Label>
            <Select value={route} onValueChange={(v) => setRoute(v as InterviewRoute)}>
              <SelectTrigger>
                <SelectValue placeholder='Select interview country/route' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='usa_f1'>{routeDisplayName.usa_f1}</SelectItem>
                <SelectItem value='uk_student'>{routeDisplayName.uk_student}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button 
            onClick={startNewSession}
            disabled={!studentName.trim()}
            className="w-full"
          >
            <Play className="h-4 w-4 mr-2" />
            Start Interview
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
