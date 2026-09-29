/**
 * Mailix API client.
 *
 * Talks to the external backend at VITE_API_URL. Uses bearer tokens
 * (access in memory + localStorage, refresh in localStorage). Auto-refreshes
 * once on 401 and retries.
 *
 * Security note: tokens in localStorage are exposed to XSS. Acceptable for
 * pre-launch dev; before production, move refresh to an httpOnly cookie the
 * backend sets on /auth/otp/verify + /auth/register.
 */

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:4000/api/v1'

const AT_KEY = 'mailix_at'
const RT_KEY = 'mailix_rt'
const WS_KEY = 'mailix_ws'

const isBrowser = typeof window !== 'undefined'

// ── Token store ──────────────────────────────────────────────────────────────
// Access token is cached in a module-level variable so we don't hit localStorage
// on every request. Cleared on logout + on failed refresh.

let accessTokenCache: string | null = null

function getAccessToken(): string | null {
  if (accessTokenCache) return accessTokenCache
  if (!isBrowser) return null
  accessTokenCache = window.localStorage.getItem(AT_KEY)
  return accessTokenCache
}

function getRefreshToken(): string | null {
  if (!isBrowser) return null
  return window.localStorage.getItem(RT_KEY)
}

function setTokens(accessToken: string, refreshToken: string): void {
  accessTokenCache = accessToken
  if (!isBrowser) return
  window.localStorage.setItem(AT_KEY, accessToken)
  window.localStorage.setItem(RT_KEY, refreshToken)
}

function clearTokens(): void {
  accessTokenCache = null
  if (!isBrowser) return
  window.localStorage.removeItem(AT_KEY)
  window.localStorage.removeItem(RT_KEY)
}

// ── Active workspace ID (persistent per browser) ─────────────────────────────
// Not sensitive — server also enforces membership before returning data.

export function getWorkspaceId(): string | null {
  if (!isBrowser) return null
  return window.localStorage.getItem(WS_KEY)
}

export function setWorkspaceId(id: string): void {
  if (!isBrowser) return
  window.localStorage.setItem(WS_KEY, id)
}

export function clearWorkspaceId(): void {
  if (!isBrowser) return
  window.localStorage.removeItem(WS_KEY)
}

// ── Refresh flow (used by request() on 401) ──────────────────────────────────

async function tryRefresh(): Promise<boolean> {
  const rt = getRefreshToken()
  if (!rt) return false
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: rt }),
    })
    if (!res.ok) {
      clearTokens()
      return false
    }
    const json = (await res.json().catch(() => null)) as
      | { data?: { accessToken?: string; refreshToken?: string } }
      | null
    const at = json?.data?.accessToken
    const newRt = json?.data?.refreshToken
    if (!at || !newRt) {
      clearTokens()
      return false
    }
    setTokens(at, newRt)
    return true
  } catch {
    return false
  }
}

// ── Core request ─────────────────────────────────────────────────────────────

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  isRetry = false,
): Promise<T> {
  const at = getAccessToken()
  const headers: Record<string, string> = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (at) headers['Authorization'] = `Bearer ${at}`

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  // On 401 with a stored access token, try refreshing once and retry.
  // Don't retry if we already tried, or if there was no token to begin with
  // (that's a genuine "not authorized" — no refresh will help).
  if (res.status === 401 && !isRetry && at) {
    const ok = await tryRefresh()
    if (ok) return request<T>(method, path, body, true)
  }

  let json: unknown
  try {
    json = await res.json()
  } catch {
    json = null
  }

  if (!res.ok) {
    const j = json as { error?: { message?: string }; message?: string } | null
    const message = j?.error?.message ?? j?.message ?? `Request failed with status ${res.status}`
    throw new Error(message)
  }

  return json as T
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
  setTokens,
  clearTokens,
  getAccessToken,
  getRefreshToken,
  hasSession: () => getAccessToken() !== null,
}
