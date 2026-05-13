'use client'

import { useState } from 'react'
import { Clock, Search, RefreshCw } from 'lucide-react'
import type { SmsLog } from '@/lib/supabase'
import { formatDate, formatPhone, getStatusColor } from '@/lib/utils'

interface Props {
  logs: SmsLog[]
}

export default function SmsHistoryTable({ logs: initialLogs }: Props) {
  const [logs, setLogs] = useState<SmsLog[]>(initialLogs)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [refreshInfo, setRefreshInfo] = useState<string | null>(null)

  async function refresh() {
    setLoading(true)
    setRefreshInfo(null)
    try {
      const statusRes = await fetch('/api/refresh-status', { method: 'POST' })
      const statusData = await statusRes.json()
      if (statusData.updated > 0) {
        setRefreshInfo(`${statusData.updated} status${statusData.updated > 1 ? 'uri' : ''} actualizat${statusData.updated > 1 ? 'e' : ''}`)
      }
      const res = await fetch('/api/logs?limit=50')
      const data = await res.json()
      if (data.data) setLogs(data.data)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const filtered = logs.filter((log) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      log.phone_number.includes(q) ||
      log.message.toLowerCase().includes(q) ||
      log.status.toLowerCase().includes(q)
    )
  })

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">Istoric SMS</h2>
              <p className="text-xs text-slate-400">{logs.length} mesaje înregistrate</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {refreshInfo && (
              <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                ✓ {refreshInfo}
              </span>
            )}
            <button
              onClick={refresh}
              disabled={loading}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-indigo-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Actualizează
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Caută după număr, mesaj sau status..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-slate-50"
          />
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Niciun SMS înregistrat</p>
          <p className="text-slate-400 text-sm mt-1">
            {search
              ? 'Niciun rezultat pentru căutarea dvs.'
              : 'Trimiteți primul SMS din formularul alăturat.'}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {/* Column headers */}
          <div className="grid grid-cols-[1fr_2fr_auto_auto_auto] gap-3 px-4 py-2 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wide">
            <span>Destinatar</span>
            <span>Mesaj</span>
            <span>Status</span>
            <span>Credite</span>
            <span>Data</span>
          </div>
          {filtered.map((log) => (
            <div
              key={log.id}
              className="grid grid-cols-[1fr_2fr_auto_auto_auto] gap-3 px-4 py-3 hover:bg-slate-50 transition-colors items-start"
            >
              <span className="font-mono text-xs font-medium text-slate-700 pt-0.5">
                {formatPhone(log.phone_number)}
              </span>
              <div className="min-w-0">
                <p className="text-sm text-slate-700 break-words line-clamp-3" title={log.message}>
                  {log.message}
                </p>
                {log.error_message && (
                  <p className="text-xs text-red-500 mt-0.5 break-words" title={log.error_message}>
                    {log.error_message}
                  </p>
                )}
              </div>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${getStatusColor(log.status)}`}
              >
                {log.status}
              </span>
              <span className="text-xs text-slate-500 whitespace-nowrap pt-0.5">
                {log.points != null ? log.points.toFixed(4) : '—'}
              </span>
              <span className="text-xs text-slate-400 whitespace-nowrap pt-0.5">
                {formatDate(log.created_at)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
