'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, AlertCircle, TrendingUp, Target, Lightbulb, PlayCircle } from 'lucide-react';
import { generateCoachingReport } from '@/lib/coaching-engine';
import type { InterviewResponse } from '@/types/firestore';
import type { CoachingReport } from '@/lib/coaching-engine';

interface DetailedReviewProps {
  responses: Array<InterviewResponse & { question: string }>;
  overallScore: number;
  completedModes?: string[];
  onStartNextInterview?: (mode: string, difficulty: string) => void;
}

export default function DetailedReview({
  responses,
  overallScore,
  completedModes = [],
  onStartNextInterview,
}: DetailedReviewProps) {
  const [report, setReport] = useState<CoachingReport | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState(0);

  useEffect(() => {
    const coachingReport = generateCoachingReport(responses, overallScore, completedModes);
    setReport(coachingReport);
  }, [responses, overallScore, completedModes]);

  if (!report) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Generating detailed coaching report...</p>
        </div>
      </div>
    );
  }

  const { overallFeedback, answerComparisons, actionPlans, nextSessionRecommendations, estimatedImprovementPotential } = report;

  return (
    <div className="space-y-6">
      {/* Overall Feedback */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Overall Performance</span>
            <span className={`text-3xl ${
              overallScore >= 85 ? 'text-green-600' :
              overallScore >= 70 ? 'text-blue-600' :
              overallScore >= 50 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {overallScore}/100
            </span>
          </CardTitle>
          <CardDescription>{overallFeedback}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="font-medium">Improvement Potential</span>
                <span className="text-green-600 font-bold">+{estimatedImprovementPotential} points possible</span>
              </div>
              <Progress value={estimatedImprovementPotential} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                With focused practice on identified areas, you can improve by up to {estimatedImprovementPotential} points
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="comparisons" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="comparisons">Answer Review</TabsTrigger>
          <TabsTrigger value="actionplans">Action Plans</TabsTrigger>
          <TabsTrigger value="nextsteps">Next Steps</TabsTrigger>
        </TabsList>

        {/* Answer Comparisons */}
        <TabsContent value="comparisons" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Answer-by-Answer Review</CardTitle>
              <CardDescription>Compare your answers with model responses</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Answer Selector */}
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {answerComparisons.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedAnswer(index)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors flex-shrink-0 ${
                      selectedAnswer === index
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    Q{index + 1}
                    <span className={`ml-2 text-xs ${
                      answerComparisons[index].score >= 85 ? 'text-green-300' :
                      answerComparisons[index].score >= 70 ? 'text-blue-300' :
                      answerComparisons[index].score >= 50 ? 'text-yellow-300' : 'text-red-300'
                    }`}>
                      {answerComparisons[index].score}
                    </span>
                  </button>
                ))}
              </div>

              {/* Selected Answer Details */}
              {answerComparisons[selectedAnswer] && (
                <div className="space-y-6">
                  {/* Question */}
                  <div>
                    <h4 className="font-semibold mb-2">Question {selectedAnswer + 1}:</h4>
                    <p className="text-muted-foreground">{responses[selectedAnswer].question}</p>
                  </div>

                  {/* Side-by-side comparison */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <Card className="border-red-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-red-500" />
                          Your Answer
                          <Badge variant="outline">{answerComparisons[selectedAnswer].score}/100</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm whitespace-pre-wrap">
                          {answerComparisons[selectedAnswer].yourAnswer || 'No answer provided'}
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border-green-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          Model Answer
                          <Badge variant="outline" className="bg-green-50">90-95/100</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm whitespace-pre-wrap text-green-900/80">
                          {answerComparisons[selectedAnswer].modelAnswer}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Feedback */}
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Strengths */}
                    {answerComparisons[selectedAnswer].strengths.length > 0 && (
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base text-green-700">✓ Strengths</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {answerComparisons[selectedAnswer].strengths.map((strength, i) => (
                              <li key={i} className="text-sm flex items-start gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <span>{strength}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}

                    {/* Weaknesses */}
                    {answerComparisons[selectedAnswer].weaknesses.length > 0 && (
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base text-red-700">✗ Areas to Improve</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {answerComparisons[selectedAnswer].weaknesses.map((weakness, i) => (
                              <li key={i} className="text-sm flex items-start gap-2">
                                <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                                <span>{weakness}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* Key Elements */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Key Elements Checklist</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold text-sm text-green-700 mb-2">✓ Included:</h4>
                          <ul className="space-y-1">
                            {answerComparisons[selectedAnswer].keyElementsPresent.map((element, i) => (
                              <li key={i} className="text-sm flex items-start gap-2">
                                <CheckCircle className="h-3 w-3 text-green-500 mt-1 flex-shrink-0" />
                                <span>{element}</span>
                              </li>
                            ))}
                            {answerComparisons[selectedAnswer].keyElementsPresent.length === 0 && (
                              <li className="text-sm text-muted-foreground">No key elements present</li>
                            )}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm text-red-700 mb-2">✗ Missing:</h4>
                          <ul className="space-y-1">
                            {answerComparisons[selectedAnswer].keyElementsMissing.map((element, i) => (
                              <li key={i} className="text-sm flex items-start gap-2">
                                <XCircle className="h-3 w-3 text-red-500 mt-1 flex-shrink-0" />
                                <span>{element}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Specific Improvements */}
                  {answerComparisons[selectedAnswer].specificImprovements.length > 0 && (
                    <Alert>
                      <Lightbulb className="h-4 w-4" />
                      <AlertDescription>
                        <h4 className="font-semibold mb-2">How to Improve This Answer:</h4>
                        <ul className="space-y-1">
                          {answerComparisons[selectedAnswer].specificImprovements.map((improvement, i) => (
                            <li key={i} className="text-sm">• {improvement}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Action Plans */}
        <TabsContent value="actionplans" className="space-y-4">
          {actionPlans.map((plan, index) => (
            <Card key={index} className={`border-l-4 ${
              plan.priority === 'high' ? 'border-l-red-500' :
              plan.priority === 'medium' ? 'border-l-yellow-500' : 'border-l-blue-500'
            }`}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    {plan.area}
                  </span>
                  <Badge variant={
                    plan.priority === 'high' ? 'destructive' :
                    plan.priority === 'medium' ? 'default' : 'secondary'
                  }>
                    {plan.priority} priority
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {plan.currentLevel} → {plan.targetLevel} ({plan.timeframe})
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    Practice Exercises:
                  </h4>
                  <ol className="space-y-2">
                    {plan.exercises.map((exercise, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="font-medium text-primary">{i + 1}.</span>
                        <span>{exercise}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Success Metrics:
                  </h4>
                  <ul className="space-y-1">
                    {plan.successMetrics.map((metric, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="text-green-500">✓</span>
                        <span>{metric}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Next Steps */}
        <TabsContent value="nextsteps" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Recommended Next Session
              </CardTitle>
              <CardDescription>{nextSessionRecommendations.reasoning}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-1">Interview Mode</h4>
                  <p className="text-2xl font-bold capitalize">{nextSessionRecommendations.mode.replace('_', ' ')}</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-1">Difficulty Level</h4>
                  <p className="text-2xl font-bold capitalize">{nextSessionRecommendations.difficulty}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Focus Areas:</h4>
                <div className="flex flex-wrap gap-2">
                  {nextSessionRecommendations.focusAreas.map((area, index) => (
                    <Badge key={index} variant="secondary">{area}</Badge>
                  ))}
                </div>
              </div>

              {onStartNextInterview && (
                <button
                  onClick={() => onStartNextInterview(nextSessionRecommendations.mode, nextSessionRecommendations.difficulty)}
                  className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <PlayCircle className="h-5 w-5" />
                  Start Recommended Session
                </button>
              )}
            </CardContent>
          </Card>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <h4 className="font-semibold mb-2">Pro Tips for Next Session:</h4>
              <ul className="space-y-1 text-sm">
                <li>• Review your weak areas from this session before starting</li>
                <li>• Focus on implementing 1-2 specific improvements at a time</li>
                <li>• Record yourself to track progress over multiple sessions</li>
                <li>• Practice daily for 15-30 minutes for best results</li>
                <li>• Don&apos;t aim for perfection - consistent improvement is what matters</li>
              </ul>
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  );
}

