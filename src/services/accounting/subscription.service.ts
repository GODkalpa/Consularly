import { adminDb, Timestamp, FieldValue } from '@/lib/firebase-admin'
import { Subscription, PaymentRecord } from '@/types/accounting'
import { createIncome } from './income.service'

export interface SubscriptionFilters {
  status?: string
  customerId?: string
  limit?: number
  offset?: number
}

/**
 * Create a new subscription in Firestore
 */
export async function createSubscription(subscription: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt' | 'paymentHistory'>): Promise<string> {
  const db = adminDb()
  const subscriptionData = {
    ...subscription,
    startDate: Timestamp.fromDate(subscription.startDate),
    renewalDate: Timestamp.fromDate(subscription.renewalDate),
    cancelledDate: subscription.cancelledDate ? Timestamp.fromDate(subscription.cancelledDate) : null,
    paymentHistory: [],
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  }

  const docRef = await db.collection('subscriptions').add(subscriptionData)
  return docRef.id
}

/**
 * Get subscriptions with optional filters and pagination
 */
export async function getSubscriptions(filters: SubscriptionFilters = {}): Promise<Subscription[]> {
  const db = adminDb()
  const {
    status,
    customerId,
    limit = 50,
    offset = 0
  } = filters

  let query: any = db.collection('subscriptions')

  // Apply filters
  if (status) {
    query = query.where('status', '==', status)
  }
  if (customerId) {
    query = query.where('customerId', '==', customerId)
  }

  // Apply ordering and pagination
  query = query.orderBy('renewalDate', 'asc').limit(limit).offset(offset)

  const snapshot = await query.get()
  
  return snapshot.docs.map((doc: any) => {
    const data = doc.data()
    return {
      id: doc.id,
      ...data,
      startDate: data.startDate?.toDate() || new Date(),
      renewalDate: data.renewalDate?.toDate() || new Date(),
      cancelledDate: data.cancelledDate?.toDate(),
      paymentHistory: (data.paymentHistory || []).map((p: any) => ({
        ...p,
        date: p.date?.toDate ? p.date.toDate() : new Date(p.date),
      })),
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
    } as Subscription
  })
}


/**
 * Get a single subscription by ID
 */
export async function getSubscriptionById(id: string): Promise<Subscription | null> {
  const db = adminDb()
  const doc = await db.collection('subscriptions').doc(id).get()

  if (!doc.exists) {
    return null
  }

  const data = doc.data()!
  return {
    id: doc.id,
    ...data,
    startDate: data.startDate?.toDate() || new Date(),
    renewalDate: data.renewalDate?.toDate() || new Date(),
    cancelledDate: data.cancelledDate?.toDate(),
    paymentHistory: (data.paymentHistory || []).map((p: any) => ({
      ...p,
      date: p.date?.toDate ? p.date.toDate() : new Date(p.date),
    })),
    createdAt: data.createdAt?.toDate(),
    updatedAt: data.updatedAt?.toDate(),
  } as Subscription
}

/**
 * Update an existing subscription
 */
export async function updateSubscription(id: string, updates: Partial<Omit<Subscription, 'id' | 'createdAt' | 'updatedAt' | 'paymentHistory'>>): Promise<void> {
  const db = adminDb()
  const updateData: any = {
    ...updates,
    updatedAt: FieldValue.serverTimestamp(),
  }

  // Convert Date fields to Timestamp
  if (updates.startDate) {
    updateData.startDate = Timestamp.fromDate(updates.startDate)
  }
  if (updates.renewalDate) {
    updateData.renewalDate = Timestamp.fromDate(updates.renewalDate)
  }
  if (updates.cancelledDate) {
    updateData.cancelledDate = Timestamp.fromDate(updates.cancelledDate)
  }

  await db.collection('subscriptions').doc(id).update(updateData)
}

/**
 * Record a payment for a subscription and create corresponding income transaction
 */
export async function recordPayment(
  subscriptionId: string,
  amount: number,
  paymentDate: Date,
  userId: string
): Promise<string> {
  const db = adminDb()
  
  // Get the subscription
  const subscription = await getSubscriptionById(subscriptionId)
  if (!subscription) {
    throw new Error('Subscription not found')
  }

  // Create income transaction
  const incomeId = await createIncome({
    description: `Payment for ${subscription.planName} - ${subscription.customerName}`,
    amount,
    source: 'Subscription',
    relatedCustomerId: subscription.customerId,
    relatedSubscriptionId: subscriptionId,
    date: paymentDate,
    status: 'paid',
    paymentMethod: 'Bank Transfer',
  })

  // Create payment record
  const paymentRecord: PaymentRecord = {
    paymentId: `PAY-${Date.now()}`,
    amount,
    date: paymentDate,
    status: 'paid',
    incomeTransactionId: incomeId,
  }

  // Update subscription with new payment
  await db.collection('subscriptions').doc(subscriptionId).update({
    paymentHistory: FieldValue.arrayUnion({
      ...paymentRecord,
      date: Timestamp.fromDate(paymentDate),
    }),
    updatedAt: FieldValue.serverTimestamp(),
  })

  // Calculate next renewal date
  const nextRenewalDate = calculateNextRenewalDate(subscription.renewalDate, subscription.billingCycle)
  await updateSubscription(subscriptionId, { renewalDate: nextRenewalDate })

  return incomeId
}

/**
 * Calculate next renewal date based on billing cycle
 */
export function calculateNextRenewalDate(currentRenewalDate: Date, billingCycle: 'monthly' | 'yearly' | 'custom'): Date {
  const nextDate = new Date(currentRenewalDate)
  
  switch (billingCycle) {
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1)
      break
    case 'yearly':
      nextDate.setFullYear(nextDate.getFullYear() + 1)
      break
    case 'custom':
      // For custom, default to monthly
      nextDate.setMonth(nextDate.getMonth() + 1)
      break
  }
  
  return nextDate
}

/**
 * Calculate Monthly Recurring Revenue (MRR) from active subscriptions
 */
export async function calculateMRR(): Promise<number> {
  const activeSubscriptions = await getSubscriptions({ status: 'active' })
  
  return activeSubscriptions.reduce((total, sub) => {
    let monthlyAmount = sub.amount
    
    // Convert yearly to monthly
    if (sub.billingCycle === 'yearly') {
      monthlyAmount = sub.amount / 12
    }
    
    return total + monthlyAmount
  }, 0)
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(id: string): Promise<void> {
  await updateSubscription(id, {
    status: 'cancelled',
    cancelledDate: new Date(),
  })
}
