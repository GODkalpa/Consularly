"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { auth } from '@/lib/firebase'
import { signInWithEmailAndPassword } from 'firebase/auth'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  
  const { user, profileLoading, signIn: adminSignIn, signInWithGoogle, redirectToDashboard } = useAuth()
  const router = useRouter()

  // If already signed in (or becomes signed in), send user to the correct dashboard
  useEffect(() => {
    if (user && !profileLoading && !isLoading) {
      console.log('[SignIn useEffect] User detected, redirecting to dashboard')
      redirectToDashboard().catch(err => {
        console.error('[SignIn] Redirect failed:', err)
      })
    }
  }, [user, profileLoading, isLoading, redirectToDashboard])

  // Check if email belongs to a student
  const checkIfStudent = async (email: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/student/check-email?email=${encodeURIComponent(email)}`)
      if (response.ok) {
        const data = await response.json()
        return data.isStudent || false
      }
      return false
    } catch {
      return false
    }
  }

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // First, check if this is a student email
      const isStudent = await checkIfStudent(email)
      
      if (isStudent) {
        // Use Firebase auth directly for students
        console.log('[SignIn] Detected student email, signing in with Firebase')
        const userCredential = await signInWithEmailAndPassword(auth, email, password)
        
        // Set session cookie immediately before redirecting
        const idToken = await userCredential.user.getIdToken()
        console.log('[SignIn] Setting session cookie for student...')
        const response = await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken })
        })
        const result = await response.json()
        console.log('[SignIn] Session cookie response:', result)
        
        // Wait a bit to ensure cookie is set
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Now redirect to student dashboard
        console.log('[SignIn] Redirecting to /student')
        router.push('/student')
      } else {
        // Use regular admin/org authentication
        console.log('[SignIn] Using admin/org auth')
        await adminSignIn(email, password)
        redirectToDashboard()
      }
    } catch (error: any) {
      console.error('[SignIn] Error:', error)
      
      // Better error messages
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        setError('Invalid email or password. Please check your credentials.')
      } else if (error.code === 'auth/too-many-requests') {
        setError('Too many login attempts. Please try again later.')
      } else {
        setError(error.message || 'Failed to sign in. Please check your credentials.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setError('')

    try {
      await signInWithGoogle()
      redirectToDashboard()
    } catch (error: any) {
      setError(error.message || 'Failed to sign in with Google')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8 pt-16">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Sign in</CardTitle>
            <CardDescription className="text-center">
              Sign in to access your dashboard
            </CardDescription>
          </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </Button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            
            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-center">
            <Link href="/forgot-password" className="text-secondary hover:text-primary hover:underline">
              Forgot your password?
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
    </>
  )
}
