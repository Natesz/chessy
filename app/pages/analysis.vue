<script setup lang="ts">
import type { ChessMove, MoveNode } from '~/types/chess'
import { usePgnParser } from '~/composables/usePgnParser'

definePageMeta({ ssr: false })

const {
  root, currentNode, treeVersion,
  currentFen, currentGameState, currentLegalMoves,
  addMove, navigateBack, navigateForward, navigateToStart, navigateToMainEnd, navigateTo, reset,
} = useChessHistory()

const { evalResult, isAnalyzing, analysisLines, init, analyze, resetAnalysis, destroy } = useStockfish()

const { parsePgn } = usePgnParser({ currentFen, currentNode, addMove, navigateBack, navigateTo, reset })

const fenError = ref<string | null>(null)
const pgnError = ref<string | null>(null)

const currentPgn = computed(() => {
  treeVersion.value // reaktív függőség
  return generatePgn(root)
})

let analyzeDebounce: ReturnType<typeof setTimeout> | null = null
watch(currentFen, (fen) => {
  if (analyzeDebounce) clearTimeout(analyzeDebounce)
  analyzeDebounce = setTimeout(() => analyze(fen), 150)
})

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
  if (analyzeDebounce) { clearTimeout(analyzeDebounce); analyzeDebounce = null }
  resetAnalysis()
  reset()
  analyze(currentFen.value)
}

function handleLoadFen(fen: string) {
  fenError.value = null
  if (analyzeDebounce) { clearTimeout(analyzeDebounce); analyzeDebounce = null }
  try {
    resetAnalysis()
    reset(fen)
    analyze(currentFen.value)
  }
  catch {
    fenError.value = 'Érvénytelen FEN'
  }
}

function handleLoadPgn(pgn: string) {
  pgnError.value = null
  if (analyzeDebounce) { clearTimeout(analyzeDebounce); analyzeDebounce = null }
  resetAnalysis()
  const err = parsePgn(pgn)
  if (err) {
    pgnError.value = err
  }
  else {
    navigateToStart()
    analyze(currentFen.value)
  }
}

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
  const pendingPgn = import.meta.client
    ? localStorage.getItem('chessy:pending-pgn')
    : null
  if (pendingPgn) {
    localStorage.removeItem('chessy:pending-pgn')
    handleLoadPgn(pendingPgn)
  }
  else {
    analyze(currentFen.value)
  }
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  if (analyzeDebounce) clearTimeout(analyzeDebounce)
  destroy()
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
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
    :fen-error="fenError"
    :pgn-error="pgnError"
    :current-fen="currentFen"
    :current-pgn="currentPgn"
    @move="handleMove"
    @reset="handleReset"
    @navigate="handleNavigate"
    @navigate-to="handleNavigateTo"
    @load-fen="handleLoadFen"
    @load-pgn="handleLoadPgn"
  />
</template>
