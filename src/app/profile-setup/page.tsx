"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { ProfileSetupForm } from '@/components/profile/ProfileSetupForm'
import { type StudentProfileInfo } from '@/lib/database'
import { toast } from 'sonner'
import { Loader2, GraduationCap, Sparkles } from 'lucide-react'

export default function ProfileSetupPage() {
  const { user, userProfile } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingProfile, setIsCheckingProfile] = useState(true)

  useEffect(() => {
    // Redirect to sign-in if not authenticated
    if (!user) {
      router.push('/signin')
      return
    }

    // Check if user already has a completed profile
    if (userProfile) {
      setIsCheckingProfile(false)
      const hasCountry = userProfile.interviewCountry
      const hasProfile = userProfile.studentProfile?.profileCompleted
      
      // If country is set and either (UK/France) or (USA with profile), redirect to dashboard
      if (hasCountry) {
        if (hasCountry !== 'usa' || hasProfile) {
          router.push('/dashboard')
        }
      }
    } else {
      // Still loading profile
      setIsCheckingProfile(true)
    }
  }, [user, userProfile, router])

  const handleSubmit = async (data: StudentProfileInfo & { interviewCountry: 'usa' | 'uk' | 'france' }) => {
    if (!user) {
      toast.error('You must be signed in to complete your profile')
      return
    }

    setIsLoading(true)
    try {
      const { interviewCountry, ...profileData } = data
      
      // Get the ID token for authentication
      const idToken = await user.getIdToken()
      
      // Call server-side API to update profile (bypasses security rules)
      const response = await fetch('/api/profile/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          interviewCountry,
          studentProfile: interviewCountry === 'usa' ? profileData : null,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update profile')
      }
      
      toast.success('Setup completed successfully!', {
        description: 'You can now access your dashboard and start practicing'
      })
      router.push('/dashboard')
    } catch (error: any) {
      console.error('Error updating profile:', error)
      toast.error('Failed to save setup', {
        description: error.message || 'Please try again'
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isCheckingProfile || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground text-lg">Loading your profile...</p>
        </div>
      </div>
    )
  }

  const isNewUser = userProfile && !userProfile.studentProfile
  const isExistingUser = userProfile && userProfile.studentProfile && !userProfile.studentProfile.profileCompleted

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
        <div className="relative">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12">
            <div className="text-center space-y-6">
              {/* Icon Badge */}
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 backdrop-blur-sm border border-primary/20 mb-4">
                <GraduationCap className="h-8 w-8 text-primary" />
              </div>
              
              {/* Title */}
              <div className="space-y-3">
                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
                  {isExistingUser ? (
                    <>Complete Your Profile</>
                  ) : (
                    <>Welcome, <span className="text-primary">{user?.displayName || 'there'}</span>!</>
                  )}
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  {isExistingUser 
                    ? 'Complete your profile to unlock personalized interview preparation and access your dashboard'
                    : "Let's personalize your interview experience with a few details about your program"
                  }
                </p>
              </div>

              {/* Feature Pills */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/10 text-sm">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span>Personalized Questions</span>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/10 text-sm">
                  <GraduationCap className="h-4 w-4 text-primary" />
                  <span>Degree-Specific Prep</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <ProfileSetupForm
          initialData={userProfile?.studentProfile}
          initialCountry={userProfile?.interviewCountry}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          showCard={true}
          title={isExistingUser ? "Your Program Information" : "Get Started"}
          description={isExistingUser 
            ? "Provide your program details to get started with personalized interview preparation."
            : "Select your interview country to begin your preparation journey."
          }
        />
      </div>
    </div>
  )
}

