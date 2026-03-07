import { Chess } from 'chess.js'
import type { MoveNode } from '~/types/chess'
import type { ComputedRef, Ref } from 'vue'

interface HistoryApi {
  currentFen: ComputedRef<string>
  currentNode: Ref<MoveNode>
  addMove: (from: string, to: string, promotion?: string) => boolean
  navigateBack: () => void
  navigateTo: (node: MoveNode) => void
  reset: (startFen?: string) => void
}

export function usePgnParser(history: HistoryApi) {
  function tokenize(pgn: string): string[] {
    const cleaned = pgn
      .replace(/\[[^\]]*\]/g, ' ')  // strip header tags
      .replace(/\{[^}]*\}/g, ' ')   // strip comments
      .replace(/\$\d+/g, ' ')       // strip NAG numbers
      .replace(/[!?]+/g, ' ')       // strip annotation symbols
      .replace(/\(/g, ' ( ')
      .replace(/\)/g, ' ) ')
    return cleaned.split(/\s+/).filter(t => t.length > 0)
  }

  function isMoveNumber(token: string): boolean {
    return /^\d+\.{1,3}$/.test(token)
  }

  function isResult(token: string): boolean {
    return token === '1-0' || token === '0-1' || token === '1/2-1/2' || token === '*'
  }

  function parseTokens(tokens: string[], pos: number): number {
    while (pos < tokens.length) {
      const token = tokens[pos]

      if (token === ')') return pos + 1
      if (isResult(token)) return tokens.length

      if (token === '(') {
        const savedNode = history.currentNode.value
        history.navigateBack()
        pos = parseTokens(tokens, pos + 1)
        history.navigateTo(savedNode)
        continue
      }

      if (isMoveNumber(token)) {
        pos++
        continue
      }

      // Try as SAN move
      const chess = new Chess(history.currentFen.value)
      try {
        const moveResult = chess.move(token)
        if (moveResult) {
          history.addMove(moveResult.from, moveResult.to, moveResult.promotion ?? undefined)
        }
      }
      catch {
        // Skip invalid tokens silently
      }

      pos++
    }
    return pos
  }

  function parsePgn(pgn: string): string | null {
    history.reset()
    const tokens = tokenize(pgn)
    try {
      parseTokens(tokens, 0)
    }
    catch (e) {
      return String(e)
    }
    return null
  }

  return { parsePgn }
}
