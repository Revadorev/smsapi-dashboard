import { NextRequest, NextResponse } from 'next/server'

const SAMEDAY_BASE = 'https://api.sameday.ro'
const SAMEDAY_USER = process.env.SAMEDAY_USERNAME || 'corect2000API'
const SAMEDAY_PASS = process.env.SAMEDAY_PASSWORD || '^BWw1t8C'

async function getToken(): Promise<string> {
  const res = await fetch(`${SAMEDAY_BASE}/api/authenticate`, {
    method: 'POST',
    headers: {
      'X-AUTH-USERNAME': SAMEDAY_USER,
      'X-AUTH-PASSWORD': SAMEDAY_PASS,
      'Content-Type': 'application/json',
    },
  })
  const data = await res.json()
  if (!data.token) throw new Error('SameDay auth failed')
  return data.token
}

export async function GET(req: NextRequest) {
  const awb = req.nextUrl.searchParams.get('awb')
  if (!awb) return NextResponse.json({ error: 'AWB lipsă' }, { status: 400 })

  try {
    const token = await getToken()
    const res = await fetch(`${SAMEDAY_BASE}/api/client/awb/${awb}/pdf`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'Nu s-a putut descărca PDF-ul' }, { status: 400 })
    }

    const buffer = await res.arrayBuffer()
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="AWB_${awb}.pdf"`,
      },
    })
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
