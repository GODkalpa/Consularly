// Firestore Schema Types for Mock Interview System

export interface User {
  uid: string;
  role: 'admin' | 'student' | 'interviewer';
  orgId: string;
  email: string;
  displayName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Interview {
  interviewId: string;
  userId: string; // Reference to the student being interviewed
  orgId: string;
  interviewerId?: string; // Optional: Reference to interviewer user
  startTime: Date;
  endTime: Date;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  score?: number; // Overall score (0-100)
  scoreDetails?: ScoreDetails;
  createdAt: Date;
  updatedAt: Date;
  // Optional metadata
  interviewType?: string; // e.g., 'technical', 'behavioral', 'mock'
  notes?: string;
}

export interface ScoreDetails {
  communication: number; // 0-100
  technicalSkills: number; // 0-100
  problemSolving: number; // 0-100
  professionalism: number; // 0-100
  overallImpression: number; // 0-100
  feedback?: string;
}

export interface InterviewMetrics {
  metricId: string;
  interviewId: string; // Reference to parent interview
  eyeContactPct: number; // Percentage of time maintaining eye contact (0-100)
  headPoseStd: number; // Standard deviation of head pose (lower = more stable)
  wpm: number; // Words per minute
  fillerRate: number; // Filler words per minute (um, uh, like, etc.)
  // Additional metrics
  speakingTime: number; // Total speaking time in seconds
  pauseCount: number; // Number of pauses > 2 seconds
  averagePauseLength: number; // Average pause length in seconds
  volumeConsistency: number; // Volume consistency score (0-100)
  recordedAt: Date;
}

// Firestore Collection Paths
export const COLLECTIONS = {
  USERS: 'users',
  INTERVIEWS: 'interviews',
  METRICS: 'metrics', // Sub-collection under interviews
} as const;

// Helper function to get metrics collection path
export const getMetricsPath = (interviewId: string) => 
  `${COLLECTIONS.INTERVIEWS}/${interviewId}/${COLLECTIONS.METRICS}`;

// Firestore document converters for type safety
export const userConverter = {
  toFirestore: (user: User) => ({
    role: user.role,
    orgId: user.orgId,
    email: user.email,
    displayName: user.displayName,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }),
  fromFirestore: (snapshot: any, options: any) => {
    const data = snapshot.data(options);
    return {
      uid: snapshot.id,
      ...data,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
    } as User;
  }
};

export const interviewConverter = {
  toFirestore: (interview: Interview) => ({
    userId: interview.userId,
    orgId: interview.orgId,
    interviewerId: interview.interviewerId,
    startTime: interview.startTime,
    endTime: interview.endTime,
    status: interview.status,
    score: interview.score,
    scoreDetails: interview.scoreDetails,
    createdAt: interview.createdAt,
    updatedAt: interview.updatedAt,
    interviewType: interview.interviewType,
    notes: interview.notes,
  }),
  fromFirestore: (snapshot: any, options: any) => {
    const data = snapshot.data(options);
    return {
      interviewId: snapshot.id,
      ...data,
      startTime: data.startTime?.toDate(),
      endTime: data.endTime?.toDate(),
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
    } as Interview;
  }
};

export const metricsConverter = {
  toFirestore: (metrics: InterviewMetrics) => ({
    interviewId: metrics.interviewId,
    eyeContactPct: metrics.eyeContactPct,
    headPoseStd: metrics.headPoseStd,
    wpm: metrics.wpm,
    fillerRate: metrics.fillerRate,
    speakingTime: metrics.speakingTime,
    pauseCount: metrics.pauseCount,
    averagePauseLength: metrics.averagePauseLength,
    volumeConsistency: metrics.volumeConsistency,
    recordedAt: metrics.recordedAt,
  }),
  fromFirestore: (snapshot: any, options: any) => {
    const data = snapshot.data(options);
    return {
      metricId: snapshot.id,
      ...data,
      recordedAt: data.recordedAt?.toDate(),
    } as InterviewMetrics;
  }
};

// Example usage with Firebase SDK v9+
/*
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';

// Get user by ID
const getUserById = async (db: Firestore, userId: string): Promise<User | null> => {
  const userRef = doc(db, COLLECTIONS.USERS, userId).withConverter(userConverter);
  const userSnap = await getDoc(userRef);
  return userSnap.exists() ? userSnap.data() : null;
};

// Get interviews for an organization
const getInterviewsByOrg = async (db: Firestore, orgId: string): Promise<Interview[]> => {
  const interviewsRef = collection(db, COLLECTIONS.INTERVIEWS).withConverter(interviewConverter);
  const q = query(
    interviewsRef,
    where('orgId', '==', orgId),
    orderBy('startTime', 'desc'),
    limit(50)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data());
};

// Get metrics for an interview
const getInterviewMetrics = async (db: Firestore, interviewId: string): Promise<InterviewMetrics[]> => {
  const metricsRef = collection(db, getMetricsPath(interviewId)).withConverter(metricsConverter);
  const querySnapshot = await getDocs(metricsRef);
  return querySnapshot.docs.map(doc => doc.data());
};
*/