import { NextRequest, NextResponse } from 'next/server'
import { ensureFirebaseAdmin, adminAuth, adminDb } from '@/lib/firebase-admin'

// GET /api/report/[id]/pdf
// Generate PDF report
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureFirebaseAdmin()

    // Support both Authorization header and query parameter
    const authHeader = req.headers.get('authorization') || ''
    const headerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    const queryToken = new URL(req.url).searchParams.get('token')
    const token = headerToken || queryToken
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: missing token' }, { status: 401 })
    }

    const decoded = await adminAuth().verifyIdToken(token)
    const callerUid = decoded.uid
    const interviewId = params.id

    // Load interview
    const interviewSnap = await adminDb().collection('interviews').doc(interviewId).get()
    if (!interviewSnap.exists) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 })
    }

    const interviewData = interviewSnap.data()
    if (!interviewData) {
      return NextResponse.json({ error: 'Interview data not found' }, { status: 404 })
    }

    // Check authorization (same as report route)
    const callerSnap = await adminDb().collection('users').doc(callerUid).get()
    const callerData = callerSnap.data()
    
    const studentSnap = await adminDb().collection('orgStudents').where('firebaseUid', '==', callerUid).limit(1).get()
    const isStudent = !studentSnap.empty
    
    const canView = 
      interviewData.userId === callerUid ||
      (callerData?.orgId && callerData.orgId === interviewData.orgId) ||
      (isStudent && studentSnap.docs[0].id === interviewData.userId)

    if (!canView) {
      return NextResponse.json({ error: 'Forbidden: cannot view this report' }, { status: 403 })
    }

    // Get student info
    let studentName = 'Student'
    if (interviewData.userId) {
      const studentDoc = await adminDb().collection('orgStudents').doc(interviewData.userId).get()
      if (studentDoc.exists) {
        const studentData = studentDoc.data()
        studentName = studentData?.name || studentData?.fullName || 'Student'
      }
    }

    // Get organization info
    let orgName = ''
    let orgLogo = ''
    if (interviewData.orgId) {
      const orgDoc = await adminDb().collection('organizations').doc(interviewData.orgId).get()
      if (orgDoc.exists) {
        const orgData = orgDoc.data()
        orgName = orgData?.name || ''
        orgLogo = orgData?.settings?.customBranding?.logoUrl || ''
      }
    }

    const finalReport = interviewData.finalReport || {}
    const route = interviewData.route || 'unknown'
    const routeDisplay = route === 'usa_f1' ? 'USA F1 Visa' :
                        route === 'uk_student' ? 'UK Student Visa' :
                        route === 'france_ema' ? 'France EMA' :
                        route === 'france_icn' ? 'France ICN' : route

    // Generate HTML for PDF
    const html = generateReportHTML({
      interviewId,
      studentName,
      route: routeDisplay,
      startTime: interviewData.startTime?.toDate?.()?.toISOString() || new Date().toISOString(),
      endTime: interviewData.endTime?.toDate?.()?.toISOString() || new Date().toISOString(),
      score: interviewData.score || 0,
      finalReport,
      orgName,
      orgLogo
    })

    // Check if download mode is requested
    const isDownload = new URL(req.url).searchParams.get('download') === 'true'
    
    // Return HTML that can be printed to PDF by the browser
    // In production, you'd use a library like puppeteer or a service like PDFShift
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': isDownload 
          ? `attachment; filename="interview-report-${interviewId}.html"`
          : `inline; filename="interview-report-${interviewId}.html"`
      }
    })
  } catch (e: any) {
    console.error('[api/report/[id]/pdf] GET error', e)
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}

function generateReportHTML(data: any) {
  const { interviewId, studentName, route, endTime, score, finalReport, orgName, orgLogo } = data
  
  const decision = finalReport.decision || 'borderline'
  const overall = finalReport.overall || 0
  const summary = finalReport.summary || 'Report not available'
  const dimensions = finalReport.dimensions || {}
  const strengths = finalReport.strengths || []
  const weaknesses = finalReport.weaknesses || []
  const detailedInsights = finalReport.detailedInsights || []

  const decisionColor = decision === 'accepted' ? '#22c55e' :
                       decision === 'rejected' ? '#ef4444' : '#eab308'
  const decisionBg = decision === 'accepted' ? '#f0fdf4' :
                    decision === 'rejected' ? '#fef2f2' : '#fefce8'

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Interview Report - ${studentName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f9fafb;
      padding: 40px 20px;
    }
    .container { max-width: 900px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header { text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #e5e7eb; }
    ${orgLogo ? `.logo { max-width: 200px; height: 60px; object-fit: contain; margin-bottom: 20px; }` : ''}
    h1 { font-size: 32px; font-weight: 700; margin-bottom: 10px; color: #111827; }
    .subtitle { font-size: 16px; color: #6b7280; margin-bottom: 5px; }
    .decision-badge {
      display: inline-block;
      padding: 12px 24px;
      border-radius: 9999px;
      font-weight: 700;
      font-size: 18px;
      margin: 20px 0;
      background: ${decisionBg};
      color: ${decisionColor};
    }
    .score { font-size: 48px; font-weight: 700; color: ${decisionColor}; margin: 10px 0; }
    .section { margin: 30px 0; }
    .section-title {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 15px;
      color: #111827;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .summary-box {
      background: #eff6ff;
      border-left: 4px solid #3b82f6;
      padding: 20px;
      border-radius: 6px;
      margin: 15px 0;
    }
    .dimensions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 15px;
      margin: 15px 0;
    }
    .dimension-card {
      background: linear-gradient(135deg, #f3e8ff 0%, #dbeafe 100%);
      padding: 15px;
      border-radius: 6px;
      border: 1px solid #e5e7eb;
    }
    .dimension-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    .dimension-name { font-weight: 600; font-size: 14px; text-transform: capitalize; }
    .dimension-score { font-weight: 700; font-size: 18px; }
    .progress-bar {
      width: 100%;
      height: 8px;
      background: #e5e7eb;
      border-radius: 4px;
      overflow: hidden;
    }
    .progress-fill { height: 100%; border-radius: 4px; transition: width 0.3s; }
    .list-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 20px; }
    .strength-item, .weakness-item {
      padding: 15px;
      border-radius: 6px;
      border-left: 4px solid;
      margin: 10px 0;
      display: flex;
      gap: 10px;
    }
    .strength-item { background: #f0fdf4; border-color: #22c55e; }
    .weakness-item { background: #fef2f2; border-color: #ef4444; }
    .insight-card {
      padding: 15px;
      border-radius: 6px;
      border-left: 4px solid;
      margin: 15px 0;
    }
    .insight-strength { background: #f0fdf4; border-color: #22c55e; }
    .insight-weakness { background: #fef2f2; border-color: #ef4444; }
    .insight-header { display: flex; gap: 8px; margin-bottom: 10px; flex-wrap: wrap; }
    .insight-badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
    }
    .insight-finding { font-weight: 600; margin-bottom: 8px; }
    .insight-example { font-style: italic; color: #6b7280; font-size: 13px; margin-bottom: 8px; }
    .insight-action {
      background: #dbeafe;
      color: #1e40af;
      padding: 10px;
      border-radius: 4px;
      font-size: 13px;
      font-weight: 500;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 13px;
    }
    @media print {
      body { background: white; padding: 0; }
      .container { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      ${orgLogo ? `<img src="${orgLogo}" alt="${orgName}" class="logo" />` : ''}
      <h1>Interview Performance Report</h1>
      <div class="subtitle">${studentName} • ${route}</div>
      <div class="subtitle">Completed on ${new Date(endTime).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
      <div class="decision-badge">${decision.charAt(0).toUpperCase() + decision.slice(1)}</div>
      <div class="score">${overall}%</div>
      <div class="subtitle">Overall Score</div>
    </div>

    <div class="section">
      <div class="section-title">📄 Performance Summary</div>
      <div class="summary-box">${summary}</div>
    </div>

    ${Object.keys(dimensions).length > 0 ? `
    <div class="section">
      <div class="section-title">📊 Performance Breakdown</div>
      <div class="dimensions-grid">
        ${Object.entries(dimensions).map(([category, score]: [string, any]) => `
          <div class="dimension-card">
            <div class="dimension-header">
              <span class="dimension-name">${category.replace(/([A-Z])/g, ' $1').trim()}</span>
              <span class="dimension-score" style="color: ${score >= 80 ? '#22c55e' : score >= 60 ? '#eab308' : '#ef4444'}">${score}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${score}%; background: ${score >= 80 ? '#22c55e' : score >= 60 ? '#eab308' : '#ef4444'}"></div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}

    ${strengths.length > 0 || weaknesses.length > 0 ? `
    <div class="section">
      <div class="list-grid">
        ${strengths.length > 0 ? `
        <div>
          <div class="section-title">🏆 Key Strengths</div>
          ${strengths.map((strength: string) => `
            <div class="strength-item">
              <span>✓</span>
              <span>${strength}</span>
            </div>
          `).join('')}
        </div>
        ` : ''}
        
        ${weaknesses.length > 0 ? `
        <div>
          <div class="section-title">🎯 Areas for Improvement</div>
          ${weaknesses.map((weakness: string) => `
            <div class="weakness-item">
              <span>⚠</span>
              <span>${weakness}</span>
            </div>
          `).join('')}
        </div>
        ` : ''}
      </div>
    </div>
    ` : ''}

    ${detailedInsights.length > 0 ? `
    <div class="section">
      <div class="section-title">📈 Detailed Analysis & Recommendations</div>
      ${detailedInsights.map((insight: any) => `
        <div class="insight-card insight-${insight.type}">
          <div class="insight-header">
            <span class="insight-badge" style="background: ${insight.type === 'strength' ? '#dcfce7' : '#fee2e2'}; color: ${insight.type === 'strength' ? '#166534' : '#991b1b'}">${insight.category}</span>
            <span class="insight-badge" style="background: ${insight.type === 'strength' ? '#bbf7d0' : '#fecaca'}; color: ${insight.type === 'strength' ? '#14532d' : '#7f1d1d'}">${insight.type === 'strength' ? 'Strength' : 'Needs Work'}</span>
          </div>
          <div class="insight-finding">${insight.finding}</div>
          ${insight.example ? `<div class="insight-example">Example: ${insight.example}</div>` : ''}
          <div class="insight-action">💡 Action: ${insight.actionItem}</div>
        </div>
      `).join('')}
    </div>
    ` : ''}

    <div class="footer">
      <p>This report was generated by AI analysis and should be used as a guide for interview preparation.</p>
      <p style="margin-top: 10px;">Report ID: ${interviewId}</p>
      ${orgName ? `<p style="margin-top: 5px;">© ${new Date().getFullYear()} ${orgName}</p>` : ''}
    </div>
  </div>

  <script>
    // Auto-print dialog for PDF generation
    window.onload = function() {
      setTimeout(() => window.print(), 500);
    };
  </script>
</body>
</html>
  `.trim()
}
