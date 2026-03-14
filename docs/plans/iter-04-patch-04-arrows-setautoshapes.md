# iter-04-patch-04: Arrow fix via cg.setAutoShapes
**Dátum:** 2026-03-14

## Probléma
Az analysis oldalon az elemzési nyilak nem jelennek meg a táblán, annak ellenére, hogy a Stockfish elemzés lefut (eval bar és analysis lines frissülnek).

## Gyökérok
`cg.set({ fen, drawable: { autoShapes, brushes } })` az `anim()` pathon fut. Az animációs loop alatt az SVG render (`skipSvg` optimalizáció miatt) nem hívódik meg, tehát az `autoShapes` bekerül az állapotba, de a tábla nem rajzolja újra az SVG réteget.

A chessground dedikált `cg.setAutoShapes(shapes)` API a `render()` pathon fut, ami közvetlenül hívja `state.dom.redraw()` → `redrawNow()` → `svg.renderSvg()` — garantált SVG újrarajzolás.

## Megoldás
`syncCg()` két hívásra bontva a `ChessBoard.vue`-ban:
1. `cg.set({ fen, ..., drawable: { brushes } })` — board state + dinamikus brush frissítés (anim path)
2. `cg.setAutoShapes(shapes)` — nyilak dedikált API-val (render path, SVG mindig frissül)

## Érintett fájlok
- `app/components/chess/ChessBoard.vue` — csak `syncCg()` függvény módosítva
