<script setup lang="ts">
import type { PlayerColor } from '~/types/game'

type GamePhase = 'setup' | 'playing' | 'finished'
type GameMode = 'ai' | 'live'

const props = defineProps<{
  mode: GameMode
  shareUrl?: string | null
  opponentConnected?: boolean
}>()

const emit = defineEmits<{
  move: [from: string, to: string, promo?: string]
  resign: []
  newGame: []
  selectColor: [color: PlayerColor | 'random']
  selectMode: [mode: GameMode]
  openAnalysis: []
}>()

const phase = defineModel<GamePhase>('phase', { default: 'setup' })
const playerColor = defineModel<PlayerColor>('playerColor', { default: 'white' })

const { fen, gameState, legalMoves, makeMove, reset } = useChessGame()
const { isThinking } = useStockfishPlayer()

const moves = ref<string[]>([])
const result = ref<string | null>(null)

const movePairs = computed(() => {
  const pairs: [string, string | undefined][] = []
  for (let i = 0; i < moves.value.length; i += 2)
    pairs.push([moves.value[i]!, moves.value[i + 1]])
  return pairs
})

const gamePgn = computed(() => {
  const tokens: string[] = []
  for (let i = 0; i < moves.value.length; i++) {
    if (i % 2 === 0) tokens.push(`${Math.floor(i / 2) + 1}.`)
    tokens.push(moves.value[i]!)
  }
  return tokens.join(' ')
})

const copied = ref(false)
async function copyPgn() {
  await navigator.clipboard.writeText(gamePgn.value)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}

function handleMove(from: string, to: string, promo?: string) {
  if (phase.value !== 'playing') return
  const san = makeMove({ from, to, promotion: promo })
  if (!san) return

  moves.value.push(san)
  emit('move', from, to, promo)

  if (gameState.value.isGameOver) {
    endGame()
  }
}

function endGame() {
  const state = gameState.value
  if (state.isCheckmate) {
    const winner = state.turn === 'b' ? 'Fehér' : 'Fekete'
    const isLocalWinner = (state.turn === 'b' && playerColor.value === 'white')
      || (state.turn === 'w' && playerColor.value === 'black')
    result.value = isLocalWinner ? 'Matt! Nyertél 🏆' : `Matt! ${winner} nyert`
  }
  else {
    result.value = 'Döntetlen'
  }
  phase.value = 'finished'
}

function handleResign() {
  result.value = 'Feladtad a játékot'
  phase.value = 'finished'
  emit('resign')
}

function handleNewGame() {
  reset()
  moves.value = []
  result.value = null
  phase.value = 'setup'
  emit('newGame')
}

// Expose for parent to apply opponent's move in live mode
function applyOpponentMove(from: string, to: string, promo?: string) {
  const san = makeMove({ from, to, promotion: promo })
  if (!san) return
  moves.value.push(san)
  if (gameState.value.isGameOver) endGame()
}

defineExpose({ applyOpponentMove, fen, gamePgn })
</script>

<template>
  <div
    class="flex flex-col lg:flex-row lg:items-stretch gap-4 w-full px-2 lg:px-0 mx-auto lg:h-[min(80vh,600px)]"

    style="max-width: min(95vw, 1100px)"
  >
    <!-- Board column — single instance, responsive sizing via CSS -->
    <div class="board-col shrink-0">
      <div class="text-xs text-gray-400 text-center py-0.5">
        {{ playerColor === 'white' ? 'Fekete' : 'Fehér' }}
      </div>

      <ClientOnly>
        <ChessBoard
          :fen="fen"
          :game-state="gameState"
          :legal-moves="legalMoves"
          :analysis-lines="[]"
          :orientation="playerColor"
          :movable-color="phase === 'playing' ? playerColor : 'none'"
          :show-arrows="false"
          @move="e => handleMove(e.from, e.to, e.promotion)"
        />
        <template #fallback>
          <div class="w-full bg-gray-800 rounded animate-pulse" style="aspect-ratio: 1" />
        </template>
      </ClientOnly>

      <div class="text-xs text-gray-200 text-center font-medium py-0.5">
        {{ playerColor === 'white' ? 'Fehér (Te)' : 'Fekete (Te)' }}
      </div>
    </div>

    <!-- Controls panel -->
    <ChessGameControls
      :phase="phase"
      :mode="mode"
      :player-color="playerColor"
      :is-thinking="isThinking"
      :result="result"
      :share-url="shareUrl"
      :opponent-connected="opponentConnected"
      @select-color="emit('selectColor', $event)"
      @select-mode="emit('selectMode', $event)"
      @resign="handleResign"
      @new-game="handleNewGame"
      @open-analysis="emit('openAnalysis')"
    />

    <!-- History panel -->
    <div class="w-full lg:w-44 shrink-0 flex flex-col gap-2 bg-gray-800 rounded-lg p-3 overflow-hidden max-h-[40vh] lg:max-h-none">
      <div class="text-xs font-semibold text-gray-500 uppercase tracking-wider shrink-0">
        JÁTSZMALAP
      </div>

      <div class="max-h-[30vh] lg:max-h-none lg:flex-1 min-h-0 overflow-hidden lg:overflow-y-auto">
        <div class="text-xs font-mono text-gray-300 space-y-0.5">
          <div v-for="(pair, i) in movePairs" :key="i" class="flex gap-1">
            <span class="text-gray-600 w-5 shrink-0 text-right">{{ i + 1 }}.</span>
            <span class="w-14">{{ formatSan(pair[0] ?? '') }}</span>
            <span class="w-14 text-gray-400">{{ pair[1] ? formatSan(pair[1]) : '' }}</span>
          </div>
        </div>
      </div>

      <button
        v-if="phase === 'finished'"
        class="shrink-0 py-1.5 rounded text-xs font-semibold transition-colors"
        :class="copied ? 'bg-green-700 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-200'"
        @click="copyPgn"
      >
        {{ copied ? 'Másolva! ✓' : 'PGN másolása' }}
      </button>
    </div>
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
    width: min(80vh, 520px);
    max-width: calc(100vw - 490px);
    margin-left: 0;
    margin-right: 0;
  }
}
</style>
