import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// Poll SMSAPI for delivery status of a specific message
export async function POST(req: NextRequest) {
  try {
    const { smsapi_id, log_id } = await req.json()
    if (!smsapi_id || !log_id) {
      return NextResponse.json({ error: 'Missing params' }, { status: 400 })
    }

    const token = process.env.SMSAPI_TOKEN
    if (!token) return NextResponse.json({ error: 'No token' }, { status: 500 })

    // Query SMSAPI for status
    const res = await fetch(
      `https://api.smsapi.ro/sms.do?status=${smsapi_id}&format=json`,
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      }
    )

    const data = await res.json()

    // SMSAPI returns: { list: [{ id, status, ... }] }
    const statusEntry = data?.list?.[0] ?? data
    const rawStatus: string = statusEntry?.status ?? ''

    // Map numeric status codes to names
    const statusMap: Record<string, string> = {
      '401': 'NOT_FOUND',
      '402': 'EXPIRED',
      '403': 'SENT',
      '404': 'DELIVERED',
      '405': 'UNDELIVERED',
      '406': 'FAILED',
      '407': 'REJECTED',
      '408': 'UNKNOWN',
      '409': 'QUEUE',
      '410': 'ACCEPTED',
    }

    const resolvedStatus = statusMap[rawStatus] ?? rawStatus

    // Update DB if status changed and is meaningful
    if (resolvedStatus && resolvedStatus !== 'QUEUE' && resolvedStatus !== 'PENDING') {
      const db = createServerClient()
      await db
        .from('sms_logs')
        .update({ status: resolvedStatus, updated_at: new Date().toISOString() })
        .eq('id', log_id)
    }

    return NextResponse.json({ status: resolvedStatus || 'QUEUE' })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
