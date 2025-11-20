# Requirements Document

## Introduction

This document defines the requirements for a simplified accounting and subscription management system integrated into an existing Next.js SaaS admin dashboard. The system will enable administrators to track expenses, manage income, handle subscriptions, generate invoices, and view financial reports without tax compliance features. The solution leverages the existing Firebase infrastructure and integrates seamlessly with the current admin interface.

## Glossary

- **Accounting System**: The complete financial management module including expenses, incomes, subscriptions, and invoices
- **Admin User**: An authenticated user with administrative privileges who can access the accounting module
- **Admin Dashboard**: The existing OptimizedAdminDashboard component with sidebar navigation at /admin
- **Expense**: A financial outflow transaction with categorization, payment method, and approval workflow
- **Income**: A financial inflow transaction linked to subscriptions, one-time payments, or other sources
- **Subscription**: A recurring payment arrangement with a customer including billing cycle and renewal tracking
- **Invoice**: A formal billing document with line items, due dates, and payment status
- **MRR**: Monthly Recurring Revenue calculated from active subscriptions
- **Transaction**: A generic term for either an expense or income entry
- **Audit Log**: A record of all changes made to accounting entities for compliance and tracking
- **Financial Summary**: Aggregated metrics including total income, expenses, net profit, and active subscriptions
- **Firestore**: The Firebase NoSQL database used for data persistence
- **Accounting Dashboard**: The main accounting overview page displaying key metrics and visualizations, integrated as a section within the Admin Dashboard

## Requirements

### Requirement 1

**User Story:** As an admin user, I want to manage expense transactions, so that I can track all business expenditures with proper categorization and approval workflows

#### Acceptance Criteria

1. WHEN an admin user creates a new expense, THE Accounting System SHALL store the expense with description, amount, category, payment method, date, status, and optional receipt URL in Firestore
2. WHEN an admin user views the expenses list, THE Accounting System SHALL display all expenses in a sortable and filterable table with columns for date, description, category, amount, status, and actions
3. WHEN an admin user updates an expense status, THE Accounting System SHALL validate the status transition and record the change in the audit log
4. WHEN an admin user filters expenses by category or date range, THE Accounting System SHALL return only expenses matching the specified criteria
5. WHERE an admin user uploads a receipt, THE Accounting System SHALL store the receipt URL and associate it with the expense record

### Requirement 2

**User Story:** As an admin user, I want to manage income transactions, so that I can track all revenue sources and link them to subscriptions or customers

#### Acceptance Criteria

1. WHEN an admin user creates a new income entry, THE Accounting System SHALL store the income with description, amount, source, date, status, payment method, and optional customer/subscription references in Firestore
2. WHEN an admin user views the incomes list, THE Accounting System SHALL display all income entries in a sortable and filterable table with columns for date, description, source, amount, status, and actions
3. WHERE an income is linked to a subscription, THE Accounting System SHALL display the related subscription information and allow navigation to the subscription details
4. WHEN an admin user marks an income as paid, THE Accounting System SHALL update the status and record the payment date
5. WHEN an admin user filters incomes by source or date range, THE Accounting System SHALL return only income entries matching the specified criteria

### Requirement 3

**User Story:** As an admin user, I want to manage customer subscriptions, so that I can track recurring revenue, billing cycles, and payment history

#### Acceptance Criteria

1. WHEN an admin user creates a new subscription, THE Accounting System SHALL store the subscription with customer details, plan name, amount, billing cycle, billing day, start date, renewal date, and status in Firestore
2. WHEN an admin user views the subscriptions list, THE Accounting System SHALL display subscriptions grouped by status (active, paused, cancelled) with filtering and sorting capabilities
3. WHEN an admin user records a subscription payment, THE Accounting System SHALL add the payment to the subscription's payment history and create a corresponding income transaction
4. WHEN the renewal date of an active subscription is reached, THE Accounting System SHALL calculate the next renewal date based on the billing cycle
5. WHEN an admin user views subscription details, THE Accounting System SHALL display the complete payment history with dates, amounts, and statuses
6. WHEN the dashboard loads, THE Accounting System SHALL calculate the total MRR from all active subscriptions

### Requirement 4

**User Story:** As an admin user, I want to generate and manage invoices, so that I can formally bill customers and track payment status

#### Acceptance Criteria

1. WHEN an admin user creates a new invoice, THE Accounting System SHALL generate a unique invoice number in the format INV-YYYY-### and store the invoice with customer details, line items, issue date, due date, and status in Firestore
2. WHEN an admin user views the invoices list, THE Accounting System SHALL display all invoices with columns for invoice number, customer name, amount, due date, status, and actions
3. WHEN an admin user adds line items to an invoice, THE Accounting System SHALL calculate the total amount by summing quantity multiplied by unit price for each line item
4. WHEN an admin user marks an invoice as paid, THE Accounting System SHALL update the status, record the payment received date, and create a corresponding income transaction
5. WHEN an invoice due date passes and the status is not paid, THE Accounting System SHALL automatically update the status to overdue
6. WHEN an admin user filters invoices by status or date range, THE Accounting System SHALL return only invoices matching the specified criteria

### Requirement 5

**User Story:** As an admin user, I want to view financial summaries and reports, so that I can understand the business financial health at a glance

#### Acceptance Criteria

1. WHEN an admin user accesses the accounting dashboard, THE Accounting System SHALL display key metrics including total income, total expenses, net profit, active subscriptions count, MRR value, and pending invoices count
2. WHEN an admin user views the dashboard charts, THE Accounting System SHALL display a monthly income vs expense bar chart, cash flow trend line chart, expense breakdown pie chart, and income sources pie chart
3. WHEN an admin user selects a date range filter, THE Accounting System SHALL recalculate all metrics and charts based on transactions within the specified date range
4. WHEN the dashboard loads, THE Accounting System SHALL complete the initial data load and render within 2 seconds
5. WHEN an admin user views recent transactions, THE Accounting System SHALL display the most recent 10 expenses and incomes with dates, descriptions, and amounts

### Requirement 6

**User Story:** As an admin user, I want to export financial data, so that I can analyze data externally or share reports with stakeholders

#### Acceptance Criteria

1. WHEN an admin user requests an expense export, THE Accounting System SHALL generate a CSV file containing all expense records with columns for date, description, category, amount, payment method, status, and notes
2. WHEN an admin user requests an income export, THE Accounting System SHALL generate a CSV file containing all income records with columns for date, description, source, amount, payment method, status, and notes
3. WHEN an admin user requests a subscription export, THE Accounting System SHALL generate a CSV file containing all subscription records with customer name, plan name, amount, billing cycle, status, and renewal date
4. WHEN an admin user requests a financial report export, THE Accounting System SHALL generate a CSV file containing monthly summaries with total income, total expenses, and net profit for each month
5. WHERE an admin user applies filters before exporting, THE Accounting System SHALL export only the filtered data

### Requirement 7

**User Story:** As an admin user, I want all accounting changes to be audited, so that I can maintain compliance and track who made what changes

#### Acceptance Criteria

1. WHEN an admin user creates any accounting entity, THE Accounting System SHALL record an audit log entry with action type "create", entity type, entity ID, user ID, and timestamp
2. WHEN an admin user updates any accounting entity, THE Accounting System SHALL record an audit log entry with action type "update", entity type, entity ID, user ID, changes object, and timestamp
3. WHEN an admin user deletes any accounting entity, THE Accounting System SHALL record an audit log entry with action type "delete", entity type, entity ID, user ID, and timestamp
4. WHEN an admin user views audit logs, THE Accounting System SHALL display all audit entries sorted by timestamp with filtering by entity type and user
5. WHEN an audit log entry is created, THE Accounting System SHALL ensure the entry is immutable and cannot be modified or deleted

### Requirement 8

**User Story:** As an admin user, I want data validation on all forms, so that I can ensure data integrity and prevent invalid entries

#### Acceptance Criteria

1. WHEN an admin user submits a transaction form with a negative amount, THE Accounting System SHALL reject the submission and display an error message indicating amounts must be positive
2. WHEN an admin user submits a form with missing required fields, THE Accounting System SHALL reject the submission and display error messages for each missing field
3. WHEN an admin user selects a category or source, THE Accounting System SHALL only allow selection from predefined lists defined in the system constants
4. WHEN an admin user enters a date, THE Accounting System SHALL validate the date format and ensure it is a valid calendar date
5. WHEN an admin user submits a subscription with a billing day outside the range 1-31, THE Accounting System SHALL reject the submission and display an error message

### Requirement 9

**User Story:** As an admin user, I want the accounting module to be accessible only to authorized administrators, so that financial data remains secure

#### Acceptance Criteria

1. WHEN a non-admin user attempts to access the accounting module, THE Accounting System SHALL deny access and redirect to an unauthorized page
2. WHEN an admin user accesses any accounting API endpoint, THE Accounting System SHALL verify the user's authentication token and admin role before processing the request
3. WHEN Firestore security rules are evaluated for accounting collections, THE Accounting System SHALL only allow read and write operations for authenticated admin users
4. WHEN an admin user's session expires, THE Accounting System SHALL require re-authentication before allowing further access to accounting data
5. WHEN an admin user performs any accounting operation, THE Accounting System SHALL log the user ID in the audit log for accountability

### Requirement 10

**User Story:** As an admin user, I want the accounting interface to be responsive, so that I can manage finances from any device

#### Acceptance Criteria

1. WHEN an admin user accesses the accounting dashboard on a mobile device with screen width less than 768px, THE Accounting System SHALL display a mobile-optimized layout with stacked cards and collapsible tables
2. WHEN an admin user accesses the accounting dashboard on a tablet device with screen width between 768px and 1024px, THE Accounting System SHALL display a tablet-optimized layout with adjusted column counts and responsive charts
3. WHEN an admin user accesses the accounting dashboard on a desktop device with screen width greater than 1024px, THE Accounting System SHALL display the full desktop layout with all columns and expanded visualizations
4. WHEN an admin user interacts with tables on a mobile device, THE Accounting System SHALL provide horizontal scrolling for tables that exceed the viewport width
5. WHEN an admin user views charts on any device, THE Accounting System SHALL render charts that scale proportionally to the available viewport width


### Requirement 11

**User Story:** As an admin user, I want the accounting module integrated into the existing admin dashboard navigation, so that I can access financial features seamlessly alongside other admin functions

#### Acceptance Criteria

1. WHEN the Admin Dashboard loads, THE Accounting System SHALL add a "Billing & Accounting" menu item to the sidebar navigation under the "Operations" group
2. WHEN an admin user clicks the "Billing & Accounting" menu item, THE Accounting System SHALL display the accounting dashboard within the existing admin layout without page reload
3. WHEN the accounting section is active, THE Accounting System SHALL highlight the "Billing & Accounting" menu item in the sidebar to indicate the current section
4. WHEN an admin user navigates between accounting sub-sections (expenses, incomes, subscriptions, invoices), THE Accounting System SHALL maintain the sidebar navigation state and admin layout
5. WHERE the accounting module uses UI components, THE Accounting System SHALL use the same shadcn/ui components and styling as the existing admin dashboard for visual consistency
