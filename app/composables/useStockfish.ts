import { Chess } from 'chess.js'
import type { AnalysisLine, EvalResult } from '~/types/chess'
// ?url → Vite csak URL-t ad vissza, nem bundle-öli a fájlt
import stockfishUrl from 'stockfish/src/stockfish-nnue-16-single.js?url'

export function useStockfish() {
  let worker: Worker | null = null
  let isReady = false
  let pendingFen: string | null = null
  let analyzingColor: 'w' | 'b' = 'w'
  let currentFen = ''
  let gosSent = 0
  let bestmovesReceived = 0

  interface CachedEntry { lines: AnalysisLine[], evalResult: EvalResult | null, depth: number }
  const analysisCache = new Map<string, CachedEntry>()

  function saveCurrentToCache() {
    if (!currentFen || analysisLines.value.length === 0) return
    const depth = evalResult.value?.depth ?? 0
    const existing = analysisCache.get(currentFen)
    if (!existing || existing.depth < depth) {
      analysisCache.set(currentFen, { lines: [...analysisLines.value], evalResult: evalResult.value, depth })
    }
  }

  const evalResult = ref<EvalResult | null>(null)
  const isAnalyzing = ref(false)
  const analysisLines = ref<AnalysisLine[]>([])

  function uciMovesToSan(fen: string, uciMoves: string[]): string[] {
    const chess = new Chess(fen)
    const san: string[] = []
    for (const uci of uciMoves) {
      try {
        const result = chess.move({
          from: uci.slice(0, 2),
          to: uci.slice(2, 4),
          promotion: uci.length === 5 ? uci[4] : undefined,
        })
        if (!result) break
        san.push(result.san)
      }
      catch {
        break
      }
    }
    return san
  }

  function sendAnalyze(fen: string, continueFromCache = false) {
    if (!worker) return
    saveCurrentToCache()  // Navigálás előtt elmentjük az aktuális pozíció elemzését
    gosSent++
    analyzingColor = fen.split(' ')[1] as 'w' | 'b'
    currentFen = fen
    if (!continueFromCache) {
      analysisLines.value = []  // Csak új pozíciónál töröljük – cache folytatásnál nem villódzik
    }
    isAnalyzing.value = true
    worker.postMessage('stop')
    worker.postMessage('setoption name MultiPV value 3')
    worker.postMessage(`position fen ${fen}`)
    worker.postMessage('go infinite')
  }

  function init() {
    if (worker || !import.meta.client) return

    worker = new Worker(stockfishUrl, { type: 'classic' })

    worker.onerror = (e) => {
      console.error('[Stockfish] worker error:', e)
    }

    worker.onmessage = (event: MessageEvent<string>) => {
      const line = event.data

      if (line === 'readyok') {
        isReady = true
        if (pendingFen !== null) {
          sendAnalyze(pendingFen)
          pendingFen = null
        }
        return
      }

      if (line.startsWith('info') && (line.includes('score cp') || line.includes('score mate'))) {
        if (bestmovesReceived !== gosSent - 1) return
        const colorMult = analyzingColor === 'b' ? -1 : 1
        const multipvMatch = line.match(/multipv (\d+)/)
        const depthMatch = line.match(/depth (\d+)/)
        const pvMatch = line.match(/ pv (.+)$/)
        const multipvIndex = multipvMatch ? parseInt(multipvMatch[1]) : 1
        const depth = parseInt(depthMatch?.[1] ?? '0')

        let scoreResult: EvalResult | null = null

        if (line.includes('score cp')) {
          const cpMatch = line.match(/score cp (-?\d+)/)
          if (cpMatch) {
            scoreResult = {
              type: 'cp',
              value: (parseInt(cpMatch[1]) / 100) * colorMult,
              depth,
            }
          }
        }
        else if (line.includes('score mate')) {
          const mateMatch = line.match(/score mate (-?\d+)/)
          if (mateMatch) {
            scoreResult = {
              type: 'mate',
              value: parseInt(mateMatch[1]) * colorMult,
              depth,
            }
          }
        }

        if (scoreResult) {
          if (multipvIndex === 1) {
            evalResult.value = scoreResult
          }

          if (pvMatch) {
            const uciMoves = pvMatch[1].trim().split(' ').slice(0, 5)
            let sanMoves: string[] = []
            try {
              sanMoves = uciMovesToSan(currentFen, uciMoves)
            }
            catch {
              // skip SAN conversion if FEN is invalid (e.g. getBestMove context)
            }
            const lines = [...analysisLines.value]
            lines[multipvIndex - 1] = {
              multipv: multipvIndex,
              score: scoreResult,
              moves: sanMoves,
              bestMove: uciMoves[0] ?? null,
            }
            analysisLines.value = lines
          }
        }
      }

      if (line.startsWith('bestmove')) {
        bestmovesReceived++
        if (bestmovesReceived === gosSent) {
          isAnalyzing.value = false
        }
      }
    }

    worker.postMessage('uci')
    worker.postMessage('isready')
  }

  function analyze(fen: string) {
    if (!worker) init()
    if (!worker) return

    const cached = analysisCache.get(fen)
    if (cached) {
      // Cache hit: azonnali megjelenítés, majd go infinite folytatás (nem törli a sorokat)
      analysisLines.value = cached.lines
      if (cached.evalResult) evalResult.value = cached.evalResult
      if (!isReady) { pendingFen = fen; return }
      sendAnalyze(fen, true)
      return
    }

    if (!isReady) {
      pendingFen = fen
      return
    }

    sendAnalyze(fen)
  }

  function stop() {
    worker?.postMessage('stop')
    isAnalyzing.value = false
  }

  // "Új elemzés" gombra hívandó: törli a cache-t és a megjelenített adatokat
  // NE küldjünk 'stop'-ot – sendAnalyze mindig küld egyet, és a dupla stop
  // dupla bestmove választ generál, ami miatt az egész elemzés szűrve lesz
  function resetAnalysis() {
    analysisCache.clear()
    analysisLines.value = []
    evalResult.value = null
    isAnalyzing.value = false
  }

  function getBestMove(fen: string, depth: number): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!worker) {
        reject(new Error('Worker not initialized'))
        return
      }

      const timeoutId = setTimeout(() => reject(new Error('getBestMove timeout')), 10000)
      const targetGeneration = gosSent + 1
      gosSent++

      const prevOnMessage = worker.onmessage
      worker.onmessage = (event: MessageEvent<string>) => {
        // Also run original handler to keep analysis state coherent
        prevOnMessage?.call(worker!, event)

        const line = event.data
        if (line.startsWith('bestmove') && bestmovesReceived === targetGeneration) {
          clearTimeout(timeoutId)
          worker!.onmessage = prevOnMessage
          const parts = line.split(' ')
          const uci = parts[1]
          if (uci && uci !== '(none)') resolve(uci)
          else reject(new Error('No move returned'))
        }
      }

      worker.postMessage('stop')
      worker.postMessage('setoption name MultiPV value 1')
      worker.postMessage(`position fen ${fen}`)
      worker.postMessage(`go depth ${depth}`)
    })
  }

  function destroy() {
    worker?.terminate()
    worker = null
    isReady = false
    pendingFen = null
    analysisLines.value = []
  }

  return {
    evalResult,
    isAnalyzing,
    analysisLines,
    init,
    analyze,
    stop,
    getBestMove,
    resetAnalysis,
    destroy,
  }
}
