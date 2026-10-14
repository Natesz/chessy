import type { AnalysisLine, EvalResult } from '~/types/chess'

/** classic = ki áll jobban; puzzle = egyetlen nyerő lépés; onlymove = ≈0, de csak egy lépés tartja */
export type TrainingMode = 'classic' | 'puzzle' | 'onlymove' | 'mixed'
export type PositionKind = Exclude<TrainingMode, 'mixed'>
export type TrainingAnswer = 'white' | 'equal' | 'black'

export interface TrainingSettings {
  openingId: string // preset id vagy 'custom'
  customMoves: string // egyedi lépéssor (SAN, pl. "1. d4 d5 2. Nc3")
  mode: TrainingMode
  minAdvantage: number // gyalogegységben
  maxAdvantage: number // MAX_ADVANTAGE_CAP = nincs felső korlát
  gap: number // puzzle/onlymove: legjobb és második lépés közti minimális különbség
  equalThreshold: number // |eval| ez alatt = egyenlő
  minPly: number
  maxPly: number
  quietOnly: boolean // nincs sakk, és az előző lépés nem ütés
}

export interface TrainingPlayer {
  name: string
  rating: number | null
}

export interface TrainingPosition {
  id: string
  fen: string
  turn: 'w' | 'b'
  ply: number // ennyi fél-lépés után áll elő a pozíció a játszmában
  lastMoveSan: string | null
  gameId: string
  white: TrainingPlayer
  black: TrainingPlayer
  gameOpening: string | null
  openingLabel: string // beállított megnyitás neve (statisztikához)
  kind: PositionKind
  evalWhite: EvalResult // legjobb lépés értékelése világos szemszögéből
  lines: AnalysisLine[]
  correct: TrainingAnswer
}

export interface ScoreBucket {
  total: number
  correct: number
}

export interface TrainingStats {
  total: number
  correct: number
  streak: number
  bestStreak: number
  byKind: Record<string, ScoreBucket>
  byOpening: Record<string, ScoreBucket>
}

export type TrainingStatus = 'idle' | 'searching' | 'ready' | 'answered' | 'error'
