"use client"

import React from 'react'

export function LoadingNavbar() {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50 shadow-sm">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="flex items-center justify-between h-16">
          <div className="animate-pulse bg-muted h-8 w-32 rounded"></div>
          <div className="animate-pulse bg-muted h-8 w-24 rounded"></div>
        </div>
      </div>
    </div>
  )
}
