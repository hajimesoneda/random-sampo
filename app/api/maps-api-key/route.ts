import { NextResponse } from 'next/server'

export async function GET() {
  // APIキーを環境変数から取得
  const apiKey = process.env.GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    console.error('GOOGLE_MAPS_API_KEY is not set in environment variables')
    return NextResponse.json({ error: 'API key not found' }, { status: 500 })
  }

  // APIキーをレスポンスとして返す
  return NextResponse.json({ apiKey })
}

