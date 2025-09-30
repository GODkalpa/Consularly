import React from 'react'
import { UserGuard } from '@/components/guards/UserGuard'
import { UserInterviewSimulation } from '@/components/user/UserInterviewSimulation'

export default function DashboardPage() {
  return (
    <UserGuard>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Dashboard</h1>
          <p className="text-muted-foreground">
            Practice your visa interview with AI-powered real-time feedback
          </p>
        </div>
        
        <UserInterviewSimulation />
      </div>
    </UserGuard>
  )
}
