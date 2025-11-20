// Accounting System Type Definitions

export interface Expense {
  id?: string
  description: string
  amount: number
  category: string
  paymentMethod: string
  date: Date
  receipt_url?: string
  status: 'pending' | 'approved' | 'paid' | 'rejected'
  createdAt?: Date
  updatedAt?: Date
  notes?: string
}

export interface Income {
  id?: string
  description: string
  amount: number
  source: string
  relatedCustomerId?: string
  relatedSubscriptionId?: string
  date: Date
  status: 'pending' | 'paid' | 'cancelled'
  paymentMethod: string
  createdAt?: Date
  updatedAt?: Date
  notes?: string
}

export interface Subscription {
  id?: string
  customerId: string
  customerName: string
  planName: string
  amount: number
  billingCycle: 'monthly' | 'yearly' | 'custom'
  billingDay: number
  startDate: Date
  renewalDate: Date
  cancelledDate?: Date
  status: 'active' | 'paused' | 'cancelled' | 'pending'
  paymentHistory: PaymentRecord[]
  notes?: string
  createdAt?: Date
  updatedAt?: Date
}

export interface PaymentRecord {
  paymentId: string
  amount: number
  date: Date
  status: 'pending' | 'paid' | 'failed'
  incomeTransactionId: string
}

export interface Invoice {
  id?: string
  invoiceNumber: string
  customerId: string
  customerName: string
  customerEmail: string
  issueDate: Date
  dueDate: Date
  amount: number
  lineItems: LineItem[]
  status: 'draft' | 'sent' | 'pending' | 'paid' | 'overdue' | 'cancelled'
  paymentReceivedDate?: Date
  incomeTransactionId?: string
  notes?: string
  createdAt?: Date
  updatedAt?: Date
}

export interface LineItem {
  description: string
  quantity: number
  unitPrice: number
  amount: number
}

export interface FinancialSummary {
  totalIncome: number
  totalExpenses: number
  netProfit: number
  activeSubscriptions: number
  mrrValue: number
  invoicesPending: number
}

export interface AuditLogEntry {
  id?: string
  action: 'create' | 'update' | 'delete'
  entityType: 'expense' | 'income' | 'subscription' | 'invoice'
  entityId: string
  userId: string
  changes?: Record<string, any>
  timestamp: Date
}

export interface DateRange {
  start: Date
  end: Date
}

// Additional type exports for better type safety
export type ExpenseStatus = 'pending' | 'approved' | 'paid' | 'rejected';
export type IncomeStatus = 'pending' | 'paid' | 'cancelled';
export type SubscriptionStatus = 'active' | 'paused' | 'cancelled' | 'pending';
export type InvoiceStatus = 'draft' | 'sent' | 'pending' | 'paid' | 'overdue' | 'cancelled';
export type BillingCycle = 'monthly' | 'yearly' | 'custom';
export type PaymentStatus = 'pending' | 'paid' | 'failed';
export type AuditAction = 'create' | 'update' | 'delete';
export type EntityType = 'expense' | 'income' | 'subscription' | 'invoice';
