<!-- MEMORY.md: C:\Users\local_user\.claude\projects\C--Users-local-user-Desktop-AI-project-chessy\memory\MEMORY.md (max 200 sor!) -->
# CLAUDE.md – Chessy projekt fejlesztési irányelvek

Ez a fájl minden munkamenetben automatikusan betöltődik. Tartsd be az itt leírtakat minden iterációban.

---

## Kötelező szabályok

- **TypeScript everywhere, strict mode** – minden fájl `.ts` vagy `.vue` (script lang="ts")
- **Tailwind CSS** az elsődleges stílus, minimális custom CSS
- **Nuxt 4**, `srcDir = app/` – minden forráskód az `app/` könyvtárban van
- **Playwright e2e tesztek megengedve** (`tests/e2e/`) – Vitest, Jest, Cypress továbbra is tilos
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
| cubing | ^0.63.3 | Rubik-kocka 3D UI (twisty-player web component) |

---

## Fájlstruktúra

```
app/
  pages/
    index.vue                  # redirect → /analysis
    chess.vue                  # redirect → /analysis (backward compat)
    analysis.vue               # elemzés főoldal (ssr: false)
    play.vue                   # játék mód – AI vagy 1v1 (ssr: false)
    cube.vue                   # Rubik-kocka kirakó (ssr: false)
  layouts/
    default.vue                # top nav (AppNav) + slot wrapper
  components/
    AppNav.vue                 # ♟ iChessy branding + hamburger menü (mobilon drawer, desktopon inline linkek)
    cube/
      RubiksCube.vue           # 3D Rubik-kocka (cubing.js twisty-player, keverés, timer)
    chess/
      ChessBoard.vue           # chessground wrapper (ClientOnly-ban)
      ChessStockfishEval.vue   # értékelési sáv + szám
      ChessLayout.vue          # elrendezés (eval bar | tábla | history+elemzés | FEN/PGN)
      ChessMoveHistory.vue     # lépés history főág
      ChessMoveVariation.vue   # rekurzív mellékág megjelenítő
      ChessAnalysisLines.vue   # Stockfish 3 elemzési sor
      ChessFenPgnLoader.vue    # FEN + PGN betöltő panel (Iteráció 03)
      ChessGame.vue            # játék layout (tábla + kontroll panel)
      ChessGameControls.vue    # setup/playing/finished fázis UI
  composables/
    useChessHistory.ts         # fa struktúra alapú lépés state; reset(startFen?) shallowRef+triggerRef
    useStockfish.ts            # Web Worker lifecycle, eval state, position cache
    useStockfishPlayer.ts      # depth-limited AI move composable
    useGameRoom.ts             # Supabase Realtime 1v1 szoba
    usePgnParser.ts            # rekurzív descent PGN parser; tokenize + parseTokens + variation handling
  utils/
    san.ts                     # formatSan: SAN → Unicode figuraikonok (auto-imported)
    pgn.ts                     # generatePgn: MoveNode fa → PGN string (Lichess-kompatibilis)
  types/
    chess.ts                   # ChessMove, EvalResult, GameState, MoveNode, VarLine
    game.ts                    # GameRoom, PlayerToken, RoomStatus
```

---

## Kulcsdöntések (mindig érvényes)

**chess.js vs chessground szétválasztás:**
- `chess.js`: játék állapota, szabályok, FEN, lépésvalidáció – ez az egyetlen igazság-forrás
- `chessground`: csak megjelenítés + drag-and-drop UI, mindig `chess.js`-ből kapja a legális lépéseket (`movable.dests`)

**Stockfish:**
- `public/stockfish/` — JS wrapper + WASM ide kerül (`postinstall` script másolja `node_modules`-ból)
- Worker betöltés: `new Worker('/stockfish/stockfish-nnue-16-single.js', { type: 'classic' })`
- Single-threaded verzió, nem kell SharedArrayBuffer
- Web Worker-ként fut, nem blokkolja a UI thread-et

**SSR:**
- Globálisan kikapcsolva: `ssr: false` a `nuxt.config.ts`-ben (SPA mód)
- `ChessBoard.vue` `<ClientOnly>` wrapperbe kerül

**Reaktivitás – useChessHistory reset():**
- `currentNode = shallowRef<MoveNode>(root)` — nem reactive proxy, így `triggerRef(currentNode)` kell reset után
- `root` plain object, properties mutálhatók: `root.fen = newFen` stb.
- `triggerRef(currentNode)` kényszeríti a computed-ek (currentFen, currentGameState) újraszámítását

**Stockfish generation counter:**
- `resetAnalysis()` NEM küld `stop`-ot — dupla stop → dupla bestmove → filter desync
- `sendAnalyze()` mindig küld `stop` + `go infinite`, ez elegendő
- `gosSent`/`bestmovesReceived` counter szűri a stale üzeneteket

**ChessMoveVariation – fragment root:**
- Vue 3 multi-root template (fragment) — nincs wrapper div
- Outer parens eltávolítva; nested sub-vars inline zárójelben
- `defineOptions({ name: 'ChessMoveVariation' })` kötelező a rekurzív önreferenciához

**chessground CSS** (mindhárom kell):
- `chessground/assets/chessground.base.css`
- `chessground/assets/chessground.brown.css`
- `chessground/assets/chessground.cburnett.css`
- Koordináta CSS override szükséges a `ChessBoard.vue`-ban: `coords.ranks { top: 0 }` és `coords.files { left: 0; bottom: 0 }` — az alapértelmezett offsetek (`top: -20px`, `left: 24px`) külső padding nélkül elcsúsztatják a koordinátákat

**Mobil layout:**
- Sakktábla és panelek teljes szélességűek mobilon (nincs px/mx margó)
- Panelek `rounded-none lg:rounded-lg` — mobilon szögletes, desktopon kerekített
- `default.vue` gyökér div: `overflow-x-hidden` biztonsági háló
- `AppNav.vue` sticky navbar (`sticky top-0 z-30`) + hamburger menü mobilon (< lg)

## Amit sosem csinálunk (ebben a projektben)

- Lichess Open Database letöltése/tárolása (csak API hívások)
- Vitest, Jest, Cypress tesztek (Playwright e2e megengedve)
- SSR (globálisan kikapcsolva)
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

### `docs/plans/` fájl létrehozása (KÖTELEZŐ)
- Minden terv implementálása után hozz létre egy fájlt a `docs/plans/` könyvtárban
- Elnevezési konvenció: `iter-NN-main-<name>.md` (fő iteráció) vagy `iter-NN-patch-NN-<name>.md` (patch)
- Tartalom: mi változott, melyik fájlokban, miért — tömören, technikai szinten
- Ez az archív; a `docs/backlog.md` hivatkozhat rá

### Git commit készítése (KÖTELEZŐ)
- Minden iteráció és patch implementálása után készíts egy commitot
- Commit message formátum: `iter-NN: rövid leírás` (pl. `iter-04: play mode, top nav, playwright`) vagy `iter-NN-patch-MM: rövid leírás`
- Legyen rövid és tömör — egy sor, max 72 karakter
- Az összes érintett fájl kerüljön bele (`git add` a módosított/új fájlokra)
