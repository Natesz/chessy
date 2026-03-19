<script setup lang="ts">
import { Chessground } from 'chessground'
import type { Api } from 'chessground/api'
import type { Config } from 'chessground/config'
import type { Key } from 'chessground/types'
import type { AnalysisLine, ChessMove, GameState } from '~/types/chess'

const props = withDefaults(defineProps<{
  fen: string
  gameState: GameState
  legalMoves: Map<Key, Key[]>
  analysisLines: AnalysisLine[]
  orientation?: 'white' | 'black'
  movableColor?: 'white' | 'black' | 'both' | 'none'
  showArrows?: boolean
}>(), {
  showArrows: true,
})

const emit = defineEmits<{
  move: [move: ChessMove]
  navigate: [direction: 'back' | 'forward']
}>()

const boardEl = ref<HTMLElement | null>(null)
let cg: Api | null = null
let pendingFen: string | null = null

function computeArrows() {
  if (!props.showArrows) return { shapes: [], brushes: {} }
  const lines = props.analysisLines
  if (!lines.length || props.gameState.isGameOver) return { shapes: [], brushes: {} }

  const best = lines[0]
  if (!best?.bestMove) return { shapes: [], brushes: {} }

  const second = lines[1]
  const third = lines[2]
  const gap12 = second ? Math.abs(best.score.value - second.score.value) : 10

  const shapes: Array<{ orig: Key, dest: Key, brush: string }> = []
  const brushes: Record<string, { key: string, color: string, opacity: number, lineWidth: number }> = {}

  brushes.arrow1 = { key: 'arrow1', color: '#5b8abf', opacity: 0.85, lineWidth: 18 }
  shapes.push({
    orig: best.bestMove.slice(0, 2) as Key,
    dest: best.bestMove.slice(2, 4) as Key,
    brush: 'arrow1',
  })

  if (gap12 < 5) {
    const ratio12 = (5 - Math.min(gap12, 5)) / 5

    if (second?.bestMove) {
      const w2 = Math.min(12, Math.max(3, Math.round(ratio12 * 9 + 3)))
      brushes.arrow2 = { key: 'arrow2', color: '#8899BB', opacity: ratio12 * 0.45 + 0.15, lineWidth: w2 }
      shapes.push({
        orig: second.bestMove.slice(0, 2) as Key,
        dest: second.bestMove.slice(2, 4) as Key,
        brush: 'arrow2',
      })
    }

    if (third?.bestMove) {
      const gap13 = Math.abs(best.score.value - third.score.value)
      const ratio13 = (5 - Math.min(gap13, 5)) / 5
      if (ratio13 > 0) {
        const w3 = Math.min(10, Math.max(2, Math.round(ratio13 * 7 + 3)))
        brushes.arrow3 = { key: 'arrow3', color: '#8899BB', opacity: ratio13 * 0.40 + 0.15, lineWidth: w3 }
        shapes.push({
          orig: third.bestMove.slice(0, 2) as Key,
          dest: third.bestMove.slice(2, 4) as Key,
          brush: 'arrow3',
        })
      }
    }
  }

  return { shapes, brushes }
}

function syncCg() {
  if (!cg) return
  const { shapes, brushes } = computeArrows()
  const mc = props.movableColor === 'none' ? undefined : (props.movableColor ?? 'both')
  const movableColorResolved = props.gameState.isGameOver ? undefined : mc
  // Full board sync (fen changed: pieces + movable + arrows)
  cg.set({
    fen: props.fen,
    orientation: props.orientation ?? 'white',
    turnColor: props.gameState.turn === 'w' ? 'white' : 'black',
    movable: {
      color: movableColorResolved,
      dests: props.legalMoves,
    },
    check: props.gameState.isCheck,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    drawable: { brushes } as any,
  })
  cg.setAutoShapes(shapes)
  // Re-sync arrows after chessground animation (200ms) to survive skipSvg frames
  setTimeout(() => syncArrows(), 250)
}

function syncArrows() {
  if (!cg) return
  const { shapes, brushes } = computeArrows()
  // No fen → render() path (not anim()) — user annotations preserved, no RAF race
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cg.set({ drawable: { brushes } } as any)
  cg.setAutoShapes(shapes)
}

function initChessground() {
  if (!boardEl.value) return

  const config: Config = {
    fen: props.fen,
    orientation: props.orientation ?? 'white',
    turnColor: props.gameState.turn === 'w' ? 'white' : 'black',
    movable: {
      color: props.movableColor === 'none' ? undefined : (props.movableColor ?? 'both'),
      free: false,
      dests: props.legalMoves,
      events: {
        after(orig: Key, dest: Key) {
          pendingFen = props.fen
          emit('move', { from: orig, to: dest })
          nextTick(() => {
            if (pendingFen === props.fen) syncCg()
            pendingFen = null
          })
        },
      },
    },
    coordinates: true,
    coordinatesOnSquares: true,
    draggable: { enabled: true },
    selectable: { enabled: true },
    highlight: { lastMove: true, check: true },
    animation: { enabled: true, duration: 200 },
    drawable: {
      enabled: true,
      visible: true,
      defaultSnapToValidMove: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      brushes: {
        arrow1: { key: 'arrow1', color: '#5b8abf', opacity: 0.85, lineWidth: 18 },
        arrow2: { key: 'arrow2', color: '#8899BB', opacity: 0.45, lineWidth: 12 },
        arrow3: { key: 'arrow3', color: '#8899BB', opacity: 0.30, lineWidth: 9 },
      },
    } as any,
  }

  cg = Chessground(boardEl.value, config)
}

function handleWheel(e: WheelEvent) {
  e.preventDefault()
  emit('navigate', e.deltaY < 0 ? 'back' : 'forward')
}

watch(
  [() => props.fen, () => props.movableColor, () => props.orientation],
  () => syncCg(),
)
watch(() => props.analysisLines, () => {
  syncArrows()
}, { deep: true })

onMounted(() => {
  initChessground()
  syncArrows()
})
onUnmounted(() => cg?.destroy())
</script>

<template>
  <div
    class="relative w-full"
    @wheel.prevent="handleWheel"
  >
    <div ref="boardEl" class="w-full" style="aspect-ratio: 1" />
  </div>
</template>

<style>
@import 'chessground/assets/chessground.base.css';
@import 'chessground/assets/chessground.brown.css';
@import 'chessground/assets/chessground.cburnett.css';
</style>
