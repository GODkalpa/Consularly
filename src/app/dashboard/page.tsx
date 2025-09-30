"use client"

import { UserGuard } from '@/components/guards/UserGuard'
import { UserDashboard } from '@/components/user/UserDashboard'

export default function DashboardPage() {
  return (
    <UserGuard>
      <UserDashboard />
    </UserGuard>
  )
}
