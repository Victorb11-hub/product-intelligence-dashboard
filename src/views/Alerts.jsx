import { useState } from 'react'
import { useAlerts } from '../hooks/useSupabase.js'
import { supabase } from '../lib/supabase.js'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import EmptyState from '../components/EmptyState.jsx'

const TYPE_STYLES = {
  green_flag: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', label: 'Green Flag' },
  competitor_oos: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', label: 'Competitor OOS' },
  new_sku: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', label: 'New SKU' },
  score_acceleration: { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-700 dark:text-indigo-300', label: 'Score Accel.' },
  fad_warning: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300', label: 'Fad Warning' },
  reddit_pushback: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', label: 'Reddit Pushback' },
}

const PRIORITY_COLORS = {
  high: 'bg-red-500',
  medium: 'bg-amber-500',
  low: 'bg-gray-400',
}

export default function Alerts() {
  const { alerts, loading, setData } = useAlerts()
  const [selectedAlert, setSelectedAlert] = useState(null)
  const [outcomeNote, setOutcomeNote] = useState('')
  const [saving, setSaving] = useState(false)

  // Sort: high priority unactioned first, then by time
  const sorted = [...alerts].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    if (!a.actioned && a.priority === 'high' && (b.actioned || b.priority !== 'high')) return -1
    if (!b.actioned && b.priority === 'high' && (a.actioned || a.priority !== 'high')) return 1
    return new Date(b.triggered_at) - new Date(a.triggered_at)
  })

  const timeSince = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const hours = Math.floor(diff / 3600000)
    if (hours < 1) return `${Math.floor(diff / 60000)}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  const handleAction = async () => {
    if (!selectedAlert) return
    setSaving(true)
    const { error } = await supabase
      .from('alerts')
      .update({ actioned: true, actioned_by: 'Victor', outcome_note: outcomeNote || null })
      .eq('id', selectedAlert.id)

    if (!error) {
      setData(prev => prev.map(a => a.id === selectedAlert.id ? { ...a, actioned: true, actioned_by: 'Victor', outcome_note: outcomeNote } : a))
    }
    setSaving(false)
    setSelectedAlert(null)
    setOutcomeNote('')
  }

  if (loading) return <LoadingSpinner message="Loading alerts..." />

  return (
    <div className="p-6 flex gap-6">
      {/* Alert Feed */}
      <div className="flex-1">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Alerts Feed</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {alerts.filter(a => !a.actioned).length} unactioned alert{alerts.filter(a => !a.actioned).length !== 1 ? 's' : ''}
          </p>
        </div>

        {sorted.length === 0 ? (
          <EmptyState title="No alerts" description="All quiet. Alerts will appear here when triggered." />
        ) : (
          <div className="space-y-2">
            {sorted.map(alert => {
              const typeStyle = TYPE_STYLES[alert.alert_type] || TYPE_STYLES.green_flag
              return (
                <div
                  key={alert.id}
                  onClick={() => { setSelectedAlert(alert); setOutcomeNote(alert.outcome_note || '') }}
                  className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedAlert?.id === alert.id
                      ? 'border-indigo-300 dark:border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/10'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-600'
                  } ${alert.actioned ? 'opacity-60' : ''}`}
                >
                  {/* Priority indicator */}
                  <div className="flex flex-col items-center pt-1">
                    <span className={`w-2.5 h-2.5 rounded-full ${PRIORITY_COLORS[alert.priority]} ${!alert.actioned && alert.priority === 'high' ? 'animate-pulse-dot' : ''}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${typeStyle.bg} ${typeStyle.text}`}>
                        {typeStyle.label}
                      </span>
                      <span className="text-xs text-gray-400">{timeSince(alert.triggered_at)}</span>
                      {alert.actioned && (
                        <span className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 rounded">Actioned</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{alert.message}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Action Side Panel */}
      {selectedAlert && (
        <div className="w-80 shrink-0">
          <div className="sticky top-6 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Alert Details</h3>

            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Type:</span>
                <span className="ml-2 text-gray-900 dark:text-white capitalize">{selectedAlert.alert_type.replace(/_/g, ' ')}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Priority:</span>
                <span className="ml-2 text-gray-900 dark:text-white capitalize">{selectedAlert.priority}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Triggered:</span>
                <span className="ml-2 text-gray-900 dark:text-white">{new Date(selectedAlert.triggered_at).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Status:</span>
                <span className="ml-2 text-gray-900 dark:text-white">{selectedAlert.actioned ? 'Actioned' : 'Pending'}</span>
              </div>

              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Outcome Note</label>
                <textarea
                  value={outcomeNote}
                  onChange={e => setOutcomeNote(e.target.value)}
                  rows={3}
                  className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                  placeholder="What action was taken?"
                />
              </div>

              {!selectedAlert.actioned && (
                <button
                  onClick={handleAction}
                  disabled={saving}
                  className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Mark as Actioned'}
                </button>
              )}

              <button
                onClick={() => setSelectedAlert(null)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
