'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Target, TrendingUp, Settings } from 'lucide-react';
import { INTERVIEW_MODES, DIFFICULTY_LEVELS } from '@/lib/interview-modes';
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
  onModeChange,
  onDifficultyChange,
}: InterviewModeSelectorProps) {

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Settings className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-medium">Interview Configuration</h3>
            <p className="text-xs text-muted-foreground">Customize difficulty and format</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Interview Mode */}
          <div className="space-y-2">
            <Label htmlFor="mode-select" className="text-sm font-medium flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5" />
              Interview Mode
            </Label>
            <Select value={selectedMode} onValueChange={(v) => onModeChange(v as InterviewMode)}>
              <SelectTrigger id="mode-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="practice">
                  <span className="font-medium">Practice</span>
                  <span className="text-xs text-muted-foreground ml-2">8 questions • 10 min</span>
                </SelectItem>
                <SelectItem value="standard">
                  <span className="font-medium">Standard</span>
                  <span className="text-xs text-muted-foreground ml-2">12 questions • 15 min</span>
                </SelectItem>
                <SelectItem value="comprehensive">
                  <span className="font-medium">Comprehensive</span>
                  <span className="text-xs text-muted-foreground ml-2">16 questions • 20 min</span>
                </SelectItem>
                <SelectItem value="stress_test">
                  <span className="font-medium">Stress Test</span>
                  <span className="text-xs text-muted-foreground ml-2">20 questions • 25 min</span>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {selectedMode === 'practice' && 'Quick practice session perfect for beginners or targeting specific areas'}
              {selectedMode === 'standard' && 'Balanced session simulating a typical embassy interview experience'}
              {selectedMode === 'comprehensive' && 'In-depth interview covering all aspects thoroughly with follow-ups'}
              {selectedMode === 'stress_test' && 'Challenging rapid-fire format designed to test composure under pressure'}
            </p>
          </div>

          {/* Difficulty Level */}
          <div className="space-y-2">
            <Label htmlFor="difficulty-select" className="text-sm font-medium flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" />
              Difficulty Level
            </Label>
            <Select value={selectedDifficulty || 'medium'} onValueChange={(v) => onDifficultyChange(v as DifficultyLevel)}>
              <SelectTrigger id="difficulty-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">
                  <span className="font-medium">Beginner</span>
                  <span className="text-xs text-muted-foreground ml-2">60s/question • Patient officer</span>
                </SelectItem>
                <SelectItem value="medium">
                  <span className="font-medium">Intermediate</span>
                  <span className="text-xs text-muted-foreground ml-2">45s/question • Professional officer</span>
                </SelectItem>
                <SelectItem value="hard">
                  <span className="font-medium">Advanced</span>
                  <span className="text-xs text-muted-foreground ml-2">30s/question • Challenging</span>
                </SelectItem>
                <SelectItem value="expert">
                  <span className="font-medium">Master</span>
                  <span className="text-xs text-muted-foreground ml-2">25s/question • Maximum pressure</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
