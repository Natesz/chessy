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

## Jövőbeli modulok (nem ütemezett)

| Modul | Leírás |
|-------|--------|
| Ellenfél-felkészülés | Lichess API: játékos partiai, megnyitó statisztikák |
| Puzzle trainer | Lichess puzzle API, interaktív feladványok |
| Statisztika dashboard | Személyes mérőszámok, Supabase backend |
| Versenyszervezés | Svájci párosítási algoritmus |
| Versenynaptár | chess.results.com scraping |
