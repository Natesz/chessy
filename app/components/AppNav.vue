<script setup lang="ts">
const route = useRoute()

function isActive(path: string) {
  return route.path === path
}
</script>

<template>
  <nav class="bg-gray-800 border-b border-gray-700 px-6 py-2 flex items-center gap-6 shrink-0">
    <NuxtLink
      to="/analysis"
      class="flex items-center gap-2 text-white font-bold text-lg tracking-tight hover:text-amber-400 transition-colors"
    >
      ♟ Chessy
    </NuxtLink>

    <div class="flex items-center gap-1">
      <NuxtLink
        to="/analysis"
        class="px-3 py-1.5 text-sm font-medium transition-colors rounded"
        :class="isActive('/analysis')
          ? 'text-amber-400 border-b-2 border-amber-500'
          : 'text-gray-300 hover:text-white'"
      >
        Elemzés
      </NuxtLink>

      <NuxtLink
        to="/play"
        class="px-3 py-1.5 text-sm font-medium transition-colors rounded"
        :class="isActive('/play')
          ? 'text-amber-400 border-b-2 border-amber-500'
          : 'text-gray-300 hover:text-white'"
      >
        Játék
      </NuxtLink>

      <span
        class="px-3 py-1.5 text-sm font-medium text-gray-500 cursor-not-allowed"
        title="Hamarosan..."
      >
        Puzzle
      </span>
    </div>
  </nav>
</template>
