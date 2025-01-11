import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const host = request.headers.get('host')
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    console.error('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set in environment variables')
    return NextResponse.json({ error: 'API key not found' }, { status: 500 })
  }

  // Create the response with the API key
  const response = NextResponse.json({ apiKey })

  // Add security headers
  response.headers.set('Cache-Control', 'no-store, private')
  response.headers.set('Content-Type', 'application/json')
  response.headers.set('Access-Control-Allow-Origin', `https://${host}`)
  response.headers.set('Access-Control-Allow-Methods', 'GET')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type')

  return response
}

