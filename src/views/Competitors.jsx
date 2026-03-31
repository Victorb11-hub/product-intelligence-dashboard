import { useState, useMemo } from 'react'
import { useCompetitors } from '../hooks/useSupabase.js'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import EmptyState from '../components/EmptyState.jsx'

export default function Competitors() {
  const { competitors, loading } = useCompetitors()
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [stockFilter, setStockFilter] = useState('all')
  const [sortCol, setSortCol] = useState('last_checked')
  const [sortAsc, setSortAsc] = useState(false)

  const categories = useMemo(() => [...new Set(competitors.map(c => c.category).filter(Boolean))].sort(), [competitors])

  const filtered = useMemo(() => {
    let result = [...competitors]
    if (categoryFilter !== 'all') result = result.filter(c => c.category === categoryFilter)
    if (stockFilter === 'in_stock') result = result.filter(c => c.in_stock)
    if (stockFilter === 'oos') result = result.filter(c => !c.in_stock)

    result.sort((a, b) => {
      let av = a[sortCol], bv = b[sortCol]
      if (av == null) return 1
      if (bv == null) return -1
      if (typeof av === 'string') return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av)
      return sortAsc ? av - bv : bv - av
    })
    return result
  }, [competitors, categoryFilter, stockFilter, sortCol, sortAsc])

  const toggleSort = (col) => {
    if (sortCol === col) setSortAsc(!sortAsc)
    else { setSortCol(col); setSortAsc(false) }
  }

  const priceChange = (c) => {
    if (!c.price_history || c.price_history.length < 2) return null
    const sorted = [...c.price_history].sort((a, b) => a.date.localeCompare(b.date))
    return sorted[sorted.length - 1].price - sorted[sorted.length - 2].price
  }

  const SortIcon = ({ col }) => {
    if (sortCol !== col) return <span className="text-gray-300 dark:text-gray-600 ml-1">↕</span>
    return <span className="text-indigo-500 ml-1">{sortAsc ? '↑' : '↓'}</span>
  }

  if (loading) return <LoadingSpinner message="Loading competitors..." />

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Competitor Tracker</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{filtered.length} competitor products</p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-5 p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="all">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select
          value={stockFilter}
          onChange={e => setStockFilter(e.target.value)}
          className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="all">All Stock Status</option>
          <option value="in_stock">In Stock</option>
          <option value="oos">Out of Stock</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No competitors found" description="Adjust your filters." />
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                {[
                  ['competitor_name', 'Competitor'],
                  ['product_name', 'Product'],
                  ['category', 'Category'],
                  ['in_stock', 'Stock'],
                  ['current_price', 'Price'],
                  ['_price_change', 'Price Δ'],
                  ['review_count', 'Reviews'],
                  ['review_score', 'Rating'],
                  ['first_seen', 'First Seen'],
                  ['is_new_sku', 'New SKU'],
                ].map(([col, label]) => (
                  <th
                    key={col}
                    onClick={() => col !== '_price_change' && toggleSort(col)}
                    className={`text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 ${col !== '_price_change' ? 'cursor-pointer hover:text-gray-700 dark:hover:text-gray-200' : ''}`}
                  >
                    {label}{col !== '_price_change' && <SortIcon col={col} />}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const pc = priceChange(c)
                return (
                  <tr
                    key={c.id}
                    className={`border-b border-gray-100 dark:border-gray-800 transition-colors ${
                      !c.in_stock ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    }`}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{c.competitor_name}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{c.product_name}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{c.category}</td>
                    <td className="px-4 py-3">
                      {c.in_stock ? (
                        <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs rounded-full font-medium">In Stock</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs rounded-full font-medium">OOS</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-900 dark:text-white tabular-nums">${Number(c.current_price).toFixed(2)}</td>
                    <td className="px-4 py-3 tabular-nums">
                      {pc == null ? (
                        <span className="text-gray-400">—</span>
                      ) : pc > 0 ? (
                        <span className="text-red-600 dark:text-red-400">+${pc.toFixed(2)}</span>
                      ) : pc < 0 ? (
                        <span className="text-emerald-600 dark:text-emerald-400">-${Math.abs(pc).toFixed(2)}</span>
                      ) : (
                        <span className="text-gray-400">$0.00</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 tabular-nums">{c.review_count?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 tabular-nums">{c.review_score?.toFixed(1)}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{new Date(c.first_seen).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      {c.is_new_sku && (
                        <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full font-medium">NEW</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
