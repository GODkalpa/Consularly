"use client"

import { useState } from "react"
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
  UserCheck,
  AlertTriangle,
  TrendingUp,
  Mic
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"

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

export function AdminDashboard() {
  const [activeSection, setActiveSection] = useState("overview")

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
      <div className="flex h-screen w-full">
        <Sidebar className="border-r">
          <SidebarContent>
            <div className="p-6">
              <h2 className="text-lg font-semibold">Admin Dashboard</h2>
              <p className="text-sm text-muted-foreground">Mock Interview Platform</p>
            </div>
            <Separator />
            <SidebarGroup>
              <SidebarGroupLabel>Platform Management</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
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
        </Sidebar>
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="border-b bg-background px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <h1 className="text-2xl font-bold capitalize">
                  {menuItems.find(item => item.id === activeSection)?.title || "Dashboard"}
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Shield className="h-4 w-4 mr-2" />
                  Security
                </Button>
                <Button variant="outline" size="sm">
                  <UserCheck className="h-4 w-4 mr-2" />
                  Admin Profile
                </Button>
              </div>
            </div>
          </header>
          
          <main className="flex-1 overflow-auto p-6">
            {renderContent()}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
