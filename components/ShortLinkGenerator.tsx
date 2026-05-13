'use client'

import { useState } from 'react'
import { Link2, Loader2, Copy, Check, ExternalLink } from 'lucide-react'

interface Props {
  onInsert?: (shortUrl: string) => void
}

export default function ShortLinkGenerator({ onInsert }: Props) {
  const [url, setUrl] = useState('')
  const [alias, setAlias] = useState('')
  const [shortUrl, setShortUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  function buildReviewUrl(input: string): string | null {
    try {
      const u = new URL(input.trim())
      if (!u.hostname.includes('emag.ro')) return null
      if (u.pathname.includes('/review/add')) return input.trim()
      const match = u.pathname.match(/^(\/.*?)\/pd\/([A-Z0-9]+)/i)
      if (!match) return null
      const slug = match[1]
      const pd = match[2]
      return `https://www.emag.ro/product-feedback${slug}/pd/${pd}/review/add?ref=review-box_add-review_btn`
    } catch {
      return null
    }
  }

  async function generate() {
    if (!url.trim()) return
    setLoading(true)
    setError('')
    setShortUrl('')
    try {
      const reviewUrl = buildReviewUrl(url)
      if (!reviewUrl) {
        setError('URL invalid. Introduceți un link de produs eMAG.')
        setLoading(false)
        return
      }
      const res = await fetch('/api/shorten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: reviewUrl, alias: alias.trim() || undefined }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setError(data.error ?? 'Eroare la generare.')
      } else {
        setShortUrl(data.short_url)
      }
    } catch {
      setError('Eroare de rețea.')
    } finally {
      setLoading(false)
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(shortUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      generate()
    }
  }

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Link2 className="w-4 h-4 text-indigo-500" />
        <span className="text-sm font-medium text-slate-700">Generează link recenzie eMAG</span>
      </div>

      {/* URL input */}
      <div className="flex gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => { setUrl(e.target.value); setShortUrl(''); setError('') }}
          onKeyDown={handleKeyDown}
          placeholder="https://www.emag.ro/produs.../pd/XXXXXXX/"
          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white placeholder:text-slate-400"
          disabled={loading}
        />
        <button
          type="button"
          onClick={generate}
          disabled={loading || !url.trim()}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
          {loading ? 'Se generează...' : 'Scurtează'}
        </button>
      </div>

      {/* Alias input */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500 whitespace-nowrap">emagkid.ro/</span>
        <input
          type="text"
          value={alias}
          onChange={(e) => { setAlias(e.target.value); setShortUrl(''); setError('') }}
          placeholder="alias-optional (ex: irigator-bucal)"
          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white placeholder:text-slate-400"
          disabled={loading}
        />
      </div>
      <p className="text-xs text-slate-400 -mt-1">Lasă gol pentru alias generat automat</p>

      {/* Eroare */}
      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* Rezultat */}
      {shortUrl && (
        <div className="flex items-center gap-2 bg-white border border-green-200 rounded-lg px-3 py-2">
          <a
            href={shortUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-sm text-indigo-600 font-mono hover:underline truncate"
          >
            {shortUrl}
          </a>
          <div className="flex items-center gap-1 flex-shrink-0">
            <a
              href={shortUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
              title="Deschide"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              type="button"
              onClick={copy}
              className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
              title="Copiază"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            {onInsert && (
              <button
                type="button"
                onClick={() => onInsert(shortUrl)}
                className="ml-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-md transition-colors"
              >
                Inserează în mesaj
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
