import React from 'react'
import InterviewRunner from '@/components/interview/InterviewRunner'

export const dynamic = 'force-dynamic'

// Server Component wrapper keeps the route itself as a server component
// while rendering the client-side InterviewRunner beneath. This reduces
// the client bundle for the /interview/[id] route and speeds up compile.
export default function InterviewPage() {
  return <InterviewRunner />
}
