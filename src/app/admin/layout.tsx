import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin Dashboard - Mock Interview Platform',
  description: 'Administrative dashboard for managing the mock interview platform',
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
