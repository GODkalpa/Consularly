'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

// Dynamically import InterviewRunner with no SSR to prevent server-side rendering issues
const InterviewRunner = dynamic(
  () => import('@/components/interview/InterviewRunner'),
  { 
    ssr: false,
    loading: () => (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p>Loading interview...</p>
      </div>
    )
  }
)

// Force dynamic rendering for all interview IDs
export const dynamic = 'force-dynamic'

export default function InterviewPage() {
  return <InterviewRunner />
}
