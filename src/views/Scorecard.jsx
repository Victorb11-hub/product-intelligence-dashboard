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

const ALL_PLATFORMS = [
  { key: 'reddit',        label: 'Reddit',        category: 'Social',    job: 'Demand Validation',  table: 'signals_social',    color: 'bg-orange-500',  adds: 'Community discussion, buy intent, sentiment' },
  { key: 'tiktok',        label: 'TikTok',        category: 'Social',    job: 'Early Detection',    table: 'signals_social',    color: 'bg-pink-500',    adds: 'Viral early signals, creator endorsements' },
  { key: 'instagram',     label: 'Instagram',     category: 'Social',    job: 'Early Detection',    table: 'signals_social',    color: 'bg-purple-500',  adds: 'Visual product discovery, hashtag trends' },
  { key: 'youtube',       label: 'YouTube',       category: 'Social',    job: 'Early Detection',    table: 'signals_social',    color: 'bg-red-600',     adds: 'Long-form reviews, tutorial demand' },
  { key: 'x',             label: 'X',             category: 'Social',    job: 'Early Detection',    table: 'signals_social',    color: 'bg-gray-700',    adds: 'Real-time buzz, news-driven spikes' },
  { key: 'facebook',      label: 'Facebook',      category: 'Social',    job: 'Demand Validation',  table: 'signals_social',    color: 'bg-blue-600',    adds: 'Community group demand, older demographic' },
  { key: 'google_trends', label: 'Google Trends', category: 'Search',    job: 'Demand Validation',  table: 'signals_search',    color: 'bg-green-600',   adds: 'Search slope, YoY growth, fad confirmation' },
  { key: 'amazon',        label: 'Amazon',        category: 'Retail',    job: 'Purchase Intent',    table: 'signals_retail',    color: 'bg-amber-600',   adds: 'BSR, review velocity, actual purchase signals' },
  { key: 'walmart',       label: 'Walmart',       category: 'Retail',    job: 'Purchase Intent',    table: 'signals_retail',    color: 'bg-blue-500',    adds: 'Mass market demand validation' },
  { key: 'etsy',          label: 'Etsy',          category: 'Retail',    job: 'Purchase Intent',    table: 'signals_retail',    color: 'bg-orange-400',  adds: 'Handmade vs mass market ratio' },
  { key: 'alibaba',       label: 'Alibaba',       category: 'Supply',    job: 'Supply Readiness',   table: 'signals_supply',    color: 'bg-yellow-600',  adds: 'MOQ trends, supplier count, unit pricing' },
  { key: 'pinterest',     label: 'Pinterest',     category: 'Discovery', job: 'Early Detection',    table: 'signals_discovery', color: 'bg-red-500',     adds: 'Save rates, demographic reach, board trends' },
]

export default function Scorecard() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showSourcingModal, setShowSourcingModal] = useState(false)
  const [platformData, setPlatformData] = useState({})
  const { scores, loading: scoresLoading } = useScoresHistory(id)

  useEffect(() => {
    supabase.from('products').select('*').eq('id', id).single()
      .then(({ data }) => { setProduct(data); setLoading(false) })
  }, [id])

  // Load actual signal data for each platform
  useEffect(() => {
    if (!id) return
    async function loadPlatformSignals() {
      const results = {}

      // Social signals (reddit, tiktok, instagram, youtube, x, facebook)
      const { data: social } = await supabase.from('signals_social')
        .select('platform, scraped_date, mention_count, sentiment_score, velocity, avg_intent_score, total_upvotes, total_comment_count, high_intent_comment_count, buy_intent_comment_count, data_quality_score')
        .eq('product_id', id).order('scraped_date', { ascending: false }).limit(20)
      for (const row of (social || [])) {
        if (!results[row.platform]) results[row.platform] = row
      }

      // Search signals (google_trends)
      const { data: search } = await supabase.from('signals_search')
        .select('platform, scraped_date, slope_24m, yoy_growth, breakout_flag, seasonal_pattern, related_rising_queries, news_trigger_flag')
        .eq('product_id', id).order('scraped_date', { ascending: false }).limit(5)
      for (const row of (search || [])) {
        if (!results[row.platform]) results[row.platform] = row
      }

      // Retail signals (amazon, walmart, etsy)
      const { data: retail } = await supabase.from('signals_retail')
        .select('platform, scraped_date, bestseller_rank, review_count, review_sentiment, price, out_of_stock_flag')
        .eq('product_id', id).order('scraped_date', { ascending: false }).limit(10)
      for (const row of (retail || [])) {
        if (!results[row.platform]) results[row.platform] = row
      }

      // Supply signals (alibaba)
      const { data: supply } = await supabase.from('signals_supply')
        .select('platform, scraped_date, supplier_listing_count, moq_current, moq_trend, price_per_unit, competing_supplier_count')
        .eq('product_id', id).order('scraped_date', { ascending: false }).limit(5)
      for (const row of (supply || [])) {
        if (!results[row.platform]) results[row.platform] = row
      }

      // Discovery signals (pinterest)
      const { data: discovery } = await supabase.from('signals_discovery')
        .select('platform, scraped_date, pin_save_rate, save_rate_growth, keyword_search_volume, trending_category_flag, demographic_score')
        .eq('product_id', id).order('scraped_date', { ascending: false }).limit(5)
      for (const row of (discovery || [])) {
        if (!results[row.platform]) results[row.platform] = row
      }

      setPlatformData(results)
    }
    loadPlatformSignals()
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

  const activePlatforms = ALL_PLATFORMS.filter(p => platformData[p.key])
  const inactivePlatforms = ALL_PLATFORMS.filter(p => !platformData[p.key])
  const coveragePct = Math.round(activePlatforms.length / ALL_PLATFORMS.length * 100)

  return (
    <div className="p-4 md:p-6 max-w-5xl">
      <button onClick={() => navigate('/leaderboard')} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline mb-4 inline-block">
        ← Back to Leaderboard
      </button>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-6 gap-3">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{product.name}</h1>
            <VerdictBadge verdict={product.current_verdict} />
            {product.fad_flag && <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs rounded font-semibold">FAD WARNING</span>}
            {product.fad_flag === null && <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 text-xs rounded font-medium">Fad: Insufficient data</span>}
          </div>
          <div className="flex gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
            <span>{product.category}</span>
            <span>Phase: <span className="capitalize">{product.lifecycle_phase?.replace('_', ' ')}</span></span>
            <span>First seen: {new Date(product.first_seen_date).toLocaleDateString()}</span>
          </div>
        </div>
        <button onClick={() => setShowSourcingModal(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 shrink-0">
          Log Sourcing Decision
        </button>
      </div>

      {/* Score + Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col items-center justify-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Adjusted Score</p>
          <p className={`text-5xl font-bold tabular-nums ${product.current_score >= 75 ? 'text-emerald-600' : product.current_score >= 55 ? 'text-amber-600' : 'text-red-600'}`}>
            {product.current_score?.toFixed(1)}
          </p>
          {product.raw_score > 0 && product.raw_score !== product.current_score && (
            <p className="text-xs text-gray-400 mt-1 tabular-nums">Raw: {product.raw_score?.toFixed(1)}</p>
          )}
          <div className="mt-2"><VerdictBadge verdict={product.current_verdict} /></div>
          <p className="text-xs text-gray-400 mt-2">{product.coverage_pct || 0}% data coverage ({product.active_jobs || 0}/{product.total_jobs || 4} jobs)</p>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Score Over Time</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: 'var(--tooltip-bg, #fff)', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }} />
              <ReferenceLine y={75} stroke="#10b981" strokeDasharray="5 5" label={{ value: 'Buy', position: 'right', fontSize: 10, fill: '#10b981' }} />
              <ReferenceLine y={55} stroke="#f59e0b" strokeDasharray="5 5" label={{ value: 'Watch', position: 'right', fontSize: 10, fill: '#f59e0b' }} />
              <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Platform Signals — Dynamic */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Platform Signals</p>
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              {ALL_PLATFORMS.map(p => (
                <div key={p.key} className={`w-3 h-2 rounded-sm ${platformData[p.key] ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
              ))}
            </div>
            <span className="text-xs text-gray-500 tabular-nums">{activePlatforms.length}/{ALL_PLATFORMS.length}</span>
          </div>
        </div>

        {/* Active platforms */}
        {activePlatforms.length > 0 && (
          <div className="space-y-2 mb-4">
            {activePlatforms.map(platform => {
              const data = platformData[platform.key]
              return (
                <div key={platform.key} className="flex items-start gap-3 p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30">
                  <div className={`w-2 h-2 rounded-full mt-1.5 ${platform.color}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{platform.label}</span>
                      <span className="px-1.5 py-0.5 text-[10px] font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded">ACTIVE</span>
                      <span className="text-[10px] text-gray-400">{platform.job}</span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-600 dark:text-gray-400">
                      <PlatformMetrics platform={platform.key} data={data} />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">Last scraped: {data.scraped_date}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Inactive platforms */}
        {inactivePlatforms.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {inactivePlatforms.map(platform => (
              <div key={platform.key} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 opacity-60">
                <div className="w-2 h-2 rounded-full mt-1.5 bg-gray-300 dark:bg-gray-600" />
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{platform.label}</span>
                    <span className="px-1.5 py-0.5 text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-400 rounded">INACTIVE</span>
                  </div>
                  <p className="text-[11px] text-gray-400">{platform.adds}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Verdict Reasoning */}
      {latest?.verdict_reasoning && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">AI Verdict Reasoning</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{latest.verdict_reasoning}</p>
        </div>
      )}

      {/* Fad Analysis */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Fad Analysis</p>
        <div className="flex items-center gap-3">
          <span className={`w-3 h-3 rounded-full ${product.fad_flag === true ? 'bg-orange-500' : product.fad_flag === false ? 'bg-emerald-500' : 'bg-gray-400'}`} />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {product.fad_flag === true && 'Google Trends indicates this may be a short-lived trend. Proceed with caution.'}
            {product.fad_flag === false && 'No fad signals detected. Google Trends slope is positive and sustained.'}
            {product.fad_flag === null && 'Insufficient data — Google Trends has not yet run for this product. Cannot determine fad status.'}
          </span>
        </div>
      </div>

      {showSourcingModal && (
        <SourcingModal productId={id} score={product.current_score} onClose={() => setShowSourcingModal(false)} />
      )}
    </div>
  )
}

function PlatformMetrics({ platform, data }) {
  if (!data) return null

  switch (platform) {
    case 'reddit':
      return (
        <>
          <span>{data.mention_count} posts</span>
          <span>Sentiment: {data.sentiment_score?.toFixed(2)}</span>
          <span>Intent: {data.avg_intent_score?.toFixed(2)}</span>
          <span>{data.total_upvotes?.toLocaleString()} upvotes</span>
          <span>{data.high_intent_comment_count} high intent</span>
        </>
      )
    case 'google_trends':
      return (
        <>
          <span>Slope: {data.slope_24m?.toFixed(4)}</span>
          <span>YoY: {data.yoy_growth != null ? `${(data.yoy_growth * 100).toFixed(0)}%` : '—'}</span>
          <span>Breakout: {data.breakout_flag ? 'Yes' : 'No'}</span>
          <span>Seasonal: {data.seasonal_pattern}</span>
        </>
      )
    case 'amazon': case 'walmart': case 'etsy':
      return (
        <>
          {data.bestseller_rank && <span>BSR: #{data.bestseller_rank}</span>}
          <span>Reviews: {data.review_count?.toLocaleString()}</span>
          <span>Sentiment: {data.review_sentiment?.toFixed(2)}</span>
          {data.price && <span>${Number(data.price).toFixed(2)}</span>}
          {data.out_of_stock_flag && <span className="text-red-500 font-medium">OOS</span>}
        </>
      )
    case 'alibaba':
      return (
        <>
          <span>{data.supplier_listing_count} suppliers</span>
          <span>MOQ: {data.moq_current}</span>
          <span>Trend: {data.moq_trend}</span>
          {data.price_per_unit && <span>${Number(data.price_per_unit).toFixed(2)}/unit</span>}
        </>
      )
    case 'pinterest':
      return (
        <>
          <span>Save rate: {data.pin_save_rate?.toFixed(2)}</span>
          <span>Growth: {data.save_rate_growth?.toFixed(2)}</span>
          <span>Volume: {data.keyword_search_volume}</span>
          {data.trending_category_flag && <span className="text-emerald-500 font-medium">Trending</span>}
        </>
      )
    default: // tiktok, instagram, youtube, x, facebook
      return (
        <>
          <span>{data.mention_count} mentions</span>
          <span>Sentiment: {data.sentiment_score?.toFixed(2)}</span>
          {data.total_upvotes > 0 && <span>{data.total_upvotes?.toLocaleString()} engagement</span>}
        </>
      )
  }
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
            <select value={form.import_method} onChange={e => setForm(f => ({ ...f, import_method: e.target.value }))}
              className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
              <option value="sea_freight">Sea Freight</option>
              <option value="air_freight">Air Freight</option>
              <option value="domestic">Domestic</option>
            </select>
          </div>
          <Input label="Estimated Arrival" type="date" value={form.estimated_arrival} onChange={v => setForm(f => ({ ...f, estimated_arrival: v }))} />
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">{saving ? 'Saving...' : 'Save Decision'}</button>
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
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" {...props} />
    </div>
  )
}
