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
}>()

const phase = defineModel<GamePhase>('phase', { default: 'setup' })
const playerColor = defineModel<PlayerColor>('playerColor', { default: 'white' })

const { fen, gameState, legalMoves, makeMove, reset } = useChessGame()
const { isThinking } = useStockfishPlayer()

const moves = ref<string[]>([])
const result = ref<string | null>(null)

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

defineExpose({ applyOpponentMove, fen })
</script>

<template>
  <div class="flex gap-4" style="max-width: 900px; height: 600px">
    <!-- Board column -->
    <div class="flex flex-col gap-1 flex-1">
      <div class="text-xs text-gray-400 text-center">
        {{ playerColor === 'white' ? 'Fekete' : 'Fehér' }}
      </div>

      <ClientOnly>
        <div class="flex-1">
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
        </div>
        <template #fallback>
          <div class="flex-1 aspect-square bg-gray-800 rounded animate-pulse" />
        </template>
      </ClientOnly>

      <div class="text-xs text-gray-200 text-center font-medium">
        {{ playerColor === 'white' ? 'Fehér (Te)' : 'Fekete (Te)' }}
      </div>
    </div>

    <!-- Controls panel -->
    <ChessGameControls
      :phase="phase"
      :mode="mode"
      :player-color="playerColor"
      :is-thinking="isThinking"
      :moves="moves"
      :result="result"
      :share-url="shareUrl"
      :opponent-connected="opponentConnected"
      @select-color="emit('selectColor', $event)"
      @select-mode="emit('selectMode', $event)"
      @resign="handleResign"
      @new-game="handleNewGame"
    />
  </div>
</template>
