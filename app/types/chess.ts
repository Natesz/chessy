export interface ChessMove {
  from: string
  to: string
  promotion?: string
}

export interface EvalResult {
  type: 'cp' | 'mate'
  value: number
  depth: number
}

export interface AnalysisLine {
  multipv: number
  score: EvalResult
  moves: string[]
  bestMove: string | null
}

export interface GameState {
  fen: string
  turn: 'w' | 'b'
  isCheck: boolean
  isCheckmate: boolean
  isDraw: boolean
  isGameOver: boolean
}

export interface MoveNode {
  id: string
  fen: string
  move: {
    from: string
    to: string
    san: string
    promotion?: string
  } | null
  parent: MoveNode | null
  children: MoveNode[]
  moveNumber: number
  color: 'w' | 'b'
}
