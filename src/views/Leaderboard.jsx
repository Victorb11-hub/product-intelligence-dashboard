import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProducts } from '../hooks/useSupabase.js'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import EmptyState from '../components/EmptyState.jsx'
import VerdictBadge from '../components/VerdictBadge.jsx'
import ScoreBar from '../components/ScoreBar.jsx'

export default function Leaderboard() {
  const { products, loading } = useProducts()
  const navigate = useNavigate()

  const [categoryFilter, setCategoryFilter] = useState('all')
  const [verdictFilter, setVerdictFilter] = useState('all')
  const [lifecycleFilter, setLifecycleFilter] = useState('all')
  const [minScore, setMinScore] = useState(0)
  const [fadOnly, setFadOnly] = useState(false)
  const [sortBy, setSortBy] = useState('score_x_confidence')

  const categories = useMemo(() => [...new Set(products.map(p => p.category))].sort(), [products])
  const lifecycles = useMemo(() => [...new Set(products.map(p => p.lifecycle_phase))].sort(), [products])

  const filtered = useMemo(() => {
    const filtered = products.filter(p => {
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false
      if (verdictFilter !== 'all' && p.current_verdict !== verdictFilter) return false
      if (lifecycleFilter !== 'all' && p.lifecycle_phase !== lifecycleFilter) return false
      if (p.current_score < minScore) return false
      if (fadOnly && !p.fad_flag) return false
      return true
    })
    const confMult = (lvl) => lvl === 'high' ? 1.0 : lvl === 'medium' ? 0.7 : lvl === 'low' ? 0.4 : 0.4
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'score':
          return (b.current_score || 0) - (a.current_score || 0)
        case 'score_x_confidence':
          return (b.current_score || 0) * confMult(b.confidence_level) - (a.current_score || 0) * confMult(a.confidence_level)
        case 'most_comments':
          return (b.total_comments_scored || 0) - (a.total_comments_scored || 0)
        case 'most_purchase':
          return (b.purchase_signal_count || 0) - (a.purchase_signal_count || 0)
        case 'newest_data':
          return new Date(b.last_scraped_at || 0) - new Date(a.last_scraped_at || 0)
        default:
          return 0
      }
    })
  }, [products, categoryFilter, verdictFilter, lifecycleFilter, minScore, fadOnly, sortBy])

  const daysSince = (dateStr) => {
    const d = new Date(dateStr)
    const now = new Date()
    return Math.floor((now - d) / (1000 * 60 * 60 * 24))
  }

  if (loading) return <LoadingSpinner message="Loading products..." />

  return (
    <div className="p-4 md:p-6">
      <div className="mb-5">
        <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">Leaderboard</h1>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
          {filtered.length} product{filtered.length !== 1 ? 's' : ''} tracked
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-4 p-3 bg-white dark:bg-[#111] border border-gray-200 dark:border-[#1a1a1a]">
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="text-sm border border-gray-300 dark:border-gray-600 px-3 py-1.5 bg-white dark:bg-[#111] text-gray-900 dark:text-white text-xs"
        >
          <option value="all">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select
          value={verdictFilter}
          onChange={e => setVerdictFilter(e.target.value)}
          className="text-sm border border-gray-300 dark:border-gray-600 px-3 py-1.5 bg-white dark:bg-[#111] text-gray-900 dark:text-white text-xs"
        >
          <option value="all">All Verdicts</option>
          <option value="buy">Buy</option>
          <option value="watch">Watch</option>
          <option value="pass">Pass</option>
        </select>

        <select
          value={lifecycleFilter}
          onChange={e => setLifecycleFilter(e.target.value)}
          className="text-sm border border-gray-300 dark:border-gray-600 px-3 py-1.5 bg-white dark:bg-[#111] text-gray-900 dark:text-white text-xs"
        >
          <option value="all">All Phases</option>
          {lifecycles.map(l => <option key={l} value={l}>{l.replace('_', ' ')}</option>)}
        </select>

        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 dark:text-gray-400">Min Score: {minScore}</label>
          <input
            type="range"
            min="0"
            max="100"
            value={minScore}
            onChange={e => setMinScore(Number(e.target.value))}
            className="w-24 accent-indigo-600"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
          <input
            type="checkbox"
            checked={fadOnly}
            onChange={e => setFadOnly(e.target.checked)}
            className="rounded accent-indigo-600"
          />
          Fad Flags Only
        </label>

        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          className="text-sm border border-gray-300 dark:border-gray-600 px-3 py-1.5 bg-white dark:bg-[#111] text-gray-900 dark:text-white text-xs ml-auto"
          title="Sort products"
        >
          <option value="score_x_confidence">★ Score × Confidence</option>
          <option value="score">Score</option>
          <option value="most_comments">Most Comments</option>
          <option value="most_purchase">Most Purchase Signals</option>
          <option value="newest_data">Newest Data</option>
        </select>
      </div>

      {/* Products */}
      {filtered.length === 0 ? (
        <EmptyState title="No products match" description="Adjust your filters to see results." />
      ) : (
        <>
          {/* Mobile: card view */}
          <div className="md:hidden space-y-3">
            {filtered.map(product => {
              const aj = product.active_jobs || 0
              const tj = product.total_jobs || 4
              const covPct = product.coverage_pct || 0
              return (
                <div
                  key={product.id}
                  onClick={() => navigate(`/product/${product.id}`)}
                  className="bg-white dark:bg-[#111] border border-gray-200 dark:border-[#1a1a1a] p-4 cursor-pointer active:bg-indigo-50 dark:active:bg-indigo-900/10"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-[15px] text-gray-900 dark:text-white">{product.name}</span>
                      {product.fad_flag && <span className="px-1.5 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-[11px] rounded font-medium">FAD</span>}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <VerdictBadge verdict={product.current_verdict} />
                      <ConfidenceBadge level={product.confidence_level} reason={product.confidence_reason} />
                    </div>
                  </div>
                  <div className="mb-1"><ScoreBar score={product.current_score} size="lg" /></div>
                  {product.raw_score > 0 && product.raw_score !== product.current_score && (
                    <p className="text-[11px] text-gray-400 mb-1 tabular-nums">Raw: {product.raw_score?.toFixed(1)}</p>
                  )}
                  <CoverageBar active={aj} total={tj} pct={covPct} />
                  <div className="flex items-center justify-between text-[13px] text-gray-500 dark:text-gray-400 mt-2">
                    <span>{product.category}</span>
                    <span className="capitalize">{product.lifecycle_phase.replace('_', ' ')}</span>
                    <span>{daysSince(product.first_seen_date)}d</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Desktop: table view */}
          <div className="hidden md:block bg-white dark:bg-[#111] border border-gray-200 dark:border-[#1a1a1a] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Product</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Category</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 w-52">Score</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Verdict</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Confidence</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 w-36">Coverage</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Phase</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Days</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(product => {
                  const aj = product.active_jobs || 0
                  const tj = product.total_jobs || 4
                  const covPct = product.coverage_pct || 0
                  return (
                    <tr
                      key={product.id}
                      onClick={() => navigate(`/product/${product.id}`)}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-white">{product.name}</span>
                          {product.fad_flag && (
                            <span className="px-1.5 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs rounded font-medium">FAD</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{product.category}</td>
                      <td className="px-4 py-3">
                        <ScoreBar score={product.current_score} />
                        {product.raw_score > 0 && product.raw_score !== product.current_score && (
                          <p className="text-[11px] text-gray-400 mt-0.5 tabular-nums">Raw: {product.raw_score?.toFixed(1)}</p>
                        )}
                      </td>
                      <td className="px-4 py-3"><VerdictBadge verdict={product.current_verdict} /></td>
                      <td className="px-4 py-3"><ConfidenceBadge level={product.confidence_level} reason={product.confidence_reason} /></td>
                      <td className="px-4 py-3">
                        <CoverageBar active={aj} total={tj} pct={covPct} />
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-gray-600 dark:text-gray-400 capitalize">{product.lifecycle_phase.replace('_', ' ')}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400 tabular-nums">
                        {daysSince(product.first_seen_date)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

function ScoreChange({ value }) {
  if (!value || value === 0) return <span className="text-gray-400">—</span>
  const positive = value > 0
  return (
    <span className={positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
      {positive ? '▲' : '▼'} {Math.abs(value).toFixed(1)}
    </span>
  )
}

function ConfidenceBadge({ level, reason }) {
  const config = {
    high:   { label: 'HIGH CONF', cls: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' },
    medium: { label: 'MED CONF',  cls: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' },
    low:    { label: 'LOW DATA',  cls: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' },
  }
  const c = config[level] || { label: 'NO DATA', cls: 'bg-gray-100 dark:bg-gray-800 text-gray-500' }
  return (
    <span
      title={reason || 'Confidence not yet calculated'}
      className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide cursor-help ${c.cls}`}
    >
      {c.label}
    </span>
  )
}

function CoverageBar({ active, total, pct }) {
  const segments = Array.from({ length: total }, (_, i) => i < active)
  const color = pct >= 75 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-400'

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-px">
        {segments.map((filled, i) => (
          <div key={i} className={`w-4 h-2 ${filled ? color : 'bg-gray-200 dark:bg-gray-700'}`} />
        ))}
      </div>
      <span className="text-[11px] text-gray-500 dark:text-gray-400 tabular-nums">{active}/{total}</span>
    </div>
  )
}
