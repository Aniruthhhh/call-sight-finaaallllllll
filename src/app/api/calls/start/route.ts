import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json({ error: 'Endpoint moved to /api/calls/initiate' }, { status: 410 })
}
