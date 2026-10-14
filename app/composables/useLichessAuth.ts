// Lichess OAuth2 PKCE – nincs szerver, nincs client secret.
// A Lichess nem kér app-regisztrációt: a client_id tetszőleges azonosító.
const LICHESS = 'https://lichess.org'
const CLIENT_ID = 'ichessy'
const STORAGE_KEY = 'chessy-lichess-auth'
const PKCE_KEY = 'chessy-lichess-pkce'

interface StoredAuth {
  token: string
  expiresAt: number
  username: string | null
}

// Modul-szintű (singleton) state: minden hívó ugyanazt a tokent látja
const token = ref<string | null>(null)
const username = ref<string | null>(null)
const authError = ref<string | null>(null)
let loaded = false

function base64Url(bytes: Uint8Array): string {
  let str = ''
  for (const b of bytes) str += String.fromCharCode(b)
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function randomString(length = 64): string {
  return base64Url(crypto.getRandomValues(new Uint8Array(length))).slice(0, length)
}

async function sha256Base64Url(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
  return base64Url(new Uint8Array(digest))
}

function redirectUri(): string {
  return `${window.location.origin}/training`
}

function persist() {
  if (!token.value) {
    localStorage.removeItem(STORAGE_KEY)
    return
  }
  const prev = localStorage.getItem(STORAGE_KEY)
  const expiresAt = prev ? (JSON.parse(prev) as StoredAuth).expiresAt : Date.now() + 300 * 86400_000
  const data: StoredAuth = { token: token.value, expiresAt, username: username.value }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function load() {
  if (loaded || !import.meta.client) return
  loaded = true
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const data = JSON.parse(raw) as StoredAuth
    if (data.expiresAt < Date.now()) {
      localStorage.removeItem(STORAGE_KEY)
      return
    }
    token.value = data.token
    username.value = data.username
  }
  catch {
    localStorage.removeItem(STORAGE_KEY)
  }
}

async function login() {
  const verifier = randomString(64)
  const state = randomString(24)
  const challenge = await sha256Base64Url(verifier)
  sessionStorage.setItem(PKCE_KEY, JSON.stringify({ verifier, state }))
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    redirect_uri: redirectUri(),
    code_challenge_method: 'S256',
    code_challenge: challenge,
    state,
  })
  window.location.href = `${LICHESS}/oauth?${params}`
}

/** OAuth callback (`?code=...&state=...`) feldolgozása. true, ha történt csere. */
async function handleCallback(query: Record<string, unknown>): Promise<boolean> {
  const code = typeof query.code === 'string' ? query.code : null
  const state = typeof query.state === 'string' ? query.state : null
  const error = typeof query.error === 'string' ? query.error : null
  if (error) {
    authError.value = 'A Lichess bejelentkezés megszakadt.'
    return true
  }
  if (!code || !state) return false

  const raw = sessionStorage.getItem(PKCE_KEY)
  sessionStorage.removeItem(PKCE_KEY)
  const pkce = raw ? JSON.parse(raw) as { verifier: string, state: string } : null
  if (!pkce || pkce.state !== state) {
    authError.value = 'Érvénytelen bejelentkezési válasz, próbáld újra.'
    return true
  }

  try {
    const res = await fetch(`${LICHESS}/api/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        code_verifier: pkce.verifier,
        redirect_uri: redirectUri(),
        client_id: CLIENT_ID,
      }),
    })
    if (!res.ok) throw new Error(`token ${res.status}`)
    const data = await res.json() as { access_token: string, expires_in?: number }
    token.value = data.access_token
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in ?? 300 * 86400) * 1000,
      username: null,
    } satisfies StoredAuth))
    authError.value = null
    await fetchAccount()
  }
  catch (e) {
    console.error('[Lichess auth]', e)
    authError.value = 'Nem sikerült a Lichess bejelentkezés.'
  }
  return true
}

async function fetchAccount() {
  if (!token.value) return
  try {
    const res = await fetch(`${LICHESS}/api/account`, {
      headers: { Authorization: `Bearer ${token.value}` },
    })
    if (res.status === 401) {
      invalidate()
      return
    }
    if (!res.ok) return
    const data = await res.json() as { username: string }
    username.value = data.username
    persist()
  }
  catch {
    // Felhasználónév nélkül is működik
  }
}

/** 401 esetén: lejárt / visszavont token */
function invalidate() {
  token.value = null
  username.value = null
  persist()
}

async function logout() {
  const t = token.value
  invalidate()
  if (t) {
    try {
      await fetch(`${LICHESS}/api/token`, { method: 'DELETE', headers: { Authorization: `Bearer ${t}` } })
    }
    catch {
      // A helyi token már törölve
    }
  }
}

export function useLichessAuth() {
  load()
  return {
    token: readonly(token),
    username: readonly(username),
    authError,
    isLoggedIn: computed(() => !!token.value),
    login,
    logout,
    handleCallback,
    fetchAccount,
    invalidate,
  }
}
