'use client'

import { useState, useRef } from 'react'
import { Send, Phone, MessageSquare, ChevronDown, Loader2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react'
import type { SmsTemplate } from '@/lib/supabase'

interface Props {
  templates: SmsTemplate[]
}

const MAX_CHARS = 160

export default function SendSmsForm({ templates }: Props) {
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [sender, setSender] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showTemplates, setShowTemplates] = useState(false)
  const templateRef = useRef<HTMLDivElement>(null)

  const charCount = message.length
  const parts = charCount === 0 ? 0 : Math.ceil(charCount / MAX_CHARS)
  const isSpecial = /[^\x00-\x7F@£$¥èéùìòÇØøÅå_^{}\[\]~|ÆæßÉ]/.test(message)
  const effectiveMax = isSpecial ? 70 : 160

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setResult(null)

    if (!phone.trim()) {
      setResult({ type: 'error', text: 'Introduceți numărul de telefon.' })
      return
    }
    if (!message.trim()) {
      setResult({ type: 'error', text: 'Introduceți textul mesajului.' })
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim(), message: message.trim(), sender: sender.trim() || undefined }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setResult({ type: 'success', text: `SMS trimis cu succes! ID: ${data.data?.list?.[0]?.id ?? 'N/A'}` })
        setPhone('')
        setMessage('')
        // Refresh page after 2s
        setTimeout(() => window.location.reload(), 2000)
      } else {
        setResult({ type: 'error', text: data.error ?? 'Eroare la trimitere.' })
      }
    } catch {
      setResult({ type: 'error', text: 'Eroare de rețea. Verificați conexiunea.' })
    } finally {
      setLoading(false)
    }
  }

  function applyTemplate(t: SmsTemplate) {
    setMessage(t.content)
    setShowTemplates(false)
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <Send className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-white font-semibold text-lg">Trimite SMS</h2>
            <p className="text-indigo-200 text-sm">Completați formularul de mai jos</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Număr de telefon <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="07xxxxxxxx sau +407xxxxxxxx"
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-slate-400"
              disabled={loading}
            />
          </div>
          <p className="text-xs text-slate-400 mt-1">Format: 07xxxxxxxx, 40xxxxxxxx sau +40xxxxxxxx</p>
        </div>

        {/* Sender (optional) */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Nume expeditor{' '}
            <span className="text-slate-400 font-normal text-xs">(opțional)</span>
          </label>
          <input
            type="text"
            value={sender}
            onChange={(e) => setSender(e.target.value)}
            placeholder="Test"
            maxLength={11}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-slate-400"
            disabled={loading}
          />
          <p className="text-xs text-slate-400 mt-1">Max 11 caractere. Trebuie verificat în portal SMSAPI.</p>
        </div>

        {/* Message */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-slate-700">
              Mesaj <span className="text-red-500">*</span>
            </label>
            {/* Templates dropdown */}
            {templates.length > 0 && (
              <div className="relative" ref={templateRef}>
                <button
                  type="button"
                  onClick={() => setShowTemplates(!showTemplates)}
                  className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Template-uri <ChevronDown className="w-3 h-3" />
                </button>
                {showTemplates && (
                  <div className="absolute right-0 top-6 z-50 bg-white border border-slate-200 rounded-lg shadow-lg w-64 max-h-48 overflow-y-auto">
                    {templates.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => applyTemplate(t)}
                        className="w-full text-left px-3 py-2.5 hover:bg-slate-50 border-b border-slate-100 last:border-0"
                      >
                        <p className="text-xs font-semibold text-slate-700">{t.name}</p>
                        <p className="text-xs text-slate-500 truncate">{t.content}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="relative">
            <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Scrieți mesajul SMS aici..."
              rows={5}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none placeholder:text-slate-400"
              disabled={loading}
            />
          </div>
          {/* Character counter */}
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-2">
              {isSpecial && (
                <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                  Caractere speciale
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              <span className={charCount > effectiveMax * parts ? 'text-red-500 font-medium' : ''}>
                {charCount}
              </span>
              {' '}/ {effectiveMax * Math.max(1, parts)} car. • {parts > 0 ? parts : 1} SMS
            </p>
          </div>
        </div>

        {/* Result message */}
        {result && (
          <div
            className={`flex items-start gap-2.5 p-3 rounded-lg text-sm ${
              result.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {result.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            )}
            <span>{result.text}</span>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !phone.trim() || !message.trim()}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Se trimite...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Trimite SMS
            </>
          )}
        </button>
      </form>
    </div>
  )
}
