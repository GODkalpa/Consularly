import { adminDb, Timestamp, FieldValue } from '@/lib/firebase-admin'
import { Expense } from '@/types/accounting'

export interface ExpenseFilters {
  startDate?: Date
  endDate?: Date
  category?: string
  status?: string
  limit?: number
  offset?: number
}

/**
 * Create a new expense in Firestore
 */
export async function createExpense(expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const db = adminDb()
  const expenseData = {
    ...expense,
    date: Timestamp.fromDate(expense.date),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  }

  const docRef = await db.collection('expenses').add(expenseData)
  return docRef.id
}

/**
 * Get expenses with optional filters and pagination
 */
export async function getExpenses(filters: ExpenseFilters = {}): Promise<Expense[]> {
  const db = adminDb()
  const {
    startDate,
    endDate,
    category,
    status,
    limit = 50,
    offset = 0
  } = filters

  let query: any = db.collection('expenses')

  // Apply filters
  if (startDate) {
    query = query.where('date', '>=', Timestamp.fromDate(startDate))
  }
  if (endDate) {
    query = query.where('date', '<=', Timestamp.fromDate(endDate))
  }
  if (category) {
    query = query.where('category', '==', category)
  }
  if (status) {
    query = query.where('status', '==', status)
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
    } as Expense
  })
}


/**
 * Get a single expense by ID
 */
export async function getExpenseById(id: string): Promise<Expense | null> {
  const db = adminDb()
  const doc = await db.collection('expenses').doc(id).get()

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
  } as Expense
}

/**
 * Update an existing expense
 */
export async function updateExpense(id: string, updates: Partial<Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
  const db = adminDb()
  const updateData: any = {
    ...updates,
    updatedAt: FieldValue.serverTimestamp(),
  }

  // Convert Date to Timestamp if date is being updated
  if (updates.date) {
    updateData.date = Timestamp.fromDate(updates.date)
  }

  await db.collection('expenses').doc(id).update(updateData)
}

/**
 * Delete an expense
 */
export async function deleteExpense(id: string): Promise<void> {
  const db = adminDb()
  await db.collection('expenses').doc(id).delete()
}

/**
 * Get total expense amount for a date range
 */
export async function getTotalExpenses(startDate: Date, endDate: Date, status?: string[]): Promise<number> {
  const db = adminDb()
  let query: any = db.collection('expenses')
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
