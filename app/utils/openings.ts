import { Chess } from 'chess.js'

export interface OpeningPreset {
  id: string
  name: string
  moves: string // SAN lépéssor, szóközzel elválasztva
}

export const OPENING_PRESETS: OpeningPreset[] = [
  { id: 'any', name: 'Bármilyen megnyitás', moves: '' },
  { id: 'caro-kann', name: 'Caro-Kann', moves: 'e4 c6' },
  { id: 'caro-kann-advance', name: 'Caro-Kann: előretolt változat', moves: 'e4 c6 d4 d5 e5' },
  { id: 'caro-kann-classical', name: 'Caro-Kann: klasszikus', moves: 'e4 c6 d4 d5 Nc3 dxe4 Nxe4 Bf5' },
  { id: 'jobava-london', name: 'Jobava London', moves: 'd4 d5 Nc3 Nf6 Bf4' },
  { id: 'london', name: 'London-rendszer', moves: 'd4 d5 Bf4' },
  { id: 'london-nf6', name: 'London-rendszer (…Hf6)', moves: 'd4 Nf6 Nf3 d5 Bf4' },
  { id: 'sicilian', name: 'Szicíliai védelem', moves: 'e4 c5' },
  { id: 'najdorf', name: 'Szicíliai: Najdorf', moves: 'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6' },
  { id: 'french', name: 'Francia védelem', moves: 'e4 e6' },
  { id: 'ruy-lopez', name: 'Spanyol megnyitás', moves: 'e4 e5 Nf3 Nc6 Bb5' },
  { id: 'italian', name: 'Olasz játék', moves: 'e4 e5 Nf3 Nc6 Bc4' },
  { id: 'scandinavian', name: 'Skandináv védelem', moves: 'e4 d5' },
  { id: 'pirc', name: 'Pirc-védelem', moves: 'e4 d6 d4 Nf6 Nc3 g6' },
  { id: 'qgd', name: 'Elhárított vezércsel', moves: 'd4 d5 c4 e6' },
  { id: 'qga', name: 'Elfogadott vezércsel', moves: 'd4 d5 c4 dxc4' },
  { id: 'slav', name: 'Szláv védelem', moves: 'd4 d5 c4 c6' },
  { id: 'kid', name: 'Királyindiai védelem', moves: 'd4 Nf6 c4 g6 Nc3 Bg7 e4 d6' },
  { id: 'nimzo', name: 'Nimzoindiai védelem', moves: 'd4 Nf6 c4 e6 Nc3 Bb4' },
  { id: 'english', name: 'Angol megnyitás', moves: 'c4' },
]

export interface ResolvedOpening {
  name: string
  uci: string[]
  fen: string
}

export const MAX_CUSTOM_MOVES = 10 // egyedi lépéssor: max. ennyi lépéspár

// Magyar figurajelölés → angol SAN (K király, V vezér, B bástya, F futó, H huszár)
const HU_TO_EN: Record<string, string> = { K: 'K', V: 'Q', B: 'R', F: 'B', H: 'N' }

/**
 * Magyar jelölésű lépés → angol SAN. Pl. "Hc3" → "Nc3", "Bxe1" → "Rxe1",
 * "0-0" → "O-O", "e8=V" / "e8V" → "e8=Q". A kisbetűs (gyalog/oszlop) részek változatlanok.
 */
export function hungarianToSan(token: string): string {
  let t = token.replace(/[!?]+$/, '')
  if (/^[0O]-[0O](-[0O])?[+#]?$/.test(t)) return t.replace(/0/g, 'O')
  // Gyalog-átváltozás: e8V, e8=V, dxe8=H+ …
  const promo = t.match(/^([a-h](?:x[a-h])?[18])=?([VBFH])([+#]?)$/)
  if (promo) return `${promo[1]}=${HU_TO_EN[promo[2]!]}${promo[3]}`
  return t.replace(/^([KVBFH])/, (_, p: string) => HU_TO_EN[p]!)
}

/**
 * SAN lépéssor (move number-ekkel vagy anélkül, szóközzel vagy vesszővel) → UCI lista.
 * notation = 'hu': magyar figurajelölés (egyedi lépéssor); 'en': angol (presetek).
 * Hibás lépésnél kivételt dob a hibás lépés nevével.
 */
export function parseOpeningMoves(text: string, notation: 'en' | 'hu' = 'en'): { uci: string[], fen: string } {
  const tokens = text
    .replace(/\{[^}]*\}/g, ' ')
    .split(/[\s,;]+/)
    .map(t => t.replace(/^\d+\.+/, '').trim())
    .filter(t => t && !/^(1-0|0-1|1\/2-1\/2|\*)$/.test(t))
  if (notation === 'hu' && tokens.length > MAX_CUSTOM_MOVES * 2) {
    throw new Error(`Legfeljebb ${MAX_CUSTOM_MOVES} lépés adható meg.`)
  }
  const chess = new Chess()
  const uci: string[] = []
  for (const token of tokens) {
    const san = notation === 'hu' ? hungarianToSan(token) : token
    let move
    try {
      move = chess.move(san)
    }
    catch {
      move = null
    }
    if (!move) throw new Error(`Érvénytelen lépés: ${token}`)
    uci.push(move.from + move.to + (move.promotion ?? ''))
  }
  return { uci, fen: chess.fen() }
}
