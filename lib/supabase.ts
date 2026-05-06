import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Server-side client with service role (for API routes)
export function createServerClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase server env vars not configured')
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// Browser/client-side singleton
let _browserClient: SupabaseClient | null = null

export function getBrowserClient(): SupabaseClient {
  if (!_browserClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) throw new Error('Supabase env vars not configured')
    _browserClient = createClient(url, key)
  }
  return _browserClient
}

// Named export for client components
export const supabase = {
  get client() {
    return getBrowserClient()
  },
  from(table: string) {
    return getBrowserClient().from(table)
  },
}

export type SmsLog = {
  id: string
  phone_number: string
  message: string
  sender_name: string
  status: string
  smsapi_id: string | null
  points: number | null
  error_code: number | null
  error_message: string | null
  created_at: string
  updated_at: string
}

export type SmsTemplate = {
  id: string
  name: string
  content: string
  created_at: string
  updated_at: string
}
