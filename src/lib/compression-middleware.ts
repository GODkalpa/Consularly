import { NextResponse } from 'next/server'

/**
 * Adds compression headers to API responses for payloads > 1KB
 * Note: Next.js automatically handles gzip/brotli compression in production,
 * but we can optimize by setting appropriate headers
 */
export function withCompression(response: NextResponse, body?: any): NextResponse {
  // Calculate approximate body size
  const bodySize = body ? JSON.stringify(body).length : 0
  
  // For responses > 1KB, ensure compression is enabled
  if (bodySize > 1024) {
    // Next.js handles actual compression, we just set hints
    response.headers.set('Content-Type', 'application/json; charset=utf-8')
    
    // Hint that this response should be compressed
    // In production, Next.js/Vercel will handle actual gzip/brotli
    if (!response.headers.has('Content-Encoding')) {
      response.headers.set('Vary', 'Accept-Encoding')
    }
  }
  
  return response
}

/**
 * Helper to create a compressed JSON response
 */
export function compressedJsonResponse(data: any, status = 200): NextResponse {
  const response = NextResponse.json(data, { status })
  return withCompression(response, data)
}
