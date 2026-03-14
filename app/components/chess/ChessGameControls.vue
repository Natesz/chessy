<script setup lang="ts">
import type { PlayerColor } from '~/types/game'

type GamePhase = 'setup' | 'playing' | 'finished'
type GameMode = 'ai' | 'live'

const props = defineProps<{
  phase: GamePhase
  mode: GameMode
  playerColor: PlayerColor
  isThinking: boolean
  result: string | null
  shareUrl?: string | null
  opponentConnected?: boolean
}>()

const emit = defineEmits<{
  selectColor: [color: PlayerColor | 'random']
  selectMode: [mode: GameMode]
  resign: []
  newGame: []
  openAnalysis: []
}>()

const resultEmoji = computed(() => {
  if (!props.result) return '🏁'
  if (props.result.includes('Nyert')) return '🏆'
  if (props.result.includes('Vesztet')) return '😞'
  return '🤝'
})
</script>

<template>
  <div class="flex flex-col gap-3 bg-gray-800 rounded-lg p-3 w-56 shrink-0 h-full overflow-hidden">
    <!-- SETUP PHASE -->
    <template v-if="phase === 'setup'">
      <div class="text-xs font-semibold text-gray-400 uppercase tracking-wider">
        Játék mód
      </div>

      <div class="flex gap-1 bg-gray-900 rounded p-1">
        <button
          class="flex-1 py-1.5 text-xs font-medium rounded transition-colors"
          :class="mode === 'ai' ? 'bg-amber-600 text-white' : 'text-gray-400 hover:text-white'"
          @click="emit('selectMode', 'ai')"
        >
          🤖 Stockfish
        </button>
        <button
          class="flex-1 py-1.5 text-xs font-medium rounded transition-colors"
          :class="mode === 'live' ? 'bg-amber-600 text-white' : 'text-gray-400 hover:text-white'"
          @click="emit('selectMode', 'live')"
        >
          🔗 Élő játék
        </button>
      </div>

      <div class="text-xs font-semibold text-gray-400 uppercase tracking-wider">
        Oldal
      </div>

      <div class="flex flex-col gap-1.5">
        <button
          class="py-2 rounded text-xs font-medium bg-gray-700 hover:bg-gray-600 text-gray-200 transition-colors"
          @click="emit('selectColor', 'white')"
        >
          ♔ Fehérrel játszom
        </button>
        <button
          class="py-2 rounded text-xs font-medium bg-gray-700 hover:bg-gray-600 text-gray-200 transition-colors"
          @click="emit('selectColor', 'black')"
        >
          ♚ Feketével játszom
        </button>
        <button
          class="py-2 rounded text-xs font-medium bg-gray-700 hover:bg-gray-600 text-gray-200 transition-colors"
          @click="emit('selectColor', 'random')"
        >
          🎲 Véletlenszerű
        </button>
      </div>
    </template>

    <!-- PLAYING PHASE -->
    <template v-else-if="phase === 'playing'">
      <div v-if="mode === 'live'" class="text-xs text-center">
        <div v-if="!opponentConnected" class="text-gray-400">
          Várakozás az ellenfélre...
          <div v-if="shareUrl" class="mt-2">
            <div class="text-gray-500 mb-1">
              Küldd el ezt a linket:
            </div>
            <div class="bg-gray-900 rounded p-1.5 break-all text-gray-300 text-[10px] select-all">
              {{ shareUrl }}
            </div>
          </div>
        </div>
        <div v-else class="text-green-400">
          Ellenfél csatlakozott ✓
        </div>
      </div>

      <div v-if="mode === 'ai' && isThinking" class="flex items-center gap-2 text-xs text-amber-400">
        <span class="animate-spin inline-block">⟳</span> Stockfish gondolkodik...
      </div>

      <div class="flex-1" />

      <button
        class="shrink-0 py-1.5 rounded bg-red-800 hover:bg-red-700 text-white text-xs font-semibold transition-colors"
        @click="emit('resign')"
      >
        Feladás
      </button>
    </template>

    <!-- FINISHED PHASE -->
    <template v-else-if="phase === 'finished'">
      <div class="flex-1 flex flex-col items-center justify-center gap-4 text-center">
        <div class="text-2xl">
          {{ resultEmoji }}
        </div>
        <div class="text-white font-bold text-sm">
          {{ result }}
        </div>
      </div>

      <button
        class="shrink-0 py-2 rounded bg-blue-700 hover:bg-blue-600 text-white text-xs font-semibold transition-colors"
        @click="emit('openAnalysis')"
      >
        Elemzés megnyitása →
      </button>

      <button
        class="shrink-0 py-2 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition-colors"
        @click="emit('newGame')"
      >
        Új játék
      </button>
    </template>
  </div>
</template>
