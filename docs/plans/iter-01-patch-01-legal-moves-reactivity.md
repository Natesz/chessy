# Chess App – 01-patch: Turnváltás és Stockfish eval javítás

---

## Érintett fájlok

- `app/composables/useChessGame.ts`
- `app/pages/chess.vue`
- `app/components/chess/ChessBoard.vue`

---

## Bug 1 (kritikus): `legalMoves` computed nem reaktív – a sötét figurák nem léphetnek

### Tünet
- Fehér első lépése után a sötét figurákkal nem lehet lépni
- A sötét figura dragolása után nem jelzi ki a célmezőket
- Ezután fehérrel is csak egyszer lehet lépni, majd teljesen leáll a játék

### Gyökérok

`app/pages/chess.vue`-ban:

```ts
const legalMoves = computed(() => getLegalMoves())
```

A `getLegalMoves()` a `useChessGame`-ből jön, ami a belső `chess` (Chess.js) objektumon hív `.moves()`. A `chess` példány **nem Vue-reaktív ref**, hanem plain JS objektum. Ezért a `computed` **nem vesz fel reaktív függőséget** – Vue egyszerre kiszámolja, cache-eli, és soha többé nem frissíti.

**Következmény:** `legalMoves.value` mindig a kezdőállás fehér lépéseit tartalmazza. Minden `cg.set({ dests: legalMoves.value })` hívás a feketének a fehér eredeti lépéseit adja át, amivel a fekete figuráinak nincs bejegyzése → nem lehet őket mozgatni.

### Javítás – `useChessGame.ts`

A `legalMoves` számítást tedd a composable-be, és tedd reaktívvá a `fen` ref-en keresztül:

```ts
const legalMoves = computed<Map<Key, Key[]>>(() => {
  fen.value // reaktív függőség: fen változásakor újraszámolja
  const dests = new Map<Key, Key[]>()
  chess.moves({ verbose: true }).forEach((move) => {
    if (!dests.has(move.from as Key)) dests.set(move.from as Key, [])
    dests.get(move.from as Key)!.push(move.to as Key)
  })
  return dests
})
```

Töröld a különálló `getLegalMoves()` függvényt, és a `return`-ben add vissza `legalMoves`-t.

### Javítás – `chess.vue`

Töröld ezt a sort:
```ts
const legalMoves = computed(() => getLegalMoves())
```

Helyette a composable-ból kapott `legalMoves`-t használd közvetlenül:
```ts
const { fen, gameState, legalMoves, makeMove, reset } = useChessGame()
```

---

## Bug 2 (közepes): chessground nem kapja vissza a figurát illegális lépésnél

### Tünet
Ha valamilyen okból a chess.js elutasít egy lépést (pl. `makeMove` false-t ad vissza), a figura chessground-ban már elmozgott, de chess.js nem alkalmazta a lépést → vizuális desynk.

### Gyökérok

`ChessBoard.vue`-ban a `movable.events.after` callback **mindig kisüti a `emit('move', ...)`-t**, de a szülő komponens csak akkor frissíti a `fen`-t, ha a lépés érvényes. Ha a lépés illegális, a chessground-on belül a figura az új pozíción marad.

### Javítás – `ChessBoard.vue`

A szülőnek vissza kell jelezni a sikertelen lépést. Legegyszerűbb megoldás: watch-old a `props.fen`-t, és ha nem változik a lépés után (illegális volt), állítsd vissza a chessground pozícióját:

```ts
// A watch bővítése – ha fen nem változott, snap back
watch(
  () => props.fen,
  (newFen) => {
    if (!cg) return
    cg.set({
      fen: newFen,
      turnColor: props.gameState.turn === 'w' ? 'white' : 'black',
      movable: {
        color: props.gameState.isGameOver ? undefined : 'both',
        dests: props.legalMoves,
      },
      check: props.gameState.isCheck,
    })
  },
)
```

Alternatíva: az `after` callback-ben emittelj egy visszajelző eventet, és ha a szülő false-t kap, hívj `cg.set({ fen: props.fen })`-t az eredeti pozíció visszaállítására.

---

## Bug 3 (következményes): Stockfish eval nem frissül lépések után

### Tünet
Az eval sáv megjelenik, de a lépések után nem változik az értékelés.

### Gyökérok
Nem önálló hiba – Bug 1 következménye. `chess.vue`-ban:

```ts
function handleMove(move: ChessMove) {
  const success = makeMove({ ...move, promotion: 'q' })
  if (success) {
    analyze(fen.value)  // csak sikeres lépés esetén hívódik
  }
}
```

Mivel Bug 1 miatt a lépések nagy része el sem jut a chess.js-ig (chessground a helytelen `dests` miatt megakadályozza), `makeMove` false-t ad vissza → `analyze()` soha nem hívódik meg.

### Javítás
Bug 1 javítása után automatikusan megoldódik. Nincs külön teendő a Stockfish kódban.

---

## Összefoglaló – javítandó helyek

| Fájl | Változtatás |
|------|-------------|
| `useChessGame.ts` | `getLegalMoves()` → reaktív `computed` (fen-függő), exportáld `legalMoves`-ként |
| `chess.vue` | Töröld a helyi `legalMoves` computed-ot, destrukturálj `legalMoves`-t a composable-ből |
| `ChessBoard.vue` | Snap-back logika illegális lépés esetén (opcionális, de ajánlott) |

---

## Elfogadási kritériumok (patch után)

- [ ] Fehér lépése után sötét figurák dragolhatók, és kijelzi a legális célmezőket
- [ ] A turnváltás helyesen működik: fehér → fekete → fehér → ...
- [ ] Illegális lépésnél a figura visszaugrik az eredeti mezőre
- [ ] Minden lépés után a Stockfish eval frissül (szám + sáv)
