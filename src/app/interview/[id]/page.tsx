'use client'

import { useEffect, useState } from 'react'

export const dynamic = 'force-dynamic'

export default function InterviewPage() {
  const [InterviewRunner, setInterviewRunner] = useState<any>(null)

  useEffect(() => {
    // Only import on client side after mount
    import('@/components/interview/InterviewRunner')
      .then((mod) => {
        setInterviewRunner(() => mod.default)
      })
      .catch((err) => {
        console.error('Failed to load InterviewRunner:', err)
      })
  }, [])

  if (!InterviewRunner) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 animate-spin mx-auto border-4 border-primary border-t-transparent rounded-full" />
          <div className="text-sm text-muted-foreground">Loading interview...</div>
        </div>
      </div>
    )
  }

  return <InterviewRunner />
}
