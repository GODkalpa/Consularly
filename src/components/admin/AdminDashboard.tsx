"use client"

import { useMemo, useState } from "react"
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
  Home
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

import { UserManagement } from "./UserManagement"
import { OrganizationManagement } from "./OrganizationManagement"
import { QuotaManagement } from "./QuotaManagement"
import { PlatformAnalytics } from "./PlatformAnalytics"
import { BillingManagement } from "./BillingManagement"
import { GlobalSettings } from "./GlobalSettings"
import { SupportCenter } from "./SupportCenter"
import { DashboardOverview } from "./DashboardOverview"
import { InterviewSimulation } from "./InterviewSimulation"

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
const groupedMenu: { label: string; ids: Array<(typeof menuItems)[number]["id"]> }[] = [
  { label: "Platform", ids: ["overview", "users", "organizations", "quotas"] },
  { label: "Insights", ids: ["analytics"] },
  { label: "Operations", ids: ["billing", "settings", "support", "interview"] },
]

const SUPPORT_BADGE_COUNT = 3

export function AdminDashboard() {
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
        return <UserManagement />
      case "organizations":
        return <OrganizationManagement />
      case "quotas":
        return <QuotaManagement />
      case "analytics":
        return <PlatformAnalytics />
      case "billing":
        return <BillingManagement />
      case "settings":
        return <GlobalSettings />
      case "support":
        return <SupportCenter />
      case "interview":
        return <InterviewSimulation />
      default:
        return <DashboardOverview />
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
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
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
            <Button size="icon" variant="ghost" className="group-data-[collapsible=icon]:hidden" onClick={() => setActiveSection("settings") }>
              <Settings className="h-4 w-4" />
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
            <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
              <Link href="/">
                <Home className="h-4 w-4 mr-2" />
                Back to website
              </Link>
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

        <main className="flex-1 overflow-auto p-4 md:p-6">
          {renderContent()}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
