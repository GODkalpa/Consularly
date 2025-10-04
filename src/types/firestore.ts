// Firestore Schema TypeScript Interfaces
// Generated for admin-level mock interview system

import { Timestamp } from 'firebase/firestore';

// User roles enum
export type UserRole = 'user' | 'admin' | 'super_admin';

// Interview status enum
export type InterviewStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

// Interview type enum
export type InterviewType = 'visa' | 'job' | 'academic';

// Organization plan enum
export type OrganizationPlan = 'basic' | 'premium' | 'enterprise';

// Degree level enum
export type DegreeLevel = 'undergraduate' | 'graduate' | 'doctorate' | 'other';

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

// User Profile Interface
export interface UserProfile {
  role: UserRole;
  orgId: string;
  email: string;
  displayName: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isActive: boolean;
  quotaLimit?: number; // Individual user quota limit (for signup users)
  quotaUsed?: number; // Individual user quota used (for signup users)
  studentProfile?: StudentProfileInfo; // Pre-interview profile information
}

// Score Details Interface
export interface ScoreDetails {
  communication: number; // 0-100
  technical: number; // 0-100
  confidence: number; // 0-100
  overall: number; // 0-100
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
  duration: number; // minutes
  createdAt: Timestamp;
  updatedAt: Timestamp;
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

// Organization Settings Interface
export interface OrganizationSettings {
  allowSelfRegistration: boolean;
  defaultInterviewDuration: number; // minutes
  enableMetricsCollection: boolean;
  customBranding: {
    logoUrl?: string;
    primaryColor?: string;
    companyName?: string;
  };
  notifications: {
    emailReports: boolean;
    weeklyDigest: boolean;
    quotaWarnings: boolean;
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
