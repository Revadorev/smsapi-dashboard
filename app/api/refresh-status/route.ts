import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// Called when user clicks "Actualizează" — polls SMSAPI for pending statuses
export async function POST() {
  try {
    const token = process.env.SMSAPI_TOKEN
    if (!token) return NextResponse.json({ error: 'No token' }, { status: 500 })

    const db = createServerClient()

    // Get all QUEUE/SENT/ACCEPTED logs from last 24h that have a smsapi_id
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data: pending } = await db
      .from('sms_logs')
      .select('id, smsapi_id, status')
      .in('status', ['QUEUE', 'SENT', 'ACCEPTED', 'PENDING'])
      .not('smsapi_id', 'is', null)
      .gte('created_at', since)
      .limit(50)

    if (!pending || pending.length === 0) {
      return NextResponse.json({ updated: 0 })
    }

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

    let updated = 0

    for (const log of pending) {
      try {
        const res = await fetch(
          `https://api.smsapi.ro/sms.do?status=${log.smsapi_id}&format=json`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        const data = await res.json()
        const rawStatus: string = data?.list?.[0]?.status ?? data?.status ?? ''
        const newStatus = statusMap[rawStatus] ?? rawStatus

        if (newStatus && newStatus !== log.status && newStatus !== 'QUEUE') {
          await db
            .from('sms_logs')
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .eq('id', log.id)
          updated++
        }
      } catch {
        // skip individual errors
      }
    }

    return NextResponse.json({ updated, total: pending.length })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
