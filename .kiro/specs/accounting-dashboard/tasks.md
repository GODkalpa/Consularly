# Implementation Plan

- [x] 1. Set up project foundation and type definitions



  - Create TypeScript interfaces for all accounting entities
  - Create Zod validation schemas for all entities
  - Create constants file with predefined categories and statuses
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 8.2, 8.3_

- [x] 2. Implement Firestore service layer

  - [x] 2.1 Create expense service with CRUD operations


    - Write functions for createExpense, getExpenses, updateExpense, deleteExpense
    - Implement query filters for date range, category, and status
    - Add pagination support with limit and offset parameters
    - _Requirements: 1.1, 1.2, 1.4_
  
  - [x] 2.2 Create income service with CRUD operations


    - Write functions for createIncome, getIncomes, updateIncome, deleteIncome
    - Implement query filters for date range, source, and status
    - Add support for linking to subscriptions
    - _Requirements: 2.1, 2.2, 2.3, 2.5_
  
  - [x] 2.3 Create subscription service with CRUD and payment operations


    - Write functions for createSubscription, getSubscriptions, updateSubscription
    - Implement recordPayment function that creates income transaction
    - Add MRR calculation function
    - Implement renewal date calculation based on billing cycle
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.6_
  
  - [x] 2.4 Create invoice service with CRUD and payment operations


    - Write functions for createInvoice, getInvoices, updateInvoice, deleteInvoice
    - Implement generateInvoiceNumber function
    - Implement markAsPaid function that creates income transaction
    - Add line item total calculation
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [x] 2.5 Create audit logging service


    - Write createAuditLog function for tracking all changes
    - Implement getAuditLogs function with filtering
    - Ensure audit logs are immutable
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_


- [x] 3. Build API routes for accounting data


  - [x] 3.1 Create expenses API routes


    - Implement GET endpoint with date range, pagination, and filtering
    - Implement POST endpoint with validation
    - Implement PATCH endpoint for updates
    - Implement DELETE endpoint
    - Add authentication and admin role verification
    - Add audit logging to all mutation operations
    - _Requirements: 1.1, 1.2, 1.3, 7.1, 7.2, 7.3, 9.2, 9.3_
  
  - [x] 3.2 Create incomes API routes


    - Implement GET endpoint with date range, pagination, and filtering
    - Implement POST endpoint with validation
    - Implement PATCH endpoint for updates
    - Implement DELETE endpoint
    - Add authentication and admin role verification
    - Add audit logging to all mutation operations
    - _Requirements: 2.1, 2.2, 2.4, 2.5, 7.1, 7.2, 7.3, 9.2, 9.3_
  
  - [x] 3.3 Create subscriptions API routes


    - Implement GET endpoint with status filtering
    - Implement POST endpoint with validation
    - Implement PATCH endpoint for updates
    - Implement POST payment recording endpoint
    - Implement DELETE endpoint for cancellation
    - Add authentication and admin role verification
    - Add audit logging to all mutation operations
    - _Requirements: 3.1, 3.2, 3.3, 3.5, 7.1, 7.2, 7.3, 9.2, 9.3_
  
  - [x] 3.4 Create invoices API routes


    - Implement GET endpoint with status filtering
    - Implement POST endpoint with validation and invoice number generation
    - Implement PATCH endpoint for updates
    - Implement POST mark-paid endpoint
    - Implement DELETE endpoint
    - Add authentication and admin role verification
    - Add audit logging to all mutation operations
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.6, 7.1, 7.2, 7.3, 9.2, 9.3_
  
  - [x] 3.5 Create financial summary API route


    - Implement GET endpoint with date range filtering
    - Calculate total income, expenses, net profit
    - Count active subscriptions and calculate MRR
    - Count pending invoices
    - Add caching with 30-second TTL
    - _Requirements: 5.1, 5.3, 3.6_
  
  - [x] 3.6 Create charts data API route


    - Implement GET endpoint with date range filtering
    - Generate monthly income vs expense data
    - Generate cash flow trend data
    - Generate expense and income breakdown data
    - Add caching with 5-minute TTL
    - _Requirements: 5.2, 5.3_
  
  - [x] 3.7 Create export API route


    - Implement GET endpoint with type parameter
    - Generate CSV format for expenses
    - Generate CSV format for incomes
    - Generate CSV format for subscriptions
    - Generate CSV format for financial reports
    - Apply date range filters to exports
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 4. Create custom React hooks for data fetching


  - [x] 4.1 Create useExpenses hook


    - Implement data fetching with date range parameter
    - Add loading and error states
    - Implement client-side caching with 60-second TTL
    - Add refetch function for manual refresh
    - _Requirements: 1.2, 1.4_
  

  - [x] 4.2 Create useIncomes hook

    - Implement data fetching with date range parameter
    - Add loading and error states
    - Implement client-side caching with 60-second TTL
    - Add refetch function for manual refresh
    - _Requirements: 2.2, 2.5_
  


  - [x] 4.3 Create useSubscriptions hook

    - Implement data fetching with status filter parameter
    - Add loading and error states
    - Implement client-side caching with 5-minute TTL
    - Add refetch function for manual refresh
    - _Requirements: 3.2_
  


  - [x] 4.4 Create useInvoices hook

    - Implement data fetching with status filter parameter
    - Add loading and error states
    - Implement client-side caching with 5-minute TTL
    - Add refetch function for manual refresh
    - _Requirements: 4.2, 4.6_
  


  - [x] 4.5 Create useFinancialMetrics hook

    - Implement data fetching for financial summary
    - Add loading and error states
    - Implement client-side caching with 30-second TTL
    - Add refetch function for manual refresh
    - _Requirements: 5.1, 5.3_

- [x] 5. Build core UI components

  - [x] 5.1 Create TransactionForm component


    - Build reusable form for expenses and incomes
    - Implement form fields with React Hook Form
    - Add Zod validation integration
    - Add file upload for receipts (expenses only)
    - Implement submit and cancel handlers
    - Add loading states during submission
    - _Requirements: 1.1, 2.1, 8.1, 8.2, 8.4_
  

  - [x] 5.2 Create CategorySelector component

    - Build dropdown for expense categories
    - Build dropdown for income sources
    - Use constants from lib/constants.ts
    - Add disabled state support
    - _Requirements: 1.1, 2.1, 8.3_

  

  - [x] 5.3 Create FinancialOverview component
    - Build metric cards for total income, expenses, net profit
    - Add cards for active subscriptions, MRR, pending invoices
    - Implement data fetching with useFinancialMetrics hook
    - Add loading skeletons
    - Add error handling with retry button

    - _Requirements: 5.1_

  
  - [x] 5.4 Create DashboardCharts component
    - Implement monthly income vs expense bar chart using Recharts
    - Implement cash flow trend line chart
    - Implement expense breakdown pie chart
    - Implement income sources pie chart
    - Add responsive chart sizing
    - Add loading states

    - _Requirements: 5.2_


- [x] 6. Build data table components

  - [x] 6.1 Create ExpensesTable component


    - Build table with columns for date, description, category, amount, status, actions
    - Implement sorting by date and amount
    - Implement filtering by category and status
    - Add pagination with 50 items per page
    - Add row actions (edit, delete, view receipt)
    - Add bulk actions (approve, export)
    - Add "Add New Expense" button that opens TransactionForm
    - Integrate with useExpenses hook
    - _Requirements: 1.2, 1.3, 1.4, 1.5_

  

  - [x] 6.2 Create IncomesTable component

    - Build table with columns for date, description, source, amount, status, actions
    - Implement sorting by date and amount
    - Implement filtering by source and status
    - Add pagination with 50 items per page
    - Add row actions (edit, delete, view details)
    - Add link to related subscription where applicable
    - Add "Add New Income" button that opens TransactionForm
    - Integrate with useIncomes hook
    - _Requirements: 2.2, 2.3, 2.5_


  

  - [x] 6.3 Create SubscriptionsManager component
    - Build tabs for active, paused, and cancelled subscriptions
    - Create subscription list with customer info, plan, amount, renewal date
    - Add "Record Payment" button for each subscription
    - Implement payment recording that creates income transaction
    - Add payment history modal showing all past payments
    - Add "Add New Subscription" button with form
    - Display MRR calculation at the top
    - Integrate with useSubscriptions hook


    - _Requirements: 3.1, 3.2, 3.3, 3.5, 3.6_

  
  - [x] 6.4 Create InvoiceManager component
    - Build invoice list with status badges
    - Implement filtering by status (draft, sent, pending, paid, overdue, cancelled)
    - Add "Create Invoice" button with form including line items
    - Implement line item addition/removal in form
    - Calculate total amount from line items automatically
    - Add "Mark as Paid" button that creates income transaction
    - Add view/edit invoice details modal

    - Integrate with useInvoices hook
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.6_


  
  - [x] 6.5 Create ExportReports component
    - Build export dropdown with options (expenses, incomes, subscriptions, financial report)
    - Implement CSV generation for each export type
    - Apply current date range filters to exports
    - Add download trigger
    - Show loading state during export generation
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 7. Build main AccountingDashboard component


  - Create main container component
  - Implement tab navigation (Overview, Expenses, Incomes, Subscriptions, Invoices)
  - Add date range filter that applies to all tabs
  - Integrate FinancialOverview component in Overview tab
  - Integrate DashboardCharts component in Overview tab
  - Integrate ExpensesTable in Expenses tab
  - Integrate IncomesTable in Incomes tab
  - Integrate SubscriptionsManager in Subscriptions tab
  - Integrate InvoiceManager in Invoices tab
  - Add ExportReports component in header
  - Implement loading and error states
  - Add authentication check using existing auth context
  - _Requirements: 5.1, 5.2, 5.3, 9.1, 9.4_

- [x] 8. Integrate accounting module into admin dashboard



  - Add "Billing & Accounting" menu item to OptimizedAdminDashboard sidebar
  - Place menu item in "Operations" group
  - Add DollarSign icon for the menu item
  - Implement render logic to show AccountingDashboard when selected
  - Use lazy loading with Suspense for AccountingDashboard
  - Ensure sidebar highlights correctly when accounting section is active
  - Test navigation between accounting and other admin sections
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 9. Implement Firestore security rules
  - Write security rules for expenses collection (admin-only read/write)
  - Write security rules for incomes collection (admin-only read/write)
  - Write security rules for subscriptions collection (admin-only read/write)
  - Write security rules for invoices collection (admin-only read/write)
  - Write security rules for accounting_audit_log collection (admin read-only, server write-only)
  - Create isAdmin helper function in security rules
  - Deploy security rules to Firestore
  - _Requirements: 7.5, 9.1, 9.3_

- [x] 10. Create Firestore indexes
  - Create composite index for expenses (status + date)
  - Create composite index for expenses (category + date)
  - Create composite index for incomes (status + date)
  - Create composite index for incomes (source + date)
  - Create index for incomes (relatedSubscriptionId)
  - Create composite index for subscriptions (status + renewalDate)
  - Create index for subscriptions (customerId)
  - Create composite index for invoices (status + dueDate)
  - Create composite index for invoices (customerId + issueDate)
  - Create index for invoices (invoiceNumber)
  - Create composite index for audit logs (entityType + timestamp)
  - Create composite index for audit logs (userId + timestamp)
  - Deploy indexes to Firestore
  - _Requirements: 1.2, 1.4, 2.2, 2.5, 3.2, 4.2, 4.6, 7.4_

- [x] 11. Add responsive design for mobile and tablet
  - Implement mobile layout for FinancialOverview (stacked cards)
  - Implement mobile layout for DashboardCharts (full-width charts)
  - Add horizontal scrolling for tables on mobile
  - Implement collapsible filters on mobile
  - Adjust form layouts for mobile screens
  - Test on mobile viewport (< 768px)
  - Test on tablet viewport (768px - 1024px)
  - Test on desktop viewport (> 1024px)
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 12. Add error handling and loading states
  - Implement error boundaries for component-level failures
  - Add toast notifications for transient errors using Sonner
  - Add inline error messages for form validation
  - Add retry buttons for failed data fetches
  - Implement loading skeletons for all data tables
  - Add loading spinners for form submissions
  - Add loading states for chart rendering
  - Test error scenarios (network failures, auth failures, validation errors)
  - _Requirements: 8.1, 8.2, 8.4, 9.1, 9.4_

- [x] 13. Implement invoice overdue status automation
  - Create scheduled function or cron job to check invoice due dates
  - Update invoice status to "overdue" when due date passes and status is not "paid"
  - Run check daily at midnight
  - Log status updates in audit log
  - _Requirements: 4.5_

- [x] 14. Add performance optimizations
  - Implement React.memo for expensive components
  - Add debouncing to search inputs (300ms)
  - Implement client-side caching for API responses
  - Add cache headers to API routes (30s for summary, 60s for lists, 5m for charts)
  - Use Firestore aggregation queries for counts
  - Implement pagination for large datasets
  - Test dashboard load time (target < 2 seconds)
  - _Requirements: 5.4_

- [x] 15. Documentation and deployment preparation
  - Document API endpoints in README or API docs
  - Document Firestore schema and required indexes
  - Create deployment checklist
  - Document environment variables (none new required)
  - Create migration guide if replacing existing billing
  - Add inline code comments for complex logic
  - Update admin dashboard documentation
  - _Requirements: All_
