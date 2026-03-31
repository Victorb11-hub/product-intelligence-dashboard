import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase.js'

export function useQuery(table, { select = '*', filters = [], order, limit } = {}) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    let query = supabase.from(table).select(select)
    for (const f of filters) {
      query = query[f.op || 'eq'](f.column, f.value)
    }
    if (order) query = query.order(order.column, { ascending: order.ascending ?? false })
    if (limit) query = query.limit(limit)

    const { data: result, error: err } = await query
    if (err) setError(err)
    else setData(result || [])
    setLoading(false)
  }, [table, select, JSON.stringify(filters), JSON.stringify(order), limit])

  useEffect(() => { fetch() }, [fetch])

  return { data, loading, error, refetch: fetch, setData }
}

export function useRealtime(table, callback) {
  useEffect(() => {
    const channel = supabase
      .channel(`realtime-${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
        callback(payload)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [table])
}

export function useProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: prods } = await supabase
        .from('products')
        .select('*')
        .eq('active', true)
        .order('current_score', { ascending: false })

      if (!prods) { setLoading(false); return }

      // Fetch latest score entry for each product to get score_change and data_confidence
      const ids = prods.map(p => p.id)
      const { data: latestScores } = await supabase
        .from('scores_history')
        .select('product_id, score_change, data_confidence, scored_date')
        .in('product_id', ids)
        .order('scored_date', { ascending: false })

      // Group by product_id, take the first (latest) entry
      const scoreMap = {}
      for (const s of (latestScores || [])) {
        if (!scoreMap[s.product_id]) scoreMap[s.product_id] = s
      }

      setProducts(prods.map(p => ({
        ...p,
        score_change: scoreMap[p.id]?.score_change ?? 0,
        data_confidence: scoreMap[p.id]?.data_confidence ?? null,
      })))
      setLoading(false)
    }
    load()
  }, [])

  useRealtime('products', (payload) => {
    if (payload.eventType === 'UPDATE') {
      setProducts(prev => prev.map(p => p.id === payload.new.id ? { ...p, ...payload.new } : p))
    } else if (payload.eventType === 'INSERT' && payload.new.active) {
      setProducts(prev => [...prev, payload.new].sort((a, b) => b.current_score - a.current_score))
    } else if (payload.eventType === 'DELETE') {
      setProducts(prev => prev.filter(p => p.id !== payload.old.id))
    }
  })

  return { products, loading }
}

export function useScoresHistory(productId) {
  const { data, loading, setData } = useQuery('scores_history', {
    filters: [{ column: 'product_id', value: productId }],
    order: { column: 'scored_date', ascending: true },
  })

  useRealtime('scores_history', (payload) => {
    if (payload.new?.product_id === productId) {
      if (payload.eventType === 'INSERT') {
        setData(prev => [...prev, payload.new].sort((a, b) => a.scored_date.localeCompare(b.scored_date)))
      }
    }
  })

  return { scores: data, loading }
}

export function useCompetitors() {
  const { data, loading, setData } = useQuery('competitors', {
    order: { column: 'last_checked', ascending: false },
  })

  useRealtime('competitors', (payload) => {
    if (payload.eventType === 'UPDATE') {
      setData(prev => prev.map(c => c.id === payload.new.id ? payload.new : c))
    } else if (payload.eventType === 'INSERT') {
      setData(prev => [payload.new, ...prev])
    }
  })

  return { competitors: data, loading }
}

export function useAlerts() {
  const { data, loading, setData } = useQuery('alerts', {
    order: { column: 'triggered_at', ascending: false },
  })

  useRealtime('alerts', (payload) => {
    if (payload.eventType === 'INSERT') {
      setData(prev => [payload.new, ...prev])
    } else if (payload.eventType === 'UPDATE') {
      setData(prev => prev.map(a => a.id === payload.new.id ? payload.new : a))
    }
  })

  return { alerts: data, loading, setData }
}

export function useSourcingLog() {
  return useQuery('sourcing_log', {
    select: '*, products(name)',
    order: { column: 'decision_date', ascending: false },
  })
}
