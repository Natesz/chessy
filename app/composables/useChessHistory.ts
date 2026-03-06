import { Chess } from 'chess.js'
import type { Key } from 'chessground/types'
import type { GameState, MoveNode } from '~/types/chess'

export function useChessHistory() {
  let idCounter = 0

  function makeNode(
    fen: string,
    move: MoveNode['move'],
    parent: MoveNode | null,
    moveNumber: number,
    color: 'w' | 'b',
  ): MoveNode {
    return { id: String(idCounter++), fen, move, parent, children: [], moveNumber, color }
  }

  const root = makeNode(new Chess().fen(), null, null, 1, 'w')
  const currentNode = ref<MoveNode>(root)
  const treeVersion = ref(0)

  const currentFen = computed(() => currentNode.value.fen)

  const currentGameState = computed<GameState>(() => {
    const chess = new Chess(currentNode.value.fen)
    return {
      fen: chess.fen(),
      turn: chess.turn() as 'w' | 'b',
      isCheck: chess.isCheck(),
      isCheckmate: chess.isCheckmate(),
      isDraw: chess.isDraw(),
      isGameOver: chess.isGameOver(),
    }
  })

  const currentLegalMoves = computed<Map<Key, Key[]>>(() => {
    currentNode.value // reaktív függőség
    const chess = new Chess(currentNode.value.fen)
    const dests = new Map<Key, Key[]>()
    chess.moves({ verbose: true }).forEach((move) => {
      if (!dests.has(move.from as Key)) dests.set(move.from as Key, [])
      dests.get(move.from as Key)!.push(move.to as Key)
    })
    return dests
  })

  function addMove(from: string, to: string, promotion?: string): boolean {
    const chess = new Chess(currentNode.value.fen)
    let result
    try {
      result = chess.move({ from, to, promotion })
    }
    catch {
      return false
    }
    if (!result) return false

    // Ha már létezik ugyanez a lépés → navigálj hozzá
    const existing = currentNode.value.children.find(
      c => c.move?.from === from && c.move?.to === to && (c.move?.promotion ?? undefined) === (promotion ?? undefined),
    )
    if (existing) {
      currentNode.value = existing
      return true
    }

    const fenParts = currentNode.value.fen.split(' ')
    const moveNumber = parseInt(fenParts[5])
    const color = fenParts[1] as 'w' | 'b'

    const newNode = makeNode(
      chess.fen(),
      { from, to, san: result.san, promotion },
      currentNode.value,
      moveNumber,
      color,
    )
    currentNode.value.children.push(newNode)
    treeVersion.value++
    currentNode.value = newNode
    return true
  }

  function navigateBack() {
    if (currentNode.value.parent) currentNode.value = currentNode.value.parent
  }

  function navigateForward() {
    if (currentNode.value.children.length > 0) currentNode.value = currentNode.value.children[0]
  }

  function navigateToStart() {
    currentNode.value = root
  }

  function navigateToMainEnd() {
    let node = root
    while (node.children.length > 0) node = node.children[0]
    currentNode.value = node
  }

  function navigateTo(node: MoveNode) {
    currentNode.value = node
  }

  function reset() {
    root.children = []
    idCounter = 0
    treeVersion.value++
    currentNode.value = root
  }

  return {
    root,
    currentNode,
    treeVersion,
    currentFen,
    currentGameState,
    currentLegalMoves,
    addMove,
    navigateBack,
    navigateForward,
    navigateToStart,
    navigateToMainEnd,
    navigateTo,
    reset,
  }
}
