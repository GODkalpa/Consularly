import { adminDb, FieldValue } from '@/lib/firebase-admin'
import { AuditLogEntry } from '@/types/accounting'

export interface AuditLogFilters {
  entityType?: 'expense' | 'income' | 'subscription' | 'invoice'
  userId?: string
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(
  action: 'create' | 'update' | 'delete',
  entityType: 'expense' | 'income' | 'subscription' | 'invoice',
  entityId: string,
  userId: string,
  changes?: Record<string, any>
): Promise<string> {
  const db = adminDb()
  
  const auditData = {
    action,
    entityType,
    entityId,
    userId,
    changes: changes || null,
    timestamp: FieldValue.serverTimestamp(),
  }

  const docRef = await db.collection('accounting_audit_log').add(auditData)
  return docRef.id
}

/**
 * Get audit logs with optional filters and pagination
 */
export async function getAuditLogs(filters: AuditLogFilters = {}): Promise<AuditLogEntry[]> {
  const db = adminDb()
  const {
    entityType,
    userId,
    startDate,
    endDate,
    limit = 50,
    offset = 0
  } = filters

  let query: any = db.collection('accounting_audit_log')

  // Apply filters
  if (entityType) {
    query = query.where('entityType', '==', entityType)
  }
  if (userId) {
    query = query.where('userId', '==', userId)
  }
  if (startDate) {
    query = query.where('timestamp', '>=', startDate)
  }
  if (endDate) {
    query = query.where('timestamp', '<=', endDate)
  }

  // Apply ordering and pagination
  query = query.orderBy('timestamp', 'desc').limit(limit).offset(offset)

  const snapshot = await query.get()
  
  return snapshot.docs.map((doc: any) => {
    const data = doc.data()
    return {
      id: doc.id,
      ...data,
      timestamp: data.timestamp?.toDate() || new Date(),
    } as AuditLogEntry
  })
}

/**
 * Get audit logs for a specific entity
 */
export async function getEntityAuditLogs(
  entityType: 'expense' | 'income' | 'subscription' | 'invoice',
  entityId: string
): Promise<AuditLogEntry[]> {
  const db = adminDb()
  
  const snapshot = await db.collection('accounting_audit_log')
    .where('entityType', '==', entityType)
    .where('entityId', '==', entityId)
    .orderBy('timestamp', 'desc')
    .get()
  
  return snapshot.docs.map((doc: any) => {
    const data = doc.data()
    return {
      id: doc.id,
      ...data,
      timestamp: data.timestamp?.toDate() || new Date(),
    } as AuditLogEntry
  })
}

/**
 * Get audit logs for a specific user
 */
export async function getUserAuditLogs(userId: string, limit: number = 50): Promise<AuditLogEntry[]> {
  return getAuditLogs({ userId, limit })
}
