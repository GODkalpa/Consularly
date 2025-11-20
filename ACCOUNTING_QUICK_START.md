# Accounting Module Quick Start Guide

## Getting Started

### Prerequisites
- Admin user account with `role: 'admin'` in Firestore
- Firebase project configured
- Application deployed

### Accessing the Module

1. Log in to the application
2. Navigate to the Admin Dashboard
3. Click on "Billing & Accounting" in the sidebar (under Operations)

## Basic Usage

### 1. Recording an Expense

1. Go to the **Expenses** tab
2. Click **Add Expense**
3. Fill in the form:
   - Date: When the expense occurred
   - Description: What the expense was for
   - Amount: Cost in USD
   - Category: Select from predefined categories
   - Status: pending/approved/rejected
   - Receipt: (Optional) Upload receipt image/PDF
   - Notes: (Optional) Additional details
4. Click **Submit**

**Categories**: Salaries, Marketing, Infrastructure, Software, Office Supplies, Travel, Legal, Other

### 2. Recording Income

1. Go to the **Incomes** tab
2. Click **Add Income**
3. Fill in the form:
   - Date: When income was received
   - Description: Source of income
   - Amount: Amount in USD
   - Source: Type of income
   - Status: pending/received/cancelled
   - Notes: (Optional) Additional details
4. Click **Submit**

**Sources**: Subscription, One-time Payment, Consulting, Grant, Investment, Other

### 3. Managing Subscriptions

1. Go to the **Subscriptions** tab
2. Click **Add Subscription**
3. Fill in the form:
   - Customer ID: Unique identifier
   - Customer Name: Full name
   - Customer Email: Contact email
   - Plan Name: Subscription plan
   - Amount: Monthly/yearly cost
   - Billing Cycle: monthly or yearly
   - Start Date: When subscription began
   - Renewal Date: Next payment date
4. Click **Submit**

**Recording Payments**:
- Click **Record Payment** next to any active subscription
- This automatically creates an income record
- Updates the renewal date based on billing cycle

**MRR Calculation**: Displayed at the top, automatically calculated from active subscriptions

### 4. Creating Invoices

1. Go to the **Invoices** tab
2. Click **Create Invoice**
3. Fill in the form:
   - Customer ID: Unique identifier
   - Customer Name: Full name
   - Customer Email: Contact email
   - Issue Date: When invoice was created
   - Due Date: Payment deadline
   - Line Items: Add products/services
     - Description
     - Quantity
     - Unit Price
     - Total (auto-calculated)
   - Status: draft/sent/pending
   - Notes: (Optional) Additional terms
4. Click **Submit**

**Invoice Number**: Automatically generated (format: INV-YYYYMMDD-XXXX)

**Marking as Paid**:
- Click **Mark Paid** next to any unpaid invoice
- This automatically creates an income record
- Updates invoice status to "paid"

### 5. Viewing Financial Overview

1. Go to the **Overview** tab
2. View key metrics:
   - Total Income
   - Total Expenses
   - Net Profit
   - Active Subscriptions
   - MRR (Monthly Recurring Revenue)
   - Pending Invoices

3. View charts:
   - Income vs Expense (monthly comparison)
   - Cash Flow Trend (net profit over time)
   - Expense Breakdown (by category)
   - Income Sources (by type)

### 6. Filtering by Date Range

1. Use the date range filter at the top
2. Select **Start Date** and **End Date**
3. All data updates automatically:
   - Financial metrics
   - Charts
   - Expense/Income lists

**Default Range**: January 1st of current year to today

### 7. Exporting Data

1. Click the **Export** dropdown in the header
2. Select export type:
   - Expenses
   - Incomes
   - Subscriptions
   - Financial Report
3. Click **Export**
4. CSV file downloads automatically

**Note**: Exports respect the current date range filter

## Tips & Best Practices

### Expense Management
- Upload receipts for all expenses over $100
- Approve expenses promptly to maintain accurate financials
- Use consistent categories for better reporting

### Income Tracking
- Link income to subscriptions when applicable
- Mark income as "received" only when payment clears
- Keep notes for unusual income sources

### Subscription Management
- Set renewal dates accurately for correct MRR
- Record payments on time to maintain payment history
- Update status to "paused" instead of cancelling for temporary holds

### Invoice Management
- Send invoices promptly after work completion
- Set realistic due dates (typically 30 days)
- Follow up on overdue invoices
- Use line items for detailed billing

### Financial Reporting
- Review financial overview weekly
- Export monthly reports for accounting
- Monitor cash flow trends
- Track expense categories for budgeting

## Common Tasks

### Monthly Financial Review
1. Set date range to current month
2. Review financial overview
3. Check expense breakdown
4. Verify all income recorded
5. Export financial report
6. Review pending invoices

### Quarterly Reporting
1. Set date range to quarter (e.g., Jan 1 - Mar 31)
2. Export all data types
3. Review MRR trends
4. Analyze expense categories
5. Calculate profit margins

### Year-End Closing
1. Set date range to full year
2. Export all data for tax purposes
3. Verify all invoices marked paid/cancelled
4. Review subscription renewals
5. Archive reports

## Troubleshooting

### Data Not Loading
- Check internet connection
- Verify admin permissions
- Refresh the page
- Check browser console for errors

### Export Not Working
- Ensure date range is valid
- Check browser popup blocker
- Try different export type
- Clear browser cache

### Charts Not Displaying
- Verify data exists for date range
- Check browser compatibility (use Chrome/Firefox)
- Refresh the page
- Try different date range

### Invoice Not Updating to Overdue
- Ensure automated script is running
- Check due date is in the past
- Verify invoice status is not "paid"
- Check audit logs for updates

## Support

For technical issues:
1. Check browser console for errors
2. Verify Firestore indexes are built
3. Check Firebase Console for quota limits
4. Review audit logs for failed operations

For questions or feature requests:
- Contact your system administrator
- Refer to full documentation: `ACCOUNTING_MODULE_DOCUMENTATION.md`

## Next Steps

- Set up automated invoice overdue checks
- Configure regular data exports
- Train team members on the system
- Establish financial review schedule
- Integrate with accounting software (if needed)
