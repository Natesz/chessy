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

function isActive(node: MoveNode) {
  return node.id === props.currentNodeId
}
</script>

<template>
  <!-- Fragment root: no outer parentheses, renders inline inside parent's flex row -->
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
    >{{ formatSan(vp.white.move?.san ?? '') }}</button>

    <!-- Mellékágon belüli mellékágak fehér lépés után: inline zárójelben -->
    <template v-if="vp.whiteSubVars.length">
      <template v-for="(sv, svi) in vp.whiteSubVars" :key="`w${svi}`">
        <span class="text-gray-600">(</span>
        <ChessMoveVariation
          :var-line="sv"
          :current-node-id="currentNodeId"
          @navigate-to="emit('navigateTo', $event)"
        />
        <span class="text-gray-600">)</span>
      </template>
    </template>

    <button
      v-if="vp.black"
      :data-node-id="vp.black.id"
      class="px-0.5 rounded transition-colors"
      :class="isActive(vp.black)
        ? 'bg-amber-500 text-gray-900 font-bold'
        : 'text-gray-400 hover:bg-gray-700 hover:text-gray-300'"
      @click="emit('navigateTo', vp.black)"
    >{{ formatSan(vp.black.move?.san ?? '') }}</button>

    <!-- Mellékágon belüli mellékágak fekete lépés után: inline zárójelben -->
    <template v-if="vp.blackSubVars.length">
      <template v-for="(sv, svi) in vp.blackSubVars" :key="`b${svi}`">
        <span class="text-gray-600">(</span>
        <ChessMoveVariation
          :var-line="sv"
          :current-node-id="currentNodeId"
          @navigate-to="emit('navigateTo', $event)"
        />
        <span class="text-gray-600">)</span>
      </template>
    </template>
  </template>
</template>
