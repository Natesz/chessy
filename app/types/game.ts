export type RoomStatus = 'waiting' | 'active' | 'finished'
export type PlayerColor = 'white' | 'black'

export interface GameRoom {
  game_id: string
  fen: string
  pgn: string
  white_token: string
  black_token: string
  status: RoomStatus
  result: string | null
  created_at: string
}

export interface PlayerToken {
  gameId: string
  token: string
  color: PlayerColor
}
