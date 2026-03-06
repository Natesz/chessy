# Chess App – Iteration 01: Interaktív sakktábla + Stockfish értékelés

---

## 0) Kötelező irányelvek

- TypeScript everywhere, strict mode
- Tailwind CSS elsődleges stílus, minimális custom CSS
- Nuxt 4, srcDir = `app/`
- Nincsenek tesztek (Vitest/Jest/Playwright/Cypress tilos)
- Mobile-first layout
- Komponensek: `app/components/chess/` alatt

---

## 1) Cél

Egy interaktív sakktábla felület, ahol:
- A figurák drag-and-drop vagy kattintás alapján mozgathatók
- Csak szabályos lépések engedélyezettek (`chess.js` validáció)
- A Stockfish WASM motor értékeli az aktuális pozíciót
- Az értékelés numerikusan és vizuális sávon jelenik meg

---

## 2) Technikai stack (chess-specifikus)

| Library | Verzió / forrás | Szerepe |
|---------|----------------|---------|
| `chessground` | npm | Interaktív sakktábla UI (Lichess-alapú) |
| `chess.js` | npm | Szabálymotor: legális lépések, sakk/matt detekció |
| `stockfish` | npm (WASM) | Pozícióértékelés, Web Worker-ben fut |

**Fontos:** a `chessground` vanilla JS library, Nuxt-ban egy wrapper composable-ön keresztül használandó.

---

## 3) Feature leírás

### 3.1 Sakktábla (`ChessBoard.vue`)

- Tábla megjelenítés `chessground`-dal
- Fehér alul, fekete felül (default orientáció)
- Figura drag-and-drop: egérrel és érintéssel
- Lépés kattintással is: első kattintás = figura kijelölése (kiemelve), második kattintás = célmező
- `chess.js` határozza meg a legális lépéseket – `chessground`-nak csak ezek adódnak át `movable.dests` -ként
- Illegális lépés esetén a figura visszaugrik az eredeti helyére
- Sakk esetén a királyos mező vizuálisan jelzett (piros kiemelés)
- Matt/döntetlen felismerés: overlay üzenet ("Sakk-matt", "Döntetlen")

### 3.2 Stockfish értékelés (`StockfishEval.vue`)

- Stockfish WASM Web Worker-ként fut (nem blokkolja a UI-t)
- Minden lépés után automatikusan elindul az analízis (depth: 15)
- Megjelenített adatok:
  - Numerikus értékelés: pl. `+1.3` (fehér előny) vagy `-0.7` (fekete előny)
  - Vizuális értékelési sáv: vertikális, fehér/fekete arányban osztott
  - Matt jelzés: `M4` formátumban (4 lépésen belüli matt)
- Analízis alatt: loading indikátor a sávon

### 3.3 Oldal layout (`pages/index.vue` vagy `pages/chess.vue`)

- Tábla középen, tele képernyő magasság mobilon
- Értékelési sáv a tábla bal oldalán (vertikális, keskeny)
- Felső sáv: játékos neve (placeholder: "Fekete"), alsó sáv: "Fehér"
- Lépett figurák / ütött figurák megjelenítése a táblán kívül (opcionális, ha fér)
- "Új játék" gomb: visszaállítja a kezdőpozíciót

---

## 4) Fájlstruktúra

```
app/
  pages/
    chess.vue                      # route: /chess (vagy index.vue ha egyoldalas)
  components/
    chess/
      ChessBoard.vue               # chessground wrapper + chess.js integráció
      StockfishEval.vue            # értékelési sáv + szám
      ChessLayout.vue              # tábla + sáv elrendezése
  composables/
    useChessGame.ts                # chess.js state, lépések, játék logika
    useStockfish.ts                # Web Worker lifecycle, eval state
  types/
    chess.ts                       # ChessMove, EvalResult, GameState interfészek
```

---

## 5) Technikai részletek

### chessground inicializáció (useChessGame.ts-ben)

```ts
import { Chessground } from 'chessground'
import { Chess } from 'chess.js'

const chess = new Chess()

// legális lépések átadása chessground-nak
function getLegalMoves() {
  const dests = new Map()
  chess.moves({ verbose: true }).forEach(move => {
    if (!dests.has(move.from)) dests.set(move.from, [])
    dests.get(move.from).push(move.to)
  })
  return dests
}
```

### Stockfish Web Worker (useStockfish.ts-ben)

```ts
// stockfish npm package-ből
const worker = new Worker(new URL('stockfish/src/stockfish-nnue-16.js', import.meta.url))
worker.postMessage('uci')
worker.postMessage(`position fen ${chess.fen()}`)
worker.postMessage('go depth 15')
// onmessage-ben parse-olni a "score cp" és "score mate" értékeket
```

### Értékelés megjelenítése

- `+0.0` = egyenlő
- `+3.5` = fehér nyeri kb. 3.5 gyalog értékkel
- `-1.2` = fekete előnye
- `M3` = fehér 3 lépésen belül mattot ad
- `-M5` = fekete 5 lépésen belül mattot ad

---

## 6) Elfogadási kritériumok

- [ ] A sakktábla betölt és a figurák a kezdőállásban vannak
- [ ] Drag-and-drop és kattintásos mozgatás egyaránt működik
- [ ] Illegális lépés esetén a figura visszaugrik
- [ ] Sakk esetén a király mezője vizuálisan jelzett
- [ ] Matt/döntetlen esetén overlay jelenik meg
- [ ] Minden lépés után a Stockfish értékelés frissül
- [ ] Numerikus értékelés és vizuális sáv helyes értéket mutat
- [ ] "Új játék" visszaállítja a pozíciót és az értékelést
- [ ] Mobilon és desktopom is használható

---

## 7) Definition of Done

- Fájlstruktúra megfelel a fentinek
- `useChessGame.ts` és `useStockfish.ts` composable-ök szétválasztva
- Nincsenek TypeScript hibák
- chessground és chess.js szinkronban van (ugyanaz a pozíció)
- Stockfish Web Worker nem blokkolja a UI thread-et
- README.md frissítve a chess feature-rel

---

## 8) Amit NEM tartalmaz ez az iteráció

- PGN import/export
- Legjobb lépés kiemelése a táblán
- Játékos vs AI mód (Stockfish ellen játszani)
- Versenyszervezés
- Lichess API integráció
- Felhasználói autentikáció
