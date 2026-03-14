# Chessy – Backlog & Változásnapló

Ez a fájl minden iteráció és patch után frissítendő. Rögzíti, mi készült el, mi van folyamatban, és mi a következő lépés.

---

## Státusz jelölések

- ✅ Kész
- 🔧 Patch-elt (bug fix)
- 🚧 Folyamatban
- 📋 Tervezett

---

## Iteráció 01 – Interaktív sakktábla + Stockfish értékelés

**PRD:** `docs/plans/iter-01-main-board-stockfish.md`
**Státusz:** ✅ Kész (patchekkel)

### Implementált feature-ök
- Interaktív sakktábla (chessground)
- Legális lépések validálása (chess.js)
- Drag-and-drop és kattintásos mozgatás
- Stockfish WASM Web Worker (single-threaded)
- Eval bar: numerikus értékelés + vizuális sáv
- Sakk jelzés (piros kiemelés)
- Matt/döntetlen overlay
- `Új játék` reset gomb
- Stockfish MultiPV 3 (3 elemzési sor)
- Legjobb lépés zöld nyíl a táblán
- Elemzési sorok panel (SAN formátumban, 5 lépés mélység)

### Patch-ek

| Patch | Hiba | Megoldás |
|-------|------|----------|
| `iter-01-patch-01-legal-moves-reactivity.md` | Turnváltás nem működött – fekete figurák nem léptek | `legalMoves` reaktív `computed`-ba helyezve (fen-függő) |
| `iter-01-patch-02-stockfish-worker.md` | Stockfish eval nem frissült | `vite.worker.format: 'es'` + `{ type: 'classic' }` konfliktus → `?url` import, `readyok` gate |
| `iter-01-patch-03-worker-coep.md` | Worker betöltési hiba (generic Event) | COEP header (`require-corp`) blokkolta → `routeRules` törölve |
| `iter-01-patch-04-eval-reversed.md` | Eval fordított / csúszott értékelés | UCI score mindig a lépő fél szemszögéből jön → `colorMult` (`-1` ha fekete lép) |
| `iter-01-patch-05-multipv-arrows.md` | Csak 1 elemzési sor jelent meg; legjobb lépés nyíl hiányzott | MultiPV 3 bekapcsolva; zöld nyíl a legjobb lépésre |

---

## Iteráció 02 – Elemzői mód (lépés history + fa navigáció)

**PRD:** `docs/plans/iter-02-main-move-history.md`
**Státusz:** ✅ Kész

### Implementált feature-ök
- `useChessHistory.ts` – fa struktúra alapú lépés state (váltja `useChessGame.ts`-t)
- `ChessMoveHistory.vue` – lépéslista főággal és mellékágakkal (kisebb betű, behúzva)
- Navigációs gombok a history panelben: `«` `‹` `›` `»`
- Billentyűzet navigáció: nyíl gombok (←→ = lépés, ↑↓ = elejére/végére)
- Egérgörgő navigáció a sakktáblán (fel = vissza, le = előre)
- Matt esetén overlay eltávolítva, király piros marad, nem lehet lépni
- `Fekete`/`Fehér` feliratok eltávolítva (tábla és eval bar mellett)
- `Új játék` → `Új elemzés`
- Stockfish nyilak vastagsága arányos a score-különbséggel (gap ≥ 5: csak 1 nyíl)
- Stockfish elemzés minden navigált pozícióban automatikusan elindul

---

### Patch-ek

| Patch | Hiba | Megoldás |
|-------|------|----------|
| `02-prd-patch-01.md` | Mellékágban fekete lépés eltűnt; mellékágak zsúfolt középre-behúzása; hiányzó hierarchikus nesting | `ChessMoveVariation.vue` rekurzív komponens; `buildVarLine` fa-bejárás; inline/block megjelenítés mélység szerint; `pl-2` bal oldali igazítás |
| `02-prd-patch-02.md` | Komponens nem töltődött be (auto-import kihagyás); runtime `__vnode` null hiba navigációkor; rekurzív önreferencia nem működött; index-kulcs instabilitás; `idCounter` reset ID-ütközés | Explicit import; `defineOptions({ name })`; stabil node.id kulcsok; `idCounter` reset eltávolítva |
| `02-prd-patch-03.md` | `__vnode` null runtime hiba navigáció közben (nem determinisztikus); `Új elemzés` nem ürítette a history-t hiba után | Loading placeholder key-ek prefixelve (`loading-${i}`); `v-if` guard az üres variáció v-for-ok köré |
| `02-prd-patch-04.md` | Gyors görgetésnél `__vnode` null hiba – stale Stockfish info/bestmove üzenetek felülírták az `analysisLines`-t és prematurán kikapcsolták az `isAnalyzing` flaget | Generation counter (`gosSent` / `bestmovesReceived`) `useStockfish.ts`-ben; stale üzenetek szűrése |
| `02-prd-patch-05.md` | Elemzési panel magassága ugrált (0 sor ↔ 3 sor), a history rész le-föl ugrált; navigálásnál feleslegesen újraelemzett minden közbülső pozíciót | `ChessAnalysisLines.vue`: mindig 3 slot renderelődik (`min-h-[28px]`, üres ha nincs adat), `shrink-0` a layout-ban; 150ms debounce a `watch(currentFen)` hívásra |
| `02-prd-patch-06.md` | Ismételten meglátogatott pozíciók újraelemzése felesleges CPU használatot okozott; cache csak depth 20-nál mentett; rossz szín/fordított értékelés cache-elt pozícióknál | Position cache redesign: `saveCurrentToCache` navigáláskor menti a checkpointot; `go infinite`; cache hit → azonnali megjelenítés + folytatás (`continueFromCache`, sorok nem törlődnek); depth 15 → ∞ |
| `02-prd-patch-07.md` | "Új elemzés" gombra a Stockfish cache nem törlődött, régi pozíciók elemzése jelent meg | `resetAnalysis()` a `useStockfish`-ben: cache törlés + display reset + stop; `handleReset` chess.vue-ban: debounce cancel + resetAnalysis + azonnali re-analyze |

---

## Iteráció 03 – FEN/PGN Betöltő + Sakkfigura Ikonok

**PRD:** `docs/plans/iter-03-main-fen-pgn-loader.md`
**Státusz:** ✅ Kész

### Implementált feature-ök
- FEN betöltő: egyedi kezdőállás beolvasása szövegből, chess.js validálással, hibaüzenettel
- Jobb-klikkes annotációk (körök/nyilak) megőrzése Stockfish frissítéskor
- PGN betöltő: teljes parti betöltése mellékágakkal együtt (rekurzív descent parser, `usePgnParser.ts`)
- FEN/PGN panel: negyedik oszlop a layoutban (`ChessFenPgnLoader.vue`, `w-52`)
- `useChessHistory.reset(startFen?)`: opcionális FEN paraméter, root node frissítése
- Sakkfigura Unicode ikonok: N→♘, B→♗, R→♖, Q→♕, K→♔ az elemzési sorokban és historiban (`app/utils/san.ts`)
- Layout max-width növelés: 900px → 1150px; tábla max-width: `calc(100vw - 500px)`

### Patch-ek

| Patch | Hiba | Megoldás |
|-------|------|----------|
| `iter-03-patch-01-fen-reactivity-annotations.md` | FEN betöltés nem frissítette a táblát (Vue reaktivitás hiba) | `shallowRef` + `triggerRef(currentNode)` a `reset()`-ben |
| `iter-03-patch-01-fen-reactivity-annotations.md` | Jobb-klikkes annotációk eltűntek Stockfish frissítésnél | `syncCg()` megőrzi a user shape-eket, csak `arrow1/2/3` brush-öket cseréli |
| `iter-03-patch-01-fen-reactivity-annotations.md` | Élő FEN/PGN megjelenítés | `generatePgn(root)` utility (`app/utils/pgn.ts`); `ChessFenPgnLoader` props + watch-szal szinkronizálva |
| `iter-03-patch-02-stockfish-stop-bug.md` | FEN betöltés / Új elemzés után Stockfish nem elemez | `resetAnalysis()` dupla `stop` → dupla `bestmove` → generation counter desync; `stop` eltávolítva `resetAnalysis()`-ból |
| `iter-03-patch-02-stockfish-stop-bug.md` | Mellékágak zárójelben, nem Lichess-stílusban | `ChessMoveVariation.vue` fragment root, outer paren eltávolítva; `ChessMoveHistory.vue` row wrapper div |

---

## Iteráció 04 – Top nav + Play mód + Playwright tesztek

**PRD:** `docs/plans/iter-04-main-play-mode.md`
**Státusz:** ✅ Kész

### Implementált feature-ök

#### Patch A – Nyílszín módosítás
- Stockfish elemzési nyilak: `#4A90E2` → `#8899BB` (szürke-kék)
- arrow1 opacity: 0.8 → 0.65; arrow2/3 opacity tartomány csökkentve (halványabb, kevésbé zavaró)

#### 04-A – Top Navigation + Routing
- `app/layouts/default.vue`: navigációs sáv + `<slot />` wrapper
- `app/components/AppNav.vue`: ♟ Chessy logo · Elemzés · Játék · Puzzle (disabled)
- `app/pages/analysis.vue`: `chess.vue` tartalma új route-on; `<h1>` eltávolítva (layout veszi át)
- `app/pages/index.vue`: `/analysis`-ra redirect
- `app/pages/chess.vue`: `/analysis`-ra redirect (backward compat)
- Aktív tab: amber border-bottom

#### 04-B – Playwright E2E tesztek
- `playwright.config.ts`: Chromium, baseURL 3000, webServer nuxt dev
- `tests/e2e/analysis.spec.ts`: PGN betöltés + gomb-navigáció
- `tests/e2e/navigation.spec.ts`: billentyű-navigáció
- `tests/e2e/fen-pgn.spec.ts`: FEN betöltés + Unicode figuraikonok
- `data-testid` attribútumok: `fen-input`, `fen-load-btn`, `pgn-input`, `pgn-load-btn`, `move-history`, `nav-start`, `nav-back`, `nav-forward`
- CLAUDE.md frissítve: Playwright engedélyezve

#### 04-C – Play mód (AI + 1v1)
- `app/pages/play.vue`: játék főoldal (ssr: false), AI/multiplayer toggle
- `app/components/chess/ChessGame.vue`: játék layout (tábla + kontroll panel)
- `app/components/chess/ChessGameControls.vue`: setup/playing/finished fázis UI
- `app/composables/useStockfishPlayer.ts`: depth-limited AI move composable
- `app/composables/useGameRoom.ts`: Supabase Realtime 1v1 szoba (createRoom, joinRoom, sendMove, subscribe)
- `app/types/game.ts`: GameRoom, PlayerToken, RoomStatus típusok
- `useStockfish.ts`: `getBestMove(fen, depth)` hozzáadva
- `useChessGame.ts`: `makeMove()` visszatér `string | false` (SAN)
- `ChessBoard.vue`: új props – `orientation`, `movableColor`, `showArrows`
- `nuxt.config.ts`: Supabase runtimeConfig (`SUPABASE_URL`, `SUPABASE_ANON_KEY`)
- `@supabase/supabase-js` és `@playwright/test` hozzáadva

### Patch-ek

| Patch | Hiba | Megoldás |
|-------|------|----------|
| `iter-04-patch-01-layout-arrow-fix.md` | Top nav és háttér nem jelent meg; nyilak halvány sötét háttéren | `app.vue`-ba `<NuxtLayout>` wrapper hozzáadva; arrow1 opacity 0.65→0.75; arrow2/3 opacity képlet növelve |
| `iter-04-patch-02-play-history.md` | Play board miniatűr; lépés history hiányzott; nincs "Elemzés megnyitása" gomb | Board column explicit `min(80vh, 520px)` szélesség; önálló history panel a board és controls között; PGN másolás + Elemzés gomb meccs végén; `localStorage` pending-pgn átadás analysis oldalra |
| `iter-04-patch-03-arrows-board-playwright.md` | Stockfish nyilak nem látszottak az analysis oldalon; kattintásbug (huszár → futó jelölődik); history panel tágult lépésenként; Playwright Chromium nem volt telepítve | `autoShapes` + brushes az `initChessground`-ban; board column `flex-col`+`flex-1` eltávolítva (block layout); layout sorrend: controls ↔ history swap; history fix `w-44`; `npx playwright install chromium` |

---

## Jövőbeli modulok (nem ütemezett)

| Modul | Leírás |
|-------|--------|
| Ellenfél-felkészülés | Lichess API: játékos partiai, megnyitó statisztikák |
| Puzzle trainer | Lichess puzzle API, interaktív feladványok |
| Statisztika dashboard | Személyes mérőszámok, Supabase backend |
| Versenyszervezés | Svájci párosítási algoritmus |
| Versenynaptár | chess.results.com scraping |
