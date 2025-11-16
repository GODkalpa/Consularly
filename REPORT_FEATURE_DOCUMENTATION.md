# Interview Report Feature Documentation

## Overview

The interview report feature provides a dedicated page for viewing and downloading detailed interview performance reports. This feature is available to both organization members and students.

## Features

### 1. Dedicated Report Page
- **URL**: `/report/[interviewId]`
- **Access**: Authenticated users who have permission to view the interview
- **Layout**: Clean, professional report layout optimized for viewing and printing

### 2. PDF Download
- **Functionality**: Generate and download interview reports as PDF
- **Method**: Browser print-to-PDF (uses native browser print dialog)
- **Format**: Professional HTML report that prints cleanly to PDF

### 3. Report Content

The report includes:

#### Header Section
- Organization logo (if available)
- Student name and interview type
- Completion date and time
- Decision badge (Accepted/Rejected/Borderline)
- Overall score

#### Performance Summary
- AI-generated detailed summary (2-3 paragraphs)
- Comprehensive analysis of interview performance

#### Performance Breakdown
- Dimension scores with visual progress bars
- Color-coded scores (green: 80+, yellow: 60-79, red: <60)
- Categories vary by interview route:
  - **UK Student**: courseAndUniversityFit, financialRequirement, accommodationLogistics, complianceCredibility, postStudyIntent
  - **USA F1**: content, financials, intent
  - **France**: Similar to UK with university-specific criteria

#### Key Strengths
- List of identified strengths
- Positive feedback with checkmarks
- Green-themed visual design

#### Areas for Improvement
- List of weaknesses to address
- Constructive feedback with warning icons
- Orange-themed visual design

#### Detailed Analysis & Recommendations
- Category-based insights (Content Quality, Financial, Course, Communication, Body Language, Intent)
- Each insight includes:
  - Category and type (strength/weakness)
  - Specific finding
  - Example from the interview (if available)
  - Actionable improvement step

#### Footer
- Report ID for reference
- Organization name and copyright
- Disclaimer about AI-generated content

## Implementation Details

### Files Created

1. **`src/app/report/[id]/page.tsx`**
   - Main report page component
   - Fetches report data from API
   - Displays formatted report
   - Handles PDF download

2. **`src/app/api/report/[id]/route.ts`**
   - API endpoint for fetching report data
   - Authorization checks
   - Fetches interview, student, and organization data
   - Returns formatted report object

3. **`src/app/api/report/[id]/pdf/route.ts`**
   - API endpoint for PDF generation
   - Generates HTML optimized for printing
   - Returns HTML that triggers browser print dialog
   - Includes inline styles for consistent rendering

### Files Modified

1. **`src/components/org/OrgStudentResults.tsx`**
   - Added "View Report" button for completed interviews
   - Opens report in new tab

2. **`src/components/student/StudentResults.tsx`**
   - Added "View Report" button for completed interviews
   - Opens report in new tab

## Usage

### For Organization Members

1. Navigate to **Results** section in organization dashboard
2. Find a completed interview
3. Click **"View Report"** button
4. Report opens in new tab
5. Click **"Download PDF"** to save as PDF

### For Students

1. Navigate to **Results** section in student dashboard
2. Find a completed interview
3. Click **"View Report"** button
4. Report opens in new tab
5. Click **"Download PDF"** to save as PDF

## Authorization

The report endpoints check authorization as follows:

1. **User's own interview**: Users can view reports for their own interviews
2. **Organization member**: Org members can view reports for interviews in their organization
3. **Student**: Students can view reports for their own interviews (matched by firebaseUid)

If authorization fails, a 403 Forbidden error is returned.

## PDF Generation

### Current Implementation

The PDF generation uses a browser-based approach:

1. API generates HTML with inline styles
2. HTML is optimized for printing (print media queries)
3. Browser's native print dialog is triggered automatically
4. User can save as PDF using "Save as PDF" option

### Advantages
- No server-side dependencies
- Works across all browsers
- Consistent rendering
- No additional costs

### Future Enhancements

For production, consider:

1. **Server-side PDF generation** using:
   - Puppeteer (headless Chrome)
   - PDFKit (Node.js PDF library)
   - External service (PDFShift, DocRaptor)

2. **Benefits**:
   - Direct PDF download (no print dialog)
   - Consistent rendering across all devices
   - Better control over PDF metadata
   - Support for complex layouts

## Styling

The report uses:

- **Color scheme**: Matches interview decision
  - Green: Accepted
  - Red: Rejected
  - Yellow: Borderline

- **Typography**: System fonts for consistency
- **Layout**: Responsive grid for dimension scores
- **Print optimization**: Clean layout without unnecessary elements

## API Response Format

### GET /api/report/[id]

```typescript
{
  id: string
  studentName: string
  studentEmail: string
  route: string
  startTime: string (ISO 8601)
  endTime: string (ISO 8601)
  status: string
  score: number
  finalReport: {
    decision: 'accepted' | 'rejected' | 'borderline'
    overall: number
    dimensions: Record<string, number>
    summary: string
    detailedInsights: Array<{
      category: string
      type: 'strength' | 'weakness'
      finding: string
      example?: string
      actionItem: string
    }>
    strengths: string[]
    weaknesses: string[]
  }
  orgName?: string
  orgLogo?: string
}
```

### GET /api/report/[id]/pdf

Returns HTML content with:
- Content-Type: text/html
- Content-Disposition: inline
- Auto-triggers print dialog via JavaScript

## Error Handling

### Report Not Found
- **Status**: 404
- **Display**: Error card with "Report Not Found" message
- **Action**: "Go Back" button

### Unauthorized Access
- **Status**: 403
- **Display**: Error card with "Forbidden" message
- **Action**: Redirect to signin or dashboard

### Loading State
- **Display**: Centered spinner with "Loading report..." message
- **Duration**: Until data is fetched or error occurs

## Testing

### Test Cases

1. **View Report as Organization Member**
   - Login as org member
   - Navigate to Results
   - Click "View Report" on completed interview
   - Verify report displays correctly
   - Click "Download PDF"
   - Verify PDF generates correctly

2. **View Report as Student**
   - Login as student
   - Navigate to Results
   - Click "View Report" on completed interview
   - Verify report displays correctly
   - Click "Download PDF"
   - Verify PDF generates correctly

3. **Authorization Check**
   - Try to access report URL for interview you don't own
   - Verify 403 error is returned
   - Verify error message is displayed

4. **Missing Report Data**
   - Try to access report for interview without finalReport
   - Verify appropriate message is displayed

## Future Enhancements

1. **Email Reports**
   - Send report via email after interview completion
   - Include PDF attachment

2. **Report Sharing**
   - Generate shareable link with expiration
   - Allow students to share reports with others

3. **Report Comparison**
   - Compare multiple interview reports
   - Show progress over time

4. **Custom Branding**
   - Allow organizations to customize report design
   - Add custom headers/footers
   - Include organization-specific messaging

5. **Analytics**
   - Track report views
   - Monitor PDF downloads
   - Analyze which sections are most viewed

## Related Files

- `src/app/report/[id]/page.tsx` - Report page component
- `src/app/api/report/[id]/route.ts` - Report data API
- `src/app/api/report/[id]/pdf/route.ts` - PDF generation API
- `src/components/org/OrgStudentResults.tsx` - Org results with report button
- `src/components/student/StudentResults.tsx` - Student results with report button
- `INTERVIEW_STATUS_FIX.md` - Related documentation on interview status
- `QUICK_FIX_SUMMARY.md` - Quick reference for interview fixes
