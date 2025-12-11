'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Eye, EyeOff, Lock, CheckCircle, AlertCircle } from 'lucide-react'

function ResetPasswordContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')
  
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [validating, setValidating] = useState(true)
  const [tokenValid, setTokenValid] = useState(false)
  const [tokenData, setTokenData] = useState<{ email?: string; orgName?: string; subdomain?: string } | null>(null)
  const [success, setSuccess] = useState(false)

  // Validate token on mount
  useEffect(() => {
    async function validateToken() {
      if (!token) {
        setValidating(false)
        return
      }

      try {
        const res = await fetch('/api/auth/validate-reset-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })
        const data = await res.json()
        
        if (res.ok && data.valid) {
          setTokenValid(true)
          setTokenData(data)
        }
      } catch (e) {
        console.error('Token validation error:', e)
      } finally {
        setValidating(false)
      }
    }

    validateToken()
  }, [token])

  const passwordStrength = () => {
    if (password.length === 0) return { score: 0, label: '', color: '' }
    if (password.length < 6) return { score: 1, label: 'Too short', color: 'bg-red-500' }
    if (password.length < 8) return { score: 2, label: 'Weak', color: 'bg-orange-500' }
    
    const hasUpper = /[A-Z]/.test(password)
    const hasLower = /[a-z]/.test(password)
    const hasNumber = /[0-9]/.test(password)
    const hasSpecial = /[!@#$%^&*]/.test(password)
    const strength = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length
    
    if (strength >= 3 && password.length >= 8) return { score: 4, label: 'Strong', color: 'bg-green-500' }
    if (strength >= 2) return { score: 3, label: 'Good', color: 'bg-yellow-500' }
    return { score: 2, label: 'Weak', color: 'bg-orange-500' }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/complete-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset password')
      }

      setSuccess(true)
      toast.success('Password set successfully!')
      
      // Redirect to appropriate login page after 2 seconds
      setTimeout(() => {
        if (tokenData?.subdomain) {
          const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'consularly.com'
          window.location.href = `https://${tokenData.subdomain}.${baseDomain}/signin`
        } else {
          router.push('/signin')
        }
      }, 2000)
    } catch (e: any) {
      toast.error(e.message || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-muted-foreground">Validating your link...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!token || !tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle>Invalid or Expired Link</CardTitle>
            <CardDescription>
              This password reset link is invalid or has expired. Please request a new one.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full" 
              onClick={() => router.push('/signin')}
            >
              Back to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle>Password Set Successfully!</CardTitle>
            <CardDescription>
              Redirecting you to sign in...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const strength = passwordStrength()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Set Your Password</CardTitle>
          <CardDescription>
            {tokenData?.orgName ? (
              <>Create a password for your <strong>{tokenData.orgName}</strong> account</>
            ) : (
              'Create a secure password for your account'
            )}
          </CardDescription>
          {tokenData?.email && (
            <p className="text-sm text-muted-foreground mt-2">{tokenData.email}</p>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">New Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {password && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded ${i <= strength.score ? strength.color : 'bg-gray-200'}`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">{strength.label}</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Confirm Password</label>
              <Input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-500">Passwords do not match</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || password !== confirmPassword || password.length < 6}
            >
              {loading ? 'Setting Password...' : 'Set Password'}
            </Button>
          </form>

          <p className="text-xs text-muted-foreground text-center mt-4">
            Password must be at least 6 characters. For better security, use a mix of letters, numbers, and symbols.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}
