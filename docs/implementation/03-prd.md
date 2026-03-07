# 03-prd: FEN/PGN Betöltő + Sakkfigura Ikonok

## Összefoglalás

Három fejlesztés egy iterációban:
1. FEN és PGN betöltő panel (jobb oldalt, új oszlop)
2. Sakkfigura ikonok az elemzési sorokban és a lépés historiban
3. Bug fix: cache törlés "Új elemzés" gombra *(már implementálva patch-ként)*

---

## 1. FEN betöltő

### Funkció
A felhasználó beilleszthet egy FEN stringet (pl. `r2qk1nr/ppp2pp1/2nbp1b1/3p2Pp/3P1B1P/2N1PP2/PPP1N2R/R2QKB2 b Qkq - 4 10`), és az alkalmazás azt az állást tölti be kezdőpozícióként.

### Technikai megvalósítás

**`useChessHistory.ts`** — `reset()` elfogad opcionális `startFen` paramétert:
```ts
function reset(startFen?: string) {
  const fen = startFen ?? new Chess().fen()
  // validáció: new Chess(fen) – ha invalid, dobjon hibát
  root.fen = fen
  root.children = []
  treeVersion.value++
  currentNode.value = root
}
```

**`chess.vue`** — `handleReset(startFen?: string)` átadja a FEN-t.

**Validáció:** `chess.js` `new Chess(fen)` – ha dob hibát, hibaüzenet a panelen.

---

## 2. PGN betöltő

### Funkció
A felhasználó beilleszthet egy PGN stringet — variánsokkal együtt — és az alkalmazás felépíti a teljes lépésfát.

**Példa:**
```
1. d4 d5 2. Nc3 Nf6 3. Bf4 (3. h4 a6) 3... Bf5 4. e3 e6
```
A `(3. h4 a6)` mellékág a fa megfelelő csomópontján jelenik meg.

### PGN parser algoritmus

Rekurzív descent parser a `useChessHistory` API-ján keresztül:

```
parsePgn(pgn: string):
  1. reset() – üres fa, kezdőállás (vagy FEN ha meg volt adva)
  2. tokenize(pgn) → token lista:
       - lépésszám token: "1.", "2...", stb. → kihagyni
       - SAN lépés token: "d4", "Nc3", "O-O", stb.
       - variáns nyitó: "("
       - variáns záró: ")"
       - eredmény: "1-0", "0-1", "1/2-1/2", "*" → stop
  3. parseTokens(tokens, pos) → rekurzív:
       - SAN token: chess.js-sel SAN→UCI konverzió az aktuális FEN-ből,
         majd addMove(from, to, promotion)
       - "(": savedNode = currentNode
               navigateBack()         ← visszalépés a variáns elágazási pontjára
               pos = parseTokens(tokens, pos+1)
               navigateTo(savedNode)  ← visszatérés a főágba
       - ")": return pos+1
       - egyéb: skip
```

**SAN→UCI konverzió:**
```ts
const chess = new Chess(currentFen.value)
const m = chess.move(sanToken)  // chess.js elfogad SAN-t
addMove(m.from, m.to, m.promotion)
```

**Hibakezelés:** érvénytelen SAN lépés esetén hibaüzenet a panelen, a betöltés megáll az utolsó érvényes lépésnél.

**Korlátok:**
- Megjegyzések (`{ ... }`) kihagyva
- NAG jelölések (`$1`, `!`, `?`) kihagyva
- Fejléc tagek (`[Event "..."]`) kihagyva
- Mélyen egymásba ágyazott variánsok (3+ szint) támogatva, de nem tesztelve

---

## 3. FEN/PGN panel UI

### Elhelyezés
A meglévő elemző/history panel **jobbára**, azzal azonos magasságban. Negyedik oszlop a layoutban.

### Magasság-arányok (belső flex-col):
- FEN section: `flex: 1` (~25%)
- Elválasztó gap: `gap-2`
- PGN section: `flex: 3` (~70%)
- Gombok: `shrink-0`

### Szélességek
A fő container `max-width` növelése: `min(96vw, 900px)` → `min(96vw, 1150px)`

Az FEN/PGN panel fix szélessége: `w-52` (208px) vagy `w-56` (224px) — iteráció közben döntendő.

### Komponens: `ChessFenPgnLoader.vue`

```
Props:
  - (nincs, eseményeket emittel)

Emits:
  - loadFen(fen: string)
  - loadPgn(pgn: string)

Belső state:
  - fenInput: string  (textarea/input)
  - pgnInput: string  (textarea)
  - fenError: string | null
  - pgnError: string | null

UI elemek:
  - "FEN" felirat + input mező (single line, font-mono)
  - "Betöltés" gomb (FEN)
  - "PGN" felirat + textarea (multiline, font-mono, resize-none)
  - "Betöltés" gomb (PGN)
  - Hibaüzenet megjelenítő (text-red-400 text-xs)
```

### ChessLayout.vue változtatások
- Új prop: `onLoadFen`, `onLoadPgn` emit kezelők
- Negyedik oszlop: `<ChessFenPgnLoader>` a right panel után
- `max-width` növelése

### chess.vue változtatások
- `handleLoadFen(fen: string)`: validál, majd `reset(fen)` + `analyze(currentFen.value)`
- `handleLoadPgn(pgn: string)`: `parsePgn(pgn)` hívás + `analyze(currentFen.value)`
- PGN parser logika: külön composable `usePgnParser.ts` **vagy** `chess.vue`-ban inline

---

## 4. Sakkfigura ikonok

### Elv
A SAN notation piece prefixeket (N, B, R, Q, K) Unicode sakkfigura szimbólumokra cseréljük:

| SAN prefix | Unicode | Figura |
|---|---|---|
| K | ♔ | Király |
| Q | ♕ | Vezér |
| R | ♖ | Bástya |
| B | ♗ | Futó |
| N | ♘ | Huszár |

Gyalog lépéseknek (pl. `e4`, `exd5`) nincs prefix → nincs változtatás.
Sáncolás (`O-O`, `O-O-O`) → nincs változtatás.

### Implementáció

**`app/utils/san.ts`** (új fájl):
```ts
const PIECE_UNICODE: Record<string, string> = {
  K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘',
}

export function formatSan(san: string): string {
  if (!san) return san
  const first = san[0]
  return first in PIECE_UNICODE ? PIECE_UNICODE[first] + san.slice(1) : san
}
```

### Alkalmazási helyek
- `ChessAnalysisLines.vue`: `lines[i-1].moves` tömb minden elemén
- `ChessMoveHistory.vue`: `pair.white.move?.san` és `pair.black.move?.san`
- `ChessMoveVariation.vue`: `vp.white.move?.san` és `vp.black.move?.san`

---

## Érintett fájlok

| Fájl | Változtatás típusa |
|---|---|
| `app/components/chess/ChessFenPgnLoader.vue` | **ÚJ** |
| `app/utils/san.ts` | **ÚJ** |
| `app/composables/useChessHistory.ts` | reset(startFen?) |
| `app/components/chess/ChessLayout.vue` | negyedik oszlop, max-width |
| `app/pages/chess.vue` | handleLoadFen, handleLoadPgn, handleReset frissítve |
| `app/components/chess/ChessAnalysisLines.vue` | formatSan alkalmazás |
| `app/components/chess/ChessMoveHistory.vue` | formatSan alkalmazás |
| `app/components/chess/ChessMoveVariation.vue` | formatSan alkalmazás |

---

## Nyitott kérdések

- PGN parser helye: `chess.vue` inline vs `app/composables/usePgnParser.ts` (javasolt: külön composable)
- FEN/PGN panel pontos szélessége: iteráció közben döntsük el vizuálisan
- PGN betöltésnél a Stockfish cache törlődjön-e? (javasolt: igen)
