/**
 * Accounting System Constants
 * 
 * Predefined categories, statuses, and other constant values
 * used throughout the accounting module.
 */

export const EXPENSE_CATEGORIES = [
  'Office Rent',
  'Utilities',
  'Employee Salaries',
  'Marketing & Advertising',
  'Professional Services',
  'Business Insurance',
  'Office Supplies',
  'Travel Expenses',
  'Internet & Communication',
  'Software & Cloud Services',
  'Meals & Entertainment',
  'Vehicle Expenses',
  'Equipment',
  'Other'
] as const;

export const INCOME_SOURCES = [
  'Subscription',
  'One-time Payment',
  'Refund',
  'Discount Recovery',
  'Other'
] as const;

export const PAYMENT_METHODS = [
  'Bank Transfer',
  'Cash',
  'Credit Card',
  'Cheque',
  'Other'
] as const;

export const EXPENSE_STATUSES = [
  'pending',
  'approved',
  'paid',
  'rejected'
] as const;

export const INCOME_STATUSES = [
  'pending',
  'paid',
  'cancelled'
] as const;

export const SUBSCRIPTION_STATUSES = [
  'active',
  'paused',
  'cancelled',
  'pending'
] as const;

export const INVOICE_STATUSES = [
  'draft',
  'sent',
  'pending',
  'paid',
  'overdue',
  'cancelled'
] as const;

export const BILLING_CYCLES = [
  'monthly',
  'yearly',
  'custom'
] as const;

// Status badge colors
export const EXPENSE_STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  approved: 'bg-blue-100 text-blue-800 border-blue-200',
  paid: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
} as const;

export const INCOME_STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  paid: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
} as const;

export const SUBSCRIPTION_STATUS_COLORS = {
  active: 'bg-green-100 text-green-800 border-green-200',
  paused: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  pending: 'bg-gray-100 text-gray-800 border-gray-200',
} as const;

export const INVOICE_STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-800 border-gray-200',
  sent: 'bg-blue-100 text-blue-800 border-blue-200',
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  paid: 'bg-green-100 text-green-800 border-green-200',
  overdue: 'bg-red-100 text-red-800 border-red-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
} as const;
