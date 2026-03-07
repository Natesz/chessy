# Chess App – 01-patch-05: Legjobb lépés nyíl + elemzési vonalak (MultiPV)

---

## Cél

- A Stockfish által javasolt legjobb lépés nyílként jelenik meg a táblán (chessground `drawable`)
- A tábla jobb oldalán megjelenik 3 elemzési sor (line), mindegyikben legfeljebb 5 lépés SAN formátumban
- Az első (legjobb) sor kiemelve jelenik meg

---

## Stockfish MultiPV – hogyan működik

A `setoption name MultiPV value 3` parancs után Stockfish minden depth-nél 3 sort ad vissza:

```
info depth 15 multipv 1 score cp 28 ... pv e2e4 e7e5 g1f3 g8f6 f1b5
info depth 15 multipv 2 score cp 18 ... pv d2d4 d7d5 c2c4 e7e6 g1f3
info depth 15 multipv 3 score cp 12 ... pv g1f3 d7d5 d2d4 g8f6 c2c4
```

- `multipv 1` = legjobb vonal (ez megy a nyílra)
- `pv` mező: UCI formátumú lépések szóközzel elválasztva (`e2e4`, `e7e5`, ...)
- Az utolsó (legnagyobb depth-en kapott) értékek a véglegesek

---

## UCI → SAN konverzió

A `pv` mezőben szereplő lépések UCI formátumban vannak (pl. `e2e4`), SAN formátum (pl. `e4`, `Nf3`, `Bb5+`) olvashatóbb. A konverzióhoz chess.js kell – a FEN-ből kiindulva minden lépést sorban kell alkalmazni:

```ts
import { Chess } from 'chess.js'

function uciMovesToSan(fen: string, uciMoves: string[]): string[] {
  const chess = new Chess(fen)
  const san: string[] = []
  for (const uci of uciMoves) {
    const from = uci.slice(0, 2)
    const to = uci.slice(2, 4)
    const promotion = uci.length === 5 ? uci[4] : undefined
    const result = chess.move({ from, to, promotion })
    if (!result) break
    san.push(result.san)
  }
  return san
}
```

---

## Új típus – `types/chess.ts`

```ts
export interface AnalysisLine {
  multipv: number        // 1, 2, 3
  score: EvalResult      // értékelés (fehér szemszögből, már normalizálva)
  moves: string[]        // SAN formátumú lépések (max 5)
  bestMove: string | null // UCI formátum, pl. 'e2e4' – nyílhoz kell
}
```

---

## Módosítások

### `useStockfish.ts`

**Új state és opció:**
```ts
import { Chess } from 'chess.js'

const analysisLines = ref<AnalysisLine[]>([])
let currentFen = ''

function uciMovesToSan(fen: string, uciMoves: string[]): string[] { ... }
```

**`sendAnalyze` módosítása** – MultiPV beállítás és FEN mentése:
```ts
function sendAnalyze(fen: string) {
  analyzingColor = fen.split(' ')[1] as 'w' | 'b'
  currentFen = fen
  isAnalyzing.value = true
  worker!.postMessage('stop')
  worker!.postMessage('setoption name MultiPV value 3')
  worker!.postMessage(`position fen ${fen}`)
  worker!.postMessage('go depth 15')
}
```

**`onmessage` módosítása** – PV és multipv index parsolása:
```ts
if (line.startsWith('info') && line.includes('multipv')) {
  const multipvMatch = line.match(/multipv (\d+)/)
  const pvMatch = line.match(/ pv (.+)$/)
  // ... score cp / score mate parsolás (meglévő logika)

  if (multipvMatch && pvMatch) {
    const multipvIndex = parseInt(multipvMatch[1])
    const uciMoves = pvMatch[1].trim().split(' ').slice(0, 5)
    const sanMoves = uciMovesToSan(currentFen, uciMoves)
    const bestMove = uciMoves[0] ?? null

    const updatedLine: AnalysisLine = {
      multipv: multipvIndex,
      score: { type, value: parsedValue * colorMult, depth },
      moves: sanMoves,
      bestMove,
    }

    const lines = [...analysisLines.value]
    lines[multipvIndex - 1] = updatedLine
    analysisLines.value = lines
  }
}
```

**`analyze` reset** – új elemzés előtt töröld a régi vonalakat:
```ts
analysisLines.value = []
```

**Return-ből add hozzá:**
```ts
return { ..., analysisLines }
```

**`destroy`-ban reset:**
```ts
analysisLines.value = []
```

---

### `ChessBoard.vue`

**Új prop:**
```ts
const props = defineProps<{
  fen: string
  gameState: GameState
  legalMoves: Map<Key, Key[]>
  bestMove: string | null   // UCI formátum, pl. 'e2e4'
}>()
```

**`syncCg` bővítése** – nyíl rajzolása:
```ts
function syncCg() {
  if (!cg) return
  const shapes = props.bestMove && !props.gameState.isGameOver
    ? [{ orig: props.bestMove.slice(0, 2) as Key, dest: props.bestMove.slice(2, 4) as Key, brush: 'green' }]
    : []

  cg.set({
    fen: props.fen,
    turnColor: ...,
    movable: { ... },
    check: ...,
    drawable: { shapes },
  })
}
```

**Watch bővítése** – nyíl frissítése értékelés változásakor is:
```ts
watch(() => props.bestMove, () => syncCg())
```

---

### Új komponens: `ChessAnalysisLines.vue`

`app/components/chess/ChessAnalysisLines.vue`

Megjelenített adatok soronként:
- Értékelés szám (pl. `+0.3`, `-1.2`, `M4`)
- Lépések SAN-ban (pl. `e4 e5 Nf3 Nc6 Bb5`)
- Az első sor (multipv 1) nagyobb/kiemelve

```vue
<script setup lang="ts">
import type { AnalysisLine } from '~/types/chess'
defineProps<{ lines: AnalysisLine[], isAnalyzing: boolean }>()
</script>

<template>
  <div class="flex flex-col gap-1 text-xs font-mono">
    <div v-for="line in lines" :key="line.multipv"
         :class="line.multipv === 1 ? 'text-white font-bold' : 'text-gray-400'">
      <span class="text-amber-400 mr-2">{{ formatScore(line.score) }}</span>
      <span>{{ line.moves.join(' ') }}</span>
    </div>
    <div v-if="isAnalyzing && !lines.length" class="text-gray-500 animate-pulse">
      Elemzés...
    </div>
  </div>
</template>
```

---

### `ChessLayout.vue` – layout bővítése

A tábla jobb oldalán egy új oszlop:

```
[ eval bar ] [ tábla + player labels + gomb ] [ elemzési sorok ]
```

```vue
<template>
  <div class="flex items-start gap-3 w-full" style="max-width: min(96vw, 760px)">
    <!-- Eval bar -->
    ...

    <!-- Board column (változatlan) -->
    ...

    <!-- Analysis lines (jobb oldal) -->
    <ClientOnly>
      <div class="flex flex-col gap-2 pt-6" style="min-width: 160px; max-width: 200px">
        <ChessAnalysisLines :lines="analysisLines" :is-analyzing="isAnalyzing" />
      </div>
    </ClientOnly>
  </div>
</template>
```

**Új prop-ok:**
```ts
defineProps<{
  ...
  analysisLines: AnalysisLine[]
  bestMove: string | null
}>()
```

---

### `chess.vue` – új értékek átadása

```ts
const { fen, gameState, legalMoves, makeMove, reset } = useChessGame()
const { evalResult, isAnalyzing, analysisLines, init, analyze, destroy } = useStockfish()

const bestMove = computed(() => analysisLines.value[0]?.bestMove ?? null)
```

```vue
<ChessLayout
  ...
  :analysis-lines="analysisLines"
  :best-move="bestMove"
/>
```

---

## Fájlstruktúra változások

| Fájl | Változás |
|------|----------|
| `app/types/chess.ts` | `AnalysisLine` interfész hozzáadása |
| `app/composables/useStockfish.ts` | MultiPV 3, PV parsolás, `analysisLines` ref, `uciMovesToSan` helper |
| `app/components/chess/ChessBoard.vue` | `bestMove` prop, `drawable.shapes` nyíl |
| `app/components/chess/ChessAnalysisLines.vue` | **Új fájl** – 3 sor megjelenítése |
| `app/components/chess/ChessLayout.vue` | Jobb oldali panel, új prop-ok |
| `app/pages/chess.vue` | `analysisLines`, `bestMove` computed átadása |

---

## Elfogadási kritériumok

- [ ] Legjobb lépés zöld nyílként jelenik meg a táblán
- [ ] Nyíl eltűnik, ha a játék véget ért
- [ ] 3 elemzési sor látható a tábla jobb oldalán
- [ ] Minden sorban legfeljebb 5 SAN lépés jelenik meg
- [ ] Az első (legjobb) sor vizuálisan kiemelve
- [ ] Lépés után a vonalak frissülnek
- [ ] `Új játék` után a vonalak törlődnek
