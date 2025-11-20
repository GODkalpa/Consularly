import { adminDb, Timestamp, FieldValue } from '@/lib/firebase-admin'
import { Invoice, LineItem } from '@/types/accounting'
import { createIncome } from './income.service'

export interface InvoiceFilters {
  status?: string
  customerId?: string
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}

/**
 * Generate a unique invoice number in format INV-YYYY-###
 */
export async function generateInvoiceNumber(): Promise<string> {
  const db = adminDb()
  const year = new Date().getFullYear()
  
  // Get the count of invoices for this year
  const snapshot = await db.collection('invoices')
    .where('invoiceNumber', '>=', `INV-${year}-000`)
    .where('invoiceNumber', '<=', `INV-${year}-999`)
    .get()
  
  const count = snapshot.size + 1
  const paddedCount = count.toString().padStart(3, '0')
  
  return `INV-${year}-${paddedCount}`
}

/**
 * Calculate total amount from line items
 */
export function calculateLineItemsTotal(lineItems: LineItem[]): number {
  return lineItems.reduce((total, item) => {
    return total + (item.quantity * item.unitPrice)
  }, 0)
}

/**
 * Create a new invoice in Firestore
 */
export async function createInvoice(invoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const db = adminDb()
  
  // Generate invoice number
  const invoiceNumber = await generateInvoiceNumber()
  
  // Calculate total from line items
  const amount = calculateLineItemsTotal(invoice.lineItems)
  
  const invoiceData = {
    ...invoice,
    invoiceNumber,
    amount,
    issueDate: Timestamp.fromDate(invoice.issueDate),
    dueDate: Timestamp.fromDate(invoice.dueDate),
    paymentReceivedDate: invoice.paymentReceivedDate ? Timestamp.fromDate(invoice.paymentReceivedDate) : null,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  }

  const docRef = await db.collection('invoices').add(invoiceData)
  return docRef.id
}

/**
 * Get invoices with optional filters and pagination
 */
export async function getInvoices(filters: InvoiceFilters = {}): Promise<Invoice[]> {
  const db = adminDb()
  const {
    status,
    customerId,
    startDate,
    endDate,
    limit = 50,
    offset = 0
  } = filters

  let query: any = db.collection('invoices')

  // Apply filters
  if (status) {
    query = query.where('status', '==', status)
  }
  if (customerId) {
    query = query.where('customerId', '==', customerId)
  }
  if (startDate) {
    query = query.where('issueDate', '>=', Timestamp.fromDate(startDate))
  }
  if (endDate) {
    query = query.where('issueDate', '<=', Timestamp.fromDate(endDate))
  }

  // Apply ordering and pagination
  query = query.orderBy('issueDate', 'desc').limit(limit).offset(offset)

  const snapshot = await query.get()
  
  return snapshot.docs.map((doc: any) => {
    const data = doc.data()
    return {
      id: doc.id,
      ...data,
      issueDate: data.issueDate?.toDate() || new Date(),
      dueDate: data.dueDate?.toDate() || new Date(),
      paymentReceivedDate: data.paymentReceivedDate?.toDate(),
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
    } as Invoice
  })
}


/**
 * Get a single invoice by ID
 */
export async function getInvoiceById(id: string): Promise<Invoice | null> {
  const db = adminDb()
  const doc = await db.collection('invoices').doc(id).get()

  if (!doc.exists) {
    return null
  }

  const data = doc.data()!
  return {
    id: doc.id,
    ...data,
    issueDate: data.issueDate?.toDate() || new Date(),
    dueDate: data.dueDate?.toDate() || new Date(),
    paymentReceivedDate: data.paymentReceivedDate?.toDate(),
    createdAt: data.createdAt?.toDate(),
    updatedAt: data.updatedAt?.toDate(),
  } as Invoice
}

/**
 * Update an existing invoice
 */
export async function updateInvoice(id: string, updates: Partial<Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt' | 'updatedAt'>>): Promise<void> {
  const db = adminDb()
  const updateData: any = {
    ...updates,
    updatedAt: FieldValue.serverTimestamp(),
  }

  // Convert Date fields to Timestamp
  if (updates.issueDate) {
    updateData.issueDate = Timestamp.fromDate(updates.issueDate)
  }
  if (updates.dueDate) {
    updateData.dueDate = Timestamp.fromDate(updates.dueDate)
  }
  if (updates.paymentReceivedDate) {
    updateData.paymentReceivedDate = Timestamp.fromDate(updates.paymentReceivedDate)
  }

  // Recalculate amount if line items are updated
  if (updates.lineItems) {
    updateData.amount = calculateLineItemsTotal(updates.lineItems)
  }

  await db.collection('invoices').doc(id).update(updateData)
}

/**
 * Mark an invoice as paid and create corresponding income transaction
 */
export async function markInvoiceAsPaid(invoiceId: string, paymentDate: Date): Promise<string> {
  const db = adminDb()
  
  // Get the invoice
  const invoice = await getInvoiceById(invoiceId)
  if (!invoice) {
    throw new Error('Invoice not found')
  }

  if (invoice.status === 'paid') {
    throw new Error('Invoice is already paid')
  }

  // Create income transaction
  const incomeId = await createIncome({
    description: `Payment for Invoice ${invoice.invoiceNumber} - ${invoice.customerName}`,
    amount: invoice.amount,
    source: 'One-time Payment',
    relatedCustomerId: invoice.customerId,
    date: paymentDate,
    status: 'paid',
    paymentMethod: 'Bank Transfer',
  })

  // Update invoice status
  await db.collection('invoices').doc(invoiceId).update({
    status: 'paid',
    paymentReceivedDate: Timestamp.fromDate(paymentDate),
    incomeTransactionId: incomeId,
    updatedAt: FieldValue.serverTimestamp(),
  })

  return incomeId
}

/**
 * Delete an invoice
 */
export async function deleteInvoice(id: string): Promise<void> {
  const db = adminDb()
  await db.collection('invoices').doc(id).delete()
}

/**
 * Get count of pending invoices
 */
export async function getPendingInvoicesCount(): Promise<number> {
  const db = adminDb()
  const snapshot = await db.collection('invoices')
    .where('status', 'in', ['pending', 'sent', 'overdue'])
    .get()
  
  return snapshot.size
}

/**
 * Update overdue invoices (should be run daily)
 */
export async function updateOverdueInvoices(): Promise<number> {
  const db = adminDb()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const snapshot = await db.collection('invoices')
    .where('status', 'in', ['pending', 'sent'])
    .where('dueDate', '<', Timestamp.fromDate(today))
    .get()
  
  const batch = db.batch()
  snapshot.docs.forEach(doc => {
    batch.update(doc.ref, {
      status: 'overdue',
      updatedAt: FieldValue.serverTimestamp(),
    })
  })
  
  await batch.commit()
  return snapshot.size
}
