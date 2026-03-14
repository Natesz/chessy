<script setup lang="ts">
const props = defineProps<{
  fenError?: string | null
  pgnError?: string | null
  currentFen: string
  currentPgn: string
}>()

const emit = defineEmits<{
  loadFen: [fen: string]
  loadPgn: [pgn: string]
}>()

const fenInput = ref(props.currentFen)
const pgnInput = ref(props.currentPgn)

// Sync display with current position as user navigates
watch(() => props.currentFen, (fen) => { fenInput.value = fen })
watch(() => props.currentPgn, (pgn) => { pgnInput.value = pgn })
</script>

<template>
  <div class="flex flex-col gap-2 bg-gray-800 rounded-lg p-3 w-52 shrink-0 overflow-hidden">
    <!-- FEN section -->
    <div class="flex-1 flex flex-col gap-1.5 min-h-0">
      <div class="text-xs font-semibold text-gray-500 uppercase tracking-wider shrink-0">
        FEN
      </div>
      <input
        v-model="fenInput"
        data-testid="fen-input"
        type="text"
        class="shrink-0 w-full bg-gray-700 text-gray-100 text-xs font-mono rounded px-2 py-1.5 border border-gray-600 focus:border-amber-500 focus:outline-none"
        placeholder="Illeszd be a FEN-t..."
      />
      <div v-if="fenError" class="text-red-400 text-xs shrink-0">
        {{ fenError }}
      </div>
      <button
        data-testid="fen-load-btn"
        class="shrink-0 py-1.5 rounded bg-blue-700 hover:bg-blue-600 active:bg-blue-800 text-white font-semibold text-xs transition-colors"
        @click="emit('loadFen', fenInput)"
      >
        Betöltés
      </button>
    </div>

    <div class="border-t border-gray-700 shrink-0" />

    <!-- PGN section -->
    <div class="flex-[3] flex flex-col gap-1.5 min-h-0">
      <div class="text-xs font-semibold text-gray-500 uppercase tracking-wider shrink-0">
        PGN
      </div>
      <textarea
        v-model="pgnInput"
        data-testid="pgn-input"
        class="flex-1 min-h-0 w-full bg-gray-700 text-gray-100 text-xs font-mono rounded px-2 py-1.5 border border-gray-600 focus:border-amber-500 focus:outline-none resize-none"
        placeholder="Illeszd be a PGN-t..."
      />
      <div v-if="pgnError" class="text-red-400 text-xs shrink-0">
        {{ pgnError }}
      </div>
      <button
        data-testid="pgn-load-btn"
        class="shrink-0 py-1.5 rounded bg-blue-700 hover:bg-blue-600 active:bg-blue-800 text-white font-semibold text-xs transition-colors"
        @click="emit('loadPgn', pgnInput)"
      >
        Betöltés
      </button>
    </div>
  </div>
</template>
