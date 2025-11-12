"use client"

import { useEffect, useState, lazy, Suspense } from "react"
import Image from "next/image"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import { auth, firebaseEnabled } from "@/lib/firebase"
import type { OrganizationWithId } from "@/types/firestore"
import { fetchWithCache, cache } from "@/lib/cache"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarHeader,
  SidebarFooter,
  SidebarRail,
  SidebarInset,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Home,
  BarChart3,
  Users,
  Settings,
  Building2,
  Trophy,
  PlayCircle,
  Calendar,
  Loader2,
} from "lucide-react"

// AGGRESSIVE lazy loading - only load when actually needed
const OrgStudentManagement = lazy(() => 
  import("@/components/org/OrgStudentManagement").then(m => ({ 
    default: m.OrgStudentManagement 
  }))
)

const OrgInterviewSimulation = lazy(() => 
  import("@/components/org/OrgInterviewSimulation").then(m => ({ 
    default: m.OrgInterviewSimulation 
  }))
)

const OrgStudentResults = lazy(() => 
  import("@/components/org/OrgStudentResults").then(m => ({ 
    default: m.OrgStudentResults 
  }))
)

const OrgBrandingSettings = lazy(() => 
  import("@/components/org/OrgBrandingSettings").then(m => ({ 
    default: m.OrgBrandingSettings 
  }))
)

const OrgSchedulingCalendar = lazy(() => 
  import("@/components/org/OrgSchedulingCalendar")
)

// Lightweight overview component - no heavy dependencies
function OptimizedOverview({ 
  org, 
  statistics 
}: { 
  org: OrganizationWithId | null
  statistics: any 
}) {
  const quotaLimit = org?.quotaLimit || 0
  const quotaUsed = org?.quotaUsed || 0
  const quotaPct = quotaLimit > 0 ? Math.min(100, (quotaUsed / quotaLimit) * 100) : 0

  const stats = statistics || {
    totalStudents: 0,
    totalInterviews: 0,
    avgScore: 0,
    activeUsers: 0,
    recentInterviews: [],
  }

  const branding = org?.settings?.customBranding || {}
  const brandLogo = branding.logoUrl
  const brandName = branding.companyName || org?.name || "Organization"
  const brandTagline = branding.tagline

  return (
    <div className="space-y-6">
      {/* Lightweight header */}
      <div className="flex items-center gap-4">
        {brandLogo && (
          <div className="relative h-16 w-16 flex items-center justify-center overflow-hidden shrink-0 bg-white rounded-lg shadow-sm border">
            <Image 
              src={brandLogo} 
              alt={brandName} 
              fill 
              sizes="64px" 
              className="object-contain p-2"
              loading="lazy"
            />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold">{brandName}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {brandTagline || "Dashboard"}
          </p>
        </div>
      </div>

      {/* Simplified metrics - no heavy charts */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground">Total Students</div>
            <div className="text-2xl font-bold mt-1">{stats.totalStudents}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground">Interviews</div>
            <div className="text-2xl font-bold mt-1">{stats.totalInterviews}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground">Average Score</div>
            <div className="text-2xl font-bold mt-1">
              {stats.avgScore > 0 ? `${stats.avgScore}/10` : '—'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground">Quota Used</div>
            <div className="text-2xl font-bold mt-1">{quotaPct.toFixed(0)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions - simple buttons */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Button variant="outline" className="h-16 flex flex-col gap-2">
          <Users className="h-6 w-6" />
          <span className="text-sm">Students</span>
        </Button>
        <Button variant="outline" className="h-16 flex flex-col gap-2">
          <PlayCircle className="h-6 w-6" />
          <span className="text-sm">New Interview</span>
        </Button>
        <Button variant="outline" className="h-16 flex flex-col gap-2">
          <Trophy className="h-6 w-6" />
          <span className="text-sm">Results</span>
        </Button>
        <Button variant="outline" className="h-16 flex flex-col gap-2">
          <Calendar className="h-6 w-6" />
          <span className="text-sm">Schedule</span>
        </Button>
      </div>
    </div>
  )
}

// Minimal loading component
function ComponentLoader() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="flex items-center gap-2">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    </div>
  )
}

const menuItems = [
  { title: "Overview", icon: BarChart3, id: "overview" },
  { title: "Students", icon: Users, id: "students" },
  { title: "Schedule", icon: Calendar, id: "schedule" },
  { title: "Interviews", icon: PlayCircle, id: "interviews" },
  { title: "Results", icon: Trophy, id: "results" },
  { title: "Organization", icon: Building2, id: "organization" },
  { title: "Branding", icon: Settings, id: "branding" },
] as const

export function OptimizedOrganizationDashboard() {
  const { userProfile } = useAuth()
  const orgId: string | undefined = userProfile?.orgId

  const [activeSection, setActiveSection] = useState<(typeof menuItems)[number]["id"]>("overview")
  const [org, setOrg] = useState<OrganizationWithId | null>(null)
  const [loading, setLoading] = useState(true)
  const [statistics, setStatistics] = useState<any>(null)

  // Extract branding with fallbacks
  const branding = org?.settings?.customBranding || {}
  const brandColor = branding.primaryColor || "hsl(var(--primary))"
  const brandLogo = branding.logoUrl
  const brandName = branding.companyName || org?.name || "Organization"

  useEffect(() => {
    if (!firebaseEnabled || !orgId) { 
      setLoading(false)
      return 
    }
    
    let mounted = true
    
    // INSTANT: Check cache synchronously first
    const cachedDashboard = cache.get<{ organization: OrganizationWithId, statistics: any }>(`dashboard_${orgId}`)
    
    if (cachedDashboard.data) {
      setOrg(cachedDashboard.data.organization)
      setStatistics(cachedDashboard.data.statistics)
      setLoading(false) // Show immediately
    }
    
    // Background refresh - non-blocking
    async function backgroundRefresh() {
      try {
        const token = await auth.currentUser?.getIdToken()
        if (!token || !mounted) return

        const headers = { Authorization: `Bearer ${token}` }
        
        // OPTIMIZED: Single API call for all dashboard data
        const dashboardData = await fetchWithCache(`dashboard_${orgId}`, async () => {
          const res = await fetch('/api/org/dashboard', { headers })
          const json = await res.json()
          if (!res.ok) throw new Error(json?.error || 'Dashboard fetch failed')
          return json
        }, { ttl: 60 * 1000 }) // Cache for 60s

        if (!mounted) return
        
        setOrg(dashboardData.organization)
        setStatistics(dashboardData.statistics)
      } catch (e) {
        console.error("Background refresh failed", e)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    
    backgroundRefresh()
    return () => { mounted = false }
  }, [orgId])

  const renderContent = () => {
    switch (activeSection) {
      case "overview":
        return <OptimizedOverview org={org} statistics={statistics} />
      case "students":
        return (
          <Suspense fallback={<ComponentLoader />}>
            <OrgStudentManagement onStartInterview={() => setActiveSection("interviews")} />
          </Suspense>
        )
      case "schedule":
        return (
          <Suspense fallback={<ComponentLoader />}>
            <OrgSchedulingCalendar
              onCreateSlot={() => {}}
              onEditSlot={() => {}}
              refreshTrigger={0}
            />
          </Suspense>
        )
      case "interviews":
        return (
          <Suspense fallback={<ComponentLoader />}>
            <OrgInterviewSimulation />
          </Suspense>
        )
      case "results":
        return (
          <Suspense fallback={<ComponentLoader />}>
            <OrgStudentResults />
          </Suspense>
        )
      case "organization":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Organization Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    {brandLogo && (
                      <div className="relative h-12 w-12 bg-white rounded-lg border shadow-sm overflow-hidden">
                        <Image src={brandLogo} alt={brandName} fill className="object-contain p-1" />
                      </div>
                    )}
                    <div>
                      <div className="font-medium">{brandName}</div>
                      <div className="text-sm text-muted-foreground">Plan: {org?.plan || 'Basic'}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>Quota Limit: {org?.quotaLimit || 0}</div>
                    <div>Quota Used: {org?.quotaUsed || 0}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )
      case "branding":
        return (
          <Suspense fallback={<ComponentLoader />}>
            <OrgBrandingSettings 
              organizationPlan={org?.plan || 'basic'}
              initialBranding={org?.settings?.customBranding}
            />
          </Suspense>
        )
      default:
        return <OptimizedOverview org={org} statistics={statistics} />
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen">
        <div className="w-64 border-r bg-muted/10 p-4">
          <div className="space-y-4">
            <div className="h-12 bg-muted rounded animate-pulse" />
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-10 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </div>
        <div className="flex-1 p-6">
          <div className="space-y-6">
            <div className="h-16 bg-muted rounded animate-pulse" />
            <div className="grid grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 bg-muted rounded animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <Sidebar variant="inset" collapsible="icon" className="border-r bg-background">
        <SidebarHeader className="border-b px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 border shrink-0">
              {brandLogo ? (
                <Image src={brandLogo} alt={brandName} fill sizes="40px" className="object-contain p-1" />
              ) : (
                <span className="font-bold text-sm" style={{ color: brandColor }}>
                  {brandName.slice(0,2).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex flex-col group-data-[collapsible=icon]:hidden">
              <span className="text-sm font-semibold leading-none">{brandName}</span>
              <span className="text-xs text-muted-foreground">Dashboard</span>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent className="px-3 py-4">
          <SidebarGroup>
            <SidebarGroupLabel className="px-3 py-2 text-xs font-medium text-muted-foreground">
              Menu
            </SidebarGroupLabel>
            <SidebarGroupContent className="mt-2">
              <SidebarMenu className="space-y-1">
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      tooltip={item.title}
                      onClick={() => setActiveSection(item.id)}
                      isActive={activeSection === item.id}
                      className="h-10 px-3 rounded-lg transition-colors"
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="font-medium">{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t px-4 py-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src="" alt="User" />
              <AvatarFallback className="text-xs">
                {userProfile?.email?.slice(0, 2).toUpperCase() || 'ME'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
              <p className="text-xs font-medium truncate">
                {userProfile?.email?.split('@')[0] || 'Member'}
              </p>
            </div>
            <Button asChild size="icon" variant="ghost" className="h-8 w-8 group-data-[collapsible=icon]:hidden">
              <Link href="/">
                <Home className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {renderContent()}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
