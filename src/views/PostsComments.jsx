import { useState, useEffect, useMemo, useCallback } from 'react'
import { supabase } from '../lib/supabase.js'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import EmptyState from '../components/EmptyState.jsx'

const INTENT_COLORS = {
  1: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
  2: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  3: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
  4: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
  5: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
}

export default function PostsComments() {
  const [activeTab, setActiveTab] = useState('posts')

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Posts & Comments</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Raw scraped content with intent and sentiment scoring</p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 mb-5 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 w-fit">
        {[
          { id: 'posts', label: 'Posts' },
          { id: 'comments', label: 'All Comments' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'posts' && <PostsTab />}
      {activeTab === 'comments' && <CommentsTab />}
    </div>
  )
}

// ════════════════════════════════════════════════
// POSTS TAB
// ════════════════════════════════════════════════
function PostsTab() {
  const [posts, setPosts] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState('all')
  const [selectedPlatform, setSelectedPlatform] = useState('all')
  const [sortBy, setSortBy] = useState('posted_at')
  const [sortAsc, setSortAsc] = useState(false)
  const [minIntent, setMinIntent] = useState(1)
  const [expandedPost, setExpandedPost] = useState(null)
  const [comments, setComments] = useState({})
  const [loadingComments, setLoadingComments] = useState(null)

  const loadData = useCallback(async () => {
    const [postsResp, productsResp] = await Promise.all([
      supabase.from('posts').select('*, products(name)').eq('data_type', 'post').neq('archived', true).order('posted_at', { ascending: false }).limit(500),
      supabase.from('products').select('id, name'),
    ])
    setPosts(postsResp.data || [])
    setProducts(productsResp.data || [])
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  useEffect(() => {
    const channel = supabase
      .channel('posts-tab-rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, () => loadData())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [loadData])

  const loadComments = async (postId) => {
    if (expandedPost === postId) {
      setExpandedPost(null)
      return
    }
    setExpandedPost(postId)
    if (comments[postId]) return

    setLoadingComments(postId)
    const { data } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .order('upvotes', { ascending: false })
    setComments(prev => ({ ...prev, [postId]: data || [] }))
    setLoadingComments(null)
  }

  const platforms = useMemo(() => [...new Set(posts.map(p => p.platform))].sort(), [posts])

  const filtered = useMemo(() => {
    let result = [...posts]
    if (selectedProduct !== 'all') result = result.filter(p => p.product_id === selectedProduct)
    if (selectedPlatform !== 'all') result = result.filter(p => p.platform === selectedPlatform)
    if (minIntent > 1) result = result.filter(p => (p.intent_level || 1) >= minIntent)
    result.sort((a, b) => {
      let av = a[sortBy], bv = b[sortBy]
      if (av == null) return 1
      if (bv == null) return -1
      if (typeof av === 'string') return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av)
      return sortAsc ? av - bv : bv - av
    })
    return result
  }, [posts, selectedProduct, selectedPlatform, sortBy, sortAsc, minIntent])

  const toggleSort = (col) => {
    if (sortBy === col) setSortAsc(!sortAsc)
    else { setSortBy(col); setSortAsc(false) }
  }
  const SortIcon = ({ col }) => {
    if (sortBy !== col) return <span className="text-gray-300 dark:text-gray-600 ml-1">↕</span>
    return <span className="text-indigo-500 ml-1">{sortAsc ? '↑' : '↓'}</span>
  }

  const totalPosts = filtered.length
  const avgSentiment = totalPosts > 0 ? filtered.reduce((s, p) => s + (p.sentiment_score || 0), 0) / totalPosts : 0
  const highIntentCount = filtered.filter(p => (p.intent_level || 1) >= 4).length
  const buyIntentPct = totalPosts > 0 ? (highIntentCount / totalPosts * 100) : 0

  if (loading) return <LoadingSpinner message="Loading posts..." />

  return (
    <div>
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-5">
        {[
          { label: 'Total Posts', value: totalPosts },
          { label: 'Avg Sentiment', value: avgSentiment.toFixed(3) },
          { label: 'High Intent (L4+5)', value: highIntentCount },
          { label: 'Buy Intent %', value: `${buyIntentPct.toFixed(1)}%` },
        ].map(card => (
          <div key={card.label} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{card.label}</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-1 tabular-nums">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5 p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
        <select value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)} className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
          <option value="all">All Products</option>
          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={selectedPlatform} onChange={e => setSelectedPlatform(e.target.value)} className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
          <option value="all">All Platforms</option>
          {platforms.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 dark:text-gray-400">Min Intent: L{minIntent}</label>
          <input type="range" min="1" max="5" value={minIntent} onChange={e => setMinIntent(Number(e.target.value))} className="w-24 accent-indigo-600" />
        </div>
        <span className="text-xs text-gray-400 ml-auto">{filtered.length} posts</span>
      </div>

      {/* Posts table */}
      {filtered.length === 0 ? (
        <EmptyState title="No posts yet" description="Posts will appear here after running an agent." />
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 w-8"></th>
                <th onClick={() => toggleSort('post_title')} className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700">Title<SortIcon col="post_title" /></th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Product</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Subreddit</th>
                <th onClick={() => toggleSort('upvotes')} className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700">Upvotes<SortIcon col="upvotes" /></th>
                <th onClick={() => toggleSort('comment_count')} className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700">Comments<SortIcon col="comment_count" /></th>
                <th onClick={() => toggleSort('intent_level')} className="text-center px-4 py-3 font-medium text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700">Intent<SortIcon col="intent_level" /></th>
                <th onClick={() => toggleSort('sentiment_score')} className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700">Sentiment<SortIcon col="sentiment_score" /></th>
                <th onClick={() => toggleSort('relevance_score')} className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700">Relevance<SortIcon col="relevance_score" /></th>
                <th onClick={() => toggleSort('posted_at')} className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700">Date<SortIcon col="posted_at" /></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(post => {
                const isExpanded = expandedPost === post.id
                const postComments = comments[post.id] || []
                const intentLvl = post.intent_level || 1
                return (
                  <PostRowWithComments
                    key={post.id}
                    post={post}
                    isExpanded={isExpanded}
                    postComments={postComments}
                    loadingComments={loadingComments === post.id}
                    onToggle={() => loadComments(post.id)}
                    intentLvl={intentLvl}
                  />
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function PostRowWithComments({ post, isExpanded, postComments, loadingComments, onToggle, intentLvl }) {
  // Comment summary stats
  const buyCount = postComments.filter(c => c.is_buy_intent).length
  const repeatCount = postComments.filter(c => c.is_repeat_purchase).length
  const avgIntent = postComments.length > 0
    ? (postComments.reduce((s, c) => s + (c.intent_level || 1), 0) / postComments.length).toFixed(1)
    : '—'

  return (
    <>
      <tr
        onClick={onToggle}
        className={`border-b border-gray-100 dark:border-gray-800 cursor-pointer transition-colors ${
          isExpanded ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
        } ${intentLvl >= 4 ? 'border-l-2 border-l-emerald-500' : ''}`}
      >
        <td className="px-4 py-3 text-gray-400">{isExpanded ? '▼' : '▶'}</td>
        <td className="px-4 py-3 max-w-md">
          <div className="flex items-start gap-2">
            <span className="text-gray-900 dark:text-white font-medium leading-snug line-clamp-2">{post.post_title || '(no title)'}</span>
            {post.post_url && (
              <a href={post.post_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="shrink-0 text-indigo-500 hover:text-indigo-700 text-xs">↗</a>
            )}
          </div>
        </td>
        <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs">{post.products?.name || '—'}</td>
        <td className="px-4 py-3">
          <span className="px-2 py-0.5 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 text-xs rounded-full">{post.subreddit || post.platform}</span>
        </td>
        <td className="px-4 py-3 text-right tabular-nums text-gray-600 dark:text-gray-400">{post.upvotes || 0}</td>
        <td className="px-4 py-3 text-right tabular-nums text-gray-600 dark:text-gray-400">{post.comment_count || 0}</td>
        <td className="px-4 py-3 text-center">
          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${INTENT_COLORS[intentLvl]}`}>L{intentLvl}</span>
        </td>
        <td className="px-4 py-3 text-right tabular-nums"><SentimentIndicator score={post.sentiment_score} /></td>
        <td className="px-4 py-3 text-right tabular-nums">
          {post.relevance_score != null ? (
            <span className={`text-xs font-medium ${post.relevance_score >= 0.7 ? 'text-emerald-600 dark:text-emerald-400' : post.relevance_score >= 0.4 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400'}`}>{(post.relevance_score * 100).toFixed(0)}%</span>
          ) : <span className="text-gray-400">—</span>}
        </td>
        <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs whitespace-nowrap">
          {post.posted_at ? new Date(post.posted_at).toLocaleDateString() : '—'}
        </td>
      </tr>

      {isExpanded && (
        <tr>
          <td colSpan={10} className="px-0 py-0">
            <div className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              {/* Post body */}
              {post.post_body && (
                <div className="px-12 py-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex flex-wrap gap-3 mb-2 text-xs text-gray-500">
                    {post.author && <span>by <span className="text-gray-700 dark:text-gray-300">{post.author}</span></span>}
                    {post.upvote_ratio != null && <span>Upvote ratio: {(post.upvote_ratio * 100).toFixed(0)}%</span>}
                    {post.reddit_id && <span className="font-mono">{post.reddit_id}</span>}
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {post.post_body.length > 1500 ? post.post_body.slice(0, 1500) + '...' : post.post_body}
                  </p>
                </div>
              )}

              {/* Comment summary bar */}
              <div className="px-12 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-6 text-xs">
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {loadingComments ? 'Loading comments...' : `${postComments.length} comments stored`}
                </span>
                {postComments.length > 0 && (
                  <>
                    <span className="text-gray-500">Avg intent: <span className="font-medium text-gray-700 dark:text-gray-300">{avgIntent}</span></span>
                    <span className="text-gray-500">Buy intent: <span className="font-medium text-emerald-600">{buyCount}</span></span>
                    <span className="text-gray-500">Repeat: <span className="font-medium text-blue-600">{repeatCount}</span></span>
                  </>
                )}
              </div>

              {/* Comments list */}
              <div className="px-12 py-4">
                {postComments.length === 0 && !loadingComments && (
                  <p className="text-xs text-gray-400">No comments stored for this post. Run Pass 2 to fetch comment threads.</p>
                )}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {postComments.map(c => (
                    <CommentCard key={c.id} comment={c} />
                  ))}
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

function CommentCard({ comment: c }) {
  return (
    <div className={`flex gap-3 p-3 rounded-lg border ${
      c.is_buy_intent ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10' :
      c.is_problem_language ? 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10' :
      'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'
    }`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-xs text-gray-500 dark:text-gray-400">{c.author || 'anon'}</span>
          <span className="text-xs text-gray-400">{c.upvotes || 0} pts</span>
          <span className={`px-1.5 py-0.5 text-xs rounded ${INTENT_COLORS[c.intent_level || 1]}`}>L{c.intent_level || 1}</span>
          <SentimentIndicator score={c.sentiment_score} />
          {c.is_buy_intent && <span className="px-1.5 py-0.5 text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded font-medium">BUY</span>}
          {c.is_problem_language && <span className="px-1.5 py-0.5 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded font-medium">PROBLEM</span>}
          {c.is_repeat_purchase && <span className="px-1.5 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded font-medium">REPEAT</span>}
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{c.comment_body}</p>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════
// COMMENTS TAB — flat table of ALL comments
// ════════════════════════════════════════════════
function CommentsTab() {
  const [allComments, setAllComments] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState('all')
  const [selectedPlatform, setSelectedPlatform] = useState('all')
  const [sortBy, setSortBy] = useState('intent_level')
  const [sortAsc, setSortAsc] = useState(false)

  useEffect(() => {
    async function load() {
      const [commentsResp, productsResp] = await Promise.all([
        supabase.from('comments').select('*, posts(post_title, post_url), products(name)').order('intent_level', { ascending: false }).limit(500),
        supabase.from('products').select('id, name'),
      ])
      setAllComments(commentsResp.data || [])
      setProducts(productsResp.data || [])
      setLoading(false)
    }
    load()
  }, [])

  const platforms = useMemo(() => [...new Set(allComments.map(c => c.platform))].sort(), [allComments])

  const filtered = useMemo(() => {
    let result = [...allComments]
    if (selectedProduct !== 'all') result = result.filter(c => c.product_id === selectedProduct)
    if (selectedPlatform !== 'all') result = result.filter(c => c.platform === selectedPlatform)
    result.sort((a, b) => {
      let av = a[sortBy], bv = b[sortBy]
      if (av == null) return 1
      if (bv == null) return -1
      if (typeof av === 'string') return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av)
      return sortAsc ? av - bv : bv - av
    })
    return result
  }, [allComments, selectedProduct, selectedPlatform, sortBy, sortAsc])

  const toggleSort = (col) => {
    if (sortBy === col) setSortAsc(!sortAsc)
    else { setSortBy(col); setSortAsc(false) }
  }
  const SortIcon = ({ col }) => {
    if (sortBy !== col) return <span className="text-gray-300 dark:text-gray-600 ml-1">↕</span>
    return <span className="text-indigo-500 ml-1">{sortAsc ? '↑' : '↓'}</span>
  }

  const buyCount = filtered.filter(c => c.is_buy_intent).length
  const problemCount = filtered.filter(c => c.is_problem_language).length
  const repeatCount = filtered.filter(c => c.is_repeat_purchase).length
  const highIntent = filtered.filter(c => (c.intent_level || 1) >= 4).length

  if (loading) return <LoadingSpinner message="Loading comments..." />

  return (
    <div>
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mb-5">
        {[
          { label: 'Total Comments', value: filtered.length },
          { label: 'High Intent (L4+5)', value: highIntent },
          { label: 'Buy Intent', value: buyCount },
          { label: 'Problem Language', value: problemCount },
          { label: 'Repeat Purchase', value: repeatCount },
        ].map(card => (
          <div key={card.label} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{card.label}</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-1 tabular-nums">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5 p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
        <select value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)} className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
          <option value="all">All Products</option>
          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={selectedPlatform} onChange={e => setSelectedPlatform(e.target.value)} className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
          <option value="all">All Platforms</option>
          {platforms.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <span className="text-xs text-gray-400 ml-auto">{filtered.length} comments</span>
      </div>

      {/* Comments table */}
      {filtered.length === 0 ? (
        <EmptyState title="No comments" description="Comments will appear after running a Pass 2 scrape." />
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <th onClick={() => toggleSort('comment_body')} className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700">Comment<SortIcon col="comment_body" /></th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Product</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Source Post</th>
                <th onClick={() => toggleSort('upvotes')} className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700">Upvotes<SortIcon col="upvotes" /></th>
                <th onClick={() => toggleSort('intent_level')} className="text-center px-4 py-3 font-medium text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700">Intent<SortIcon col="intent_level" /></th>
                <th onClick={() => toggleSort('sentiment_score')} className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700">Sentiment<SortIcon col="sentiment_score" /></th>
                <th className="text-center px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Flags</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const intentLvl = c.intent_level || 1
                return (
                  <tr key={c.id} className={`border-b border-gray-100 dark:border-gray-800 ${
                    c.is_buy_intent ? 'bg-emerald-50/30 dark:bg-emerald-900/5' :
                    c.is_problem_language ? 'bg-red-50/30 dark:bg-red-900/5' : ''
                  } ${intentLvl >= 4 ? 'border-l-2 border-l-emerald-500' : ''}`}>
                    <td className="px-4 py-3 max-w-lg">
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-snug line-clamp-3">{c.comment_body}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{c.products?.name || '—'}</td>
                    <td className="px-4 py-3 text-xs">
                      {c.posts?.post_url ? (
                        <a href={c.posts.post_url} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:text-indigo-700 line-clamp-1">
                          {(c.posts.post_title || 'View post').slice(0, 40)}...
                        </a>
                      ) : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-600 dark:text-gray-400">{c.upvotes || 0}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${INTENT_COLORS[intentLvl]}`}>L{intentLvl}</span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums"><SentimentIndicator score={c.sentiment_score} /></td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {c.is_buy_intent && <span className="px-1.5 py-0.5 text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded font-medium">BUY</span>}
                        {c.is_problem_language && <span className="px-1.5 py-0.5 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded font-medium">PROBLEM</span>}
                        {c.is_repeat_purchase && <span className="px-1.5 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded font-medium">REPEAT</span>}
                      </div>
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

function SentimentIndicator({ score }) {
  if (score == null) return <span className="text-gray-400">—</span>
  const color = score > 0.1 ? 'text-emerald-600 dark:text-emerald-400' : score < -0.1 ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
  return <span className={`text-xs font-medium ${color}`}>{score > 0 ? '+' : ''}{score.toFixed(2)}</span>
}
