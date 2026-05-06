'use client'

import { useState } from 'react'
import { Plus, Trash2, Pencil, Save, X, FileText } from 'lucide-react'
import type { SmsTemplate } from '@/lib/supabase'
import { getBrowserClient } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'

interface Props {
  templates: SmsTemplate[]
}

export default function TemplatesManager({ templates: initialTemplates }: Props) {
  const [templates, setTemplates] = useState<SmsTemplate[]>(initialTemplates)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newContent, setNewContent] = useState('')
  const [editName, setEditName] = useState('')
  const [editContent, setEditContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function addTemplate() {
    if (!newName.trim() || !newContent.trim()) {
      setError('Completați toate câmpurile.')
      return
    }
    setSaving(true)
    setError('')
    const { data, error: err } = await getBrowserClient()
      .from('sms_templates')
      .insert({ name: newName.trim(), content: newContent.trim() })
      .select()
      .single()
    setSaving(false)
    if (err) {
      setError(err.message)
      return
    }
    setTemplates([...templates, data])
    setNewName('')
    setNewContent('')
    setShowAdd(false)
  }

  async function saveEdit(id: string) {
    if (!editName.trim() || !editContent.trim()) {
      setError('Completați toate câmpurile.')
      return
    }
    setSaving(true)
    setError('')
    const { data, error: err } = await getBrowserClient()
      .from('sms_templates')
      .update({ name: editName.trim(), content: editContent.trim() })
      .eq('id', id)
      .select()
      .single()
    setSaving(false)
    if (err) {
      setError(err.message)
      return
    }
    setTemplates(templates.map((t) => (t.id === id ? data : t)))
    setEditingId(null)
  }

  async function deleteTemplate(id: string) {
    if (!confirm('Sigur doriți să ștergeți acest template?')) return
    const { error: err } = await getBrowserClient().from('sms_templates').delete().eq('id', id)
    if (err) {
      setError(err.message)
      return
    }
    setTemplates(templates.filter((t) => t.id !== id))
  }

  function startEdit(t: SmsTemplate) {
    setEditingId(t.id)
    setEditName(t.name)
    setEditContent(t.content)
    setError('')
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Add new template */}
      {showAdd ? (
        <div className="bg-white rounded-xl border border-indigo-200 shadow-sm p-6 space-y-4">
          <h3 className="font-semibold text-slate-800">Template nou</h3>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nume template</label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ex: Confirmare comandă"
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Conținut mesaj</label>
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Conținutul mesajului SMS..."
              rows={4}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={addTemplate}
              disabled={saving}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Se salvează...' : 'Salvează'}
            </button>
            <button
              onClick={() => { setShowAdd(false); setError('') }}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-800 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
              Anulează
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" />
          Adaugă template nou
        </button>
      )}

      {/* Templates list */}
      {templates.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Niciun template salvat</p>
          <p className="text-slate-400 text-sm mt-1">Adăugați un template pentru mesaje frecvente.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map((t) => (
            <div key={t.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              {editingId === t.id ? (
                <div className="p-5 space-y-3">
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveEdit(t.id)}
                      disabled={saving}
                      className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Salvează
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="flex items-center gap-1.5 text-slate-600 hover:bg-slate-100 px-3 py-1.5 rounded-lg text-xs font-medium"
                    >
                      <X className="w-3.5 h-3.5" />
                      Anulează
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-5 flex items-start gap-4">
                  <div className="w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800">{t.name}</p>
                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">{t.content}</p>
                    <p className="text-xs text-slate-400 mt-2">{formatDate(t.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => startEdit(t)}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Editează"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteTemplate(t.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Șterge"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
