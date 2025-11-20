# Accounting Module Documentation

## Overview

The Accounting Module is a comprehensive billing and financial management system integrated into the admin dashboard. It provides tools for tracking expenses, income, subscriptions, and invoices with full audit logging.

## Features

### 1. Financial Overview
- Real-time financial metrics dashboard
- Total income, expenses, and net profit tracking
- Active subscriptions count and MRR (Monthly Recurring Revenue)
- Pending invoices tracking

### 2. Expense Management
- Create, read, update, and delete expenses
- Categorize expenses (Salaries, Marketing, Infrastructure, etc.)
- Track expense status (pending, approved, rejected)
- Upload and attach receipts
- Filter by category, status, and date range
- Export to CSV

### 3. Income Management
- Track all revenue sources
- Link income to subscriptions automatically
- Filter by source, status, and date range
- Export to CSV

### 4. Subscription Management
- Manage recurring customer subscriptions
- Support for monthly and yearly billing cycles
- Automatic MRR calculation
- Record subscription payments
- Track subscription status (active, paused, cancelled)
- Payment history for each subscription

### 5. Invoice Management
- Create and manage invoices with line items
- Automatic invoice number generation
- Track invoice status (draft, sent, pending, paid, overdue, cancelled)
- Mark invoices as paid (automatically creates income record)
- Automatic overdue status updates

### 6. Data Visualization
- Monthly income vs expense bar charts
- Cash flow trend line charts
- Expense breakdown by category (pie chart)
- Income sources breakdown (pie chart)

### 7. Audit Logging
- Complete audit trail for all financial transactions
- Track who made changes and when
- Immutable audit logs
- Filter by entity type, user, and date

## API Endpoints

### Expenses
- `GET /api/admin/accounting/expenses` - List expenses with filters
- `POST /api/admin/accounting/expenses` - Create expense
- `PATCH /api/admin/accounting/expenses/[id]` - Update expense
- `DELETE /api/admin/accounting/expenses/[id]` - Delete expense

### Incomes
- `GET /api/admin/accounting/incomes` - List incomes with filters
- `POST /api/admin/accounting/incomes` - Create income
- `PATCH /api/admin/accounting/incomes/[id]` - Update income
- `DELETE /api/admin/accounting/incomes/[id]` - Delete income

### Subscriptions
- `GET /api/admin/accounting/subscriptions` - List subscriptions
- `POST /api/admin/accounting/subscriptions` - Create subscription
- `PATCH /api/admin/accounting/subscriptions/[id]` - Update subscription
- `POST /api/admin/accounting/subscriptions/[id]/payment` - Record payment
- `DELETE /api/admin/accounting/subscriptions/[id]` - Cancel subscription

### Invoices
- `GET /api/admin/accounting/invoices` - List invoices
- `POST /api/admin/accounting/invoices` - Create invoice
- `PATCH /api/admin/accounting/invoices/[id]` - Update invoice
- `POST /api/admin/accounting/invoices/[id]/mark-paid` - Mark as paid
- `DELETE /api/admin/accounting/invoices/[id]` - Delete invoice

### Reports
- `GET /api/admin/accounting/financial-summary` - Get financial metrics
- `GET /api/admin/accounting/charts-data` - Get chart data
- `GET /api/admin/accounting/export` - Export data to CSV

## Firestore Collections

### expenses
```typescript
{
  id: string;
  date: Timestamp;
  description: string;
  amount: number;
  category: string;
  status: 'pending' | 'approved' | 'rejected';
  receipt_url?: string;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### incomes
```typescript
{
  id: string;
  date: Timestamp;
  description: string;
  amount: number;
  source: string;
  status: 'pending' | 'received' | 'cancelled';
  relatedSubscriptionId?: string;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### subscriptions
```typescript
{
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  planName: string;
  amount: number;
  billingCycle: 'monthly' | 'yearly';
  status: 'active' | 'paused' | 'cancelled';
  startDate: Timestamp;
  renewalDate: Timestamp;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### invoices
```typescript
{
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  status: 'draft' | 'sent' | 'pending' | 'paid' | 'overdue' | 'cancelled';
  issueDate: Timestamp;
  dueDate: Timestamp;
  paidDate?: Timestamp;
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### accounting_audit_log
```typescript
{
  id: string;
  entityType: 'expense' | 'income' | 'subscription' | 'invoice';
  entityId: string;
  action: 'create' | 'update' | 'delete';
  changes: Record<string, { old: any; new: any }>;
  userId: string;
  timestamp: Timestamp;
  metadata?: Record<string, any>;
}
```

## Firestore Indexes

The following composite indexes are required:

1. **expenses**: (status, date DESC)
2. **expenses**: (category, date DESC)
3. **incomes**: (status, date DESC)
4. **incomes**: (source, date DESC)
5. **incomes**: (relatedSubscriptionId)
6. **subscriptions**: (status, renewalDate ASC)
7. **subscriptions**: (customerId)
8. **invoices**: (status, dueDate ASC)
9. **invoices**: (customerId, issueDate DESC)
10. **invoices**: (invoiceNumber)
11. **accounting_audit_log**: (entityType, timestamp DESC)
12. **accounting_audit_log**: (userId, timestamp DESC)

Deploy indexes using:
```bash
firebase deploy --only firestore:indexes
```

## Security Rules

All accounting collections are admin-only:
- Only users with `role: 'admin'` can read/write
- Audit logs are read-only for admins (writes are server-side only)

Deploy security rules using:
```bash
firebase deploy --only firestore:rules
```

## Automated Tasks

### Invoice Overdue Status Update

A script is provided to automatically update invoice statuses to "overdue" when they pass their due date.

**Script**: `scripts/update-overdue-invoices.ts`

**Usage**:
```bash
npx tsx scripts/update-overdue-invoices.ts
```

**Recommended Schedule**: Run daily at midnight via cron job or scheduled task.

**Windows Task Scheduler**:
```powershell
# Create a scheduled task to run daily at midnight
schtasks /create /tn "Update Overdue Invoices" /tr "npx tsx D:\path\to\project\scripts\update-overdue-invoices.ts" /sc daily /st 00:00
```

**Linux/Mac Cron**:
```bash
# Add to crontab (run daily at midnight)
0 0 * * * cd /path/to/project && npx tsx scripts/update-overdue-invoices.ts
```

## Performance Optimizations

### Caching
- Financial summary: 30-second cache
- Charts data: 5-minute cache
- Expenses/Incomes lists: 60-second client-side cache
- Subscriptions/Invoices: 5-minute client-side cache

### Pagination
- All list endpoints support pagination
- Default page size: 50 items
- Use `limit` and `offset` query parameters

### Debouncing
- Search inputs are debounced by 300ms
- Reduces unnecessary API calls

## Responsive Design

The accounting module is fully responsive:
- **Mobile (< 768px)**: Stacked cards, horizontal scrolling tables
- **Tablet (768px - 1024px)**: 2-column grid layouts
- **Desktop (> 1024px)**: 3-column grid layouts, full tables

## Error Handling

- Form validation using Zod schemas
- Toast notifications for transient errors (using Sonner)
- Inline error messages for form validation
- Retry buttons for failed data fetches
- Loading skeletons for all data tables
- Error boundaries for component-level failures

## Access Control

To access the accounting module:
1. User must be authenticated
2. User must have `role: 'admin'` in their user document
3. Navigate to Admin Dashboard → Billing & Accounting

## Export Functionality

Export data to CSV format:
- **Expenses**: All expense records with filters applied
- **Incomes**: All income records with filters applied
- **Subscriptions**: All subscription records
- **Financial Report**: Summary report with totals and breakdowns

Exports respect the current date range filter.

## Integration

The accounting module is integrated into the admin dashboard:
- Menu item: "Billing & Accounting" in the Operations group
- Icon: DollarSign
- Lazy loaded with React Suspense for optimal performance

## Future Enhancements

Potential improvements for future versions:
- PDF invoice generation
- Email invoice sending
- Payment gateway integration
- Multi-currency support
- Tax calculation
- Recurring expense tracking
- Budget planning and alerts
- Financial forecasting
- Bank account reconciliation
- Advanced reporting with custom date ranges
