/**
 * Performance Analytics Engine
 * Analyzes interview performance over time and identifies improvement areas
 */

import { InterviewWithId } from '@/types/firestore';

export interface PerformanceStats {
  totalInterviews: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  improvementTrend: number; // Percentage change from first to latest
  improvementRate: number; // Points per interview
  completionRate: number; // Percentage of interviews completed vs. started
}

export interface CategoryPerformance {
  category: string;
  averageScore: number;
  totalQuestions: number;
  trend: 'improving' | 'declining' | 'stable';
  trendPercentage: number;
  lastScore: number;
  bestScore: number;
  worstScore: number;
}

export interface WeakArea {
  category: string;
  dimension?: string;
  averageScore: number;
  occurrences: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  improvementPotential: number; // 0-100, how much improvement is possible
  specificIssues: string[];
  recommendations: string[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold' | 'diamond' | 'platinum';
  unlockedAt?: string;
  progress?: number; // 0-100
  requirement: string;
}

export interface ScoreHistory {
  date: string;
  score: number;
  mode: string;
  difficulty?: string;
  questionCount: number;
  categoryScores?: Record<string, number>;
}

export interface ComparativeStats {
  yourScore: number;
  averageScore: number;
  percentile: number; // 0-100, where you rank
  topPerformers: number; // Score of top 10%
  improvementNeeded: number; // Points to reach average
}

export interface AnalyticsDashboard {
  overview: PerformanceStats;
  categoryPerformance: CategoryPerformance[];
  weakAreas: WeakArea[];
  scoreHistory: ScoreHistory[];
  achievements: Achievement[];
  comparative?: ComparativeStats;
  nextSteps: string[];
}

// ===== ACHIEVEMENT DEFINITIONS =====

export const ACHIEVEMENTS: Achievement[] = [
  // First Steps
  {
    id: 'first_interview',
    name: 'First Steps',
    description: 'Complete your first interview',
    icon: '🎯',
    tier: 'bronze',
    requirement: 'Complete 1 interview',
  },
  {
    id: 'practice_warrior',
    name: 'Practice Warrior',
    description: 'Complete 5 practice sessions',
    icon: '⚔️',
    tier: 'bronze',
    requirement: 'Complete 5 interviews',
  },
  {
    id: 'dedicated_learner',
    name: 'Dedicated Learner',
    description: 'Complete 10 interview sessions',
    icon: '📚',
    tier: 'silver',
    requirement: 'Complete 10 interviews',
  },
  {
    id: 'interview_master',
    name: 'Interview Master',
    description: 'Complete 25 interview sessions',
    icon: '🎓',
    tier: 'gold',
    requirement: 'Complete 25 interviews',
  },
  {
    id: 'interview_legend',
    name: 'Interview Legend',
    description: 'Complete 50 interview sessions',
    icon: '👑',
    tier: 'diamond',
    requirement: 'Complete 50 interviews',
  },
  
  // Score-based
  {
    id: 'good_start',
    name: 'Good Start',
    description: 'Score above 70 in any interview',
    icon: '✨',
    tier: 'bronze',
    requirement: 'Score 70+ points',
  },
  {
    id: 'solid_performance',
    name: 'Solid Performance',
    description: 'Score above 80 in any interview',
    icon: '⭐',
    tier: 'silver',
    requirement: 'Score 80+ points',
  },
  {
    id: 'excellent_interview',
    name: 'Excellent Interview',
    description: 'Score above 90 in any interview',
    icon: '🌟',
    tier: 'gold',
    requirement: 'Score 90+ points',
  },
  {
    id: 'perfect_score',
    name: 'Perfect Score',
    description: 'Achieve a score of 95 or higher',
    icon: '💎',
    tier: 'diamond',
    requirement: 'Score 95+ points',
  },
  
  // Improvement-based
  {
    id: 'improving',
    name: 'On the Rise',
    description: 'Improve your score by 10 points',
    icon: '📈',
    tier: 'bronze',
    requirement: 'Improve by 10+ points',
  },
  {
    id: 'breakthrough',
    name: 'Breakthrough',
    description: 'Improve your score by 20 points',
    icon: '🚀',
    tier: 'silver',
    requirement: 'Improve by 20+ points',
  },
  {
    id: 'transformation',
    name: 'Transformation',
    description: 'Improve your score by 30 points',
    icon: '🔥',
    tier: 'gold',
    requirement: 'Improve by 30+ points',
  },
  
  // Category mastery
  {
    id: 'financial_expert',
    name: 'Financial Expert',
    description: 'Average 85+ on financial questions',
    icon: '💰',
    tier: 'gold',
    requirement: 'Average 85+ in Financial category',
  },
  {
    id: 'academic_ace',
    name: 'Academic Ace',
    description: 'Average 85+ on academic questions',
    icon: '📖',
    tier: 'gold',
    requirement: 'Average 85+ in Academic category',
  },
  {
    id: 'intent_champion',
    name: 'Intent Champion',
    description: 'Average 85+ on return intent questions',
    icon: '🏠',
    tier: 'gold',
    requirement: 'Average 85+ in Post-Study category',
  },
  
  // Consistency
  {
    id: 'consistent_performer',
    name: 'Consistent Performer',
    description: 'Score above 75 in 5 consecutive interviews',
    icon: '🎯',
    tier: 'silver',
    requirement: 'Score 75+ in 5 consecutive interviews',
  },
  {
    id: 'rock_solid',
    name: 'Rock Solid',
    description: 'Score above 80 in 10 consecutive interviews',
    icon: '🗿',
    tier: 'gold',
    requirement: 'Score 80+ in 10 consecutive interviews',
  },
  
  // Special
  {
    id: 'stress_tested',
    name: 'Stress Tested',
    description: 'Complete a Stress Test mode interview',
    icon: '💪',
    tier: 'silver',
    requirement: 'Complete Stress Test mode',
  },
  {
    id: 'stress_master',
    name: 'Stress Master',
    description: 'Score 80+ in Stress Test mode',
    icon: '🦾',
    tier: 'gold',
    requirement: 'Score 80+ in Stress Test',
  },
  {
    id: 'comprehensive_champion',
    name: 'Comprehensive Champion',
    description: 'Score 85+ in Comprehensive mode',
    icon: '🏆',
    tier: 'gold',
    requirement: 'Score 85+ in Comprehensive',
  },
  {
    id: 'all_rounder',
    name: 'All-Rounder',
    description: 'Score 80+ in all interview modes',
    icon: '🌐',
    tier: 'diamond',
    requirement: 'Score 80+ in all modes',
  },
];

// ===== ANALYTICS FUNCTIONS =====

/**
 * Calculate overall performance statistics
 */
export function calculatePerformanceStats(interviews: InterviewWithId[]): PerformanceStats {
  if (interviews.length === 0) {
    return {
      totalInterviews: 0,
      averageScore: 0,
      highestScore: 0,
      lowestScore: 0,
      improvementTrend: 0,
      improvementRate: 0,
      completionRate: 0,
    };
  }
  
  const completedInterviews = interviews.filter(i => i.status === 'completed');
  const scores = completedInterviews.map(i => i.score);
  
  const averageScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;
  const highestScore = Math.max(...scores);
  const lowestScore = Math.min(...scores);
  
  // Calculate improvement trend (first vs. last 3 interviews)
  let improvementTrend = 0;
  let improvementRate = 0;
  
  if (completedInterviews.length >= 4) {
    const first3 = completedInterviews.slice(0, 3).map(i => i.score);
    const last3 = completedInterviews.slice(-3).map(i => i.score);
    
    const first3Avg = first3.reduce((sum, s) => sum + s, 0) / first3.length;
    const last3Avg = last3.reduce((sum, s) => sum + s, 0) / last3.length;
    
    improvementTrend = ((last3Avg - first3Avg) / first3Avg) * 100;
    improvementRate = (last3Avg - first3Avg) / completedInterviews.length;
  } else if (completedInterviews.length >= 2) {
    const firstScore = completedInterviews[0].score;
    const lastScore = completedInterviews[completedInterviews.length - 1].score;
    improvementTrend = ((lastScore - firstScore) / firstScore) * 100;
    improvementRate = (lastScore - firstScore) / completedInterviews.length;
  }
  
  const completionRate = (completedInterviews.length / interviews.length) * 100;
  
  return {
    totalInterviews: completedInterviews.length,
    averageScore: Math.round(averageScore),
    highestScore,
    lowestScore,
    improvementTrend: Math.round(improvementTrend),
    improvementRate: parseFloat(improvementRate.toFixed(1)),
    completionRate: Math.round(completionRate),
  };
}

/**
 * Analyze performance by category
 */
export function analyzeCategoryPerformance(interviews: InterviewWithId[]): CategoryPerformance[] {
  const completedInterviews = interviews.filter(i => i.status === 'completed');
  
  if (completedInterviews.length === 0) return [];
  
  // Extract category scores from interviews
  const categoryData: Record<string, { scores: number[]; dates: string[] }> = {};
  
  completedInterviews.forEach(interview => {
    // Get category scores from conversationHistory or scoreDetails
    const categories = ['financial', 'academic', 'post_study', 'personal'];
    
    categories.forEach(category => {
      if (!categoryData[category]) {
        categoryData[category] = { scores: [], dates: [] };
      }
      
      // Extract score for this category (placeholder - would need actual category scoring)
      const categoryScore = interview.score; // Simplified - actual implementation would extract per-category
      categoryData[category].scores.push(categoryScore);
      categoryData[category].dates.push(interview.startTime.toDate().toISOString());
    });
  });
  
  // Analyze each category
  const performance: CategoryPerformance[] = [];
  
  for (const [category, data] of Object.entries(categoryData)) {
    const scores = data.scores;
    if (scores.length === 0) continue;
    
    const averageScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    const lastScore = scores[scores.length - 1];
    const firstScore = scores[0];
    const bestScore = Math.max(...scores);
    const worstScore = Math.min(...scores);
    
    // Calculate trend
    let trend: 'improving' | 'declining' | 'stable' = 'stable';
    let trendPercentage = 0;
    
    if (scores.length >= 2) {
      const recentAvg = scores.slice(-3).reduce((sum, s) => sum + s, 0) / Math.min(3, scores.length);
      const olderAvg = scores.slice(0, 3).reduce((sum, s) => sum + s, 0) / Math.min(3, scores.length);
      
      trendPercentage = ((recentAvg - olderAvg) / olderAvg) * 100;
      
      if (trendPercentage > 5) trend = 'improving';
      else if (trendPercentage < -5) trend = 'declining';
    }
    
    performance.push({
      category: category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      averageScore: Math.round(averageScore),
      totalQuestions: scores.length,
      trend,
      trendPercentage: Math.round(trendPercentage),
      lastScore,
      bestScore,
      worstScore,
    });
  }
  
  return performance.sort((a, b) => a.averageScore - b.averageScore); // Weakest first
}

/**
 * Identify weak areas needing improvement
 */
export function identifyWeakAreas(interviews: InterviewWithId[]): WeakArea[] {
  const categoryPerformance = analyzeCategoryPerformance(interviews);
  const weakAreas: WeakArea[] = [];
  
  // Categories with average score below 70 are weak areas
  categoryPerformance.forEach(cat => {
    if (cat.averageScore < 75) {
      let severity: WeakArea['severity'];
      if (cat.averageScore < 50) severity = 'critical';
      else if (cat.averageScore < 60) severity = 'high';
      else if (cat.averageScore < 70) severity = 'medium';
      else severity = 'low';
      
      const improvementPotential = 100 - cat.averageScore;
      
      weakAreas.push({
        category: cat.category,
        averageScore: cat.averageScore,
        occurrences: cat.totalQuestions,
        severity,
        improvementPotential,
        specificIssues: generateSpecificIssues(cat),
        recommendations: generateRecommendations(cat),
      });
    }
  });
  
  return weakAreas.sort((a, b) => {
    // Sort by severity first, then by improvement potential
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    if (severityOrder[a.severity] !== severityOrder[b.severity]) {
      return severityOrder[a.severity] - severityOrder[b.severity];
    }
    return b.improvementPotential - a.improvementPotential;
  });
}

/**
 * Generate specific issues for a weak category
 */
function generateSpecificIssues(cat: CategoryPerformance): string[] {
  const issues: string[] = [];
  
  if (cat.trend === 'declining') {
    issues.push(`Performance declining by ${Math.abs(cat.trendPercentage)}%`);
  }
  
  if (cat.averageScore < 60) {
    issues.push('Consistently low scores indicate fundamental gaps');
  }
  
  if (cat.worstScore < 40) {
    issues.push('Some answers scored critically low');
  }
  
  // Category-specific issues
  if (cat.category.toLowerCase().includes('financial')) {
    issues.push('May lack specific dollar amounts or sponsor details');
  } else if (cat.category.toLowerCase().includes('academic')) {
    issues.push('May need more specific program details or course names');
  } else if (cat.category.toLowerCase().includes('post')) {
    issues.push('Return intent may seem unclear or unconvincing');
  }
  
  return issues;
}

/**
 * Generate recommendations for improving a weak category
 */
function generateRecommendations(cat: CategoryPerformance): string[] {
  const recommendations: string[] = [];
  
  // Category-specific recommendations
  if (cat.category.toLowerCase().includes('financial')) {
    recommendations.push('Practice stating exact dollar amounts for all costs');
    recommendations.push('Memorize sponsor\'s occupation and annual income');
    recommendations.push('Prepare to explain source of all funds with evidence');
  } else if (cat.category.toLowerCase().includes('academic')) {
    recommendations.push('Research specific courses and professors in your program');
    recommendations.push('Connect your program choice to clear career goals');
    recommendations.push('Practice explaining why US education is necessary');
  } else if (cat.category.toLowerCase().includes('post')) {
    recommendations.push('Name specific companies or positions in Nepal');
    recommendations.push('Highlight family/property ties to Nepal');
    recommendations.push('Avoid mentioning US job market or salaries');
  }
  
  // General recommendations based on performance
  if (cat.trend === 'declining') {
    recommendations.push('Take a targeted practice drill focused on this category');
  }
  
  if (cat.averageScore < 60) {
    recommendations.push('Study model answers for this category');
    recommendations.push('Practice daily with 5-10 questions in this area');
  }
  
  return recommendations;
}

/**
 * Build score history for visualization
 */
export function buildScoreHistory(interviews: InterviewWithId[]): ScoreHistory[] {
  return interviews
    .filter(i => i.status === 'completed')
    .map(i => ({
      date: i.startTime.toDate().toISOString(),
      score: i.score,
      mode: i.interviewMode || 'standard',
      difficulty: i.difficulty,
      questionCount: i.completedQuestions || 8,
      categoryScores: i.detailedScores ? {
        content: Math.round(((i.detailedScores.clarity || 0) + (i.detailedScores.specificity || 0) + 
                            (i.detailedScores.relevance || 0) + (i.detailedScores.depth || 0) + 
                            (i.detailedScores.consistency || 0)) / 5),
        delivery: Math.round(((i.detailedScores.fluency || 0) + (i.detailedScores.confidence || 0) + 
                             (i.detailedScores.pace || 0) + (i.detailedScores.articulation || 0)) / 4),
        nonVerbal: Math.round(((i.detailedScores.posture || 0) + (i.detailedScores.eyeContact || 0) + 
                              (i.detailedScores.composure || 0)) / 3),
      } : undefined,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

/**
 * Check which achievements have been unlocked
 */
export function checkAchievements(interviews: InterviewWithId[]): Achievement[] {
  const completedInterviews = interviews.filter(i => i.status === 'completed');
  const scores = completedInterviews.map(i => i.score);
  
  return ACHIEVEMENTS.map(achievement => {
    let unlocked = false;
    let progress = 0;
    
    // Check achievement criteria
    switch (achievement.id) {
      case 'first_interview':
        unlocked = completedInterviews.length >= 1;
        progress = Math.min(100, completedInterviews.length * 100);
        break;
        
      case 'practice_warrior':
        unlocked = completedInterviews.length >= 5;
        progress = Math.min(100, (completedInterviews.length / 5) * 100);
        break;
        
      case 'dedicated_learner':
        unlocked = completedInterviews.length >= 10;
        progress = Math.min(100, (completedInterviews.length / 10) * 100);
        break;
        
      case 'interview_master':
        unlocked = completedInterviews.length >= 25;
        progress = Math.min(100, (completedInterviews.length / 25) * 100);
        break;
        
      case 'interview_legend':
        unlocked = completedInterviews.length >= 50;
        progress = Math.min(100, (completedInterviews.length / 50) * 100);
        break;
        
      case 'good_start':
        unlocked = scores.some(s => s >= 70);
        progress = Math.min(100, Math.max(...scores, 0) / 70 * 100);
        break;
        
      case 'solid_performance':
        unlocked = scores.some(s => s >= 80);
        progress = Math.min(100, Math.max(...scores, 0) / 80 * 100);
        break;
        
      case 'excellent_interview':
        unlocked = scores.some(s => s >= 90);
        progress = Math.min(100, Math.max(...scores, 0) / 90 * 100);
        break;
        
      case 'perfect_score':
        unlocked = scores.some(s => s >= 95);
        progress = Math.min(100, Math.max(...scores, 0) / 95 * 100);
        break;
        
      case 'improving':
        if (scores.length >= 2) {
          const improvement = Math.max(...scores) - scores[0];
          unlocked = improvement >= 10;
          progress = Math.min(100, (improvement / 10) * 100);
        }
        break;
        
      case 'breakthrough':
        if (scores.length >= 2) {
          const improvement = Math.max(...scores) - scores[0];
          unlocked = improvement >= 20;
          progress = Math.min(100, (improvement / 20) * 100);
        }
        break;
        
      case 'transformation':
        if (scores.length >= 2) {
          const improvement = Math.max(...scores) - scores[0];
          unlocked = improvement >= 30;
          progress = Math.min(100, (improvement / 30) * 100);
        }
        break;
        
      case 'stress_tested':
        unlocked = completedInterviews.some(i => i.interviewMode === 'stress_test');
        progress = unlocked ? 100 : 0;
        break;
        
      case 'stress_master':
        unlocked = completedInterviews.some(i => i.interviewMode === 'stress_test' && i.score >= 80);
        const stressScores = completedInterviews
          .filter(i => i.interviewMode === 'stress_test')
          .map(i => i.score);
        progress = stressScores.length > 0 ? Math.min(100, Math.max(...stressScores) / 80 * 100) : 0;
        break;
    }
    
    return {
      ...achievement,
      unlockedAt: unlocked ? completedInterviews[completedInterviews.length - 1].startTime.toDate().toISOString() : undefined,
      progress: Math.round(progress),
    };
  }).sort((a, b) => {
    // Unlocked first, then by progress
    if (a.unlockedAt && !b.unlockedAt) return -1;
    if (!a.unlockedAt && b.unlockedAt) return 1;
    return (b.progress || 0) - (a.progress || 0);
  });
}

/**
 * Generate next steps recommendations
 */
export function generateNextSteps(
  stats: PerformanceStats,
  weakAreas: WeakArea[],
  achievements: Achievement[]
): string[] {
  const nextSteps: string[] = [];
  
  // Based on total interviews
  if (stats.totalInterviews === 0) {
    nextSteps.push('Start your first interview to establish a baseline');
  } else if (stats.totalInterviews < 5) {
    nextSteps.push(`Complete ${5 - stats.totalInterviews} more interview(s) to unlock detailed analytics`);
  }
  
  // Based on average score
  if (stats.averageScore < 60) {
    nextSteps.push('Focus on fundamentals: practice in Easy mode to build confidence');
  } else if (stats.averageScore < 75) {
    nextSteps.push('Your foundation is solid. Move to Medium difficulty for more realistic practice');
  } else if (stats.averageScore < 85) {
    nextSteps.push('You\'re performing well! Challenge yourself with Hard or Comprehensive mode');
  } else {
    nextSteps.push('Excellent progress! Try Stress Test mode to prepare for worst-case scenarios');
  }
  
  // Based on weak areas
  if (weakAreas.length > 0) {
    const topWeakArea = weakAreas[0];
    nextSteps.push(`Take a topic drill focused on ${topWeakArea.category} to address your weakest area`);
  }
  
  // Based on improvement trend
  if (stats.totalInterviews >= 3) {
    if (stats.improvementTrend > 15) {
      nextSteps.push('Great momentum! Keep practicing to maintain your improvement trajectory');
    } else if (stats.improvementTrend < -10) {
      nextSteps.push('Recent scores are declining. Review your past feedback and focus on weak areas');
    } else if (stats.improvementTrend < 5 && stats.totalInterviews >= 10) {
      nextSteps.push('You\'ve plateaued. Try a different interview mode or increase difficulty');
    }
  }
  
  // Based on achievements
  const unlockedCount = achievements.filter(a => a.unlockedAt).length;
  const nextAchievement = achievements.find(a => !a.unlockedAt && (a.progress || 0) > 50);
  
  if (nextAchievement) {
    nextSteps.push(`You're ${100 - (nextAchievement.progress || 0)}% away from unlocking "${nextAchievement.name}"`);
  }
  
  // Always suggest variety
  if (stats.totalInterviews >= 5) {
    nextSteps.push('Practice with different officer personas to prepare for any interviewer style');
  }
  
  return nextSteps.slice(0, 5); // Top 5 recommendations
}

/**
 * Generate complete analytics dashboard
 */
export function generateAnalyticsDashboard(interviews: InterviewWithId[]): AnalyticsDashboard {
  const overview = calculatePerformanceStats(interviews);
  const categoryPerformance = analyzeCategoryPerformance(interviews);
  const weakAreas = identifyWeakAreas(interviews);
  const scoreHistory = buildScoreHistory(interviews);
  const achievements = checkAchievements(interviews);
  const nextSteps = generateNextSteps(overview, weakAreas, achievements);
  
  return {
    overview,
    categoryPerformance,
    weakAreas,
    scoreHistory,
    achievements,
    nextSteps,
  };
}

