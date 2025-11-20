"use client"

import { useMemo, useState, lazy, Suspense } from "react"
import {
  Users,
  Building2,
  BarChart3,
  CreditCard,
  Settings,
  MessageSquare,
  Shield,
  TestTube,
  PieChart,
  Mic,
  Search,
  Home,
  Loader2,
  LogOut,
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
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"

// Lazy load all admin components to improve initial load time
const UserManagement = lazy(() => import("./UserManagement").then(m => ({ default: m.UserManagement })))
const OrganizationManagement = lazy(() => import("./OrganizationManagement").then(m => ({ default: m.OrganizationManagement })))
const QuotaManagement = lazy(() => import("./QuotaManagement").then(m => ({ default: m.QuotaManagement })))
const PlatformAnalytics = lazy(() => import("./PlatformAnalytics").then(m => ({ default: m.PlatformAnalytics })))
const BillingManagement = lazy(() => import("./BillingManagement").then(m => ({ default: m.BillingManagement })))
const AccountingDashboard = lazy(() => import("../accounting/AccountingDashboard").then(m => ({ default: m.AccountingDashboard })))
const GlobalSettings = lazy(() => import("./GlobalSettings").then(m => ({ default: m.GlobalSettings })))
const SupportCenter = lazy(() => import("./SupportCenter").then(m => ({ default: m.SupportCenter })))
const DashboardOverview = lazy(() => import("./EnhancedDashboardOverview").then(m => ({ default: m.EnhancedDashboardOverview })))
const InterviewSimulation = lazy(() => import("./InterviewSimulation").then(m => ({ default: m.InterviewSimulation })))

// Loading fallback component
function ComponentLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}

const menuItems = [
  {
    title: "Overview",
    icon: BarChart3,
    id: "overview"
  },
  {
    title: "User Management",
    icon: Users,
    id: "users"
  },
  {
    title: "Organizations",
    icon: Building2,
    id: "organizations"
  },
  {
    title: "Quota Management",
    icon: TestTube,
    id: "quotas"
  },
  {
    title: "Analytics",
    icon: PieChart,
    id: "analytics"
  },
  {
    title: "Billing & Accounting",
    icon: DollarSign,
    id: "accounting"
  },
  {
    title: "Billing",
    icon: CreditCard,
    id: "billing"
  },
  {
    title: "Settings",
    icon: Settings,
    id: "settings"
  },
  {
    title: "Support",
    icon: MessageSquare,
    id: "support"
  },
  {
    title: "Interview Simulation",
    icon: Mic,
    id: "interview"
  }
]

// Lightweight grouping to organize the sidebar without overdoing it
const SUPPORT_BADGE_COUNT = 3

export function AdminDashboard() {
  const { logout } = useAuth()
  const [activeSection, setActiveSection] = useState("overview")

  const activeTitle = useMemo(
    () => menuItems.find((item) => item.id === activeSection)?.title || "Dashboard",
    [activeSection]
  )

  const renderContent = () => {
    switch (activeSection) {
      case "overview":
        return <DashboardOverview />
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
        return <DashboardOverview />
    }
  }

  return (
    <SidebarProvider>
      <Sidebar variant="inset" collapsible="icon" className="border-r bg-background">
        <SidebarHeader className="border-b px-4 py-5">
          <div className="flex items-center gap-3">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 shadow-sm border border-primary/20 shrink-0">
              <span className="font-bold text-lg text-primary">
                MI
              </span>
            </div>
            <div className="flex flex-col group-data-[collapsible=icon]:hidden">
              <span className="text-base font-semibold leading-none mb-1">Admin Dashboard</span>
              <span className="text-xs text-muted-foreground">Admin Control Panel</span>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent className="px-3 py-4">
          <SidebarGroup>
            <SidebarGroupLabel className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Navigation
            </SidebarGroupLabel>
            <SidebarGroupContent className="mt-2">
              <SidebarMenu className="space-y-1">
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      tooltip={item.title}
                      onClick={() => setActiveSection(item.id)}
                      isActive={activeSection === item.id}
                      className={`
                        h-11 px-3 rounded-lg transition-all duration-200
                        ${activeSection === item.id 
                          ? 'bg-primary text-primary-foreground shadow-md hover:bg-primary/90' 
                          : 'hover:bg-muted/80 hover:shadow-sm'
                        }
                      `}
                    >
                      <item.icon className={`h-5 w-5 ${activeSection === item.id ? '' : 'text-muted-foreground'}`} />
                      <span className="font-medium">{item.title}</span>
                    </SidebarMenuButton>
                    {item.id === "support" && (
                      <SidebarMenuBadge className="bg-sidebar-primary/10 text-sidebar-foreground">
                        {SUPPORT_BADGE_COUNT}
                      </SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t px-4 py-4">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-muted/50 transition-colors">
            <Avatar className="h-10 w-10 border-2 border-primary/20">
              <AvatarImage src="" alt="Admin" />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-sm font-semibold">
                AD
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
              <p className="text-sm font-medium truncate">Admin</p>
              <p className="text-xs text-muted-foreground truncate">Administrator</p>
            </div>
            <Button 
              onClick={logout}
              size="icon" 
              variant="ghost" 
              className="h-9 w-9 rounded-md group-data-[collapsible=icon]:hidden hover:bg-primary/10"
            >
              <LogOut className="h-4 w-4" />
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
                <BreadcrumbItem>Admin</BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{activeTitle}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/?from=dashboard">
              <Button variant="outline" size="sm" className="hidden sm:inline-flex">
                <Home className="h-4 w-4 mr-2" />
                Back to Website
              </Button>
            </Link>
            <Button onClick={logout} variant="outline" size="sm" className="hidden sm:inline-flex">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
            <div className="relative hidden md:block">
              <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="h-9 w-[240px] pl-8" placeholder="Search…" />
            </div>

            <Button variant="outline" size="sm" className="hidden sm:inline-flex">
              <Shield className="h-4 w-4 mr-2" />
              Security
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="" alt="Admin" />
                    <AvatarFallback>AD</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setActiveSection("settings")}>Settings</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveSection("support")}>Support</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6 md:p-8">
          {renderContent()}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
