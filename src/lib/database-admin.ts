// Enhanced Database Helper Functions for Admin-Level Mock Interview System
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
  startAfter,
  getDocs,
  addDoc,
  serverTimestamp,
  Timestamp,
  writeBatch,
  onSnapshot,
  QueryConstraint,
  DocumentSnapshot,
  CollectionReference,
  Query
} from 'firebase/firestore';
import { db } from './firebase';
import {
  UserProfile,
  Interview,
  InterviewMetrics,
  Organization,
  SystemSetting,
  AuditLog,
  UserRole,
  InterviewStatus,
  InterviewType,
  OrganizationPlan,
  CreateInterviewRequest,
  UpdateInterviewRequest,
  CreateUserRequest,
  UpdateUserRequest,
  InterviewFilters,
  UserFilters,
  InterviewAnalytics,
  OrganizationAnalytics,
  PaginatedResponse,
  InterviewWithId,
  UserProfileWithId,
  InterviewMetricsWithId,
  OrganizationWithId,
  SystemSettingWithId,
  AuditLogWithId,
  FirestoreError
} from '../types/firestore';

// ============================================================================
// USER PROFILE OPERATIONS
// ============================================================================

export const createUserProfile = async (
  uid: string, 
  userData: CreateUserRequest
): Promise<void> => {
  try {
    const userProfile: UserProfile = {
      role: userData.role || 'user',
      orgId: userData.orgId,
      email: userData.email,
      displayName: userData.displayName,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
      isActive: true
    };

    await setDoc(doc(db, 'users', uid), userProfile);
    
    // Create audit log
    await createAuditLog({
      userId: uid,
      orgId: userData.orgId,
      action: 'user_created',
      targetId: uid,
      targetType: 'user',
      details: { role: userData.role || 'user', email: userData.email }
    });
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

export const getUserProfile = async (uid: string): Promise<UserProfileWithId | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return {
        id: userDoc.id,
        ...userDoc.data()
      } as UserProfileWithId;
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

export const updateUserProfile = async (
  uid: string, 
  updates: UpdateUserRequest,
  adminUserId?: string
): Promise<void> => {
  try {
    const updateData = {
      ...updates,
      updatedAt: serverTimestamp()
    };

    await updateDoc(doc(db, 'users', uid), updateData);
    
    // Create audit log if updated by admin
    if (adminUserId && adminUserId !== uid) {
      const userProfile = await getUserProfile(uid);
      await createAuditLog({
        userId: adminUserId,
        orgId: userProfile?.orgId || '',
        action: 'user_updated',
        targetId: uid,
        targetType: 'user',
        details: updates
      });
    }
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

export const getUsersByOrganization = async (
  orgId: string,
  filters?: UserFilters
): Promise<PaginatedResponse<UserProfileWithId>> => {
  try {
    const constraints: QueryConstraint[] = [where('orgId', '==', orgId)];
    
    if (filters?.role) {
      constraints.push(where('role', '==', filters.role));
    }
    
    if (filters?.isActive !== undefined) {
      constraints.push(where('isActive', '==', filters.isActive));
    }
    
    constraints.push(orderBy('createdAt', 'desc'));
    
    if (filters?.limit) {
      constraints.push(limit(filters.limit));
    }
    
    const q = query(collection(db, 'users'), ...constraints);
    const querySnapshot = await getDocs(q);
    
    const users = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as UserProfileWithId[];
    
    // Filter by search term if provided
    let filteredUsers = users;
    if (filters?.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase();
      filteredUsers = users.filter(user => 
        user.displayName.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm)
      );
    }
    
    return {
      data: filteredUsers,
      total: filteredUsers.length,
      page: Math.floor((filters?.offset || 0) / (filters?.limit || 10)) + 1,
      limit: filters?.limit || 10,
      hasNextPage: filteredUsers.length === (filters?.limit || 10),
      hasPreviousPage: (filters?.offset || 0) > 0
    };
  } catch (error) {
    console.error('Error getting users by organization:', error);
    throw error;
  }
};

// ============================================================================
// INTERVIEW OPERATIONS
// ============================================================================

export const createInterview = async (
  userId: string,
  orgId: string,
  interviewData: CreateInterviewRequest
): Promise<string> => {
  try {
    const interview: Interview = {
      userId,
      orgId,
      startTime: interviewData.scheduledTime 
        ? Timestamp.fromDate(interviewData.scheduledTime)
        : serverTimestamp() as Timestamp,
      endTime: null,
      status: 'scheduled',
      score: 0,
      scoreDetails: {
        communication: 0,
        technical: 0,
        confidence: 0,
        overall: 0
      },
      interviewType: interviewData.interviewType,
      duration: interviewData.duration || 30,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp
    };

    const docRef = await addDoc(collection(db, 'interviews'), interview);
    
    // Create audit log
    await createAuditLog({
      userId,
      orgId,
      action: 'interview_created',
      targetId: docRef.id,
      targetType: 'interview',
      details: { interviewType: interviewData.interviewType }
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating interview:', error);
    throw error;
  }
};

export const updateInterview = async (
  interviewId: string,
  updates: UpdateInterviewRequest,
  adminUserId?: string
): Promise<void> => {
  try {
    const updateData: any = {
      ...updates,
      updatedAt: serverTimestamp()
    };
    
    if (updates.endTime) {
      updateData.endTime = Timestamp.fromDate(updates.endTime);
    }

    await updateDoc(doc(db, 'interviews', interviewId), updateData);
    
    // Create audit log if updated by admin
    if (adminUserId) {
      const interview = await getInterview(interviewId);
      await createAuditLog({
        userId: adminUserId,
        orgId: interview?.orgId || '',
        action: 'interview_updated',
        targetId: interviewId,
        targetType: 'interview',
        details: updates
      });
    }
  } catch (error) {
    console.error('Error updating interview:', error);
    throw error;
  }
};

export const getInterview = async (interviewId: string): Promise<InterviewWithId | null> => {
  try {
    const interviewDoc = await getDoc(doc(db, 'interviews', interviewId));
    if (interviewDoc.exists()) {
      return {
        id: interviewDoc.id,
        ...interviewDoc.data()
      } as InterviewWithId;
    }
    return null;
  } catch (error) {
    console.error('Error getting interview:', error);
    throw error;
  }
};

export const getUserInterviews = async (
  userId: string,
  filters?: InterviewFilters
): Promise<PaginatedResponse<InterviewWithId>> => {
  try {
    const constraints: QueryConstraint[] = [where('userId', '==', userId)];
    
    if (filters?.status) {
      constraints.push(where('status', '==', filters.status));
    }
    
    if (filters?.interviewType) {
      constraints.push(where('interviewType', '==', filters.interviewType));
    }
    
    constraints.push(orderBy('startTime', 'desc'));
    
    if (filters?.limit) {
      constraints.push(limit(filters.limit));
    }
    
    const q = query(collection(db, 'interviews'), ...constraints);
    const querySnapshot = await getDocs(q);
    
    const interviews = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as InterviewWithId[];
    
    return {
      data: interviews,
      total: interviews.length,
      page: Math.floor((filters?.offset || 0) / (filters?.limit || 10)) + 1,
      limit: filters?.limit || 10,
      hasNextPage: interviews.length === (filters?.limit || 10),
      hasPreviousPage: (filters?.offset || 0) > 0
    };
  } catch (error) {
    console.error('Error getting user interviews:', error);
    throw error;
  }
};

export const getOrganizationInterviews = async (
  orgId: string,
  filters?: InterviewFilters
): Promise<PaginatedResponse<InterviewWithId>> => {
  try {
    const constraints: QueryConstraint[] = [where('orgId', '==', orgId)];
    
    if (filters?.userId) {
      constraints.push(where('userId', '==', filters.userId));
    }
    
    if (filters?.status) {
      constraints.push(where('status', '==', filters.status));
    }
    
    if (filters?.interviewType) {
      constraints.push(where('interviewType', '==', filters.interviewType));
    }
    
    constraints.push(orderBy('startTime', 'desc'));
    
    if (filters?.limit) {
      constraints.push(limit(filters.limit));
    }
    
    const q = query(collection(db, 'interviews'), ...constraints);
    const querySnapshot = await getDocs(q);
    
    const interviews = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as InterviewWithId[];
    
    return {
      data: interviews,
      total: interviews.length,
      page: Math.floor((filters?.offset || 0) / (filters?.limit || 10)) + 1,
      limit: filters?.limit || 10,
      hasNextPage: interviews.length === (filters?.limit || 10),
      hasPreviousPage: (filters?.offset || 0) > 0
    };
  } catch (error) {
    console.error('Error getting organization interviews:', error);
    throw error;
  }
};

// ============================================================================
// INTERVIEW METRICS OPERATIONS
// ============================================================================

export const addInterviewMetrics = async (
  interviewId: string,
  metricsData: Omit<InterviewMetrics, 'timestamp'>
): Promise<string> => {
  try {
    const metrics: InterviewMetrics = {
      ...metricsData,
      timestamp: serverTimestamp() as Timestamp
    };

    const docRef = await addDoc(
      collection(db, 'interviews', interviewId, 'metrics'),
      metrics
    );
    
    return docRef.id;
  } catch (error) {
    console.error('Error adding interview metrics:', error);
    throw error;
  }
};

export const getInterviewMetrics = async (
  interviewId: string
): Promise<InterviewMetricsWithId[]> => {
  try {
    const q = query(
      collection(db, 'interviews', interviewId, 'metrics'),
      orderBy('segmentStart', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      interviewId,
      ...doc.data()
    })) as InterviewMetricsWithId[];
  } catch (error) {
    console.error('Error getting interview metrics:', error);
    throw error;
  }
};

// ============================================================================
// ORGANIZATION OPERATIONS
// ============================================================================

export const createOrganization = async (
  orgData: Omit<Organization, 'createdAt' | 'updatedAt' | 'quotaUsed' | 'adminUsers'>
): Promise<string> => {
  try {
    const organization: Organization = {
      ...orgData,
      quotaUsed: 0,
      adminUsers: [],
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp
    };

    const docRef = await addDoc(collection(db, 'organizations'), organization);
    return docRef.id;
  } catch (error) {
    console.error('Error creating organization:', error);
    throw error;
  }
};

export const getOrganization = async (orgId: string): Promise<OrganizationWithId | null> => {
  try {
    const orgDoc = await getDoc(doc(db, 'organizations', orgId));
    if (orgDoc.exists()) {
      return {
        id: orgDoc.id,
        ...orgDoc.data()
      } as OrganizationWithId;
    }
    return null;
  } catch (error) {
    console.error('Error getting organization:', error);
    throw error;
  }
};

// ============================================================================
// ROLE CHECKING FUNCTIONS
// ============================================================================

export const isUserAdmin = async (uid: string): Promise<boolean> => {
  try {
    const userProfile = await getUserProfile(uid);
    return userProfile?.role === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

export const getUserRole = async (uid: string): Promise<UserRole | null> => {
  try {
    const userProfile = await getUserProfile(uid);
    return userProfile?.role || null;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
};

export const canAccessOrganization = async (
  uid: string,
  orgId: string
): Promise<boolean> => {
  try {
    const userProfile = await getUserProfile(uid);
    if (!userProfile) return false;
    
    // Admins can access any organization
    if (userProfile.role === 'admin') return true;
    
    // Regular users can only access their own organization
    return userProfile.orgId === orgId;
  } catch (error) {
    console.error('Error checking organization access:', error);
    return false;
  }
};

// ============================================================================
// ANALYTICS FUNCTIONS
// ============================================================================

export const getInterviewAnalytics = async (
  orgId?: string,
  startDate?: Date,
  endDate?: Date
): Promise<InterviewAnalytics> => {
  try {
    const constraints: QueryConstraint[] = [];
    
    if (orgId) {
      constraints.push(where('orgId', '==', orgId));
    }
    
    if (startDate) {
      constraints.push(where('startTime', '>=', Timestamp.fromDate(startDate)));
    }
    
    if (endDate) {
      constraints.push(where('startTime', '<=', Timestamp.fromDate(endDate)));
    }
    
    const q = query(collection(db, 'interviews'), ...constraints);
    const querySnapshot = await getDocs(q);
    
    const interviews = querySnapshot.docs.map(doc => doc.data()) as Interview[];
    
    const totalInterviews = interviews.length;
    const completedInterviews = interviews.filter(i => i.status === 'completed');
    const averageScore = completedInterviews.length > 0
      ? completedInterviews.reduce((sum, i) => sum + i.score, 0) / completedInterviews.length
      : 0;
    
    const completionRate = totalInterviews > 0
      ? (completedInterviews.length / totalInterviews) * 100
      : 0;
    
    const averageDuration = completedInterviews.length > 0
      ? completedInterviews.reduce((sum, i) => sum + i.duration, 0) / completedInterviews.length
      : 0;
    
    // Score distribution
    const scoreDistribution = {
      excellent: completedInterviews.filter(i => i.score >= 90).length,
      good: completedInterviews.filter(i => i.score >= 80 && i.score < 90).length,
      average: completedInterviews.filter(i => i.score >= 70 && i.score < 80).length,
      needsImprovement: completedInterviews.filter(i => i.score < 70).length
    };
    
    return {
      totalInterviews,
      averageScore,
      completionRate,
      averageDuration,
      scoreDistribution,
      trendsOverTime: [] // TODO: Implement trends calculation
    };
  } catch (error) {
    console.error('Error getting interview analytics:', error);
    throw error;
  }
};

// ============================================================================
// AUDIT LOG FUNCTIONS
// ============================================================================

export const createAuditLog = async (
  logData: Omit<AuditLog, 'timestamp' | 'id'>
): Promise<void> => {
  try {
    const auditLog: AuditLog = {
      ...logData,
      timestamp: serverTimestamp() as Timestamp
    };

    await addDoc(collection(db, 'auditLogs'), auditLog);
  } catch (error) {
    console.error('Error creating audit log:', error);
    // Don't throw error for audit logs to avoid breaking main functionality
  }
};

// ============================================================================
// REAL-TIME SUBSCRIPTIONS
// ============================================================================

export const subscribeToUserInterviews = (
  userId: string,
  callback: (interviews: InterviewWithId[]) => void
) => {
  const q = query(
    collection(db, 'interviews'),
    where('userId', '==', userId),
    orderBy('startTime', 'desc'),
    limit(20)
  );
  
  return onSnapshot(q, (querySnapshot) => {
    const interviews = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as InterviewWithId[];
    
    callback(interviews);
  });
};

export const subscribeToOrganizationInterviews = (
  orgId: string,
  callback: (interviews: InterviewWithId[]) => void
) => {
  const q = query(
    collection(db, 'interviews'),
    where('orgId', '==', orgId),
    orderBy('startTime', 'desc'),
    limit(50)
  );
  
  return onSnapshot(q, (querySnapshot) => {
    const interviews = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as InterviewWithId[];
    
    callback(interviews);
  });
};

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

export const batchUpdateInterviews = async (
  updates: Array<{ id: string; data: Partial<Interview> }>
): Promise<void> => {
  try {
    const batch = writeBatch(db);
    
    updates.forEach(({ id, data }) => {
      const interviewRef = doc(db, 'interviews', id);
      batch.update(interviewRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
    });
    
    await batch.commit();
  } catch (error) {
    console.error('Error batch updating interviews:', error);
    throw error;
  }
};

export const batchDeleteInterviews = async (interviewIds: string[]): Promise<void> => {
  try {
    const batch = writeBatch(db);
    
    interviewIds.forEach(id => {
      const interviewRef = doc(db, 'interviews', id);
      batch.delete(interviewRef);
    });
    
    await batch.commit();
  } catch (error) {
    console.error('Error batch deleting interviews:', error);
    throw error;
  }
};
