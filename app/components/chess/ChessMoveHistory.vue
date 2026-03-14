<script setup lang="ts">
import type { MoveNode, VarLine } from '~/types/chess'
import ChessMoveVariation from './ChessMoveVariation.vue'

const props = defineProps<{
  root: MoveNode
  currentNode: MoveNode
  treeVersion: number
}>()

const emit = defineEmits<{
  navigateTo: [node: MoveNode]
}>()

const historyEl = ref<HTMLElement | null>(null)

function buildVarLine(startNode: MoveNode, depth: number): VarLine {
  const moves: MoveNode[] = []
  const subVarGroups: VarLine[][] = []
  let cur: MoveNode | null = startNode
  while (cur) {
    moves.push(cur)
    subVarGroups.push(cur.children.slice(1).map(v => buildVarLine(v, depth + 1)))
    cur = cur.children[0] ?? null
  }
  const isSimple = subVarGroups.every(g => g.length === 0)
  return { depth, moves, subVarGroups, isSimple }
}

interface PairDisplay {
  moveNumber: number
  white: MoveNode
  black: MoveNode | null
  whiteVarLines: VarLine[]
  blackVarLines: VarLine[]
}

const pairs = computed<PairDisplay[]>(() => {
  props.treeVersion
  const result: PairDisplay[] = []
  let pos = props.root
  while (pos.children.length > 0) {
    const white = pos.children[0]
    const whiteVarLines = pos.children.slice(1).map(v => buildVarLine(v, 1))
    const black = white.children[0] ?? null
    const blackVarLines = white.children.slice(1).map(v => buildVarLine(v, 1))
    result.push({ moveNumber: white.moveNumber, white, black, whiteVarLines, blackVarLines })
    if (!black) break
    pos = black
  }
  return result
})

function isActive(node: MoveNode) {
  return node.id === props.currentNode.id
}

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
  <div ref="historyEl" data-testid="move-history" class="overflow-y-auto flex-1 min-h-0 text-sm font-mono">
    <div
      v-if="!pairs.length"
      class="text-gray-600 text-xs text-center py-6"
    >
      Kezdőállás
    </div>

    <div
      v-for="pair in pairs"
      :key="pair.white.id"
      class="mb-0.5"
    >
      <!-- Főág lépéspár -->
      <div class="flex items-center gap-1 px-1 leading-6">
        <span class="text-gray-600 text-xs w-7 text-right shrink-0 select-none">{{ pair.moveNumber }}.</span>

        <button
          :data-node-id="pair.white.id"
          class="w-[45%] text-left px-1.5 rounded transition-colors"
          :class="isActive(pair.white)
            ? 'bg-amber-500 text-gray-900 font-bold'
            : 'text-gray-200 hover:bg-gray-700'"
          @click="emit('navigateTo', pair.white)"
        >
          {{ formatSan(pair.white.move?.san ?? '') }}
        </button>

        <button
          v-if="pair.black"
          :data-node-id="pair.black.id"
          class="w-[45%] text-left px-1.5 rounded transition-colors"
          :class="isActive(pair.black)
            ? 'bg-amber-500 text-gray-900 font-bold'
            : 'text-gray-200 hover:bg-gray-700'"
          @click="emit('navigateTo', pair.black)"
        >
          {{ formatSan(pair.black.move?.san ?? '') }}
        </button>
        <span v-else class="w-[45%]" />
      </div>

      <!-- Fehér mellékágak (alternatív fehér lépések ennél a pozíciónál) -->
      <template v-if="pair.whiteVarLines.length">
        <div
          v-for="(varLine, i) in pair.whiteVarLines"
          :key="`w${i}`"
          class="pl-[29px] flex flex-wrap items-baseline gap-x-0.5 leading-5 py-0.5 text-xs text-gray-500 font-mono"
        >
          <ChessMoveVariation
            :var-line="varLine"
            :current-node-id="currentNode.id"
            @navigate-to="emit('navigateTo', $event)"
          />
        </div>
      </template>

      <!-- Fekete mellékágak (alternatív fekete válaszok fehér lépése után) -->
      <template v-if="pair.blackVarLines.length">
        <div
          v-for="(varLine, i) in pair.blackVarLines"
          :key="`b${i}`"
          class="pl-[29px] flex flex-wrap items-baseline gap-x-0.5 leading-5 py-0.5 text-xs text-gray-500 font-mono"
        >
          <ChessMoveVariation
            :var-line="varLine"
            :current-node-id="currentNode.id"
            @navigate-to="emit('navigateTo', $event)"
          />
        </div>
      </template>
    </div>
  </div>
</template>
