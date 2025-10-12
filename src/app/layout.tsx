import type { Metadata } from 'next'
import type { Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ClientAuthProvider } from '@/components/ClientAuthProvider'
import { Toaster } from '@/components/ui/sonner'
import ConditionalHeader from '@/components/ConditionalHeader'
import ConditionalFooter from '@/components/ConditionalFooter'
import ScrollRevealProvider from '@/components/animations/ScrollRevealProvider'

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClientAuthProvider>
          <ScrollRevealProvider />
          <ConditionalHeader />
          {children}
        </ClientAuthProvider>
        <ConditionalFooter />
        <Toaster richColors />
      </body>
    </html>
  )
}
