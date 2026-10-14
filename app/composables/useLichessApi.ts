// Lichess API hívások – szigorúan egymás után (Lichess kérése), 429 esetén 60 s szünet.
const EXPLORER = 'https://explorer.lichess.ovh/lichess'
const LICHESS = 'https://lichess.org'
// Explorer rating csoportok: g → [g, következő g)
export const EXPLORER_RATING_GROUPS = [0, 1000, 1200, 1400, 1600, 1800, 2000, 2200, 2500]

export interface ExplorerMove {
  uci: string
  san: string
  white: number
  draws: number
  black: number
}

export interface ExplorerGameRef {
  id: string
  white: { name: string, rating: number }
  black: { name: string, rating: number }
}

export interface ExplorerResponse {
  moves: ExplorerMove[]
  topGames?: ExplorerGameRef[]
  recentGames?: ExplorerGameRef[]
  opening?: { eco: string, name: string } | null
}

export interface LichessGame {
  id: string
  moves: string // SAN, szóközzel
  initialFen?: string
  variant: string
  players: {
    white: { user?: { name: string }, rating?: number, aiLevel?: number }
    black: { user?: { name: string }, rating?: number, aiLevel?: number }
  }
  opening?: { eco: string, name: string, ply: number }
}

export class LichessAuthError extends Error {}

const explorerCache = new Map<string, ExplorerResponse>()
const gameCache = new Map<string, LichessGame>()
const rateLimitedUntil = ref(0)
let queue: Promise<unknown> = Promise.resolve()

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function useLichessApi() {
  const auth = useLichessAuth()

  async function doRequest<T>(url: string, retry = true): Promise<T> {
    const headers: Record<string, string> = { Accept: 'application/json' }
    if (auth.token.value) headers.Authorization = `Bearer ${auth.token.value}`
    const res = await fetch(url, { headers })
    if (res.status === 429) {
      rateLimitedUntil.value = Date.now() + 60_000
      await sleep(60_000)
      rateLimitedUntil.value = 0
      if (retry) return doRequest<T>(url, false)
      throw new Error('A Lichess túl sok kérést jelzett, próbáld később.')
    }
    if (res.status === 401) {
      auth.invalidate()
      throw new LichessAuthError('A Lichess bejelentkezés lejárt.')
    }
    if (!res.ok) throw new Error(`Lichess hiba (${res.status})`)
    return await res.json() as T
  }

  function request<T>(url: string): Promise<T> {
    const run = queue.then(() => doRequest<T>(url))
    queue = run.catch(() => {})
    return run
  }

  /** ratings: explorer rating csoportok (üres = mind). Nincs speed szűrés: minden tempó mehet */
  async function fetchExplorer(play: string[], ratings: number[] = []): Promise<ExplorerResponse> {
    const params = new URLSearchParams({
      moves: '12',
      topGames: '4',
      recentGames: '4',
    })
    if (play.length) params.set('play', play.join(','))
    if (ratings.length) params.set('ratings', ratings.join(','))
    const url = `${EXPLORER}?${params}`
    const cached = explorerCache.get(url)
    if (cached) return cached
    const data = await request<ExplorerResponse>(url)
    explorerCache.set(url, data)
    return data
  }

  /**
   * Játszmák letöltése egy hívással: POST /api/games/export/_ids.
   * A GET /game/export/{id} böngészőből gyakran 401-et ad ("Login required"),
   * Authorization fejléccel pedig a CORS preflight 404-be fut. Itt text/plain body,
   * auth fejléc nélkül → "simple request", nincs preflight.
   */
  async function fetchGames(ids: string[]): Promise<void> {
    const missing = [...new Set(ids)].filter(id => !gameCache.has(id))
    if (!missing.length) return
    const run = queue.then(() => doFetchGames(missing))
    queue = run.catch(() => {})
    await run
  }

  async function doFetchGames(ids: string[], retry = true): Promise<void> {
    const res = await fetch(
      `${LICHESS}/api/games/export/_ids?moves=true&clocks=false&evals=false&opening=true`,
      { method: 'POST', headers: { 'Content-Type': 'text/plain', 'Accept': 'application/x-ndjson' }, body: ids.join(',') },
    )
    if (res.status === 429) {
      rateLimitedUntil.value = Date.now() + 60_000
      await sleep(60_000)
      rateLimitedUntil.value = 0
      if (retry) return doFetchGames(ids, false)
      throw new Error('A Lichess túl sok kérést jelzett, próbáld később.')
    }
    if (!res.ok) throw new Error(`Lichess hiba (${res.status})`)
    const text = await res.text()
    for (const line of text.split('\n')) {
      if (!line.trim()) continue
      const game = JSON.parse(line) as LichessGame
      gameCache.set(game.id, game)
    }
  }

  async function fetchGame(id: string): Promise<LichessGame | null> {
    await fetchGames([id])
    return gameCache.get(id) ?? null
  }

  return {
    rateLimitedUntil: readonly(rateLimitedUntil),
    fetchExplorer,
    fetchGames,
    fetchGame,
  }
}
