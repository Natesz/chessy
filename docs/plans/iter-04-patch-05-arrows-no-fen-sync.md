# iter-04-patch-05: Arrow fix via syncArrows (no-fen render path)
**Dátum:** 2026-03-14

## Probléma
Patch-04 után az elemzési nyilak még mindig nem jelennek meg az analysis oldalon.

## Gyökérok
Az `analysisLines` watcher `syncCg()`-t hívta, ami mindig tartalmaz `fen`-t a `cg.set()` hívásban. Az `api.js` logikája: `(config.fen ? anim : render)(configure, state)`. Ha fen van jelen, az `anim()` pathon fut még akkor is ha a FEN nem változott. Az `anim()` path:
- `animate()` → piece animation planning (felesleges, ha FEN azonos)
- `configure()` → `state.drawable.shapes = []` (user annotációk törlése!)
- `state.dom.redraw()` → debounced RAF

Közben `cg.setAutoShapes(shapes)` is `state.dom.redraw()`-t hív, amit a debounce IGNORAL (már van pending RAF). A RAF lefut, az `autoShapes` be van állítva — elméletileg működne. De ha van folyamatban animáció az előző FEN-váltásból (`step()` loop `redrawNow(true)` hívásai), race condition keletkezik.

## Megoldás
Új `syncArrows()` függvény: `cg.set({ drawable: { brushes } })` **fen nélkül** → `render()` path:
- `configure()` fen-blokk nem fut → `state.drawable.shapes` NEM törlődik
- `deepMerge` frissíti a brush értékeket
- `state.dom.redraw()` → RAF
- `cg.setAutoShapes(shapes)` → shapes beállítva
- RAF fires → `renderSvg()` → nyilak megjelennek

`watch(() => props.analysisLines, () => syncArrows())` — az `analysisLines` változáskor csak a nyilak szinkronizálódnak, fen nélkül.

## Érintett fájlok
- `app/components/chess/ChessBoard.vue` — `syncArrows()` hozzáadva, watcher módosítva
