'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { MessageSquare, BarChart2, Settings, Wifi, WifiOff, Gift, LogOut, Package } from 'lucide-react'
import type { AccountBalance } from '@/lib/smsapi'

interface Props {
  balance: AccountBalance | null
  children: React.ReactNode
}

export default function DashboardLayout({ balance, children }: Props) {
  const isConnected = balance !== null
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-bold text-slate-900 text-lg leading-none block">
                  SMS Dashboard
                </span>
                <span className="text-xs text-slate-400 leading-none">powered by SMSAPI.ro</span>
              </div>
            </div>

            {/* Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {[
                { href: '/', icon: MessageSquare, label: 'Trimite SMS' },
                { href: '/history', icon: BarChart2, label: 'Istoric' },
                { href: '/templates', icon: Settings, label: 'Template-uri' },
                { href: '/cadouri', icon: Gift, label: 'Cadouri' },
                { href: '/awb', icon: Package, label: 'AWB' },
              ].map(({ href, icon: Icon, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pathname === href
                      ? 'text-indigo-600 bg-indigo-50'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              ))}
            </nav>

            {/* Status + Logout */}
            <div className="flex items-center gap-2">
              {isConnected ? (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-3 py-1.5">
                  <Wifi className="w-3.5 h-3.5 text-green-600" />
                  <span className="text-xs font-semibold text-green-700">
                    {balance.points.toFixed(2)} credite
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-full px-3 py-1.5">
                  <WifiOff className="w-3.5 h-3.5 text-red-500" />
                  <span className="text-xs font-semibold text-red-600">Offline</span>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                title="Deconectare"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 mt-auto py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-400">
          SMS Dashboard • Integrat cu{' '}
          <a
            href="https://www.smsapi.ro"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-500 hover:underline"
          >
            SMSAPI.ro
          </a>
        </div>
      </footer>
    </div>
  )
}
