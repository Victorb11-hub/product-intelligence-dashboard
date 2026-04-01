import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase.js'
import { agentApi } from '../lib/agentApi.js'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import EmptyState from '../components/EmptyState.jsx'

const CATEGORIES = ['Supplements', 'Skincare', 'Haircare', 'Personal Care', 'Wellness', 'Beauty Tools', 'Fitness', 'Other']

const PLATFORM_META = {
  reddit:        { label: 'Reddit',        category: 'Social',    color: 'bg-orange-500',  source: 'Apify',    status: 'live',    cost: '$0.50/1K + $3.80/1K comments', signal: 'signals_social' },
  tiktok:        { label: 'TikTok',        category: 'Social',    color: 'bg-pink-500',    source: 'Apify',    status: 'ready',   cost: '$0.50/1K',    signal: 'signals_social' },
  instagram:     { label: 'Instagram',     category: 'Social',    color: 'bg-purple-500',  source: 'Apify',    status: 'ready',   cost: '$0.50/1K',    signal: 'signals_social' },
  x:             { label: 'X',             category: 'Social',    color: 'bg-gray-800',    source: 'X API v2', status: 'pending',  cost: 'Free tier',   signal: 'signals_social' },
  facebook:      { label: 'Facebook',      category: 'Social',    color: 'bg-blue-600',    source: 'Apify',    status: 'ready',   cost: '$0.50/1K',    signal: 'signals_social' },
  youtube:       { label: 'YouTube',       category: 'Social',    color: 'bg-red-600',     source: 'YouTube API', status: 'pending', cost: 'Free tier', signal: 'signals_social' },
  google_trends: { label: 'Google Trends', category: 'Search',    color: 'bg-green-600',   source: 'PyTrends', status: 'live',    cost: 'Free',        signal: 'signals_search' },
  amazon:        { label: 'Amazon',        category: 'Retail',    color: 'bg-amber-600',   source: 'Apify',    status: 'ready',   cost: '$0.50/1K',    signal: 'signals_retail' },
  walmart:       { label: 'Walmart',       category: 'Retail',    color: 'bg-blue-500',    source: 'Apify',    status: 'ready',   cost: '$0.50/1K',    signal: 'signals_retail' },
  etsy:          { label: 'Etsy',          category: 'Retail',    color: 'bg-orange-400',  source: 'Apify',    status: 'ready',   cost: '$0.50/1K',    signal: 'signals_retail' },
  alibaba:       { label: 'Alibaba',       category: 'Supply',    color: 'bg-yellow-600',  source: 'Apify',    status: 'ready',   cost: '$0.50/1K',    signal: 'signals_supply' },
  pinterest:     { label: 'Pinterest',     category: 'Discovery', color: 'bg-red-500',     source: 'Apify',    status: 'ready',   cost: '$0.50/1K',    signal: 'signals_discovery' },
}

const STATUS_BADGE = {
  live:    { label: 'LIVE',    bg: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' },
  ready:   { label: 'READY',   bg: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' },
  pending: { label: 'PENDING', bg: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' },
}

export default function ProductsScheduling() {
  const [activeSection, setActiveSection] = useState('products')

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Products & Scheduling</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage products, agent schedules, and run history</p>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 w-fit">
        {[
          { id: 'products', label: 'Products' },
          { id: 'schedules', label: 'Agent Schedules' },
          { id: 'history', label: 'Run History' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeSection === tab.id
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeSection === 'products' && <ProductManagement />}
      {activeSection === 'schedules' && <AgentSchedules />}
      {activeSection === 'history' && <RunHistory />}
    </div>
  )
}

// ============================================================
// SECTION 1 — Product Management
// ============================================================
function ProductManagement() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showCsvImport, setShowCsvImport] = useState(false)

  const loadProducts = useCallback(async () => {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false })
    setProducts(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { loadProducts() }, [loadProducts])

  // Realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('products-manage')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => loadProducts())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [loadProducts])

  if (loading) return <LoadingSpinner message="Loading products..." />

  return (
    <div className="space-y-6">
      {/* Action buttons */}
      <div className="flex gap-3">
        <button onClick={() => setShowAddForm(!showAddForm)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
          {showAddForm ? 'Cancel' : 'Add Product'}
        </button>
        <button onClick={() => setShowCsvImport(!showCsvImport)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
          {showCsvImport ? 'Cancel' : 'CSV Import'}
        </button>
        <a
          href={`data:text/csv;charset=utf-8,name,category,keywords,subreddits\nExample Product,Supplements,"keyword1,keyword2","supplements,Nootropics"`}
          download="product_template.csv"
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center"
        >
          Download CSV Template
        </a>
      </div>

      {/* Add Form */}
      {showAddForm && <AddProductForm onSuccess={() => { setShowAddForm(false); loadProducts() }} />}

      {/* CSV Import */}
      {showCsvImport && <CsvImport onSuccess={() => { setShowCsvImport(false); loadProducts() }} />}

      {/* Products Table */}
      {products.length === 0 ? (
        <EmptyState title="No products" description="Add your first product to start tracking." />
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Category</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Keywords</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Active</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Score</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Verdict</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Added</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <ProductRow key={p.id} product={p} onUpdate={loadProducts} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function ProductRow({ product, onUpdate }) {
  const [showEdit, setShowEdit] = useState(false)

  const toggleActive = async () => {
    await supabase.from('products').update({ active: !product.active }).eq('id', product.id)
    onUpdate()
  }

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return
    await supabase.from('products').delete().eq('id', product.id)
    onUpdate()
  }

  const keywords = Array.isArray(product.keywords) ? product.keywords : []

  return (
    <>
      <tr className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{product.name}</td>
        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{product.category}</td>
        <td className="px-4 py-3">
          <div className="flex flex-wrap gap-1">
            {keywords.slice(0, 4).map((k, i) => (
              <span key={i} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs rounded-full">{k}</span>
            ))}
            {keywords.length > 4 && <span className="text-xs text-gray-400">+{keywords.length - 4}</span>}
          </div>
        </td>
        <td className="px-4 py-3 text-center">
          <button onClick={toggleActive} className={`w-10 h-5 rounded-full transition-colors relative ${product.active ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${product.active ? 'left-5' : 'left-0.5'}`} />
          </button>
        </td>
        <td className="px-4 py-3 text-right tabular-nums">
          <span className={product.current_score >= 75 ? 'text-emerald-600' : product.current_score >= 55 ? 'text-amber-600' : 'text-red-600'}>
            {product.current_score?.toFixed(1) || '—'}
          </span>
        </td>
        <td className="px-4 py-3">
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold uppercase ${
            product.current_verdict === 'buy' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' :
            product.current_verdict === 'watch' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' :
            'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
          }`}>{product.current_verdict}</span>
        </td>
        <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{new Date(product.created_at).toLocaleDateString()}</td>
        <td className="px-4 py-3 text-center">
          <div className="flex items-center justify-center gap-2">
            <button onClick={() => setShowEdit(true)} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 text-sm font-medium">Edit</button>
            <button onClick={handleDelete} className="text-red-500 hover:text-red-700 text-sm">Delete</button>
          </div>
        </td>
      </tr>
      {showEdit && <EditProductModal product={product} onClose={() => setShowEdit(false)} onSaved={() => { setShowEdit(false); onUpdate() }} />}
    </>
  )
}

function EditProductModal({ product, onClose, onSaved }) {
  const [name, setName] = useState(product.name || '')
  const [category, setCategory] = useState(product.category || 'Supplements')
  const [keywords, setKeywords] = useState(Array.isArray(product.keywords) ? [...product.keywords] : [])
  const [subreddits, setSubreddits] = useState(Array.isArray(product.target_subreddits) ? [...product.target_subreddits] : [])
  const [active, setActive] = useState(product.active)
  const [keywordInput, setKeywordInput] = useState('')
  const [subInput, setSubInput] = useState('')
  const [saving, setSaving] = useState(false)

  const addKeyword = (e) => {
    if (e.key === 'Enter' && keywordInput.trim()) {
      e.preventDefault()
      if (!keywords.includes(keywordInput.trim())) {
        setKeywords([...keywords, keywordInput.trim()])
      }
      setKeywordInput('')
    }
  }

  const addSubreddit = (e) => {
    if (e.key === 'Enter' && subInput.trim()) {
      e.preventDefault()
      if (!subreddits.includes(subInput.trim())) {
        setSubreddits([...subreddits, subInput.trim()])
      }
      setSubInput('')
    }
  }

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    await supabase.from('products').update({
      name: name.trim(),
      category,
      keywords,
      target_subreddits: subreddits,
      active,
    }).eq('id', product.id)
    setSaving(false)
    onSaved()
  }

  return (
    <tr>
      <td colSpan={8} className="p-0">
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Edit Product</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Product Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)} className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Keywords (press Enter to add)</label>
                <input type="text" value={keywordInput} onChange={e => setKeywordInput(e.target.value)} onKeyDown={addKeyword} className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" placeholder="Type keyword and press Enter" />
                <div className="flex flex-wrap gap-1 mt-2">
                  {keywords.map((k, i) => (
                    <span key={i} className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs rounded-full flex items-center gap-1">
                      {k}
                      <button type="button" onClick={() => setKeywords(keywords.filter((_, j) => j !== i))} className="hover:text-red-500 text-sm leading-none">&times;</button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Target Subreddits (press Enter to add)</label>
                <input type="text" value={subInput} onChange={e => setSubInput(e.target.value)} onKeyDown={addSubreddit} className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" placeholder="e.g., supplements" />
                <div className="flex flex-wrap gap-1 mt-2">
                  {subreddits.map((s, i) => (
                    <span key={i} className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs rounded-full flex items-center gap-1">
                      r/{s}
                      <button type="button" onClick={() => setSubreddits(subreddits.filter((_, j) => j !== i))} className="hover:text-red-500 text-sm leading-none">&times;</button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Active</label>
                <button onClick={() => setActive(!active)} className={`w-10 h-5 rounded-full transition-colors relative ${active ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${active ? 'left-5' : 'left-0.5'}`} />
                </button>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">Cancel</button>
                <button onClick={handleSave} disabled={saving || !name.trim()} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </td>
    </tr>
  )
}

function AddProductForm({ onSuccess }) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('Supplements')
  const [keywordInput, setKeywordInput] = useState('')
  const [keywords, setKeywords] = useState([])
  const [subInput, setSubInput] = useState('')
  const [subreddits, setSubreddits] = useState([])
  const [saving, setSaving] = useState(false)

  const addKeyword = (e) => {
    if (e.key === 'Enter' && keywordInput.trim()) {
      e.preventDefault()
      setKeywords([...keywords, keywordInput.trim()])
      setKeywordInput('')
    }
  }

  const addSubreddit = (e) => {
    if (e.key === 'Enter' && subInput.trim()) {
      e.preventDefault()
      setSubreddits([...subreddits, subInput.trim()])
      setSubInput('')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    await supabase.from('products').insert({
      name: name.trim(),
      category,
      keywords,
      target_subreddits: subreddits,
      active: true,
    })
    setSaving(false)
    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
      <h3 className="text-sm font-bold text-gray-900 dark:text-white">Add New Product</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Product Name</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" placeholder="e.g., Sea Moss Gel" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Category</label>
          <select value={category} onChange={e => setCategory(e.target.value)} className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Keywords (press Enter to add)</label>
        <input type="text" value={keywordInput} onChange={e => setKeywordInput(e.target.value)} onKeyDown={addKeyword} className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" placeholder="Type keyword and press Enter" />
        <div className="flex flex-wrap gap-1 mt-2">
          {keywords.map((k, i) => (
            <span key={i} className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs rounded-full flex items-center gap-1">
              {k}
              <button type="button" onClick={() => setKeywords(keywords.filter((_, j) => j !== i))} className="hover:text-red-500">×</button>
            </span>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Target Subreddits (press Enter to add)</label>
        <input type="text" value={subInput} onChange={e => setSubInput(e.target.value)} onKeyDown={addSubreddit} className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" placeholder="e.g., supplements" />
        <div className="flex flex-wrap gap-1 mt-2">
          {subreddits.map((s, i) => (
            <span key={i} className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs rounded-full flex items-center gap-1">
              r/{s}
              <button type="button" onClick={() => setSubreddits(subreddits.filter((_, j) => j !== i))} className="hover:text-red-500">×</button>
            </span>
          ))}
        </div>
      </div>

      <button type="submit" disabled={saving || !name.trim()} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
        {saving ? 'Adding...' : 'Add Product'}
      </button>
    </form>
  )
}

function CsvImport({ onSuccess }) {
  const [rows, setRows] = useState([])
  const [importing, setImporting] = useState(false)
  const fileRef = useRef()

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      const text = evt.target.result
      const lines = text.split('\n').filter(l => l.trim())
      if (lines.length < 2) return

      const parsed = lines.slice(1).map(line => {
        // Simple CSV parse (handles quoted fields)
        const cols = line.match(/(".*?"|[^,]+)/g)?.map(c => c.replace(/^"|"$/g, '').trim()) || []
        return {
          name: cols[0] || '',
          category: cols[1] || 'Supplements',
          keywords: cols[2] ? cols[2].split(',').map(k => k.trim()) : [],
          subreddits: cols[3] ? cols[3].split(',').map(s => s.trim()) : [],
        }
      }).filter(r => r.name)

      setRows(parsed)
    }
    reader.readAsText(file)
  }

  const handleImport = async () => {
    setImporting(true)
    const toInsert = rows.map(r => ({
      name: r.name,
      category: r.category,
      keywords: r.keywords,
      target_subreddits: r.subreddits,
      active: true,
    }))
    await supabase.from('products').insert(toInsert)
    setImporting(false)
    onSuccess()
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
      <h3 className="text-sm font-bold text-gray-900 dark:text-white">CSV Import</h3>
      <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="text-sm text-gray-600 dark:text-gray-400" />

      {rows.length > 0 && (
        <>
          <div className="overflow-x-auto max-h-60">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left px-3 py-2">Name</th>
                  <th className="text-left px-3 py-2">Category</th>
                  <th className="text-left px-3 py-2">Keywords</th>
                  <th className="text-left px-3 py-2">Subreddits</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="px-3 py-2">{r.name}</td>
                    <td className="px-3 py-2">{r.category}</td>
                    <td className="px-3 py-2">{r.keywords.join(', ')}</td>
                    <td className="px-3 py-2">{r.subreddits.join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={handleImport} disabled={importing} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
            {importing ? 'Importing...' : `Import ${rows.length} Products`}
          </button>
        </>
      )}
    </div>
  )
}

// ============================================================
// SECTION 2 — Agent Schedule Control
// ============================================================
function AgentSchedules() {
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)
  const [runningAll, setRunningAll] = useState(false)
  const [schedStatus, setSchedStatus] = useState({ active: true, next_run: 'Loading...', state: 'active' })
  const [toggling, setToggling] = useState(false)

  const loadSchedules = useCallback(async () => {
    const { data } = await supabase.from('schedules').select('*').order('run_time')
    setSchedules(data || [])
    setLoading(false)
  }, [])

  const loadSchedulerStatus = useCallback(async () => {
    try {
      const data = await agentApi.healthCheck().catch(() => null)
      if (!data) { setSchedStatus({ active: false, next_run: 'Agent server not running', state: 'stopped' }); return }
      const resp = await fetch('http://localhost:8000/scheduler/status')
      if (resp.ok) setSchedStatus(await resp.json())
    } catch { setSchedStatus(prev => prev) }
  }, [])

  useEffect(() => { loadSchedules(); loadSchedulerStatus() }, [loadSchedules, loadSchedulerStatus])
  useEffect(() => { const i = setInterval(loadSchedulerStatus, 15000); return () => clearInterval(i) }, [loadSchedulerStatus])

  useEffect(() => {
    const channel = supabase
      .channel('schedules-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'schedules' }, () => loadSchedules())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [loadSchedules])

  const handleRunAll = async () => {
    setRunningAll(true)
    try { await agentApi.runAll() } catch (e) { console.error('Run all failed:', e) }
    setTimeout(() => setRunningAll(false), 3000)
  }

  const toggleScheduler = async () => {
    setToggling(true)
    try {
      const endpoint = schedStatus.active ? '/scheduler/pause' : '/scheduler/resume'
      const resp = await fetch(`http://localhost:8000${endpoint}`, { method: 'POST' })
      if (resp.ok) await loadSchedulerStatus()
    } catch (e) { console.error('Toggle failed:', e) }
    setToggling(false)
  }

  if (loading) return <LoadingSpinner message="Loading schedules..." />

  return (
    <div className="space-y-4">
      {/* Schedule Status Card */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-3 h-3 rounded-full ${schedStatus.state === 'active' ? 'bg-emerald-500 animate-pulse' : schedStatus.state === 'paused' ? 'bg-amber-500' : 'bg-gray-400'}`} />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-900 dark:text-white">Nightly Pipeline</span>
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                schedStatus.state === 'active' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' :
                schedStatus.state === 'paused' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' :
                'bg-gray-100 dark:bg-gray-800 text-gray-500'
              }`}>{schedStatus.state}</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{schedStatus.next_run}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={toggleScheduler} disabled={toggling || schedStatus.state === 'stopped'}
            className={`w-12 h-6 rounded-full transition-colors relative ${schedStatus.active ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'} ${schedStatus.state === 'stopped' ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${schedStatus.active ? 'left-7' : 'left-1'}`} />
          </button>
          <button onClick={handleRunAll} disabled={runningAll} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 disabled:opacity-50">
            {runningAll ? 'Starting...' : 'Run Now'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {schedules.map(schedule => (
          <AgentCard key={schedule.id} schedule={schedule} onUpdate={loadSchedules} />
        ))}
      </div>
    </div>
  )
}

function AgentCard({ schedule, onUpdate }) {
  const [running, setRunning] = useState(false)
  const meta = PLATFORM_META[schedule.platform] || { label: schedule.platform, category: '?', color: 'bg-gray-500' }

  const toggleEnabled = async () => {
    await supabase.from('schedules').update({ enabled: !schedule.enabled }).eq('id', schedule.id)
    onUpdate()
  }

  const updateField = async (field, value) => {
    await supabase.from('schedules').update({ [field]: value }).eq('id', schedule.id)
    onUpdate()
  }

  const triggerRun = async () => {
    setRunning(true)
    try {
      await agentApi.runSingle(schedule.platform)
    } catch (e) {
      console.error(`Failed to trigger ${schedule.platform}:`, e)
    }
    setTimeout(() => setRunning(false), 3000)
  }

  const statusBadge = STATUS_BADGE[meta.status] || STATUS_BADGE.pending

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 ${!schedule.enabled ? 'opacity-50' : ''}`}>
      {/* Header: name + category + status */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${meta.status === 'live' ? 'bg-emerald-500' : meta.status === 'ready' ? 'bg-blue-400' : 'bg-gray-400'}`} />
          <span className="text-sm font-bold text-gray-900 dark:text-white">{meta.label}</span>
        </div>
        <button onClick={toggleEnabled} className={`w-10 h-5 rounded-full transition-colors relative ${schedule.enabled ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${schedule.enabled ? 'left-5' : 'left-0.5'}`} />
        </button>
      </div>

      {/* Badges row */}
      <div className="flex items-center gap-1.5 mb-3">
        <span className={`px-2 py-0.5 text-[10px] font-medium text-white rounded-full ${meta.color}`}>{meta.category}</span>
        <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${statusBadge.bg}`}>{statusBadge.label}</span>
      </div>

      {/* Info grid */}
      <div className="space-y-1.5 text-xs mb-3">
        <div className="flex justify-between">
          <span className="text-gray-500 dark:text-gray-400">Source</span>
          <span className="text-gray-700 dark:text-gray-300 font-medium">{meta.source}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500 dark:text-gray-400">Cost</span>
          <span className="text-gray-700 dark:text-gray-300">{meta.cost}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500 dark:text-gray-400">Writes to</span>
          <span className="text-gray-700 dark:text-gray-300 font-mono text-[10px]">{meta.signal}</span>
        </div>
      </div>

      {/* Schedule controls */}
      <div className="space-y-2 text-xs border-t border-gray-100 dark:border-gray-800 pt-2">
        <div className="flex items-center gap-2">
          <label className="text-gray-500 dark:text-gray-400 w-16">Frequency</label>
          <select value={schedule.frequency} onChange={e => updateField('frequency', e.target.value)} className="flex-1 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs">
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-gray-500 dark:text-gray-400 w-16">Time</label>
          <input type="time" value={schedule.run_time?.slice(0, 5) || '02:00'} onChange={e => updateField('run_time', e.target.value)} className="flex-1 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs" />
        </div>
        {schedule.frequency === 'weekly' && (
          <div className="flex items-center gap-2">
            <label className="text-gray-500 dark:text-gray-400 w-16">Day</label>
            <select value={schedule.day_of_week ?? 1} onChange={e => updateField('day_of_week', Number(e.target.value))} className="flex-1 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => <option key={i} value={i}>{d}</option>)}
            </select>
          </div>
        )}

        <div className="text-gray-500 dark:text-gray-400 pt-1">
          Last run: {schedule.last_run ? new Date(schedule.last_run).toLocaleString() : 'Never'}
        </div>

        <button onClick={triggerRun} disabled={running || meta.status === 'pending'} className={`w-full mt-1 px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50 ${
          meta.status === 'pending'
            ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
            : 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/30'
        }`}>
          {running ? 'Starting...' : meta.status === 'pending' ? 'API Key Needed' : 'Trigger Now'}
        </button>
      </div>
    </div>
  )
}

// ============================================================
// SECTION 3 — Agent Run History
// ============================================================
function RunHistory() {
  const [runs, setRuns] = useState([])
  const [loading, setLoading] = useState(true)
  const [platformFilter, setPlatformFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [expandedRun, setExpandedRun] = useState(null)

  const loadRuns = useCallback(async () => {
    const { data, error } = await supabase.from('agent_runs').select('*').order('created_at', { ascending: false }).limit(50)
    if (error) console.error('agent_runs query error:', error)
    setRuns(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { loadRuns() }, [loadRuns])

  useEffect(() => {
    const channel = supabase
      .channel('agent-runs-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agent_runs' }, () => loadRuns())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [loadRuns])

  const filtered = useMemo(() => {
    return runs.filter(r => {
      if (platformFilter !== 'all' && r.platform !== platformFilter) return false
      if (statusFilter !== 'all' && r.status !== statusFilter) return false
      return true
    })
  }, [runs, platformFilter, statusFilter])

  const STATUS_COLORS = {
    pending: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
    running: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    complete: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
    failed: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    degraded: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
  }

  if (loading) return <LoadingSpinner message="Loading run history..." />

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <select value={platformFilter} onChange={e => setPlatformFilter(e.target.value)} className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
          <option value="all">All Platforms</option>
          {Object.entries(PLATFORM_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
          <option value="all">All Statuses</option>
          <option value="complete">Complete</option>
          <option value="running">Running</option>
          <option value="failed">Failed</option>
          <option value="degraded">Degraded</option>
        </select>
        <span className="text-xs text-gray-400 ml-auto">{filtered.length} runs</span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No runs yet" description="Agent runs will appear here after triggering from the schedules tab." />
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 w-8"></th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Run ID</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Platform</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Processed</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Written</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Duration</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Apify Cost</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Started</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(run => {
                const meta = PLATFORM_META[run.platform] || {}
                const isExpanded = expandedRun === run.id
                return (
                  <RunRow key={run.id} run={run} meta={meta} statusColors={STATUS_COLORS}
                    isExpanded={isExpanded}
                    onToggle={() => setExpandedRun(isExpanded ? null : run.id)} />
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function RunRow({ run, meta, statusColors, isExpanded, onToggle }) {
  return (
    <>
      <tr
        onClick={onToggle}
        className={`border-b border-gray-100 dark:border-gray-800 cursor-pointer transition-colors ${
          isExpanded ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
        }`}
      >
        <td className="px-4 py-3 text-gray-400">{isExpanded ? '▼' : '▶'}</td>
        <td className="px-4 py-3 text-xs text-gray-400 font-mono">{run.run_id?.slice(0, 8)}</td>
        <td className="px-4 py-3">
          <span className={`px-2 py-0.5 text-xs font-medium text-white rounded-full ${meta.color || 'bg-gray-500'}`}>
            {meta.label || run.platform}
          </span>
        </td>
        <td className="px-4 py-3">
          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${statusColors[run.status] || ''}`}>
            {run.status}
          </span>
        </td>
        <td className="px-4 py-3 text-right tabular-nums text-gray-600 dark:text-gray-400">{run.products_processed}</td>
        <td className="px-4 py-3 text-right tabular-nums text-gray-600 dark:text-gray-400">{run.rows_written}</td>
        <td className="px-4 py-3 text-right tabular-nums text-gray-600 dark:text-gray-400">{run.duration_seconds ? `${run.duration_seconds.toFixed(1)}s` : '—'}</td>
        <td className="px-4 py-3 text-right tabular-nums text-gray-600 dark:text-gray-400">{run.apify_estimated_cost ? `$${run.apify_estimated_cost.toFixed(2)}` : '—'}</td>
        <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">{run.started_at ? new Date(run.started_at).toLocaleString() : '—'}</td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={9} className="px-0 py-0">
            <div className="border-b border-gray-200 dark:border-gray-700 p-4 pl-12 bg-gray-50 dark:bg-gray-800/50 space-y-2">
              {run.agent_run_summary && (
                <div>
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Summary:</span>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 leading-relaxed">{run.agent_run_summary}</p>
                </div>
              )}
              {run.error_message && (
                <div>
                  <span className="text-xs font-medium text-red-500">Error:</span>
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1 font-mono">{run.error_message}</p>
                </div>
              )}
              <div className="flex gap-6 text-xs text-gray-500 pt-1">
                {run.rows_rejected > 0 && <span>Rejected: {run.rows_rejected}</span>}
                {run.anomalies_detected > 0 && <span>Anomalies: {run.anomalies_detected}</span>}
                {run.irrelevant_posts_discarded > 0 && <span>Irrelevant discarded: {run.irrelevant_posts_discarded}</span>}
                {run.integrity_check_passed != null && (
                  <span className={run.integrity_check_passed ? 'text-emerald-600' : 'text-red-500'}>
                    Integrity: {run.integrity_check_passed ? 'passed' : 'failed'}
                  </span>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
