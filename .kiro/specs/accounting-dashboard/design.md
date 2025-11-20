# Design Document: Accounting Dashboard

## Overview

The Accounting Dashboard is a comprehensive financial management module that integrates seamlessly into the existing Next.js admin dashboard. It provides expense tracking, income management, subscription handling, invoice generation, and financial reporting capabilities. The system leverages the existing Firebase infrastructure, shadcn/ui components, and admin authentication patterns to deliver a cohesive user experience.

### Design Goals

1. **Seamless Integration**: Integrate naturally into the existing OptimizedAdminDashboard without disrupting current functionality
2. **Data Integrity**: Ensure accurate financial calculations and maintain audit trails for all transactions
3. **Performance**: Load dashboard data within 2 seconds and handle large datasets efficiently
4. **Consistency**: Match the existing UI/UX patterns and component library
5. **Scalability**: Support growing transaction volumes and future feature additions

### Key Principles

- Reuse existing Firebase Admin SDK patterns for authentication and data access
- Follow the established API route structure with token verification and admin role checks
- Use shadcn/ui components consistently with the rest of the admin dashboard
- Implement client-side caching similar to the existing stats endpoints
- Maintain responsive design across all device sizes

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Admin Dashboard UI                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Overview   │  │     Users    │  │  Accounting  │ ← NEW │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    Next.js API Routes                        │
│  /api/admin/accounting/expenses                              │
│  /api/admin/accounting/incomes                               │
│  /api/admin/accounting/subscriptions                         │
│  /api/admin/accounting/invoices                              │
│  /api/admin/accounting/financial-summary                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  Firebase Admin SDK                          │
│  - Authentication (verifyIdToken)                            │
│  - Firestore Database (collections)                          │
│  - Storage (receipt uploads)                                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    Firestore Collections                     │
│  - expenses                                                  │
│  - incomes                                                   │
│  - subscriptions                                             │
│  - invoices                                                  │
│  - accounting_audit_log                                      │
└─────────────────────────────────────────────────────────────┘
```

### Component Architecture

```
OptimizedAdminDashboard
  └── Sidebar (existing)
       ├── Overview (existing)
       ├── Users (existing)
       ├── Organizations (existing)
       └── Billing & Accounting (NEW)
            └── AccountingDashboard
                 ├── FinancialOverview (metrics cards)
                 ├── DashboardCharts (visualizations)
                 ├── Tabs
                 │    ├── Overview Tab
                 │    ├── Expenses Tab → ExpensesTable
                 │    ├── Incomes Tab → IncomesTable
                 │    ├── Subscriptions Tab → SubscriptionsManager
                 │    └── Invoices Tab → InvoiceManager
                 └── ExportReports
```

### Data Flow

1. **User Action** → Component event handler
2. **Component** → Service layer function
3. **Service** → API route with authentication
4. **API Route** → Firebase Admin SDK
5. **Firestore** → Data persistence
6. **Response** → Cache layer → Component state update
7. **UI Update** → React re-render

## Components and Interfaces

### Core Components

#### 1. AccountingDashboard (Main Container)

**Purpose**: Primary container component that orchestrates the accounting module

**Props**:
```typescript
interface AccountingDashboardProps {
  // No props needed - uses auth context from parent
}
```

**State**:
```typescript
{
  activeTab: 'overview' | 'expenses' | 'incomes' | 'subscriptions' | 'invoices'
  dateRange: { start: Date; end: Date }
  loading: boolean
  error: string | null
}
```

**Key Features**:
- Tab navigation between different accounting sections
- Date range filter that applies to all sub-components
- Loading and error states
- Export functionality trigger



#### 2. FinancialOverview

**Purpose**: Display key financial metrics in card format

**Props**:
```typescript
interface FinancialOverviewProps {
  dateRange: { start: Date; end: Date }
}
```

**Data Fetched**:
- Total income (sum of paid incomes)
- Total expenses (sum of approved/paid expenses)
- Net profit (income - expenses)
- Active subscriptions count
- MRR (Monthly Recurring Revenue)
- Pending invoices count

**API Endpoint**: `GET /api/admin/accounting/financial-summary?start={date}&end={date}`

#### 3. DashboardCharts

**Purpose**: Visualize financial data using Recharts

**Props**:
```typescript
interface DashboardChartsProps {
  dateRange: { start: Date; end: Date }
}
```

**Charts**:
1. **Monthly Income vs Expense Bar Chart**: Side-by-side comparison
2. **Cash Flow Trend Line Chart**: Net profit over time
3. **Expense Breakdown Pie Chart**: By category
4. **Income Sources Pie Chart**: By source type

**API Endpoint**: `GET /api/admin/accounting/charts-data?start={date}&end={date}`

#### 4. ExpensesTable

**Purpose**: Display and manage expense transactions

**Props**:
```typescript
interface ExpensesTableProps {
  dateRange: { start: Date; end: Date }
}
```

**Features**:
- Sortable columns (date, amount, category, status)
- Filterable by category and status
- Pagination (50 items per page)
- Bulk actions (approve, export)
- Row actions (edit, delete, view receipt)
- Add new expense button

**API Endpoints**:
- `GET /api/admin/accounting/expenses?start={date}&end={date}&limit=50&offset=0`
- `POST /api/admin/accounting/expenses` (create)
- `PATCH /api/admin/accounting/expenses/{id}` (update)
- `DELETE /api/admin/accounting/expenses/{id}` (delete)

#### 5. IncomesTable

**Purpose**: Display and manage income transactions

**Props**:
```typescript
interface IncomesTableProps {
  dateRange: { start: Date; end: Date }
}
```

**Features**:
- Sortable columns (date, amount, source, status)
- Filterable by source and status
- Pagination (50 items per page)
- Link to related subscription
- Row actions (edit, delete, view details)
- Add new income button

**API Endpoints**:
- `GET /api/admin/accounting/incomes?start={date}&end={date}&limit=50&offset=0`
- `POST /api/admin/accounting/incomes` (create)
- `PATCH /api/admin/accounting/incomes/{id}` (update)
- `DELETE /api/admin/accounting/incomes/{id}` (delete)

#### 6. SubscriptionsManager

**Purpose**: Manage customer subscriptions and recurring payments

**Props**:
```typescript
interface SubscriptionsManagerProps {
  // No props - manages its own state
}
```

**Features**:
- Tabs for active/paused/cancelled subscriptions
- Subscription list with customer info, plan, amount, renewal date
- Record payment button (creates income transaction)
- Payment history modal
- Add/edit subscription form
- MRR calculation display

**API Endpoints**:
- `GET /api/admin/accounting/subscriptions?status={status}`
- `POST /api/admin/accounting/subscriptions` (create)
- `PATCH /api/admin/accounting/subscriptions/{id}` (update)
- `POST /api/admin/accounting/subscriptions/{id}/payment` (record payment)
- `DELETE /api/admin/accounting/subscriptions/{id}` (cancel)



#### 7. InvoiceManager

**Purpose**: Generate and manage customer invoices

**Props**:
```typescript
interface InvoiceManagerProps {
  // No props - manages its own state
}
```

**Features**:
- Invoice list with status badges
- Filter by status (draft, sent, pending, paid, overdue, cancelled)
- Create invoice form with line items
- Mark as paid button (creates income transaction)
- View/edit invoice details
- Invoice number auto-generation (INV-YYYY-###)

**API Endpoints**:
- `GET /api/admin/accounting/invoices?status={status}`
- `POST /api/admin/accounting/invoices` (create)
- `PATCH /api/admin/accounting/invoices/{id}` (update)
- `POST /api/admin/accounting/invoices/{id}/mark-paid` (mark as paid)
- `DELETE /api/admin/accounting/invoices/{id}` (delete)

#### 8. TransactionForm

**Purpose**: Reusable form component for expenses and incomes

**Props**:
```typescript
interface TransactionFormProps {
  type: 'expense' | 'income'
  initialData?: Expense | Income
  onSubmit: (data: Expense | Income) => Promise<void>
  onCancel: () => void
}
```

**Fields**:
- Description (text input, required)
- Amount (number input, required, positive only)
- Date (date picker, required)
- Category/Source (select dropdown, required)
- Payment method (select dropdown, required)
- Status (select dropdown, required)
- Notes (textarea, optional)
- Receipt upload (file input, optional, expenses only)

**Validation**: Uses React Hook Form + Zod schema

### Shared Components

#### CategorySelector

**Purpose**: Dropdown for selecting expense categories or income sources

**Props**:
```typescript
interface CategorySelectorProps {
  type: 'expense' | 'income'
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}
```

**Data Source**: Constants from `lib/constants.ts`

#### ExportReports

**Purpose**: Export financial data to CSV

**Props**:
```typescript
interface ExportReportsProps {
  dateRange: { start: Date; end: Date }
}
```

**Export Options**:
- All expenses
- All incomes
- All subscriptions
- Financial summary report

**API Endpoint**: `GET /api/admin/accounting/export?type={type}&start={date}&end={date}`

## Data Models

### TypeScript Interfaces

```typescript
// types/accounting.ts

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
```



### Firestore Schema

#### Collection: `expenses`

```typescript
{
  expenseId: string (document ID)
  description: string
  amount: number
  category: string
  paymentMethod: string
  date: Timestamp
  receipt_url?: string
  status: "pending" | "approved" | "paid" | "rejected"
  createdAt: Timestamp
  updatedAt: Timestamp
  notes?: string
}
```

**Indexes Required**:
- `date` (descending)
- `status` + `date` (composite)
- `category` + `date` (composite)

#### Collection: `incomes`

```typescript
{
  incomeId: string (document ID)
  description: string
  amount: number
  source: string
  relatedCustomerId?: string
  relatedSubscriptionId?: string
  date: Timestamp
  status: "pending" | "paid" | "cancelled"
  paymentMethod: string
  createdAt: Timestamp
  updatedAt: Timestamp
  notes?: string
}
```

**Indexes Required**:
- `date` (descending)
- `status` + `date` (composite)
- `source` + `date` (composite)
- `relatedSubscriptionId` (for lookups)

#### Collection: `subscriptions`

```typescript
{
  subscriptionId: string (document ID)
  customerId: string
  customerName: string
  planName: string
  amount: number
  billingCycle: "monthly" | "yearly" | "custom"
  billingDay: number
  startDate: Timestamp
  renewalDate: Timestamp
  cancelledDate?: Timestamp
  status: "active" | "paused" | "cancelled" | "pending"
  paymentHistory: Array<{
    paymentId: string
    amount: number
    date: Timestamp
    status: "pending" | "paid" | "failed"
    incomeTransactionId: string
  }>
  notes?: string
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

**Indexes Required**:
- `status` + `renewalDate` (composite)
- `customerId`

#### Collection: `invoices`

```typescript
{
  invoiceId: string (document ID)
  invoiceNumber: string
  customerId: string
  customerName: string
  customerEmail: string
  issueDate: Timestamp
  dueDate: Timestamp
  amount: number
  lineItems: Array<{
    description: string
    quantity: number
    unitPrice: number
    amount: number
  }>
  status: "draft" | "sent" | "pending" | "paid" | "overdue" | "cancelled"
  paymentReceivedDate?: Timestamp
  incomeTransactionId?: string
  notes?: string
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

**Indexes Required**:
- `status` + `dueDate` (composite)
- `customerId` + `issueDate` (composite)
- `invoiceNumber` (unique)

#### Collection: `accounting_audit_log`

```typescript
{
  auditId: string (document ID)
  action: "create" | "update" | "delete"
  entityType: "expense" | "income" | "subscription" | "invoice"
  entityId: string
  userId: string
  changes?: object
  timestamp: Timestamp
}
```

**Indexes Required**:
- `timestamp` (descending)
- `entityType` + `timestamp` (composite)
- `userId` + `timestamp` (composite)

### Validation Schemas (Zod)

```typescript
// lib/validation/accounting.ts

import { z } from 'zod'

export const expenseSchema = z.object({
  description: z.string().min(1, 'Description is required').max(500),
  amount: z.number().positive('Amount must be positive'),
  category: z.enum([
    'Office Rent', 'Utilities', 'Employee Salaries', 
    'Marketing & Advertising', 'Professional Services',
    'Business Insurance', 'Office Supplies', 'Travel Expenses',
    'Internet & Communication', 'Software & Cloud Services',
    'Meals & Entertainment', 'Vehicle Expenses', 'Equipment', 'Other'
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
```



## Error Handling

### Client-Side Error Handling

**Strategy**: Graceful degradation with user-friendly error messages

```typescript
// hooks/useAccounting.ts

export function useExpenses(dateRange: DateRange) {
  const [data, setData] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const token = await auth.currentUser?.getIdToken()
        if (!token) throw new Error('Not authenticated')

        const response = await fetch(
          `/api/admin/accounting/expenses?start=${dateRange.start}&end=${dateRange.end}`,
          { headers: { Authorization: `Bearer ${token}` } }
        )

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to fetch expenses')
        }

        const expenses = await response.json()
        setData(expenses)
      } catch (e: any) {
        console.error('[useExpenses] Error:', e)
        setError(e.message || 'An unexpected error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchExpenses()
  }, [dateRange])

  return { data, loading, error }
}
```

**Error Display**:
- Toast notifications for transient errors (using Sonner)
- Inline error messages for form validation
- Error boundary for component-level failures
- Retry buttons for failed data fetches

### Server-Side Error Handling

**Pattern**: Consistent error responses across all API routes

```typescript
// app/api/admin/accounting/expenses/route.ts

export async function GET(request: NextRequest) {
  try {
    await ensureFirebaseAdmin()

    // Authentication
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized: missing token' }, 
        { status: 401 }
      )
    }

    // Authorization
    const decoded = await adminAuth().verifyIdToken(token)
    const callerSnap = await adminDb().collection('users').doc(decoded.uid).get()
    
    if (!callerSnap.exists) {
      return NextResponse.json(
        { error: 'User profile not found' }, 
        { status: 403 }
      )
    }

    const caller = callerSnap.data() as { role?: string }
    if (caller?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: admin access required' }, 
        { status: 403 }
      )
    }

    // Business logic
    // ... fetch expenses ...

    return NextResponse.json(expenses)
  } catch (e: any) {
    console.error('[api/admin/accounting/expenses] Error', e)
    
    // Specific error handling
    if (e.code === 'permission-denied') {
      return NextResponse.json(
        { error: 'Permission denied' }, 
        { status: 403 }
      )
    }
    
    return NextResponse.json(
      { error: e?.message || 'Internal server error' }, 
      { status: 500 }
    )
  }
}
```

**Error Categories**:
- **401 Unauthorized**: Missing or invalid authentication token
- **403 Forbidden**: User lacks admin role
- **400 Bad Request**: Invalid input data (validation errors)
- **404 Not Found**: Resource doesn't exist
- **409 Conflict**: Business logic constraint violation
- **500 Internal Server Error**: Unexpected server errors

## Testing Strategy

### Unit Tests

**Tools**: Jest + React Testing Library

**Coverage Areas**:
1. **Validation Schemas**: Test all Zod schemas with valid and invalid inputs
2. **Utility Functions**: Test calculation functions (MRR, net profit, etc.)
3. **Service Functions**: Test data transformation and business logic
4. **Component Logic**: Test state management and event handlers

**Example**:
```typescript
// __tests__/lib/validation/accounting.test.ts

describe('expenseSchema', () => {
  it('should validate a valid expense', () => {
    const validExpense = {
      description: 'Office supplies',
      amount: 150.50,
      category: 'Office Supplies',
      paymentMethod: 'Credit Card',
      date: new Date(),
      status: 'pending',
    }
    
    expect(() => expenseSchema.parse(validExpense)).not.toThrow()
  })

  it('should reject negative amounts', () => {
    const invalidExpense = {
      description: 'Office supplies',
      amount: -150.50,
      category: 'Office Supplies',
      paymentMethod: 'Credit Card',
      date: new Date(),
      status: 'pending',
    }
    
    expect(() => expenseSchema.parse(invalidExpense)).toThrow()
  })
})
```

### Integration Tests

**Tools**: Playwright or Cypress

**Test Scenarios**:
1. **Create Expense Flow**: Navigate to expenses, fill form, submit, verify in table
2. **Record Subscription Payment**: Select subscription, record payment, verify income created
3. **Generate Invoice**: Create invoice with line items, verify total calculation
4. **Export Data**: Trigger export, verify CSV download
5. **Filter and Sort**: Apply filters, verify results update correctly

### API Tests

**Tools**: Jest + Supertest

**Test Scenarios**:
1. **Authentication**: Verify token validation and admin role checks
2. **CRUD Operations**: Test create, read, update, delete for all entities
3. **Data Validation**: Test server-side validation rejects invalid data
4. **Audit Logging**: Verify audit logs are created for all changes
5. **Error Handling**: Test error responses for various failure scenarios



## Performance Considerations

### Database Optimization

**Firestore Query Optimization**:
1. **Use Composite Indexes**: Create indexes for common filter combinations
2. **Limit Query Results**: Default to 50 items per page with pagination
3. **Use Aggregation Queries**: Use `.count()` for counting instead of fetching all documents
4. **Cache Frequently Accessed Data**: Cache financial summaries with appropriate TTL

**Example Optimized Query**:
```typescript
// Efficient expense query with pagination
const expensesQuery = adminDb()
  .collection('expenses')
  .where('date', '>=', startDate)
  .where('date', '<=', endDate)
  .orderBy('date', 'desc')
  .limit(50)
  .offset(page * 50)

const expenses = await expensesQuery.get()
```

### Client-Side Caching

**Strategy**: Cache API responses with appropriate TTL

```typescript
// lib/cache.ts (extend existing cache utility)

export async function fetchAccountingData<T>(
  endpoint: string,
  ttl: number = 60000 // 1 minute default
): Promise<T> {
  const cacheKey = `accounting:${endpoint}`
  const cached = cache.get(cacheKey)
  
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data
  }
  
  const token = await auth.currentUser?.getIdToken()
  const response = await fetch(endpoint, {
    headers: { Authorization: `Bearer ${token}` }
  })
  
  if (!response.ok) throw new Error('Fetch failed')
  
  const data = await response.json()
  cache.set(cacheKey, { data, timestamp: Date.now() })
  
  return data
}
```

**Cache TTL Guidelines**:
- Financial summary: 30 seconds
- Transaction lists: 60 seconds
- Subscriptions: 5 minutes
- Charts data: 5 minutes
- Audit logs: No cache (always fresh)

### Component Optimization

**React Performance**:
1. **Memoization**: Use `React.memo` for expensive components
2. **Lazy Loading**: Code-split large components
3. **Virtual Scrolling**: Use for large tables (react-window)
4. **Debounced Search**: Debounce search inputs (300ms)

**Example**:
```typescript
// components/accounting/ExpensesTable.tsx

export const ExpensesTable = React.memo(({ dateRange }: ExpensesTableProps) => {
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useDebounce(searchTerm, 300)
  
  const { data, loading } = useExpenses(dateRange, debouncedSearch)
  
  // ... render table
})
```

### Bundle Size Optimization

**Strategies**:
1. **Tree Shaking**: Import only needed components from libraries
2. **Dynamic Imports**: Lazy load accounting module
3. **Chart Library**: Use lightweight Recharts with selective imports

**Example**:
```typescript
// app/admin/page.tsx

const AccountingDashboard = dynamic(
  () => import('@/components/accounting/AccountingDashboard'),
  { loading: () => <LoadingSpinner /> }
)
```

## Security Considerations

### Authentication & Authorization

**Multi-Layer Security**:
1. **Client-Side**: Check auth state before rendering accounting UI
2. **API Routes**: Verify Firebase token and admin role on every request
3. **Firestore Rules**: Enforce admin-only access at database level

**Firestore Security Rules**:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check if user is admin
    function isAdmin() {
      return request.auth != null && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Accounting collections - admin only
    match /expenses/{expenseId} {
      allow read, write: if isAdmin();
    }
    
    match /incomes/{incomeId} {
      allow read, write: if isAdmin();
    }
    
    match /subscriptions/{subscriptionId} {
      allow read, write: if isAdmin();
    }
    
    match /invoices/{invoiceId} {
      allow read, write: if isAdmin();
    }
    
    match /accounting_audit_log/{auditId} {
      allow read: if isAdmin();
      allow write: if false; // Only server can write audit logs
    }
  }
}
```

### Input Validation

**Defense in Depth**:
1. **Client-Side**: React Hook Form + Zod for immediate feedback
2. **Server-Side**: Validate all inputs again in API routes
3. **Database**: Firestore rules as final safeguard

**Example Server-Side Validation**:
```typescript
export async function POST(request: NextRequest) {
  try {
    // ... authentication ...
    
    const body = await request.json()
    
    // Validate with Zod schema
    const validatedData = expenseSchema.parse(body)
    
    // Additional business logic validation
    if (validatedData.amount > 1000000) {
      return NextResponse.json(
        { error: 'Amount exceeds maximum allowed value' },
        { status: 400 }
      )
    }
    
    // ... create expense ...
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: e.errors },
        { status: 400 }
      )
    }
    // ... other error handling ...
  }
}
```

### Data Protection

**Sensitive Data Handling**:
1. **No PII in Logs**: Sanitize logs to remove sensitive information
2. **Secure File Uploads**: Validate file types and sizes for receipts
3. **HTTPS Only**: Enforce HTTPS for all API requests
4. **Rate Limiting**: Implement rate limiting on API routes (future enhancement)

### Audit Trail

**Complete Audit Logging**:
```typescript
// services/audit.service.ts

export async function createAuditLog(
  action: 'create' | 'update' | 'delete',
  entityType: 'expense' | 'income' | 'subscription' | 'invoice',
  entityId: string,
  userId: string,
  changes?: Record<string, any>
): Promise<void> {
  await adminDb().collection('accounting_audit_log').add({
    action,
    entityType,
    entityId,
    userId,
    changes: changes || null,
    timestamp: FieldValue.serverTimestamp(),
  })
}
```

**Audit Log Usage**:
- Track all create, update, delete operations
- Record user ID for accountability
- Store before/after values for updates
- Immutable logs (no updates or deletes allowed)



## Integration with Existing Admin Dashboard

### Sidebar Navigation Integration

**Modification to OptimizedAdminDashboard**:

```typescript
// components/admin/OptimizedAdminDashboard.tsx

const menuItems = [
  // ... existing items ...
  {
    id: "billing",
    title: "Billing & Accounting",
    icon: DollarSign,
    group: "operations"
  },
  // ... rest of items ...
]

const groupedMenu = [
  { label: "Platform", ids: ["overview", "users", "organizations"] },
  { label: "Insights", ids: ["quota", "analytics"] },
  { label: "Operations", ids: ["billing", "settings", "support"] }, // Added billing
]
```

**Render Logic**:
```typescript
const renderContent = () => {
  switch (activeSection) {
    case "overview":
      return <Suspense fallback={<LoadingSpinner />}><DashboardOverview /></Suspense>
    case "users":
      return <Suspense fallback={<LoadingSpinner />}><UserManagement /></Suspense>
    // ... other cases ...
    case "billing":
      return <Suspense fallback={<LoadingSpinner />}><AccountingDashboard /></Suspense>
    default:
      return <DashboardOverview />
  }
}
```

### Styling Consistency

**Use Existing Design Tokens**:
- Colors: Use existing CSS variables (--primary, --secondary, etc.)
- Typography: Match existing font sizes and weights
- Spacing: Use consistent padding and margins
- Shadows: Use existing shadow utilities
- Borders: Match existing border radius and colors

**Component Library**:
- All components use shadcn/ui from existing `components/ui/`
- No new UI libraries introduced
- Maintain existing component patterns

### Authentication Context

**Reuse Existing Auth**:
```typescript
// components/accounting/AccountingDashboard.tsx

import { auth } from '@/lib/firebase'

export function AccountingDashboard() {
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    // Use existing auth instance
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        // Redirect to login
        window.location.href = '/login'
      } else {
        setLoading(false)
      }
    })
    
    return () => unsubscribe()
  }, [])
  
  if (loading) return <LoadingSpinner />
  
  return (
    // ... accounting dashboard content ...
  )
}
```

### API Route Patterns

**Follow Existing Conventions**:
1. Use `ensureFirebaseAdmin()` at the start of every route
2. Extract and verify Bearer token from Authorization header
3. Check admin role from user document
4. Return consistent error responses
5. Add appropriate cache headers
6. Log errors with descriptive prefixes

**Example Following Pattern**:
```typescript
// app/api/admin/accounting/expenses/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { ensureFirebaseAdmin, adminAuth, adminDb } from '@/lib/firebase-admin'

export async function GET(request: NextRequest) {
  try {
    await ensureFirebaseAdmin()

    // Authentication (matches existing pattern)
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: missing token' }, { status: 401 })
    }

    // Authorization (matches existing pattern)
    const decoded = await adminAuth().verifyIdToken(token)
    const callerSnap = await adminDb().collection('users').doc(decoded.uid).get()
    
    if (!callerSnap.exists) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 403 })
    }

    const caller = callerSnap.data() as { role?: string }
    if (caller?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: admin access required' }, { status: 403 })
    }

    // Business logic
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start')
    const endDate = searchParams.get('end')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = adminDb().collection('expenses')
    
    if (startDate) {
      query = query.where('date', '>=', new Date(startDate))
    }
    if (endDate) {
      query = query.where('date', '<=', new Date(endDate))
    }
    
    const expenses = await query
      .orderBy('date', 'desc')
      .limit(limit)
      .offset(offset)
      .get()

    const expensesList = expenses.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    const response = NextResponse.json(expensesList)
    
    // Cache for 1 minute (matches existing pattern)
    response.headers.set('Cache-Control', 'private, max-age=60, stale-while-revalidate=120')
    
    return response
  } catch (e: any) {
    console.error('[api/admin/accounting/expenses] Error', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}
```

## Deployment Considerations

### Environment Variables

**Required Variables** (already exist):
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `FIREBASE_ADMIN_PROJECT_ID`
- `FIREBASE_ADMIN_CLIENT_EMAIL`
- `FIREBASE_ADMIN_PRIVATE_KEY`

**No New Variables Needed**: Accounting module uses existing Firebase configuration

### Firestore Indexes

**Required Composite Indexes**:

```javascript
// firestore.indexes.json

{
  "indexes": [
    // Expenses
    {
      "collectionGroup": "expenses",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "expenses",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "category", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "DESCENDING" }
      ]
    },
    // Incomes
    {
      "collectionGroup": "incomes",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "incomes",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "source", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "DESCENDING" }
      ]
    },
    // Subscriptions
    {
      "collectionGroup": "subscriptions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "renewalDate", "order": "ASCENDING" }
      ]
    },
    // Invoices
    {
      "collectionGroup": "invoices",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "dueDate", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "invoices",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "customerId", "order": "ASCENDING" },
        { "fieldPath": "issueDate", "order": "DESCENDING" }
      ]
    },
    // Audit Logs
    {
      "collectionGroup": "accounting_audit_log",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "entityType", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "accounting_audit_log",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    }
  ]
}
```

**Index Creation**:
- Indexes will be auto-created on first query (with warning in console)
- Or deploy manually: `firebase deploy --only firestore:indexes`

### Build Configuration

**No Changes Required**:
- Uses existing Next.js build process
- No additional build steps needed
- Accounting module is part of main bundle

### Migration Strategy

**Phased Rollout**:
1. **Phase 1**: Deploy code with accounting module (hidden from UI)
2. **Phase 2**: Create Firestore collections and indexes
3. **Phase 3**: Enable "Billing & Accounting" menu item for testing
4. **Phase 4**: Full rollout to all admin users

**Data Migration** (if replacing existing billing):
- Export existing billing data
- Transform to new schema
- Import into new collections
- Verify data integrity
- Switch over

## Future Enhancements

### Potential Features (Out of Scope for MVP)

1. **Tax Compliance**
   - Tax rate configuration
   - Automatic tax calculations
   - Tax reports (1099, etc.)

2. **Payment Gateway Integration**
   - Stripe/PayPal integration
   - Automatic payment recording
   - Webhook handlers

3. **Advanced Reporting**
   - Custom report builder
   - Scheduled email reports
   - PDF generation for invoices

4. **Multi-Currency Support**
   - Currency conversion
   - Exchange rate tracking
   - Multi-currency reports

5. **Budget Management**
   - Budget creation and tracking
   - Budget vs actual comparisons
   - Alerts for budget overruns

6. **Approval Workflows**
   - Multi-level approval chains
   - Approval notifications
   - Approval history

7. **Bank Reconciliation**
   - Bank statement import
   - Transaction matching
   - Reconciliation reports

8. **Mobile App**
   - React Native mobile app
   - Receipt capture via camera
   - Push notifications

## Conclusion

This design document provides a comprehensive blueprint for implementing the Accounting Dashboard module. The design prioritizes seamless integration with the existing admin dashboard, maintains consistency with established patterns, and ensures security, performance, and scalability. The modular architecture allows for future enhancements while delivering core accounting functionality in the MVP.

