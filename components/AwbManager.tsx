'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Package, Download, Loader2, CheckCircle, AlertCircle, Search, ChevronDown } from 'lucide-react'

interface County {
  id: number
  name: string
}

interface City {
  id: number
  name: string
  extraKM: number
  county: { id: number; name: string }
}

interface AwbEntry {
  id?: string
  awb_number: string
  recipient_name: string
  recipient_phone: string
  recipient_address: string
  county_id?: number
  city_id?: number
  cost?: number | null
  created_at: string
}

const FIELD_CLASS =
  'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white'
const LABEL_CLASS = 'block text-xs font-medium text-slate-600 mb-1'

export default function AwbManager() {
  const [counties, setCounties] = useState<County[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [loadingCounties, setLoadingCounties] = useState(true)
  const [loadingCities, setLoadingCities] = useState(false)
  const [citySearch, setCitySearch] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [awbHistory, setAwbHistory] = useState<AwbEntry[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [downloadingAwb, setDownloadingAwb] = useState<string | null>(null)
  const [historyPage, setHistoryPage] = useState(1)
  const HISTORY_PER_PAGE = 10

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    countyId: '',     // ID din /geolocation/county (pentru filtrare cities)
    countyName: '',
    cityId: '',       // ID real al localității
    cityName: '',
    weight: '1',
  })

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load counties on mount
  useEffect(() => {
    fetch('/api/awb?action=counties')
      .then((r) => r.json())
      .then((data: County[]) => {
        setCounties(Array.isArray(data) ? data.sort((a, b) => a.name.localeCompare(b.name, 'ro')) : [])
      })
      .catch(() => setCounties([]))
      .finally(() => setLoadingCounties(false))
  }, [])

  // Load AWB history from Supabase
  const loadHistory = useCallback(async () => {
    setLoadingHistory(true)
    try {
      const res = await fetch('/api/awb?action=history')
      const data = await res.json()
      if (Array.isArray(data)) setAwbHistory(data)
    } catch {}
    finally { setLoadingHistory(false) }
  }, [])

  useEffect(() => { loadHistory() }, [loadHistory])

  // Search cities — debounced, triggered by countyId or citySearch change
  const fetchCities = useCallback((countyId: string, name: string) => {
    if (!countyId) { setCities([]); return }
    setLoadingCities(true)
    fetch(`/api/awb?action=cities&countyId=${countyId}&name=${encodeURIComponent(name)}`)
      .then((r) => r.json())
      .then((data: City[]) => setCities(Array.isArray(data) ? data : []))
      .catch(() => setCities([]))
      .finally(() => setLoadingCities(false))
  }, [])

  useEffect(() => {
    if (!form.countyId) { setCities([]); return }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchCities(form.countyId, citySearch), 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [form.countyId, citySearch, fetchCities])

  function handleCountyChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value
    const name = counties.find((c) => String(c.id) === id)?.name || ''
    setForm((f) => ({ ...f, countyId: id, countyName: name, cityId: '', cityName: '' }))
    setCities([])
    setCitySearch('')
  }

  function handleCitySelect(city: City) {
    setForm((f) => ({
      ...f,
      cityId: String(city.id),
      cityName: city.name,
    }))
    setCities([])
    setCitySearch('')
  }

  function setField(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setResult(null)

    if (!form.name || !form.phone || !form.address || !form.countyId || !form.cityId) {
      setResult({ ok: false, message: 'Completați toate câmpurile obligatorii.' })
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/awb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          email: form.email || undefined,
          address: form.address,
          countyId: form.countyId,
          cityId: form.cityId,
          weight: Number(form.weight) || 1,
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setResult({ ok: false, message: data.error || 'Eroare la creare AWB.' })
      } else {
        const awbNumber = data.awb || JSON.stringify(data)
        const cost = data.cost ? ` (cost: ${data.cost} RON)` : ''
        setResult({ ok: true, message: `AWB creat: ${awbNumber}${cost}` })

        // Reîncarcă istoricul din Supabase
        await loadHistory()
        setHistoryPage(1)

        setForm({ name: '', phone: '', email: '', address: '', countyId: '', countyName: '', cityId: '', cityName: '', weight: '1' })
        setCitySearch('')
      }
    } catch (err: unknown) {
      setResult({ ok: false, message: (err as Error).message })
    } finally {
      setSubmitting(false)
    }
  }

  async function downloadPdf(awb: string) {
    setDownloadingAwb(awb)
    try {
      const res = await fetch(`/api/awb-pdf?awb=${encodeURIComponent(awb)}`)
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        alert(d.error || 'Eroare la descărcare PDF.')
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `AWB_${awb}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err: unknown) {
      alert((err as Error).message)
    } finally {
      setDownloadingAwb(null)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Package className="w-6 h-6 text-indigo-600" />
          Creare AWB SameDay
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Generează etichete de livrare pentru cadourile eMag KidGPS
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Form */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-base font-semibold text-slate-800 mb-5">Date destinatar</h2>
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Name + Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={LABEL_CLASS}>Nume complet *</label>
                  <input
                    type="text"
                    className={FIELD_CLASS}
                    placeholder="Ion Popescu"
                    value={form.name}
         onChange={(e) => setField('name', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Telefon *</label>
                  <input
                    type="tel"
                    className={FIELD_CLASS}
                    placeholder="07xxxxxxxx"
                    value={form.phone}
                    onChange={(e) => setField('phone', e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className={LABEL_CLASS}>Email (opțional)</label>
                <input
                  type="email"
                  className={FIELD_CLASS}
                  placeholder="email@exemplu.ro"
                  value={form.email}
                  onChange={(e) => setField('email', e.target.value)}
                />
              </div>

              {/* Address */}
              <div>
                <label className={LABEL_CLASS}>Adresă *</label>
                <input
                  type="text"
                  className={FIELD_CLASS}
                  placeholder="Str. Exemplu nr. 1, bl. A, ap. 2"
                  value={form.address}
                  onChange={(e) => setField('address', e.target.value)}
                  required
                />
              </div>

              {/* County dropdown */}
              <div>
                <label className={LABEL_CLASS}>Județ *</label>
                <div className="relative">
                  <select
                    className={`${FIELD_CLASS} appearance-none pr-8`}
                    value={form.countyId}
                    onChange={handleCountyChange}
                    required
                    disabled={loadingCounties}
                  >
                    <option value="">
                      {loadingCounties ? 'Se încarcă județele...' : '— Selectează județ —'}
                    </option>
                    {counties.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* City — shown only after county selected */}
              {form.countyId && (
                <div>
                  <label className={LABEL_CLASS}>Localitate *</label>
                  {form.cityId ? (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-lg text-sm text-indigo-800 font-medium">
                        {form.cityName}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setForm((f) => ({ ...f, cityId: '', cityName: '' }))
                          setCitySearch('')
                        }}
                        className="px-3 py-2 text-xs text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50"
                      >
                        Schimbă
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          className={`${FIELD_CLASS} pl-9`}
                          placeholder="Caută localitate..."
                          value={citySearch}
                          onChange={(e) => setCitySearch(e.target.value)}
                          autoFocus
                        />
                        {loadingCities && (
                          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />
                        )}
                      </div>
                      {cities.length > 0 && (
                        <div className="border border-slate-200 rounded-lg overflow-hidden max-h-52 overflow-y-auto shadow-sm">
                          {cities.map((city) => (
                            <button
                              key={city.id}
                              type="button"
                              onClick={() => handleCitySelect(city)}
                              className="w-full text-left px-3 py-2.5 text-sm hover:bg-indigo-50 hover:text-indigo-700 border-b border-slate-100 last:border-0 transition-colors"
                            >
                              {city.name}
                              {city.extraKM > 0 && (
                                <span className="ml-2 text-xs text-slate-400">+{city.extraKM} km</span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                      {!loadingCities && form.countyId && cities.length === 0 && (
                        <p className="text-xs text-slate-400 px-1">
                          {citySearch ? 'Nicio localitate găsită.' : 'Se încarcă localitățile...'}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Weight */}
              <div className="w-36">
                <label className={LABEL_CLASS}>Greutate (kg)</label>
                <input
                  type="number"
                  min="0.1"
                  max="30"
                  step="0.1"
                  className={FIELD_CLASS}
                  value={form.weight}
                  onChange={(e) => setField('weight', e.target.value)}
                />
              </div>

              {/* Info box */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-xs text-slate-500 space-y-0.5">
                <div><span className="font-medium text-slate-600">Descriere colet:</span> Cadou eMag KidGPS</div>
                <div><span className="font-medium text-slate-600">Ramburs:</span> 0 RON</div>
                <div><span className="font-medium text-slate-600">Serviciu:</span> SameDay Standard</div>
              </div>

              {/* Result */}
              {result && (
                <div
                  className={`flex items-start gap-2 px-4 py-3 rounded-lg text-sm ${
                    result.ok
                      ? 'bg-green-50 border border-green-200 text-green-800'
                      : 'bg-red-50 border border-red-200 text-red-800'
                  }`}
                >
                  {result.ok ? (
                    <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  )}
                  <span>{result.message}</span>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting || !form.cityId}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Se creează AWB...
                  </>
                ) : (
                  <>
                    <Package className="w-4 h-4" />
                    Creează AWB
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* History */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-base font-semibold text-slate-800 mb-4">
              AWB-uri create
              {awbHistory.length > 0 && (
                <span className="ml-2 text-xs font-normal text-slate-400">({awbHistory.length})</span>
              )}
            </h2>
            {loadingHistory ? (
              <div className="text-center py-10 text-slate-400">
                <Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin opacity-40" />
                <p className="text-sm">Se încarcă...</p>
              </div>
            ) : awbHistory.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Niciun AWB creat încă</p>
              </div>
            ) : (() => {
              const totalPages = Math.ceil(awbHistory.length / HISTORY_PER_PAGE)
              const pageEntries = awbHistory.slice(
                (historyPage - 1) * HISTORY_PER_PAGE,
                historyPage * HISTORY_PER_PAGE
              )
              return (
                <div className="space-y-3">
                  {pageEntries.map((entry) => (
                    <div
                      key={entry.id || entry.awb_number + entry.created_at}
                      className="border border-slate-200 rounded-lg p-3 hover:border-indigo-200 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{entry.recipient_name}</p>
                          <p className="text-xs text-slate-500 truncate">{entry.recipient_phone}</p>
                          <p className="text-xs text-slate-400 truncate mt-0.5">{entry.recipient_address}</p>
                          <p className="text-xs font-mono text-indigo-600 mt-1">{entry.awb_number}</p>
                          {entry.cost != null && (
                            <p className="text-xs text-slate-400 mt-0.5">Cost: {entry.cost} RON</p>
                          )}
                          <p className="text-xs text-slate-300 mt-0.5">
                            {new Date(entry.created_at).toLocaleString('ro-RO')}
                          </p>
                        </div>
                        <button
                          onClick={() => downloadPdf(entry.awb_number)}
                          disabled={downloadingAwb === entry.awb_number}
                          className="shrink-0 p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Descarcă PDF"
                        >
                          {downloadingAwb === entry.awb_number ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <button
                        onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                        disabled={historyPage === 1}
                        className="px-3 py-1.5 text-xs text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        ← Anterior
                      </button>
                      <span className="text-xs text-slate-400">
                        {historyPage} / {totalPages}
                      </span>
                      <button
                        onClick={() => setHistoryPage((p) => Math.min(totalPages, p + 1))}
                        disabled={historyPage === totalPages}
                        className="px-3 py-1.5 text-xs text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Următor →
                      </button>
                    </div>
                  )}
                </div>
              )
            })()}
          </div>
        </div>
      </div>
    </div>
  )
}
