/**
 * Profile Validator
 * Validates student profile completeness and provides recommendations
 */

import type { StudentProfileInfo } from '@/types/firestore';

export interface ProfileValidation {
  completenessScore: number; // 0-100
  isComplete: boolean;
  requiredFieldsMissing: string[];
  optionalFieldsMissing: string[];
  warnings: string[];
  recommendations: string[];
  categoryScores: {
    basicInfo: number;
    academicDetails: number;
    programDetails: number;
    financialPrep: number;
  };
}

export interface ProfileField {
  key: keyof StudentProfileInfo | string;
  label: string;
  required: boolean;
  weight: number; // Contribution to overall score
  category: 'basicInfo' | 'academicDetails' | 'programDetails' | 'financialPrep';
  validator?: (value: any) => { valid: boolean; message?: string };
}

// ===== PROFILE FIELD DEFINITIONS =====

export const PROFILE_FIELDS: ProfileField[] = [
  // Basic Info (20% weight)
  {
    key: 'degreeLevel',
    label: 'Degree Level (Undergraduate/Graduate/Doctorate)',
    required: true,
    weight: 10,
    category: 'basicInfo',
    validator: (value) => ({
      valid: ['undergraduate', 'graduate', 'doctorate', 'other'].includes(value),
      message: 'Must be undergraduate, graduate, doctorate, or other',
    }),
  },
  {
    key: 'country',
    label: 'Home Country',
    required: true,
    weight: 5,
    category: 'basicInfo',
  },
  {
    key: 'name',
    label: 'Full Name',
    required: true,
    weight: 5,
    category: 'basicInfo',
  },
  
  // Academic Details (25% weight)
  {
    key: 'fieldOfStudy',
    label: 'Field of Study',
    required: true,
    weight: 10,
    category: 'academicDetails',
    validator: (value) => ({
      valid: value && value.length >= 3,
      message: 'Must be at least 3 characters',
    }),
  },
  {
    key: 'previousEducation',
    label: 'Previous Education Background',
    required: true,
    weight: 10,
    category: 'academicDetails',
    validator: (value) => ({
      valid: value && value.length >= 10,
      message: 'Provide details about your previous degree(s)',
    }),
  },
  {
    key: 'gpa',
    label: 'GPA or Percentage',
    required: false,
    weight: 5,
    category: 'academicDetails',
  },
  
  // Program Details (35% weight)
  {
    key: 'programName',
    label: 'Specific Program Name',
    required: true,
    weight: 12,
    category: 'programDetails',
    validator: (value) => ({
      valid: value && value.length >= 5,
      message: 'Provide the full program name (e.g., "Master of Science in Computer Science")',
    }),
  },
  {
    key: 'universityName',
    label: 'University Name',
    required: true,
    weight: 10,
    category: 'programDetails',
    validator: (value) => ({
      valid: value && value.length >= 5,
      message: 'Provide the full university name',
    }),
  },
  {
    key: 'programLength',
    label: 'Program Duration',
    required: true,
    weight: 8,
    category: 'programDetails',
    validator: (value) => ({
      valid: value && /\d+\s*(year|month|semester)/i.test(value),
      message: 'Specify duration (e.g., "2 years", "18 months")',
    }),
  },
  {
    key: 'programCost',
    label: 'Total Program Cost',
    required: true,
    weight: 5,
    category: 'programDetails',
    validator: (value) => ({
      valid: value && /\$?\s*\d+/.test(value),
      message: 'Specify total cost (e.g., "$50,000")',
    }),
  },
  
  // Financial Preparation (20% weight)
  {
    key: 'fundingSource',
    label: 'Primary Funding Source',
    required: false,
    weight: 10,
    category: 'financialPrep',
  },
  {
    key: 'sponsorOccupation',
    label: 'Sponsor\'s Occupation',
    required: false,
    weight: 5,
    category: 'financialPrep',
  },
  {
    key: 'hasScholarship',
    label: 'Scholarship Status',
    required: false,
    weight: 5,
    category: 'financialPrep',
  },
];

// ===== VALIDATION FUNCTIONS =====

/**
 * Validate complete student profile
 */
export function validateProfile(profile: Partial<StudentProfileInfo> & Record<string, any>): ProfileValidation {
  let totalScore = 0;
  let maxScore = 0;
  const requiredMissing: string[] = [];
  const optionalMissing: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];
  
  const categoryScores = {
    basicInfo: 0,
    academicDetails: 0,
    programDetails: 0,
    financialPrep: 0,
  };
  
  const categoryMaxScores = {
    basicInfo: 0,
    academicDetails: 0,
    programDetails: 0,
    financialPrep: 0,
  };
  
  // Validate each field
  PROFILE_FIELDS.forEach(field => {
    const value = profile[field.key];
    const hasValue = value !== undefined && value !== null && value !== '';
    
    maxScore += field.weight;
    categoryMaxScores[field.category] += field.weight;
    
    if (!hasValue) {
      if (field.required) {
        requiredMissing.push(field.label);
      } else {
        optionalMissing.push(field.label);
      }
    } else {
      // Validate the value if validator exists
      if (field.validator) {
        const validation = field.validator(value);
        if (validation.valid) {
          totalScore += field.weight;
          categoryScores[field.category] += field.weight;
        } else {
          warnings.push(`${field.label}: ${validation.message}`);
          totalScore += field.weight * 0.5; // Partial credit
          categoryScores[field.category] += field.weight * 0.5;
        }
      } else {
        totalScore += field.weight;
        categoryScores[field.category] += field.weight;
      }
    }
  });
  
  // Calculate percentage scores
  const completenessScore = Math.round((totalScore / maxScore) * 100);
  const isComplete = requiredMissing.length === 0 && warnings.length === 0;
  
  for (const category in categoryScores) {
    const key = category as keyof typeof categoryScores;
    categoryScores[key] = Math.round((categoryScores[key] / categoryMaxScores[key]) * 100);
  }
  
  // Generate recommendations based on score
  if (completenessScore < 50) {
    recommendations.push('Your profile needs significant improvement. Complete all required fields first.');
  } else if (completenessScore < 75) {
    recommendations.push('Your profile is incomplete. Fill in missing fields for better interview preparation.');
  } else if (completenessScore < 90) {
    recommendations.push('Good progress! Add optional details to strengthen your profile.');
  } else {
    recommendations.push('Excellent profile! You\'re well-prepared for your interview.');
  }
  
  // Category-specific recommendations
  if (categoryScores.basicInfo < 70) {
    recommendations.push('Complete basic information fields - these are critical for personalized questions.');
  }
  if (categoryScores.academicDetails < 70) {
    recommendations.push('Add more academic details to prepare for capability questions.');
  }
  if (categoryScores.programDetails < 70) {
    recommendations.push('Provide complete program details - officers will ask about these specifics.');
  }
  if (categoryScores.financialPrep < 50) {
    recommendations.push('Consider adding financial information to prepare for funding questions.');
  }
  
  // Degree-level specific recommendations
  if (profile.degreeLevel === 'graduate' && !profile.previousEducation?.toLowerCase().includes('bachelor')) {
    warnings.push('For graduate programs, specify your bachelor\'s degree details');
  }
  if (profile.degreeLevel === 'doctorate' && !profile.previousEducation?.toLowerCase().includes('master')) {
    warnings.push('For doctorate programs, mention both bachelor\'s and master\'s degrees');
  }
  
  return {
    completenessScore,
    isComplete,
    requiredFieldsMissing: requiredMissing,
    optionalFieldsMissing: optionalMissing,
    warnings,
    recommendations,
    categoryScores,
  };
}

/**
 * Get document checklist based on profile
 */
export function getDocumentChecklist(profile: Partial<StudentProfileInfo> & Record<string, any>): Array<{
  category: string;
  items: Array<{ name: string; required: boolean; description: string }>;
}> {
  const checklist = [
    {
      category: 'Academic Documents',
      items: [
        {
          name: 'I-20 Form',
          required: true,
          description: 'Official acceptance letter from your university',
        },
        {
          name: 'Admission Letter',
          required: true,
          description: 'University acceptance confirmation',
        },
        {
          name: 'Transcripts',
          required: true,
          description: 'Official academic records from previous education',
        },
        {
          name: 'Degree Certificates',
          required: profile.degreeLevel !== 'undergraduate',
          description: 'Certificates of completed degrees',
        },
        {
          name: 'Test Scores (GRE/TOEFL/IELTS)',
          required: false,
          description: 'Standardized test score reports',
        },
      ],
    },
    {
      category: 'Financial Documents',
      items: [
        {
          name: 'Bank Statements',
          required: true,
          description: 'Recent statements showing sufficient funds (last 3-6 months)',
        },
        {
          name: 'Sponsor\'s Financial Documents',
          required: true,
          description: 'Income proof and bank statements of sponsor',
        },
        {
          name: 'Affidavit of Support',
          required: true,
          description: 'Notarized statement from sponsor',
        },
        {
          name: 'Property Documents',
          required: false,
          description: 'Proof of property ownership in home country',
        },
        {
          name: 'Tax Returns',
          required: profile.fundingSource?.toLowerCase().includes('business'),
          description: 'Business tax returns (if family business)',
        },
        {
          name: 'Loan Approval Letter',
          required: profile.fundingSource?.toLowerCase().includes('loan'),
          description: 'Education loan sanction letter from bank',
        },
        {
          name: 'Scholarship Award Letter',
          required: profile.hasScholarship === true,
          description: 'Official scholarship confirmation',
        },
      ],
    },
    {
      category: 'Personal Documents',
      items: [
        {
          name: 'Valid Passport',
          required: true,
          description: 'Valid for at least 6 months beyond program end date',
        },
        {
          name: 'Passport Photos',
          required: true,
          description: 'Recent photos meeting visa specifications',
        },
        {
          name: 'DS-160 Confirmation',
          required: true,
          description: 'Online visa application confirmation page',
        },
        {
          name: 'Visa Fee Receipt',
          required: true,
          description: 'Proof of visa application fee payment',
        },
        {
          name: 'SEVIS Fee Receipt',
          required: true,
          description: 'Proof of SEVIS I-901 fee payment',
        },
      ],
    },
  ];
  
  return checklist;
}

/**
 * Get category-specific quick tips
 */
export function getCategoryTips(category: 'financial' | 'academic' | 'post_study' | 'general'): string[] {
  const tips: Record<typeof category, string[]> = {
    financial: [
      'Always state exact dollar amounts - never say "enough" or "sufficient"',
      'Know your sponsor\'s occupation and annual income by heart',
      'Be prepared to explain the source of all funds with evidence',
      'If taking a loan, know the exact amount, interest rate, and repayment plan',
      'If you have a scholarship, know exactly what it covers (tuition/living/both)',
      'Explain how your family can afford this without financial hardship',
      'Be ready to show bank statements proving funds availability',
    ],
    academic: [
      'Research specific courses and professors in your program',
      'Explain why this program is unique compared to others',
      'Connect your program clearly to specific career goals in your home country',
      'Know your GPA, test scores, and be ready to explain any low scores',
      'Mention specific features: labs, research opportunities, curriculum',
      'Explain why US education is necessary - what\'s not available at home',
      'Be honest about any academic failures and show how you\'ve improved',
    ],
    post_study: [
      'Name specific companies or organizations you want to work for',
      'Describe your exact role and position goals in your home country',
      'Highlight family obligations, property, or business ties at home',
      'Never mention US job market, salaries, or "opportunities here"',
      'Be specific about timeline - when exactly you\'ll return',
      'Explain how your degree will help your home country',
      'Show you\'ve researched job market in your field at home',
    ],
    general: [
      'Be specific - avoid vague words like "good," "better," "nice"',
      'Answer directly and concisely - don\'t ramble',
      'Maintain eye contact with the camera',
      'Speak clearly and confidently, not too fast',
      'Don\'t memorize answers - sound natural',
      'Be consistent - don\'t contradict previous answers',
      'If you don\'t know, admit it rather than making up an answer',
      'Show enthusiasm but stay professional',
    ],
  };
  
  return tips[category];
}

/**
 * Get red flag warnings to avoid
 */
export function getRedFlagWarnings(): Array<{
  warning: string;
  why: string;
  instead: string;
}> {
  return [
    {
      warning: 'Saying you want to "settle" or "stay" in the US',
      why: 'Shows immigration intent, instant rejection',
      instead: 'Focus on returning home with valuable skills',
    },
    {
      warning: 'Mentioning relatives in the US without context',
      why: 'Officers suspect you\'ll overstay to be with them',
      instead: 'Only mention if asked, clarify they won\'t support you financially',
    },
    {
      warning: 'Vague answers about costs ("my parents will pay")',
      why: 'Shows lack of preparation and financial awareness',
      instead: 'State exact amounts: "My parents will pay $50,000 total"',
    },
    {
      warning: 'Saying "agent told me" or "consultant said"',
      why: 'Shows you didn\'t do independent research',
      instead: 'Own your decisions: "I chose this because I researched..."',
    },
    {
      warning: 'Comparing US salaries to home country',
      why: 'Suggests financial motivation to stay',
      instead: 'Focus on skills and knowledge, not money',
    },
    {
      warning: 'Being uncertain about return plans',
      why: 'Shows weak ties to home country',
      instead: 'Concrete plans: specific job, family obligations, property',
    },
    {
      warning: 'Recent large bank deposits',
      why: 'Raises questions about fund sources',
      instead: 'Explain source clearly with documentation',
    },
    {
      warning: 'Generic answers about "world-class education"',
      why: 'Sounds memorized and insincere',
      instead: 'Specific program features, professors, research areas',
    },
  ];
}

