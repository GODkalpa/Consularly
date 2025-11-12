"use client"

import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'

const DynamicHeader = dynamic(() => import('@/components/ConditionalHeader'), { ssr: false })
const DynamicFooter = dynamic(() => import('@/components/ConditionalFooter'), { ssr: false })

export default function ChromeSwitcher({ position }: { position: 'header' | 'footer' }) {
  const pathname = usePathname() || ''
  const isDashboard = pathname.startsWith('/org') || pathname.startsWith('/admin') || pathname.startsWith('/interview') || pathname.startsWith('/dashboard')
  if (isDashboard) return null
  return position === 'header' ? <DynamicHeader /> : <DynamicFooter />
}
