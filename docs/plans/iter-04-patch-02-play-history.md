# iter-04-patch-02: Play board fix + lépés history + elemzés gomb

**Dátum:** 2026-03-14

## Probléma

1. **Board miniatűr** – `ChessGame.vue` board column `flex-1` volt, ezért a tábla ~660px szélesen jelent meg, de a container csak 600px magas → overflow + chessground positioning hiba
2. **Lépés history hiányzott** – a history panel csak a controls komponensben volt, nem jól látható helyen
3. **Elemzés gomb hiányzott** – meccs után nem lehetett átmenni az analysis oldalra

## Változások

### `app/components/chess/ChessGame.vue`
- Container: `flex gap-4` + `max-width: 900px; height: 600px` → `flex items-stretch gap-4` + `max-width: min(95vw, 1100px); height: min(80vh, 600px)`
- Board column: `flex-1` → `shrink-0` + `style="width: min(80vh, 520px); max-width: calc(100vw - 490px)"`
- Új önálló history panel (középső oszlop): scrollable lépés lista `formatSan`-nal, "PGN másolása" gomb meccs végén
- `movePairs` computed (áthelyezve a Controls-ból)
- `gamePgn` computed: lépések stringbe konvertálva
- `copied` ref + `copyPgn()` clipboard
- `openAnalysis` emit passthrough a Controls-tól
- `defineExpose`: `gamePgn` hozzáadva

### `app/components/chess/ChessGameControls.vue`
- `moves: string[]` prop eltávolítva
- `movePairs` computed eltávolítva
- Playing fázisból a lépés lista eltávolítva (→ ChessGame history panel)
- Spacer `<div class="flex-1" />` a playing fázisban
- `openAnalysis: []` emit hozzáadva
- Finished fázisban: "Elemzés megnyitása →" gomb (kék) az "Új játék" fölé

### `app/pages/play.vue`
- `handleOpenAnalysis()`: gamePgn → `localStorage.setItem('chessy:pending-pgn', pgn)` → `navigateTo('/analysis')`
- `@open-analysis="handleOpenAnalysis"` a ChessGame-en

### `app/pages/analysis.vue`
- `onMounted`: `localStorage.getItem('chessy:pending-pgn')` check; ha van → `handleLoadPgn(pgn)`, különben `analyze(currentFen.value)`
