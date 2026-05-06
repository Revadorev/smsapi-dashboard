import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// One-time setup endpoint — creates tables if they don't exist
// Call: GET /api/setup
export async function GET() {
  try {
    const db = createServerClient()

    // Check if tables exist
    const { error: checkError } = await db.from('sms_logs').select('id').limit(1)
    const tablesExist = !checkError || !checkError.message.includes('does not exist')

    if (tablesExist && !checkError) {
      return NextResponse.json({ ok: true, message: 'Tables already exist' })
    }

    // Tables don't exist - we need to create them
    // Since Supabase REST API doesn't support DDL directly,
    // we use the pg module via direct connection
    return NextResponse.json({
      ok: false,
      message: 'Tables not found. Please run supabase-schema.sql in your Supabase SQL Editor.',
      hint: 'Go to https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new and paste the contents of supabase-schema.sql',
      error: checkError?.message,
    }, { status: 503 })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
