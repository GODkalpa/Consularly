import { adminDb, Timestamp, FieldValue } from '@/lib/firebase-admin'
import { Income } from '@/types/accounting'

export interface IncomeFilters {
  startDate?: Date
  endDate?: Date
  source?: string
  status?: string
  relatedSubscriptionId?: string
  limit?: number
  offset?: number
}

/**
 * Create a new income in Firestore
 */
export async function createIncome(income: Omit<Income, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const db = adminDb()
  const incomeData = {
    ...income,
    date: Timestamp.fromDate(income.date),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  }

  const docRef = await db.collection('incomes').add(incomeData)
  return docRef.id
}

/**
 * Get incomes with optional filters and pagination
 */
export async function getIncomes(filters: IncomeFilters = {}): Promise<Income[]> {
  const db = adminDb()
  const {
    startDate,
    endDate,
    source,
    status,
    relatedSubscriptionId,
    limit = 50,
    offset = 0
  } = filters

  let query: any = db.collection('incomes')

  // Apply filters
  if (startDate) {
    query = query.where('date', '>=', Timestamp.fromDate(startDate))
  }
  if (endDate) {
    query = query.where('date', '<=', Timestamp.fromDate(endDate))
  }
  if (source) {
    query = query.where('source', '==', source)
  }
  if (status) {
    query = query.where('status', '==', status)
  }
  if (relatedSubscriptionId) {
    query = query.where('relatedSubscriptionId', '==', relatedSubscriptionId)
  }

  // Apply ordering and pagination
  query = query.orderBy('date', 'desc').limit(limit).offset(offset)

  const snapshot = await query.get()
  
  return snapshot.docs.map((doc: any) => {
    const data = doc.data()
    return {
      id: doc.id,
      ...data,
      date: data.date?.toDate() || new Date(),
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
    } as Income
  })
}

/**
 * Get a single income by ID
 */
export async function getIncomeById(id: string): Promise<Income | null> {
  const db = adminDb()
  const doc = await db.collection('incomes').doc(id).get()

  if (!doc.exists) {
    return null
  }

  const data = doc.data()!
  return {
    id: doc.id,
    ...data,
    date: data.date?.toDate() || new Date(),
    createdAt: data.createdAt?.toDate(),
    updatedAt: data.updatedAt?.toDate(),
  } as Income
}

/**
 * Update an existing income
 */
export async function updateIncome(id: string, updates: Partial<Omit<Income, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
  const db = adminDb()
  const updateData: any = {
    ...updates,
    updatedAt: FieldValue.serverTimestamp(),
  }

  // Convert Date to Timestamp if date is being updated
  if (updates.date) {
    updateData.date = Timestamp.fromDate(updates.date)
  }

  await db.collection('incomes').doc(id).update(updateData)
}

/**
 * Delete an income
 */
export async function deleteIncome(id: string): Promise<void> {
  const db = adminDb()
  await db.collection('incomes').doc(id).delete()
}

/**
 * Get total income amount for a date range
 */
export async function getTotalIncome(startDate: Date, endDate: Date, status?: string[]): Promise<number> {
  const db = adminDb()
  let query: any = db.collection('incomes')
    .where('date', '>=', Timestamp.fromDate(startDate))
    .where('date', '<=', Timestamp.fromDate(endDate))

  if (status && status.length > 0) {
    query = query.where('status', 'in', status)
  }

  const snapshot = await query.get()
  
  return snapshot.docs.reduce((total: number, doc: any) => {
    return total + (doc.data().amount || 0)
  }, 0)
}
