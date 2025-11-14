// Firestore Schema TypeScript Interfaces
// Generated for admin-level mock interview system

import { Timestamp } from 'firebase/firestore';

// User roles enum
export type UserRole = 'user' | 'admin';

// Interview status enum
export type InterviewStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

// Interview type enum
export type InterviewType = 'visa' | 'job' | 'academic';

// Organization plan enum
export type OrganizationPlan = 'basic' | 'premium' | 'enterprise';

// Degree level enum
export type DegreeLevel = 'undergraduate' | 'graduate' | 'doctorate' | 'other';

// Student account status enum
export type StudentAccountStatus = 'pending' | 'active' | 'suspended' | 'inactive';

// Credit transaction types
export type CreditTransactionType = 'allocated' | 'used' | 'deallocated' | 'refunded';

// Student Profile Information (for interview context)
export interface StudentProfileInfo {
  degreeLevel?: DegreeLevel; // What degree level are they applying for
  programName?: string; // Specific program (e.g., "Master's in Computer Science")
  universityName?: string; // University applied to
  programLength?: string; // Duration (e.g., "2 years", "4 years")
  programCost?: string; // Total cost (e.g., "$50,000", "£30,000")
  fieldOfStudy?: string; // Field of study
  intendedMajor?: string; // Intended major/specialization
  profileCompleted?: boolean; // Whether user has completed profile setup
}

// Organization Student Interface (for org-managed students)
export interface OrgStudent {
  id: string;
  orgId: string;
  name: string;
  email: string;
  interviewCountry?: 'usa' | 'uk' | 'france';
  studentProfile?: StudentProfileInfo;
  
  // Authentication fields
  firebaseUid?: string;              // Link to Firebase Auth user
  accountStatus: StudentAccountStatus;
  dashboardEnabled: boolean;         // Can access student dashboard?
  canSelfStartInterviews: boolean;   // Can initiate own interviews?
  
  // Credit system
  creditsAllocated: number;          // Total credits from org
  creditsUsed: number;               // Interviews completed
  creditsRemaining: number;          // Computed: allocated - used
  
  // Invitation system
  invitationToken?: string;          // For account setup
  invitedAt?: Timestamp;
  invitationAcceptedAt?: Timestamp;
  lastLoginAt?: Timestamp;
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Student Credit History Interface
export interface StudentCreditHistory {
  id: string;
  orgId: string;
  studentId: string;
  type: CreditTransactionType;
  amount: number;
  reason?: string;
  performedBy: string;               // Who made this change (userId)
  interviewId?: string;              // If type='used' or 'refunded'
  timestamp: Timestamp;
  balanceBefore: number;
  balanceAfter: number;
}

// User Profile Interface
export interface UserProfile {
  role: UserRole;
  orgId: string;
  email: string;
  displayName: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isActive: boolean;
  passwordSet?: boolean; // Track if user has set their password (for admin-created users)
  welcomeEmailSent?: boolean; // Track if welcome email has been sent
  quotaLimit?: number; // Individual user quota limit (for signup users)
  quotaUsed?: number; // Individual user quota used (for signup users)
  studentProfile?: StudentProfileInfo; // Pre-interview profile information
  // Interview statistics and progress tracking
  interviewStats?: {
    totalCompleted: number;
    averageScore: number;
    highestScore: number;
    improvementTrend: number; // Percentage change from first to latest
    weakestCategory: string;
    strongestCategory: string;
    achievements: string[];
    lastInterviewDate?: Timestamp;
    scoreHistory: {
      date: Timestamp;
      score: number;
      mode: string;
    }[];
  };
}

// Score Details Interface
export interface ScoreDetails {
  communication: number; // 0-100
  technical: number; // 0-100
  confidence: number; // 0-100
  overall: number; // 0-100
}

// Detailed Insight Interface
export interface DetailedInsight {
  category: 'Content Quality' | 'Financial' | 'Course' | 'Communication' | 'Body Language' | 'Intent';
  type: 'strength' | 'weakness';
  finding: string;
  example?: string;
  actionItem: string;
}

// Final Report Interface
export interface FinalReport {
  decision: 'accepted' | 'rejected' | 'borderline';
  overall: number; // 0-100
  dimensions: Record<string, number>;
  summary: string; // 2-3 detailed paragraphs
  detailedInsights: DetailedInsight[];
  strengths: string[]; // 3-5 key strengths
  weaknesses: string[]; // 3-5 key weaknesses
  recommendations?: string[]; // Deprecated, use detailedInsights instead
}

// Per-Answer Score Interface
export interface PerAnswerScore {
  overall: number;
  categories: {
    content: number;
    speech: number;
    bodyLanguage: number;
  };
}

// Interview Response Interface (individual answer with metadata)
export interface InterviewResponse {
  question: string;
  answer: string;
  timestamp: string;
  questionType?: string;
  perf?: PerAnswerScore;
  bodyLanguageOverall?: number | null;
  asrConfidence?: number | null;
  languageCode?: string; // Detected language code (e.g., 'en', 'es', 'zh')
  languageConfidence?: number; // Confidence in language detection (0-100)
  languageWarning?: string; // Warning if non-English detected
  relevanceScore?: number; // Relevance to question (0-100)
  relevanceWarning?: string; // Warning if off-topic
}

// Interview Interface
export interface Interview {
  userId: string;
  orgId: string;
  startTime: Timestamp;
  endTime: Timestamp | null;
  status: InterviewStatus;
  score: number; // 0-100
  scoreDetails: ScoreDetails;
  interviewType: InterviewType;
  route?: string; // 'usa_f1' | 'uk_student' | 'france_ema' | 'france_icn'
  university?: string; // 'ema' | 'icn' for France interviews
  duration: number; // minutes
  createdAt: Timestamp;
  updatedAt: Timestamp;
  // Scheduling-related fields
  scheduledTime?: Timestamp;    // When interview is scheduled (if pre-scheduled)
  actualStartTime?: Timestamp;  // When actually started (can differ from scheduledTime)
  slotId?: string;             // Reference to InterviewSlot (if booked via scheduling)
  // Enhanced reporting fields
  finalReport?: FinalReport;
  perAnswerScores?: PerAnswerScore[];
  completedQuestions?: number;
  conversationHistory?: Array<{
    question: string;
    answer: string;
    timestamp?: string;
    questionType?: string;
  }>;
  // Interview mode and difficulty settings
  interviewMode?: 'practice' | 'standard' | 'comprehensive' | 'stress_test';
  difficulty?: 'easy' | 'medium' | 'hard' | 'expert';
  officerPersona?: 'professional' | 'skeptical' | 'friendly' | 'strict';
  targetTopic?: 'financial' | 'academic' | 'intent' | 'weak_areas';
  questionCount?: number; // Actual number of questions asked
  // Enhanced scoring dimensions (12-dimension system)
  detailedScores?: {
    // Content dimensions
    clarity?: number;          // 0-100
    specificity?: number;      // 0-100
    relevance?: number;        // 0-100
    depth?: number;            // 0-100
    consistency?: number;      // 0-100
    // Delivery dimensions
    fluency?: number;          // 0-100
    confidence?: number;       // 0-100
    pace?: number;             // 0-100
    articulation?: number;     // 0-100
    // Non-verbal dimensions
    posture?: number;          // 0-100
    eyeContact?: number;       // 0-100
    composure?: number;        // 0-100
  };
  // Improvement tracking
  improvementAreas?: string[];
  achievements?: string[];
}

// Interview Metrics Interface
export interface InterviewMetrics {
  eyeContactPct: number; // 0-100
  headPoseStd: number; // standard deviation
  wpm: number; // words per minute
  fillerRate: number; // filler words per minute
  volumeLevel: number; // 0-100
  pauseFrequency: number; // pauses per minute
  gestureCount: number; // number of gestures
  timestamp: Timestamp;
  segmentStart: number; // seconds
  segmentEnd: number; // seconds
}

// Organization Custom Branding Interface
export interface OrganizationBranding {
  // Logo variants
  logoUrl?: string;              // Main logo
  logoLight?: string;            // Light mode logo
  logoDark?: string;             // Dark mode logo
  favicon?: string;              // Favicon URL
  
  // Colors
  primaryColor?: string;         // Primary brand color (CSS)
  secondaryColor?: string;       // Secondary/accent color
  backgroundColor?: string;      // Custom background
  
  // Text branding
  companyName?: string;
  tagline?: string;              // Company tagline/slogan
  welcomeMessage?: string;       // Custom dashboard greeting
  footerText?: string;           // Footer copyright/disclaimer
  
  // Visual assets
  backgroundImage?: string;      // Hero/background image URL
  
  // Typography
  fontFamily?: 'inter' | 'poppins' | 'roboto' | 'montserrat' | 'system';
  
  // Social links
  socialLinks?: {
    website?: string;
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };
  
  // Advanced (enterprise)
  customCSS?: string;            // Custom CSS overrides
  whiteLabel?: boolean;          // Hide platform branding
}

// Organization Settings Interface
export interface OrganizationSettings {
  allowSelfRegistration: boolean;
  defaultInterviewDuration: number; // minutes
  enableMetricsCollection: boolean;
  customBranding: OrganizationBranding;
  notifications: {
    emailReports: boolean;
    weeklyDigest: boolean;
    quotaWarnings: boolean;
  };
  scheduling?: {
    enabled: boolean;
    defaultTimezone: string;          // IANA (e.g., "America/New_York")
    defaultSlotDuration: number;      // minutes (default 30)
    enableReminders: boolean;
    reminderHours: number[];          // [24, 1] = 24h and 1h before
    allowStudentReschedule: boolean;
    maxReschedules: number;           // per student (default 2)
  };
  
  // Student dashboard settings
  studentDashboard?: {
    enabled: boolean;                 // Feature flag for student dashboard
    allowSelfStart: boolean;          // Can students start own interviews?
    defaultCreditsPerStudent: number; // Default credit allocation
    enableCreditRequests: boolean;    // Can students request more credits?
    maxCreditsPerStudent: number;     // Maximum credits per student
  };
}

// Organization Interface
export interface Organization {
  name: string;
  domain: string;
  plan: OrganizationPlan;
  quotaLimit: number;
  quotaUsed: number;
  adminUsers: string[]; // array of user IDs
  settings: OrganizationSettings;
  
  // Student credit management
  studentCreditsAllocated: number;   // Total credits allocated to students
  studentCreditsUsed: number;        // Credits actually used by students
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// System Settings Interface
export interface SystemSetting {
  key: string;
  value: any;
  description: string;
  category: string;
  updatedBy: string; // admin user ID
  updatedAt: Timestamp;
}

// Audit Log Interface (for tracking admin actions)
export interface AuditLog {
  userId: string; // admin who performed the action
  orgId: string;
  action: string; // e.g., 'user_created', 'interview_deleted'
  targetId: string; // ID of the affected resource
  targetType: string; // e.g., 'user', 'interview', 'organization'
  details: Record<string, any>; // additional action details
  timestamp: Timestamp;
  ipAddress?: string;
  userAgent?: string;
}

// Interview Scheduling Interfaces
export interface InterviewSlot {
  orgId: string;
  startTime: Timestamp;
  endTime: Timestamp;
  studentId?: string;           // Assigned student (null = available)
  studentName?: string;
  studentEmail?: string;
  interviewRoute?: string;      // 'usa_f1' | 'uk_student' | 'france_ema' | 'france_icn'
  status: 'available' | 'booked' | 'completed' | 'cancelled' | 'no_show';
  bookedBy?: string;            // User ID who created the booking
  bookedAt?: Timestamp;
  notes?: string;
  timezone: string;             // IANA timezone
  remindersSent?: {
    confirmation: boolean;
    reminder24h: boolean;
    reminder1h: boolean;
  };
  interviewId?: string;         // Reference to Interview document (once conducted)
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface BookingLink {
  orgId: string;
  name: string;                 // "Weekly UK Interviews"
  slug: string;                 // "weekly-uk-interviews" (for URL)
  description?: string;
  isActive: boolean;
  route?: string;               // Optional filter for specific route
  settings: {
    slotDuration: number;       // minutes (default 30)
    bufferBefore: number;       // minutes (default 0)
    bufferAfter: number;        // minutes (default 5)
    maxAdvanceDays: number;     // How far ahead can book (default 30)
    minAdvanceHours: number;    // Minimum notice (default 24)
    timezone: string;           // IANA timezone (default org timezone)
    requireApproval: boolean;   // Require org approval before confirming
  };
  availability: {
    monday?: { start: string; end: string }[];    // [{ start: "09:00", end: "17:00" }]
    tuesday?: { start: string; end: string }[];
    wednesday?: { start: string; end: string }[];
    thursday?: { start: string; end: string }[];
    friday?: { start: string; end: string }[];
    saturday?: { start: string; end: string }[];
    sunday?: { start: string; end: string }[];
  };
  bookingCount?: number;        // Track total bookings through this link
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ReminderLog {
  interviewSlotId: string;
  orgId: string;
  studentEmail: string;
  type: 'confirmation' | 'reminder_24h' | 'reminder_1h' | 'cancellation' | 'reschedule';
  status: 'sent' | 'failed';
  sentAt: Timestamp;
  error?: string;
  emailProvider: 'brevo';       // Track which provider was used
}

// Legacy interfaces for backward compatibility
export interface MockSession {
  userId: string;
  startTime: Timestamp;
  endTime?: Timestamp;
  score?: number;
  feedback?: string;
  createdAt: Timestamp;
}

export interface UserProgress {
  totalSessions: number;
  averageScore: number;
  lastSessionDate: Timestamp;
  improvementTrend: number; // percentage change
  weakAreas: string[];
  strongAreas: string[];
  updatedAt: Timestamp;
}

// Firestore document references with IDs
export interface UserProfileWithId extends UserProfile {
  id: string; // document ID (same as user UID)
}

export interface InterviewWithId extends Interview {
  id: string; // document ID
}

// Extended type for interviews with full report data
export type InterviewWithReport = InterviewWithId & {
  finalReport: FinalReport;
  perAnswerScores: PerAnswerScore[];
}

export interface InterviewMetricsWithId extends InterviewMetrics {
  id: string; // document ID
  interviewId: string; // parent interview ID
}

export interface OrganizationWithId extends Organization {
  id: string; // document ID
}

export interface SystemSettingWithId extends SystemSetting {
  id: string; // document ID
}

export interface AuditLogWithId extends AuditLog {
  id: string; // document ID
}

export interface InterviewSlotWithId extends InterviewSlot {
  id: string; // document ID
}

export interface BookingLinkWithId extends BookingLink {
  id: string; // document ID
}

export interface ReminderLogWithId extends ReminderLog {
  id: string; // document ID
}

export interface OrgStudentWithId extends OrgStudent {
  id: string; // document ID
}

export interface StudentCreditHistoryWithId extends StudentCreditHistory {
  id: string; // document ID
}

// API request/response types
export interface CreateInterviewRequest {
  interviewType: InterviewType;
  scheduledTime?: Date;
  duration?: number;
}

export interface UpdateInterviewRequest {
  status?: InterviewStatus;
  endTime?: Date;
  score?: number;
  scoreDetails?: Partial<ScoreDetails>;
}

export interface CreateUserRequest {
  email: string;
  displayName: string;
  orgId: string;
  role?: UserRole;
}

// Student-related API types
export interface CreateStudentRequest {
  name: string;
  email: string;
  interviewCountry?: 'usa' | 'uk' | 'france';
  studentProfile?: StudentProfileInfo;
  initialCredits: number;
  dashboardEnabled: boolean;
  canSelfStartInterviews: boolean;
  sendInvitation: boolean;
}

export interface AllocateCreditsRequest {
  amount: number;
  reason?: string;
}

export interface StudentLoginResponse {
  student: OrgStudent;
  organization: {
    id: string;
    name: string;
    branding: OrganizationBranding;
  };
}

export interface StudentCreditSummary {
  creditsAllocated: number;
  creditsUsed: number;
  creditsRemaining: number;
  recentTransactions: StudentCreditHistory[];
}

export interface UpdateUserRequest {
  displayName?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface InterviewFilters {
  userId?: string;
  orgId?: string;
  status?: InterviewStatus;
  interviewType?: InterviewType;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface UserFilters {
  orgId?: string;
  role?: UserRole;
  isActive?: boolean;
  searchTerm?: string;
  limit?: number;
  offset?: number;
}

// Analytics and reporting types
export interface InterviewAnalytics {
  totalInterviews: number;
  averageScore: number;
  completionRate: number; // percentage
  averageDuration: number; // minutes
  scoreDistribution: {
    excellent: number; // 90-100
    good: number; // 80-89
    average: number; // 70-79
    needsImprovement: number; // 0-69
  };
  trendsOverTime: {
    date: string;
    count: number;
    averageScore: number;
  }[];
}

export interface OrganizationAnalytics {
  totalUsers: number;
  activeUsers: number;
  quotaUtilization: number; // percentage
  topPerformers: {
    userId: string;
    displayName: string;
    averageScore: number;
  }[];
  departmentBreakdown?: {
    department: string;
    userCount: number;
    averageScore: number;
  }[];
}

// Error types
export interface FirestoreError {
  code: string;
  message: string;
  details?: any;
}

// Pagination types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// Real-time subscription types
export type InterviewSubscriptionCallback = (interviews: InterviewWithId[]) => void;
export type UserSubscriptionCallback = (users: UserProfileWithId[]) => void;
export type MetricsSubscriptionCallback = (metrics: InterviewMetricsWithId[]) => void;
