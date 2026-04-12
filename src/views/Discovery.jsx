import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase.js'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import EmptyState from '../components/EmptyState.jsx'

const SOURCE_COLORS = {
  reddit: 'bg-orange-500', google_trends: 'bg-green-600', amazon: 'bg-amber-600',
}

export default function Discovery() {
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [sourceFilter, setSourceFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('new')
  const [sortBy, setSortBy] = useState('confidence_score')
  const [addModal, setAddModal] = useState(null)

  const load = useCallback(async () => {
    const { data } = await supabase.from('discovery_candidates').select('*').order('confidence_score', { ascending: false }).limit(200)
    setCandidates(data || []); setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])

  useEffect(() => {
    const ch = supabase.channel('discovery-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'discovery_candidates' }, () => load())
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [load])

  const filtered = useMemo(() => {
    let r = [...candidates]
    if (sourceFilter !== 'all') r = r.filter(c => c.source === sourceFilter)
    if (statusFilter !== 'all') r = r.filter(c => c.status === statusFilter)
    r.sort((a, b) => (b[sortBy] || 0) - (a[sortBy] || 0))
    return r
  }, [candidates, sourceFilter, statusFilter, sortBy])

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    return {
      newToday: candidates.filter(c => c.first_seen_date === today && c.status === 'new').length,
      breakout: candidates.filter(c => c.gt_breakout).length,
      multiPlatform: candidates.filter(c => (c.signal_count || 0) >= 2).length,
      autoAdded: candidates.filter(c => c.added_to_tracking).length,
      inReview: candidates.filter(c => c.status === 'new' || c.status === 'reviewing').length,
    }
  }, [candidates])

  const dismiss = async (id, reason) => {
    await supabase.from('discovery_candidates').update({
      status: 'dismissed', dismissed_reason: reason,
      status_changed_at: new Date().toISOString(),
    }).eq('id', id)
    load()
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="p-4 md:p-6">
      <div className="mb-5">
        <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">Discovery</h1>
        <p className="text-xs text-gray-500 mt-0.5">Emerging products surfaced by AI agents</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        {[
          { label: 'New today', value: stats.newToday },
          { label: 'Breakout signals', value: stats.breakout },
          { label: 'Multi-platform', value: stats.multiPlatform },
          { label: 'Auto-added', value: stats.autoAdded },
          { label: 'In review', value: stats.inReview },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-[#111] border border-gray-200 dark:border-[#1a1a1a] p-3">
            <p className="text-[10px] text-gray-500">{s.label}</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white tabular-nums">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}
          className="text-xs border border-gray-300 dark:border-[#1a1a1a] px-3 py-1.5 bg-white dark:bg-[#111] text-gray-900 dark:text-white">
          <option value="all">All Sources</option>
          <option value="reddit">Reddit</option>
          <option value="google_trends">Google Trends</option>
          <option value="amazon">Amazon</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="text-xs border border-gray-300 dark:border-[#1a1a1a] px-3 py-1.5 bg-white dark:bg-[#111] text-gray-900 dark:text-white">
          <option value="all">All Status</option>
          <option value="new">New</option>
          <option value="reviewing">Reviewing</option>
          <option value="added">Added</option>
          <option value="dismissed">Dismissed</option>
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
          className="text-xs border border-gray-300 dark:border-[#1a1a1a] px-3 py-1.5 bg-white dark:bg-[#111] text-gray-900 dark:text-white">
          <option value="confidence_score">Confidence</option>
          <option value="growth_rate">Growth Rate</option>
          <option value="mention_count_this_week">Mentions</option>
          <option value="first_seen_date">First Seen</option>
        </select>
        <span className="text-xs text-gray-400 self-center ml-auto">{filtered.length} candidates</span>
      </div>

      {/* Candidate cards */}
      {filtered.length === 0 ? (
        <EmptyState title="No candidates" description="Discovery agents will surface trending products after the next pipeline run." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(c => (
            <CandidateCard key={c.id} candidate={c} onDismiss={dismiss} onAdd={() => setAddModal(c)} />
          ))}
        </div>
      )}

      {/* Recently added section */}
      {candidates.filter(c => c.added_to_tracking).length > 0 && (
        <div className="mt-6">
          <h2 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wide mb-3">Recently Added to Tracking</h2>
          <div className="space-y-2">
            {candidates.filter(c => c.added_to_tracking).slice(0, 5).map(c => (
              <div key={c.id} className="flex items-center justify-between p-3 bg-white dark:bg-[#111] border border-gray-200 dark:border-[#1a1a1a]">
                <div>
                  <span className="text-xs font-bold text-gray-900 dark:text-white">{c.display_name || c.keyword}</span>
                  <span className="text-[10px] text-gray-400 ml-2">Discovered {c.first_seen_date}</span>
                </div>
                <span className="text-[10px] text-emerald-500 font-bold">TRACKING</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {addModal && <AddToTrackingModal candidate={addModal} onClose={() => setAddModal(null)} onAdded={() => { setAddModal(null); load() }} />}
    </div>
  )
}

function CandidateCard({ candidate: c, onDismiss, onAdd }) {
  const [showDismiss, setShowDismiss] = useState(false)
  const confColor = c.confidence_score >= 0.85 ? 'text-emerald-500' : c.confidence_score >= 0.6 ? 'text-amber-500' : 'text-gray-400'
  const growthStr = c.growth_rate > 0 ? `+${(c.growth_rate * 100).toFixed(0)}%` : '—'

  return (
    <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-[#1a1a1a] p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-sm font-bold text-gray-900 dark:text-white">{c.display_name || c.keyword}</p>
          {c.category && <p className="text-[10px] text-gray-400">{c.category}</p>}
        </div>
        <span className={`text-lg font-bold tabular-nums ${confColor}`}>{(c.confidence_score * 100).toFixed(0)}</span>
      </div>

      {/* Source badges */}
      <div className="flex gap-1 mb-2">
        <span className={`px-2 py-0.5 text-[9px] font-bold text-white ${SOURCE_COLORS[c.source] || 'bg-gray-500'}`}>{c.source?.replace('_', ' ').toUpperCase()}</span>
        {c.signal_count >= 2 && <span className="px-2 py-0.5 text-[9px] font-bold bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">{c.signal_count} PLATFORMS</span>}
        {c.gt_breakout && <span className="px-2 py-0.5 text-[9px] font-bold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">BREAKOUT</span>}
      </div>

      {/* Metrics */}
      <div className="flex gap-4 text-[11px] text-gray-500 mb-2">
        {c.mention_count_this_week > 0 && <span>{c.mention_count_this_week} mentions</span>}
        {c.growth_rate > 0 && <span className="text-emerald-500 font-medium">{growthStr}</span>}
        {c.amazon_bsr_rank > 0 && <span>BSR #{c.amazon_bsr_rank}</span>}
      </div>

      {/* Example posts */}
      {c.example_posts && c.example_posts.length > 0 && (
        <div className="mb-3 space-y-1">
          {c.example_posts.slice(0, 2).map((p, i) => (
            <p key={i} className="text-[10px] text-gray-400 leading-snug truncate">{typeof p === 'string' ? p : JSON.stringify(p)}</p>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between text-[10px] text-gray-400 mb-3">
        <span>First seen: {c.first_seen_date}</span>
        {c.reddit_subreddits?.length > 0 && <span>{c.reddit_subreddits.slice(0, 2).join(', ')}</span>}
      </div>

      {/* Actions */}
      {c.status === 'new' && (
        <div className="flex gap-2">
          <button onClick={() => onAdd(c)} className="flex-1 py-1.5 bg-emerald-600 text-white text-[11px] font-bold hover:bg-emerald-700">Add to Tracking</button>
          <button onClick={() => setShowDismiss(!showDismiss)} className="px-3 py-1.5 bg-gray-100 dark:bg-[#1a1a1a] text-gray-500 text-[11px] hover:text-gray-700">Dismiss</button>
        </div>
      )}
      {c.status === 'added' && <p className="text-[11px] text-emerald-500 font-bold">Added to tracking</p>}
      {c.status === 'dismissed' && <p className="text-[11px] text-gray-400">Dismissed: {c.dismissed_reason || '—'}</p>}

      {showDismiss && (
        <div className="mt-2 flex gap-1 flex-wrap">
          {['Already selling', 'Not relevant', 'Too broad', 'Other'].map(reason => (
            <button key={reason} onClick={() => { onDismiss(c.id, reason); setShowDismiss(false) }}
              className="px-2 py-1 text-[10px] bg-gray-100 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-400 hover:bg-gray-200">{reason}</button>
          ))}
        </div>
      )}
    </div>
  )
}

function AddToTrackingModal({ candidate: c, onClose, onAdded }) {
  const CATEGORIES = ['Supplements', 'Skincare', 'Haircare', 'Personal Care', 'Wellness', 'Beauty Tools', 'Fitness', 'Other']
  const [name, setName] = useState(c.display_name || c.keyword?.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || '')
  const [category, setCategory] = useState(c.category || 'Wellness')
  const [keywords, setKeywords] = useState([c.keyword || ''])
  const [kwInput, setKwInput] = useState('')
  const [saving, setSaving] = useState(false)

  const addKw = (e) => {
    if (e.key === 'Enter' && kwInput.trim()) {
      e.preventDefault()
      setKeywords([...keywords, kwInput.trim()]); setKwInput('')
    }
  }

  const save = async (e) => {
    e.preventDefault(); if (!name.trim()) return; setSaving(true)
    const { data } = await supabase.from('products').insert({
      name: name.trim(), category, keywords, active: true,
      target_subreddits: c.reddit_subreddits || [],
    }).select('id')

    if (data?.[0]) {
      await supabase.from('discovery_candidates').update({
        added_to_tracking: true, product_id: data[0].id,
        status: 'added', status_changed_at: new Date().toISOString(),
      }).eq('id', c.id)
    }
    setSaving(false); onAdded()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-[#1a1a1a] p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Add to Tracking</h2>
        <form onSubmit={save} className="space-y-3">
          <div>
            <label className="block text-[11px] font-medium text-gray-500 mb-1">Product Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required
              className="w-full text-xs border border-gray-300 dark:border-[#1a1a1a] px-3 py-1.5 bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-500 mb-1">Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)}
              className="w-full text-xs border border-gray-300 dark:border-[#1a1a1a] px-3 py-1.5 bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-500 mb-1">Keywords (Enter to add)</label>
            <input type="text" value={kwInput} onChange={e => setKwInput(e.target.value)} onKeyDown={addKw}
              className="w-full text-xs border border-gray-300 dark:border-[#1a1a1a] px-3 py-1.5 bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white" />
            <div className="flex flex-wrap gap-1 mt-1">
              {keywords.map((k, i) => (
                <span key={i} className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-[10px] flex items-center gap-1">
                  {k}<button type="button" onClick={() => setKeywords(keywords.filter((_, j) => j !== i))} className="hover:text-red-500">&times;</button>
                </span>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-1.5 border border-gray-300 dark:border-[#1a1a1a] text-xs text-gray-700 dark:text-gray-300">Cancel</button>
            <button type="submit" disabled={saving || !name.trim()} className="flex-1 px-4 py-1.5 bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-50">
              {saving ? 'Adding...' : 'Start Tracking'}
            </button>
          </div>
        </form>
        <p className="text-[10px] text-gray-400 mt-3 text-center">First scrape will run tonight at 1:00 AM</p>
      </div>
    </div>
  )
}
