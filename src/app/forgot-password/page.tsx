'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Mail, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react'
import { DynamicFavicon } from '@/components/branding/DynamicFavicon'
import { addCacheBuster } from '@/lib/favicon-utils'

interface OrgContext {
    organization?: {
        name: string
        branding?: {
            primaryColor?: string
            logoUrl?: string
            favicon?: string
        }
    }
}

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [orgContext, setOrgContext] = useState<OrgContext | null>(null)
    const [isSubdomain, setIsSubdomain] = useState(false)
    const [loadingContext, setLoadingContext] = useState(true)

    // Detect if we're on a subdomain and fetch org context
    useEffect(() => {
        async function checkSubdomain() {
            try {
                // Check if we're on a subdomain by trying to fetch org context
                const res = await fetch('/api/subdomain/context')
                if (res.ok) {
                    const data = await res.json()
                    if (data.organization) {
                        setOrgContext(data)
                        setIsSubdomain(true)
                    }
                }
            } catch (e) {
                // Not on a subdomain or context not available - that's fine
                console.debug('[forgot-password] Not on subdomain or context unavailable')
            } finally {
                setLoadingContext(false)
            }
        }
        checkSubdomain()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!email.trim()) {
            toast.error('Please enter your email address')
            return
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            toast.error('Please enter a valid email address')
            return
        }

        setLoading(true)
        try {
            const res = await fetch('/api/auth/password-reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim().toLowerCase() }),
            })

            const data = await res.json()

            if (!res.ok && res.status !== 200) {
                // Only show error for actual server errors, not for security reasons
                if (res.status >= 500) {
                    throw new Error('Server error. Please try again later.')
                }
            }

            // Always show success to prevent email enumeration
            setSuccess(true)
            toast.success('Check your email for reset instructions')
        } catch (error: any) {
            console.error('[forgot-password] Error:', error)
            toast.error(error.message || 'Something went wrong. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const org = orgContext?.organization
    const primaryColor = org?.branding?.primaryColor || '#4840A3'

    // Loading state while checking for subdomain context
    if (loadingContext) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    // Success state
    if (success) {
        return (
            <>
                {org?.branding?.favicon && <DynamicFavicon faviconUrl={org.branding.favicon} />}
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
                    <Card className="w-full max-w-md">
                        <CardHeader className="text-center">
                            <div
                                className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4"
                                style={{ backgroundColor: `${primaryColor}15` }}
                            >
                                <CheckCircle className="h-8 w-8" style={{ color: primaryColor }} />
                            </div>
                            <CardTitle className="text-2xl">Check Your Email</CardTitle>
                            <CardDescription className="mt-2">
                                If an account exists for <strong>{email}</strong>, we've sent password reset instructions.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground text-center">
                                Didn't receive the email? Check your spam folder or try again with a different email.
                            </p>
                            <div className="flex flex-col gap-2">
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => setSuccess(false)}
                                >
                                    Try Another Email
                                </Button>
                                <Link href="/signin" className="w-full">
                                    <Button className="w-full" style={{ backgroundColor: primaryColor }}>
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        Back to Sign In
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </>
        )
    }

    // Subdomain-specific styled version
    if (isSubdomain && org) {
        return (
            <>
                <DynamicFavicon faviconUrl={org.branding?.favicon} />
                <div className="min-h-screen w-full flex items-center justify-center bg-[#f8fafc] p-2 sm:p-4 md:p-8 font-sans">
                    <div className="w-full max-w-[900px] bg-white rounded-2xl sm:rounded-[32px] shadow-2xl overflow-hidden flex flex-col md:flex-row">

                        {/* Left Side - Branding */}
                        <div
                            className="w-full md:w-2/5 relative flex flex-col items-center justify-center p-8 sm:p-10 text-white overflow-hidden min-h-[200px] md:min-h-0"
                            style={{
                                background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`
                            }}
                        >
                            {/* Background Decorations */}
                            <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20">
                                <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] rounded-full bg-white mix-blend-overlay filter blur-3xl"></div>
                                <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] rounded-full bg-white mix-blend-overlay filter blur-3xl"></div>
                            </div>

                            <div className="relative z-10 flex flex-col items-center text-center">
                                {org.branding?.logoUrl ? (
                                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/10 backdrop-blur-sm rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6 shadow-lg border border-white/20 flex items-center justify-center">
                                        <img
                                            src={addCacheBuster(org.branding.logoUrl)}
                                            alt={org.name}
                                            className="max-w-full max-h-full object-contain brightness-0 invert"
                                        />
                                    </div>
                                ) : (
                                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center text-3xl sm:text-4xl font-bold mb-4 sm:mb-6 shadow-lg border border-white/20">
                                        {org.name.charAt(0)}
                                    </div>
                                )}

                                <h1 className="text-xl sm:text-2xl font-bold mb-2 tracking-tight">
                                    {org.name}
                                </h1>
                                <p className="text-sm sm:text-base text-white/80 font-light">
                                    Password Recovery
                                </p>
                            </div>
                        </div>

                        {/* Right Side - Form */}
                        <div className="w-full md:w-3/5 bg-white p-6 sm:p-8 md:p-12 flex flex-col justify-center">
                            <div className="max-w-sm mx-auto w-full">
                                <div className="mb-6 sm:mb-8">
                                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Forgot Password?</h2>
                                    <p className="text-sm sm:text-base text-gray-500">
                                        Enter your email and we'll send you reset instructions.
                                    </p>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700 ml-1">Email Address</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <Mail className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <input
                                                type="email"
                                                required
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="block w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50/50"
                                                placeholder="name@example.com"
                                                disabled={loading}
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.98]"
                                        style={{
                                            backgroundColor: primaryColor,
                                            boxShadow: `0 4px 14px 0 ${primaryColor}60`
                                        }}
                                    >
                                        {loading ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            'Send Reset Link'
                                        )}
                                    </button>

                                    <div className="text-center">
                                        <Link
                                            href="/signin"
                                            className="text-sm font-medium hover:underline"
                                            style={{ color: primaryColor }}
                                        >
                                            <span className="flex items-center justify-center gap-1">
                                                <ArrowLeft className="w-4 h-4" />
                                                Back to Sign In
                                            </span>
                                        </Link>
                                    </div>
                                </form>

                                <div className="mt-8 text-center">
                                    <p className="text-xs text-gray-400">
                                        Powered by <span className="font-semibold text-gray-500">Consularly</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        )
    }

    // Main domain version (simple card layout)
    return (
        <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center space-y-1">
                    <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        <Mail className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Forgot Password?</CardTitle>
                    <CardDescription>
                        Enter your email address and we'll send you a link to reset your password.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium">
                                Email Address
                            </label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                'Send Reset Link'
                            )}
                        </Button>

                        <div className="text-center">
                            <Link
                                href="/signin"
                                className="text-sm text-muted-foreground hover:text-primary hover:underline inline-flex items-center gap-1"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back to Sign In
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
