<script setup lang="ts">
import ChessGame from '~/components/chess/ChessGame.vue'
import type { PlayerColor } from '~/types/game'

definePageMeta({ ssr: false })

const route = useRoute()

type GameMode = 'ai' | 'live'
type GamePhase = 'setup' | 'playing' | 'finished'

const mode = ref<GameMode>('ai')
const phase = ref<GamePhase>('setup')
const playerColor = ref<PlayerColor>('white')
const shareUrl = ref<string | null>(null)

const gameRef = ref<InstanceType<typeof ChessGame> | null>(null)

const { makeAiMove, init: initAi, destroy: destroyAi } = useStockfishPlayer()
const room = useGameRoom()
const { opponentConnected } = room

// Check if arriving via invite link
onMounted(async () => {
  initAi()
  const gameQuery = route.query.game as string | undefined
  const tokenQuery = route.query.token as string | undefined

  if (gameQuery && tokenQuery) {
    mode.value = 'live'
    try {
      await room.joinRoom(gameQuery, tokenQuery)
      playerColor.value = room.playerColor.value
      phase.value = 'playing'
      room.subscribe(gameQuery)
    }
    catch {
      // Ignore join error — show setup
    }
  }
})

onUnmounted(() => {
  destroyAi()
  room.destroy()
})

async function handleSelectColor(choice: PlayerColor | 'random') {
  if (choice === 'random') {
    playerColor.value = Math.random() < 0.5 ? 'white' : 'black'
  }
  else {
    playerColor.value = choice
  }
  phase.value = 'playing'

  if (mode.value === 'live') {
    await startLiveRoom()
  }
  else if (mode.value === 'ai' && playerColor.value === 'black') {
    // AI plays first as white
    await triggerAiMove()
  }
}

async function startLiveRoom() {
  try {
    const { gameId, token } = await room.createRoom()
    const url = new URL(window.location.href)
    url.searchParams.set('game', gameId)
    url.searchParams.set('token', token)
    shareUrl.value = url.toString()
    room.subscribe(gameId)
  }
  catch {
    // Fall back to AI mode on error
    mode.value = 'ai'
  }
}

async function handleMove(from: string, to: string, promo?: string) {
  if (mode.value === 'live') {
    const currentFen = gameRef.value?.fen ?? ''
    await room.sendMove(`${from}${to}${promo ?? ''}`, currentFen, '')
  }
  else if (mode.value === 'ai') {
    await triggerAiMove()
  }
}

async function triggerAiMove() {
  const currentFen = gameRef.value?.fen
  if (!currentFen) return
  await makeAiMove(currentFen, (from, to, promo) => {
    gameRef.value?.applyOpponentMove(from, to, promo)
  })
}

function handleNewGame() {
  shareUrl.value = null
  room.unsubscribe()
}
</script>

<template>
  <ChessGame
    ref="gameRef"
    v-model:phase="phase"
    v-model:player-color="playerColor"
    :mode="mode"
    :share-url="shareUrl"
    :opponent-connected="opponentConnected"
    @select-color="handleSelectColor"
    @select-mode="(m: GameMode) => { mode = m }"
    @move="(from: string, to: string, promo?: string) => handleMove(from, to, promo)"
    @new-game="handleNewGame"
  />
</template>
