import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase.js'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import EmptyState from '../components/EmptyState.jsx'

export default function EmailSettings() {
  const [recipients, setRecipients] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)

  const load = useCallback(async () => {
    const { data } = await supabase.from('email_settings').select('*').order('added_at', { ascending: false })
    setRecipients(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) return <LoadingSpinner />

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Email Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage report recipients</p>
      </div>

      <button onClick={() => setShowAdd(!showAdd)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 mb-4">
        {showAdd ? 'Cancel' : 'Add Recipient'}
      </button>

      {showAdd && <AddRecipient onDone={() => { setShowAdd(false); load() }} />}

      {recipients.length === 0 ? (
        <EmptyState title="No recipients" description="Add email recipients to receive automated reports." />
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <th className="text-left px-4 py-3 font-medium text-gray-500">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Email</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Daily</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Monthly</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Quarterly</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Alerts</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Active</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {recipients.map(r => (
                <RecipientRow key={r.id} recipient={r} onUpdate={load} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function RecipientRow({ recipient: r, onUpdate }) {
  const toggle = async (field) => {
    await supabase.from('email_settings').update({ [field]: !r[field] }).eq('id', r.id)
    onUpdate()
  }

  const remove = async () => {
    if (!window.confirm(`Remove ${r.email_address}?`)) return
    await supabase.from('email_settings').delete().eq('id', r.id)
    onUpdate()
  }

  const Toggle = ({ field }) => (
    <button onClick={() => toggle(field)} className={`w-8 h-4 rounded-full relative transition-colors ${r[field] ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
      <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform ${r[field] ? 'left-4' : 'left-0.5'}`} />
    </button>
  )

  return (
    <tr className="border-b border-gray-100 dark:border-gray-800">
      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{r.name || '—'}</td>
      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{r.email_address}</td>
      <td className="px-4 py-3 text-center"><Toggle field="receive_daily" /></td>
      <td className="px-4 py-3 text-center"><Toggle field="receive_monthly" /></td>
      <td className="px-4 py-3 text-center"><Toggle field="receive_quarterly" /></td>
      <td className="px-4 py-3 text-center"><Toggle field="receive_alerts" /></td>
      <td className="px-4 py-3 text-center"><Toggle field="active" /></td>
      <td className="px-4 py-3 text-center">
        <button onClick={remove} className="text-red-500 hover:text-red-700 text-xs">Remove</button>
      </td>
    </tr>
  )
}

function AddRecipient({ onDone }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!email.trim()) return
    setSaving(true)
    await supabase.from('email_settings').insert({ name: name.trim(), email_address: email.trim() })
    setSaving(false)
    onDone()
  }

  return (
    <form onSubmit={submit} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-4 flex gap-3 items-end">
      <div className="flex-1">
        <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
        <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
      </div>
      <div className="flex-1">
        <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
      </div>
      <button type="submit" disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
        {saving ? 'Adding...' : 'Add'}
      </button>
    </form>
  )
}
