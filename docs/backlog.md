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

**PRD:** `docs/implementation/01-prd-chess.md`
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
| `01-prd-chess-patch.md` | Turnváltás nem működött – fekete figurák nem léptek | `legalMoves` reaktív `computed`-ba helyezve (fen-függő) |
| `01-prd-chess-patch-02.md` | Stockfish eval nem frissült | `vite.worker.format: 'es'` + `{ type: 'classic' }` konfliktus → `?url` import, `readyok` gate |
| `01-prd-patch-03.md` | Worker betöltési hiba (generic Event) | COEP header (`require-corp`) blokkolta → `routeRules` törölve |
| `01-prd-patch-04.md` | Eval fordított / csúszott értékelés | UCI score mindig a lépő fél szemszögéből jön → `colorMult` (`-1` ha fekete lép) |

---

## Iteráció 02 – Elemzői mód (lépés history + fa navigáció)

**PRD:** `docs/implementation/02-prd.md`
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

**PRD:** `docs/implementation/03-prd.md`
**Státusz:** ✅ Kész

### Implementált feature-ök
- FEN betöltő: egyedi kezdőállás beolvasása szövegből, chess.js validálással, hibaüzenettel
- Jobb-klikkes annotációk (körök/nyilak) megőrzése Stockfish frissítéskor

### Patch-ek

| Patch | Hiba | Megoldás |
|-------|------|----------|
| `03-prd-patch-01.md` | FEN betöltés nem frissítette a táblát (Vue reaktivitás hiba) | `shallowRef` + `triggerRef(currentNode)` a `reset()`-ben |
| `03-prd-patch-01.md` | Jobb-klikkes annotációk eltűntek Stockfish frissítésnél | `syncCg()` megőrzi a user shape-eket, csak `arrow1/2/3` brush-öket cseréli |
| `03-prd-patch-01.md` | Élő FEN/PGN megjelenítés | `generatePgn(root)` utility (`app/utils/pgn.ts`); `ChessFenPgnLoader` props + watch-szal szinkronizálva |
| `03-prd-patch-02.md` | FEN betöltés / Új elemzés után Stockfish nem elemez | `resetAnalysis()` dupla `stop` → dupla `bestmove` → generation counter desync; `stop` eltávolítva `resetAnalysis()`-ból |
| `03-prd-patch-02.md` | Mellékágak zárójelben, nem Lichess-stílusban | `ChessMoveVariation.vue` fragment root, outer paren eltávolítva; `ChessMoveHistory.vue` row wrapper div |
- PGN betöltő: teljes parti betöltése mellékágakkal együtt (rekurzív descent parser, `usePgnParser.ts`)
- FEN/PGN panel: negyedik oszlop a layoutban (`ChessFenPgnLoader.vue`, `w-52`)
- `useChessHistory.reset(startFen?)`: opcionális FEN paraméter, root node frissítése
- Sakkfigura Unicode ikonok: N→♘, B→♗, R→♖, Q→♕, K→♔ az elemzési sorokban és historiban (`app/utils/san.ts`)
- Layout max-width növelés: 900px → 1150px; tábla max-width: `calc(100vw - 500px)`

---

## Jövőbeli modulok (nem ütemezett)

| Modul | Leírás |
|-------|--------|
| Ellenfél-felkészülés | Lichess API: játékos partiai, megnyitó statisztikák |
| Puzzle trainer | Lichess puzzle API, interaktív feladványok |
| Statisztika dashboard | Személyes mérőszámok, Supabase backend |
| Versenyszervezés | Svájci párosítási algoritmus |
| Versenynaptár | chess.results.com scraping |
