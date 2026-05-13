'use client'

import { useState } from 'react'
import { Clock, Search, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'
import type { SmsLog } from '@/lib/supabase'
import { formatDate, formatPhone, getStatusColor } from '@/lib/utils'

interface Props {
  logs: SmsLog[]
}

const PAGE_SIZE = 20

export default function SmsHistoryTable({ logs: initialLogs }: Props) {
  const [logs, setLogs] = useState(initialLogs)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [refreshInfo, setRefreshInfo] = useState<string | null>(null)

  async function refresh() {
    setLoading(true)
    setRefreshInfo(null)
    try {
      const statusRes = await fetch('/api/refresh-status', { method: 'POST' })
      const statusData = await statusRes.json()
      if (statusData.updated > 0) {
        setRefreshInfo(statusData.updated + (statusData.updated > 1 ? ' statusuri actualizate' : ' status actualizat'))
      }
      const res = await fetch('/api/logs?limit=200')
      const data = await res.json()
      if (data.data) { setLogs(data.data); setPage(1) }
    } catch {}
    finally { setLoading(false) }
  }

  const filtered = logs.filter((log) => {
    if (!search) return true
    const q = search.toLowerCase()
    return log.phone_number.includes(q) || log.message.toLowerCase().includes(q) || log.status.toLowerCase().includes(q)
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  function handleSearch(val) {
    setSearch(val)
    setPage(1)
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">Istoric SMS</h2>
              <p className="text-xs text-slate-400">{logs.length} mesaje inregistrate</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {refreshInfo && (
              <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">checkmark {refreshInfo}</span>
            )}
            <button onClick={refresh} disabled={loading} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-indigo-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-50">
              <RefreshCw className={"w-4 h-4 " + (loading ? 'animate-spin' : '')} />
              Actualizeaz        </button>
          </div>
        </div>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" value={search} onChange={(e) => handleSearch(e.target.value)} placeholder="Cauta dupa numar, mesaj sau status..." className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-slate-50" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Niciun SMS inregistrat</p>
          <p className="text-slate-400 text-sm mt-1">{search ? 'Niciun rezultat.' : 'Trimiteti primul SMS.'}</p>
        </div>
      ) : (
        <>
          <div className="divide-y divide-slate-100">
            <div className="grid grid-cols-[1fr_2fr_auto_auto_auto] gap-3 px-4 py-2 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              <span>Destinatar</span><span>Mesaj</span><span>Status</span><span>Credite</span><span>Data</span>
            </div>
            {paginated.map((log) => (
              <div key={log.id} className="grid grid-cols-[1fr_2fr_auto_auto_auto] gap-3 px-4 py-3 hover:bg-slate-50 transition-colors items-start">
                <span className="font-mono text-xs font-medium text-slate-700 pt-0.5">{formatPhone(log.phone_number)}</span>
                <div className="min-w-0">
                  <p className="text-sm text-slate-700 break-words line-clamp-3" title={log.message}>{log.message}</p>
                  {log.error_message && <p className="text-xs text-red-500 mt-0.5 break-words">{log.error_message}</p>}
                </div>
                <span className={"inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap " + getStatusColor(log.status)}>{log.status}</span>
                <span className="text-xs text-slate-500 whitespace-nowrap pt-0.5">{log.points != null ? log.points.toFixed(4) : '-'}</span>
                <span className="text-xs text-slate-400 whitespace-nowrap pt-0.5">{formatDate(log.created_at)}</span>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50">
              <p className="text-xs text-slate-500">
                {(currentPage - 1) * PAGE_SIZE + 1}&#8211;{Math.min(currentPage * PAGE_SIZE, filtered.length)} din {filtered.length} mesaje
              </p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1).reduce((acc, p, idx, arr) => {
                  if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...')
                  acc.push(p)
                  return acc
                }, []).map((p, idx) =>
                  p === '...' ? (
                    <span key={'ellipsis-' + idx} className="px-1 text-slate-400 text-xs">...</span>
                  ) : (
                    <button key={p} onClick={() => setPage(p)} className={"w-8 h-8 rounded-lg text-xs font-medium transition-colors " + (p === currentPage ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-200')}>
                      {p}
                    </button>
                  )
                )}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
