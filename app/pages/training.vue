<script setup lang="ts">
import { Chess } from 'chess.js'
import type { Key } from 'chessground/types'
import type { GameState } from '~/types/chess'

definePageMeta({ ssr: false })

const route = useRoute()
const router = useRouter()
const auth = useLichessAuth()
const session = useTrainingSession()
const { settings, stats, status, current, userAnswer, errorMessage, searchAttempt, openingResolved } = session

const settingsOpen = ref(true)
const callbackPending = ref(false)
const now = ref(Date.now())
let clock: ReturnType<typeof setInterval> | null = null

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
const boardFen = computed(() => current.value?.fen ?? START_FEN)
const orientation = computed(() => current.value?.turn === 'b' ? 'black' : 'white')
const emptyMoves = new Map<Key, Key[]>()

const gameState = computed<GameState>(() => {
  const chess = new Chess(boardFen.value)
  return {
    fen: boardFen.value,
    turn: chess.turn(),
    isCheck: chess.inCheck(),
    isCheckmate: chess.isCheckmate(),
    isDraw: chess.isDraw(),
    isGameOver: chess.isGameOver(),
  }
})

const rateLimited = computed(() => session.rateLimitedUntil.value > now.value)

onMounted(async () => {
  clock = setInterval(() => { now.value = Date.now() }, 1000)
  if (route.query.code || route.query.error) {
    callbackPending.value = true
    await auth.handleCallback(route.query)
    callbackPending.value = false
    router.replace({ path: '/training' })
  }
  else if (auth.isLoggedIn.value && !auth.username.value) {
    auth.fetchAccount()
  }
  session.init()
})

onUnmounted(() => {
  if (clock) clearInterval(clock)
  session.destroy()
})

function handleApply() {
  settingsOpen.value = false
  session.start()
}

function handleResetStats() {
  if (confirm('Biztosan nullázod a statisztikát?')) session.resetStats()
}
</script>

<template>
  <div class="training-container flex flex-col lg:flex-row lg:items-start gap-4 w-full mx-auto">
    <!-- Tábla (nem mozgatható) -->
    <div class="board-col shrink-0">
      <ClientOnly>
        <ChessBoard
          :fen="boardFen"
          :game-state="gameState"
          :legal-moves="emptyMoves"
          :analysis-lines="[]"
          :orientation="orientation"
          movable-color="none"
          :show-arrows="false"
        />
        <template #fallback>
          <div class="w-full bg-gray-800 rounded animate-pulse" style="aspect-ratio: 1" />
        </template>
      </ClientOnly>
    </div>

    <!-- Jobb oldali panel -->
    <div class="w-full lg:w-[360px] shrink-0 flex flex-col gap-3">
      <!-- Lichess bejelentkezés -->
      <div v-if="!auth.isLoggedIn.value" class="bg-gray-800 rounded-none lg:rounded-lg p-4 flex flex-col gap-3" data-testid="lichess-login-card">
        <h2 class="text-base font-semibold text-white">Pozíció-értékelő edzés</h2>
        <p class="text-sm text-gray-300">
          Valódi Lichess-játszmákból kapsz állásokat – döntsd el, ki áll jobban!
          Az állások kereséséhez a Lichess megnyitás-adatbázisát használjuk, ehhez be kell jelentkezned (ingyenes, csak olvasási hozzáférés).
        </p>
        <p v-if="auth.authError.value" class="text-sm text-red-400">{{ auth.authError.value }}</p>
        <button
          class="py-2 rounded bg-amber-600 hover:bg-amber-500 text-white font-semibold transition-colors disabled:opacity-50"
          :disabled="callbackPending"
          data-testid="lichess-login"
          @click="auth.login()"
        >
          {{ callbackPending ? 'Bejelentkezés…' : 'Bejelentkezés Lichess-szel' }}
        </button>
      </div>

      <template v-else>
        <div class="flex items-center justify-between px-3 lg:px-0 text-xs text-gray-400">
          <span>Lichess: <span class="text-gray-200">{{ auth.username.value ?? 'bejelentkezve' }}</span></span>
          <button class="underline hover:text-gray-200" @click="auth.logout()">Kijelentkezés</button>
        </div>

        <!-- Feladvány -->
        <div v-if="status !== 'idle'" class="bg-gray-800 rounded-none lg:rounded-lg p-3">
          <ChessTrainingPanel
            :status="status"
            :position="current"
            :user-answer="userAnswer"
            :error-message="errorMessage"
            :search-attempt="searchAttempt"
            :max-attempts="session.maxAttempts"
            :rate-limited="rateLimited"
            @answer="session.answer"
            @next="session.next"
          />
        </div>

        <!-- Beállítások -->
        <div class="bg-gray-800 rounded-none lg:rounded-lg p-3">
          <button
            class="w-full flex items-center justify-between text-xs font-semibold text-gray-400 uppercase tracking-wider"
            @click="settingsOpen = !settingsOpen"
          >
            <span>Beállítások · {{ openingResolved.name }}</span>
            <span>{{ settingsOpen ? '▲' : '▼' }}</span>
          </button>
          <div v-if="settingsOpen" class="mt-3">
            <ChessTrainingSettings
              v-model="settings"
              :opening-error="openingResolved.error"
              @apply="handleApply"
            />
          </div>
        </div>
      </template>

      <!-- Statisztika -->
      <div class="bg-gray-800 rounded-none lg:rounded-lg p-3">
        <ChessTrainingStats :stats="stats" @reset="handleResetStats" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.training-container {
  max-width: 100%;
}
.board-col {
  width: 100%;
}
@media (min-width: 1024px) {
  .training-container {
    max-width: min(95vw, 1000px);
  }
  .board-col {
    width: min(80vh, 560px);
    max-width: calc(100vw - 420px);
  }
}
</style>
