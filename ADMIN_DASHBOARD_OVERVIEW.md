# Admin Dashboard - Complete Overview

## Current Structure

The admin dashboard is a comprehensive platform management system located at `/admin` with a modern sidebar navigation layout.

---

## 📊 Main Sections

### 1. **Overview (Dashboard Home)**
**Component:** `DashboardOverview.tsx`  
**API Endpoints:**
- `/api/admin/stats/overview` - Real-time statistics
- `/api/admin/stats/trends` - Time-series data
- `/api/admin/audit-logs` - Recent activity logs

**Current Features:**
- **Key Metrics Cards:**
  - Total Users (real-time from Firestore)
  - Total Organizations (real-time)
  - Interviews Completed (real-time)
  - Monthly Revenue (calculated from org plans)

- **Charts:**
  - Test Usage Trend (6-month line chart)
  - Organization Types Distribution (pie chart)

- **System Status:**
  - Overall Health Percentage
  - Active Users (30-day count)
  - Pending Support Tickets

- **Recent Activity Feed:**
  - Latest platform events
  - Color-coded by status (success/warning/error/info)
  - Timestamps for each activity

**Data Refresh:** 
- Stats cached for 30 seconds
- Trends cached for 10 minutes
- Uses cache-first strategy for instant loading

---

### 2. **User Management**
**Component:** `UserManagement.tsx`  
**API Endpoints:**
- `/api/admin/users/list?type=all` - All users
- `/api/admin/users/list?type=signup` - Signup users only

**Features:**
- User listing with search and filters
- Role-based filtering (student/organization/admin)
- Status filtering (active/inactive/suspended)
- User details:
  - Name, email, role
  - Organization affiliation
  - Join date, last active
  - Tests completed count
- Actions:
  - Create new users
  - Edit user details
  - Delete users
  - Password reset emails
- Real-time updates from Firestore

---

### 3. **Organizations**
**Component:** `OrganizationManagement.tsx`  
**API Endpoints:**
- `/api/admin/organizations/list` - All organizations

**Features:**
- Organization listing with search
- Type filtering (visa_consultancy/educational/corporate)
- Status filtering (active/suspended/pending)
- Organization details:
  - Name, contact person, email, phone
  - Subscription plan (basic/premium/enterprise)
  - Monthly quota and usage
  - User count per organization
  - Join date, next billing date
- Actions:
  - Create new organizations
  - Edit organization details
  - Delete organizations
  - Manage quotas
- Real-time subscription to Firestore

---

### 4. **Quota Management**
**Component:** `QuotaManagement.tsx`

**Features:**
- **Organization Quotas:**
  - Current quota vs used quota
  - Status indicators (healthy/warning/critical)
  - Plan-based quota allocation
  - Bulk quota updates

- **User Quotas:**
  - Individual user quota tracking
  - Usage monitoring
  - Quota adjustment interface

- **Analytics:**
  - Usage trend chart (5-month history)
  - Quota distribution by plan
  - Total quota allocation statistics

- Actions:
  - Adjust organization quotas
  - Adjust user quotas
  - Reset quotas
  - View usage history

---

### 5. **Analytics**
**Component:** `PlatformAnalytics.tsx`

**Features:**
- **Overview Tab:**
  - Total users, organizations, tests
  - Average score, completion rate
  - Growth metrics (users/tests/revenue)

- **Users Tab:**
  - User growth over time (6-month chart)
  - Student vs organization breakdown
  - User acquisition trends

- **Tests Tab:**
  - Test performance by category
  - Daily activity patterns
  - Test completion rates

- **Performance Tab:**
  - Average scores by test type
  - Performance trends
  - Success metrics

- **Geographic Tab:**
  - Regional distribution (pie chart)
  - Users and tests by region
  - Geographic growth patterns

**Data:** Currently uses mock/estimated data for demonstration

---

### 6. **Billing**
**Component:** `BillingManagement.tsx`

**Expected Features:**
- Subscription management
- Payment history
- Invoice generation
- Revenue tracking
- Plan upgrades/downgrades
- Payment method management

---

### 7. **Settings**
**Component:** `GlobalSettings.tsx`

**Expected Features:**
- Platform configuration
- Email templates
- API keys management
- Feature flags
- System preferences
- Integration settings

---

### 8. **Support**
**Component:** `SupportCenter.tsx`

**Features:**
- Support ticket management
- Badge showing pending tickets (currently: 3)
- User inquiries
- Issue tracking
- Response management

---

### 9. **Interview Simulation**
**Component:** `InterviewSimulation.tsx`

**Features:**
- Test interview functionality
- AssemblyAI integration testing
- F1 visa question testing
- Real-time transcription testing
- Admin testing environment

---

## 🔐 Security & Access

**Authentication:**
- Firebase Auth token verification
- Admin role check on all API routes
- Protected routes with `AdminGuard` component

**Authorization:**
- Only users with `role: 'admin'` can access
- Token-based API authentication
- Firestore security rules enforcement

---

## 🎨 UI/UX Features

**Layout:**
- Collapsible sidebar navigation
- Grouped menu items (Platform/Insights/Operations)
- Breadcrumb navigation
- Search functionality in header
- Responsive design (mobile-friendly)

**Components:**
- Lazy loading for performance
- Loading skeletons
- Error boundaries
- Toast notifications (Sonner)
- Modal dialogs for actions

**Branding:**
- "MI" logo (Mock Interview)
- Consistent color scheme
- shadcn/ui component library

---

## 📈 Performance Optimizations

1. **Lazy Loading:** All major components are lazy-loaded
2. **Caching:** 
   - Client-side cache for API responses
   - Cache-first strategy with background refresh
   - Configurable TTL per endpoint
3. **Efficient Queries:**
   - Firestore aggregation queries (count())
   - No full collection scans
   - Indexed queries for filtering
4. **Real-time Updates:**
   - Selective real-time subscriptions
   - Unsubscribe on unmount
   - Debounced updates

---

## 🔄 Data Flow

```
User Action → Component → API Route → Firebase Admin SDK → Firestore
                ↓                                              ↓
            Cache Layer ←──────────────────────────────────────┘
                ↓
            UI Update
```

---

## 📊 Available Data Points

### From `/api/admin/stats/overview`:
- `totalUsers` - Total user count
- `totalOrganizations` - Total org count
- `totalInterviews` - Total interview count
- `monthlyRevenue` - Calculated revenue
- `activeUsers` - 30-day active users
- `pendingSupport` - Support ticket count
- `systemHealth` - Completion rate percentage

### From `/api/admin/stats/trends`:
- `testUsageData` - Monthly test completions (6 months)
- `organizationTypeData` - Org distribution by plan

### From `/api/admin/audit-logs`:
- Activity logs with timestamps
- Action types and status
- User attribution

---

## 🚀 Potential Enhancements for Overview Page

Based on the current architecture, here are suggestions for the overview page:

### Quick Actions Panel
- Create new user (quick link)
- Create new organization (quick link)
- View pending support tickets
- Export reports

### Real-time Alerts
- Low quota warnings
- Failed interviews
- System errors
- Payment failures

### Performance Metrics
- Average interview duration
- Success rate by visa type
- Peak usage times
- Server response times

### Financial Dashboard
- Revenue breakdown by plan
- Monthly recurring revenue (MRR)
- Churn rate
- Lifetime value (LTV)

### User Engagement
- Daily active users (DAU)
- Monthly active users (MAU)
- Average tests per user
- User retention rate

### System Monitoring
- API response times
- Error rates
- Database query performance
- Storage usage

### Recent Registrations
- Latest user signups
- Latest organization signups
- Conversion funnel

### Top Performers
- Most active organizations
- Highest scoring users
- Most used features

### Comparison Metrics
- Week-over-week growth
- Month-over-month growth
- Year-over-year growth

---

## 📁 File Structure

```
src/
├── components/admin/
│   ├── AdminDashboard.tsx          # Main dashboard shell
│   ├── DashboardOverview.tsx       # Overview page ⭐
│   ├── UserManagement.tsx          # User CRUD
│   ├── OrganizationManagement.tsx  # Org CRUD
│   ├── QuotaManagement.tsx         # Quota tracking
│   ├── PlatformAnalytics.tsx       # Analytics charts
│   ├── BillingManagement.tsx       # Billing (TBD)
│   ├── GlobalSettings.tsx          # Settings (TBD)
│   ├── SupportCenter.tsx           # Support (TBD)
│   └── InterviewSimulation.tsx     # Testing tool
│
├── app/api/admin/
│   ├── stats/
│   │   ├── overview/route.ts       # Dashboard stats
│   │   └── trends/route.ts         # Trend data
│   ├── users/
│   │   └── list/route.ts           # User listing
│   ├── organizations/
│   │   └── list/route.ts           # Org listing
│   └── audit-logs/                 # Activity logs
│
└── app/admin/
    ├── page.tsx                    # Admin route
    └── layout.tsx                  # Admin layout
```

---

## 🎯 Next Steps for Overview Enhancement

1. **Add Quick Stats Cards:**
   - Today's new users
   - Today's completed interviews
   - Current active sessions
   - System uptime

2. **Add Action Buttons:**
   - Quick create user/org
   - View all alerts
   - Generate report
   - System health check

3. **Add Mini Charts:**
   - 7-day user activity sparkline
   - 7-day revenue sparkline
   - Real-time active users gauge

4. **Add Notifications Panel:**
   - System alerts
   - Low quota warnings
   - Failed payments
   - Support tickets

5. **Add Shortcuts:**
   - Most used features
   - Recent searches
   - Bookmarked reports

6. **Add Comparison View:**
   - This week vs last week
   - This month vs last month
   - Growth indicators

---

## 💡 Implementation Tips

- Use the existing cache system for new data
- Follow the lazy loading pattern for new components
- Use Firestore aggregation queries for counts
- Add proper error handling and loading states
- Maintain consistent UI with shadcn/ui components
- Keep API responses cacheable with appropriate TTL
- Use real-time subscriptions sparingly (only for critical data)

