import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase.js'
import LoadingSpinner from '../components/LoadingSpinner.jsx'

export default function Settings() {
  const [tab, setTab] = useState('email')
  const tabs = [
    { id: 'email', label: 'Email' }, { id: 'users', label: 'Users' },
    { id: 'scoring', label: 'Scoring' }, { id: 'pipeline', label: 'Pipeline' },
    { id: 'data', label: 'Data' }, { id: 'about', label: 'About' },
  ]
  return (
    <div className="p-4 md:p-6">
      <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight mb-4">Settings</h1>
      <div className="flex gap-px mb-5 border-b border-gray-200 dark:border-[#1a1a1a]">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-xs font-medium transition-colors ${tab === t.id ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500 -mb-px' : 'text-gray-500 hover:text-gray-700'}`}>{t.label}</button>
        ))}
      </div>
      {tab === 'email' && <EmailSection />}
      {tab === 'users' && <UsersSection />}
      {tab === 'scoring' && <ScoringSection />}
      {tab === 'pipeline' && <PipelineSection />}
      {tab === 'data' && <DataSection />}
      {tab === 'about' && <AboutSection />}
    </div>
  )
}

// ── EMAIL ──
function EmailSection() {
  const [recipients, setRecipients] = useState([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState(''); const [email, setEmail] = useState('')

  const load = useCallback(async () => {
    const { data } = await supabase.from('email_settings').select('*').order('added_at', { ascending: false })
    setRecipients(data || []); setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])

  const add = async (e) => {
    e.preventDefault(); if (!email.trim()) return
    await supabase.from('email_settings').insert({ name: name.trim(), email_address: email.trim() })
    setName(''); setEmail(''); load()
  }
  const toggle = async (id, field, val) => { await supabase.from('email_settings').update({ [field]: !val }).eq('id', id); load() }
  const remove = async (id) => { await supabase.from('email_settings').delete().eq('id', id); load() }

  if (loading) return <LoadingSpinner />
  return (
    <div>
      <form onSubmit={add} className="flex gap-2 mb-4">
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Name" className="flex-1 text-xs border border-gray-300 dark:border-[#1a1a1a] px-3 py-1.5 bg-white dark:bg-[#111] text-gray-900 dark:text-white" />
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" type="email" required className="flex-1 text-xs border border-gray-300 dark:border-[#1a1a1a] px-3 py-1.5 bg-white dark:bg-[#111] text-gray-900 dark:text-white" />
        <button type="submit" className="px-4 py-1.5 bg-indigo-600 text-white text-xs font-bold">Add</button>
      </form>
      {recipients.length === 0 ? <p className="text-xs text-gray-400">No recipients yet.</p> : (
        <table className="w-full text-xs">
          <thead><tr className="border-b border-gray-200 dark:border-[#1a1a1a] text-gray-500">
            <th className="text-left py-2 px-2">Name</th><th className="text-left py-2 px-2">Email</th>
            <th className="text-center py-2 px-2">Daily</th><th className="text-center py-2 px-2">Monthly</th>
            <th className="text-center py-2 px-2">Quarterly</th><th className="text-center py-2 px-2">Active</th><th className="py-2 px-2"></th>
          </tr></thead>
          <tbody>{recipients.map(r => (
            <tr key={r.id} className="border-b border-gray-100 dark:border-[#1a1a1a]">
              <td className="py-2 px-2 text-gray-900 dark:text-white">{r.name || '—'}</td>
              <td className="py-2 px-2 text-gray-500">{r.email_address}</td>
              <td className="py-2 px-2 text-center"><Toggle on={r.receive_daily} onClick={() => toggle(r.id, 'receive_daily', r.receive_daily)} /></td>
              <td className="py-2 px-2 text-center"><Toggle on={r.receive_monthly} onClick={() => toggle(r.id, 'receive_monthly', r.receive_monthly)} /></td>
              <td className="py-2 px-2 text-center"><Toggle on={r.receive_quarterly} onClick={() => toggle(r.id, 'receive_quarterly', r.receive_quarterly)} /></td>
              <td className="py-2 px-2 text-center"><Toggle on={r.active} onClick={() => toggle(r.id, 'active', r.active)} /></td>
              <td className="py-2 px-2"><button onClick={() => remove(r.id)} className="text-red-500 text-[10px]">Remove</button></td>
            </tr>
          ))}</tbody>
        </table>
      )}
    </div>
  )
}

// ── USERS ──
function UsersSection() {
  const [users, setUsers] = useState([]); const [loading, setLoading] = useState(true)
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [role, setRole] = useState('viewer')

  const load = useCallback(async () => {
    const { data } = await supabase.from('dashboard_users').select('*').order('added_at', { ascending: false })
    setUsers(data || []); setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])

  const add = async (e) => {
    e.preventDefault(); if (!email.trim() || !name.trim()) return
    await supabase.from('dashboard_users').insert({ name: name.trim(), email: email.trim(), role })
    setName(''); setEmail(''); setRole('viewer'); load()
  }
  const remove = async (id) => { await supabase.from('dashboard_users').delete().eq('id', id); load() }

  const ROLE_COLORS = { owner: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300', analyst: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300', viewer: 'bg-gray-100 dark:bg-gray-800 text-gray-500' }

  if (loading) return <LoadingSpinner />
  return (
    <div>
      <form onSubmit={add} className="flex gap-2 mb-4">
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Name" required className="flex-1 text-xs border border-gray-300 dark:border-[#1a1a1a] px-3 py-1.5 bg-white dark:bg-[#111] text-gray-900 dark:text-white" />
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" type="email" required className="flex-1 text-xs border border-gray-300 dark:border-[#1a1a1a] px-3 py-1.5 bg-white dark:bg-[#111] text-gray-900 dark:text-white" />
        <select value={role} onChange={e => setRole(e.target.value)} className="text-xs border border-gray-300 dark:border-[#1a1a1a] px-3 py-1.5 bg-white dark:bg-[#111] text-gray-900 dark:text-white">
          <option value="owner">Owner</option><option value="analyst">Analyst</option><option value="viewer">Viewer</option>
        </select>
        <button type="submit" className="px-4 py-1.5 bg-indigo-600 text-white text-xs font-bold">Add</button>
      </form>
      {users.length === 0 ? <p className="text-xs text-gray-400">No users yet.</p> : (
        <div className="space-y-2">{users.map(u => (
          <div key={u.id} className="flex items-center justify-between p-3 bg-white dark:bg-[#111] border border-gray-200 dark:border-[#1a1a1a]">
            <div>
              <span className="text-xs font-bold text-gray-900 dark:text-white">{u.name}</span>
              <span className="text-xs text-gray-400 ml-2">{u.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 text-[10px] font-bold uppercase ${ROLE_COLORS[u.role] || ROLE_COLORS.viewer}`}>{u.role}</span>
              <button onClick={() => remove(u.id)} className="text-red-500 text-[10px]">Remove</button>
            </div>
          </div>
        ))}</div>
      )}
      <div className="mt-4 text-[11px] text-gray-400 space-y-1">
        <p><strong>Owner:</strong> Full access — settings, scoring, agents, sourcing</p>
        <p><strong>Analyst:</strong> View all, add products, log sourcing, submit council votes</p>
        <p><strong>Viewer:</strong> Read-only — see all data but cannot change anything</p>
      </div>
    </div>
  )
}

// ── SCORING ──
function ScoringSection() {
  const [settings, setSettings] = useState({}); const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const { data } = await supabase.from('scoring_settings').select('*')
    const map = {}; (data || []).forEach(r => { map[r.setting_key] = r })
    setSettings(map); setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])

  const update = async (key, value) => {
    const v = parseFloat(value); if (isNaN(v)) return
    await supabase.from('scoring_settings').update({ setting_value: v, updated_at: new Date().toISOString() }).eq('setting_key', key)
    setSettings(p => ({ ...p, [key]: { ...p[key], setting_value: v } }))
  }

  const val = (key) => settings[key]?.setting_value ?? 0

  if (loading) return <LoadingSpinner />
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xs font-bold text-gray-900 dark:text-white mb-3">Job Weights (must sum to 100%)</h3>
        <div className="space-y-2">
          {[['job1_weight', 'Job 1 — Early Detection'], ['job2_weight', 'Job 2 — Demand Validation'], ['job3_weight', 'Job 3 — Purchase Intent'], ['job4_weight', 'Job 4 — Supply Readiness']].map(([key, label]) => (
            <SettingSlider key={key} label={label} value={val(key)} min={0} max={1} step={0.05} format={v => `${(v * 100).toFixed(0)}%`} onChange={v => update(key, v)} />
          ))}
          <p className="text-[10px] text-gray-400">Current sum: {((val('job1_weight') + val('job2_weight') + val('job3_weight') + val('job4_weight')) * 100).toFixed(0)}%</p>
        </div>
      </div>
      <div>
        <h3 className="text-xs font-bold text-gray-900 dark:text-white mb-3">Verdict Thresholds</h3>
        <div className="space-y-2">
          <SettingSlider label="Buy threshold" value={val('buy_threshold')} min={50} max={95} step={1} format={v => v.toFixed(0)} onChange={v => update('buy_threshold', v)} />
          <SettingSlider label="Watch threshold" value={val('watch_threshold')} min={30} max={74} step={1} format={v => v.toFixed(0)} onChange={v => update('watch_threshold', v)} />
        </div>
      </div>
      <div>
        <h3 className="text-xs font-bold text-gray-900 dark:text-white mb-3">Recency Weights</h3>
        <div className="space-y-2">
          {[['recency_0_7', '0–7 days'], ['recency_8_14', '8–14 days'], ['recency_15_21', '15–21 days'], ['recency_22_30', '22–30 days']].map(([key, label]) => (
            <SettingSlider key={key} label={label} value={val(key)} min={0} max={1} step={0.05} format={v => v.toFixed(2)} onChange={v => update(key, v)} />
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-xs font-bold text-gray-900 dark:text-white mb-3">Other</h3>
        <SettingSlider label="Lookback window (days)" value={val('lookback_days')} min={7} max={90} step={1} format={v => v.toFixed(0)} onChange={v => update('lookback_days', v)} />
        <SettingSlider label="Relevance filter threshold" value={val('relevance_threshold')} min={0} max={0.5} step={0.05} format={v => v.toFixed(2)} onChange={v => update('relevance_threshold', v)} />
      </div>
    </div>
  )
}

// ── PIPELINE ──
function PipelineSection() {
  const [settings, setSettings] = useState({}); const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const { data } = await supabase.from('scoring_settings').select('*')
    const map = {}; (data || []).forEach(r => { map[r.setting_key] = r })
    setSettings(map); setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])

  const update = async (key, value) => {
    const v = parseFloat(value); if (isNaN(v)) return
    await supabase.from('scoring_settings').update({ setting_value: v, updated_at: new Date().toISOString() }).eq('setting_key', key)
    setSettings(p => ({ ...p, [key]: { ...p[key], setting_value: v } }))
  }
  const val = (key) => settings[key]?.setting_value ?? 0
  const boolVal = (key) => (settings[key]?.setting_value ?? 1) === 1

  if (loading) return <LoadingSpinner />
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xs font-bold text-gray-900 dark:text-white mb-3">Nightly Run Time</h3>
        <div className="flex items-center gap-3">
          <SettingSlider label="Hour (0–23)" value={val('nightly_run_hour')} min={0} max={23} step={1} format={v => `${v.toFixed(0).padStart(2, '0')}:00`} onChange={v => update('nightly_run_hour', v)} />
        </div>
      </div>
      <div>
        <h3 className="text-xs font-bold text-gray-900 dark:text-white mb-3">Budget & Limits</h3>
        <SettingSlider label="Monthly Apify budget ($)" value={val('monthly_budget')} min={5} max={100} step={5} format={v => `$${v.toFixed(0)}`} onChange={v => update('monthly_budget', v)} />
        <SettingSlider label="Max posts per product per run" value={val('max_posts_per_product')} min={50} max={2000} step={50} format={v => v.toFixed(0)} onChange={v => update('max_posts_per_product', v)} />
        <SettingSlider label="Max comments per post" value={val('max_comments_per_post')} min={10} max={500} step={10} format={v => v.toFixed(0)} onChange={v => update('max_comments_per_post', v)} />
      </div>
      <div>
        <h3 className="text-xs font-bold text-gray-900 dark:text-white mb-3">Notification Toggles</h3>
        <div className="space-y-2">
          {[['alert_verdict_change', 'Alert on verdict change'], ['alert_score_move_10', 'Alert on score movement >10 points'], ['alert_unanimous_buy', 'Alert on unanimous Buy'], ['alert_budget_75', 'Alert on budget 75%']].map(([key, label]) => (
            <div key={key} className="flex items-center justify-between py-1">
              <span className="text-xs text-gray-600 dark:text-gray-400">{label}</span>
              <Toggle on={boolVal(key)} onClick={() => update(key, boolVal(key) ? 0 : 1)} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── DATA ──
function DataSection() {
  const [settings, setSettings] = useState({}); const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const { data } = await supabase.from('scoring_settings').select('*')
    const map = {}; (data || []).forEach(r => { map[r.setting_key] = r })
    setSettings(map); setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])

  const update = async (key, value) => {
    const v = parseFloat(value); if (isNaN(v)) return
    await supabase.from('scoring_settings').update({ setting_value: v, updated_at: new Date().toISOString() }).eq('setting_key', key)
    setSettings(p => ({ ...p, [key]: { ...p[key], setting_value: v } }))
  }
  const val = (key) => settings[key]?.setting_value ?? 0
  const boolVal = (key) => (settings[key]?.setting_value ?? 1) === 1

  if (loading) return <LoadingSpinner />
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between py-2">
        <div><span className="text-xs font-medium text-gray-900 dark:text-white">Duplicate Detection</span><p className="text-[10px] text-gray-400">Skip posts already in the database</p></div>
        <Toggle on={boolVal('duplicate_detection')} onClick={() => update('duplicate_detection', boolVal('duplicate_detection') ? 0 : 1)} />
      </div>
      <SettingSlider label="Auto-archive posts older than (days)" value={val('auto_archive_days')} min={30} max={365} step={15} format={v => `${v.toFixed(0)} days`} onChange={v => update('auto_archive_days', v)} />
      <div className="pt-2 border-t border-gray-200 dark:border-[#1a1a1a]">
        <p className="text-[11px] text-gray-400">Data retention: All signal data is kept forever. Posts older than the archive threshold are flagged but never deleted.</p>
      </div>
    </div>
  )
}

// ── ABOUT ──
function AboutSection() {
  const [stats, setStats] = useState({})

  useEffect(() => {
    async function load() {
      const [posts, comments, runs] = await Promise.all([
        supabase.from('posts').select('id', { count: 'exact', head: true }),
        supabase.from('comments').select('id', { count: 'exact', head: true }),
        supabase.from('agent_runs').select('id', { count: 'exact', head: true }),
      ])
      setStats({ posts: posts.count || 0, comments: comments.count || 0, runs: runs.count || 0 })
    }
    load()
  }, [])

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[['Posts', stats.posts], ['Comments', stats.comments], ['Runs', stats.runs]].map(([label, val]) => (
          <div key={label} className="bg-white dark:bg-[#111] border border-gray-200 dark:border-[#1a1a1a] p-4">
            <p className="text-[11px] text-gray-500">{label}</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white tabular-nums">{val?.toLocaleString() || '—'}</p>
          </div>
        ))}
      </div>
      <div className="text-xs text-gray-500 space-y-1 pt-2 border-t border-gray-200 dark:border-[#1a1a1a]">
        <p><strong>System:</strong> Product Intelligence v1.0</p>
        <p><strong>Stack:</strong> React + Supabase + Python + Apify + Claude API</p>
        <p><strong>Tables:</strong> 26 in Supabase</p>
        <p><strong>Agents:</strong> 12 platform scrapers + 5 research council + orchestrator</p>
      </div>
    </div>
  )
}

// ── SHARED COMPONENTS ──
function Toggle({ on, onClick }) {
  return (
    <button onClick={onClick} className={`w-8 h-4 relative transition-colors ${on ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
      <span className={`absolute top-0.5 w-3 h-3 bg-white transition-transform ${on ? 'left-4' : 'left-0.5'}`} />
    </button>
  )
}

function SettingSlider({ label, value, min, max, step, format, onChange }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="text-xs text-gray-600 dark:text-gray-400 w-48 shrink-0">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="flex-1 accent-indigo-600 h-1" />
      <span className="text-xs font-bold text-gray-900 dark:text-white tabular-nums w-16 text-right">{format(value)}</span>
    </div>
  )
}
