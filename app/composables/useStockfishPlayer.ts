export function useStockfishPlayer() {
  const { init, getBestMove, destroy } = useStockfish()
  const isThinking = ref(false)
  const aiDepth = ref(15)

  async function makeAiMove(fen: string, applyMove: (from: string, to: string, promo?: string) => void) {
    isThinking.value = true
    try {
      const uci = await getBestMove(fen, aiDepth.value)
      applyMove(uci.slice(0, 2), uci.slice(2, 4), uci[4])
    }
    finally {
      isThinking.value = false
    }
  }

  return { isThinking, aiDepth, makeAiMove, init, destroy }
}
