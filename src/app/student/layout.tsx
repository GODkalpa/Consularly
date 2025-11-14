import { StudentAuthProvider } from '@/contexts/StudentAuthContext'

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <StudentAuthProvider>
      {children}
    </StudentAuthProvider>
  )
}
