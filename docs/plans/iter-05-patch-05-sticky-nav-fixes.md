# iter-05-patch-05: sticky nav + game gap + koordináták + cube scramble fix

## Problémák

1. **Sticky navbar nem működik** — `overflow-x-hidden` a gyökér div-en scroll context-et hozott létre → sticky elvesztette a referencia pontját
2. **Gap a navbar és tábla között Játék módban** — `justify-center` a main elemen vertikálisan középre tette a tartalmat, gap keletkezett felül
3. **Koordináták a mezők közepén** — a chessground coord elemek `translateY(39%)` és `text-align: center` miatt középre kerültek
4. **Rubik-kocka scramble worker hiba mobilon** — `cubing/scramble` modul web workert próbált indítani, de a SPA fallback HTML-t adott vissza JS helyett

## Megoldások

### 1. Sticky navbar — `app/layouts/default.vue`
- `overflow-x-hidden` → `overflow-x-clip` — clip nem hoz létre scroll context-et, sticky működik

### 2. Game gap — `app/layouts/default.vue`
- `justify-center` → `justify-start lg:justify-center` — mobilon felülre igazít, desktopon marad a közép

### 3. Koordináták bal alsó sarok — `app/components/chess/ChessBoard.vue`
- `coords.ranks coord { transform: translateY(80%) }` — alsó sarokba tolja
- `coords.files { text-align: left; bottom: 2px }` + `coords.files coord { padding-left: 2px }` — bal sarokba

### 4. Cube scramble fallback — `app/components/cube/RubiksCube.vue`
- `generateSimpleScramble()` helper: 20 random keverés lépést generál (U/D/L/R/F/B + '/2 modifier)
- `handleShuffle()`: try/catch a cubing.js scramble körül, fallback a simple generátorra

## Érintett fájlok

- `app/layouts/default.vue`
- `app/components/chess/ChessBoard.vue`
- `app/components/cube/RubiksCube.vue`
- `docs/backlog.md`
- `README.md`
