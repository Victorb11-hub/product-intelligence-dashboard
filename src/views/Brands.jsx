import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase.js'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import EmptyState from '../components/EmptyState.jsx'

const THREAT_COLORS = {
  low: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
  medium: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
  high: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
}
const CATEGORIES = ['Supplements', 'Skincare', 'Haircare', 'Personal Care', 'Wellness', 'Beauty Tools', 'Fitness', 'Other']

export default function Brands() {
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // null | 'add' | brand object for edit
  const [catFilter, setCatFilter] = useState('all')
  const [threatFilter, setThreatFilter] = useState('all')

  const load = useCallback(async () => {
    const { data } = await supabase.from('brands').select('*').order('created_at', { ascending: false })
    setBrands(data || []); setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])

  const filtered = useMemo(() => {
    let r = [...brands]
    if (catFilter !== 'all') r = r.filter(b => b.category === catFilter)
    if (threatFilter !== 'all') r = r.filter(b => b.threat_level === threatFilter)
    return r
  }, [brands, catFilter, threatFilter])

  const remove = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return
    await supabase.from('brands').delete().eq('id', id); load()
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">Brands</h1>
          <p className="text-xs text-gray-500 mt-0.5">{filtered.length} brands tracked</p>
        </div>
        <button onClick={() => setModal('add')} className="px-4 py-1.5 bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700">Add Brand</button>
      </div>

      <div className="flex gap-2 mb-4">
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="text-xs border border-gray-300 dark:border-[#1a1a1a] px-3 py-1.5 bg-white dark:bg-[#111] text-gray-900 dark:text-white">
          <option value="all">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={threatFilter} onChange={e => setThreatFilter(e.target.value)} className="text-xs border border-gray-300 dark:border-[#1a1a1a] px-3 py-1.5 bg-white dark:bg-[#111] text-gray-900 dark:text-white">
          <option value="all">All Threat Levels</option>
          <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
        </select>
      </div>

      {filtered.length === 0 ? <EmptyState title="No brands" description="Add brands to track competitors." /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(b => (
            <div key={b.id} className="bg-white dark:bg-[#111] border border-gray-200 dark:border-[#1a1a1a] p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-gray-900 dark:text-white">{b.name}</span>
                <span className={`px-2 py-0.5 text-[10px] font-bold uppercase ${THREAT_COLORS[b.threat_level] || THREAT_COLORS.low}`}>{b.threat_level}</span>
              </div>
              {b.category && <p className="text-[11px] text-gray-500 mb-2">{b.category}</p>}
              <div className="flex gap-3 text-[11px] text-gray-500 mb-2 flex-wrap">
                {b.website && <a href={b.website} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline">Website</a>}
                {b.amazon_url && <a href={b.amazon_url} target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:underline">Amazon</a>}
                {b.instagram_handle && <span>IG: @{b.instagram_handle}</span>}
                {b.tiktok_handle && <span>TT: @{b.tiktok_handle}</span>}
              </div>
              <div className="flex gap-4 text-[11px] text-gray-500 mb-2">
                <span>Reddit: {b.reddit_mentions || 0} mentions</span>
                {b.sentiment_score != null && <span>Sentiment: {b.sentiment_score.toFixed(2)}</span>}
              </div>
              {b.notes && <p className="text-[11px] text-gray-400 border-t border-gray-100 dark:border-[#1a1a1a] pt-2 mt-2">{b.notes}</p>}
              <div className="flex gap-2 mt-3">
                <button onClick={() => setModal(b)} className="text-[11px] text-indigo-500 font-medium">Edit</button>
                <button onClick={() => remove(b.id, b.name)} className="text-[11px] text-red-500 font-medium">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && <BrandModal brand={modal === 'add' ? null : modal} onClose={() => setModal(null)} onSaved={() => { setModal(null); load() }} />}
    </div>
  )
}

function BrandModal({ brand, onClose, onSaved }) {
  const [f, setF] = useState({
    name: brand?.name || '', category: brand?.category || 'Supplements', website: brand?.website || '',
    amazon_url: brand?.amazon_url || '', instagram_handle: brand?.instagram_handle || '',
    tiktok_handle: brand?.tiktok_handle || '', threat_level: brand?.threat_level || 'low',
    notes: brand?.notes || '', active: brand?.active ?? true,
  })
  const [saving, setSaving] = useState(false)

  const save = async (e) => {
    e.preventDefault(); if (!f.name.trim()) return; setSaving(true)
    if (brand) { await supabase.from('brands').update(f).eq('id', brand.id) }
    else { await supabase.from('brands').insert(f) }
    setSaving(false); onSaved()
  }

  const Field = ({ label, field, type = 'text' }) => (
    <div>
      <label className="block text-[11px] font-medium text-gray-500 mb-1">{label}</label>
      <input type={type} value={f[field]} onChange={e => setF(p => ({ ...p, [field]: e.target.value }))}
        className="w-full text-xs border border-gray-300 dark:border-[#1a1a1a] px-3 py-1.5 bg-white dark:bg-[#111] text-gray-900 dark:text-white" />
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-[#1a1a1a] p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-4">{brand ? 'Edit Brand' : 'Add Brand'}</h2>
        <form onSubmit={save} className="space-y-3">
          <Field label="Brand Name" field="name" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-gray-500 mb-1">Category</label>
              <select value={f.category} onChange={e => setF(p => ({ ...p, category: e.target.value }))}
                className="w-full text-xs border border-gray-300 dark:border-[#1a1a1a] px-3 py-1.5 bg-white dark:bg-[#111] text-gray-900 dark:text-white">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-500 mb-1">Threat Level</label>
              <select value={f.threat_level} onChange={e => setF(p => ({ ...p, threat_level: e.target.value }))}
                className="w-full text-xs border border-gray-300 dark:border-[#1a1a1a] px-3 py-1.5 bg-white dark:bg-[#111] text-gray-900 dark:text-white">
                <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
              </select>
            </div>
          </div>
          <Field label="Website URL" field="website" />
          <Field label="Amazon URL" field="amazon_url" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Instagram Handle" field="instagram_handle" />
            <Field label="TikTok Handle" field="tiktok_handle" />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-500 mb-1">Notes</label>
            <textarea value={f.notes} onChange={e => setF(p => ({ ...p, notes: e.target.value }))} rows={2}
              className="w-full text-xs border border-gray-300 dark:border-[#1a1a1a] px-3 py-1.5 bg-white dark:bg-[#111] text-gray-900 dark:text-white resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-1.5 border border-gray-300 dark:border-[#1a1a1a] text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1a1a1a]">Cancel</button>
            <button type="submit" disabled={saving || !f.name.trim()} className="flex-1 px-4 py-1.5 bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
