"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, Calendar, Target, MessageSquare, Eye, Star, AlertCircle, Lightbulb, DollarSign, GraduationCap, Users, BookOpen } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import type { InterviewWithId, FinalReport } from '@/types/firestore'

interface ExpandableInterviewCardProps {
  interview: InterviewWithId & { finalReport?: FinalReport }
}

export function ExpandableInterviewCard({ interview }: ExpandableInterviewCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const scoreTone = (s?: number) => {
    if (typeof s !== 'number') return 'bg-gray-500'
    if (s >= 90) return 'bg-green-600'
    if (s >= 80) return 'bg-green-500'
    if (s >= 70) return 'bg-yellow-500'
    if (s >= 60) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const decisionColor = (decision?: string) => {
    if (decision === 'accepted') return 'bg-green-500 text-white'
    if (decision === 'rejected') return 'bg-red-500 text-white'
    return 'bg-yellow-500 text-white'
  }

  const formatDate = (date: any) => {
    if (!date) return 'Unknown'
    const d = date.toDate ? date.toDate() : new Date(date)
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center justify-between">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{formatDate(interview.startTime)}</span>
              <Badge variant="outline" className="text-xs">
                {interview.route || 'visa'}
              </Badge>
              {interview.finalReport?.decision && (
                <Badge className={`text-xs ${decisionColor(interview.finalReport.decision)}`}>
                  {interview.finalReport.decision.toUpperCase()}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Overall Score:</span>
                <Badge className={`text-sm font-bold ${scoreTone(interview.score)}`}>
                  {typeof interview.score === 'number' ? interview.score : '—'}/100
                </Badge>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm">
            {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </Button>
        </div>
      </CardHeader>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <CardContent className="space-y-6 pt-0">
              <div className="h-px bg-border" />

              {!interview.finalReport ? (
                <div className="py-8 text-center">
                  <AlertCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-sm font-medium text-muted-foreground mb-1">No detailed report available</p>
                  <p className="text-xs text-muted-foreground">
                    This interview may not have been completed or the report is still being generated.
                  </p>
                </div>
              ) : (
                <>

              {/* Score Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs font-semibold text-blue-900 dark:text-blue-100">Content Quality</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {interview.finalReport.dimensions?.content || interview.finalReport.dimensions?.courseAndUniversityFit || '—'}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    <span className="text-xs font-semibold text-purple-900 dark:text-purple-100">Communication</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                    {interview.finalReport.dimensions?.communication || '—'}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="text-xs font-semibold text-green-900 dark:text-green-100">Body Language</span>
                  </div>
                  <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                    {interview.finalReport.dimensions?.bodyLanguage || '—'}
                  </div>
                </div>
              </div>

              {/* AI Analysis Summary */}
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  AI Analysis Summary
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {interview.finalReport.summary}
                </p>
              </div>

              {/* Strengths and Weaknesses */}
              {(interview.finalReport.strengths?.length > 0 || interview.finalReport.weaknesses?.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {interview.finalReport.strengths?.length > 0 && (
                    <div className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-950/10 rounded-lg p-4 border border-green-500/20">
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-green-700 dark:text-green-400">
                        <Star className="h-4 w-4" />
                        Key Strengths
                      </h4>
                      <ul className="space-y-2">
                        {interview.finalReport.strengths.map((strength, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs">
                            <span className="text-green-600 mt-0.5">✓</span>
                            <span>{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {interview.finalReport.weaknesses?.length > 0 && (
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/30 dark:to-orange-950/10 rounded-lg p-4 border border-orange-500/20">
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-orange-700 dark:text-orange-400">
                        <AlertCircle className="h-4 w-4" />
                        Areas for Improvement
                      </h4>
                      <ul className="space-y-2">
                        {interview.finalReport.weaknesses.map((weakness, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs">
                            <span className="text-orange-600 mt-0.5">!</span>
                            <span>{weakness}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Detailed Insights */}
              {interview.finalReport.detailedInsights && interview.finalReport.detailedInsights.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-primary" />
                    Detailed Insights
                  </h4>
                  <div className="space-y-3">
                    {interview.finalReport.detailedInsights.map((insight, i) => {
                      const categoryIcon = {
                        'Content Quality': Target,
                        'Financial': DollarSign,
                        'Course': GraduationCap,
                        'Communication': MessageSquare,
                        'Body Language': Eye,
                        'Intent': Users,
                      }[insight.category] || BookOpen

                      const IconComponent = categoryIcon
                      const isStrength = insight.type === 'strength'

                      return (
                        <div
                          key={i}
                          className={`p-3 rounded-lg border ${
                            isStrength
                              ? 'bg-green-50/50 dark:bg-green-950/20 border-green-500/20'
                              : 'bg-orange-50/50 dark:bg-orange-950/20 border-orange-500/20'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`flex-shrink-0 p-1.5 rounded-lg ${
                              isStrength ? 'bg-green-100 dark:bg-green-900/50' : 'bg-orange-100 dark:bg-orange-900/50'
                            }`}>
                              <IconComponent className={`h-4 w-4 ${
                                isStrength ? 'text-green-700 dark:text-green-400' : 'text-orange-700 dark:text-orange-400'
                              }`} />
                            </div>
                            <div className="flex-1 space-y-1.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant={isStrength ? 'default' : 'secondary'} className={`text-xs ${
                                  isStrength ? 'bg-green-600' : 'bg-orange-600'
                                }`}>
                                  {insight.category}
                                </Badge>
                              </div>
                              <p className="font-medium text-xs">{insight.finding}</p>
                              <p className="text-xs flex items-start gap-1.5 mt-2">
                                <Lightbulb className="h-3 w-3 text-primary flex-shrink-0 mt-0.5" />
                                <span><strong>Action:</strong> {insight.actionItem}</span>
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
              </>
              )}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}

