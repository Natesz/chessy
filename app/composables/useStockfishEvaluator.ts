import type { AnalysisLine } from '~/types/chess'

interface PendingEval {
  fen: string
  colorMult: number
  lines: AnalysisLine[]
  resolve: (lines: AnalysisLine[]) => void
  timeoutId: ReturnType<typeof setTimeout>
}

/**
 * Promise-alapú, sorba állított Stockfish értékelő (saját worker).
 * Egyszerre egy `go depth N` fut, a következő csak a `bestmove` után indul,
 * így nincs stale üzenet – nem kell generation counter.
 */
export function useStockfishEvaluator() {
  let worker: Worker | null = null
  let ready: Promise<void> | null = null
  let current: PendingEval | null = null
  let chain: Promise<unknown> = Promise.resolve()
  let destroyed = false

  function init() {
    if (worker || !import.meta.client) return
    destroyed = false
    worker = new Worker('/stockfish/stockfish-nnue-16-single.js', { type: 'classic' })
    worker.onerror = e => console.error('[Stockfish evaluator] worker error:', e)

    let markReady: () => void = () => {}
    ready = new Promise<void>((resolve) => { markReady = resolve })

    worker.onmessage = (event: MessageEvent<string>) => {
      const line = event.data
      if (line === 'readyok') {
        markReady()
        return
      }
      if (!current) return

      if (line.startsWith('info') && line.includes(' pv ') && !line.includes('bound')) {
        const depth = parseInt(line.match(/depth (\d+)/)?.[1] ?? '0')
        const multipv = parseInt(line.match(/multipv (\d+)/)?.[1] ?? '1')
        const score = parseUciScore(line, current.colorMult, depth)
        const uciMoves = line.match(/ pv (.+)$/)?.[1]?.trim().split(' ').slice(0, 8) ?? []
        if (!score || !uciMoves.length) return
        current.lines[multipv - 1] = {
          multipv,
          score,
          moves: uciMovesToSan(current.fen, uciMoves),
          bestMove: uciMoves[0] ?? null,
        }
        return
      }

      if (line.startsWith('bestmove')) {
        const done = current
        current = null
        clearTimeout(done.timeoutId)
        done.resolve(done.lines.filter(Boolean))
      }
    }

    worker.postMessage('uci')
    worker.postMessage('isready')
  }

  async function runOne(fen: string, depth: number, multipv: number): Promise<AnalysisLine[]> {
    if (destroyed) return []
    if (!worker) init()
    if (!worker || !ready) throw new Error('Stockfish nem elérhető')
    await ready
    const w = worker
    return new Promise<AnalysisLine[]>((resolve) => {
      current = {
        fen,
        colorMult: fen.split(' ')[1] === 'b' ? -1 : 1,
        lines: [],
        resolve,
        // Biztonsági háló: túl lassú elemzésnél megállítjuk, a bestmove lezárja
        timeoutId: setTimeout(() => w.postMessage('stop'), 20_000),
      }
      w.postMessage(`setoption name MultiPV value ${multipv}`)
      w.postMessage(`position fen ${fen}`)
      w.postMessage(`go depth ${depth}`)
    })
  }

  /** Lines világos szemszögű score-ral, multipv sorrendben */
  function evaluate(fen: string, depth = 16, multipv = 3): Promise<AnalysisLine[]> {
    const run = chain.then(() => runOne(fen, depth, multipv))
    chain = run.catch(() => {})
    return run
  }

  function destroy() {
    destroyed = true
    if (current) {
      clearTimeout(current.timeoutId)
      current.resolve([])
      current = null
    }
    worker?.terminate()
    worker = null
    ready = null
    chain = Promise.resolve()
  }

  return { init, evaluate, destroy }
}
