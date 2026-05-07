'use client'

import { useState } from 'react'
import { Plus, Trash2, ExternalLink, Gift, Loader2, X, ImageOff, Pencil, Check } from 'lucide-react'

export type GiftProduct = {
  id: string
  pnk: string
  title: string
  description: string | null
  price: string | null
  image_url: string | null
  emag_url: string
  created_at: string
  updated_at: string
}

interface Props {
  initialProducts: GiftProduct[]
}

export default function GiftsManager({ initialProducts }: Props) {
  const [products, setProducts] = useState<GiftProduct[]>(initialProducts)
  const [showAdd, setShowAdd] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  // manual override state
  const [showManual, setShowManual] = useState(false)
  const [manualTitle, setManualTitle] = useState('')
  const [manualPrice, setManualPrice] = useState('')
  const [manualImage, setManualImage] = useState('')
  const [manualDesc, setManualDesc] = useState('')
  // edit state
  const [editId, setEditId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editPrice, setEditPrice] = useState('')
  const [editImage, setEditImage] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editSaving, setEditSaving] = useState(false)

  async function addProduct() {
    if (!urlInput.trim()) {
      setError('Introduceți un URL eMAG.')
      return
    }
    setLoading(true)
    setError('')
    setSuccessMsg('')

    const payload: Record<string, string> = { url: urlInput.trim() }
    if (showManual) {
      if (!manualTitle.trim()) { setError('Titlul este obligatoriu.'); setLoading(false); return }
      payload.title = manualTitle.trim()
      payload.price = manualPrice.trim()
      payload.image_url = manualImage.trim()
      payload.description = manualDesc.trim()
    }

    const res = await fetch('/api/gift-products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(json.error || 'Eroare la adăugare.')
      return
    }

    setProducts([json, ...products])
    setUrlInput('')
    setManualTitle('')
    setManualPrice('')
    setManualImage('')
    setManualDesc('')
    setShowAdd(false)
    setShowManual(false)

    // Daca titlul e generic (scraping a esuat), arata un avertisment
    if (!json.title || json.title.startsWith('Produs eMAG (')) {
      setSuccessMsg('Produs adăugat, dar datele nu au putut fi completate automat. Editează manual pentru a adăuga titlu și imagine.')
    } else {
      setSuccessMsg(`"${json.title}" adăugat cu succes!`)
    }
    setTimeout(() => setSuccessMsg(''), 5000)
  }

  async function deleteProduct(id: string, title: string) {
    if (!confirm(`Ștergi "${title}"?`)) return
    const res = await fetch('/api/gift-products', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) {
      setProducts(products.filter((p) => p.id !== id))
    }
  }

  function startEdit(p: GiftProduct) {
    setEditId(p.id)
    setEditTitle(p.title)
    setEditPrice(p.price || '')
    setEditImage(p.image_url || '')
    setEditDesc(p.description || '')
  }

  async function saveEdit(id: string) {
    setEditSaving(true)
    const res = await fetch('/api/gift-products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, title: editTitle, price: editPrice, image_url: editImage, description: editDesc }),
    })
    const json = await res.json()
    setEditSaving(false)
    if (res.ok) {
      setProducts(products.map((p) => (p.id === id ? json : p)))
      setEditId(null)
    }
  }

  return (
    <div className="space-y-5">
      {/* Success/Error messages */}
      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-800 text-sm px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')}><X className="w-4 h-4" /></button>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-sm px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Add form */}
      {showAdd ? (
        <div className="bg-white rounded-xl border border-indigo-200 shadow-sm p-6 space-y-4">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <Plus className="w-4 h-4 text-indigo-600" />
            Adaugă produs nou
          </h3>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Link eMAG <span className="text-slate-400 font-normal">(URL complet sau scurt)</span>
            </label>
            <input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://www.emag.ro/.../pd/XXXXX/"
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-xs text-slate-400 mt-1">
              Datele produsului (titlu, imagine, preț) vor fi completate automat din eMAG.
            </p>
          </div>

          {/* Toggle completare manuala */}
          <button
            type="button"
            onClick={() => setShowManual(!showManual)}
            className="text-xs text-indigo-600 hover:underline"
          >
            {showManual ? '▲ Ascunde completare manuală' : '▼ Completare manuală (dacă scraping-ul eșuează)'}
          </button>

          {showManual && (
            <div className="space-y-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Titlu *</label>
                <input value={manualTitle} onChange={(e) => setManualTitle(e.target.value)}
                  placeholder="Numele produsului"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Preț</label>
                  <input value={manualPrice} onChange={(e) => setManualPrice(e.target.value)}
                    placeholder="ex: 49.99 Lei"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">URL Imagine</label>
                  <input value={manualImage} onChange={(e) => setManualImage(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Descriere</label>
                <textarea value={manualDesc} onChange={(e) => setManualDesc(e.target.value)}
                  rows={2} placeholder="Scurtă descriere..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={addProduct}
              disabled={loading}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {loading ? 'Se procesează...' : 'Adaugă produs'}
            </button>
            <button
              onClick={() => { setShowAdd(false); setError(''); setShowManual(false) }}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-800 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" /> Anulează
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" />
          Adaugă produs cadou
        </button>
      )}

      {/* Products grid */}
      {products.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
          <Gift className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Niciun produs adăugat</p>
          <p className="text-slate-400 text-sm mt-1">Adaugă produse cadou pentru clienți folosind link-uri eMAG.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onDelete={deleteProduct}
              onEdit={startEdit}
              isEditing={editId === p.id}
              editTitle={editTitle}
              editPrice={editPrice}
              editImage={editImage}
              editDesc={editDesc}
              editSaving={editSaving}
              setEditTitle={setEditTitle}
              setEditPrice={setEditPrice}
              setEditImage={setEditImage}
              setEditDesc={setEditDesc}
              onSave={saveEdit}
              onCancel={() => setEditId(null)}
            />
          ))}
        </div>
      )}

      {products.length > 0 && (
        <p className="text-xs text-slate-400 text-right">{products.length} produse</p>
      )}
    </div>
  )
}

// ——— Card component ———
interface CardProps {
  product: GiftProduct
  onDelete: (id: string, title: string) => void
  onEdit: (p: GiftProduct) => void
  isEditing: boolean
  editTitle: string
  editPrice: string
  editImage: string
  editDesc: string
  editSaving: boolean
  setEditTitle: (v: string) => void
  setEditPrice: (v: string) => void
  setEditImage: (v: string) => void
  setEditDesc: (v: string) => void
  onSave: (id: string) => void
  onCancel: () => void
}

function ProductCard({
  product, onDelete, onEdit, isEditing,
  editTitle, editPrice, editImage, editDesc, editSaving,
  setEditTitle, setEditPrice, setEditImage, setEditDesc,
  onSave, onCancel,
}: CardProps) {
  const [imgError, setImgError] = useState(false)
  const emag_link = `https://www.emag.ro/product_details/pd/${product.pnk}`

  if (isEditing) {
    return (
      <div className="bg-white rounded-xl border-2 border-indigo-300 shadow-md p-4 space-y-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Titlu</label>
          <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
            className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Preț</label>
          <input value={editPrice} onChange={(e) => setEditPrice(e.target.value)}
            placeholder="ex: 49.99 Lei"
            className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">URL Imagine</label>
          <input value={editImage} onChange={(e) => setEditImage(e.target.value)}
            placeholder="https://..."
            className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Descriere</label>
          <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)}
            rows={2}
            className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
        </div>
        <div className="flex gap-2">
          <button onClick={() => onSave(product.id)} disabled={editSaving}
            className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-xs font-medium disabled:opacity-50">
            {editSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
            Salvează
          </button>
          <button onClick={onCancel}
            className="flex items-center gap-1 text-slate-500 hover:bg-slate-100 px-3 py-1.5 rounded text-xs font-medium">
            <X className="w-3 h-3" /> Anulează
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow group flex flex-col">
      {/* Image */}
      <div className="relative aspect-square bg-slate-50 overflow-hidden">
        {product.image_url && !imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image_url}
            alt={product.title}
            className="w-full h-full object-contain p-3"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageOff className="w-10 h-10 text-slate-200" />
          </div>
        )}
        {/* Actions overlay */}
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(product)}
            className="p-1.5 bg-white rounded-lg shadow text-slate-400 hover:text-indigo-600 hover:shadow-md transition-all"
            title="Editează"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(product.id, product.title)}
            className="p-1.5 bg-white rounded-lg shadow text-slate-400 hover:text-red-500 hover:shadow-md transition-all"
            title="Șterge"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1 gap-2">
        <p className="text-sm font-semibold text-slate-800 line-clamp-2 leading-tight">
          {product.title}
        </p>
        {product.description && (
          <p className="text-xs text-slate-500 line-clamp-2">{product.description}</p>
        )}
        <div className="mt-auto flex items-center justify-between pt-2">
          {product.price ? (
            <span className="text-base font-bold text-indigo-700">{product.price}</span>
          ) : (
            <span className="text-xs text-slate-400 italic">Preț nedisponibil</span>
          )}
          <a
            href={emag_link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium hover:underline"
          >
            eMAG <ExternalLink className="w-3 h-3" />
          </a>
        </div>
        <div className="text-xs text-slate-300 font-mono">{product.pnk}</div>
      </div>
    </div>
  )
}
