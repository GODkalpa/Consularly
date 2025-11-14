"use client"

import { AuthProvider } from '@/contexts/AuthContext'

export function ClientAuthProvider({ children }: { children: React.ReactNode }) {
  // Always load AuthProvider but we'll optimize the AuthProvider itself
  // This ensures authentication state is always available when needed
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  )
}
