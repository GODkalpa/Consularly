"use client"

import FooterSection from '@/components/ui/footer'
import { usePathname } from 'next/navigation'

const HIDDEN_PATH_PREFIXES = ['/admin', '/org']

export default function ConditionalFooter() {
  const pathname = usePathname()

  if (!pathname) return null

  const hide = HIDDEN_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + '/')
  )

  if (hide) return null

  return <FooterSection />
}
