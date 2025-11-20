import { z } from 'zod'

export const expenseSchema = z.object({
  description: z.string().min(1, 'Description is required').max(500),
  amount: z.number().positive('Amount must be positive'),
  category: z.enum([
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
  ]),
  paymentMethod: z.enum(['Bank Transfer', 'Cash', 'Credit Card', 'Cheque', 'Other']),
  date: z.date(),
  receipt_url: z.string().url().optional(),
  status: z.enum(['pending', 'approved', 'paid', 'rejected']),
  notes: z.string().max(1000).optional(),
})

export const incomeSchema = z.object({
  description: z.string().min(1, 'Description is required').max(500),
  amount: z.number().positive('Amount must be positive'),
  source: z.enum(['Subscription', 'One-time Payment', 'Refund', 'Discount Recovery', 'Other']),
  relatedCustomerId: z.string().optional(),
  relatedSubscriptionId: z.string().optional(),
  date: z.date(),
  status: z.enum(['pending', 'paid', 'cancelled']),
  paymentMethod: z.enum(['Bank Transfer', 'Cash', 'Credit Card', 'Cheque', 'Other']),
  notes: z.string().max(1000).optional(),
})

export const subscriptionSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  customerName: z.string().min(1, 'Customer name is required'),
  planName: z.string().min(1, 'Plan name is required'),
  amount: z.number().positive('Amount must be positive'),
  billingCycle: z.enum(['monthly', 'yearly', 'custom']),
  billingDay: z.number().int().min(1).max(31),
  startDate: z.date(),
  renewalDate: z.date(),
  status: z.enum(['active', 'paused', 'cancelled', 'pending']),
  notes: z.string().max(1000).optional(),
})

export const invoiceSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  customerName: z.string().min(1, 'Customer name is required'),
  customerEmail: z.string().email('Valid email is required'),
  amount: z.number().positive('Amount must be positive'),
  issueDate: z.date(),
  dueDate: z.date(),
  lineItems: z.array(z.object({
    description: z.string().min(1, 'Description is required'),
    quantity: z.number().positive('Quantity must be positive'),
    unitPrice: z.number().positive('Unit price must be positive'),
    amount: z.number().positive('Amount must be positive'),
  })).min(1, 'At least one line item is required'),
  status: z.enum(['draft', 'sent', 'pending', 'paid', 'overdue', 'cancelled']),
  notes: z.string().max(1000).optional(),
})

export type ExpenseInput = z.infer<typeof expenseSchema>
export type IncomeInput = z.infer<typeof incomeSchema>
export type SubscriptionInput = z.infer<typeof subscriptionSchema>
export type InvoiceInput = z.infer<typeof invoiceSchema>
