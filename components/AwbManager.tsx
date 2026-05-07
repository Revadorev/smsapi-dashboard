'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Package, Download, Loader2, CheckCircle, AlertCircle, Search } from 'lucide-react'

interface City {
  id: number
  name: string
  extraKm: number
  county: { id: number; name: string }
}

interface AwbEntry {
  awb: string
  name: string
  phone: string
  address: string
  county: string
  city: string
  createdAt: string
}

const FIELD_CLASS =
  'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white'
const LABEL_CLASS = 'block text-xs font-medium text-slate-600 mb-1'

export default function AwbManager() {
  const [cities, setCities] = useState<City[]>([])
  const [citySearch, setCitySearch] = useState('')
  const [loadingCities, setLoadingCities] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [awbHistory, setAwbHistory] = useState<AwbEntry[]>([])
  const [downloadingAwb, setDownloadingAwb] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    cityId: '',
    cityName: '',
    countyId: '',   // city.county.id — ID real pentru AWB payload
    countyName: '',
    weight: '1',
  })

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load AWB history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('awb_history')
      if (stored) setAwbHistory(JSON.parse(stored))
    } catch {}
  }, [])

  // Search cities with debounce
  const searchCities = useCallback((name: string) => {
    if (name.length < 2) {
      setCities([])
      return
    }
    setLoadingCities(true)
    fetch(`/api/awb?action=cities&name=${encodeURIComponent(name)}`)
      .then((r) => r.json())
      .then((data: City[]) => setCities(Array.isArray(data) ? data.slice(0, 20) : []))
      .catch(() => setCities([]))
      .finally(() => setLoadingCities(false))
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => searchCities(citySearch), 350)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [citySearch, searchCities])

  function handleCitySelect(city: City) {
    setForm((f) => ({
      ...f,
      cityId: String(city.id),
      cityName: city.name,
      countyId: String(city.county?.id ?? ''),
      countyName: city.county?.name ?? '',
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

    if (!form.name || !form.phone || !form.address || !form.cityId) {
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

        const entry: AwbEntry = {
          awb: awbNumber,
          name: form.name,
          phone: form.phone,
          address: form.address,
          county: form.countyName,
          city: form.cityName,
          createdAt: new Date().toISOString(),
        }
        const updated = [entry, ...awbHistory].slice(0, 50)
        setAwbHistory(updated)
        try { localStorage.setItem('awb_history', JSON.stringify(updated)) } catch {}

        setForm({ name: '', phone: '', email: '', address: '', cityId: '', cityName: '', countyId: '', countyName: '', weight: '1' })
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

              {/* City search */}
              <div>
                <label className={LABEL_CLASS}>Localitate *</label>
                {form.cityId ? (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-lg text-sm text-indigo-800 font-medium">
                      {form.cityName}
                      {form.countyName && (
                        <span className="ml-2 text-xs text-indigo-500 font-normal">({form.countyName})</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setForm((f) => ({ ...f, cityId: '', cityName: '', countyId: '', countyName: '' }))
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
                        placeholder="Caută localitate (ex: Cluj, Iași, Brașov...)"
                        value={citySearch}
                        onChange={(e) => setCitySearch(e.target.value)}
                      />
                      {loadingCities && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />
                      )}
                    </div>
                    {citySearch.length > 0 && citySearch.length < 2 && (
                      <p className="text-xs text-slate-400 px-1">Scrie cel puțin 2 caractere...</p>
                    )}
                    {cities.length > 0 && (
                      <div className="border border-slate-200 rounded-lg overflow-hidden max-h-52 overflow-y-auto shadow-sm">
                        {cities.map((city) => (
                          <button
                            key={city.id}
                            type="button"
                            onClick={() => handleCitySelect(city)}
                            className="w-full text-left px-3 py-2.5 text-sm hover:bg-indigo-50 hover:text-indigo-700 border-b border-slate-100 last:border-0 transition-colors flex items-center justify-between"
                          >
                            <span className="font-medium">{city.name}</span>
                            <span className="text-xs text-slate-400 ml-2 shrink-0">{city.county?.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {!loadingCities && citySearch.length >= 2 && cities.length === 0 && (
                      <p className="text-xs text-slate-400 px-1">Nicio localitate găsită.</p>
                    )}
                  </div>
                )}
              </div>

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
            {awbHistory.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Niciun AWB creat încă</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                {awbHistory.map((entry) => (
                  <div
                    key={entry.awb + entry.createdAt}
                    className="border border-slate-200 rounded-lg p-3 hover:border-indigo-200 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{entry.name}</p>
                        <p className="text-xs text-slate-500 truncate">{entry.phone}</p>
                        <p className="text-xs text-slate-400 truncate mt-0.5">
                          {entry.city}{entry.county ? `, ${entry.county}` : ''}
                        </p>
                        <p className="text-xs font-mono text-indigo-600 mt-1">{entry.awb}</p>
                        <p className="text-xs text-slate-300 mt-0.5">
                          {new Date(entry.createdAt).toLocaleString('ro-RO')}
                        </p>
                      </div>
                      <button
                        onClick={() => downloadPdf(entry.awb)}
                        disabled={downloadingAwb === entry.awb}
                        className="shrink-0 p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Descarcă PDF"
                      >
                        {downloadingAwb === entry.awb ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
