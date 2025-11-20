// Force dynamic rendering for all interview IDs
export const dynamic = 'force-dynamic'
export const dynamicParams = true
export const revalidate = 0

// Simplified test page to verify route works on Vercel
export default function InterviewPage({ params }: { params: { id: string } }) {
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '1rem',
      padding: '2rem',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>✅ Interview Route Works!</h1>
      <p style={{ fontSize: '1.2rem' }}>Interview ID: <code style={{ background: '#f0f0f0', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>{params.id}</code></p>
      <p style={{ color: '#666' }}>If you see this message, the dynamic route is working correctly on Vercel.</p>
      <p style={{ color: '#666', fontSize: '0.9rem' }}>The 404 error was likely caused by a build or caching issue.</p>
    </div>
  )
}
