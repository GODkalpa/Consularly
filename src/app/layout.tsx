import type { Metadata } from 'next'
import type { Viewport } from 'next'
import dynamic from 'next/dynamic'
import { Inter } from 'next/font/google'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import './globals.css'
import { ClientAuthProvider } from '@/components/ClientAuthProvider'
import { Toaster } from '@/components/ui/sonner'
import ChromeSwitcher from '@/components/ChromeSwitcher'
import RevealOnScroll from '@/components/animations/RevealOnScroll'
import { extractSubdomain, isMainPortal } from '@/lib/subdomain-utils'
import { adminDb } from '@/lib/firebase-admin'

// ClientAuthProvider is a client component; importing it statically avoids first-load spinners

const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'], display: 'swap' })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://consularly.app'),
  title: 'Consularly - Ace Your US Visa Interview',
  description: 'AI-powered visa interview mock test platform for Nepalese F-1 students. Practice with realistic questions, get instant feedback, and increase your success rate.',
  keywords: 'visa interview, F-1 visa, Nepal, USA, mock test, AI feedback, student visa, visa preparation',
  authors: [{ name: 'Consularly Team' }],
  openGraph: {
    title: 'Consularly - Ace Your US Visa Interview',
    description: 'AI-powered visa interview preparation for Nepalese students',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Consularly - Ace Your US Visa Interview',
    description: 'AI-powered visa interview preparation for Nepalese students',
  },
}

// Move themeColor to viewport per Next.js recommendation to silence warnings
export const viewport: Viewport = {
  themeColor: '#4840A3',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Server-side subdomain validation
  const headersList = await headers()
  const hostname = headersList.get('host') || ''
  
  // Check if subdomain routing is enabled
  const subdomainRoutingEnabled = process.env.NEXT_PUBLIC_ENABLE_SUBDOMAIN_ROUTING === 'true'
  
  if (subdomainRoutingEnabled) {
    const subdomain = extractSubdomain(hostname)
    
    // If there's a subdomain and it's not the main portal
    if (subdomain && !isMainPortal(hostname)) {
      try {
        // Query Firestore for organization
        const orgsSnapshot = await adminDb()
          .collection('organizations')
          .where('subdomain', '==', subdomain)
          .where('subdomainEnabled', '==', true)
          .limit(1)
          .get()
        
        // If organization doesn't exist, show error
        if (orgsSnapshot.empty) {
          return (
            <html lang="en">
              <body className={inter.className}>
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  minHeight: '100vh',
                  padding: '20px',
                  textAlign: 'center'
                }}>
                  <h1 style={{ fontSize: '48px', marginBottom: '16px' }}>404</h1>
                  <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>Organization Not Found</h2>
                  <p style={{ color: '#666', marginBottom: '24px' }}>
                    The subdomain "{subdomain}" is not registered.
                  </p>
                  <a href="https://consularly.com" style={{ 
                    color: '#4840A3', 
                    textDecoration: 'underline' 
                  }}>
                    Go to main site
                  </a>
                </div>
              </body>
            </html>
          )
        }
      } catch (error) {
        console.error('[Root Layout] Error validating subdomain:', error)
      }
    }
  }
  
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClientAuthProvider>
          <ChromeSwitcher position="header" />
          {children}
        </ClientAuthProvider>
        <ChromeSwitcher position="footer" />
        <Toaster richColors />
        {/* Client-side animation orchestrator for data-animate elements */}
        <RevealOnScroll />
      </body>
    </html>
  )
}
