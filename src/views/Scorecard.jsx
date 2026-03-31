import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts'
import { supabase } from '../lib/supabase.js'
import { useScoresHistory } from '../hooks/useSupabase.js'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import VerdictBadge from '../components/VerdictBadge.jsx'
import ScoreBar from '../components/ScoreBar.jsx'

const JOB_COLORS = {
  early_detection: '#6366f1',
  demand_validation: '#10b981',
  purchase_intent: '#f59e0b',
  supply_readiness: '#ef4444',
}

const PLATFORM_LABELS = {
  tiktok: 'TikTok', instagram: 'Instagram', youtube: 'YouTube',
  x: 'X', pinterest: 'Pinterest', google_trends: 'Google Trends',
  reddit: 'Reddit', facebook: 'Facebook', amazon: 'Amazon',
  etsy: 'Etsy', walmart: 'Walmart', alibaba: 'Alibaba',
}

export default function Scorecard() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showSourcingModal, setShowSourcingModal] = useState(false)
  const { scores, loading: scoresLoading } = useScoresHistory(id)

  useEffect(() => {
    supabase.from('products').select('*').eq('id', id).single()
      .then(({ data }) => { setProduct(data); setLoading(false) })
  }, [id])

  if (loading || scoresLoading) return <LoadingSpinner message="Loading scorecard..." />
  if (!product) return <div className="p-6 text-gray-500">Product not found.</div>

  const latest = scores.length > 0 ? scores[scores.length - 1] : null
  const chartData = scores.slice(-90).map(s => ({
    date: new Date(s.scored_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    score: Number(s.composite_score.toFixed(1)),
  }))

  const jobScores = latest ? [
    { name: 'Early Detection', key: 'early_detection', score: latest.early_detection_score, weight: '30%' },
    { name: 'Demand Validation', key: 'demand_validation', score: latest.demand_validation_score, weight: '30%' },
    { name: 'Purchase Intent', key: 'purchase_intent', score: latest.purchase_intent_score, weight: '25%' },
    { name: 'Supply Readiness', key: 'supply_readiness', score: latest.supply_readiness_score, weight: '15%' },
  ] : []

  const platformSignals = latest?.platforms_used || []

  return (
    <div className="p-6 max-w-5xl">
      {/* Back + Header */}
      <button onClick={() => navigate('/leaderboard')} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline mb-4 inline-block">
        ← Back to Leaderboard
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{product.name}</h1>
            <VerdictBadge verdict={product.current_verdict} />
            {product.fad_flag && (
              <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs rounded font-semibold">FAD WARNING</span>
            )}
          </div>
          <div className="flex gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
            <span>{product.category}</span>
            <span>Phase: <span className="capitalize">{product.lifecycle_phase.replace('_', ' ')}</span></span>
            <span>First seen: {new Date(product.first_seen_date).toLocaleDateString()}</span>
          </div>
        </div>
        <button
          onClick={() => setShowSourcingModal(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          Log Sourcing Decision
        </button>
      </div>

      {/* Big Score */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col items-center justify-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Composite Score</p>
          <p className={`text-5xl font-bold tabular-nums ${product.current_score >= 75 ? 'text-emerald-600' : product.current_score >= 55 ? 'text-amber-600' : 'text-red-600'}`}>
            {product.current_score.toFixed(1)}
          </p>
          <div className="mt-2"><VerdictBadge verdict={product.current_verdict} /></div>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Score Over Time (Last 90 Days)</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--tooltip-bg, #fff)', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }}
              />
              <ReferenceLine y={75} stroke="#10b981" strokeDasharray="5 5" label={{ value: 'Buy (75)', position: 'right', fontSize: 10, fill: '#10b981' }} />
              <ReferenceLine y={55} stroke="#f59e0b" strokeDasharray="5 5" label={{ value: 'Watch (55)', position: 'right', fontSize: 10, fill: '#f59e0b' }} />
              <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Job Score Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Scoring Job Breakdown</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={jobScores} layout="vertical" margin={{ left: 120 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={110} />
              <Tooltip formatter={(v) => v.toFixed(1)} />
              <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                {jobScores.map((entry) => (
                  <Cell key={entry.key} fill={JOB_COLORS[entry.key]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Platform Signal Grid */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Platform Signals</p>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(PLATFORM_LABELS).map(([key, label]) => {
              const active = platformSignals.includes(key)
              return (
                <div
                  key={key}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${
                    active
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                      : 'bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${active ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                  {label}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Verdict Reasoning */}
      {latest?.verdict_reasoning && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">AI Verdict Reasoning</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{latest.verdict_reasoning}</p>
        </div>
      )}

      {/* Fad Flag Status */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Fad Analysis</p>
        <div className="flex items-center gap-3">
          <span className={`w-3 h-3 rounded-full ${product.fad_flag ? 'bg-orange-500' : 'bg-emerald-500'}`} />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {product.fad_flag
              ? 'Google Trends indicates this may be a short-lived trend. Proceed with caution.'
              : 'No fad signals detected. Google Trends slope is positive and sustained.'
            }
          </span>
        </div>
      </div>

      {/* Sourcing Modal */}
      {showSourcingModal && (
        <SourcingModal productId={id} score={product.current_score} onClose={() => setShowSourcingModal(false)} />
      )}
    </div>
  )
}

function SourcingModal({ productId, score, onClose }) {
  const [form, setForm] = useState({
    supplier: '', moq: '', unit_cost: '', import_method: 'sea_freight',
    estimated_arrival: '', decided_by: 'Victor',
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    await supabase.from('sourcing_log').insert({
      product_id: productId,
      decision_date: new Date().toISOString().split('T')[0],
      decided_by: form.decided_by,
      score_at_decision: score,
      supplier: form.supplier,
      moq: form.moq ? Number(form.moq) : null,
      unit_cost: form.unit_cost ? Number(form.unit_cost) : null,
      import_method: form.import_method,
      estimated_arrival: form.estimated_arrival || null,
    })
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Log Sourcing Decision</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input label="Decided By" value={form.decided_by} onChange={v => setForm(f => ({ ...f, decided_by: v }))} />
          <Input label="Supplier" value={form.supplier} onChange={v => setForm(f => ({ ...f, supplier: v }))} required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="MOQ" type="number" value={form.moq} onChange={v => setForm(f => ({ ...f, moq: v }))} />
            <Input label="Unit Cost ($)" type="number" step="0.01" value={form.unit_cost} onChange={v => setForm(f => ({ ...f, unit_cost: v }))} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Import Method</label>
            <select
              value={form.import_method}
              onChange={e => setForm(f => ({ ...f, import_method: e.target.value }))}
              className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="sea_freight">Sea Freight</option>
              <option value="air_freight">Air Freight</option>
              <option value="domestic">Domestic</option>
            </select>
          </div>
          <Input label="Estimated Arrival" type="date" value={form.estimated_arrival} onChange={v => setForm(f => ({ ...f, estimated_arrival: v }))} />
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Decision'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Input({ label, value, onChange, type = 'text', ...props }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        {...props}
      />
    </div>
  )
}
