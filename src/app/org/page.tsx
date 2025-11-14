"use client"

import dynamic from "next/dynamic"
import { OrganizationGuard } from "@/components/auth/OrganizationGuard"

const OrganizationDashboard = dynamic(
  () => import("@/components/org/OrganizationDashboard"),
  {
    ssr: false,
    loading: () => (
      <div className="p-6 md:p-8">
        <div className="h-8 w-48 bg-muted animate-pulse rounded mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
    ),
  }
)

export default function OrgPage() {
  return (
    <OrganizationGuard>
      <OrganizationDashboard />
    </OrganizationGuard>
  )
}
