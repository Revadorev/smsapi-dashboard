import { NextRequest, NextResponse } from 'next/server'

const USERNAME = process.env.AUTH_USERNAME || 'kidgps'
const PASSWORD = process.env.AUTH_PASSWORD || 'w1r3l3$$'
const SESSION_COOKIE = 'sms_session'
const SESSION_SECRET = process.env.AUTH_SECRET || 'kidgps_sms_secret_2024'

export async function POST(req: NextRequest) {
  const { username, password } = await req.json()

  if (username !== USERNAME || password !== PASSWORD) {
    return NextResponse.json({ error: 'User sau parolă incorectă.' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set(SESSION_COOKIE, SESSION_SECRET, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 zile
    path: '/',
  })
  return res
}
