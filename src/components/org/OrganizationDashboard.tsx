"use client"

import { useEffect, useMemo, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { auth, firebaseEnabled } from "@/lib/firebase"
import type { OrganizationWithId, InterviewAnalytics } from "@/types/firestore"

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
  SidebarTrigger,
  SidebarHeader,
  SidebarFooter,
  SidebarMenuBadge,
  SidebarRail,
  SidebarInset,
} from "@/components/ui/sidebar"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  Home,
  BarChart3,
  Users,
  PieChart,
  Settings,
  Building2,
  Search,
} from "lucide-react"
import { PlayCircle } from "lucide-react"
import { OrgStudentManagement } from "@/components/org/OrgStudentManagement"
import { OrgInterviewSimulation } from "@/components/org/OrgInterviewSimulation"

const menuItems = [
  { title: "Overview", icon: BarChart3, id: "overview" },
  { title: "Students", icon: Users, id: "students" },
  { title: "Interviews", icon: PlayCircle, id: "interviews" },
  { title: "Analytics", icon: PieChart, id: "analytics" },
  { title: "Organization", icon: Building2, id: "organization" },
  { title: "Settings", icon: Settings, id: "settings" },
] as const

export function OrganizationDashboard() {
  const { userProfile } = useAuth()
  const orgId: string | undefined = userProfile?.orgId

  const [activeSection, setActiveSection] = useState<(typeof menuItems)[number]["id"]>("overview")
  const [org, setOrg] = useState<OrganizationWithId | null>(null)
  const [analytics, setAnalytics] = useState<InterviewAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedStudentId, setSelectedStudentId] = useState<string | undefined>(undefined)
  const [selectedStudentName, setSelectedStudentName] = useState<string | undefined>(undefined)

  // Default to global primary token so the dashboard inherits the site palette
  const brandColor = org?.settings?.customBranding?.primaryColor || "hsl(var(--primary))"
  const brandLogo = org?.settings?.customBranding?.logoUrl
  const brandName = org?.settings?.customBranding?.companyName || org?.name || "Organization"

  const activeTitle = useMemo(
    () => menuItems.find((item) => item.id === activeSection)?.title || "Dashboard",
    [activeSection]
  )

  useEffect(() => {
    let mounted = true
    async function load() {
      if (!firebaseEnabled || !orgId) { setLoading(false); return }
      try {
        const token = await auth.currentUser?.getIdToken()
        if (!token) throw new Error('Not authenticated')

        const [orgRes, analyticsRes] = await Promise.all([
          fetch('/api/org/organization', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/org/analytics', { headers: { Authorization: `Bearer ${token}` } }),
        ])

        const orgJson = await orgRes.json()
        const analyticsJson = await analyticsRes.json()
        if (!orgRes.ok) throw new Error(orgJson?.error || `Organization fetch failed (${orgRes.status})`)
        if (!analyticsRes.ok) throw new Error(analyticsJson?.error || `Analytics fetch failed (${analyticsRes.status})`)
        const orgDoc = orgJson.organization as OrganizationWithId
        const orgAnalytics = analyticsJson.analytics as InterviewAnalytics
        if (!mounted) return
        setOrg(orgDoc)
        setAnalytics(orgAnalytics)
      } catch (e) {
        console.error("Failed to load org dashboard data", e)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [orgId])

  const renderOverview = () => {
    const quotaLimit = org?.quotaLimit || 0
    const quotaUsed = org?.quotaUsed || 0
    const quotaPct = quotaLimit > 0 ? Math.min(100, (quotaUsed / quotaLimit) * 100) : 0

    return (
      <div className="space-y-6">
        {/* Branding hero */}
        <div
          className="rounded-xl p-5 text-primary-foreground"
          style={{ background: brandColor }}
        >
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-foreground/15 flex items-center justify-center overflow-hidden">
              {brandLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={brandLogo} alt={brandName} className="h-full w-full object-contain" />
              ) : (
                <span className="font-semibold text-xl">{brandName?.slice(0,2).toUpperCase()}</span>
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold">{brandName}</h2>
              <p className="text-primary-foreground/80 text-sm">Organization Dashboard</p>
            </div>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{analytics?.totalInterviews ?? 0}</div>
              <p className="text-sm text-muted-foreground">Total Interviews</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{(analytics?.averageScore ?? 0).toFixed(1)}</div>
              <p className="text-sm text-muted-foreground">Average Score</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{(analytics?.completionRate ?? 0).toFixed(0)}%</div>
              <p className="text-sm text-muted-foreground">Completion Rate</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{(analytics?.averageDuration ?? 0).toFixed(0)}m</div>
              <p className="text-sm text-muted-foreground">Avg. Duration</p>
            </CardContent>
          </Card>
        </div>

        {/* Quota card */}
        <Card>
          <CardHeader>
            <CardTitle>Quota Usage</CardTitle>
            <CardDescription>Monthly quota utilization for your plan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium" style={{ color: brandColor }}>
                  {quotaUsed} / {quotaLimit}
                </span>
                <span className="text-muted-foreground">{quotaPct.toFixed(0)}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full" style={{ width: `${quotaPct}%`, background: brandColor }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderAnalytics = () => {
    const dist = analytics?.scoreDistribution
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Excellent</CardTitle>
            <CardDescription>Scores 90-100</CardDescription>
          </CardHeader>
          <CardContent><div className="text-3xl font-bold">{dist?.excellent ?? 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Good</CardTitle>
            <CardDescription>Scores 80-89</CardDescription>
          </CardHeader>
          <CardContent><div className="text-3xl font-bold">{dist?.good ?? 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Average</CardTitle>
            <CardDescription>Scores 70-79</CardDescription>
          </CardHeader>
          <CardContent><div className="text-3xl font-bold">{dist?.average ?? 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Needs Improvement</CardTitle>
            <CardDescription>Scores below 70</CardDescription>
          </CardHeader>
          <CardContent><div className="text-3xl font-bold">{dist?.needsImprovement ?? 0}</div></CardContent>
        </Card>
      </div>
    )
  }

  const renderStudents = () => {
    return (
      <OrgStudentManagement
        onStartInterview={(studentId, studentName) => {
          setSelectedStudentId(studentId)
          setSelectedStudentName(studentName)
          setActiveSection("interviews")
        }}
      />
    )
  }

  const renderInterviews = () => {
    return (
      <OrgInterviewSimulation
        initialStudentId={selectedStudentId}
        initialStudentName={selectedStudentName}
      />
    )
  }

  const renderOrganization = () => {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Branding</CardTitle>
            <CardDescription>Company identity used across your dashboard</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-muted overflow-hidden flex items-center justify-center">
                {brandLogo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={brandLogo} alt={brandName} className="h-full w-full object-contain" />
                ) : (
                  <span className="font-semibold">{brandName.slice(0,2).toUpperCase()}</span>
                )}
              </div>
              <div>
                <div className="font-medium">{brandName}</div>
                <div className="text-sm text-muted-foreground">Logo and primary color</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full border" style={{ background: brandColor }} />
              <span className="text-sm">{brandColor}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Branding is managed by the platform admin. Contact your platform administrator to update logo or colors.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscription</CardTitle>
            <CardDescription>Your plan and quotas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Plan</span>
              <span className="font-medium capitalize">{org?.plan ?? '-'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Monthly Quota</span>
              <span className="font-medium">{org?.quotaLimit ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Used This Month</span>
              <span className="font-medium">{org?.quotaUsed ?? 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderSettings = () => {
    const allowSelfRegistration = org?.settings?.allowSelfRegistration
    const enableMetricsCollection = org?.settings?.enableMetricsCollection
    const defaultInterviewDuration = org?.settings?.defaultInterviewDuration

    return (
      <Card>
        <CardHeader>
          <CardTitle>Organization Settings</CardTitle>
          <CardDescription>View-only settings for your organization</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Self Registration</span>
            <span className="font-medium">{allowSelfRegistration ? 'Enabled' : 'Disabled'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Metrics Collection</span>
            <span className="font-medium">{enableMetricsCollection ? 'Enabled' : 'Disabled'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Default Interview Duration</span>
            <span className="font-medium">{defaultInterviewDuration ?? 30} minutes</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Settings changes require assistance from platform admin. Your dashboard does not allow account creation or settings edits.
          </p>
        </CardContent>
      </Card>
    )
  }

  const renderContent = () => {
    switch (activeSection) {
      case "overview":
        return renderOverview()
      case "students":
        return renderStudents()
      case "interviews":
        return renderInterviews()
      case "analytics":
        return renderAnalytics()
      case "organization":
        return renderOrganization()
      case "settings":
        return renderSettings()
      default:
        return renderOverview()
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading organization dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <Sidebar variant="inset" collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-3 rounded-md px-2 py-1.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-md text-primary-foreground font-semibold" style={{ background: brandColor }}>
              {brandLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={brandLogo} alt={brandName} className="h-7 w-7 object-contain" />
              ) : (
                brandName.slice(0,2).toUpperCase()
              )}
            </div>
            <div className="grid leading-tight group-data-[collapsible=icon]:hidden">
              <span className="text-sm font-semibold">{brandName}</span>
              <span className="text-xs text-sidebar-foreground/60">Organization Dashboard</span>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Organization</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      tooltip={item.title}
                      onClick={() => setActiveSection(item.id)}
                      isActive={activeSection === item.id}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <div className="flex items-center gap-2 rounded-md px-2 py-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src="" alt="User" />
              <AvatarFallback>ME</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 leading-tight group-data-[collapsible=icon]:hidden">
              <span className="text-sm font-medium">{brandName}</span>
              <span className="text-xs text-sidebar-foreground/60">Member</span>
            </div>
            <Button asChild size="icon" variant="ghost" className="group-data-[collapsible=icon]:hidden">
              <Link href="/">
                <Home className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4 md:px-6">
          <SidebarTrigger />
          <div className="hidden md:block">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>Org</BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{activeTitle}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="relative hidden md:block">
              <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="h-9 w-[240px] pl-8" placeholder="Search…" />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6">
          {renderContent()}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
