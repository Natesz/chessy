# Iteráció 04 – patch-08: Responsive layout (mobil + tablet)

## Mi változott

A teljes UI responsive lett. Breakpoint: `lg:` (1024px) — alatta vertikális stack, felette a jelenlegi desktop layout.

### `app/components/chess/ChessLayout.vue` (analysis)
- Container: `flex-col lg:flex-row`, desktop height `lg:h-[min(80vh,600px)]`
- Eval bar: `hidden lg:flex` — mobilon rejtett
- Board: mobilon full-width (`w-full max-w-[600px] aspect-square`), desktopon eredeti fix méret
- Right panel: `w-full lg:flex-1`, history `max-h-[40vh]` mobilon (scrollolható)
- Két külön ChessBoard renderelés (mobil + desktop) a méretezési különbségek miatt

### `app/components/chess/ChessGame.vue` (play)
- Container: `flex-col lg:flex-row`, desktop height `lg:h-[min(80vh,600px)]`
- Board: mobilon full-width, desktopon eredeti fix méret
- History panel: `w-full lg:w-44`
- Két külön ChessBoard renderelés

### `app/components/chess/ChessGameControls.vue`
- `w-full lg:w-56` — mobilon full width

### `app/components/chess/ChessFenPgnLoader.vue`
- `w-full lg:w-52` — mobilon full width

### `app/components/AppNav.vue`
- Kisebb padding mobilon: `px-3 lg:px-6`, `gap-4 lg:gap-6`

## Miért

A Chessy eredetileg desktop-first volt. A Vercel deploy után mobilról is elérhető, de a 4 oszlopos layout teljesen használhatatlan kis képernyőn.
