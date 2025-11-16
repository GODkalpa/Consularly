"use client"

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import type { InterviewRoute } from '@/lib/interview-routes'

interface AnalyzingScreenProps {
  route: InterviewRoute
  questionCount: number
  onRetry?: () => void
  error?: string | null
}

const STATUS_MESSAGES = [
  'Analyzing your responses...',
  'Evaluating performance...',
  'Generating insights...',
  'Preparing your report...',
]

const getInterviewTitle = (route: InterviewRoute): string => {
  switch (route) {
    case 'usa_f1':
      return 'USA F1 Interview'
    case 'uk_student':
      return 'UK Pre-CAS Interview'
    case 'france_ema':
      return 'France EMA Interview'
    case 'france_icn':
      return 'France ICN Interview'
    default:
      return 'Interview'
  }
}

export function InterviewAnalyzingScreen({
  route,
  questionCount,
  onRetry,
  error
}: AnalyzingScreenProps) {
  const [messageIndex, setMessageIndex] = useState(0)

  // Rotate status messages every 2 seconds
  useEffect(() => {
    if (error) return // Stop rotation if there's an error
    
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % STATUS_MESSAGES.length)
    }, 2000)

    return () => clearInterval(interval)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardContent className="p-12">
          <AnimatePresence mode="wait">
            {error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center space-y-6"
              >
                <div className="flex justify-center">
                  <div className="rounded-full bg-red-100 p-6">
                    <AlertCircle className="h-16 w-16 text-red-600" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Evaluation Error
                  </h2>
                  <p className="text-gray-600 max-w-md mx-auto">
                    {error}
                  </p>
                </div>

                {onRetry && (
                  <Button
                    onClick={onRetry}
                    size="lg"
                    className="gap-2"
                  >
                    <RefreshCw className="h-5 w-5" />
                    Retry Evaluation
                  </Button>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="analyzing"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center space-y-8"
              >
                {/* Animated spinner */}
                <div className="flex justify-center">
                  <div className="relative">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                    >
                      <Loader2 className="h-20 w-20 text-blue-600" />
                    </motion.div>
                    
                    {/* Pulsing ring */}
                    <motion.div
                      className="absolute inset-0 rounded-full border-4 border-blue-200"
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.5, 0.2, 0.5]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  </div>
                </div>

                {/* Interview context */}
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold text-gray-900">
                    Analyzing Your Interview
                  </h2>
                  <p className="text-gray-600">
                    {getInterviewTitle(route)} • {questionCount} questions completed
                  </p>
                </div>

                {/* Rotating status message */}
                <AnimatePresence mode="wait">
                  <motion.p
                    key={messageIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="text-lg text-blue-600 font-medium"
                  >
                    {STATUS_MESSAGES[messageIndex]}
                  </motion.p>
                </AnimatePresence>

                {/* Progress indicator */}
                <div className="max-w-xs mx-auto">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{
                        duration: 10,
                        ease: "easeInOut"
                      }}
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    This usually takes less than 10 seconds
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  )
}
