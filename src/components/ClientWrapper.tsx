"use client"

import { NoSSR } from '@/components/NoSSR'

interface ClientWrapperProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function ClientWrapper({ children, fallback }: ClientWrapperProps) {
  return (
    <NoSSR fallback={fallback || <div className="animate-pulse bg-muted rounded-md h-[300px] w-full" />}>
      {children}
    </NoSSR>
  )
}
