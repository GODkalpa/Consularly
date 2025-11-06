'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { AnalyticsDashboard } from '@/lib/performance-analytics';
import { TrendingUp, TrendingDown, Minus, Trophy, Target, AlertCircle, CheckCircle, Lock } from 'lucide-react';

interface PerformanceAnalyticsProps {
  userId: string;
  orgId?: string;
}

export default function PerformanceAnalytics({ userId, orgId }: PerformanceAnalyticsProps) {
  const [dashboard, setDashboard] = useState<AnalyticsDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const params = new URLSearchParams({ userId });
        if (orgId) params.append('orgId', orgId);
        
        const response = await fetch(`/api/interviews/analytics?${params}`);
        if (!response.ok) throw new Error('Failed to fetch analytics');
        
        const data = await response.json();
        setDashboard(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, [userId, orgId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-red-500">Error loading analytics: {error || 'Unknown error'}</p>
        </CardContent>
      </Card>
    );
  }

  const { overview, categoryPerformance, weakAreas, scoreHistory, achievements, nextSteps } = dashboard;

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Interviews</CardDescription>
            <CardTitle className="text-3xl">{overview.totalInterviews}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {overview.completionRate}% completion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Average Score</CardDescription>
            <CardTitle className="text-3xl">{overview.averageScore}</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={overview.averageScore} className="h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Improvement Trend</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              {overview.improvementTrend > 0 ? '+' : ''}{overview.improvementTrend}%
              {overview.improvementTrend > 5 && <TrendingUp className="h-5 w-5 text-green-500" />}
              {overview.improvementTrend < -5 && <TrendingDown className="h-5 w-5 text-red-500" />}
              {Math.abs(overview.improvementTrend) <= 5 && <Minus className="h-5 w-5 text-yellow-500" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {overview.improvementRate > 0 ? '+' : ''}{overview.improvementRate} pts/interview
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Best Score</CardDescription>
            <CardTitle className="text-3xl">{overview.highestScore}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Lowest: {overview.lowestScore}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Score History Chart */}
      {scoreHistory.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Score History</CardTitle>
            <CardDescription>Your performance over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-between gap-2">
              {scoreHistory.slice(-15).map((history, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-primary rounded-t transition-all hover:bg-primary/80"
                    style={{ height: `${history.score}%` }}
                    title={`${new Date(history.date).toLocaleDateString()}: ${history.score}`}
                  />
                  <span className="text-xs text-muted-foreground rotate-45 origin-top-left mt-4">
                    {new Date(history.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Category Performance</CardTitle>
          <CardDescription>Your strength across different question types</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {categoryPerformance.map((category) => (
              <div key={category.category} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{category.category}</span>
                    {category.trend === 'improving' && <TrendingUp className="h-4 w-4 text-green-500" />}
                    {category.trend === 'declining' && <TrendingDown className="h-4 w-4 text-red-500" />}
                    {category.trend === 'stable' && <Minus className="h-4 w-4 text-yellow-500" />}
                  </div>
                  <div className="text-right">
                    <span className="font-bold">{category.averageScore}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      ({category.trend === 'improving' ? '+' : ''}{category.trendPercentage}%)
                    </span>
                  </div>
                </div>
                <Progress value={category.averageScore} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  Best: {category.bestScore} | Worst: {category.worstScore} | Questions: {category.totalQuestions}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Weak Areas */}
      {weakAreas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Areas for Improvement
            </CardTitle>
            <CardDescription>Focus on these to boost your overall performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {weakAreas.map((area, index) => (
                <div key={index} className="space-y-3 pb-6 border-b last:border-b-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold flex items-center gap-2">
                        {area.category}
                        <Badge variant={
                          area.severity === 'critical' ? 'destructive' :
                          area.severity === 'high' ? 'default' :
                          area.severity === 'medium' ? 'secondary' : 'outline'
                        }>
                          {area.severity}
                        </Badge>
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Average score: {area.averageScore} | {area.occurrences} questions
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-green-600">
                        +{area.improvementPotential} potential
                      </p>
                    </div>
                  </div>
                  
                  {area.specificIssues.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Specific Issues:</p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {area.specificIssues.map((issue, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-red-500">•</span>
                            {issue}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {area.recommendations.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Recommendations:</p>
                      <ul className="text-sm space-y-1">
                        {area.recommendations.map((rec, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Achievements
          </CardTitle>
          <CardDescription>
            {achievements.filter(a => a.unlockedAt).length} of {achievements.length} unlocked
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {achievements.slice(0, 12).map((achievement) => (
              <div
                key={achievement.id}
                className={`p-4 rounded-lg border ${
                  achievement.unlockedAt
                    ? 'bg-primary/5 border-primary'
                    : 'bg-muted/50 border-muted'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-3xl">{achievement.icon}</span>
                  {!achievement.unlockedAt && <Lock className="h-4 w-4 text-muted-foreground" />}
                </div>
                <h4 className="font-semibold mb-1">{achievement.name}</h4>
                <p className="text-xs text-muted-foreground mb-2">{achievement.description}</p>
                {!achievement.unlockedAt && (
                  <div className="space-y-1">
                    <Progress value={achievement.progress} className="h-1" />
                    <p className="text-xs text-muted-foreground">{achievement.progress}% complete</p>
                  </div>
                )}
                {achievement.unlockedAt && (
                  <Badge variant="outline" className="text-xs">
                    {achievement.tier}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      {nextSteps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Recommended Next Steps
            </CardTitle>
            <CardDescription>Personalized recommendations for improvement</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {nextSteps.map((step, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium flex-shrink-0">
                    {index + 1}
                  </span>
                  <p className="pt-0.5">{step}</p>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

