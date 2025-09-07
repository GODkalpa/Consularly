// Admin Service for Mock Interview System
// This service provides admin-level operations for managing interviews and users

import {
  Firestore,
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
  limit,
  Timestamp,
  writeBatch,
  runTransaction
} from 'firebase/firestore';

import {
  User,
  Interview,
  InterviewMetrics,
  ScoreDetails,
  COLLECTIONS,
  getMetricsPath,
  userConverter,
  interviewConverter,
  metricsConverter
} from './firestore-schema';

export class AdminInterviewService {
  constructor(private db: Firestore) {}

  // User Management
  async createUser(userData: Omit<User, 'uid' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const userRef = collection(this.db, COLLECTIONS.USERS).withConverter(userConverter);
    const now = new Date();
    
    const newUser: Omit<User, 'uid'> = {
      ...userData,
      createdAt: now,
      updatedAt: now
    };

    const docRef = await addDoc(userRef, newUser as User);
    return docRef.id;
  }

  async getUserById(userId: string): Promise<User | null> {
    const userRef = doc(this.db, COLLECTIONS.USERS, userId).withConverter(userConverter);
    const userSnap = await getDoc(userRef);
    return userSnap.exists() ? userSnap.data() : null;
  }

  async getUsersByOrganization(orgId: string): Promise<User[]> {
    const usersRef = collection(this.db, COLLECTIONS.USERS).withConverter(userConverter);
    const q = query(
      usersRef,
      where('orgId', '==', orgId),
      orderBy('displayName')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data());
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<void> {
    const userRef = doc(this.db, COLLECTIONS.USERS, userId);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: new Date()
    });
  }

  async deleteUser(userId: string): Promise<void> {
    const userRef = doc(this.db, COLLECTIONS.USERS, userId);
    await deleteDoc(userRef);
  }

  // Interview Management
  async createInterview(interviewData: Omit<Interview, 'interviewId' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const interviewRef = collection(this.db, COLLECTIONS.INTERVIEWS).withConverter(interviewConverter);
    const now = new Date();
    
    const newInterview: Omit<Interview, 'interviewId'> = {
      ...interviewData,
      createdAt: now,
      updatedAt: now
    };

    const docRef = await addDoc(interviewRef, newInterview as Interview);
    return docRef.id;
  }

  async getInterviewById(interviewId: string): Promise<Interview | null> {
    const interviewRef = doc(this.db, COLLECTIONS.INTERVIEWS, interviewId).withConverter(interviewConverter);
    const interviewSnap = await getDoc(interviewRef);
    return interviewSnap.exists() ? interviewSnap.data() : null;
  }

  async getInterviewsByOrganization(orgId: string, limitCount: number = 50): Promise<Interview[]> {
    const interviewsRef = collection(this.db, COLLECTIONS.INTERVIEWS).withConverter(interviewConverter);
    const q = query(
      interviewsRef,
      where('orgId', '==', orgId),
      orderBy('startTime', 'desc'),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data());
  }

  async getInterviewsByUser(userId: string): Promise<Interview[]> {
    const interviewsRef = collection(this.db, COLLECTIONS.INTERVIEWS).withConverter(interviewConverter);
    const q = query(
      interviewsRef,
      where('userId', '==', userId),
      orderBy('startTime', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data());
  }

  async getInterviewsByStatus(orgId: string, status: Interview['status']): Promise<Interview[]> {
    const interviewsRef = collection(this.db, COLLECTIONS.INTERVIEWS).withConverter(interviewConverter);
    const q = query(
      interviewsRef,
      where('orgId', '==', orgId),
      where('status', '==', status),
      orderBy('startTime', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data());
  }

  async updateInterview(interviewId: string, updates: Partial<Interview>): Promise<void> {
    const interviewRef = doc(this.db, COLLECTIONS.INTERVIEWS, interviewId);
    await updateDoc(interviewRef, {
      ...updates,
      updatedAt: new Date()
    });
  }

  async updateInterviewScore(interviewId: string, score: number, scoreDetails: ScoreDetails): Promise<void> {
    const interviewRef = doc(this.db, COLLECTIONS.INTERVIEWS, interviewId);
    await updateDoc(interviewRef, {
      score,
      scoreDetails,
      status: 'completed',
      updatedAt: new Date()
    });
  }

  async deleteInterview(interviewId: string): Promise<void> {
    // Use a batch to delete interview and all its metrics
    const batch = writeBatch(this.db);
    
    // Delete the interview document
    const interviewRef = doc(this.db, COLLECTIONS.INTERVIEWS, interviewId);
    batch.delete(interviewRef);
    
    // Delete all metrics for this interview
    const metricsRef = collection(this.db, getMetricsPath(interviewId));
    const metricsSnapshot = await getDocs(metricsRef);
    metricsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
  }

  // Metrics Management
  async addInterviewMetrics(interviewId: string, metricsData: Omit<InterviewMetrics, 'metricId' | 'interviewId' | 'recordedAt'>): Promise<string> {
    const metricsRef = collection(this.db, getMetricsPath(interviewId)).withConverter(metricsConverter);
    
    const newMetrics: Omit<InterviewMetrics, 'metricId'> = {
      ...metricsData,
      interviewId,
      recordedAt: new Date()
    };

    const docRef = await addDoc(metricsRef, newMetrics as InterviewMetrics);
    return docRef.id;
  }

  async getInterviewMetrics(interviewId: string): Promise<InterviewMetrics[]> {
    const metricsRef = collection(this.db, getMetricsPath(interviewId)).withConverter(metricsConverter);
    const querySnapshot = await getDocs(metricsRef);
    return querySnapshot.docs.map(doc => doc.data());
  }

  async updateInterviewMetrics(interviewId: string, metricId: string, updates: Partial<InterviewMetrics>): Promise<void> {
    const metricRef = doc(this.db, getMetricsPath(interviewId), metricId);
    await updateDoc(metricRef, updates);
  }

  async deleteInterviewMetrics(interviewId: string, metricId: string): Promise<void> {
    const metricRef = doc(this.db, getMetricsPath(interviewId), metricId);
    await deleteDoc(metricRef);
  }

  // Analytics and Reporting
  async getOrganizationStats(orgId: string): Promise<{
    totalUsers: number;
    totalInterviews: number;
    completedInterviews: number;
    averageScore: number;
    interviewsByStatus: Record<Interview['status'], number>;
  }> {
    const [users, interviews] = await Promise.all([
      this.getUsersByOrganization(orgId),
      this.getInterviewsByOrganization(orgId, 1000) // Get more for stats
    ]);

    const completedInterviews = interviews.filter(i => i.status === 'completed');
    const averageScore = completedInterviews.length > 0 
      ? completedInterviews.reduce((sum, i) => sum + (i.score || 0), 0) / completedInterviews.length
      : 0;

    const interviewsByStatus = interviews.reduce((acc, interview) => {
      acc[interview.status] = (acc[interview.status] || 0) + 1;
      return acc;
    }, {} as Record<Interview['status'], number>);

    return {
      totalUsers: users.length,
      totalInterviews: interviews.length,
      completedInterviews: completedInterviews.length,
      averageScore: Math.round(averageScore * 100) / 100,
      interviewsByStatus
    };
  }

  // Bulk Operations
  async bulkUpdateInterviewStatus(interviewIds: string[], status: Interview['status']): Promise<void> {
    const batch = writeBatch(this.db);
    
    interviewIds.forEach(id => {
      const interviewRef = doc(this.db, COLLECTIONS.INTERVIEWS, id);
      batch.update(interviewRef, {
        status,
        updatedAt: new Date()
      });
    });
    
    await batch.commit();
  }

  async bulkDeleteInterviews(interviewIds: string[]): Promise<void> {
    const batch = writeBatch(this.db);
    
    for (const interviewId of interviewIds) {
      // Delete interview
      const interviewRef = doc(this.db, COLLECTIONS.INTERVIEWS, interviewId);
      batch.delete(interviewRef);
      
      // Delete associated metrics
      const metricsSnapshot = await getDocs(collection(this.db, getMetricsPath(interviewId)));
      metricsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
    }
    
    await batch.commit();
  }
}