import { Chess } from 'chess.js'
import type { AnalysisLine } from '~/types/chess'
import type {
  PositionKind,
  TrainingAnswer,
  TrainingPlayer,
  TrainingPosition,
  TrainingSettings,
  TrainingStats,
  TrainingStatus,
} from '~/types/training'
import type { ExplorerGameRef, ExplorerResponse, LichessGame } from '~/composables/useLichessApi'
import { LichessAuthError } from '~/composables/useLichessApi'

export const MAX_ADVANTAGE_CAP = 10 // ennél a csúszkaértéknél nincs felső korlát
const SETTINGS_KEY = 'chessy-training-settings'
const STATS_KEY = 'chessy-training-stats'
const PREFETCH = 2
const MAX_ATTEMPTS = 15 // kiértékelt jelölt pozíciók száma egy feladványhoz
const POSITIONS_PER_GAME = 2
const MIN_MOVE_GAMES = 20 // random walk: ennél kevesebb játszmás lépést nem választunk
const ENGINE_DEPTH = 16

export const DEFAULT_SETTINGS: TrainingSettings = {
  openingId: 'any',
  customMoves: '',
  mode: 'classic',
  minAdvantage: 1.0,
  maxAdvantage: 3.0,
  gap: 1.5,
  equalThreshold: 0.5,
  minPly: 16,
  maxPly: 50,
  quietOnly: true,
}

function emptyStats(): TrainingStats {
  return { total: 0, correct: 0, streak: 0, bestStreak: 0, byKind: {}, byOpening: {} }
}

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback
  }
  catch {
    return fallback
  }
}

function randInt(min: number, max: number) {
  return min + Math.floor(Math.random() * (max - min + 1))
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

/** Lépés súlyozott véletlen választása a játszmaszám alapján */
function pickWeighted(moves: ExplorerResponse['moves']) {
  const candidates = moves.filter(m => m.white + m.draws + m.black >= MIN_MOVE_GAMES)
  const total = candidates.reduce((s, m) => s + m.white + m.draws + m.black, 0)
  let r = Math.random() * total
  for (const m of candidates) {
    r -= m.white + m.draws + m.black
    if (r <= 0) return m
  }
  return candidates[0] ?? null
}

function player(p: LichessGame['players']['white']): TrainingPlayer {
  return {
    name: p.user?.name ?? (p.aiLevel ? `Stockfish ${p.aiLevel}` : 'Anonim'),
    rating: p.rating ?? null,
  }
}

class NoPositionError extends Error {}

interface Candidate {
  fen: string
  ply: number
  lastMoveSan: string | null
}

/**
 * Pozíció osztályozása a beállított mód szerint.
 * Visszaad: típus + helyes válasz, vagy null ha nem felel meg.
 */
export function classifyPosition(
  turn: 'w' | 'b',
  lines: AnalysisLine[],
  s: TrainingSettings,
): { kind: PositionKind, correct: TrainingAnswer } | null {
  const best = lines[0]
  if (!best) return null
  const white = evalToNumber(best.score)
  const stmMult = turn === 'w' ? 1 : -1
  const bestStm = white * stmMult
  const second = lines[1]
  const gapStm = second ? bestStm - evalToNumber(second.score) * stmMult : null
  const maxCap = s.maxAdvantage >= MAX_ADVANTAGE_CAP ? Infinity : s.maxAdvantage
  const stmColor: TrainingAnswer = turn === 'w' ? 'white' : 'black'

  const tryPuzzle = () =>
    gapStm !== null && gapStm >= s.gap && bestStm >= Math.max(s.minAdvantage, s.equalThreshold) && bestStm <= maxCap
      ? { kind: 'puzzle' as const, correct: stmColor }
      : null
  const tryOnlyMove = () =>
    gapStm !== null && gapStm >= s.gap && Math.abs(white) < s.equalThreshold
      ? { kind: 'onlymove' as const, correct: 'equal' as const }
      : null
  const tryClassic = () => {
    const abs = Math.abs(white)
    if (abs < s.minAdvantage || abs > maxCap) return null
    const correct: TrainingAnswer = abs < s.equalThreshold ? 'equal' : white > 0 ? 'white' : 'black'
    return { kind: 'classic' as const, correct }
  }

  switch (s.mode) {
    case 'classic': return tryClassic()
    case 'puzzle': return tryPuzzle()
    case 'onlymove': return tryOnlyMove()
    case 'mixed': return tryPuzzle() ?? tryOnlyMove() ?? tryClassic()
  }
}

export function useTrainingSession() {
  const api = useLichessApi()
  const evaluator = useStockfishEvaluator()

  const settings = ref<TrainingSettings>(loadJson(SETTINGS_KEY, DEFAULT_SETTINGS))
  const stats = ref<TrainingStats>(loadJson(STATS_KEY, emptyStats()))
  const status = ref<TrainingStatus>('idle')
  const current = ref<TrainingPosition | null>(null)
  const userAnswer = ref<TrainingAnswer | null>(null)
  const errorMessage = ref<string | null>(null)
  const searchAttempt = ref(0)
  const queue: TrainingPosition[] = []
  const queueSize = ref(0)

  watch(settings, v => localStorage.setItem(SETTINGS_KEY, JSON.stringify(v)), { deep: true })
  watch(stats, v => localStorage.setItem(STATS_KEY, JSON.stringify(v)), { deep: true })

  const openingResolved = computed<{ name: string, uci: string[], error: string | null }>(() => {
    const s = settings.value
    if (s.openingId === 'custom') {
      try {
        const { uci } = parseOpeningMoves(s.customMoves)
        return { name: s.customMoves.trim() || 'Egyedi', uci, error: null }
      }
      catch (e) {
        return { name: 'Egyedi', uci: [], error: (e as Error).message }
      }
    }
    const preset = OPENING_PRESETS.find(p => p.id === s.openingId) ?? OPENING_PRESETS[0]!
    return { name: preset.name, uci: preset.moves ? parseOpeningMoves(preset.moves).uci : [], error: null }
  })

  let generation = 0
  let filling = false
  const usedGameIds = new Set<string>()

  /** Explorer random walk a megnyitás végétől; a végpont játszmáit adja vissza */
  async function randomWalk(openingUci: string[]) {
    const play = [...openingUci]
    const extra = openingUci.length === 0 ? randInt(4, 10) : randInt(0, 4)
    let node = await api.fetchExplorer(play)
    let games: ExplorerGameRef[] = [...(node.topGames ?? []), ...(node.recentGames ?? [])]
    for (let i = 0; i < extra; i++) {
      const move = pickWeighted(node.moves)
      if (!move) break
      const next = await api.fetchExplorer([...play, move.uci])
      const nextGames = [...(next.topGames ?? []), ...(next.recentGames ?? [])]
      if (!nextGames.length) break
      play.push(move.uci)
      node = next
      games = nextGames
    }
    return { play, games }
  }

  function buildCandidates(game: LichessGame, walkPlies: number, s: TrainingSettings): Candidate[] {
    if (game.variant !== 'standard' || game.initialFen) return []
    const sans = game.moves.trim().split(/\s+/).filter(Boolean)
    const from = Math.max(s.minPly, walkPlies + 2)
    const to = Math.min(s.maxPly, sans.length - 1)
    if (from > to) return []

    const chess = new Chess()
    const candidates: Candidate[] = []
    let lastCaptured = false
    let lastSan: string | null = null
    for (let ply = 0; ply <= to; ply++) {
      if (ply >= from) {
        const quietOk = !s.quietOnly || (!chess.inCheck() && !lastCaptured)
        if (quietOk && !chess.isGameOver() && chess.moves().length >= 2) {
          candidates.push({ fen: chess.fen(), ply, lastMoveSan: lastSan })
        }
      }
      const san = sans[ply]
      if (!san) break
      try {
        const m = chess.move(san)
        lastCaptured = !!m.captured
        lastSan = m.san
      }
      catch {
        break
      }
    }
    return shuffle(candidates).slice(0, POSITIONS_PER_GAME)
  }

  async function generateOne(gen: number): Promise<TrainingPosition> {
    const s = { ...settings.value }
    const opening = openingResolved.value
    if (opening.error) throw new NoPositionError(opening.error)

    let attempts = 0
    let walks = 0
    while (attempts < MAX_ATTEMPTS && walks < MAX_ATTEMPTS * 2) {
      walks++
      const { play, games } = await randomWalk(opening.uci)
      if (gen !== generation) throw new Error('stale')
      const fresh = games.filter(g => !usedGameIds.has(g.id))
      const ref = fresh[randInt(0, fresh.length - 1)]
      if (!ref) {
        if (!games.length && play.length === opening.uci.length) {
          throw new NoPositionError('Ehhez a megnyitáshoz nem találtam játszmát a Lichess adatbázisban.')
        }
        continue
      }
      usedGameIds.add(ref.id)

      // Egy hívással a csomópont összes friss játszmája (cache-be), utána a kiválasztott
      await api.fetchGames(fresh.map(g => g.id))
      const game = await api.fetchGame(ref.id)
      if (gen !== generation) throw new Error('stale')
      if (!game) continue

      for (const c of buildCandidates(game, play.length, s)) {
        attempts++
        if (!current.value) searchAttempt.value = attempts
        const lines = await evaluator.evaluate(c.fen, ENGINE_DEPTH, 3)
        if (gen !== generation) throw new Error('stale')
        const turn = c.fen.split(' ')[1] as 'w' | 'b'
        const cls = classifyPosition(turn, lines, s)
        if (!cls) continue
        return {
          id: `${game.id}-${c.ply}`,
          fen: c.fen,
          turn,
          ply: c.ply,
          lastMoveSan: c.lastMoveSan,
          gameId: game.id,
          white: player(game.players.white),
          black: player(game.players.black),
          gameOpening: game.opening?.name ?? null,
          openingLabel: opening.name,
          kind: cls.kind,
          evalWhite: lines[0]!.score,
          lines,
          correct: cls.correct,
        }
      }
    }
    throw new NoPositionError('Nem találtam a beállításoknak megfelelő állást – lazíts a szűrőkön (pl. előny-tartomány, különbség).')
  }

  function showFromQueue(): boolean {
    const next = queue.shift()
    queueSize.value = queue.length
    if (!next) return false
    current.value = next
    userAnswer.value = null
    status.value = 'ready'
    return true
  }

  async function fillQueue() {
    if (filling) return
    filling = true
    const gen = generation
    try {
      while (gen === generation && queue.length < PREFETCH) {
        const pos = await generateOne(gen)
        if (gen !== generation) break
        queue.push(pos)
        queueSize.value = queue.length
        if (status.value === 'searching') showFromQueue()
      }
    }
    catch (e) {
      if (gen === generation && (e as Error).message !== 'stale') {
        errorMessage.value = e instanceof LichessAuthError || e instanceof NoPositionError
          ? e.message
          : `Hiba az állás keresésekor: ${(e as Error).message}`
        if (status.value === 'searching') status.value = 'error'
      }
    }
    finally {
      filling = false
      // Beállítás-váltás történt keresés közben → új generációval újraindul
      if (gen !== generation && status.value === 'searching') fillQueue()
    }
  }

  function start() {
    generation++
    queue.length = 0
    queueSize.value = 0
    current.value = null
    userAnswer.value = null
    errorMessage.value = null
    searchAttempt.value = 0
    status.value = 'searching'
    fillQueue()
  }

  function next() {
    errorMessage.value = null
    if (showFromQueue()) {
      fillQueue()
      return
    }
    current.value = null
    userAnswer.value = null
    searchAttempt.value = 0
    status.value = 'searching'
    fillQueue()
  }

  function bump(map: Record<string, { total: number, correct: number }>, key: string, ok: boolean) {
    const b = map[key] ?? { total: 0, correct: 0 }
    b.total++
    if (ok) b.correct++
    map[key] = b
  }

  function answer(choice: TrainingAnswer) {
    const pos = current.value
    if (!pos || status.value !== 'ready') return
    userAnswer.value = choice
    status.value = 'answered'
    const ok = choice === pos.correct
    const st = stats.value
    st.total++
    if (ok) {
      st.correct++
      st.streak++
      st.bestStreak = Math.max(st.bestStreak, st.streak)
    }
    else {
      st.streak = 0
    }
    bump(st.byKind, pos.kind, ok)
    bump(st.byOpening, pos.openingLabel, ok)
  }

  function resetStats() {
    stats.value = emptyStats()
  }

  function init() {
    evaluator.init()
  }

  function destroy() {
    generation++
    evaluator.destroy()
  }

  return {
    settings,
    stats,
    status,
    current,
    userAnswer,
    errorMessage,
    searchAttempt,
    maxAttempts: MAX_ATTEMPTS,
    queueSize,
    openingResolved,
    rateLimitedUntil: api.rateLimitedUntil,
    init,
    destroy,
    start,
    next,
    answer,
    resetStats,
  }
}
