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

  const categories = useMemo(() => [...new Set(products.map(p => p.category))].sort(), [products])
  const lifecycles = useMemo(() => [...new Set(products.map(p => p.lifecycle_phase))].sort(), [products])

  const filtered = useMemo(() => {
    return products.filter(p => {
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false
      if (verdictFilter !== 'all' && p.current_verdict !== verdictFilter) return false
      if (lifecycleFilter !== 'all' && p.lifecycle_phase !== lifecycleFilter) return false
      if (p.current_score < minScore) return false
      if (fadOnly && !p.fad_flag) return false
      return true
    })
  }, [products, categoryFilter, verdictFilter, lifecycleFilter, minScore, fadOnly])

  const daysSince = (dateStr) => {
    const d = new Date(dateStr)
    const now = new Date()
    return Math.floor((now - d) / (1000 * 60 * 60 * 24))
  }

  if (loading) return <LoadingSpinner message="Loading products..." />

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Product Leaderboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {filtered.length} product{filtered.length !== 1 ? 's' : ''} tracked
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5 p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="all">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select
          value={verdictFilter}
          onChange={e => setVerdictFilter(e.target.value)}
          className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="all">All Verdicts</option>
          <option value="buy">Buy</option>
          <option value="watch">Watch</option>
          <option value="pass">Pass</option>
        </select>

        <select
          value={lifecycleFilter}
          onChange={e => setLifecycleFilter(e.target.value)}
          className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
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
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState title="No products match" description="Adjust your filters to see results." />
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Product</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Category</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 w-48">Score</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Verdict</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Phase</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Change</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Days</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(product => (
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
                  <td className="px-4 py-3"><ScoreBar score={product.current_score} /></td>
                  <td className="px-4 py-3"><VerdictBadge verdict={product.current_verdict} /></td>
                  <td className="px-4 py-3">
                    <span className="text-gray-600 dark:text-gray-400 capitalize">{product.lifecycle_phase.replace('_', ' ')}</span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    <ScoreChange value={product.score_change} />
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400 tabular-nums">
                    {daysSince(product.first_seen_date)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400 tabular-nums">
                    {product.data_confidence != null ? `${(product.data_confidence * 100).toFixed(1)}%` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
