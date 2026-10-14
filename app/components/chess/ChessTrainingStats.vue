<script setup lang="ts">
import type { ScoreBucket, TrainingStats } from '~/types/training'

const props = defineProps<{
  stats: TrainingStats
}>()

const emit = defineEmits<{
  reset: []
}>()

const kindLabel: Record<string, string> = {
  classic: 'Ki áll jobban?',
  puzzle: 'Puzzle-típus',
  onlymove: 'Egyensúly, pontos lépés',
}

function pct(b: ScoreBucket) {
  return b.total ? Math.round((b.correct / b.total) * 100) : 0
}

const accuracy = computed(() => pct(props.stats))
const kinds = computed(() => Object.entries(props.stats.byKind))
const openings = computed(() =>
  Object.entries(props.stats.byOpening).sort((a, b) => b[1].total - a[1].total).slice(0, 8),
)
</script>

<template>
  <div class="flex flex-col gap-3" data-testid="training-stats">
    <div class="grid grid-cols-4 gap-2 text-center">
      <div class="bg-gray-900/60 rounded p-2">
        <div class="text-lg font-bold text-amber-400" data-testid="stats-score">{{ stats.correct }}</div>
        <div class="text-[10px] text-gray-500 uppercase">Pont</div>
      </div>
      <div class="bg-gray-900/60 rounded p-2">
        <div class="text-lg font-bold text-gray-200">{{ accuracy }}%</div>
        <div class="text-[10px] text-gray-500 uppercase">{{ stats.total }} válasz</div>
      </div>
      <div class="bg-gray-900/60 rounded p-2">
        <div class="text-lg font-bold text-green-400">{{ stats.streak }}</div>
        <div class="text-[10px] text-gray-500 uppercase">Sorozat</div>
      </div>
      <div class="bg-gray-900/60 rounded p-2">
        <div class="text-lg font-bold text-gray-200">{{ stats.bestStreak }}</div>
        <div class="text-[10px] text-gray-500 uppercase">Rekord</div>
      </div>
    </div>

    <div v-if="kinds.length || openings.length" class="text-xs text-gray-400 space-y-1">
      <div v-for="[k, b] in kinds" :key="k" class="flex justify-between">
        <span>{{ kindLabel[k] ?? k }}</span>
        <span class="font-mono">{{ b.correct }}/{{ b.total }} ({{ pct(b) }}%)</span>
      </div>
      <div v-if="openings.length" class="border-t border-gray-700 pt-1 mt-1" />
      <div v-for="[name, b] in openings" :key="name" class="flex justify-between gap-2">
        <span class="truncate">{{ name }}</span>
        <span class="font-mono shrink-0">{{ b.correct }}/{{ b.total }} ({{ pct(b) }}%)</span>
      </div>
    </div>

    <button
      v-if="stats.total"
      class="self-end text-[11px] text-gray-500 hover:text-gray-300 underline"
      @click="emit('reset')"
    >
      Statisztika nullázása
    </button>
  </div>
</template>
