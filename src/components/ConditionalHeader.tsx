"use client"

import { usePathname } from 'next/navigation'
import { HeroHeader } from '@/components/Header'

const HIDDEN_PATH_PREFIXES = ['/admin', '/org', '/dashboard', '/interview']

export default function ConditionalHeader() {
  const pathname = usePathname()
  if (!pathname) return null
  const hide = HIDDEN_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + '/')
  )
  if (hide) return null
  return <HeroHeader />
}
