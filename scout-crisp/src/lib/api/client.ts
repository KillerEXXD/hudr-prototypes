import { USE_MOCK, API_BASE_URL, HUDR_API_KEY, MOCK_LATENCY_MS } from '@/config/api'
import { resolveMock } from './mock/resolver'
import type { ApiResponse } from './types'

// =====================================================================
// HTTP client (mirrors hudr-pwa apiClient). The mock/live branch lives ONLY
// here: in mock mode it resolves local fixtures; in live mode it fetches
// api.hudr.ai with the X-API-Key header. Services above never know which.
// =====================================================================

type Params = Record<string, string | number | undefined> | undefined

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

class ApiClient {
  async get<T>(endpoint: string, params?: Params): Promise<ApiResponse<T>> {
    if (USE_MOCK) {
      await delay(MOCK_LATENCY_MS)
      try {
        const data = resolveMock<T>(endpoint, params)
        if (data == null) return { success: false, error: 'Not found' }
        return { success: true, data }
      } catch (e) {
        return { success: false, error: (e as Error).message }
      }
    }
    // ---- LIVE: identical surface, real network ----
    const url = new URL(API_BASE_URL + endpoint)
    if (params) {
      for (const [k, v] of Object.entries(params)) if (v != null) url.searchParams.set(k, String(v))
    }
    const res = await fetch(url.toString(), {
      headers: { 'Content-Type': 'application/json', 'X-API-Key': HUDR_API_KEY },
    })
    const body = (await res.json()) as ApiResponse<T>
    return body
  }

  // Stub — the ported replayer's bug-report modal references apiClient.post.
  // That feature isn't wired in the prototype; this just prevents a crash.
  async post<T>(_endpoint: string, _body?: unknown): Promise<ApiResponse<T>> {
    return { success: false, error: 'Not implemented in prototype' }
  }
}

export const apiClient = new ApiClient()
