<script setup lang="ts">
import type { TrainingAnswer, TrainingPosition, TrainingStatus } from '~/types/training'

const props = defineProps<{
  status: TrainingStatus
  position: TrainingPosition | null
  userAnswer: TrainingAnswer | null
  errorMessage: string | null
  searchAttempt: number
  maxAttempts: number
  rateLimited: boolean
}>()

const emit = defineEmits<{
  answer: [choice: TrainingAnswer]
  next: []
}>()

const showSolution = ref(false)
watch(() => props.position?.id, () => { showSolution.value = false })

const answers: { value: TrainingAnswer, label: string, key: string, cls: string }[] = [
  { value: 'white', label: 'Világos', key: '1', cls: 'bg-gray-100 text-gray-900 hover:bg-white' },
  { value: 'equal', label: 'Egyenlő', key: '2', cls: 'bg-gray-500 text-white hover:bg-gray-400' },
  { value: 'black', label: 'Sötét', key: '3', cls: 'bg-gray-950 text-gray-100 border border-gray-600 hover:bg-black' },
]

const answerLabel: Record<TrainingAnswer, string> = { white: 'Világos', equal: 'Egyenlő', black: 'Sötét' }
const kindLabel = {
  classic: 'Ki áll jobban?',
  puzzle: 'Puzzle: egyetlen nyerő lépés',
  onlymove: 'Egyensúly – csak egy lépés tartja',
} as const

const isCorrect = computed(() => props.position && props.userAnswer === props.position.correct)

const moveLabel = computed(() => {
  const p = props.position
  if (!p) return ''
  const moveNo = Math.floor(p.ply / 2) + 1
  return p.turn === 'w' ? `${moveNo}. Világos lép` : `${moveNo}… Sötét lép`
})

const gameUrl = computed(() => {
  const p = props.position
  if (!p) return ''
  return `https://lichess.org/${p.gameId}${p.turn === 'b' ? '/black' : ''}#${p.ply}`
})

function lineText(moves: string[], fen: string) {
  const parts = fen.split(' ')
  let moveNo = parseInt(parts[5] ?? '1')
  let white = parts[1] === 'w'
  const out: string[] = []
  moves.forEach((san, i) => {
    if (white) out.push(`${moveNo}.`)
    else if (i === 0) out.push(`${moveNo}…`)
    out.push(formatSan(san))
    if (!white) moveNo++
    white = !white
  })
  return out.join(' ')
}

function onKey(e: KeyboardEvent) {
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return
  if (props.status === 'ready') {
    const a = answers.find(x => x.key === e.key)
    if (a) emit('answer', a.value)
  }
  else if (props.status === 'answered' && (e.key === ' ' || e.key === 'Enter')) {
    e.preventDefault()
    emit('next')
  }
}

onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="flex flex-col gap-3" data-testid="training-panel">
    <!-- Keresés -->
    <div v-if="status === 'searching'" class="flex flex-col items-center gap-2 py-6 text-gray-300 text-sm">
      <div class="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      <span v-if="rateLimited">A Lichess lassításra kért – 1 perc szünet…</span>
      <span v-else>Állás keresése… (játszma {{ searchAttempt }}/{{ maxAttempts }})</span>
    </div>

    <!-- Hiba -->
    <div
      v-else-if="status === 'error'"
      class="rounded bg-red-900/40 border border-red-700 p-3 text-sm text-red-200"
      data-testid="training-error"
    >
      {{ errorMessage }}
      <button class="block mt-2 text-xs underline text-red-300 hover:text-white" @click="emit('next')">
        Újrapróbálás
      </button>
    </div>

    <template v-else-if="position && (status === 'ready' || status === 'answered')">
      <div class="flex items-center justify-between">
        <span class="text-sm font-semibold text-gray-200">{{ moveLabel }}</span>
        <span v-if="position.lastMoveSan" class="text-xs text-gray-500">
          utolsó lépés: {{ formatSan(position.lastMoveSan) }}
        </span>
      </div>

      <div class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Ki áll jobban?</div>
      <div class="grid grid-cols-3 gap-2">
        <button
          v-for="a in answers"
          :key="a.value"
          class="py-3 rounded font-semibold text-sm transition-all disabled:cursor-default"
          :class="[
            a.cls,
            status === 'answered' && a.value === position.correct ? 'ring-4 ring-green-500' : '',
            status === 'answered' && a.value === userAnswer && !isCorrect ? 'ring-4 ring-red-500' : '',
            status === 'answered' && a.value !== position.correct && a.value !== userAnswer ? 'opacity-40' : '',
          ]"
          :disabled="status !== 'ready'"
          :data-testid="`answer-${a.value}`"
          @click="emit('answer', a.value)"
        >
          {{ a.label }}
          <span class="block text-[10px] font-normal opacity-60">{{ a.key }}</span>
        </button>
      </div>

      <!-- Eredmény -->
      <div v-if="status === 'answered'" class="flex flex-col gap-2" data-testid="training-result">
        <div
          class="rounded p-3 text-sm font-semibold"
          :class="isCorrect ? 'bg-green-900/40 border border-green-700 text-green-300' : 'bg-red-900/40 border border-red-700 text-red-300'"
        >
          {{ isCorrect ? 'Helyes! ✓' : `Nem talált – ${answerLabel[position.correct]} a helyes válasz.` }}
          <div class="text-xs font-normal mt-1 text-gray-300">
            Gépi értékelés: <span class="font-mono">{{ formatEval(position.evalWhite) }}</span>
            · {{ kindLabel[position.kind] }}
          </div>
        </div>

        <div class="text-xs text-gray-400 space-y-0.5">
          <div>
            ⚪ {{ position.white.name }} <span v-if="position.white.rating">({{ position.white.rating }})</span>
            – ⚫ {{ position.black.name }} <span v-if="position.black.rating">({{ position.black.rating }})</span>
          </div>
          <div v-if="position.gameOpening">{{ position.gameOpening }}</div>
        </div>

        <a
          :href="gameUrl" target="_blank" rel="noopener"
          class="text-center py-1.5 rounded bg-gray-700 hover:bg-gray-600 text-xs text-gray-200"
          data-testid="lichess-game-link"
        >Játszma a Lichessen ↗</a>

        <button
          v-if="!showSolution"
          class="py-1.5 rounded bg-gray-700 hover:bg-gray-600 text-xs text-gray-300"
          @click="showSolution = true"
        >
          Megoldás mutatása
        </button>
        <div v-else class="rounded bg-gray-900/60 p-2 space-y-1">
          <div v-for="l in position.lines" :key="l.multipv" class="flex gap-2 text-xs font-mono">
            <span class="w-12 shrink-0 text-amber-400">{{ formatEval(l.score) }}</span>
            <span class="text-gray-300 truncate">{{ lineText(l.moves, position.fen) }}</span>
          </div>
        </div>

        <button
          class="py-2 rounded bg-amber-600 hover:bg-amber-500 text-white font-semibold transition-colors"
          data-testid="training-next"
          @click="emit('next')"
        >
          Következő ›
          <span class="text-[10px] font-normal opacity-70 ml-1">Space</span>
        </button>
      </div>
    </template>
  </div>
</template>
