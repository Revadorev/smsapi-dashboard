import { NextResponse } from 'next/server'
import { getAccountBalance } from '@/lib/smsapi'

export async function GET() {
  try {
    const balance = await getAccountBalance()
    if (!balance) {
      return NextResponse.json({ error: 'Nu s-a putut obține soldul' }, { status: 502 })
    }
    return NextResponse.json(balance)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Eroare'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
