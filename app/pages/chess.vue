<script setup lang="ts">
import type { ChessMove, MoveNode } from '~/types/chess'

definePageMeta({ ssr: false })

const {
  root, currentNode, treeVersion,
  currentFen, currentGameState, currentLegalMoves,
  addMove, navigateBack, navigateForward, navigateToStart, navigateToMainEnd, navigateTo, reset,
} = useChessHistory()

const { evalResult, isAnalyzing, analysisLines, init, analyze, destroy } = useStockfish()

// Stockfish elemzés indítása minden pozícióváltáskor
watch(currentFen, fen => analyze(fen))

function handleMove(move: ChessMove) {
  addMove(move.from, move.to, move.promotion ?? 'q')
}

function handleNavigate(direction: 'back' | 'forward' | 'start' | 'end') {
  if (direction === 'back') navigateBack()
  else if (direction === 'forward') navigateForward()
  else if (direction === 'start') navigateToStart()
  else navigateToMainEnd()
}

function handleNavigateTo(node: MoveNode) {
  navigateTo(node)
}

function handleReset() {
  reset()
}

// Billentyűzet navigáció
function handleKeydown(e: KeyboardEvent) {
  const tag = (e.target as HTMLElement).tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA') return
  if (e.key === 'ArrowLeft') { e.preventDefault(); navigateBack() }
  else if (e.key === 'ArrowRight') { e.preventDefault(); navigateForward() }
  else if (e.key === 'ArrowUp') { e.preventDefault(); navigateToStart() }
  else if (e.key === 'ArrowDown') { e.preventDefault(); navigateToMainEnd() }
}

onMounted(() => {
  init()
  analyze(currentFen.value)
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  destroy()
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 gap-6">
    <h1 class="text-3xl font-bold text-white tracking-tight">Chessy</h1>

    <ChessLayout
      :fen="currentFen"
      :game-state="currentGameState"
      :legal-moves="currentLegalMoves"
      :eval-result="evalResult"
      :is-analyzing="isAnalyzing"
      :analysis-lines="analysisLines"
      :root="root"
      :current-node="currentNode"
      :tree-version="treeVersion"
      @move="handleMove"
      @reset="handleReset"
      @navigate="handleNavigate"
      @navigate-to="handleNavigateTo"
    />
  </div>
</template>
