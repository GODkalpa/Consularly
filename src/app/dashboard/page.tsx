"use client"

import { UserGuard } from '@/components/guards/UserGuard'
import { ProfileGuard } from '@/components/guards/ProfileGuard'
import { UserDashboard } from '@/components/user/UserDashboard'

export default function DashboardPage() {
  return (
    <UserGuard>
      <ProfileGuard>
        <UserDashboard />
      </ProfileGuard>
    </UserGuard>
  )
}
