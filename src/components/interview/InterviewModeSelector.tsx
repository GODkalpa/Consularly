'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Info, Clock, Target, Zap, Award, User, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import { INTERVIEW_MODES, DIFFICULTY_LEVELS, TOPIC_DRILLS } from '@/lib/interview-modes';
import type { InterviewMode, DifficultyLevel, PracticeTopic } from '@/lib/interview-modes';

interface InterviewModeSelectorProps {
  selectedMode: InterviewMode;
  selectedDifficulty?: DifficultyLevel;
  selectedTopic?: PracticeTopic;
  onModeChange: (mode: InterviewMode) => void;
  onDifficultyChange: (difficulty: DifficultyLevel) => void;
  onTopicChange: (topic: PracticeTopic) => void;
}

export default function InterviewModeSelector({
  selectedMode,
  selectedDifficulty,
  selectedTopic,
  onModeChange,
  onDifficultyChange,
  onTopicChange,
}: InterviewModeSelectorProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const modeConfig = INTERVIEW_MODES[selectedMode];
  const difficultyConfig = selectedDifficulty ? DIFFICULTY_LEVELS[selectedDifficulty] : null;

  return (
    <div className="space-y-6">
      {/* Interview Mode Selection */}
      <Card className="border-2 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
          <CardTitle className="flex items-center gap-2 text-xl">
            <div className="p-2 bg-blue-600 text-white rounded-lg">
              <Target className="h-5 w-5" />
            </div>
            Interview Mode
          </CardTitle>
          <CardDescription>Choose your practice format</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <RadioGroup value={selectedMode} onValueChange={(value) => onModeChange(value as InterviewMode)}>
            <div className="grid gap-3">
              {(Object.keys(INTERVIEW_MODES) as InterviewMode[]).map((mode) => {
                const config = INTERVIEW_MODES[mode];
                const isSelected = selectedMode === mode;
                return (
                  <div 
                    key={mode} 
                    className={`relative rounded-xl border-2 p-4 transition-all cursor-pointer hover:shadow-md ${
                      isSelected 
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/20 shadow-md' 
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <RadioGroupItem value={mode} id={mode} className="mt-1" />
                      <Label htmlFor={mode} className="flex-1 cursor-pointer">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-base">{config.name}</span>
                              {mode === 'stress_test' && (
                                <Badge variant="destructive" className="text-xs">Challenging</Badge>
                              )}
                              {mode === 'practice' && (
                                <Badge className="text-xs bg-green-600">Beginner Friendly</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">{config.description}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                                <Clock className="h-3 w-3" />
                                {config.estimatedDuration} min
                              </span>
                              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">{config.questionCount} questions</span>
                              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">{config.timePerQuestion}s per question</span>
                            </div>
                          </div>
                        </div>
                      </Label>
                    </div>
                  </div>
                );
              })}
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Difficulty Level Selection */}
      <Card className="border-2 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
          <CardTitle className="flex items-center gap-2 text-xl">
            <div className="p-2 bg-purple-600 text-white rounded-lg">
              <TrendingUp className="h-5 w-5" />
            </div>
            Difficulty Level
          </CardTitle>
          <CardDescription>Select officer attitude and question complexity</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <RadioGroup 
            value={selectedDifficulty || 'medium'} 
            onValueChange={(value) => onDifficultyChange(value as DifficultyLevel)}
          >
            <div className="grid gap-3">
              {(Object.keys(DIFFICULTY_LEVELS) as DifficultyLevel[]).map((level) => {
                const config = DIFFICULTY_LEVELS[level];
                const isSelected = (selectedDifficulty || 'medium') === level;
                const difficultyColors: Record<DifficultyLevel, string> = {
                  easy: 'border-green-600 bg-green-50/50 dark:bg-green-950/20',
                  medium: 'border-yellow-600 bg-yellow-50/50 dark:bg-yellow-950/20',
                  hard: 'border-orange-600 bg-orange-50/50 dark:bg-orange-950/20',
                  expert: 'border-red-600 bg-red-50/50 dark:bg-red-950/20',
                };
                return (
                  <div 
                    key={level} 
                    className={`relative rounded-xl border-2 p-4 transition-all cursor-pointer hover:shadow-md ${
                      isSelected 
                        ? difficultyColors[level] + ' shadow-md'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <RadioGroupItem value={level} id={level} className="mt-1" />
                      <Label htmlFor={level} className="flex-1 cursor-pointer">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-base">{config.name}</span>
                              {level === 'expert' && (
                                <Badge variant="destructive" className="text-xs">Expert</Badge>
                              )}
                              {level === 'easy' && (
                                <Badge className="text-xs bg-green-600">Recommended for beginners</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">{config.description}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">{config.timePerQuestion}s per question</span>
                              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">Pressure Level: {config.pressureLevel}/5</span>
                              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">Follow-ups: {Math.round(config.followUpFrequency * 100)}%</span>
                            </div>
                          </div>
                        </div>
                      </Label>
                    </div>
                  </div>
                );
              })}
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Advanced Options Toggle */}
      <Button
        onClick={() => setShowAdvanced(!showAdvanced)}
        variant="outline"
        className="w-full justify-between border-2 h-auto py-3"
      >
        <span className="flex items-center gap-2">
          <Info className="h-4 w-4" />
          {showAdvanced ? 'Hide' : 'Show'} Advanced Options (Topic Focus)
        </span>
        {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </Button>

      {showAdvanced && (
        <>
          {/* Topic Drill Selection (only for Practice mode) */}
          {selectedMode === 'practice' && (
            <Card className="border-2 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <div className="p-2 bg-amber-600 text-white rounded-lg">
                    <Award className="h-5 w-5" />
                  </div>
                  Targeted Topic Practice (Optional)
                </CardTitle>
                <CardDescription>
                  Focus on specific areas. Leave unselected for balanced practice.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <RadioGroup 
                  value={selectedTopic || ''} 
                  onValueChange={(value) => onTopicChange(value as PracticeTopic)}
                >
                  <div className="grid gap-3">
                    <div 
                      className={`relative rounded-xl border-2 p-4 transition-all cursor-pointer hover:shadow-md ${
                        !selectedTopic
                          ? 'border-amber-600 bg-amber-50/50 dark:bg-amber-950/20 shadow-md'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <RadioGroupItem value="" id="no-topic" className="mt-1" />
                        <Label htmlFor="no-topic" className="flex-1 cursor-pointer">
                          <div className="font-semibold text-base">Balanced Practice</div>
                          <p className="text-sm text-muted-foreground">
                            Cover all categories evenly
                          </p>
                        </Label>
                      </div>
                    </div>
                    {(Object.keys(TOPIC_DRILLS) as PracticeTopic[]).map((topic) => {
                      const config = TOPIC_DRILLS[topic];
                      const isSelected = selectedTopic === topic;
                      return (
                        <div 
                          key={topic}
                          className={`relative rounded-xl border-2 p-4 transition-all cursor-pointer hover:shadow-md ${
                            isSelected
                              ? 'border-amber-600 bg-amber-50/50 dark:bg-amber-950/20 shadow-md'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <RadioGroupItem value={topic} id={topic} className="mt-1" />
                            <Label htmlFor={topic} className="flex-1 cursor-pointer">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="font-semibold text-base">{config.name}</div>
                                  <p className="text-sm text-muted-foreground mb-2">
                                    {config.description}
                                  </p>
                                  <div className="text-xs text-muted-foreground px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded inline-block">
                                    Focus: {config.focusAreas.slice(0, 2).join(', ')}
                                    {config.focusAreas.length > 2 && ` +${config.focusAreas.length - 2} more`}
                                  </div>
                                </div>
                              </div>
                            </Label>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Summary Card */}
      <Card className="border-2 shadow-lg bg-gradient-to-br from-gray-50 to-slate-100 dark:from-gray-900 dark:to-slate-900">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="p-1.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg">
              <Zap className="h-4 w-4" />
            </div>
            Your Interview Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-lg">
              <span className="text-sm font-medium text-muted-foreground">Mode:</span>
              <span className="font-semibold text-base">{modeConfig.name}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-lg">
              <span className="text-sm font-medium text-muted-foreground">Questions:</span>
              <span className="font-semibold text-base">{modeConfig.questionCount}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-lg">
              <span className="text-sm font-medium text-muted-foreground">Duration:</span>
              <span className="font-semibold text-base">~{modeConfig.estimatedDuration} minutes</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-lg">
              <span className="text-sm font-medium text-muted-foreground">Difficulty:</span>
              <span className="font-semibold text-base">
                {difficultyConfig?.name || 'Intermediate'}
              </span>
            </div>
            {selectedTopic && (
              <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                <span className="text-sm font-medium text-muted-foreground">Focus:</span>
                <span className="font-semibold text-base">{TOPIC_DRILLS[selectedTopic].name}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

