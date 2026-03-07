<script setup lang="ts">
import type { AnalysisLine, EvalResult } from '~/types/chess'

defineProps<{
  lines: AnalysisLine[]
  isAnalyzing: boolean
}>()

function formatScore(score: EvalResult): string {
  if (score.type === 'mate') {
    return score.value > 0 ? `M${score.value}` : `-M${Math.abs(score.value)}`
  }
  return score.value >= 0 ? `+${score.value.toFixed(1)}` : score.value.toFixed(1)
}
</script>

<template>
  <div class="flex flex-col gap-1.5 shrink-0">
    <div class="text-xs font-semibold text-gray-500 uppercase tracking-wider">
      Elemzés
    </div>

    <!-- Mindig 3 slot renderelődik → stabil magasság, nem ugrik a layout -->
    <div
      v-for="i in 3"
      :key="i"
      class="flex items-baseline gap-2 min-h-[28px]"
      :class="i === 1 ? 'opacity-100' : 'opacity-50'"
    >
      <!-- Van adat ehhez a sorhoz -->
      <template v-if="lines[i - 1]">
        <span
          class="shrink-0 font-bold font-mono tabular-nums px-1.5 py-0.5 rounded"
          :class="[
            lines[i - 1].score.type === 'mate'
              ? 'bg-red-900 text-red-300'
              : lines[i - 1].score.value >= 0
                ? 'bg-gray-700 text-gray-100'
                : 'bg-gray-700 text-gray-400',
            i === 1 ? 'text-sm' : 'text-xs',
          ]"
        >
          {{ formatScore(lines[i - 1].score) }}
        </span>
        <span
          class="font-mono leading-snug break-all"
          :class="i === 1 ? 'text-sm font-medium text-white' : 'text-xs text-gray-300'"
        >
          {{ lines[i - 1].moves.map(m => formatSan(m)).join(' ') }}
        </span>
      </template>

      <!-- Elemzés folyamatban, még nincs adat ehhez a sorhoz -->
      <template v-else-if="isAnalyzing">
        <div class="flex-1 h-5 rounded bg-gray-700 animate-pulse" />
      </template>

      <!-- Nincs elemzés – üres slot tartja a helyet -->
    </div>
  </div>
</template>
