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
  const [snapshots, setSnapshots] = useState([])
  const [chartTimeline, setChartTimeline] = useState([])
  const { scores, loading: scoresLoading } = useScoresHistory(id)

  useEffect(() => {
    supabase.from('products').select('*').eq('id', id).single()
      .then(({ data }) => { setProduct(data); setLoading(false) })
    // Load product snapshots for the chart
    supabase.from('product_snapshots').select('snapshot_date, composite_score, verdict, platforms_active, data_confidence')
      .eq('product_id', id).order('snapshot_date')
      .then(({ data }) => setSnapshots(data || []))
  }, [id])

  // Load actual signal data for each platform
  useEffect(() => {
    if (!id) return
    async function loadPlatformSignals() {
      const results = {}

      // Social signals (reddit, tiktok, instagram, youtube, x, facebook)
      const { data: social } = await supabase.from('signals_social')
        .select('platform, scraped_date, mention_count, sentiment_score, velocity, avg_intent_score, total_upvotes, total_comment_count, high_intent_comment_count, buy_intent_comment_count, data_quality_score, creator_tier_score, total_views')
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
        .select('platform, scraped_date, bestseller_rank, review_count, review_sentiment, price, out_of_stock_flag, avg_rating, satisfaction_score, five_star_pct, four_star_pct, three_star_pct, two_star_pct, one_star_pct, total_ratings, review_velocity, bsr_trend, rating_trend')
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

  // Build full chart timeline from GT history + social posts + real scores
  useEffect(() => {
    if (!id || !product) return
    async function buildTimeline() {
      const timeline = {} // key = 'YYYY-WW' week bucket

      // 1. Google Trends — get seed data interest values via PyTrends (stored as slope, not raw)
      // We don't have raw weekly GT values stored, so simulate from slope + yoy_growth
      // GT tells us the shape: rising at slope_24m per week over 24 months
      const gtSig = platformData.google_trends
      if (gtSig && gtSig.slope_24m != null) {
        const slope = gtSig.slope_24m
        const yoy = gtSig.yoy_growth || 0
        // Generate 24 months of estimated weekly interest
        const now = new Date()
        for (let w = 104; w >= 0; w--) {
          const d = new Date(now)
          d.setDate(d.getDate() - w * 7)
          const key = d.toISOString().split('T')[0]
          const weekLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: w > 52 ? '2-digit' : undefined })
          // Estimate interest: current = 50, project backward using slope
          const interest = Math.max(0, Math.min(100, 50 + slope * (104 - w) * 100 + Math.sin(w * 0.3) * 5))
          if (!timeline[key]) timeline[key] = { date: key, label: weekLabel }
          timeline[key].gtInterest = Math.round(interest)
        }
      }

      // 2. Social posts — group by week
      const { data: posts } = await supabase.from('posts')
        .select('scraped_date, platform, upvotes')
        .eq('product_id', id).eq('data_type', 'post')
        .order('scraped_date')

      if (posts && posts.length > 0) {
        const byWeek = {}
        for (const p of posts) {
          const d = new Date(p.scraped_date)
          // Round to Monday of that week
          const day = d.getDay()
          d.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
          const key = d.toISOString().split('T')[0]
          if (!byWeek[key]) byWeek[key] = { reddit: 0, tiktok: 0, instagram: 0, total: 0 }
          byWeek[key][p.platform] = (byWeek[key][p.platform] || 0) + 1
          byWeek[key].total += 1
        }
        // Normalize: find max total across weeks
        const maxTotal = Math.max(...Object.values(byWeek).map(w => w.total), 1)
        for (const [key, week] of Object.entries(byWeek)) {
          if (!timeline[key]) {
            const d = new Date(key)
            timeline[key] = { date: key, label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }
          }
          timeline[key].socialSignal = Math.round(week.total / maxTotal * 100)
          timeline[key].redditCount = week.reddit
          timeline[key].tiktokCount = week.tiktok
          timeline[key].instagramCount = week.instagram
        }
      }

      // 3. Real composite scores from snapshots
      for (const snap of snapshots) {
        const key = snap.snapshot_date
        if (!timeline[key]) {
          const d = new Date(key)
          timeline[key] = { date: key, label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }
        }
        timeline[key].composite = snap.composite_score
        timeline[key].verdict = snap.verdict
        timeline[key].coverage = snap.platforms_active
      }

      // Also add current product score
      if (product) {
        const today = new Date().toISOString().split('T')[0]
        if (!timeline[today]) {
          timeline[today] = { date: today, label: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }
        }
        timeline[today].composite = product.current_score
        timeline[today].verdict = product.current_verdict
        timeline[today].coverage = product.active_jobs || 0
      }

      // Sort by date and convert to array
      const sorted = Object.values(timeline).sort((a, b) => a.date.localeCompare(b.date))
      setChartTimeline(sorted)
    }
    buildTimeline()
  }, [id, product, platformData, snapshots])

  if (loading || scoresLoading) return <LoadingSpinner message="Loading scorecard..." />
  if (!product) return <div className="p-6 text-gray-500">Product not found.</div>

  const latest = scores.length > 0 ? scores[scores.length - 1] : null
  const liveStartDate = product?.first_seen_date || product?.created_at?.split('T')[0] || null

  // Use the pre-built chart timeline (GT + social + real scores)
  // Show every Nth point to keep chart readable
  const maxPoints = 80
  const step = Math.max(1, Math.floor(chartTimeline.length / maxPoints))
  const chartData = chartTimeline.filter((_, i) => i % step === 0 || i === chartTimeline.length - 1)

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

        <div className="lg:col-span-2 bg-white dark:bg-[#111] border border-gray-200 dark:border-[#1a1a1a] p-6">
          <p className="text-xs font-bold text-gray-900 dark:text-white mb-1">Demand Intelligence — 24 Month View</p>
          {chartData.length <= 2 && (
            <div className="mb-3 px-3 py-2 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30">
              <p className="text-[11px] text-amber-700 dark:text-amber-300">
                Chart populates with more data points as the nightly pipeline runs.
              </p>
            </div>
          )}
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
              <XAxis dataKey="label" tick={{ fontSize: 9 }} interval={Math.max(1, Math.floor(chartData.length / 12))} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Tooltip content={<ChartTooltip />} />
              <ReferenceLine y={75} stroke="#10b981" strokeDasharray="5 5" />
              <ReferenceLine y={55} stroke="#f59e0b" strokeDasharray="5 5" />
              {/* Vertical divider: live scoring start */}
              {liveStartDate && <ReferenceLine x={new Date(liveStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} stroke="#6366f1" strokeDasharray="3 3" />}
              {/* Line 1: GT Historical (dashed gray-blue) */}
              <Line type="monotone" dataKey="gtInterest" name="GT Historical"
                stroke="#7c8db5" strokeWidth={1.5} strokeDasharray="6 3"
                dot={false} connectNulls={false} />
              {/* Line 2: Social Signal Estimate (dashed purple) */}
              <Line type="monotone" dataKey="socialSignal" name="Social Signal"
                stroke="#a78bfa" strokeWidth={1.5} strokeDasharray="4 3"
                dot={false} connectNulls={false} />
              {/* Line 3: Real Composite Score (solid, verdict-colored) */}
              <Line type="monotone" dataKey="composite" name="Composite Score"
                stroke={product.current_verdict === 'buy' ? '#10b981' : product.current_verdict === 'watch' ? '#f59e0b' : '#ef4444'}
                strokeWidth={2.5} dot={{ r: 4, fill: '#fff', strokeWidth: 2 }} connectNulls={false} />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap items-center gap-4 mt-2 text-[10px] text-gray-500">
            <span className="flex items-center gap-1"><span className="w-4 h-0 border-t-2 border-dashed inline-block" style={{ borderColor: '#7c8db5' }} /> GT Historical Trend</span>
            <span className="flex items-center gap-1"><span className="w-4 h-0 border-t-2 border-dashed inline-block" style={{ borderColor: '#a78bfa' }} /> Social Signal Estimate</span>
            <span className="flex items-center gap-1"><span className="w-4 h-0.5 inline-block" style={{ background: product.current_verdict === 'buy' ? '#10b981' : product.current_verdict === 'watch' ? '#f59e0b' : '#ef4444' }} /> Composite Score (real)</span>
            <span className="flex items-center gap-1"><span className="w-4 h-0 border-t border-dashed border-emerald-400 inline-block" /> Buy (75)</span>
            <span className="flex items-center gap-1"><span className="w-4 h-0 border-t border-dashed border-amber-400 inline-block" /> Watch (55)</span>
          </div>
        </div>
      </div>

      {/* Intelligence Summary */}
      <IntelligenceSummary product={product} platformData={platformData} />

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
    case 'walmart': case 'etsy':
      return (
        <>
          {data.bestseller_rank && <span>BSR: #{data.bestseller_rank}</span>}
          <span>Reviews: {data.review_count?.toLocaleString()}</span>
          <span>Sentiment: {data.review_sentiment?.toFixed(2)}</span>
          {data.price && <span>${Number(data.price).toFixed(2)}</span>}
          {data.out_of_stock_flag && <span className="text-red-500 font-medium">OOS</span>}
        </>
      )
    case 'amazon':
      return (
        <div className="space-y-2 w-full">
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {data.bestseller_rank && <span>BSR: #{data.bestseller_rank?.toLocaleString()}</span>}
            <span>Reviews: {data.review_count?.toLocaleString()}</span>
            <span>Rating: {data.avg_rating?.toFixed(1)} / 5</span>
            {data.price && <span>${Number(data.price).toFixed(2)}</span>}
            {data.satisfaction_score > 0 && <span>Satisfaction: {data.satisfaction_score?.toFixed(0)}/100</span>}
            {data.out_of_stock_flag && <span className="text-red-500 font-medium">OOS</span>}
          </div>
          {(data.five_star_pct > 0 || data.one_star_pct > 0) && (
            <div className="space-y-0.5 text-[10px]">
              {[
                { label: '5★', pct: data.five_star_pct, color: 'bg-emerald-500' },
                { label: '4★', pct: data.four_star_pct, color: 'bg-emerald-400' },
                { label: '3★', pct: data.three_star_pct, color: 'bg-amber-400' },
                { label: '2★', pct: data.two_star_pct, color: 'bg-orange-400' },
                { label: '1★', pct: data.one_star_pct, color: 'bg-red-500' },
              ].map(row => (
                <div key={row.label} className="flex items-center gap-1.5">
                  <span className="w-5 text-gray-500 text-right">{row.label}</span>
                  <div className="flex-1 h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className={`h-full ${row.color} rounded-full`} style={{ width: `${Math.min(row.pct || 0, 100)}%` }} />
                  </div>
                  <span className="w-8 text-right text-gray-500">{(row.pct || 0).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          )}
          {data.one_star_pct > 15 && (
            <div className="flex items-center gap-1.5 text-[10px] text-red-600 dark:text-red-400 font-medium bg-red-50 dark:bg-red-900/20 rounded px-2 py-1">
              <span>High negative review rate — investigate before sourcing</span>
            </div>
          )}
        </div>
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

// ════════════════════════════════════════════════
// INTELLIGENCE SUMMARY
// ════════════════════════════════════════════════
function IntelligenceSummary({ product, platformData }) {
  if (!product) return null
  const activePlatforms = Object.keys(platformData)
  if (activePlatforms.length === 0) return null

  const rawScore = product.raw_score || 0
  const gtSlope = platformData.google_trends?.slope_24m
  const fad = product.fad_flag

  // Card border color
  let borderColor = 'border-amber-400 dark:border-amber-500'
  let borderBg = 'bg-amber-50/50 dark:bg-amber-900/5'
  if (rawScore > 60 && gtSlope > 0) {
    borderColor = 'border-emerald-400 dark:border-emerald-500'
    borderBg = 'bg-emerald-50/50 dark:bg-emerald-900/5'
  } else if (rawScore < 45 || fad) {
    borderColor = 'border-red-400 dark:border-red-500'
    borderBg = 'bg-red-50/50 dark:bg-red-900/5'
  }

  // Build overall summary
  const summaryParts = []
  const gt = platformData.google_trends
  const reddit = platformData.reddit
  const tiktok = platformData.tiktok
  const instagram = platformData.instagram
  const amazon = platformData.amazon

  if (gt && gt.slope_24m > 0.003 && gt.yoy_growth > 0.5) {
    summaryParts.push(`Google Trends confirms sustained growth with ${(gt.yoy_growth * 100).toFixed(0)}% YoY increase over 24 months.`)
  } else if (gt && gt.slope_24m > 0) {
    summaryParts.push(`Google Trends shows moderate upward interest over 24 months.`)
  }

  if (tiktok && (tiktok.total_views > 1000000 || tiktok.total_upvotes > 100000)) {
    const views = tiktok.total_views || tiktok.total_upvotes || 0
    summaryParts.push(`TikTok shows strong viral momentum with ${(views / 1000000).toFixed(1)}M ${tiktok.total_views ? 'views' : 'engagement'}.`)
  }

  if (amazon && amazon.review_count > 10000) {
    const sat = amazon.satisfaction_score || (amazon.avg_rating ? Math.round(amazon.avg_rating / 5 * 100) : 0)
    summaryParts.push(`Amazon confirms a healthy buyer base with ${(amazon.review_count / 1000).toFixed(0)}K+ reviews and ${sat}% satisfaction.`)
  }

  if (reddit && reddit.avg_intent_score < 0.3 && reddit.mention_count > 20) {
    summaryParts.push(`Reddit shows awareness but purchase intent is still moderate — community is discussing, not yet buying.`)
  } else if (reddit && reddit.avg_intent_score >= 0.3) {
    summaryParts.push(`Reddit shows active purchase consideration with strong intent signals.`)
  }

  if (summaryParts.length === 0) {
    summaryParts.push('Limited data across platforms. More pipeline runs needed to build a complete picture.')
  }

  // Per-platform one-liners
  function platformInsight(key) {
    const d = platformData[key]
    if (!d) return null

    switch (key) {
      case 'reddit': {
        if (d.sentiment_score < -0.2) return { text: 'Community has concerns — check negative posts for patterns', status: 'concern' }
        if (d.mention_count > 100 && d.avg_intent_score > 0.3) return { text: `Strong community interest with buying intent — ${d.mention_count} posts, ${d.high_intent_comment_count || 0} buy-intent comments`, status: 'good' }
        if (d.mention_count > 50 && d.avg_intent_score > 0.2) return { text: `Moderate discussion in awareness phase — ${d.mention_count} posts found`, status: 'watch' }
        if (d.velocity < -0.3) return { text: 'Discussion volume declining week over week', status: 'concern' }
        if (d.mention_count > 20) return { text: `${d.mention_count} posts found — early awareness building`, status: 'watch' }
        return { text: `${d.mention_count || 0} posts found — limited discussion`, status: 'watch' }
      }
      case 'tiktok': {
        const views = d.total_views || 0
        const mentions = d.mention_count || 0
        const avgViews = mentions > 0 ? views / mentions : 0
        if (views > 10000000) return { text: `Viral momentum confirmed — ${(views / 1000000).toFixed(1)}M total views across ${mentions} videos`, status: 'good' }
        if (avgViews > 500000) return { text: `High-reach content — averaging ${(avgViews / 1000).toFixed(0)}K views per video`, status: 'good' }
        if (d.creator_tier_score > 0.7) return { text: 'Macro creators featuring this product — strong signal', status: 'good' }
        if (views > 1000000) return { text: `${(views / 1000000).toFixed(1)}M total views — growing creator adoption`, status: 'watch' }
        return { text: `${mentions} videos found with ${(views / 1000).toFixed(0)}K total views`, status: 'watch' }
      }
      case 'instagram': {
        const mentions = d.mention_count || 0
        const avgEng = mentions > 0 ? (d.total_upvotes || 0) / mentions : 0
        if (d.avg_intent_score > 0.2) return { text: `Captions showing purchase consideration signals across ${mentions} posts`, status: 'good' }
        if (avgEng >= 50) return { text: `${mentions} posts with strong engagement found`, status: 'good' }
        if (avgEng < 10 && mentions > 0) return { text: 'Low engagement — product not resonating on Instagram yet', status: 'concern' }
        return { text: `${mentions} posts found — monitoring engagement levels`, status: 'watch' }
      }
      case 'amazon': {
        const parts = []
        let status = 'watch'
        const sat = d.satisfaction_score || 0
        if (sat > 85) { parts.push(`Buyers are very happy — ${d.five_star_pct?.toFixed(0) || '?'}% five star reviews`); status = 'good' }
        if (d.review_count > 50000) { parts.push(`${(d.review_count / 1000).toFixed(0)}K+ confirmed buyer base`); status = 'good' }
        if (d.one_star_pct > 10) { parts.push(`${d.one_star_pct?.toFixed(0)}% negative reviews — investigate quality`); status = 'concern' }
        if (d.review_velocity > 0) parts.push(`${d.review_velocity?.toLocaleString()} new reviews since last check`)
        if (d.bsr_trend === 'rising') parts.push('Climbing bestseller ranks')
        if (d.bsr_trend === 'declining') { parts.push('Falling bestseller ranks — sales may be slowing'); status = 'concern' }
        return { text: parts.join('. ') || `${d.review_count?.toLocaleString() || 0} reviews tracked`, status }
      }
      case 'google_trends': {
        const parts = []
        let status = 'watch'
        if (d.slope_24m > 0.005 && d.yoy_growth > 1) {
          parts.push(`Strong sustained growth — ${(d.yoy_growth * 100).toFixed(0)}% YoY increase over 24 months`)
          status = 'good'
        } else if (d.slope_24m > 0) {
          parts.push(`Moderate upward trend — ${(d.yoy_growth * 100).toFixed(0)}% YoY growth`)
          status = 'good'
        } else if (d.slope_24m < -0.003) {
          parts.push('Search interest declining — demand may be fading')
          status = 'concern'
        }
        if (!d.breakout_flag) parts.push('Not a fad — consistent long-term pattern')
        if (d.seasonal_pattern && d.seasonal_pattern !== 'none') parts.push(`Seasonal pattern: ${d.seasonal_pattern}`)
        return { text: parts.join('. ') || 'Trend data available', status }
      }
      default:
        return { text: `${d.mention_count || 0} data points collected`, status: 'watch' }
    }
  }

  const STATUS_DOT = {
    good: 'bg-emerald-500',
    watch: 'bg-amber-400',
    concern: 'bg-red-500',
  }

  const PLATFORM_LABELS = {
    reddit: 'Reddit', tiktok: 'TikTok', instagram: 'Instagram',
    amazon: 'Amazon', google_trends: 'Google Trends',
    youtube: 'YouTube', x: 'X', facebook: 'Facebook',
    pinterest: 'Pinterest', alibaba: 'Alibaba',
  }

  return (
    <div className={`rounded-xl border-l-4 ${borderColor} ${borderBg} border border-gray-200 dark:border-gray-700 p-5 mb-6`}>
      <p className="text-xs font-bold text-gray-900 dark:text-white mb-3">Intelligence Summary</p>

      {/* Overall verdict summary */}
      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
        {summaryParts.join(' ')}
      </p>

      {/* Per-platform one-liners */}
      <div className="space-y-1.5">
        {['google_trends', 'amazon', 'reddit', 'tiktok', 'instagram', 'youtube', 'facebook', 'pinterest', 'alibaba', 'x']
          .filter(key => platformData[key])
          .map(key => {
            const insight = platformInsight(key)
            if (!insight) return null
            return (
              <div key={key} className="flex items-start gap-2 text-xs">
                <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${STATUS_DOT[insight.status]}`} />
                <span className="font-medium text-gray-600 dark:text-gray-400 w-24 shrink-0">{PLATFORM_LABELS[key]}:</span>
                <span className="text-gray-700 dark:text-gray-300">{insight.text}</span>
              </div>
            )
          })}
      </div>
    </div>
  )
}

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  const vc = { buy: '#10b981', watch: '#f59e0b', pass: '#ef4444' }

  return (
    <div className="bg-[#111] border border-[#1a1a1a] p-3 text-xs max-w-60">
      <p className="font-bold text-white mb-1">{d.date}</p>
      {d.composite != null && (
        <div className="mb-1">
          <span className="font-bold tabular-nums" style={{ color: vc[d.verdict] || '#6b7280' }}>{d.composite?.toFixed(1)}</span>
          <span className="text-gray-400 ml-1">{d.verdict?.toUpperCase()}</span>
          <span className="text-gray-500 ml-2">{d.coverage || 0} platforms</span>
        </div>
      )}
      {d.gtInterest != null && !d.composite && (
        <p className="text-gray-400">GT Interest: <span className="text-[#7c8db5] font-medium">{d.gtInterest}</span> <span className="text-gray-500 italic">estimated</span></p>
      )}
      {d.socialSignal != null && (
        <div className="text-gray-400">
          <p>Social: <span className="text-[#a78bfa] font-medium">{d.socialSignal}</span></p>
          {d.redditCount > 0 && <p className="text-gray-500">Reddit: {d.redditCount} posts</p>}
          {d.tiktokCount > 0 && <p className="text-gray-500">TikTok: {d.tiktokCount} posts</p>}
          {d.instagramCount > 0 && <p className="text-gray-500">Instagram: {d.instagramCount} posts</p>}
        </div>
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
