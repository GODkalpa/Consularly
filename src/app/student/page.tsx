"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useStudentAuth } from "@/contexts/StudentAuthContext"
import { StudentAuthGuard } from "@/components/student/StudentAuthGuard"

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
  SidebarInset,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StudentInterviewSimulation } from "@/components/student/StudentInterviewSimulation"
import { StudentResults } from "@/components/student/StudentResults"
import {
  BarChart3,
  Trophy,
  User,
  Play,
  CheckCircle,
  Calendar,
  LogOut,
  Home,
} from "lucide-react"
import Link from "next/link"

interface InterviewStats {
  total: number
  completed: number
  averageScore: number
  highestScore: number
  improvement: number
}

interface RecentInterview {
  id: string
  status: string
  score: number | null
  route: string | null
  startTime: string
}

const menuItems = [
  { title: "Overview", icon: BarChart3, id: "overview" },
  { title: "My Interviews", icon: Trophy, id: "interviews" },
  { title: "Results", icon: CheckCircle, id: "results" },
  { title: "Profile", icon: User, id: "profile" },
] as const

// Sparkline component matching org dashboard
const Sparkline = ({ data, trend }: { data: number[], trend: string }) => {
  const isPositive = trend.startsWith('+')
  const color = isPositive ? '#10b981' : '#ef4444'
  
  if (!data || data.length === 0) {
    data = [10, 12, 8, 15, 14, 18, 16] // fallback
  }
  
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 80
    const y = 24 - ((value - min) / range) * 20 + 4
    return `${x},${y}`
  }).join(' ')
  
  return (
    <svg width="80" height="32" viewBox="0 0 80 32" fill="none" className="mt-2">
      <polyline
        points={points}
        stroke={color}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function StudentDashboard() {
  const { student, signOutStudent } = useStudentAuth()
  const router = useRouter()
  const [activeSection, setActiveSection] = useState<(typeof menuItems)[number]["id"]>("overview")
  const [interviews, setInterviews] = useState<RecentInterview[]>([])
  const [stats, setStats] = useState<InterviewStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (student) {
      fetchInterviews()
    }
  }, [student])

  const fetchInterviews = async () => {
    try {
      const user = (await import('@/lib/firebase')).auth.currentUser
      if (!user) return

      const token = await user.getIdToken()
      const response = await fetch('/api/student/interviews', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setInterviews(data.interviews.slice(0, 3))
        setStats(data.statistics)
      }
    } catch (err) {
      console.error('Failed to fetch interviews:', err)
    } finally {
      setLoading(false)
    }
  }

  const startNewInterview = () => {
    // Navigate to interviews section
    setActiveSection('interviews')
  }

  const startQuickInterview = async () => {
    if (!student || student.creditsRemaining <= 0) return

    try {
      const user = (await import('@/lib/firebase')).auth.currentUser
      if (!user) return

      const token = await user.getIdToken()
      const route = student.interviewCountry ? `${student.interviewCountry}_student` : 'usa_f1'
      const response = await fetch('/api/student/interviews', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ route })
      })

      if (response.ok) {
        const data = await response.json()
        
        // Store interview initialization data for InterviewRunner
        const initData = {
          id: data.interview.id,
          studentName: student.name,
          route,
          startTime: new Date(),
          currentQuestionIndex: 0,
          questions: [], // Will be loaded by InterviewRunner
          responses: [],
          status: 'preparing' as const
        }
        
        localStorage.setItem(`interview:init:${data.interview.id}`, JSON.stringify(initData))
        
        // Open interview in new tab
        window.open(`/interview/${data.interview.id}`, '_blank')
        fetchInterviews()
      } else {
        const errorData = await response.json()
        alert(errorData.message || 'Failed to start interview')
      }
    } catch (err) {
      console.error('Failed to start interview:', err)
      alert('Failed to start interview. Please try again.')
    }
  }

  const getRouteDisplay = (route: string | null) => {
    switch (route) {
      case 'usa_f1': return 'USA F1 Visa'
      case 'uk_student': return 'UK Student Visa'
      case 'france_ema': return 'France EMA'
      case 'france_icn': return 'France ICN'
      default: return 'Interview'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (!student) return null

  // Extract branding with fallbacks
  const branding = student.organization?.branding || {}
  const brandColor = branding.primaryColor || "#3B82F6"
  const brandLogo = branding.logoUrl
  const brandName = branding.companyName || student.organization?.name || "Organization"
  const brandTagline = "Student Portal"

  const renderOverview = () => {
    const defaultStats = {
      total: 0,
      completed: 0,
      averageScore: 0,
      highestScore: 0,
      improvement: 0
    }
    const currentStats = stats || defaultStats

    // Calculate trend percentages
    const totalTrend = currentStats.total > 0 ? "+5%" : "0%"
    const completedTrend = currentStats.total > 0 ? `${Math.round((currentStats.completed / currentStats.total) * 100)}%` : "0%"
    const scoreTrend = currentStats.improvement >= 0 ? `+${currentStats.improvement}` : `${currentStats.improvement}`
    const bestTrend = "+3%"

    return (
      <div className="space-y-6">
        {/* Company Branding Header */}
        <div className="flex items-center gap-4">
          {brandLogo && (
            <div className="relative h-16 w-16 flex items-center justify-center overflow-hidden shrink-0">
              <Image src={brandLogo} alt={brandName} fill sizes="64px" className="object-contain" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold">{brandName}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {brandTagline}
            </p>
          </div>
        </div>

        {/* Stats Cards with Sparklines */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Interviews */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Total Interviews</p>
                <span className="text-sm text-green-600 font-medium">{totalTrend}</span>
              </div>
              <div className="text-3xl font-bold mt-2">{currentStats.total}</div>
              <Sparkline 
                data={currentStats.total > 0 ? [
                  currentStats.total * 0.7, currentStats.total * 0.75, currentStats.total * 0.8, 
                  currentStats.total * 0.85, currentStats.total * 0.9, currentStats.total * 0.95, currentStats.total
                ] : [0, 0, 0, 0, 0, 0, 1]} 
                trend={totalTrend} 
              />
            </CardContent>
          </Card>

          {/* Completed */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Completed</p>
                <span className="text-sm text-green-600 font-medium">{completedTrend}</span>
              </div>
              <div className="text-3xl font-bold mt-2">{currentStats.completed}</div>
              <Sparkline 
                data={currentStats.completed > 0 ? [
                  currentStats.completed * 0.6, currentStats.completed * 0.7, currentStats.completed * 0.75, 
                  currentStats.completed * 0.8, currentStats.completed * 0.9, currentStats.completed * 0.95, currentStats.completed
                ] : [0, 0, 0, 0, 0, 0, 0]} 
                trend={completedTrend} 
              />
            </CardContent>
          </Card>

          {/* Average Score */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Average Score</p>
                <span className={`text-sm font-medium ${currentStats.improvement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {scoreTrend}
                </span>
              </div>
              <div className="text-3xl font-bold mt-2">
                {currentStats.averageScore > 0 ? `${currentStats.averageScore}` : '—'}
              </div>
              <Sparkline 
                data={currentStats.averageScore > 0 ? [
                  currentStats.averageScore * 0.9, currentStats.averageScore * 0.95, currentStats.averageScore * 0.85, 
                  currentStats.averageScore * 0.92, currentStats.averageScore * 0.98, currentStats.averageScore * 0.96, currentStats.averageScore
                ] : [70, 75, 72, 78, 80, 81, 82]} 
                trend={scoreTrend} 
              />
            </CardContent>
          </Card>

          {/* Best Score */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Best Score</p>
                <span className="text-sm text-green-600 font-medium">{bestTrend}</span>
              </div>
              <div className="text-3xl font-bold mt-2">{currentStats.highestScore}%</div>
              <Sparkline 
                data={currentStats.highestScore > 0 ? [
                  currentStats.highestScore * 0.88, currentStats.highestScore * 0.90, currentStats.highestScore * 0.92, 
                  currentStats.highestScore * 0.94, currentStats.highestScore * 0.96, currentStats.highestScore * 0.98, currentStats.highestScore
                ] : [88, 90, 92, 94, 96, 98, 100]} 
                trend={bestTrend} 
              />
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Quick Actions and Recent Activity */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {/* Practice Section - Primary Color */}
                <div className="rounded-xl p-6 space-y-3" style={{ backgroundColor: `${brandColor}15` }}>
                  <p className="text-sm font-semibold" style={{ color: brandColor }}>Practice</p>
                  <div className="space-y-3">
                    {/* Primary Interview Button */}
                    <button
                      onClick={startNewInterview}
                      disabled={student.creditsRemaining <= 0}
                      className="w-full flex items-center justify-center gap-2 p-3 bg-background rounded-lg hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      <Play className="h-4 w-4" style={{ color: brandColor }} />
                      Start New Interview
                    </button>
                    
                    {/* Secondary Actions */}
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={startQuickInterview}
                        disabled={student.creditsRemaining <= 0}
                        className="flex flex-col items-center justify-center p-3 bg-background rounded-lg hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                      >
                        <Play className="h-4 w-4 mb-1" style={{ color: brandColor }} />
                        <span>Quick Start</span>
                      </button>
                      <button
                        onClick={() => setActiveSection('interviews')}
                        className="flex flex-col items-center justify-center p-3 bg-background rounded-lg hover:bg-muted transition-colors text-xs"
                      >
                        <BarChart3 className="h-4 w-4 mb-1" style={{ color: brandColor }} />
                        <span>View Results</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Account Section - Accent Color */}
                <div className="rounded-xl p-6 space-y-3 bg-orange-50">
                  <p className="text-sm font-semibold text-orange-700">Account</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setActiveSection('profile')}
                      className="flex flex-col items-center justify-center p-4 bg-background rounded-lg hover:bg-muted transition-colors"
                    >
                      <User className="h-5 w-5 mb-2 text-orange-700" />
                      <span className="text-sm font-medium">Profile</span>
                    </button>
                    <div className="flex flex-col items-center justify-center p-4 bg-background rounded-lg">
                      <Calendar className="h-5 w-5 mb-2 text-orange-700" />
                      <span className="text-sm font-medium">{student.creditsRemaining} Credits</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {interviews && interviews.length > 0 ? (
                  <div className="space-y-4">
                    {interviews.slice(0, 3).map((interview) => (
                      <div key={interview.id} className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">
                            {student.name} completed a simulation.
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Scored {interview.score || 0}/10 on &quot;{getRouteDisplay(interview.route)}&quot;
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {formatDate(interview.startTime)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <Trophy className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-600">No activity yet</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Start your first interview to see activity
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Quota Usage */}
          <div>
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Credit Usage</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center text-center">
                <div className="relative w-32 h-32 mb-6">
                  <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 128 128">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="none"
                      className="text-muted"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke={brandColor}
                      strokeWidth="12"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 56}`}
                      strokeDashoffset={`${2 * Math.PI * 56 * (1 - (student.creditsUsed || 0) / Math.max(student.creditsAllocated || 1, 1))}`}
                      className="transition-all duration-300 ease-in-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-4xl font-bold">{student.creditsRemaining}</div>
                    <div className="text-sm text-muted-foreground">Credits Left</div>
                  </div>
                </div>

                {/* Usage Details */}
                <div className="w-full space-y-3">
                  <p className="text-sm text-center text-muted-foreground">
                    You have <span className="font-semibold">{student.creditsRemaining}</span> of{' '}
                    <span className="font-semibold">{student.creditsAllocated}</span> credits remaining.
                  </p>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: brandColor }} />
                        <span>Used</span>
                      </div>
                      <span className="font-medium">{student.creditsUsed}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-green-500" />
                        <span>Remaining</span>
                      </div>
                      <span className="font-medium">{student.creditsRemaining}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <StudentAuthGuard>
      <SidebarProvider>
        <Sidebar variant="inset" collapsible="icon" className="border-r bg-background">
          <SidebarHeader className="border-b px-4 py-5">
            <div className="flex items-center gap-3">
              <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 shadow-sm border border-primary/20 shrink-0">
                {brandLogo ? (
                  <Image src={brandLogo} alt={brandName} fill sizes="48px" className="object-contain" />
                ) : (
                  <span className="font-bold text-lg" style={{ color: brandColor }}>
                    {brandName.slice(0,2).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                <span className="text-base font-semibold leading-none mb-1">{brandName}</span>
                <span className="text-xs text-muted-foreground">Student Portal</span>
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
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t px-4 py-4">
            <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-muted/50 transition-colors">
              <Avatar className="h-10 w-10 border-2 border-primary/20">
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-sm font-semibold">
                  {student?.name?.slice(0, 2).toUpperCase() || 'ST'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                <p className="text-sm font-medium truncate">{student?.name || 'Student'}</p>
                <p className="text-xs text-muted-foreground truncate">{student?.email || 'Student Account'}</p>
              </div>
              <Button 
                onClick={signOutStudent}
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
            <div className="ml-auto flex items-center gap-2">
              <Link href="/?from=dashboard">
                <Button variant="outline" size="sm">
                  <Home className="h-4 w-4 mr-2" />
                  Back to Website
                </Button>
              </Link>
              <Button onClick={signOutStudent} variant="outline" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6 md:p-8">
              {activeSection === "overview" && renderOverview()}
              {activeSection === "interviews" && (
                <StudentInterviewSimulation />
              )}
              {activeSection === "results" && (
                <StudentResults />
              )}
              {activeSection === "profile" && (
                <div className="space-y-6">
                  <h1 className="text-2xl font-bold">Profile</h1>
                  <Card>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium">Name</label>
                          <p className="text-sm text-muted-foreground">{student.name}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Email</label>
                          <p className="text-sm text-muted-foreground">{student.email}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Organization</label>
                          <p className="text-sm text-muted-foreground">{brandName}</p>
                        </div>
                        <Button onClick={signOutStudent} variant="outline">
                          Sign Out
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </StudentAuthGuard>
  )
}
