# Master Prompt: Accounting Dashboard for Next.js SaaS (Simplified - No Tax)

## PROJECT OVERVIEW

You are building a **simplified accounting and subscription management system** for an existing Next.js SaaS admin dashboard. The system will track expenses, incomes, and manage subscriptions without tax compliance features.

## CURRENT CONTEXT

- **Existing Stack**: Next.js 14+, Firebase (Authentication & Firestore), Tailwind CSS
- **Integration Point**: Replace existing placeholder in the billing page
- **Payment System**: Currently manual (no external payment processor)
- **Authentication**: Firebase Auth already implemented
- **Scope**: Basic accounting only (no tax calculations)

## PROJECT STRUCTURE

```
src/
├── app/
│   ├── admin/
│   │   ├── accounting/
│   │   │   ├── page.tsx                 # Main accounting dashboard
│   │   │   ├── expenses/
│   │   │   │   ├── page.tsx
│   │   │   │   └── new/page.tsx
│   │   │   ├── incomes/
│   │   │   │   ├── page.tsx
│   │   │   │   └── new/page.tsx
│   │   │   ├── subscriptions/
│   │   │   │   ├── page.tsx
│   │   │   │   └── new/page.tsx
│   │   │   └── invoices/
│   │   │       ├── page.tsx
│   │   │       └── new/page.tsx
│   │   └── billing/
│   │       └── page.tsx                 # (Existing page with accounting component)
│   └── api/
│       └── accounting/
│           ├── expenses/route.ts
│           ├── incomes/route.ts
│           ├── subscriptions/route.ts
│           └── invoices/route.ts
│
├── components/
│   ├── accounting/
│   │   ├── AccountingDashboard.tsx       # Main container
│   │   ├── FinancialOverview.tsx         # Key metrics cards
│   │   ├── DashboardCharts.tsx           # Charts & visualizations
│   │   ├── ExpensesTable.tsx
│   │   ├── IncomesTable.tsx
│   │   ├── SubscriptionsManager.tsx
│   │   ├── InvoiceManager.tsx
│   │   ├── TransactionForm.tsx           # Reusable form
│   │   ├── CategorySelector.tsx
│   │   └── ExportReports.tsx
│   ├── ui/
│   │   ├── card.tsx
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── table.tsx
│   │   ├── tabs.tsx
│   │   ├── dialog.tsx
│   │   └── chart.tsx
│   └── shared/
│       ├── LoadingSpinner.tsx
│       ├── ErrorBoundary.tsx
│       └── EmptyState.tsx
│
├── lib/
│   ├── firebase.ts                      # Firebase config & helpers
│   ├── firestore-schema.ts              # Firestore collection schemas
│   ├── utils.ts
│   └── constants.ts
│
├── hooks/
│   ├── useAccounting.ts                 # Custom hook for accounting data
│   ├── useExpenses.ts
│   ├── useIncomes.ts
│   ├── useSubscriptions.ts
│   └── useFinancialMetrics.ts
│
├── types/
│   ├── accounting.ts                    # TypeScript interfaces
│   └── firebase.ts
│
├── services/
│   ├── expense.service.ts
│   ├── income.service.ts
│   ├── subscription.service.ts
│   └── invoice.service.ts
│
└── styles/
    └── globals.css
```

## FIRESTORE DATABASE SCHEMA

```typescript
Collections/expenses {
  expenseId: string (auto-generated)
  description: string
  amount: number
  category: string (Office, Marketing, Operations, Professional Services, etc.)
  paymentMethod: string (bank_transfer, cash, credit_card)
  date: Timestamp
  receipt_url: string (optional)
  status: "pending" | "approved" | "paid" | "rejected"
  createdAt: Timestamp
  updatedAt: Timestamp
  notes: string
}

Collections/incomes {
  incomeId: string (auto-generated)
  description: string
  amount: number
  source: string (subscription, one-time_payment, refund, other)
  relatedCustomerId: string (optional)
  relatedSubscriptionId: string (optional)
  date: Timestamp
  status: "pending" | "paid" | "cancelled"
  paymentMethod: string
  createdAt: Timestamp
  updatedAt: Timestamp
  notes: string
}

Collections/subscriptions {
  subscriptionId: string
  customerId: string
  customerName: string
  planName: string
  amount: number
  billingCycle: "monthly" | "yearly" | "custom"
  billingDay: number (1-31)
  startDate: Timestamp
  renewalDate: Timestamp
  cancelledDate: Timestamp (optional)
  status: "active" | "paused" | "cancelled" | "pending"
  paymentHistory: array[{
    paymentId: string
    amount: number
    date: Timestamp
    status: "pending" | "paid" | "failed"
    incomeTransactionId: string
  }]
  notes: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

Collections/invoices {
  invoiceId: string
  invoiceNumber: string (e.g., INV-2025-001)
  customerId: string
  customerName: string
  customerEmail: string
  issueDate: Timestamp
  dueDate: Timestamp
  amount: number
  lineItems: array[{
    description: string
    quantity: number
    unitPrice: number
    amount: number
  }]
  status: "draft" | "sent" | "pending" | "paid" | "overdue" | "cancelled"
  paymentReceivedDate: Timestamp (optional)
  incomeTransactionId: string
  notes: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

Collections/accounting_audit_log {
  auditId: string
  action: string (create, update, delete)
  entityType: string (expense, income, subscription, invoice)
  entityId: string
  userId: string
  changes: object
  timestamp: Timestamp
}
```

## EXPENSE & INCOME CATEGORIES

```typescript
// lib/constants.ts

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
];

export const INCOME_SOURCES = [
  'Subscription',
  'One-time Payment',
  'Refund',
  'Discount Recovery',
  'Other'
];

export const PAYMENT_METHODS = [
  'Bank Transfer',
  'Cash',
  'Credit Card',
  'Cheque',
  'Other'
];

export const TRANSACTION_STATUSES = {
  PENDING: 'pending',
  APPROVED: 'approved',
  PAID: 'paid',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
};
```

## KEY COMPONENTS

### 1. AccountingDashboard.tsx
Main container component that displays:
- Quick stats (Income, Expenses, Net Profit, Active Subscriptions)
- Charts (monthly trends, category breakdown)
- Recent transactions
- Quick action buttons

### 2. FinancialOverview.tsx
Display cards showing:
- Total Income
- Total Expenses
- Net Profit/Loss
- Active Subscriptions Count

### 3. DashboardCharts.tsx
Charts using Recharts:
- Monthly Income vs Expense Bar Chart
- Cash Flow Trend Line Chart
- Expense Breakdown Pie Chart
- Income Sources Pie Chart

### 4. ExpensesTable.tsx
Data table with:
- Columns: Date, Description, Category, Amount, Status, Actions
- Sorting, filtering, pagination
- Add/Edit/Delete actions
- Bulk operations (export, approve)
- Category filter

### 5. IncomesTable.tsx
Data table with:
- Columns: Date, Description, Source, Amount, Status, Actions
- Link to related subscription
- Sorting, filtering, pagination
- Add/Edit/Delete actions

### 6. SubscriptionsManager.tsx
Display all subscriptions with:
- Active/Paused/Cancelled tabs
- Add new subscription form
- Record payment button
- Payment history
- Renewal date tracking
- MRR (Monthly Recurring Revenue) calculation

### 7. InvoiceManager.tsx
Invoice management with:
- List of invoices with status
- Create new invoice form
- View/Edit/Delete invoices
- Mark as paid
- Download PDF (future feature)
- Filter by status and date

### 8. TransactionForm.tsx
Reusable form for expenses and incomes with:
- Description input
- Amount input
- Date picker
- Category/Source dropdown
- Payment method select
- Status select
- Notes textarea
- Receipt upload (optional)
- Form validation

## IMPLEMENTATION REQUIREMENTS

### Authentication & Authorization
- Only admin users can access accounting module
- Firestore security rules restrict access to admin
- Activity logging for all changes

### Data Validation
- All amounts must be positive
- Dates must be in valid format
- Categories from predefined list
- Required fields enforced
- Status transitions validated

### Features

**1. Expense Management**
- CRUD operations for expenses
- Categorization
- Status tracking (pending, approved, paid, rejected)
- Payment method tracking
- Optional receipt upload
- Date and amount filtering

**2. Income Management**
- CRUD operations for incomes
- Source tracking (subscription, one-time, refund, other)
- Link to subscriptions
- Date range filtering
- Amount tracking

**3. Subscription Management**
- CRUD operations
- Automatic renewal tracking
- Payment history
- Billing cycle (monthly/yearly)
- Automatic MRR calculation
- Payment recording
- Subscription status management (active, paused, cancelled)

**4. Invoice Management**
- Generate invoices with unique numbers (INV-YYYY-###)
- Track customer info
- Line items with amounts
- Payment status tracking
- Due date tracking
- Link to income transactions

**5. Financial Reporting**
- Monthly P&L summary
- Cash flow overview
- Expense breakdown by category
- Income breakdown by source
- Net profit/loss calculation
- MRR tracking

**6. Export Functionality**
- Export transactions to CSV
- Export financial reports
- Export subscription list

## TECHNICAL SPECIFICATIONS

### Frontend
- Next.js 14+ with App Router
- Shadcn UI components for consistency
- TanStack Table for advanced tables
- Recharts for financial visualizations
- React Hook Form + Zod for validation
- TailwindCSS for styling
- Responsive design (mobile, tablet, desktop)

### Backend
- Next.js API routes for data operations
- Firebase Firestore for storage
- Server-side form validation
- Proper error handling
- Timestamp consistency

### Database
- Firestore collections as specified
- Security rules for admin-only access
- Audit logging for all changes
- Soft deletes for data preservation

### Performance
- Load dashboard in < 2 seconds
- Table pagination for large datasets
- Chart optimization
- Real-time sync for critical data
- Efficient queries with proper indexes

### Security
- Admin-only access to accounting module
- Audit logs for all changes
- No sensitive data in client
- Rate limiting (future)
- Input validation

## TYPES DEFINITION

```typescript
// types/accounting.ts

export interface Expense {
  id?: string;
  description: string;
  amount: number;
  category: string;
  paymentMethod: string;
  date: Date;
  receipt_url?: string;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  createdAt?: Date;
  updatedAt?: Date;
  notes?: string;
}

export interface Income {
  id?: string;
  description: string;
  amount: number;
  source: string;
  relatedCustomerId?: string;
  relatedSubscriptionId?: string;
  date: Date;
  status: 'pending' | 'paid' | 'cancelled';
  paymentMethod: string;
  createdAt?: Date;
  updatedAt?: Date;
  notes?: string;
}

export interface Subscription {
  id?: string;
  customerId: string;
  customerName: string;
  planName: string;
  amount: number;
  billingCycle: 'monthly' | 'yearly' | 'custom';
  billingDay: number;
  startDate: Date;
  renewalDate: Date;
  cancelledDate?: Date;
  status: 'active' | 'paused' | 'cancelled' | 'pending';
  paymentHistory: PaymentRecord[];
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PaymentRecord {
  paymentId: string;
  amount: number;
  date: Date;
  status: 'pending' | 'paid' | 'failed';
  incomeTransactionId: string;
}

export interface Invoice {
  id?: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  issueDate: Date;
  dueDate: Date;
  amount: number;
  lineItems: LineItem[];
  status: 'draft' | 'sent' | 'pending' | 'paid' | 'overdue' | 'cancelled';
  paymentReceivedDate?: Date;
  incomeTransactionId?: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  activeSubscriptions: number;
  mrrValue: number;
  invoicesPending: number;
}
```

## BUILD CHECKLIST

- [ ] Create project structure and files
- [ ] Set up Firebase Firestore collections
- [ ] Create TypeScript interfaces
- [ ] Implement Firestore security rules
- [ ] Build core services (expense, income, subscription, invoice)
- [ ] Create custom hooks
- [ ] Build UI components (use Shadcn UI)
- [ ] Create dashboard overview
- [ ] Build expense management (CRUD + table)
- [ ] Build income management (CRUD + table)
- [ ] Build subscription management
- [ ] Build invoice management
- [ ] Add data visualization (charts)
- [ ] Add export functionality
- [ ] Implement form validation
- [ ] Add error handling
- [ ] Add loading states
- [ ] Test all workflows
- [ ] Optimize performance
- [ ] Make responsive design
- [ ] Integrate into billing page

## INTEGRATION WITH EXISTING BILLING PAGE

Replace the placeholder in the existing billing page with:

```typescript
import AccountingDashboard from '@/components/accounting/AccountingDashboard';

export default function BillingPage() {
  return (
    <div>
      <h1>Billing & Accounting</h1>
      <AccountingDashboard />
    </div>
  );
}
```

- Maintain navigation consistency
- Use existing auth context
- Match existing UI styling
- Ensure responsive design
- Follow existing code patterns