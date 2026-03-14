import type { PlayerColor, RoomStatus } from '~/types/game'

function generateToken(): string {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
}

export function useGameRoom() {
  const config = useRuntimeConfig()

  const gameId = ref<string | null>(null)
  const playerToken = ref<string | null>(null)
  const playerColor = ref<PlayerColor>('white')
  const opponentConnected = ref(false)
  const roomStatus = ref<RoomStatus>('waiting')
  const error = ref<string | null>(null)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let supabase: any = null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let channel: any = null

  async function getSupabase() {
    if (supabase) return supabase
    const { createClient } = await import('@supabase/supabase-js')
    supabase = createClient(
      config.public.supabaseUrl as string,
      config.public.supabaseAnonKey as string,
    )
    return supabase
  }

  async function createRoom(): Promise<{ gameId: string, token: string }> {
    error.value = null
    const client = await getSupabase()
    const token = generateToken()

    const { data, error: dbErr } = await client
      .from('games')
      .insert({ white_token: token })
      .select('game_id')
      .single()

    if (dbErr || !data) {
      error.value = dbErr?.message ?? 'Nem sikerült szobát létrehozni'
      throw new Error(error.value ?? undefined)
    }

    gameId.value = data.game_id
    playerToken.value = token
    playerColor.value = 'white'
    return { gameId: data.game_id, token }
  }

  async function joinRoom(gId: string, token: string): Promise<{ fen: string, pgn: string }> {
    error.value = null
    const client = await getSupabase()

    const { data, error: dbErr } = await client
      .from('games')
      .select('*')
      .eq('game_id', gId)
      .single()

    if (dbErr || !data) {
      error.value = 'Szoba nem található'
      throw new Error(error.value ?? undefined)
    }

    gameId.value = gId
    playerToken.value = token

    if (data.white_token === token) {
      playerColor.value = 'white'
    }
    else if (data.black_token === token) {
      playerColor.value = 'black'
    }
    else {
      // New black player joining
      playerColor.value = 'black'
      await client
        .from('games')
        .update({ black_token: token, status: 'active' })
        .eq('game_id', gId)
    }

    roomStatus.value = data.status
    return { fen: data.fen, pgn: data.pgn }
  }

  async function sendMove(move: string, newFen: string, newPgn: string): Promise<void> {
    if (!gameId.value || !channel) return
    const client = await getSupabase()

    await client
      .from('games')
      .update({ fen: newFen, pgn: newPgn })
      .eq('game_id', gameId.value)

    channel.send({
      type: 'broadcast',
      event: 'move',
      payload: { move, fen: newFen, pgn: newPgn },
    })
  }

  let moveCallback: ((move: string, fen: string, pgn: string) => void) | null = null
  let statusCallback: ((status: RoomStatus) => void) | null = null

  function onMove(cb: (move: string, fen: string, pgn: string) => void) {
    moveCallback = cb
  }

  function onStatus(cb: (status: RoomStatus) => void) {
    statusCallback = cb
  }

  async function subscribe(gId: string) {
    const client = await getSupabase()

    channel = client.channel(`game:${gId}`)

    channel
      .on('broadcast', { event: 'move' }, ({ payload }: { payload: { move: string, fen: string, pgn: string } }) => {
        moveCallback?.(payload.move, payload.fen, payload.pgn)
      })
      .on('presence', { event: 'join' }, () => {
        opponentConnected.value = true
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'games',
        filter: `game_id=eq.${gId}`,
      }, (payload: { new: { status: RoomStatus } }) => {
        roomStatus.value = payload.new.status
        statusCallback?.(payload.new.status)
      })
      .subscribe()
  }

  function unsubscribe() {
    channel?.unsubscribe()
    channel = null
  }

  function destroy() {
    unsubscribe()
    supabase = null
  }

  return {
    gameId,
    playerToken,
    playerColor,
    opponentConnected,
    roomStatus,
    error,
    createRoom,
    joinRoom,
    sendMove,
    onMove,
    onStatus,
    subscribe,
    unsubscribe,
    destroy,
  }
}
