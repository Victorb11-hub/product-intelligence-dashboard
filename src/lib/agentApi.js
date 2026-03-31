/**
 * Agent API client — communicates with the FastAPI server.
 *
 * In production (Vercel), the agent server runs on your local machine.
 * Set VITE_AGENT_API_URL to your machine's public URL or ngrok tunnel.
 * If the agent server is unreachable, all read operations still work
 * (they go directly to Supabase), only Run/Trigger buttons will fail
 * with a clear message.
 */
const API_BASE = import.meta.env.VITE_AGENT_API_URL || 'http://localhost:8000'

async function request(method, path, body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  }
  if (body) opts.body = JSON.stringify(body)

  try {
    const res = await fetch(`${API_BASE}${path}`, opts)
    if (!res.ok) {
      const error = await res.text()
      throw new Error(`API error ${res.status}: ${error}`)
    }
    return res.json()
  } catch (err) {
    if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
      throw new Error(
        'Agent server not reachable. The dashboard can view all data, ' +
        'but triggering runs requires the agent server running locally. ' +
        'Run "python start.py" on your machine to enable Run buttons.'
      )
    }
    throw err
  }
}

export const agentApi = {
  runAll: () => request('POST', '/run/all'),
  runSingle: (platform) => request('POST', `/run/${platform}`),
  getStatus: () => request('GET', '/status'),
  getRunStatus: (runId) => request('GET', `/status/${runId}`),
  getWeights: () => request('GET', '/weights'),
  resetWeights: () => request('POST', '/weights/reset'),
  healthCheck: () => request('GET', '/health'),
}
