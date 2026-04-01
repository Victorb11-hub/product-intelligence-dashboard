import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase.js'
import { agentApi } from '../lib/agentApi.js'
import LoadingSpinner from '../components/LoadingSpinner.jsx'

export default function FormulaStudio() {
  const [settings, setSettings] = useState({})
  const [weights, setWeights] = useState([])
  const [rules, setRules] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [recomputing, setRecomputing] = useState(false)

  const load = useCallback(async () => {
    const [sResp, wResp, rResp, pResp] = await Promise.all([
      supabase.from('scoring_settings').select('*'),
      supabase.from('agent_weights').select('*').order('agent'),
      supabase.from('formula_rules').select('*').order('created_at'),
      supabase.from('products').select('id, name').eq('active', true),
    ])
    const map = {}; (sResp.data || []).forEach(r => { map[r.setting_key] = r })
    setSettings(map)
    setWeights(wResp.data || [])
    setRules(rResp.data || [])
    setProducts(pResp.data || [])
    setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])

  const val = (key, fallback = 0) => settings[key]?.setting_value ?? fallback
  const updateSetting = async (key, value) => {
    const v = parseFloat(value); if (isNaN(v)) return
    await supabase.from('scoring_settings').update({ setting_value: v, updated_at: new Date().toISOString() }).eq('setting_key', key)
    setSettings(p => ({ ...p, [key]: { ...p[key], setting_value: v } }))
  }

  const recompute = async () => {
    setRecomputing(true)
    try { await agentApi.runSingle('scoring_recompute') } catch {}
    // Also try the pipeline endpoint
    try {
      await fetch('http://localhost:8000/run/pipeline', { method: 'POST' })
    } catch {}
    setTimeout(() => { setRecomputing(false); load() }, 5000)
  }

  if (loading) return <LoadingSpinner />

  const j1 = val('job1_weight', 0.30)
  const j2 = val('job2_weight', 0.30)
  const j3 = val('job3_weight', 0.25)
  const j4 = val('job4_weight', 0.15)
  const buyT = val('buy_threshold', 75)
  const watchT = val('watch_threshold', 55)

  return (
    <div className="p-4 md:p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">Formula Studio</h1>
          <p className="text-xs text-gray-500 mt-0.5">Single source of truth for the scoring system</p>
        </div>
        <button onClick={recompute} disabled={recomputing}
          className="px-4 py-1.5 bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 disabled:opacity-50">
          {recomputing ? 'Recomputing...' : 'Recompute All Scores'}
        </button>
      </div>

      {/* Formula summary */}
      <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-[#1a1a1a] p-4 mb-5">
        <p className="text-xs font-bold text-gray-900 dark:text-white mb-2">Current Formula</p>
        <p className="text-xs text-gray-500 font-mono leading-relaxed">
          Job 1 ({(j1*100).toFixed(0)}%) + Job 2 ({(j2*100).toFixed(0)}%) + Job 3 ({(j3*100).toFixed(0)}%) + Job 4 ({(j4*100).toFixed(0)}%) × Coverage Penalty × Quality = Composite
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Buy ≥ {buyT.toFixed(0)} · Watch ≥ {watchT.toFixed(0)} · Pass &lt; {watchT.toFixed(0)} · Applied to {products.length} active products
        </p>
      </div>

      {/* Section 1: The 4 Jobs */}
      <Section title="Scoring Jobs">
        <JobsPanel settings={settings} val={val} updateSetting={updateSetting} />
      </Section>

      {/* Section 2: Verdict Thresholds */}
      <Section title="Verdict Thresholds">
        <ThresholdsPanel buyT={buyT} watchT={watchT} updateSetting={updateSetting} />
      </Section>

      {/* Section 3: Signal Weights */}
      <Section title="Signal Weights">
        <SignalWeightsPanel weights={weights} onUpdate={load} />
      </Section>

      {/* Section 4: Override Rules */}
      <Section title="Override Rules">
        <RulesPanel rules={rules} onUpdate={load} />
      </Section>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="mb-5">
      <h2 className="text-xs font-bold text-gray-900 dark:text-white mb-3 uppercase tracking-wide">{title}</h2>
      {children}
    </div>
  )
}

// ═══════════════════════════════════
// SECTION 1 — THE 4 JOBS
// ═══════════════════════════════════
const JOBS = [
  { key: 'job1_weight', name: 'Early Detection', desc: 'Social signals from TikTok, Instagram, YouTube, X, Pinterest',
    platforms: [
      { name: 'TikTok', weightKey: 'job1_tiktok', defaultW: 40, status: 'inactive' },
      { name: 'Instagram', weightKey: 'job1_instagram', defaultW: 30, status: 'inactive' },
      { name: 'YouTube', weightKey: 'job1_youtube', defaultW: 15, status: 'inactive' },
      { name: 'X', weightKey: 'job1_x', defaultW: 10, status: 'inactive' },
      { name: 'Pinterest', weightKey: 'job1_pinterest', defaultW: 5, status: 'inactive' },
    ]},
  { key: 'job2_weight', name: 'Demand Validation', desc: 'Search and community signals confirming real demand',
    platforms: [
      { name: 'Google Trends', weightKey: 'job2_gt', defaultW: 45, status: 'active' },
      { name: 'Reddit', weightKey: 'job2_reddit', defaultW: 35, status: 'active' },
      { name: 'Facebook', weightKey: 'job2_facebook', defaultW: 20, status: 'inactive' },
    ]},
  { key: 'job3_weight', name: 'Purchase Intent', desc: 'Retail marketplace signals showing actual buying behavior',
    platforms: [
      { name: 'Amazon', weightKey: 'job3_amazon', defaultW: 50, status: 'inactive' },
      { name: 'Etsy', weightKey: 'job3_etsy', defaultW: 30, status: 'inactive' },
      { name: 'Walmart', weightKey: 'job3_walmart', defaultW: 20, status: 'inactive' },
    ]},
  { key: 'job4_weight', name: 'Supply Readiness', desc: 'Supplier ecosystem health and sourcing window timing',
    platforms: [
      { name: 'Alibaba', weightKey: 'job4_alibaba', defaultW: 100, status: 'inactive' },
    ]},
]

function JobsPanel({ settings, val, updateSetting }) {
  const [expanded, setExpanded] = useState(null)
  const sum = val('job1_weight', 0.3) + val('job2_weight', 0.3) + val('job3_weight', 0.25) + val('job4_weight', 0.15)

  return (
    <div className="space-y-2">
      {JOBS.map(job => {
        const w = val(job.key, 0.25)
        const activePlats = job.platforms.filter(p => p.status === 'active').length
        const isOpen = expanded === job.key
        return (
          <div key={job.key} className="bg-white dark:bg-[#111] border border-gray-200 dark:border-[#1a1a1a]">
            <div className="flex items-center gap-3 p-3 cursor-pointer" onClick={() => setExpanded(isOpen ? null : job.key)}>
              <span className="text-gray-400 text-xs">{isOpen ? '▼' : '▶'}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-900 dark:text-white">{job.name}</span>
                  <span className="text-[10px] text-gray-400">{activePlats}/{job.platforms.length} platforms active</span>
                </div>
                <p className="text-[11px] text-gray-500 mt-0.5">{job.desc}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <input type="range" min={0} max={0.5} step={0.05} value={w}
                  onClick={e => e.stopPropagation()}
                  onChange={e => updateSetting(job.key, e.target.value)}
                  className="w-20 accent-indigo-600 h-1" />
                <span className="text-xs font-bold text-gray-900 dark:text-white tabular-nums w-10 text-right">{(w * 100).toFixed(0)}%</span>
              </div>
            </div>
            {isOpen && (
              <div className="border-t border-gray-100 dark:border-[#1a1a1a] p-3 space-y-1">
                {job.platforms.map(plat => (
                  <div key={plat.name} className="flex items-center justify-between py-1.5 px-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 ${plat.status === 'active' ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                      <span className="text-xs text-gray-700 dark:text-gray-300">{plat.name}</span>
                      <span className={`text-[9px] font-bold uppercase ${plat.status === 'active' ? 'text-emerald-600' : 'text-gray-400'}`}>{plat.status}</span>
                    </div>
                    <span className="text-xs text-gray-500 tabular-nums">{plat.defaultW}% of job</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
      <p className={`text-[10px] tabular-nums ${Math.abs(sum - 1.0) < 0.01 ? 'text-emerald-600' : 'text-red-500 font-bold'}`}>
        Sum: {(sum * 100).toFixed(0)}% {Math.abs(sum - 1.0) >= 0.01 ? '— must equal 100%' : '✓'}
      </p>
    </div>
  )
}

// ═══════════════════════════════════
// SECTION 2 — VERDICT THRESHOLDS
// ═══════════════════════════════════
function ThresholdsPanel({ buyT, watchT, updateSetting }) {
  return (
    <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-[#1a1a1a] p-4">
      {/* Visual bar */}
      <div className="relative h-8 mb-4 flex">
        <div className="bg-red-400/30 dark:bg-red-900/30 flex-1" style={{ flexBasis: `${watchT}%` }}>
          <span className="text-[10px] font-bold text-red-600 dark:text-red-400 absolute left-2 top-1.5">PASS</span>
        </div>
        <div className="bg-amber-400/30 dark:bg-amber-900/30 flex-1" style={{ flexBasis: `${buyT - watchT}%` }}>
          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 absolute top-1.5" style={{ left: `${(watchT + buyT) / 2}%`, transform: 'translateX(-50%)' }}>WATCH</span>
        </div>
        <div className="bg-emerald-400/30 dark:bg-emerald-900/30 flex-1" style={{ flexBasis: `${100 - buyT}%` }}>
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 absolute right-2 top-1.5">BUY</span>
        </div>
        {/* Threshold markers */}
        <div className="absolute top-0 bottom-0 w-px bg-amber-500" style={{ left: `${watchT}%` }}>
          <span className="absolute -top-4 -translate-x-1/2 text-[10px] font-bold text-amber-600 tabular-nums">{watchT.toFixed(0)}</span>
        </div>
        <div className="absolute top-0 bottom-0 w-px bg-emerald-500" style={{ left: `${buyT}%` }}>
          <span className="absolute -top-4 -translate-x-1/2 text-[10px] font-bold text-emerald-600 tabular-nums">{buyT.toFixed(0)}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-[11px] text-gray-500">Watch Threshold</label>
          <div className="flex items-center gap-2 mt-1">
            <input type="range" min={30} max={74} step={1} value={watchT}
              onChange={e => updateSetting('watch_threshold', e.target.value)} className="flex-1 accent-amber-500 h-1" />
            <input type="number" value={watchT.toFixed(0)} onChange={e => updateSetting('watch_threshold', e.target.value)}
              className="w-14 text-xs text-center border border-gray-300 dark:border-[#1a1a1a] py-1 bg-white dark:bg-[#111] text-gray-900 dark:text-white" />
          </div>
        </div>
        <div>
          <label className="text-[11px] text-gray-500">Buy Threshold</label>
          <div className="flex items-center gap-2 mt-1">
            <input type="range" min={55} max={95} step={1} value={buyT}
              onChange={e => updateSetting('buy_threshold', e.target.value)} className="flex-1 accent-emerald-500 h-1" />
            <input type="number" value={buyT.toFixed(0)} onChange={e => updateSetting('buy_threshold', e.target.value)}
              className="w-14 text-xs text-center border border-gray-300 dark:border-[#1a1a1a] py-1 bg-white dark:bg-[#111] text-gray-900 dark:text-white" />
          </div>
        </div>
      </div>

      <p className="text-[11px] text-gray-400 mt-3 leading-relaxed">
        A product scoring above <strong>{buyT.toFixed(0)}</strong> is recommended for sourcing.
        Between <strong>{watchT.toFixed(0)}</strong> and <strong>{buyT.toFixed(0)}</strong> means watch but do not act yet.
        Below <strong>{watchT.toFixed(0)}</strong> means insufficient signal.
      </p>
    </div>
  )
}

// ═══════════════════════════════════
// SECTION 3 — SIGNAL WEIGHTS
// ═══════════════════════════════════
function SignalWeightsPanel({ weights, onUpdate }) {
  const updateWeight = async (id, newW) => {
    await supabase.from('agent_weights').update({ learned_weight: newW }).eq('id', id)
    onUpdate()
  }

  const grouped = {}
  weights.forEach(w => {
    if (!grouped[w.agent]) grouped[w.agent] = []
    grouped[w.agent].push(w)
  })

  const AGENT_LABELS = {
    reddit: 'Reddit', tiktok: 'TikTok', instagram: 'Instagram', x: 'X',
    facebook: 'Facebook', youtube: 'YouTube', google_trends: 'Google Trends',
    amazon: 'Amazon', walmart: 'Walmart', etsy: 'Etsy', alibaba: 'Alibaba', pinterest: 'Pinterest',
  }

  return (
    <div className="space-y-3">
      {Object.entries(grouped).map(([agent, signals]) => (
        <div key={agent} className="bg-white dark:bg-[#111] border border-gray-200 dark:border-[#1a1a1a] p-3">
          <p className="text-xs font-bold text-gray-900 dark:text-white mb-2">{AGENT_LABELS[agent] || agent}</p>
          <div className="space-y-1">
            {signals.map(s => {
              const drifted = Math.abs(s.learned_weight - s.base_weight) > 0.01
              return (
                <div key={s.id} className="flex items-center gap-3 py-1">
                  <span className="text-[11px] text-gray-600 dark:text-gray-400 w-40 shrink-0">{s.signal_name.replace(/_/g, ' ')}</span>
                  <input type="range" min={0.5} max={2.0} step={0.05} value={s.learned_weight}
                    onChange={e => updateWeight(s.id, parseFloat(e.target.value))}
                    className="flex-1 accent-indigo-600 h-1" />
                  <span className={`text-xs font-bold tabular-nums w-10 text-right ${drifted ? 'text-amber-600' : 'text-gray-900 dark:text-white'}`}>
                    {s.learned_weight.toFixed(2)}
                  </span>
                  {drifted && <span className="text-[9px] text-amber-500">({s.base_weight.toFixed(2)})</span>}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// ═══════════════════════════════════
// SECTION 4 — OVERRIDE RULES
// ═══════════════════════════════════
function RulesPanel({ rules, onUpdate }) {
  const toggleRule = async (id, enabled) => {
    await supabase.from('formula_rules').update({ enabled: !enabled }).eq('id', id)
    onUpdate()
  }
  const updateRule = async (id, field, value) => {
    await supabase.from('formula_rules').update({ [field]: parseFloat(value) }).eq('id', id)
    onUpdate()
  }

  return (
    <div className="space-y-2">
      {rules.map((r, i) => (
        <div key={r.id} className={`bg-white dark:bg-[#111] border border-gray-200 dark:border-[#1a1a1a] p-3 ${!r.enabled ? 'opacity-50' : ''}`}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-900 dark:text-white">Rule {i + 1}: {r.rule_name}</span>
              <span className={`text-[9px] font-bold uppercase ${r.rule_type === 'force_verdict' ? 'text-red-500' : 'text-emerald-500'}`}>{r.rule_type === 'force_verdict' ? 'OVERRIDE' : 'BONUS'}</span>
            </div>
            <button onClick={() => toggleRule(r.id, r.enabled)}
              className={`w-8 h-4 relative transition-colors ${r.enabled ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
              <span className={`absolute top-0.5 w-3 h-3 bg-white transition-transform ${r.enabled ? 'left-4' : 'left-0.5'}`} />
            </button>
          </div>
          <p className="text-[11px] text-gray-500 mb-2">{r.rule_description}</p>
          <div className="flex items-center gap-4 text-[11px]">
            {r.threshold_value !== 0 && r.threshold_value != null && (
              <div className="flex items-center gap-1">
                <span className="text-gray-400">Threshold:</span>
                <input type="number" step="0.1" value={r.threshold_value}
                  onChange={e => updateRule(r.id, 'threshold_value', e.target.value)}
                  className="w-16 text-xs text-center border border-gray-300 dark:border-[#1a1a1a] py-0.5 bg-white dark:bg-[#111] text-gray-900 dark:text-white" />
              </div>
            )}
            {r.adjustment_value !== 0 && r.adjustment_value != null && (
              <div className="flex items-center gap-1">
                <span className="text-gray-400">Adjustment:</span>
                <input type="number" step="1" value={r.adjustment_value}
                  onChange={e => updateRule(r.id, 'adjustment_value', e.target.value)}
                  className="w-16 text-xs text-center border border-gray-300 dark:border-[#1a1a1a] py-0.5 bg-white dark:bg-[#111] text-gray-900 dark:text-white" />
                <span className="text-gray-400">pts</span>
              </div>
            )}
            {r.trigger_count > 0 && (
              <span className="text-gray-400">Triggered {r.trigger_count}x</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
