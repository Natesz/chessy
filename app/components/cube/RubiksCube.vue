<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'

type CubePhase = 'idle' | 'scrambling' | 'playing' | 'solved'

const phase = ref<CubePhase>('idle')
const elapsed = ref(0)
const scrambleMoves = ref('')
const playerRef = ref<HTMLElement | null>(null)

let timerInterval: ReturnType<typeof setInterval> | null = null
let twistyPlayer: any = null
let moveCount = 0

function startTimer() {
  elapsed.value = 0
  timerInterval = setInterval(() => {
    elapsed.value += 10
  }, 10)
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

function formatTime(ms: number): string {
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  const centis = Math.floor((ms % 1000) / 10)
  if (minutes > 0) {
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${centis.toString().padStart(2, '0')}`
  }
  return `${seconds}.${centis.toString().padStart(2, '0')}`
}

async function handleShuffle() {
  if (!twistyPlayer) return

  const { randomScrambleForEvent } = await import('cubing/scramble')
  const scramble = await randomScrambleForEvent('333')
  scrambleMoves.value = scramble.toString()

  twistyPlayer.alg = scrambleMoves.value
  twistyPlayer.timestamp = 'end'

  phase.value = 'idle'
  stopTimer()
  elapsed.value = 0
  moveCount = 0
}

async function handlePlay() {
  if (!twistyPlayer) return

  if (phase.value === 'idle' && !scrambleMoves.value) {
    await handleShuffle()
  }

  // Set the scramble as the setup alg, clear the main alg for user moves
  twistyPlayer.experimentalSetupAlg = scrambleMoves.value
  twistyPlayer.alg = ''
  twistyPlayer.timestamp = 'end'

  phase.value = 'playing'
  moveCount = 0
  startTimer()
}

function handleReset() {
  if (!twistyPlayer) return
  twistyPlayer.experimentalSetupAlg = ''
  twistyPlayer.alg = ''
  twistyPlayer.timestamp = 'end'
  phase.value = 'idle'
  stopTimer()
  elapsed.value = 0
  scrambleMoves.value = ''
  moveCount = 0
}

async function checkSolved() {
  if (phase.value !== 'playing' || !twistyPlayer) return

  try {
    const { experimentalSolvedState } = await import('cubing/puzzle-geometry')
    // Use the twisty player's puzzle to check if solved
    const currentAlg = twistyPlayer.alg?.toString() ?? ''
    if (!currentAlg) return

    // Count moves to detect new user input
    const moves = currentAlg.split(/\s+/).filter((m: string) => m.length > 0)
    if (moves.length <= moveCount) return
    moveCount = moves.length

    // Check solved state via the puzzle model
    const model = twistyPlayer.experimentalModel
    if (!model) return
    const state = await model.currentPattern.get()
    if (state?.experimentalIsSolved?.()) {
      phase.value = 'solved'
      stopTimer()
    }
  }
  catch {
    // Solved check not available, ignore
  }
}

let pollInterval: ReturnType<typeof setInterval> | null = null

onMounted(async () => {
  // Dynamically import to ensure client-side only
  await import('cubing/twisty')

  await nextTick()

  twistyPlayer = playerRef.value
  if (!twistyPlayer) return

  // Poll for solved state during play
  pollInterval = setInterval(checkSolved, 500)
})

onUnmounted(() => {
  stopTimer()
  if (pollInterval) {
    clearInterval(pollInterval)
    pollInterval = null
  }
})
</script>

<template>
  <div class="flex flex-col items-center gap-6 w-full max-w-2xl mx-auto px-4 py-6">
    <!-- Solved banner -->
    <Transition name="fade">
      <div
        v-if="phase === 'solved'"
        class="bg-green-600/90 text-white px-6 py-3 rounded-lg text-lg font-bold shadow-lg"
      >
        🎉 Sikerült! — {{ formatTime(elapsed) }}
      </div>
    </Transition>

    <!-- Timer -->
    <div
      v-if="phase === 'playing' || phase === 'solved'"
      class="text-3xl font-mono tabular-nums"
      :class="phase === 'solved' ? 'text-green-400' : 'text-white'"
    >
      {{ formatTime(elapsed) }}
    </div>

    <!-- Cube -->
    <ClientOnly>
      <div class="w-full flex justify-center">
        <twisty-player
          ref="playerRef"
          puzzle="3x3x3"
          visualization="3D"
          control-panel="none"
          background="none"
          hint-facelets="none"
          experimental-drag-input="auto"
          class="cube-player"
        />
      </div>
    </ClientOnly>

    <!-- Scramble display -->
    <div
      v-if="scrambleMoves"
      class="text-gray-400 text-xs font-mono text-center max-w-md break-words"
    >
      {{ scrambleMoves }}
    </div>

    <!-- Controls -->
    <div class="flex gap-3">
      <button
        class="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        :disabled="phase === 'playing'"
        @click="handleShuffle"
      >
        Keverés
      </button>

      <button
        v-if="phase !== 'playing'"
        class="px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white font-medium rounded-lg transition-colors"
        @click="handlePlay"
      >
        Játék
      </button>

      <button
        v-if="phase === 'playing' || phase === 'solved'"
        class="px-5 py-2.5 bg-gray-600 hover:bg-gray-500 text-white font-medium rounded-lg transition-colors"
        @click="handleReset"
      >
        Újra
      </button>
    </div>
  </div>
</template>

<style scoped>
.cube-player {
  width: min(400px, 85vw);
  height: min(400px, 85vw);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
