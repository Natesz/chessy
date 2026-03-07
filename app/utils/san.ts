const PIECE_UNICODE: Record<string, string> = {
  K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘',
}

export function formatSan(san: string): string {
  if (!san) return san
  const first = san[0]
  return first in PIECE_UNICODE ? PIECE_UNICODE[first] + san.slice(1) : san
}
