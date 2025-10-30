"use client"

import { useEffect, useMemo, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { auth, firebaseEnabled } from "@/lib/firebase"
import type { OrganizationWithId } from "@/types/firestore"

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
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import {
  Home,
  BarChart3,
  Users,
  Settings,
  Building2,
  Search,
  Trophy,
  PlayCircle,
  TrendingUp,
  Calendar,
  CheckCircle,
  Clock,
  ArrowRight,
  Activity,
  Zap,
  Target,
  Award,
} from "lucide-react"
import { OrgStudentManagement } from "@/components/org/OrgStudentManagement"
import { OrgInterviewSimulation } from "@/components/org/OrgInterviewSimulation"
import { OrgStudentResults } from "@/components/org/OrgStudentResults"
import { OrgBrandingSettings } from "@/components/org/OrgBrandingSettings"

const menuItems = [
  { title: "Overview", icon: BarChart3, id: "overview" },
  { title: "Students", icon: Users, id: "students" },
  { title: "Interviews", icon: PlayCircle, id: "interviews" },
  { title: "Results", icon: Trophy, id: "results" },
  { title: "Organization", icon: Building2, id: "organization" },
  { title: "Branding", icon: Settings, id: "branding" },
] as const

export function OrganizationDashboard() {
  const { userProfile } = useAuth()
  const orgId: string | undefined = userProfile?.orgId

  const [activeSection, setActiveSection] = useState<(typeof menuItems)[number]["id"]>("overview")
  const [org, setOrg] = useState<OrganizationWithId | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedStudentId, setSelectedStudentId] = useState<string | undefined>(undefined)
  const [selectedStudentName, setSelectedStudentName] = useState<string | undefined>(undefined)
  const [statistics, setStatistics] = useState<{
    totalStudents: number;
    totalInterviews: number;
    avgScore: number;
    activeUsers: number;
    recentInterviews: Array<{
      id: string;
      candidateName: string;
      date: string;
      score: number;
      status: string;
    }>;
  } | null>(null)

  // Extract branding with fallbacks
  const branding = org?.settings?.customBranding || {}
  const brandColor = branding.primaryColor || "hsl(var(--primary))"
  const brandSecondaryColor = branding.secondaryColor || "hsl(var(--secondary))"
  const brandLogo = branding.logoUrl
  const brandName = branding.companyName || org?.name || "Organization"
  const brandTagline = branding.tagline
  const brandWelcome = branding.welcomeMessage
  const brandBackground = branding.backgroundImage
  const brandFontFamily = branding.fontFamily || 'inter'

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

        // Fetch organization data and statistics in parallel
        const [orgRes, statsRes] = await Promise.all([
          fetch('/api/org/organization', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/org/statistics', { headers: { Authorization: `Bearer ${token}` } }),
        ])

        const orgJson = await orgRes.json()
        if (!orgRes.ok) throw new Error(orgJson?.error || `Organization fetch failed (${orgRes.status})`)
        const orgDoc = orgJson.organization as OrganizationWithId

        const statsJson = await statsRes.json()
        if (statsRes.ok && statsJson.statistics) {
          if (!mounted) return
          setStatistics(statsJson.statistics)
        }

        if (!mounted) return
        setOrg(orgDoc)
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

    // Use real statistics from API
    const stats = statistics || {
      totalStudents: 0,
      totalInterviews: 0,
      avgScore: 0,
      activeUsers: 0,
      recentInterviews: [],
    }

    return (
      <div className="space-y-6">
        {/* Enhanced Branding Hero */}
        <div
          className="rounded-2xl p-8 md:p-10 text-primary-foreground relative overflow-hidden shadow-xl"
          style={{ 
            background: brandBackground 
              ? `linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.5) 100%), url(${brandBackground})`
              : `linear-gradient(135deg, ${brandColor} 0%, ${brandSecondaryColor || brandColor} 100%)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24" />
          
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-start gap-6">
                <div className="h-20 w-20 rounded-2xl bg-white flex items-center justify-center overflow-hidden shadow-2xl shrink-0 ring-4 ring-white/20">
                  {brandLogo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={brandLogo} 
                      alt={brandName} 
                      className="max-h-16 max-w-[72px] object-contain p-2"
                      style={{ imageRendering: 'auto' }}
                    />
                  ) : (
                    <span className="font-bold text-2xl text-gray-700">{brandName?.slice(0,2).toUpperCase()}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-3xl md:text-4xl font-bold mb-2">{brandName}</h2>
                  {brandTagline && (
                    <p className="text-primary-foreground/90 text-base mb-2">{brandTagline}</p>
                  )}
                  {brandWelcome ? (
                    <p className="text-primary-foreground/80 text-sm max-w-2xl leading-relaxed">{brandWelcome}</p>
                  ) : (
                    <p className="text-primary-foreground/80 text-sm leading-relaxed">
                      Welcome back! Manage your visa interview simulations and track student performance.
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => setActiveSection('interviews')}
                  className="bg-white text-gray-900 hover:bg-white/90 shadow-lg"
                >
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Start Interview
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4 hover:shadow-lg transition-shadow" style={{ borderLeftColor: brandColor }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Students</p>
                  <p className="text-3xl font-bold">{stats.totalStudents}</p>
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    Active learners
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl flex items-center justify-center" style={{ background: `${brandColor}20` }}>
                  <Users className="h-6 w-6" style={{ color: brandColor }} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Interviews Conducted</p>
                  <p className="text-3xl font-bold">{stats.totalInterviews}</p>
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-green-600" />
                    This month
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center">
                  <PlayCircle className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Avg Success Score</p>
                  <p className="text-3xl font-bold">{stats.avgScore > 0 ? `${stats.avgScore}%` : '—'}</p>
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    Overall performance
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-green-50 flex items-center justify-center">
                  <Award className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Quota Remaining</p>
                  <p className="text-3xl font-bold">{quotaLimit - quotaUsed}</p>
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    of {quotaLimit} total
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-purple-50 flex items-center justify-center">
                  <Activity className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quota Usage - Enhanced */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Quota Usage
                  </CardTitle>
                  <CardDescription>Monthly interview quota utilization</CardDescription>
                </div>
                <Badge variant="outline" className="capitalize">{org?.plan || 'Basic'}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold" style={{ color: brandColor }}>
                      {quotaUsed} <span className="text-lg text-muted-foreground font-normal">/ {quotaLimit}</span>
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">Interviews completed</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{quotaPct.toFixed(0)}%</p>
                    <p className="text-xs text-muted-foreground mt-1">Used</p>
                  </div>
                </div>
                <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                  <div 
                    className="h-full transition-all duration-500 ease-out rounded-full" 
                    style={{ 
                      width: `${Math.min(100, quotaPct)}%`, 
                      background: quotaPct >= 95 
                        ? 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)' 
                        : quotaPct >= 85 
                        ? 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)'
                        : `linear-gradient(90deg, ${brandColor} 0%, ${brandSecondaryColor || brandColor} 100%)`
                    }} 
                  />
                </div>
              </div>

              {quotaPct >= 95 && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
                  <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                    <Clock className="h-5 w-5 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-red-900">Quota Limit Reached</p>
                    <p className="text-xs text-red-700 mt-1">
                      You&apos;ve used {quotaPct.toFixed(0)}% of your monthly quota. Upgrade your plan or contact support to continue.
                    </p>
                    <Button size="sm" variant="destructive" className="mt-3">
                      Upgrade Plan
                    </Button>
                  </div>
                </div>
              )}

              {quotaPct >= 75 && quotaPct < 95 && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-orange-50 border border-orange-200">
                  <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                    <TrendingUp className="h-5 w-5 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-orange-900">Approaching Quota Limit</p>
                    <p className="text-xs text-orange-700 mt-1">
                      You&apos;ve used {quotaPct.toFixed(0)}% of your monthly quota. Consider upgrading for unlimited access.
                    </p>
                  </div>
                </div>
              )}

              {quotaPct < 50 && quotaLimit > 0 && (
                <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-green-900">You&apos;re all set!</p>
                      <p className="text-xs text-green-700">Plenty of quota remaining this month</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Quick Actions
              </CardTitle>
              <CardDescription>Common tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-between hover:bg-accent"
                onClick={() => setActiveSection('students')}
              >
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Manage Students
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-between hover:bg-accent"
                onClick={() => setActiveSection('interviews')}
              >
                <span className="flex items-center gap-2">
                  <PlayCircle className="h-4 w-4" />
                  New Interview
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-between hover:bg-accent"
                onClick={() => setActiveSection('results')}
              >
                <span className="flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  View Results
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-between hover:bg-accent"
                onClick={() => setActiveSection('branding')}
              >
                <span className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Customize Branding
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Latest interviews and updates</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setActiveSection('results')}>
                View All
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {stats.recentInterviews && stats.recentInterviews.length > 0 ? (
              <div className="space-y-3">
                {stats.recentInterviews.map((interview) => (
                  <div
                    key={interview.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {interview.candidateName.slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{interview.candidateName}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(interview.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {interview.score > 0 && (
                        <Badge variant={interview.score >= 70 ? 'default' : 'secondary'}>
                          {interview.score}%
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveSection('results')}
                      >
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="h-16 w-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                  <Activity className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-muted-foreground mb-2">No recent activity</p>
                <p className="text-xs text-muted-foreground mb-4">Get started by conducting your first interview</p>
                <Button onClick={() => setActiveSection('interviews')} style={{ background: brandColor }}>
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Start First Interview
                </Button>
              </div>
            )}
          </CardContent>
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

  const renderResults = () => {
    return <OrgStudentResults />
  }

  const renderOrganization = () => {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Organization Overview</CardTitle>
            <CardDescription>Your organization details and subscription</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Company Identity</h3>
                  <div className="flex items-center gap-3">
                    <div className="h-14 w-14 rounded-lg bg-white border shadow-sm overflow-hidden flex items-center justify-center shrink-0">
                      {brandLogo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img 
                          src={brandLogo} 
                          alt={brandName} 
                          className="max-h-12 max-w-[52px] object-contain p-1.5"
                          style={{ imageRendering: 'auto' }}
                        />
                      ) : (
                        <span className="font-semibold text-lg" style={{ color: brandColor }}>
                          {brandName.slice(0,2).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{brandName}</div>
                      {brandTagline && <div className="text-sm text-muted-foreground truncate">{brandTagline}</div>}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Brand Colors</h3>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full border" style={{ background: brandColor }} />
                    <span className="text-sm">{brandColor}</span>
                  </div>
                  {brandSecondaryColor && (
                    <div className="flex items-center gap-3 mt-2">
                      <div className="h-8 w-8 rounded-full border" style={{ background: brandSecondaryColor }} />
                      <span className="text-sm">{brandSecondaryColor}</span>
                    </div>
                  )}
                </div>

                {branding.socialLinks && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Social Links</h3>
                    <div className="space-y-1">
                      {branding.socialLinks.website && (
                        <a href={branding.socialLinks.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline block">
                          🌐 {branding.socialLinks.website}
                        </a>
                      )}
                      {branding.socialLinks.linkedin && (
                        <a href={branding.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline block">
                          💼 LinkedIn
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Subscription Plan</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Plan</span>
                      <Badge className="capitalize">{org?.plan ?? '-'}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Monthly Quota</span>
                      <span className="font-medium">{org?.quotaLimit ?? 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Used This Month</span>
                      <span className="font-medium">{org?.quotaUsed ?? 0}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Settings</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Self Registration</span>
                      <span className="text-sm">{org?.settings?.allowSelfRegistration ? 'Enabled' : 'Disabled'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Metrics Collection</span>
                      <span className="text-sm">{org?.settings?.enableMetricsCollection ? 'Enabled' : 'Disabled'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Interview Duration</span>
                      <span className="text-sm">{org?.settings?.defaultInterviewDuration ?? 30} min</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground pt-4 border-t">
              To customize your branding, visit the <button onClick={() => setActiveSection('branding')} className="text-primary hover:underline">Branding</button> section.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderBranding = () => {
    return (
      <OrgBrandingSettings 
        organizationPlan={org?.plan || 'basic'}
        initialBranding={org?.settings?.customBranding}
      />
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
      case "results":
        return renderResults()
      case "organization":
        return renderOrganization()
      case "branding":
        return renderBranding()
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
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm border shrink-0">
              {brandLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={brandLogo} 
                  alt={brandName} 
                  className="max-h-8 max-w-[36px] object-contain p-1"
                  style={{ imageRendering: 'auto' }}
                />
              ) : (
                <span className="font-bold text-sm" style={{ color: brandColor }}>
                  {brandName.slice(0,2).toUpperCase()}
                </span>
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
