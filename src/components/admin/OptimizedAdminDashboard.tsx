"use client"

import { useMemo, useState, lazy, Suspense } from "react"
import {
  Users,
  Building2,
  BarChart3,
  CreditCard,
  Settings,
  MessageSquare,
  TestTube,
  PieChart,
  Mic,
  Home,
  Loader2,
  DollarSign
} from "lucide-react"

import { Button } from "@/components/ui/button"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"

// ULTRA-AGGRESSIVE lazy loading - only load when section is active
const UserManagement = lazy(() => 
  import("./UserManagement").then(m => ({ default: m.UserManagement }))
)

const OrganizationManagement = lazy(() => 
  import("./OrganizationManagement").then(m => ({ default: m.OrganizationManagement }))
)

const QuotaManagement = lazy(() => 
  import("./QuotaManagement").then(m => ({ default: m.QuotaManagement }))
)

const PlatformAnalytics = lazy(() => 
  import("./PlatformAnalytics").then(m => ({ default: m.PlatformAnalytics }))
)

const BillingManagement = lazy(() => 
  import("./BillingManagement").then(m => ({ default: m.BillingManagement }))
)

const GlobalSettings = lazy(() => 
  import("./GlobalSettings").then(m => ({ default: m.GlobalSettings }))
)

const SupportCenter = lazy(() => 
  import("./SupportCenter").then(m => ({ default: m.SupportCenter }))
)

const AccountingDashboard = lazy(() => 
  import("../accounting/AccountingDashboard").then(m => ({ default: m.AccountingDashboard }))
)

// Lightweight overview without heavy dependencies
function OptimizedDashboardOverview() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,350</div>
            <p className="text-xs text-muted-foreground">+180 from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organizations</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45</div>
            <p className="text-xs text-muted-foreground">+5 new this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interviews</CardTitle>
            <Mic className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12,234</div>
            <p className="text-xs text-muted-foreground">+1,234 this week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94.2%</div>
            <p className="text-xs text-muted-foreground">+2.1% from last month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Platform Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Active Sessions</span>
                <span className="text-2xl font-bold">1,234</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Queue Length</span>
                <span className="text-2xl font-bold">0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Server Load</span>
                <span className="text-2xl font-bold text-green-600">12%</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full justify-start" variant="ghost">
              <Users className="mr-2 h-4 w-4" />
              View Users
            </Button>
            <Button className="w-full justify-start" variant="ghost">
              <Building2 className="mr-2 h-4 w-4" />
              Organizations
            </Button>
            <Button className="w-full justify-start" variant="ghost">
              <BarChart3 className="mr-2 h-4 w-4" />
              Analytics
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Lazy-loaded InterviewSimulation without ML dependencies by default
const InterviewSimulation = lazy(() => 
  import("./InterviewSimulation").then(m => ({ default: m.InterviewSimulation }))
)

// Minimal loading component
function ComponentLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        <p className="text-sm text-muted-foreground">Loading component...</p>
      </div>
    </div>
  )
}

const menuItems = [
  { title: "Overview", icon: BarChart3, id: "overview" },
  { title: "User Management", icon: Users, id: "users" },
  { title: "Organizations", icon: Building2, id: "organizations" },
  { title: "Quota Management", icon: TestTube, id: "quotas" },
  { title: "Analytics", icon: PieChart, id: "analytics" },
  { title: "Billing & Accounting", icon: DollarSign, id: "accounting" },
  { title: "Billing", icon: CreditCard, id: "billing" },
  { title: "Settings", icon: Settings, id: "settings" },
  { title: "Support", icon: MessageSquare, id: "support" },
  { title: "Interview Simulation", icon: Mic, id: "interview" }
]

const groupedMenu: { label: string; ids: Array<(typeof menuItems)[number]["id"]> }[] = [
  { label: "Platform", ids: ["overview", "users", "organizations", "quotas"] },
  { label: "Insights", ids: ["analytics"] },
  { label: "Operations", ids: ["accounting", "billing", "settings", "support", "interview"] },
]

const SUPPORT_BADGE_COUNT = 3

export function OptimizedAdminDashboard() {
  const [activeSection, setActiveSection] = useState("overview")

  const activeTitle = useMemo(
    () => menuItems.find((item) => item.id === activeSection)?.title || "Dashboard",
    [activeSection]
  )

  const renderContent = () => {
    switch (activeSection) {
      case "overview":
        return <OptimizedDashboardOverview />
      case "users":
        return (
          <Suspense fallback={<ComponentLoader />}>
            <UserManagement />
          </Suspense>
        )
      case "organizations":
        return (
          <Suspense fallback={<ComponentLoader />}>
            <OrganizationManagement />
          </Suspense>
        )
      case "quotas":
        return (
          <Suspense fallback={<ComponentLoader />}>
            <QuotaManagement />
          </Suspense>
        )
      case "analytics":
        return (
          <Suspense fallback={<ComponentLoader />}>
            <PlatformAnalytics />
          </Suspense>
        )
      case "accounting":
        return (
          <Suspense fallback={<ComponentLoader />}>
            <AccountingDashboard />
          </Suspense>
        )
      case "billing":
        return (
          <Suspense fallback={<ComponentLoader />}>
            <BillingManagement />
          </Suspense>
        )
      case "settings":
        return (
          <Suspense fallback={<ComponentLoader />}>
            <GlobalSettings />
          </Suspense>
        )
      case "support":
        return (
          <Suspense fallback={<ComponentLoader />}>
            <SupportCenter />
          </Suspense>
        )
      case "interview":
        return (
          <Suspense fallback={<ComponentLoader />}>
            <InterviewSimulation />
          </Suspense>
        )
      default:
        return <OptimizedDashboardOverview />
    }
  }

  return (
    <SidebarProvider>
      <Sidebar variant="inset" collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-3 rounded-md px-2 py-1.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground font-semibold">
              MI
            </div>
            <div className="grid leading-tight group-data-[collapsible=icon]:hidden">
              <span className="text-sm font-semibold">Admin Dashboard</span>
              <span className="text-xs text-sidebar-foreground/60">Mock Interview Platform</span>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          {groupedMenu.map((group) => (
            <SidebarGroup key={group.label} className="group-data-[collapsible=icon]:p-1.5">
              <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">{group.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.ids.map((id) => {
                    const item = menuItems.find((m) => m.id === id)!
                    return (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          tooltip={item.title}
                          onClick={() => setActiveSection(item.id)}
                          isActive={activeSection === item.id}
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </SidebarMenuButton>
                        {item.id === "support" && (
                          <SidebarMenuBadge className="bg-sidebar-primary/10 text-sidebar-foreground">
                            {SUPPORT_BADGE_COUNT}
                          </SidebarMenuBadge>
                        )}
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>

        <SidebarFooter>
          <div className="flex items-center gap-2 rounded-md px-2 py-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src="" alt="Admin" />
              <AvatarFallback>AD</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 leading-tight group-data-[collapsible=icon]:hidden">
              <span className="text-sm font-medium">Admin</span>
              <span className="text-xs text-sidebar-foreground/60">Owner</span>
            </div>
          </div>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4 md:px-6">
          <SidebarTrigger />
          <div className="ml-auto flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
              <Link href="/">
                <Home className="h-4 w-4 mr-2" />
                Back to website
              </Link>
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6">
          {renderContent()}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
