import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase.js'
import LoadingSpinner from '../components/LoadingSpinner.jsx'

export default function Settings() {
  const [tab, setTab] = useState('email')
  const tabs = [
    { id: 'email', label: 'Email' }, { id: 'users', label: 'Users' },
    { id: 'pipeline', label: 'Pipeline' }, { id: 'scrapers', label: 'Scrapers' },
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
      {tab === 'pipeline' && <PipelineSection />}
      {tab === 'scrapers' && <ScrapersSection />}
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

// ── PIPELINE ──
function PipelineSection() {
  const [settings, setSettings] = useState({}); const [loading, setLoading] = useState(true)
  const [schedulerStatus, setSchedulerStatus] = useState(null)
  const [recentRuns, setRecentRuns] = useState([])

  const load = useCallback(async () => {
    const { data } = await supabase.from('scoring_settings').select('*')
    const map = {}; (data || []).forEach(r => { map[r.setting_key] = r })
    setSettings(map); setLoading(false)
    // Load scheduler status from API
    try {
      const r = await fetch('http://localhost:8000/scheduler/status')
      if (r.ok) setSchedulerStatus(await r.json())
    } catch {}
    // Load recent pipeline runs
    const { data: runs } = await supabase.from('pipeline_runs')
      .select('*').order('started_at', { ascending: false }).limit(10)
    setRecentRuns(runs || [])
  }, [])
  useEffect(() => { load() }, [load])

  const triggerRun = async (backfill = false) => {
    if (backfill && !window.confirm(
      'This will pull 365 days of historical data. ' +
      'This run will take longer and use more Apify credits than a normal run. Continue?'
    )) return
    try {
      const r = await fetch('http://localhost:8000/run/all', { method: 'POST' })
      if (r.ok) {
        alert(backfill ? 'Backfill triggered' : 'Manual run triggered')
        setTimeout(load, 2000)
      } else {
        alert('Failed to trigger run')
      }
    } catch (e) { alert('Failed to reach API: ' + e.message) }
  }

  const update = async (key, value) => {
    const v = parseFloat(value); if (isNaN(v)) return
    await supabase.from('scoring_settings').update({ setting_value: v, updated_at: new Date().toISOString() }).eq('setting_key', key)
    setSettings(p => ({ ...p, [key]: { ...p[key], setting_value: v } }))
  }
  const val = (key) => settings[key]?.setting_value ?? 0
  const boolVal = (key) => (settings[key]?.setting_value ?? 1) === 1

  if (loading) return <LoadingSpinner />

  const fmtDate = (iso) => {
    if (!iso) return '—'
    try { return new Date(iso).toLocaleString() } catch { return iso }
  }
  const fmtDuration = (secs) => {
    if (!secs) return '—'
    const m = Math.floor(secs / 60), s = secs % 60
    return m > 0 ? `${m}m ${s}s` : `${s}s`
  }
  const STATUS_BADGE = {
    completed: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
    running:   'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    failed:    'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    skipped:   'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
  }

  const lastRun = recentRuns[0]

  return (
    <div className="space-y-6">
      {/* Schedule & Run History */}
      <div>
        <h3 className="text-xs font-bold text-gray-900 dark:text-white mb-3">Schedule & Run History</h3>
        <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-[#1a1a1a] rounded p-4 space-y-3 mb-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <p className="text-gray-500 dark:text-gray-400 mb-1">Schedule</p>
              <p className="font-semibold text-gray-900 dark:text-white">{schedulerStatus?.schedule || 'Loading...'}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400 mb-1">Next run</p>
              <p className="font-semibold text-gray-900 dark:text-white">{fmtDate(schedulerStatus?.next_run_iso)}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400 mb-1">Last run</p>
              <p className="font-semibold text-gray-900 dark:text-white">{fmtDate(lastRun?.started_at)}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400 mb-1">Duration</p>
              <p className="font-semibold text-gray-900 dark:text-white">{fmtDuration(lastRun?.duration_seconds)}</p>
            </div>
          </div>
          {lastRun && (
            <div className="text-[11px] text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-[#1a1a1a]">
              Last run: {lastRun.total_posts_found || 0} posts found,
              {' '}{lastRun.total_comments_pulled || 0} comments pulled,
              {' '}{lastRun.products_processed || 0} products processed,
              {' '}{lastRun.total_dedup_skips || 0} dedup skips
            </div>
          )}
          <div className="flex items-center gap-2 pt-2">
            <button onClick={() => triggerRun(false)} className="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700">
              Run Now (Weekly)
            </button>
            <button onClick={() => triggerRun(true)} className="px-3 py-1.5 border border-amber-500 text-amber-600 dark:text-amber-400 text-xs rounded hover:bg-amber-50 dark:hover:bg-amber-900/10">
              Run Backfill (365 days)
            </button>
          </div>
        </div>

        {/* Recent runs table */}
        {recentRuns.length > 0 && (
          <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-[#1a1a1a] rounded overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-gray-200 dark:border-[#1a1a1a] text-gray-500">
                  <th className="text-left py-2 px-3 font-medium">Started</th>
                  <th className="text-left py-2 px-3 font-medium">Type</th>
                  <th className="text-left py-2 px-3 font-medium">Status</th>
                  <th className="text-right py-2 px-3 font-medium">Duration</th>
                  <th className="text-right py-2 px-3 font-medium">Products</th>
                  <th className="text-right py-2 px-3 font-medium">Records</th>
                  <th className="text-right py-2 px-3 font-medium">Dedup Rate</th>
                </tr>
              </thead>
              <tbody>
                {recentRuns.map(r => {
                  const newRecords = r.total_new_records ?? 0
                  const skips = r.total_dedup_skips ?? 0
                  const total = newRecords + skips
                  const skipPct = total > 0 ? Math.round((skips / total) * 100) : 0
                  return (
                    <tr key={r.id} className="border-b border-gray-100 dark:border-[#1a1a1a]/50">
                      <td className="py-1.5 px-3 text-gray-700 dark:text-gray-300">{fmtDate(r.started_at)}</td>
                      <td className="py-1.5 px-3 text-gray-600 dark:text-gray-400 capitalize">{r.run_type || 'weekly'}</td>
                      <td className="py-1.5 px-3">
                        <span className={`px-1.5 py-0.5 rounded font-bold uppercase ${STATUS_BADGE[r.status] || STATUS_BADGE.skipped}`}>{r.status}</span>
                      </td>
                      <td className="py-1.5 px-3 text-right text-gray-600 dark:text-gray-400 tabular-nums">{fmtDuration(r.duration_seconds)}</td>
                      <td className="py-1.5 px-3 text-right text-gray-600 dark:text-gray-400 tabular-nums">{r.products_processed ?? '—'}</td>
                      <td className="py-1.5 px-3 text-right tabular-nums">
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{newRecords.toLocaleString()} new</span>
                        <span className="text-gray-400 dark:text-gray-500 text-[10px]"> / {skips.toLocaleString()} skipped</span>
                      </td>
                      <td className="py-1.5 px-3 text-right text-gray-600 dark:text-gray-400 tabular-nums">{total > 0 ? `${skipPct}%` : '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
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
      <div>
        <h3 className="text-xs font-bold text-gray-900 dark:text-white mb-3">Amazon Settings</h3>
        <p className="text-[10px] text-gray-400 mb-3">Controls how the Amazon agent searches and filters products. Changes take effect on the next pipeline run.</p>
        <SettingSlider label="Search results to pull" value={val('amazon_search_results')} min={10} max={100} step={5} format={v => v.toFixed(0)} onChange={v => update('amazon_search_results', v)} />
        <SettingSlider label="Top N by review count" value={val('amazon_top_n')} min={5} max={20} step={1} format={v => v.toFixed(0)} onChange={v => update('amazon_top_n', v)} />
        <SettingSlider label="Min reviews to include product" value={val('amazon_min_reviews')} min={0} max={5000} step={100} format={v => v.toFixed(0)} onChange={v => update('amazon_min_reviews', v)} />
        <SettingSlider label="1★ alert threshold (%)" value={val('amazon_one_star_alert_threshold')} min={1} max={10} step={0.5} format={v => `${v.toFixed(1)}%`} onChange={v => update('amazon_one_star_alert_threshold', v)} />
      </div>
      <div>
        <h3 className="text-xs font-bold text-gray-900 dark:text-white mb-3">Data Lookback Windows</h3>
        <p className="text-[10px] text-gray-400 mb-3">How far back each platform pulls content per run. Longer = more data but higher cost. Use 30 days for initial run then reduce to 7-14 days ongoing.</p>
        <div className="space-y-1">
          {[
            ['lookback_reddit',    'Reddit',    7, 90],
            ['lookback_tiktok',    'TikTok',    7, 60],
            ['lookback_instagram', 'Instagram', 7, 60],
            ['lookback_youtube',   'YouTube',   14, 180],
            ['lookback_pinterest', 'Pinterest', 14, 180],
            ['lookback_x',         'X',         1, 30],
            ['lookback_facebook',  'Facebook',  7, 60],
            ['lookback_amazon',    'Amazon',    14, 180],
          ].map(([key, label, min, max]) => (
            <SettingSlider key={key} label={label} value={val(key)} min={min} max={max} step={1} format={v => `${v.toFixed(0)} days`} onChange={v => update(key, v)} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── SCRAPERS REGISTRY ──
function ScrapersSection() {
  const [scrapers, setScrapers] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)

  const load = useCallback(async () => {
    const { data } = await supabase.from('scrapers_registry').select('*').order('platform')
    setScrapers(data || []); setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])

  const updateField = async (id, field, value) => {
    await supabase.from('scrapers_registry').update({ [field]: value }).eq('id', id)
    load()
  }

  const STATUS_COLORS = {
    active: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
    testing: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
    failed: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    inactive: 'bg-gray-100 dark:bg-gray-800 text-gray-500',
  }

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <p className="text-[11px] text-gray-400 mb-3">All Apify actors and API integrations used by the system. Updated automatically after each pipeline run.</p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-200 dark:border-[#1a1a1a] text-gray-500">
              <th className="text-left py-2 px-2">Platform</th>
              <th className="text-left py-2 px-2">Actor</th>
              <th className="text-left py-2 px-2">Developer</th>
              <th className="text-right py-2 px-2">Rating</th>
              <th className="text-right py-2 px-2">$/1K</th>
              <th className="text-right py-2 px-2">Avg $/run</th>
              <th className="text-left py-2 px-2">Last Run</th>
              <th className="text-left py-2 px-2">Status</th>
              <th className="text-left py-2 px-2"></th>
            </tr>
          </thead>
          <tbody>
            {scrapers.map(s => (
              <tr key={s.id} className="border-b border-gray-100 dark:border-[#1a1a1a]">
                <td className="py-2 px-2 font-bold text-gray-900 dark:text-white">{s.platform}</td>
                <td className="py-2 px-2 text-gray-600 dark:text-gray-400 font-mono text-[10px]">{s.actor_id}</td>
                <td className="py-2 px-2 text-gray-500">{s.developer}</td>
                <td className="py-2 px-2 text-right tabular-nums">{s.rating?.toFixed(1) || '—'}</td>
                <td className="py-2 px-2 text-right tabular-nums">{s.cost_per_1k != null ? `$${s.cost_per_1k.toFixed(2)}` : 'Free'}</td>
                <td className="py-2 px-2 text-right tabular-nums">{s.avg_cost_per_run != null ? `$${s.avg_cost_per_run.toFixed(2)}` : '—'}</td>
                <td className="py-2 px-2 text-gray-400">{s.last_run_date || 'Never'}</td>
                <td className="py-2 px-2">
                  <select value={s.status} onChange={e => updateField(s.id, 'status', e.target.value)}
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 border-0 ${STATUS_COLORS[s.status] || STATUS_COLORS.inactive}`}>
                    <option value="active">Active</option>
                    <option value="testing">Testing</option>
                    <option value="failed">Failed</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </td>
                <td className="py-2 px-2">
                  <button onClick={() => setEditing(editing === s.id ? null : s.id)} className="text-indigo-500 text-[10px]">
                    {editing === s.id ? 'Close' : 'Edit'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit panel */}
      {editing && (() => {
        const s = scrapers.find(x => x.id === editing)
        if (!s) return null
        return (
          <div className="mt-3 p-3 bg-white dark:bg-[#111] border border-gray-200 dark:border-[#1a1a1a]">
            <p className="text-xs font-bold text-gray-900 dark:text-white mb-2">{s.actor_name} — {s.platform}</p>
            <p className="text-[11px] text-gray-500 mb-2">{s.what_it_pulls}</p>
            <div className="space-y-2">
              <div>
                <label className="text-[10px] text-gray-400">Timeframe</label>
                <p className="text-xs text-gray-600 dark:text-gray-400">{s.timeframe || '—'}</p>
              </div>
              <div>
                <label className="text-[10px] text-gray-400">Cost model</label>
                <p className="text-xs text-gray-600 dark:text-gray-400">{s.cost_model || '—'}</p>
              </div>
              <div>
                <label className="text-[10px] text-gray-400">Users</label>
                <p className="text-xs text-gray-600 dark:text-gray-400">{s.user_count || '—'} users, {s.review_count || 0} reviews</p>
              </div>
              <div>
                <label className="text-[10px] text-gray-400">Notes</label>
                <textarea value={s.notes || ''} rows={2}
                  onChange={e => {
                    setScrapers(prev => prev.map(x => x.id === s.id ? { ...x, notes: e.target.value } : x))
                  }}
                  onBlur={e => updateField(s.id, 'notes', e.target.value)}
                  className="w-full text-xs border border-gray-300 dark:border-[#1a1a1a] px-2 py-1 bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white resize-none mt-1" />
              </div>
            </div>
          </div>
        )
      })()}
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
