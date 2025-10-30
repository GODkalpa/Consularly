import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  addDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

// Degree level types
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

// User profile operations
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  // Organization membership (optional for personal users)
  orgId?: string;
  photoURL?: string;
  role: 'user' | 'admin';
  createdAt: string;
  lastLoginAt: string;
  interviewCountry?: 'usa' | 'uk' | 'france'; // Selected country for interview (for individual users)
  preferences?: {
    notifications: boolean;
    theme: 'light' | 'dark';
    language: string;
  };
  subscription?: {
    plan: 'free' | 'premium';
    startDate: string;
    endDate?: string;
  };
  studentProfile?: StudentProfileInfo; // Pre-interview profile information (USA only)
}

export const createUserProfile = async (uid: string, userData: Partial<UserProfile>) => {
  try {
    await setDoc(doc(db, 'users', uid), {
      ...userData,
      role: userData.role || 'user', // Default to 'user' role
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

export const updateUserProfile = async (uid: string, updates: Partial<UserProfile>) => {
  try {
    await updateDoc(doc(db, 'users', uid), {
      ...updates,
      lastLoginAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// Update user's student profile information
export const updateStudentProfile = async (uid: string, studentProfile: StudentProfileInfo) => {
  try {
    await updateDoc(doc(db, 'users', uid), {
      studentProfile: {
        ...studentProfile,
        profileCompleted: true
      },
      lastLoginAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating student profile:', error);
    throw error;
  }
};

// Mock interview session operations
export interface MockInterviewSession {
  id?: string;
  userId: string;
  sessionType: 'practice' | 'full_mock';
  questions: Array<{
    question: string;
    category: string;
    difficulty: 'easy' | 'medium' | 'hard';
    userAnswer?: string;
    feedback?: string;
    score?: number;
  }>;
  overallScore?: number;
  feedback?: string;
  duration: number; // in minutes
  createdAt: string;
  completedAt?: string;
  status: 'in_progress' | 'completed' | 'abandoned';
}

export const createMockSession = async (sessionData: Omit<MockInterviewSession, 'id' | 'createdAt'>) => {
  try {
    const docRef = await addDoc(collection(db, 'mockSessions'), {
      ...sessionData,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating mock session:', error);
    throw error;
  }
};

export const updateMockSession = async (sessionId: string, updates: Partial<MockInterviewSession>) => {
  try {
    await updateDoc(doc(db, 'mockSessions', sessionId), updates);
  } catch (error) {
    console.error('Error updating mock session:', error);
    throw error;
  }
};

export const getUserMockSessions = async (userId: string, limitCount: number = 10) => {
  try {
    const q = query(
      collection(db, 'mockSessions'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as MockInterviewSession[];
  } catch (error) {
    console.error('Error getting user mock sessions:', error);
    throw error;
  }
};

// Progress tracking
export interface UserProgress {
  userId: string;
  totalSessions: number;
  completedSessions: number;
  averageScore: number;
  strongAreas: string[];
  improvementAreas: string[];
  lastSessionDate: string;
  streakDays: number;
  achievements: string[];
}

export const updateUserProgress = async (userId: string, sessionData: MockInterviewSession) => {
  try {
    const progressDoc = await getDoc(doc(db, 'userProgress', userId));
    
    if (progressDoc.exists()) {
      const currentProgress = progressDoc.data() as UserProgress;
      
      // Calculate new progress metrics
      const newTotalSessions = currentProgress.totalSessions + 1;
      const newCompletedSessions = sessionData.status === 'completed' 
        ? currentProgress.completedSessions + 1 
        : currentProgress.completedSessions;
      
      // Calculate new average score if session is completed
      let newAverageScore = currentProgress.averageScore;
      if (sessionData.status === 'completed' && sessionData.overallScore) {
        newAverageScore = ((currentProgress.averageScore * currentProgress.completedSessions) + sessionData.overallScore) / newCompletedSessions;
      }
      
      await updateDoc(doc(db, 'userProgress', userId), {
        totalSessions: newTotalSessions,
        completedSessions: newCompletedSessions,
        averageScore: newAverageScore,
        lastSessionDate: new Date().toISOString()
      });
    } else {
      // Create new progress document
      await setDoc(doc(db, 'userProgress', userId), {
        userId,
        totalSessions: 1,
        completedSessions: sessionData.status === 'completed' ? 1 : 0,
        averageScore: sessionData.overallScore || 0,
        strongAreas: [],
        improvementAreas: [],
        lastSessionDate: new Date().toISOString(),
        streakDays: 1,
        achievements: []
      });
    }
  } catch (error) {
    console.error('Error updating user progress:', error);
    throw error;
  }
};

export const getUserProgress = async (userId: string): Promise<UserProgress | null> => {
  try {
    const progressDoc = await getDoc(doc(db, 'userProgress', userId));
    if (progressDoc.exists()) {
      return progressDoc.data() as UserProgress;
    }
    return null;
  } catch (error) {
    console.error('Error getting user progress:', error);
    throw error;
  }
};

// Admin role checking functions
export const isUserAdmin = async (uid: string): Promise<boolean> => {
  try {
    const userProfile = await getUserProfile(uid);
    return userProfile?.role === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

export const getUserRole = async (uid: string): Promise<'user' | 'admin' | null> => {
  try {
    const userProfile = await getUserProfile(uid);
    return userProfile?.role || null;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
};

export const updateUserRole = async (uid: string, role: 'user' | 'admin') => {
  try {
    await updateDoc(doc(db, 'users', uid), {
      role: role,
      lastLoginAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
};

// Analytics and reporting
export const getUserAnalytics = async (userId: string) => {
  try {
    const [sessions, progress] = await Promise.all([
      getUserMockSessions(userId, 50),
      getUserProgress(userId)
    ]);
    
    return {
      sessions,
      progress,
      insights: {
        totalTimeSpent: sessions.reduce((total, session) => total + session.duration, 0),
        mostCommonDifficulty: getMostCommonDifficulty(sessions),
        improvementTrend: calculateImprovementTrend(sessions),
        categoryPerformance: calculateCategoryPerformance(sessions)
      }
    };
  } catch (error) {
    console.error('Error getting user analytics:', error);
    throw error;
  }
};

// Helper functions
const getMostCommonDifficulty = (sessions: MockInterviewSession[]) => {
  const difficulties = sessions.flatMap(session => 
    session.questions.map(q => q.difficulty)
  );
  
  const counts = difficulties.reduce((acc, difficulty) => {
    acc[difficulty] = (acc[difficulty] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return Object.entries(counts).reduce((a, b) => counts[a[0]] > counts[b[0]] ? a : b)[0];
};

const calculateImprovementTrend = (sessions: MockInterviewSession[]) => {
  const completedSessions = sessions
    .filter(s => s.status === 'completed' && s.overallScore)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  
  if (completedSessions.length < 2) return 0;
  
  const firstHalf = completedSessions.slice(0, Math.floor(completedSessions.length / 2));
  const secondHalf = completedSessions.slice(Math.floor(completedSessions.length / 2));
  
  const firstHalfAvg = firstHalf.reduce((sum, s) => sum + (s.overallScore || 0), 0) / firstHalf.length;
  const secondHalfAvg = secondHalf.reduce((sum, s) => sum + (s.overallScore || 0), 0) / secondHalf.length;
  
  return secondHalfAvg - firstHalfAvg;
};

const calculateCategoryPerformance = (sessions: MockInterviewSession[]) => {
  const categoryScores: Record<string, number[]> = {};
  
  sessions.forEach(session => {
    session.questions.forEach(question => {
      if (question.score !== undefined) {
        if (!categoryScores[question.category]) {
          categoryScores[question.category] = [];
        }
        categoryScores[question.category].push(question.score);
      }
    });
  });
  
  return Object.entries(categoryScores).map(([category, scores]) => ({
    category,
    averageScore: scores.reduce((sum, score) => sum + score, 0) / scores.length,
    totalQuestions: scores.length
  }));
};

// Dynamic Interview Session operations (LLM-powered)
export interface DynamicInterviewSession {
  id?: string;
  userId: string;
  visaType: 'F1' | 'B1/B2' | 'H1B' | 'other';
  studentProfile: {
    name: string;
    country: string;
    intendedUniversity?: string;
    fieldOfStudy?: string;
    previousEducation?: string;
  };
  conversationHistory: Array<{
    question: string;
    answer: string;
    timestamp: string;
    questionType: string;
    difficulty: string;
  }>;
  currentQuestionNumber: number;
  status: 'active' | 'completed' | 'paused';
  startTime: string;
  endTime?: string;
  score?: {
    overall: number;
    communication: number;
    knowledge: number;
    confidence: number;
  };
  createdAt: string;
}

export const createDynamicInterviewSession = async (sessionData: Omit<DynamicInterviewSession, 'id' | 'createdAt'>) => {
  try {
    const docRef = await addDoc(collection(db, 'dynamicInterviewSessions'), {
      ...sessionData,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating dynamic interview session:', error);
    throw error;
  }
};

export const updateDynamicInterviewSession = async (sessionId: string, updates: Partial<DynamicInterviewSession>) => {
  try {
    await updateDoc(doc(db, 'dynamicInterviewSessions', sessionId), updates);
  } catch (error) {
    console.error('Error updating dynamic interview session:', error);
    throw error;
  }
};

export const getDynamicInterviewSession = async (sessionId: string): Promise<DynamicInterviewSession | null> => {
  try {
    const sessionDoc = await getDoc(doc(db, 'dynamicInterviewSessions', sessionId));
    if (sessionDoc.exists()) {
      return { id: sessionDoc.id, ...sessionDoc.data() } as DynamicInterviewSession;
    }
    return null;
  } catch (error) {
    console.error('Error getting dynamic interview session:', error);
    throw error;
  }
};

export const getUserDynamicInterviewSessions = async (userId: string, limitCount: number = 10) => {
  try {
    const q = query(
      collection(db, 'dynamicInterviewSessions'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as DynamicInterviewSession[];
  } catch (error) {
    console.error('Error getting user dynamic interview sessions:', error);
    throw error;
  }
};
