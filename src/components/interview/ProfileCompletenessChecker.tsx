'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';
import type { ProfileValidation } from '@/lib/profile-validator';

interface ProfileCompletenessCheckerProps {
  validation: ProfileValidation;
  onImprove?: () => void;
}

export default function ProfileCompletenessChecker({ validation, onImprove }: ProfileCompletenessCheckerProps) {
  const { completenessScore, isComplete, requiredFieldsMissing, optionalFieldsMissing, warnings, recommendations, categoryScores } = validation;
  
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Needs Work';
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Profile Completeness
          <span className={`text-4xl font-bold ${getScoreColor(completenessScore)}`}>
            {completenessScore}%
          </span>
        </CardTitle>
        <CardDescription>
          {getScoreLabel(completenessScore)} - {isComplete ? 'Ready for interview' : 'Complete missing fields for better preparation'}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div>
          <Progress value={completenessScore} className="h-3" />
        </div>
        
        {/* Category Breakdown */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Basic Information</span>
              <span className={getScoreColor(categoryScores.basicInfo)}>{categoryScores.basicInfo}%</span>
            </div>
            <Progress value={categoryScores.basicInfo} className="h-2" />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Academic Details</span>
              <span className={getScoreColor(categoryScores.academicDetails)}>{categoryScores.academicDetails}%</span>
            </div>
            <Progress value={categoryScores.academicDetails} className="h-2" />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Program Details</span>
              <span className={getScoreColor(categoryScores.programDetails)}>{categoryScores.programDetails}%</span>
            </div>
            <Progress value={categoryScores.programDetails} className="h-2" />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Financial Preparation</span>
              <span className={getScoreColor(categoryScores.financialPrep)}>{categoryScores.financialPrep}%</span>
            </div>
            <Progress value={categoryScores.financialPrep} className="h-2" />
          </div>
        </div>
        
        {/* Required Fields Missing */}
        {requiredFieldsMissing.length > 0 && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-semibold mb-2">Required Fields Missing:</p>
              <ul className="list-disc list-inside space-y-1">
                {requiredFieldsMissing.map((field, index) => (
                  <li key={index} className="text-sm">{field}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
        
        {/* Warnings */}
        {warnings.length > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-semibold mb-2">Warnings:</p>
              <ul className="list-disc list-inside space-y-1">
                {warnings.map((warning, index) => (
                  <li key={index} className="text-sm">{warning}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
        
        {/* Optional Fields */}
        {optionalFieldsMissing.length > 0 && requiredFieldsMissing.length === 0 && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <p className="font-semibold mb-2">Optional Fields to Improve:</p>
              <ul className="list-disc list-inside space-y-1">
                {optionalFieldsMissing.slice(0, 5).map((field, index) => (
                  <li key={index} className="text-sm">{field}</li>
                ))}
                {optionalFieldsMissing.length > 5 && (
                  <li className="text-sm text-muted-foreground">+{optionalFieldsMissing.length - 5} more...</li>
                )}
              </ul>
            </AlertDescription>
          </Alert>
        )}
        
        {/* Recommendations */}
        <div className="space-y-2">
          <h4 className="font-semibold flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            Recommendations
          </h4>
          <ul className="space-y-2">
            {recommendations.map((rec, index) => (
              <li key={index} className="text-sm flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
        
        {/* Action Button */}
        {!isComplete && onImprove && (
          <button
            onClick={onImprove}
            className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            Complete Your Profile
          </button>
        )}
      </CardContent>
    </Card>
  );
}

