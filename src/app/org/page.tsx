"use client"

import { OrganizationDashboard } from "@/components/org/OrganizationDashboard"
import { OrganizationGuard } from "@/components/auth/OrganizationGuard"

export default function OrgPage() {
  return (
    <OrganizationGuard>
      <OrganizationDashboard />
    </OrganizationGuard>
  )
}
