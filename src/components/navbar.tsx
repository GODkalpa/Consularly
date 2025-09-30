"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"
import { 
  Menu, 
  X, 
  ChevronDown,
  Play,
  BookOpen,
  Users,
  Phone,
  Star,
  LogOut,
  User,
  LayoutDashboard
} from "lucide-react"

const navigationItems = [
  {
    name: "Features",
    href: "#features",
    description: "Explore our AI-powered features"
  },
  {
    name: "How it Works",
    href: "#how-it-works",
    description: "Step-by-step process"
  },
  {
    name: "Success Stories",
    href: "#testimonials",
    description: "Student testimonials"
  },
  {
    name: "Pricing",
    href: "#pricing",
    description: "Affordable packages"
  }
]

const resourceItems = [
  {
    name: "Help Center",
    href: "#help",
    icon: BookOpen,
    description: "Get help and support"
  },
  {
    name: "Demo Video",
    href: "#demo",
    icon: Play,
    description: "Watch how it works"
  },
  {
    name: "Community",
    href: "#community",
    icon: Users,
    description: "Join student community"
  },
  {
    name: "Contact",
    href: "#contact",
    icon: Phone,
    description: "Get in touch"
  }
]

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [resourcesOpen, setResourcesOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const { user, logout, isAdmin, userProfile } = useAuth()

  // Log on every render
  console.log('🔄 NAVBAR RENDER:', { 
    user: user?.email, 
    isAdmin, 
    userProfile: userProfile?.role,
    hasOrgId: !!(userProfile as any)?.orgId
  })

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setResourcesOpen(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleSignOut = async () => {
    try {
      await logout()
      setUserMenuOpen(false)
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }


  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50 shadow-sm">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="relative w-20 h-20">
              <Image
                src="/logo.png"
                alt="Consularly Logo"
                fill
                sizes="80px"
                className="object-contain"
                priority
              />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-muted-foreground hover:text-primary font-medium transition-colors relative group"
              >
                {item.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300"></span>
              </Link>
            ))}
            
            {/* Resources Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setResourcesOpen(!resourcesOpen)}
                className="flex items-center gap-1 text-muted-foreground hover:text-primary font-medium transition-colors"
              >
                Resources
                <ChevronDown className={`w-4 h-4 transition-transform ${resourcesOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {resourcesOpen && (
                <div className="absolute top-full right-0 mt-2 w-72 bg-popover rounded-lg shadow-xl border border-border py-2">
                  {resourceItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-muted transition-colors"
                      onClick={() => setResourcesOpen(false)}
                    >
                      <item.icon className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <div className="font-medium text-foreground">{item.name}</div>
                        <div className="text-sm text-muted-foreground">{item.description}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Desktop CTA Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            {isAdmin && (
              <Link href="/admin">
                <Button variant="outline" className="gap-2">
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Button>
              </Link>
            )}
            {!isAdmin && user && userProfile?.orgId && (
              <Link href="/org">
                <Button variant="outline" className="gap-2">
                  <LayoutDashboard className="w-4 h-4" />
                  Org Dashboard
                </Button>
              </Link>
            )}
            {(() => {
              const shouldShow = !isAdmin && !!user && !!userProfile && !(userProfile as any).orgId;
              console.log('🎯 Dashboard button check:', { 
                isAdmin, 
                hasUser: !!user, 
                hasUserProfile: !!userProfile,
                userProfileRole: userProfile?.role,
                hasOrgId: !!(userProfile as any)?.orgId,
                shouldShow 
              });
              return shouldShow && (
                <Link href="/dashboard">
                  <Button variant="outline" className="gap-2">
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Button>
                </Link>
              );
            })()}
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <span className="text-foreground font-medium">{user.displayName || user.email}</span>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {userMenuOpen && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-popover rounded-lg shadow-xl border border-border py-2">
                    <div className="px-4 py-2 border-b border-border/60">
                      <p className="text-sm font-medium text-foreground">{user.displayName}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-2 w-full px-4 py-2 text-left text-foreground hover:bg-muted transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/signin">
                  <Button 
                    variant="ghost" 
                    className="text-foreground hover:text-primary"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button 
                    className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all"
                  >
                    Start Free Trial
                    <Star className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
          >
            {isOpen ? (
              <X className="w-6 h-6 text-muted-foreground" />
            ) : (
              <Menu className="w-6 h-6 text-muted-foreground" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="lg:hidden bg-background border-t border-border">
          <div className="container mx-auto px-4 py-4 space-y-4">
            {/* Navigation Links */}
            <div className="space-y-3">
              {isAdmin && (
                <Link
                  href="/admin"
                  className="block"
                  onClick={() => setIsOpen(false)}
                >
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Button>
                </Link>
              )}
              {!isAdmin && user && userProfile?.orgId && (
                <Link
                  href="/org"
                  className="block"
                  onClick={() => setIsOpen(false)}
                >
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <LayoutDashboard className="w-4 h-4" />
                    Org Dashboard
                  </Button>
                </Link>
              )}
              {!isAdmin && user && userProfile && !(userProfile as any).orgId && (
                <Link
                  href="/dashboard"
                  className="block"
                  onClick={() => setIsOpen(false)}
                >
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Button>
                </Link>
              )}
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="block py-2 text-foreground hover:text-primary font-medium transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Resources Section */}
            <div className="pt-3 border-t border-border">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                Resources
              </h3>
              <div className="space-y-3">
                {resourceItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center gap-3 py-2 text-foreground hover:text-primary transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <item.icon className="w-5 h-5" />
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-muted-foreground">{item.description}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Mobile CTA Buttons */}
            <div className="pt-4 border-t border-border space-y-3">
              {user ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{user.displayName}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={handleSignOut}
                  >
                    <LogOut className="mr-2 w-4 h-4" />
                    Sign Out
                  </Button>
                </div>
              ) : (
                <>
                  <Link href="/signin">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setIsOpen(false)}
                    >
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button 
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                      onClick={() => setIsOpen(false)}
                    >
                      Start Free Trial
                      <Star className="ml-2 w-4 h-4" />
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
