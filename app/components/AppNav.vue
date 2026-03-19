<script setup lang="ts">
const route = useRoute()
const menuOpen = ref(false)

function isActive(path: string) {
  return route.path === path
}

watch(() => route.path, () => {
  menuOpen.value = false
})

const navLinks = [
  { to: '/analysis', label: 'Elemzés', disabled: false },
  { to: '/play', label: 'Játék', disabled: false },
  { to: '/cube', label: 'Kocka', disabled: false },
  { to: '/puzzle', label: 'Puzzle', disabled: true },
] as const
</script>

<template>
  <nav class="bg-gray-800 border-b border-gray-700 px-3 lg:px-6 py-2 flex items-center gap-4 lg:gap-6 shrink-0">
    <NuxtLink
      to="/analysis"
      class="flex items-center gap-2 text-white font-bold text-lg tracking-tight hover:text-amber-400 transition-colors"
    >
      ♟ Chessy
    </NuxtLink>

    <!-- Desktop nav links -->
    <div class="hidden lg:flex items-center gap-1">
      <template v-for="link in navLinks" :key="link.to">
        <NuxtLink
          v-if="!link.disabled"
          :to="link.to"
          class="px-3 py-1.5 text-sm font-medium transition-colors rounded"
          :class="isActive(link.to)
            ? 'text-amber-400 border-b-2 border-amber-500'
            : 'text-gray-300 hover:text-white'"
        >
          {{ link.label }}
        </NuxtLink>
        <span
          v-else
          class="px-3 py-1.5 text-sm font-medium text-gray-500 cursor-not-allowed"
          title="Hamarosan..."
        >
          {{ link.label }}
        </span>
      </template>
    </div>

    <!-- Hamburger button (mobile only) -->
    <button
      class="lg:hidden ml-auto w-9 h-9 flex items-center justify-center rounded text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
      aria-label="Menü megnyitása"
      @click="menuOpen = true"
    >
      <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
  </nav>

  <!-- Mobile drawer overlay -->
  <Teleport to="body">
    <Transition name="drawer-overlay">
      <div
        v-if="menuOpen"
        class="fixed inset-0 bg-black/50 z-40 lg:hidden"
        @click="menuOpen = false"
      />
    </Transition>

    <Transition name="drawer-panel">
      <div
        v-if="menuOpen"
        class="fixed right-0 top-0 h-full w-64 bg-gray-800 border-l border-gray-700 z-50 flex flex-col lg:hidden"
      >
        <!-- Close button -->
        <div class="flex justify-end p-3">
          <button
            class="w-9 h-9 flex items-center justify-center rounded text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
            aria-label="Menü bezárása"
            @click="menuOpen = false"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Nav links as cards -->
        <div class="flex flex-col gap-3 px-4">
          <template v-for="link in navLinks" :key="link.to">
            <NuxtLink
              v-if="!link.disabled"
              :to="link.to"
              class="block rounded-lg p-4 text-base font-medium transition-colors border"
              :class="isActive(link.to)
                ? 'bg-amber-600/20 border-amber-500 text-amber-400'
                : 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600 hover:text-white'"
              @click="menuOpen = false"
            >
              {{ link.label }}
            </NuxtLink>
            <span
              v-else
              class="block rounded-lg p-4 text-base font-medium bg-gray-700/50 border border-gray-600 text-gray-500 cursor-not-allowed"
            >
              {{ link.label }}
              <span class="text-xs ml-2 text-gray-600">Hamarosan...</span>
            </span>
          </template>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Overlay fade */
.drawer-overlay-enter-active,
.drawer-overlay-leave-active {
  transition: opacity 0.2s ease;
}
.drawer-overlay-enter-from,
.drawer-overlay-leave-to {
  opacity: 0;
}

/* Panel slide from right */
.drawer-panel-enter-active,
.drawer-panel-leave-active {
  transition: transform 0.25s ease;
}
.drawer-panel-enter-from,
.drawer-panel-leave-to {
  transform: translateX(100%);
}
</style>
