import { useSourcingLog } from '../hooks/useSupabase.js'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import EmptyState from '../components/EmptyState.jsx'

const OUTCOME_STYLES = {
  success: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
  partial: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
  dead_stock: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
}

export default function SourcingLog() {
  const { data: entries, loading } = useSourcingLog()

  if (loading) return <LoadingSpinner message="Loading sourcing log..." />

  const withMargin = entries.map(e => ({
    ...e,
    grossMargin: e.unit_cost && e.actual_sell_price
      ? ((e.actual_sell_price - e.unit_cost) / e.actual_sell_price * 100)
      : null,
  }))

  const completedEntries = withMargin.filter(e => e.outcome)
  const successCount = completedEntries.filter(e => e.outcome === 'success').length
  const avgScore = completedEntries.length > 0
    ? completedEntries.reduce((s, e) => s + (e.score_at_decision || 0), 0) / completedEntries.length
    : 0
  const winRate = completedEntries.length > 0 ? (successCount / completedEntries.length * 100) : 0
  const marginsWithData = completedEntries.filter(e => e.grossMargin != null)
  const avgMargin = marginsWithData.length > 0
    ? marginsWithData.reduce((s, e) => s + e.grossMargin, 0) / marginsWithData.length
    : 0

  const summaryCards = [
    { label: 'Total Sourced', value: entries.length, format: 'number' },
    { label: 'Avg Score at Decision', value: avgScore, format: 'score' },
    { label: 'Win Rate', value: winRate, format: 'percent' },
    { label: 'Avg Gross Margin', value: avgMargin, format: 'percent' },
  ]

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sourcing Log</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track sourcing decisions and outcomes</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {summaryCards.map(card => (
          <div key={card.label} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{card.label}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">
              {card.format === 'number'
                ? card.value
                : card.format === 'score'
                ? card.value.toFixed(1)
                : `${card.value.toFixed(1)}%`
              }
            </p>
          </div>
        ))}
      </div>

      {/* Table */}
      {withMargin.length === 0 ? (
        <EmptyState title="No sourcing decisions" description="Sourcing decisions logged from product scorecards will appear here." />
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Product</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Date</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Decided By</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Score</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Supplier</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Method</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Unit Cost</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Est. Arrival</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Sell Price</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Units Sold</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Outcome</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Margin</th>
              </tr>
            </thead>
            <tbody>
              {withMargin.map(e => (
                <tr key={e.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{e.products?.name || '—'}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{new Date(e.decision_date).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{e.decided_by}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    <span className={e.score_at_decision >= 75 ? 'text-emerald-600 dark:text-emerald-400' : e.score_at_decision >= 55 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}>
                      {e.score_at_decision?.toFixed(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{e.supplier || '—'}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400 capitalize">{e.import_method?.replace('_', ' ') || '—'}</td>
                  <td className="px-4 py-3 text-right text-gray-900 dark:text-white tabular-nums">{e.unit_cost != null ? `$${Number(e.unit_cost).toFixed(2)}` : '—'}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{e.estimated_arrival ? new Date(e.estimated_arrival).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3 text-right text-gray-900 dark:text-white tabular-nums">{e.actual_sell_price != null ? `$${Number(e.actual_sell_price).toFixed(2)}` : '—'}</td>
                  <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400 tabular-nums">{e.units_sold != null ? e.units_sold.toLocaleString() : '—'}</td>
                  <td className="px-4 py-3">
                    {e.outcome ? (
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${OUTCOME_STYLES[e.outcome]}`}>
                        {e.outcome === 'dead_stock' ? 'Dead Stock' : e.outcome.charAt(0).toUpperCase() + e.outcome.slice(1)}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {e.grossMargin != null ? (
                      <span className={e.grossMargin >= 50 ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-gray-600 dark:text-gray-400'}>
                        {e.grossMargin.toFixed(1)}%
                      </span>
                    ) : '—'}
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
