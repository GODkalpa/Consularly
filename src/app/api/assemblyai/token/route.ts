import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { expires_in } = await request.json().catch(() => ({ expires_in: 600 }))

    const apiKey = process.env.ASSEMBLYAI_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Server is not configured: ASSEMBLYAI_API_KEY is missing' },
        { status: 500 }
      )
    }

    // AssemblyAI v3 Streaming token endpoint expects GET with query param `expires_in_seconds`
    const url = new URL('https://streaming.assemblyai.com/v3/token')
    // Clamp to safe bounds (AssemblyAI typically allows 60..600 seconds for temp tokens)
    const seconds = Math.max(60, Math.min(600, Number(expires_in || 600)))
    url.searchParams.set('expires_in_seconds', String(seconds))

    const resp = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: apiKey,
      },
    })

    if (!resp.ok) {
      const text = await resp.text().catch(() => '')
      console.error('AssemblyAI token upstream error:', resp.status, resp.statusText, text)
      return NextResponse.json(
        { error: 'Failed to fetch token from AssemblyAI', upstreamStatus: resp.status, upstreamStatusText: resp.statusText, details: text },
        { status: resp.status }
      )
    }

    const data = await resp.json()
    return NextResponse.json({ token: data.token, expires_in_seconds: data.expires_in_seconds })
  } catch (error) {
    console.error('AssemblyAI token route error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'AssemblyAI token endpoint',
    endpoint: 'POST /api/assemblyai/token',
    body: { expires_in: 'optional number of seconds (min 60, max 600, default 600)' },
  })
}
