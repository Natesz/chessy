# CLAUDE.md – Chessy projekt fejlesztési irányelvek

Ez a fájl minden munkamenetben automatikusan betöltődik. Tartsd be az itt leírtakat minden iterációban.

---

## Kötelező szabályok

- **TypeScript everywhere, strict mode** – minden fájl `.ts` vagy `.vue` (script lang="ts")
- **Tailwind CSS** az elsődleges stílus, minimális custom CSS
- **Nuxt 4**, `srcDir = app/` – minden forráskód az `app/` könyvtárban van
- **Nincsenek tesztek** – Vitest, Jest, Playwright, Cypress tilos
- **Desktop-first layout**
- Komponensek: `app/components/chess/` alatt

---

## Tech stack

| Csomag | Verzió | Szerepe |
|--------|--------|---------|
| Nuxt | 4 (compatibilityVersion: 4) | Framework |
| TypeScript | strict | Nyelv |
| Tailwind CSS | @nuxtjs/tailwindcss | Stílus |
| Pinia | – | State management |
| chess.js | ^1.3.0 | Szabálymotor (legális lépések, FEN, PGN) |
| chessground | ^9.2.1 | Interaktív tábla UI (Lichess-alapú) |
| stockfish | ^16.0.0 | WASM pozícióelemző, Web Worker-ben fut |
| Supabase | – | Backend (csak saját adatokhoz, ingyenes tier) |

---

## Fájlstruktúra

```
app/
  pages/
    chess.vue                  # definePageMeta({ ssr: false })
  components/
    chess/
      ChessBoard.vue           # chessground wrapper (ClientOnly-ban)
      StockfishEval.vue        # értékelési sáv + szám
      ChessLayout.vue          # elrendezés
  composables/
    useChessGame.ts            # chess.js state, lépések, játék logika
    useStockfish.ts            # Web Worker lifecycle, eval state
  types/
    chess.ts                   # ChessMove, EvalResult, GameState interfészek
```

---

## Kulcsdöntések (mindig érvényes)

**chess.js vs chessground szétválasztás:**
- `chess.js`: játék állapota, szabályok, FEN, lépésvalidáció – ez az egyetlen igazság-forrás
- `chessground`: csak megjelenítés + drag-and-drop UI, mindig `chess.js`-ből kapja a legális lépéseket (`movable.dests`)

**Stockfish:**
- `stockfish/src/stockfish-nnue-16-single.js` – single-threaded verzió, nem kell SharedArrayBuffer
- Web Worker-ként fut, nem blokkolja a UI thread-et
- `vite.optimizeDeps.exclude: ['stockfish']` a nuxt.config.ts-ben

**SSR:**
- A chess oldal SSR nélkül fut: `definePageMeta({ ssr: false })`
- `ChessBoard.vue` `<ClientOnly>` wrapperbe kerül

**chessground CSS** (mindhárom kell):
- `chessground/assets/chessground.base.css`
- `chessground/assets/chessground.brown.css`
- `chessground/assets/chessground.cburnett.css`

## Amit sosem csinálunk (ebben a projektben)

- Lichess Open Database letöltése/tárolása (csak API hívások)
- Tesztek bármilyen formában
- SSR a chess oldalon
- A MEKKK projekttel való összekeverés (ez külön Supabase projekt)

---

## Kötelező dokumentáció minden iteráció és patch után

### `docs/backlog.md` frissítése (KÖTELEZŐ)
- Minden elkészült iteráció feature-jei kerüljenek be ✅ státusszal
- Minden patch: hiba leírása + megoldás egy sorban a patch táblázatba
- Tervezett iterációknál a státusz változzon `📋 Tervezett` → `✅ Kész`-re
- Fájl: `docs/backlog.md`

### `README.md` frissítése (KÖTELEZŐ)
- Rövid, **nem technikai** összefoglaló a változásokról
- Célközönség: nem fejlesztők (üzleti oldal, menedzsment)
- Kerüld a technikai részleteket (nincs chess.js, Stockfish, WASM stb.)
- Maximum 3-5 mondat iterációnként, 1-2 mondat patch-enként
- Fájl: `README.md` (projekt gyökér)
