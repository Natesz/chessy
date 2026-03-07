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
  <div class="flex flex-col gap-2">
    <div class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
      Elemzés
    </div>

    <!-- Loading state -->
    <template v-if="isAnalyzing && !lines.length">
      <div v-for="i in 3" :key="`loading-${i}`" class="h-8 rounded bg-gray-800 animate-pulse" />
    </template>

    <!-- Lines -->
    <div
      v-for="line in lines"
      :key="line.multipv"
      class="flex items-baseline gap-2"
      :class="line.multipv === 1 ? 'opacity-100' : 'opacity-50'"
    >
      <!-- Score badge -->
      <span
        class="shrink-0 text-xs font-bold font-mono tabular-nums px-1.5 py-0.5 rounded"
        :class="[
          line.score.type === 'mate'
            ? 'bg-red-900 text-red-300'
            : line.score.value >= 0
              ? 'bg-gray-700 text-gray-100'
              : 'bg-gray-700 text-gray-400',
          line.multipv === 1 ? 'text-sm' : 'text-xs',
        ]"
      >
        {{ formatScore(line.score) }}
      </span>

      <!-- Moves -->
      <span
        class="font-mono text-gray-300 leading-snug break-all"
        :class="line.multipv === 1 ? 'text-sm font-medium text-white' : 'text-xs'"
      >
        {{ line.moves.join(' ') }}
      </span>
    </div>
  </div>
</template>
