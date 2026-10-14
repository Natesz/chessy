import { Chess } from 'chess.js'
import type { EvalResult } from '~/types/chess'

/**
 * Stockfish 18 lite, single-threaded: a (kis) NNUE háló a WASM-ba van építve,
 * nem kell SharedArrayBuffer / COOP-COEP. (A korábbi SF16 single build NNUE nélkül,
 * „classical evaluation”-nel futott → pontatlan értékelés.)
 */
export const STOCKFISH_WORKER_URL = '/stockfish/stockfish-18-lite-single.js'

/** UCI lépéssor → SAN lista; az első illegális lépésnél megáll */
export function uciMovesToSan(fen: string, uciMoves: string[]): string[] {
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

/**
 * UCI `info` sor score-ja világos szemszögéből.
 * A UCI score mindig a lépő fél szemszögéből jön → colorMult = -1, ha sötét lép.
 */
export function parseUciScore(line: string, colorMult: number, depth: number): EvalResult | null {
  const cpMatch = line.match(/score cp (-?\d+)/)
  if (cpMatch) {
    return { type: 'cp', value: (parseInt(cpMatch[1]!) / 100) * colorMult, depth }
  }
  const mateMatch = line.match(/score mate (-?\d+)/)
  if (mateMatch) {
    return { type: 'mate', value: parseInt(mateMatch[1]!) * colorMult, depth }
  }
  return null
}

/** Összehasonlítható szám: matt = ±100 (közelebbi matt nagyobb) */
export function evalToNumber(score: EvalResult): number {
  if (score.type === 'cp') return score.value
  if (score.value === 0) return 0
  return Math.sign(score.value) * (100 - Math.min(Math.abs(score.value), 50))
}

/** Kijelzés: +1.8 / −0.4 / #3 / #-2 */
export function formatEval(score: EvalResult): string {
  if (score.type === 'mate') return `#${score.value}`
  const v = score.value
  return `${v > 0 ? '+' : ''}${v.toFixed(1)}`
}
