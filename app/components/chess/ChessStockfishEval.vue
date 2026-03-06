<script setup lang="ts">
import type { EvalResult } from '~/types/chess'

const props = defineProps<{
  evalResult: EvalResult | null
  isAnalyzing: boolean
}>()

const evalDisplay = computed(() => {
  if (!props.evalResult) return '+0.0'
  if (props.evalResult.type === 'mate') {
    const v = props.evalResult.value
    return v > 0 ? `M${v}` : `-M${Math.abs(v)}`
  }
  const v = props.evalResult.value
  return v >= 0 ? `+${v.toFixed(1)}` : v.toFixed(1)
})

// White percentage of bar: 50=equal, 100=white winning, 0=black winning
const whitePercent = computed(() => {
  if (!props.evalResult) return 50
  if (props.evalResult.type === 'mate') {
    return props.evalResult.value > 0 ? 95 : 5
  }
  // Sigmoid-like: clamp to [-5, 5] pawns range
  const clamped = Math.max(-5, Math.min(5, props.evalResult.value))
  return 50 + (clamped / 5) * 45
})
</script>

<template>
  <div class="flex flex-col items-center h-full gap-1 py-1">
    <!-- Eval bar -->
    <div class="relative flex-1 w-5 rounded overflow-hidden bg-gray-800 border border-gray-600 min-h-0">
      <!-- Loading pulse -->
      <div
        v-if="isAnalyzing"
        class="absolute inset-0 bg-white/10 animate-pulse z-10"
      />
      <!-- White portion (from bottom) -->
      <div
        class="absolute bottom-0 left-0 right-0 bg-gray-100 transition-all duration-500"
        :style="{ height: `${whitePercent}%` }"
      />
    </div>

    <!-- Eval number -->
    <span class="text-xs font-mono font-bold text-gray-200 tabular-nums leading-none">
      {{ evalDisplay }}
    </span>
  </div>
</template>
