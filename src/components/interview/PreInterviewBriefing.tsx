'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, FileText, Lightbulb, XCircle, Info } from 'lucide-react';
import { getDocumentChecklist, getCategoryTips, getRedFlagWarnings } from '@/lib/profile-validator';
import type { StudentProfileInfo } from '@/types/firestore';

interface PreInterviewBriefingProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: Partial<StudentProfileInfo> & Record<string, any>;
  interviewMode?: string;
  difficulty?: string;
  onStart: () => void;
}

export default function PreInterviewBriefing({
  open,
  onOpenChange,
  profile,
  interviewMode,
  difficulty,
  onStart,
}: PreInterviewBriefingProps) {
  const [checkedDocuments, setCheckedDocuments] = useState<Record<string, boolean>>({});
  const [acknowledgedRedFlags, setAcknowledgedRedFlags] = useState(false);
  
  const documentChecklist = getDocumentChecklist(profile);
  const redFlagWarnings = getRedFlagWarnings();
  
  const allRequiredDocumentsChecked = documentChecklist.every(category =>
    category.items
      .filter(item => item.required)
      .every(item => checkedDocuments[item.name])
  );
  
  const canStart = allRequiredDocumentsChecked && acknowledgedRedFlags;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Interview Preparation Briefing</DialogTitle>
          <DialogDescription>
            Review these important reminders before your {interviewMode} mode interview
            {difficulty && ` (${difficulty} difficulty)`}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="documents" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="documents">
              <FileText className="h-4 w-4 mr-2" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="tips">
              <Lightbulb className="h-4 w-4 mr-2" />
              Quick Tips
            </TabsTrigger>
            <TabsTrigger value="redflags">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Red Flags
            </TabsTrigger>
            <TabsTrigger value="reminders">
              <Info className="h-4 w-4 mr-2" />
              Reminders
            </TabsTrigger>
          </TabsList>
          
          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                In a real interview, you should have these documents ready. For this practice, just review the checklist.
              </AlertDescription>
            </Alert>
            
            {documentChecklist.map((category, catIndex) => (
              <Card key={catIndex}>
                <CardHeader>
                  <CardTitle className="text-lg">{category.category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {category.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="flex items-start gap-3 p-3 rounded-lg border">
                        <Checkbox
                          id={`doc-${catIndex}-${itemIndex}`}
                          checked={checkedDocuments[item.name] || false}
                          onCheckedChange={(checked) => {
                            setCheckedDocuments(prev => ({
                              ...prev,
                              [item.name]: checked === true,
                            }));
                          }}
                        />
                        <div className="flex-1">
                          <label
                            htmlFor={`doc-${catIndex}-${itemIndex}`}
                            className="font-medium flex items-center gap-2 cursor-pointer"
                          >
                            {item.name}
                            {item.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
                          </label>
                          <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
          
          {/* Tips Tab */}
          <TabsContent value="tips" className="space-y-4">
            {(['general', 'academic', 'financial', 'post_study'] as const).map((category) => (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="text-lg capitalize">
                    {category === 'post_study' ? 'Post-Graduation Plans' : category} Tips
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {getCategoryTips(category).map((tip, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
          
          {/* Red Flags Tab */}
          <TabsContent value="redflags" className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Critical:</strong> Avoid these common mistakes that lead to visa rejection
              </AlertDescription>
            </Alert>
            
            {redFlagWarnings.map((warning, index) => (
              <Card key={index} className="border-red-200">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-red-700">{warning.warning}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          <strong>Why it&apos;s bad:</strong> {warning.why}
                        </p>
                        <p className="text-sm text-green-700 mt-2 flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span><strong>Instead:</strong> {warning.instead}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
              <Checkbox
                id="acknowledge-redflags"
                checked={acknowledgedRedFlags}
                onCheckedChange={(checked) => setAcknowledgedRedFlags(checked === true)}
              />
              <label htmlFor="acknowledge-redflags" className="text-sm font-medium cursor-pointer">
                I understand these red flags and will avoid them in my interview
              </label>
            </div>
          </TabsContent>
          
          {/* Reminders Tab */}
          <TabsContent value="reminders" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>General Reminders</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span><strong>Be Specific:</strong> Use exact numbers, dates, and names. &quot;Around $50,000&quot; becomes &quot;$48,500 total&quot;</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span><strong>Be Consistent:</strong> Remember what you&apos;ve said. Contradictions raise red flags</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span><strong>Be Concise:</strong> Answer directly in 30-60 seconds. Don&apos;t ramble</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span><strong>Be Confident:</strong> Speak clearly, maintain eye contact with camera, sit upright</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span><strong>Be Natural:</strong> Don&apos;t sound memorized. Pause and think if needed</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span><strong>Be Honest:</strong> If you don&apos;t know something, admit it. Don&apos;t make things up</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Interview Mode: {interviewMode || 'Standard'}</CardTitle>
              </CardHeader>
              <CardContent>
                {interviewMode === 'practice' && (
                  <p className="text-sm">Quick 8-question session focusing on essential topics. Good for daily warmup.</p>
                )}
                {interviewMode === 'standard' && (
                  <p className="text-sm">Realistic 12-question interview simulating typical embassy experience. Balanced difficulty.</p>
                )}
                {interviewMode === 'comprehensive' && (
                  <p className="text-sm">In-depth 16-question interview covering all aspects thoroughly. Prepare for longer answers.</p>
                )}
                {interviewMode === 'stress_test' && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Stress Test Mode:</strong> 20 questions with rapid-fire pacing and pressure questions. This simulates worst-case scenarios. Stay calm and composed!
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
            
            {difficulty && (
              <Card>
                <CardHeader>
                  <CardTitle>Difficulty: {difficulty}</CardTitle>
                </CardHeader>
                <CardContent>
                  {difficulty === 'easy' && (
                    <p className="text-sm">Patient officer with straightforward questions. Focus on building confidence.</p>
                  )}
                  {difficulty === 'medium' && (
                    <p className="text-sm">Professional officer with balanced questions. Realistic practice experience.</p>
                  )}
                  {difficulty === 'hard' && (
                    <p className="text-sm">Skeptical officer with challenging questions and follow-ups. Tests your composure.</p>
                  )}
                  {difficulty === 'expert' && (
                    <Alert variant="destructive" className="mt-2">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Expert Mode:</strong> Unpredictable officer with rapid-fire questions, interruptions, and contradiction detection. Maximum pressure!
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
        
        {/* Start Button */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {!allRequiredDocumentsChecked && (
              <span className="text-red-500">✗ Check all required documents</span>
            )}
            {!acknowledgedRedFlags && allRequiredDocumentsChecked && (
              <span className="text-red-500">✗ Acknowledge red flags</span>
            )}
            {canStart && (
              <span className="text-green-500">✓ Ready to start</span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 border rounded-lg hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onOpenChange(false);
                onStart();
              }}
              disabled={!canStart}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                canStart
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              }`}
            >
              Start Interview
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

