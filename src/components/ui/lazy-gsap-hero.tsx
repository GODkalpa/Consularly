"use client"

// Temporarily disable GSAP to fix performance - will implement proper lazy loading later
export default function LazyGSAPHero({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
