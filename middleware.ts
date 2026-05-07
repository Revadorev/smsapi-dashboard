import { NextRequest, NextResponse } from 'next/server'

const USERNAME = process.env.AUTH_USERNAME || 'kidgps'
const PASSWORD = process.env.AUTH_PASSWORD || 'w1r3l3$$'
const SESSION_COOKIE = 'sms_session'
const SESSION_SECRET = process.env.AUTH_SECRET || 'kidgps_sms_secret_2024'

// Rute publice (nu necesita autentificare)
const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/auth/logout']

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Permite rute publice
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Verifica cookie de sesiune
  const sessionCookie = req.cookies.get(SESSION_COOKIE)
  if (sessionCookie?.value === SESSION_SECRET) {
    return NextResponse.next()
  }

  // Redirect la login
  const loginUrl = new URL('/login', req.url)
  loginUrl.searchParams.set('from', pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.svg).*)',
  ],
}
