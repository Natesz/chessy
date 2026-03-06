<script setup lang="ts">
import type { MoveNode } from '~/types/chess'

const props = defineProps<{
  root: MoveNode
  currentNode: MoveNode
  treeVersion: number
}>()

const emit = defineEmits<{
  navigateTo: [node: MoveNode]
}>()

const historyEl = ref<HTMLElement | null>(null)

interface MovePair {
  moveNumber: number
  white: MoveNode
  black: MoveNode | null
  whiteVariations: MoveNode[]
  blackVariations: MoveNode[]
}

const pairs = computed<MovePair[]>(() => {
  props.treeVersion // reaktív függőség: fa változásakor újraszámolja
  const result: MovePair[] = []
  let positionNode = props.root

  while (positionNode.children.length > 0) {
    const white = positionNode.children[0]
    const whiteVariations = positionNode.children.slice(1)
    const black = white.children.length > 0 ? white.children[0] : null
    const blackVariations = white.children.slice(1)

    result.push({ moveNumber: white.moveNumber, white, black, whiteVariations, blackVariations })

    if (!black) break
    positionNode = black
  }

  return result
})

function isActive(node: MoveNode) {
  return node.id === props.currentNode.id
}

// Aktuális lépés láthatóvá tétele görgetéssel
watch(
  () => props.currentNode,
  (node) => {
    nextTick(() => {
      const el = historyEl.value?.querySelector<HTMLElement>(`[data-node-id="${node.id}"]`)
      el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    })
  },
)
</script>

<template>
  <div ref="historyEl" class="overflow-y-auto flex-1 min-h-0 text-sm font-mono">
    <!-- Kezdőállás -->
    <div
      v-if="!pairs.length"
      class="text-gray-600 text-xs text-center py-6"
    >
      Kezdőállás
    </div>

    <div
      v-for="pair in pairs"
      :key="pair.moveNumber"
      class="mb-0.5"
    >
      <!-- Főág: lépéspár -->
      <div class="flex items-center gap-1 px-1 leading-6">
        <span class="text-gray-600 text-xs w-7 text-right shrink-0 select-none">{{ pair.moveNumber }}.</span>

        <!-- Fehér lépés -->
        <button
          :data-node-id="pair.white.id"
          class="w-[45%] text-left px-1.5 rounded transition-colors"
          :class="isActive(pair.white)
            ? 'bg-amber-500 text-gray-900 font-bold'
            : 'text-gray-200 hover:bg-gray-700'"
          @click="emit('navigateTo', pair.white)"
        >
          {{ pair.white.move?.san }}
        </button>

        <!-- Fekete lépés -->
        <button
          v-if="pair.black"
          :data-node-id="pair.black.id"
          class="w-[45%] text-left px-1.5 rounded transition-colors"
          :class="isActive(pair.black)
            ? 'bg-amber-500 text-gray-900 font-bold'
            : 'text-gray-200 hover:bg-gray-700'"
          @click="emit('navigateTo', pair.black)"
        >
          {{ pair.black.move?.san }}
        </button>
        <span v-else class="w-[45%]" />
      </div>

      <!-- Fehér mellékágak -->
      <div
        v-if="pair.whiteVariations.length"
        class="pl-8 flex flex-col gap-0.5 mb-0.5"
      >
        <div
          v-for="v in pair.whiteVariations"
          :key="v.id"
          class="flex items-center gap-1"
        >
          <span class="text-gray-600 text-xs w-7 text-right shrink-0 select-none">{{ v.moveNumber }}.</span>
          <button
            :data-node-id="v.id"
            class="text-xs px-1.5 rounded transition-colors"
            :class="isActive(v)
              ? 'bg-amber-500 text-gray-900 font-bold'
              : 'text-gray-500 hover:bg-gray-700 hover:text-gray-300'"
            @click="emit('navigateTo', v)"
          >
            {{ v.move?.san }}
          </button>
        </div>
      </div>

      <!-- Fekete mellékágak -->
      <div
        v-if="pair.blackVariations.length"
        class="pl-8 flex flex-col gap-0.5 mb-0.5"
      >
        <div
          v-for="v in pair.blackVariations"
          :key="v.id"
          class="flex items-center gap-1"
        >
          <span class="text-gray-600 text-xs w-7 text-right shrink-0 select-none">{{ v.moveNumber }}...</span>
          <button
            :data-node-id="v.id"
            class="text-xs px-1.5 rounded transition-colors"
            :class="isActive(v)
              ? 'bg-amber-500 text-gray-900 font-bold'
              : 'text-gray-500 hover:bg-gray-700 hover:text-gray-300'"
            @click="emit('navigateTo', v)"
          >
            {{ v.move?.san }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
