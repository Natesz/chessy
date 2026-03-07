<script setup lang="ts">
import type { MoveNode, VarLine } from '~/types/chess'

// Szükséges a rekurzív önreferenciához
defineOptions({ name: 'ChessMoveVariation' })

const props = defineProps<{
  varLine: VarLine
  currentNodeId: string
}>()

const emit = defineEmits<{
  navigateTo: [node: MoveNode]
}>()

interface VarPair {
  moveNumber: number
  white: MoveNode | null
  black: MoveNode | null
  whiteSubVars: VarLine[]
  blackSubVars: VarLine[]
}

const varPairs = computed<VarPair[]>(() => {
  const { moves, subVarGroups } = props.varLine
  const result: VarPair[] = []
  let i = 0

  // Ha fekete lépéssel kezdődik a mellékág (fehér főlépés utáni elágazás)
  if (moves[0]?.color === 'b') {
    result.push({
      moveNumber: moves[0].moveNumber,
      white: null,
      black: moves[0],
      whiteSubVars: [],
      blackSubVars: subVarGroups[0] ?? [],
    })
    i = 1
  }

  while (i < moves.length) {
    const w = moves[i]
    const b = i + 1 < moves.length ? moves[i + 1] : null
    result.push({
      moveNumber: w.moveNumber,
      white: w,
      black: b,
      whiteSubVars: subVarGroups[i] ?? [],
      blackSubVars: b ? (subVarGroups[i + 1] ?? []) : [],
    })
    i += 2
  }

  return result
})

const fontClass = computed(() =>
  props.varLine.depth === 1 ? 'text-xs' : 'text-[11px]',
)

function isActive(node: MoveNode) {
  return node.id === props.currentNodeId
}
</script>

<template>
  <!-- Egyszerű mellékág: egyetlen sorban zárójelben -->
  <div
    v-if="varLine.isSimple"
    class="pl-2 flex flex-wrap items-center gap-x-0.5 leading-5 py-0.5 text-gray-500"
    :class="fontClass"
  >
    <span>(</span>
    <template v-for="(vp, idx) in varPairs" :key="idx">
      <span class="text-gray-600 select-none">{{ vp.white ? `${vp.moveNumber}.` : `${vp.moveNumber}...` }}</span>
      <button
        v-if="vp.white"
        :data-node-id="vp.white.id"
        class="px-0.5 rounded transition-colors"
        :class="isActive(vp.white)
          ? 'bg-amber-500 text-gray-900 font-bold'
          : 'text-gray-400 hover:bg-gray-700 hover:text-gray-300'"
        @click="emit('navigateTo', vp.white)"
      >{{ vp.white.move?.san }}</button>
      <button
        v-if="vp.black"
        :data-node-id="vp.black.id"
        class="px-0.5 rounded transition-colors"
        :class="isActive(vp.black)
          ? 'bg-amber-500 text-gray-900 font-bold'
          : 'text-gray-400 hover:bg-gray-700 hover:text-gray-300'"
        @click="emit('navigateTo', vp.black)"
      >{{ vp.black.move?.san }}</button>
    </template>
    <span>)</span>
  </div>

  <!-- Összetett mellékág: több sor, saját blokkban -->
  <div
    v-else
    class="pl-2 border-l border-gray-700 ml-1 my-0.5"
    :class="fontClass"
  >
    <span class="text-gray-600 pl-1">(</span>
    <div v-for="vp in varPairs" :key="vp.white?.id ?? vp.black!.id">
      <div class="flex items-center gap-1 leading-5 pl-1">
        <span class="text-gray-600 select-none shrink-0 w-7 text-right">
          {{ vp.white ? `${vp.moveNumber}.` : `${vp.moveNumber}...` }}
        </span>
        <button
          v-if="vp.white"
          :data-node-id="vp.white.id"
          class="px-0.5 rounded transition-colors"
          :class="isActive(vp.white)
            ? 'bg-amber-500 text-gray-900 font-bold'
            : 'text-gray-400 hover:bg-gray-700 hover:text-gray-300'"
          @click="emit('navigateTo', vp.white)"
        >{{ vp.white.move?.san }}</button>
        <button
          v-if="vp.black"
          :data-node-id="vp.black.id"
          class="px-0.5 rounded transition-colors"
          :class="isActive(vp.black)
            ? 'bg-amber-500 text-gray-900 font-bold'
            : 'text-gray-400 hover:bg-gray-700 hover:text-gray-300'"
          @click="emit('navigateTo', vp.black)"
        >{{ vp.black.move?.san }}</button>
      </div>
      <!-- Mellékágon belüli mellékágak (fehér lépés után) -->
      <ChessMoveVariation
        v-for="(sv, svi) in vp.whiteSubVars"
        :key="`w${svi}`"
        :var-line="sv"
        :current-node-id="currentNodeId"
        @navigate-to="emit('navigateTo', $event)"
      />
      <!-- Mellékágon belüli mellékágak (fekete lépés után) -->
      <ChessMoveVariation
        v-for="(sv, svi) in vp.blackSubVars"
        :key="`b${svi}`"
        :var-line="sv"
        :current-node-id="currentNodeId"
        @navigate-to="emit('navigateTo', $event)"
      />
    </div>
    <span class="text-gray-600 pl-1">)</span>
  </div>
</template>
