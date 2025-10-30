"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { GraduationCap, School, Calendar, DollarSign, BookOpen, Target, CheckCircle2, Globe } from 'lucide-react'
import type { DegreeLevel, StudentProfileInfo } from '@/lib/database'

interface ProfileSetupFormProps {
  initialData?: StudentProfileInfo
  initialCountry?: 'usa' | 'uk' | 'france'
  onSubmit: (data: StudentProfileInfo & { interviewCountry: 'usa' | 'uk' | 'france' }) => void | Promise<void>
  isLoading?: boolean
  showCard?: boolean // Whether to wrap in a card
  title?: string
  description?: string
}

export function ProfileSetupForm({
  initialData,
  initialCountry,
  onSubmit,
  isLoading = false,
  showCard = true,
  title = "Complete Your Profile",
  description = "Please provide information about your intended program to get personalized interview questions."
}: ProfileSetupFormProps) {
  const [selectedCountry, setSelectedCountry] = useState<'usa' | 'uk' | 'france' | undefined>(initialCountry)
  const [formData, setFormData] = useState<StudentProfileInfo>({
    degreeLevel: initialData?.degreeLevel || undefined,
    programName: initialData?.programName || '',
    universityName: initialData?.universityName || '',
    programLength: initialData?.programLength || '',
    programCost: initialData?.programCost || '',
    fieldOfStudy: initialData?.fieldOfStudy || '',
    intendedMajor: initialData?.intendedMajor || '',
  })

  const [errors, setErrors] = useState<Partial<Record<keyof StudentProfileInfo, string>>>({})

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof StudentProfileInfo, string>> = {}

    // Only validate profile fields for USA
    if (selectedCountry === 'usa') {
      if (!formData.degreeLevel) {
        newErrors.degreeLevel = 'Degree level is required'
      }
      if (!formData.programName?.trim()) {
        newErrors.programName = 'Program name is required'
      }
      if (!formData.universityName?.trim()) {
        newErrors.universityName = 'University name is required'
      }
      if (!formData.programLength?.trim()) {
        newErrors.programLength = 'Program length is required'
      }
      if (!formData.programCost?.trim()) {
        newErrors.programCost = 'Program cost is required'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCountry) return
    if (!validateForm()) return
    
    // For UK/France, pass empty profile. For USA, pass full profile
    const submitData = selectedCountry === 'usa' ? formData : {}
    await onSubmit({ ...submitData, interviewCountry: selectedCountry, profileCompleted: true })
  }

  const handleInputChange = (field: keyof StudentProfileInfo, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Country Selection - Always shown first */}
      <div className="space-y-5">
        <div className="flex items-center gap-2 pb-2">
          <div className="h-1 w-1 rounded-full bg-primary" />
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Select Interview Country</h3>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="country" className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            Which country interview would you like to prepare for? <span className="text-destructive">*</span>
          </Label>
          <Select
            value={selectedCountry}
            onValueChange={(value) => setSelectedCountry(value as 'usa' | 'uk' | 'france')}
          >
            <SelectTrigger className="h-11 border-muted-foreground/20">
              <SelectValue placeholder="Select interview country" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="usa">🇺🇸 United States (F1 Student Visa)</SelectItem>
              <SelectItem value="uk">🇬🇧 United Kingdom (Student Visa)</SelectItem>
              <SelectItem value="france">🇫🇷 France (Student Visa)</SelectItem>
            </SelectContent>
          </Select>
          {!selectedCountry && (
            <p className="text-sm text-muted-foreground">Select a country to continue</p>
          )}
        </div>
      </div>

      {/* USA-specific Profile Fields */}
      {selectedCountry === 'usa' && (
      <>
      <div className="space-y-5 pt-2 border-t">
        <div className="flex items-center gap-2 pb-2">
          <div className="h-1 w-1 rounded-full bg-primary" />
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Required Information</h3>
        </div>

        {/* Degree Level */}
        <div className="space-y-2">
          <Label htmlFor="degreeLevel" className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-primary" />
            Degree Level <span className="text-destructive">*</span>
          </Label>
          <Select
            value={formData.degreeLevel}
            onValueChange={(value) => handleInputChange('degreeLevel', value as DegreeLevel)}
          >
            <SelectTrigger className={`h-11 ${errors.degreeLevel ? 'border-destructive' : 'border-muted-foreground/20'}`}>
              <SelectValue placeholder="Select your degree level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="undergraduate">🎓 Undergraduate (Bachelor&apos;s)</SelectItem>
              <SelectItem value="graduate">📚 Graduate (Master&apos;s)</SelectItem>
              <SelectItem value="doctorate">🔬 Doctorate (PhD)</SelectItem>
              <SelectItem value="other">📖 Other</SelectItem>
            </SelectContent>
          </Select>
          {errors.degreeLevel && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <span className="text-xs">⚠</span> {errors.degreeLevel}
            </p>
          )}
        </div>

        {/* Program Name */}
        <div className="space-y-2">
          <Label htmlFor="programName" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            Program Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="programName"
            placeholder="e.g., Master's in Computer Science"
            value={formData.programName}
            onChange={(e) => handleInputChange('programName', e.target.value)}
            className={`h-11 ${errors.programName ? 'border-destructive' : 'border-muted-foreground/20'}`}
          />
          {errors.programName && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <span className="text-xs">⚠</span> {errors.programName}
            </p>
          )}
        </div>

        {/* University Name */}
        <div className="space-y-2">
          <Label htmlFor="universityName" className="flex items-center gap-2">
            <School className="h-4 w-4 text-primary" />
            University Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="universityName"
            placeholder="e.g., Stanford University"
            value={formData.universityName}
            onChange={(e) => handleInputChange('universityName', e.target.value)}
            className={`h-11 ${errors.universityName ? 'border-destructive' : 'border-muted-foreground/20'}`}
          />
          {errors.universityName && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <span className="text-xs">⚠</span> {errors.universityName}
            </p>
          )}
        </div>

        {/* Two column grid for shorter fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Program Length */}
          <div className="space-y-2">
            <Label htmlFor="programLength" className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Program Length <span className="text-destructive">*</span>
            </Label>
            <Input
              id="programLength"
              placeholder="e.g., 2 years"
              value={formData.programLength}
              onChange={(e) => handleInputChange('programLength', e.target.value)}
              className={`h-11 ${errors.programLength ? 'border-destructive' : 'border-muted-foreground/20'}`}
            />
            {errors.programLength && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <span className="text-xs">⚠</span> {errors.programLength}
              </p>
            )}
          </div>

          {/* Program Cost */}
          <div className="space-y-2">
            <Label htmlFor="programCost" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              Total Cost <span className="text-destructive">*</span>
            </Label>
            <Input
              id="programCost"
              placeholder="e.g., $50,000"
              value={formData.programCost}
              onChange={(e) => handleInputChange('programCost', e.target.value)}
              className={`h-11 ${errors.programCost ? 'border-destructive' : 'border-muted-foreground/20'}`}
            />
            {errors.programCost && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <span className="text-xs">⚠</span> {errors.programCost}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Optional Fields Section - USA only */}
      <div className="space-y-5 pt-2">
        <div className="flex items-center gap-2 pb-2 border-t pt-6">
          <div className="h-1 w-1 rounded-full bg-muted-foreground" />
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Optional Details</h3>
        </div>

        <div className="space-y-2">
          <Label htmlFor="fieldOfStudy" className="flex items-center gap-2">
            <Target className="h-4 w-4 text-muted-foreground" />
            Field of Study
          </Label>
          <Input
            id="fieldOfStudy"
            placeholder="e.g., Computer Science, Engineering"
            value={formData.fieldOfStudy}
            onChange={(e) => handleInputChange('fieldOfStudy', e.target.value)}
            className="h-11 border-muted-foreground/20"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="intendedMajor" className="flex items-center gap-2">
            <Target className="h-4 w-4 text-muted-foreground" />
            Intended Major/Specialization
          </Label>
          <Input
            id="intendedMajor"
            placeholder="e.g., Artificial Intelligence, Data Science"
            value={formData.intendedMajor}
            onChange={(e) => handleInputChange('intendedMajor', e.target.value)}
            className="h-11 border-muted-foreground/20"
          />
        </div>
      </div>
      </>
      )}

      {/* UK/France: Show info message */}
      {selectedCountry && selectedCountry !== 'usa' && (
        <div className="bg-muted/50 border border-muted-foreground/20 rounded-lg p-4">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">
              {selectedCountry === 'uk' ? '🇬🇧 UK' : '🇫🇷 France'} Interview:
            </strong> No additional profile information needed. You can proceed directly to your dashboard and start practicing!
          </p>
        </div>
      )}

      <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={isLoading || !selectedCountry}>
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            Saving Profile...
          </>
        ) : (
          <>
            <CheckCircle2 className="h-5 w-5 mr-2" />
            {selectedCountry === 'usa' ? 'Complete Profile' : 'Continue to Dashboard'}
          </>
        )}
      </Button>
    </form>
  )

  if (!showCard) {
    return formContent
  }

  return (
    <Card className="w-full max-w-3xl mx-auto border-muted-foreground/20 shadow-xl">
      <CardHeader className="space-y-3 pb-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <CardTitle className="text-2xl font-bold">{title}</CardTitle>
            <CardDescription className="text-base">
              {selectedCountry === 'usa' 
                ? 'Please provide information about your intended program to get personalized interview questions.'
                : 'Select your interview country to get started.'}
            </CardDescription>
          </div>
        </div>
        
        {/* Progress indicator */}
        <div className="flex items-center gap-2 pt-4">
          <div className="flex-1 h-1.5 bg-primary/20 rounded-full overflow-hidden">
            <div className="h-full bg-primary w-0 animate-[progress_2s_ease-in-out_forwards]" />
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap">Step 1 of 1</span>
        </div>
      </CardHeader>
      <CardContent className="pb-8">{formContent}</CardContent>
    </Card>
  )
}

