<script setup lang="ts">
import type { Key } from 'chessground/types'
import type { AnalysisLine, ChessMove, EvalResult, GameState, MoveNode } from '~/types/chess'

defineProps<{
  fen: string
  gameState: GameState
  legalMoves: Map<Key, Key[]>
  evalResult: EvalResult | null
  isAnalyzing: boolean
  analysisLines: AnalysisLine[]
  root: MoveNode
  currentNode: MoveNode
  treeVersion: number
  fenError?: string | null
  pgnError?: string | null
  currentFen: string
  currentPgn: string
}>()

defineEmits<{
  move: [move: ChessMove]
  reset: []
  navigateTo: [node: MoveNode]
  navigate: [direction: 'back' | 'forward' | 'start' | 'end']
  loadFen: [fen: string]
  loadPgn: [pgn: string]
}>()
</script>

<template>
  <div
    class="flex flex-col lg:flex-row lg:items-stretch gap-3 w-full px-2 lg:px-0 mx-auto lg:h-[min(80vh,600px)]"
    style="max-width: min(96vw, 1150px)"
  >
    <!-- Eval bar — desktop only -->
    <ClientOnly>
      <div class="hidden lg:flex" style="width: 28px">
        <ChessStockfishEval :eval-result="evalResult" :is-analyzing="isAnalyzing" />
      </div>
      <template #fallback>
        <div class="hidden lg:block" style="width: 28px" />
      </template>
    </ClientOnly>

    <!-- Board column — single instance, responsive sizing via CSS -->
    <ClientOnly>
      <div class="board-col lg:flex lg:items-center shrink-0">
        <ChessBoard
          :fen="fen"
          :game-state="gameState"
          :legal-moves="legalMoves"
          :analysis-lines="analysisLines"
          @move="$emit('move', $event)"
          @navigate="$emit('navigate', $event)"
        />
      </div>
      <template #fallback>
        <div class="board-col mx-auto aspect-square bg-gray-800 rounded animate-pulse lg:mx-0" />
      </template>
    </ClientOnly>

    <!-- Right panel: analysis lines + move history + nav -->
    <ClientOnly>
      <div class="w-full lg:flex-1 flex flex-col gap-2 min-w-0 bg-gray-800 rounded-lg p-3 overflow-hidden">
        <!-- Analysis lines -->
        <ChessAnalysisLines :lines="analysisLines" :is-analyzing="isAnalyzing" />

        <div class="border-t border-gray-700 my-1" />

        <!-- Move history (flex-1 = fills remaining space on desktop, max-h on mobile) -->
        <ChessMoveHistory
          class="max-h-[40vh] lg:max-h-none"
          :root="root"
          :current-node="currentNode"
          :tree-version="treeVersion"
          @navigate-to="$emit('navigateTo', $event)"
        />

        <!-- Bottom row: Új elemzés + nav controls -->
        <div class="flex items-center gap-2 pt-1 border-t border-gray-700 shrink-0">
          <button
            class="flex-1 py-1.5 rounded bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white font-semibold text-xs transition-colors"
            @click="$emit('reset')"
          >
            Új elemzés
          </button>

          <div class="flex gap-1">
            <button
              data-testid="nav-start"
              class="w-8 h-7 flex items-center justify-center rounded bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm font-bold transition-colors"
              title="Elejére (↑)"
              @click="$emit('navigate', 'start')"
            >
              «
            </button>
            <button
              data-testid="nav-back"
              class="w-8 h-7 flex items-center justify-center rounded bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm font-bold transition-colors"
              title="Vissza (←)"
              @click="$emit('navigate', 'back')"
            >
              ‹
            </button>
            <button
              data-testid="nav-forward"
              class="w-8 h-7 flex items-center justify-center rounded bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm font-bold transition-colors"
              title="Előre (→)"
              @click="$emit('navigate', 'forward')"
            >
              ›
            </button>
            <button
              class="w-8 h-7 flex items-center justify-center rounded bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm font-bold transition-colors"
              title="Végére (↓)"
              @click="$emit('navigate', 'end')"
            >
              »
            </button>
          </div>
        </div>
      </div>
      <template #fallback>
        <div class="w-full lg:flex-1 bg-gray-800 rounded-lg" />
      </template>
    </ClientOnly>

    <!-- FEN/PGN loader panel -->
    <ChessFenPgnLoader
      :fen-error="fenError"
      :pgn-error="pgnError"
      :current-fen="currentFen"
      :current-pgn="currentPgn"
      @load-fen="$emit('loadFen', $event)"
      @load-pgn="$emit('loadPgn', $event)"
    />
  </div>
</template>

<style scoped>
.board-col {
  width: calc(100% + 16px);
  max-width: calc(100% + 16px);
  margin-left: -8px;
  margin-right: -8px;
}
@media (min-width: 1024px) {
  .board-col {
    width: min(80vh, 540px);
    max-width: calc(100vw - 500px);
    margin-left: 0;
    margin-right: 0;
  }
}
</style>
