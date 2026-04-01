import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase.js'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import EmptyState from '../components/EmptyState.jsx'

const AGENTS = [
  { key: 'trend_archaeologist', label: 'Trend Archaeologist', spec: 'Slope shapes & velocity curves' },
  { key: 'demand_validator', label: 'Demand Validator', spec: 'Purchase intent vs noise' },
  { key: 'supply_analyst', label: 'Supply Chain Analyst', spec: 'Margins & supply readiness' },
  { key: 'fad_detector', label: 'Fad Detector', spec: 'Contrarian — finds misleading signals' },
  { key: 'category_strategist', label: 'Category Strategist', spec: 'Category lifecycle & timing' },
]

const VOTE_COLORS = {
  buy: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
  watch: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
  pass: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  abstain: 'bg-gray-100 dark:bg-gray-800 text-gray-500',
}

export default function ResearchCouncil() {
  const [activeTab, setActiveTab] = useState('verdicts')

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Research Council</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">5 AI specialists deliberate on each product</p>
      </div>

      <div className="flex gap-1 mb-5 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 w-fit">
        {[{ id: 'verdicts', label: 'Verdicts' }, { id: 'agents', label: 'Agents' }, { id: 'override', label: 'Victor Override' }, { id: 'recommendations', label: 'Recommendations' }].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-400'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'verdicts' && <VerdictsPanel />}
      {activeTab === 'agents' && <AgentsPanel />}
      {activeTab === 'override' && <OverridePanel />}
      {activeTab === 'recommendations' && <RecommendationsPanel />}
    </div>
  )
}

function VerdictsPanel() {
  const [verdicts, setVerdicts] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    supabase.from('council_verdicts').select('*, products(name)')
      .order('verdict_date', { ascending: false }).limit(20)
      .then(({ data }) => { setVerdicts(data || []); setLoading(false) })
  }, [])

  if (loading) return <LoadingSpinner />
  if (!verdicts.length) return <EmptyState title="No council sessions" description="Run the pipeline to generate council verdicts." />

  return (
    <div className="space-y-4">
      {verdicts.map(v => (
        <div key={v.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between mb-3 cursor-pointer" onClick={() => setExpanded(expanded === v.id ? null : v.id)}>
            <div>
              <span className="font-semibold text-gray-900 dark:text-white text-[15px]">{v.products?.name || '—'}</span>
              <span className="text-xs text-gray-400 ml-3">{v.verdict_date}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">{v.votes_for_buy}-{v.votes_for_watch}-{v.votes_for_pass}</span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${VOTE_COLORS[v.council_verdict] || VOTE_COLORS.watch}`}>{v.council_verdict}</span>
              <span className="text-gray-400">{expanded === v.id ? '▼' : '▶'}</span>
            </div>
          </div>

          {v.dissent_from_composite && (
            <div className="mb-3 px-3 py-2 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-700 dark:text-red-300">
              Disagrees with composite score — {v.dissent_reasoning}
            </div>
          )}

          {expanded === v.id && (
            <div className="space-y-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              {AGENTS.map(agent => {
                const vote = v[`${agent.key}_vote`]
                const confidence = v[`${agent.key}_confidence`]
                const reasoning = v[`${agent.key}_reasoning`]
                const r2_vote = v[`${agent.key}_round2_vote`]
                const r2_reasoning = v[`${agent.key}_round2_reasoning`]
                if (!vote) return null

                return (
                  <div key={agent.key} className="pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{agent.label}</span>
                      <span className={`px-2 py-0.5 text-xs font-bold rounded-full uppercase ${VOTE_COLORS[vote?.toLowerCase()] || ''}`}>{vote}</span>
                      {confidence != null && <span className="text-xs text-gray-400">{confidence}%</span>}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{reasoning}</p>
                    {r2_vote && (
                      <div className="mt-2 pl-3 border-l-2 border-indigo-300 dark:border-indigo-700">
                        <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">Round 2: {r2_vote}</p>
                        <p className="text-xs text-gray-500">{r2_reasoning}</p>
                      </div>
                    )}
                  </div>
                )
              })}

              {v.victor_vote && (
                <div className="pl-4 border-l-2 border-yellow-400">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-yellow-700 dark:text-yellow-400">Victor Override</span>
                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full uppercase ${VOTE_COLORS[v.victor_vote?.toLowerCase()] || ''}`}>{v.victor_vote}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{v.victor_reasoning}</p>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function AgentsPanel() {
  const [weights, setWeights] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const { data } = await supabase.from('council_weights').select('*').order('agent_name')
    setWeights(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const updateWeight = async (id, newWeight) => {
    await supabase.from('council_weights').update({ current_weight: newWeight }).eq('id', id)
    load()
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {weights.map(w => {
        const meta = AGENTS.find(a => a.key === w.agent_name) || { label: w.agent_name, spec: '' }
        return (
          <div key={w.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm">{meta.label}</h3>
            <p className="text-xs text-gray-500 mb-3">{meta.spec}</p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-gray-500">Weight</span><span className="font-mono font-bold">{w.current_weight.toFixed(2)}</span></div>
              <input type="range" min="0.5" max="2.0" step="0.05" value={w.current_weight}
                onChange={e => updateWeight(w.id, parseFloat(e.target.value))}
                className="w-full accent-indigo-600" />
              <div className="flex justify-between"><span className="text-gray-500">Accuracy</span><span>{(w.accuracy_rate * 100).toFixed(0)}%</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Decisions</span><span>{w.total_decisions}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Base weight</span><span>{w.base_weight.toFixed(2)}</span></div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function OverridePanel() {
  const [products, setProducts] = useState([])
  const [selected, setSelected] = useState('')
  const [vote, setVote] = useState('')
  const [reasoning, setReasoning] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.from('products').select('id, name').eq('active', true)
      .then(({ data }) => setProducts(data || []))
  }, [])

  const submit = async () => {
    if (!selected || !vote) return
    setSaving(true)
    // Find latest council verdict for this product and update victor fields
    const { data } = await supabase.from('council_verdicts').select('id')
      .eq('product_id', selected).order('verdict_date', { ascending: false }).limit(1)
    if (data && data[0]) {
      await supabase.from('council_verdicts').update({
        victor_vote: vote, victor_reasoning: reasoning,
        final_verdict: vote.toLowerCase(),
      }).eq('id', data[0].id)
    }
    setSaving(false)
    setVote(''); setReasoning('')
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 max-w-lg">
      <h3 className="font-bold text-gray-900 dark:text-white mb-4">Victor Override</h3>
      <div className="space-y-3">
        <select value={selected} onChange={e => setSelected(e.target.value)} className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
          <option value="">Select product...</option>
          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <div className="flex gap-2">
          {['Buy', 'Watch', 'Pass'].map(v => (
            <button key={v} onClick={() => setVote(v)}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${vote === v ? VOTE_COLORS[v.toLowerCase()]?.replace('text-', 'text-') + ' ring-2 ring-indigo-500' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
              {v}
            </button>
          ))}
        </div>
        <textarea value={reasoning} onChange={e => setReasoning(e.target.value)} rows={3} placeholder="Reasoning..."
          className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none" />
        <button onClick={submit} disabled={saving || !selected || !vote}
          className="w-full py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 disabled:opacity-50">
          {saving ? 'Saving...' : 'Submit Override'}
        </button>
      </div>
    </div>
  )
}

function RecommendationsPanel() {
  const [recs, setRecs] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const { data } = await supabase.from('formula_recommendations').select('*, products(name)').order('created_at', { ascending: false }).limit(50)
    setRecs(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const updateStatus = async (id, status) => {
    await supabase.from('formula_recommendations').update({ victor_decision: status, status }).eq('id', id)
    load()
  }

  if (loading) return <LoadingSpinner />
  if (!recs.length) return <EmptyState title="No recommendations" description="Council agents will submit formula recommendations during deliberation." />

  return (
    <div className="space-y-3">
      {recs.map(r => (
        <div key={r.id} className={`bg-white dark:bg-gray-900 rounded-xl border p-4 ${r.status === 'pending' ? 'border-amber-300 dark:border-amber-700' : 'border-gray-200 dark:border-gray-700'}`}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-bold text-gray-900 dark:text-white">{r.agent_name?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>
            <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">{r.recommendation_type?.replace(/_/g, ' ')}</span>
            {r.status === 'pending' && <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-700">PENDING REVIEW</span>}
            {r.status === 'accepted' && <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-700">ACCEPTED</span>}
            {r.status === 'rejected' && <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-100 text-red-700">REJECTED</span>}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{r.reasoning}</p>
          <div className="flex gap-4 text-xs text-gray-500 mb-2">
            <span>Current: {r.current_value}</span>
            <span>Recommended: {r.recommended_value}</span>
            <span>Confidence: {r.confidence}%</span>
          </div>
          {r.status === 'pending' && (
            <div className="flex gap-2">
              <button onClick={() => updateStatus(r.id, 'accepted')} className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-medium">Accept</button>
              <button onClick={() => updateStatus(r.id, 'rejected')} className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">Reject</button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
