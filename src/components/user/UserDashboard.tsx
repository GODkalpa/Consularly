"use client"

import { useEffect, useMemo, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
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
  SidebarRail,
  SidebarInset,
} from "@/components/ui/sidebar"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import {
  Home,
  BarChart3,
  PlayCircle,
  BookOpen,
  Settings,
  Search,
  User,
  Trophy,
  Clock,
  Target,
} from "lucide-react"
import { UserInterviewSimulation } from "./UserInterviewSimulation"
import { db, firebaseEnabled } from "@/lib/firebase"
import { collection, onSnapshot, query, where, type DocumentData } from "firebase/firestore"

const menuItems = [
  { title: "Overview", icon: BarChart3, id: "overview" },
  { title: "Start Interview", icon: PlayCircle, id: "interview" },
  { title: "My Results", icon: Trophy, id: "results" },
  { title: "Learning Resources", icon: BookOpen, id: "resources" },
  { title: "Settings", icon: Settings, id: "settings" },
] as const

export function UserDashboard() {
  const { user, userProfile } = useAuth()
  const [activeSection, setActiveSection] = useState<(typeof menuItems)[number]["id"]>("overview")

  // User interviews state
  const [resultsLoading, setResultsLoading] = useState<boolean>(true)
  const [interviews, setInterviews] = useState<Array<{
    id: string
    status?: string
    score?: number
    route?: string
    startTime?: Date | null
    endTime?: Date | null
  }>>([])

  // Live subscribe to user's interviews
  useEffect(() => {
    if (!firebaseEnabled) {
      setResultsLoading(false)
      return
    }
    if (!user?.uid) return
    setResultsLoading(true)
    const q = query(collection(db, 'interviews'), where('userId', '==', user.uid))
    const unsub = onSnapshot(q, (snap) => {
      const rows = snap.docs.map((d) => {
        const data = d.data() as DocumentData
        const toDate = (v: any): Date | null => (v && typeof v.toDate === 'function') ? v.toDate() : (v instanceof Date ? v : null)
        return {
          id: d.id,
          status: data?.status,
          score: typeof data?.score === 'number' ? Math.round(data.score) : undefined,
          route: data?.route,
          startTime: toDate(data?.startTime),
          endTime: toDate(data?.endTime),
        }
      }).sort((a, b) => (b.startTime?.getTime() || 0) - (a.startTime?.getTime() || 0))
      setInterviews(rows)
      setResultsLoading(false)
    }, (err) => {
      // eslint-disable-next-line no-console
      console.error('[UserDashboard] Results subscription error', err)
      setResultsLoading(false)
    })
    return () => unsub()
  }, [user?.uid])

  const activeTitle = useMemo(
    () => menuItems.find((item) => item.id === activeSection)?.title || "Dashboard",
    [activeSection]
  )

  const userName = userProfile?.displayName || user?.email?.split('@')[0] || "User"
  const userInitials = userName.slice(0, 2).toUpperCase()

  const renderOverview = () => {
    const quotaLimit = (userProfile as any)?.quotaLimit ?? 0
    const quotaUsed = (userProfile as any)?.quotaUsed ?? 0
    const quotaRemaining = Math.max(0, quotaLimit - quotaUsed)
    const quotaPct = quotaLimit > 0 ? Math.min(100, (quotaUsed / quotaLimit) * 100) : 0

    return (
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">Welcome back, {userName}!</h2>
          <p className="text-blue-100">Practice your visa interview with AI-powered real-time feedback</p>
        </div>

        {/* Quota Card */}
        <Card>
          <CardHeader>
            <CardTitle>Interview Quota</CardTitle>
            <CardDescription>Your remaining interview sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold">{quotaRemaining}</div>
                  <p className="text-sm text-muted-foreground">Interviews Remaining</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-muted-foreground">{quotaUsed} / {quotaLimit}</div>
                  <p className="text-xs text-muted-foreground">Used</p>
                </div>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div 
                  className="h-full transition-all" 
                  style={{ 
                    width: `${Math.min(100, quotaPct)}%`, 
                    background: quotaPct >= 95 ? '#ef4444' : quotaPct >= 85 ? '#f59e0b' : '#3b82f6'
                  }} 
                />
              </div>
              {quotaLimit === 0 && (
                <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20">
                  <svg className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-destructive">No Quota Assigned</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Contact support to get interview quota assigned to your account.
                    </p>
                  </div>
                </div>
              )}
              {quotaLimit > 0 && quotaPct >= 95 && (
                <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20">
                  <svg className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-destructive">Quota Almost Exhausted</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      You have used {quotaPct.toFixed(0)}% of your quota. Contact support for more interviews.
                    </p>
                  </div>
                </div>
              )}
              {quotaLimit > 0 && quotaPct >= 85 && quotaPct < 95 && (
                <div className="flex items-start gap-2 p-3 rounded-md bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/50">
                  <svg className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-orange-900 dark:text-orange-200">Running Low on Quota</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      You have {quotaRemaining} interviews remaining. Consider contacting support for more.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                  <PlayCircle className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-sm text-muted-foreground">Total Interviews</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 text-green-600">
                  <Trophy className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-2xl font-bold">--</div>
                  <p className="text-sm text-muted-foreground">Avg Score</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-sm text-muted-foreground">Practice Hours</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-100 text-orange-600">
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get started with your visa interview practice</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              size="lg" 
              className="h-auto py-4 flex-col gap-2"
              onClick={() => setActiveSection("interview")}
            >
              <PlayCircle className="h-6 w-6" />
              <div>
                <div className="font-semibold">Start New Interview</div>
                <div className="text-xs opacity-80">Practice with AI interviewer</div>
              </div>
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="h-auto py-4 flex-col gap-2"
              onClick={() => setActiveSection("results")}
            >
              <Trophy className="h-6 w-6" />
              <div>
                <div className="font-semibold">View Results</div>
                <div className="text-xs opacity-80">Check your performance</div>
              </div>
            </Button>
          </CardContent>
        </Card>

        {/* Tips Section */}
        <Card>
          <CardHeader>
            <CardTitle>Interview Tips</CardTitle>
            <CardDescription>Key points to remember for your visa interview</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <div className="h-5 w-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold mt-0.5">1</div>
                <span>Speak clearly and confidently. Take your time to articulate your answers.</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="h-5 w-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold mt-0.5">2</div>
                <span>Maintain good eye contact with the camera. This shows confidence and honesty.</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="h-5 w-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold mt-0.5">3</div>
                <span>Have all your documents ready before starting the practice session.</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="h-5 w-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold mt-0.5">4</div>
                <span>Answer honestly and consistently. Avoid contradicting yourself.</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderResults = () => {
    if (resultsLoading) {
      return (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Interview History</CardTitle>
              <CardDescription>Your past interview sessions and scores</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <span className="animate-pulse">Loading results…</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    if (!interviews.length) {
      return (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Interview History</CardTitle>
              <CardDescription>Your past interview sessions and scores</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No interviews yet</p>
                <p className="text-sm mb-4">Start your first practice interview to see results here</p>
                <Button onClick={() => setActiveSection("interview")}
                >
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Start Interview
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Interview History</CardTitle>
            <CardDescription>Your past interview sessions and scores</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y rounded-md border">
              {interviews.map((iv) => (
                <div key={iv.id} className="flex items-center justify-between p-4 text-sm">
                  <div>
                    <div className="font-medium">
                      {iv.startTime ? iv.startTime.toLocaleString() : '—'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {iv.route || 'visa'} • {iv.status || 'scheduled'}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Score</div>
                      <div className="text-base font-semibold">{typeof iv.score === 'number' ? `${iv.score}/100` : '—'}</div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setActiveSection('interview')}>
                      Practice Again
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderResources = () => {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Learning Resources</CardTitle>
            <CardDescription>Helpful guides and tips for your visa interview preparation</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <BookOpen className="h-8 w-8 text-blue-600 mb-3" />
              <h3 className="font-semibold mb-2">Common F1 Visa Questions</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Review the most frequently asked questions in F1 visa interviews
              </p>
              <Button variant="link" className="p-0 h-auto">Learn more →</Button>
            </div>
            <div className="p-4 border rounded-lg">
              <BookOpen className="h-8 w-8 text-green-600 mb-3" />
              <h3 className="font-semibold mb-2">UK Student Visa Guide</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Everything you need to know about UK student visa interviews
              </p>
              <Button variant="link" className="p-0 h-auto">Learn more →</Button>
            </div>
            <div className="p-4 border rounded-lg">
              <BookOpen className="h-8 w-8 text-purple-600 mb-3" />
              <h3 className="font-semibold mb-2">Interview Best Practices</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Tips and techniques for a successful visa interview
              </p>
              <Button variant="link" className="p-0 h-auto">Learn more →</Button>
            </div>
            <div className="p-4 border rounded-lg">
              <BookOpen className="h-8 w-8 text-orange-600 mb-3" />
              <h3 className="font-semibold mb-2">Document Checklist</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Essential documents you need for your visa interview
              </p>
              <Button variant="link" className="p-0 h-auto">Learn more →</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderSettings = () => {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
            <CardDescription>Manage your account preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Email</span>
              <span className="text-sm text-muted-foreground">{user?.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Display Name</span>
              <span className="text-sm text-muted-foreground">{userName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Account Type</span>
              <span className="text-sm text-muted-foreground">Individual</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>Customize your interview experience</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Auto-save sessions</div>
                <div className="text-xs text-muted-foreground">Automatically save your progress</div>
              </div>
              <Button variant="outline" size="sm">Enabled</Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Email notifications</div>
                <div className="text-xs text-muted-foreground">Receive practice reminders</div>
              </div>
              <Button variant="outline" size="sm">Disabled</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderContent = () => {
    switch (activeSection) {
      case "overview":
        return renderOverview()
      case "interview":
        return <UserInterviewSimulation />
      case "results":
        return renderResults()
      case "resources":
        return renderResources()
      case "settings":
        return renderSettings()
      default:
        return renderOverview()
    }
  }

  return (
    <SidebarProvider>
      <Sidebar variant="inset" collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-3 rounded-md px-2 py-1.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-gradient-to-br from-blue-500 to-blue-700 text-white font-semibold">
              {userInitials}
            </div>
            <div className="grid leading-tight group-data-[collapsible=icon]:hidden">
              <span className="text-sm font-semibold">My Dashboard</span>
              <span className="text-xs text-sidebar-foreground/60">Visa Interview Practice</span>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Menu</SidebarGroupLabel>
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
              <AvatarImage src="" alt={userName} />
              <AvatarFallback>{userInitials}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 leading-tight group-data-[collapsible=icon]:hidden">
              <span className="text-sm font-medium">{userName}</span>
              <span className="text-xs text-sidebar-foreground/60">Personal Account</span>
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
                <BreadcrumbItem>Dashboard</BreadcrumbItem>
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
            <Button asChild variant="outline" size="sm">
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
