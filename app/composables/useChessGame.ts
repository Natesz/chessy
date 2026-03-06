import { Chess } from 'chess.js'
import type { Key } from 'chessground/types'
import type { ChessMove, GameState } from '~/types/chess'

export function useChessGame() {
  const chess = new Chess()

  const fen = ref(chess.fen())
  const gameState = ref<GameState>({
    fen: chess.fen(),
    turn: chess.turn() as 'w' | 'b',
    isCheck: chess.isCheck(),
    isCheckmate: chess.isCheckmate(),
    isDraw: chess.isDraw(),
    isGameOver: chess.isGameOver(),
  })

  const legalMoves = computed<Map<Key, Key[]>>(() => {
    fen.value // reaktív függőség: fen változásakor újraszámolja
    const dests = new Map<Key, Key[]>()
    chess.moves({ verbose: true }).forEach((move) => {
      if (!dests.has(move.from as Key)) dests.set(move.from as Key, [])
      dests.get(move.from as Key)!.push(move.to as Key)
    })
    return dests
  })

  function syncState() {
    fen.value = chess.fen()
    gameState.value = {
      fen: chess.fen(),
      turn: chess.turn() as 'w' | 'b',
      isCheck: chess.isCheck(),
      isCheckmate: chess.isCheckmate(),
      isDraw: chess.isDraw(),
      isGameOver: chess.isGameOver(),
    }
  }

  function makeMove(move: ChessMove): boolean {
    try {
      const result = chess.move(move)
      if (result) {
        syncState()
        return true
      }
    }
    catch {
      // illegal move
    }
    return false
  }

  function reset() {
    chess.reset()
    syncState()
  }

  return {
    fen,
    gameState,
    legalMoves,
    makeMove,
    reset,
  }
}
