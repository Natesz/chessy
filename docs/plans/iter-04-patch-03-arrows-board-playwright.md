# iter-04-patch-03 — Arrow autoShapes, board click fix, play history layout

**Dátum:** 2026-03-14

## Problémák

1. **Elemzési nyilak nem látszottak** — `syncCg()` `drawable.shapes`-t használt (user-drawn shapes tömb), de a programmatikus nyilakhoz `autoShapes` kell.
2. **Kattintásbug** — `flex flex-col` + `flex-1 min-h-0` wrapper bizonytalan chessground dimenziókat okozott init-kor; huszárra klikkelve más figura jelölődött ki.
3. **History panel mérete nőtt lépésenként** — `flex-1` history panel az első lépésnél kitágult, a tábla elcsúszott.
4. **Playwright Chromium nem telepítve** — `npx playwright install chromium` hiányzott.

## Változások

### `app/components/chess/ChessBoard.vue`

- `initChessground`: brushes definíció az `initChessground` drawable configba kerül (arrow1/2/3 brush kulcsok).
- `syncCg()`: `drawable.shapes` → `drawable.autoShapes`; user shape preserválás eltávolítva (chessground külön kezeli `shapes` user és `autoShapes` programmatic tömböket — user jobb-klikkes annotációk nem érintődnek).

### `app/components/chess/ChessGame.vue`

- Board column: `flex flex-col gap-0.5` + `flex-1 min-h-0` wrapper eltávolítva → sima block layout, explicit `width: min(80vh, 520px)` → chessground egyértelmű dimenziókat kap.
- Layout sorrend: `board | history | controls` → `board | controls | history`.
- History panel: `flex-1` → `w-44 shrink-0` (fix szélesség, nem nő lépésenként).
- Label: `Lépések` → `JÁTSZMALAP`.

### `package.json`

- `test:e2e`: `playwright test`
- `test:e2e:headed`: `playwright test --headed`

### Terminál (egyszer)

```bash
npx playwright install chromium
```
