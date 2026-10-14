<script setup lang="ts">
import type { TrainingMode, TrainingSettings } from '~/types/training'
import { MAX_ADVANTAGE_CAP } from '~/composables/useTrainingSession'

defineProps<{
  openingError: string | null
}>()

const emit = defineEmits<{
  apply: []
}>()

const settings = defineModel<TrainingSettings>({ required: true })

const modes: { value: TrainingMode, label: string, hint: string }[] = [
  { value: 'classic', label: 'Ki áll jobban?', hint: 'Az egyik fél a megadott tartományban áll jobban.' },
  { value: 'puzzle', label: 'Puzzle-típus', hint: 'Egyetlen nyerő lépés van – ha nem találod meg, elúszik az előny.' },
  { value: 'onlymove', label: 'Egyensúly, pontos lépés', hint: 'Az állás egyenlő, de csak egy lépés tartja meg.' },
  { value: 'mixed', label: 'Vegyes', hint: 'A fenti típusok vegyesen.' },
]

const activeHint = computed(() => modes.find(m => m.value === settings.value.mode)?.hint ?? '')
const showRange = computed(() => settings.value.mode !== 'onlymove')
const showGap = computed(() => settings.value.mode !== 'classic')

function formatMax(v: number) {
  return v >= MAX_ADVANTAGE_CAP ? 'nincs korlát' : v.toFixed(1)
}

function setMin(v: number) {
  settings.value.minAdvantage = v
  if (settings.value.maxAdvantage < v) settings.value.maxAdvantage = v
}

function setMax(v: number) {
  settings.value.maxAdvantage = v
  if (settings.value.minAdvantage > v) settings.value.minAdvantage = v
}

function setMinPly(v: number) {
  settings.value.minPly = v
  if (settings.value.maxPly < v) settings.value.maxPly = v
}

function setMaxPly(v: number) {
  settings.value.maxPly = v
  if (settings.value.minPly > v) settings.value.minPly = v
}
</script>

<template>
  <div class="flex flex-col gap-3 text-sm text-gray-200" data-testid="training-settings">
    <!-- Megnyitás -->
    <label class="flex flex-col gap-1">
      <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Megnyitás</span>
      <select
        v-model="settings.openingId"
        class="bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm"
        data-testid="training-opening"
      >
        <option v-for="o in OPENING_PRESETS" :key="o.id" :value="o.id">
          {{ o.name }}
        </option>
        <option value="custom">Egyedi lépéssor…</option>
      </select>
    </label>
    <div v-if="settings.openingId === 'custom'" class="flex flex-col gap-1">
      <input
        v-model="settings.customMoves"
        type="text"
        placeholder="pl. 1. d4 d5 2. Nc3 Nf6 3. Bf4"
        class="bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm font-mono"
      >
      <span v-if="openingError" class="text-xs text-red-400">{{ openingError }}</span>
      <span v-else class="text-xs text-gray-500">Angol jelölés (N, B, R, Q, K).</span>
    </div>

    <!-- Mód -->
    <div class="flex flex-col gap-1">
      <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Állástípus</span>
      <div class="grid grid-cols-2 gap-1">
        <button
          v-for="m in modes"
          :key="m.value"
          class="px-2 py-1.5 rounded text-xs font-medium border transition-colors"
          :class="settings.mode === m.value
            ? 'bg-amber-600/20 border-amber-500 text-amber-400'
            : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'"
          @click="settings.mode = m.value"
        >
          {{ m.label }}
        </button>
      </div>
      <span class="text-xs text-gray-500">{{ activeHint }}</span>
    </div>

    <!-- Előny tartomány -->
    <div v-if="showRange" class="flex flex-col gap-1">
      <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider">
        Előny: {{ settings.minAdvantage.toFixed(1) }} – {{ formatMax(settings.maxAdvantage) }}
      </span>
      <input
        type="range" min="0" :max="MAX_ADVANTAGE_CAP" step="0.5"
        :value="settings.minAdvantage"
        class="accent-amber-500"
        @input="setMin(Number(($event.target as HTMLInputElement).value))"
      >
      <input
        type="range" min="0" :max="MAX_ADVANTAGE_CAP" step="0.5"
        :value="settings.maxAdvantage"
        class="accent-amber-500"
        @input="setMax(Number(($event.target as HTMLInputElement).value))"
      >
    </div>

    <!-- Különbség legjobb és második lépés között -->
    <label v-if="showGap" class="flex flex-col gap-1">
      <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider">
        Legjobb vs. 2. lépés különbség ≥ {{ settings.gap.toFixed(1) }}
      </span>
      <input v-model.number="settings.gap" type="range" min="0.5" max="5" step="0.5" class="accent-amber-500">
    </label>

    <!-- Egyenlő küszöb -->
    <label class="flex flex-col gap-1">
      <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider">
        „Egyenlő”, ha |értékelés| &lt; {{ settings.equalThreshold.toFixed(1) }}
      </span>
      <input v-model.number="settings.equalThreshold" type="range" min="0.2" max="1.5" step="0.1" class="accent-amber-500">
    </label>

    <!-- Fél-lépés tartomány -->
    <div class="flex flex-col gap-1">
      <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider">
        Játszmaszakasz: {{ Math.ceil(settings.minPly / 2) }}. – {{ Math.ceil(settings.maxPly / 2) }}. lépés
      </span>
      <input
        type="range" min="8" max="100" step="2"
        :value="settings.minPly"
        class="accent-amber-500"
        @input="setMinPly(Number(($event.target as HTMLInputElement).value))"
      >
      <input
        type="range" min="8" max="100" step="2"
        :value="settings.maxPly"
        class="accent-amber-500"
        @input="setMaxPly(Number(($event.target as HTMLInputElement).value))"
      >
    </div>

    <label class="flex items-center gap-2 text-xs text-gray-300">
      <input v-model="settings.quietOnly" type="checkbox" class="accent-amber-500">
      Csak nyugodt állások (nincs sakk, előző lépés nem ütés)
    </label>

    <button
      class="py-2 rounded bg-amber-600 hover:bg-amber-500 text-white font-semibold transition-colors disabled:opacity-50"
      :disabled="!!openingError"
      data-testid="training-start"
      @click="emit('apply')"
    >
      Indítás
    </button>
  </div>
</template>
