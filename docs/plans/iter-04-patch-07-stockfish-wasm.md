# Iteráció 04 – patch-07: Stockfish WASM fix Vercelhez

## Probléma

A Stockfish motor nem indult el a Vercel-en hostolt verzióban. Lokálisan működött, mert Vite a `/@fs/` útvonalon közvetlenül kiszolgálta a `node_modules` fájlokat.

**Gyökérok:** A `?url` Vite import csak a JS wrappert (`stockfish-nnue-16-single.js`) másolta a build outputba, de az Emscripten-generált JS futáskor a `.wasm` fájlt is keresi a saját könyvtárában (`locateFile`). A WASM fájl nem volt a buildben.

## Megoldás

1. **`public/stockfish/`** — mindkét fájl (JS + WASM) ide kerül
2. **`package.json` postinstall** — `node_modules`-ból automatikusan másolja a fájlokat `npm install` után
3. **`useStockfish.ts`** — `?url` import törölve, hardcoded `/stockfish/stockfish-nnue-16-single.js` path
4. **`.gitignore`** — `public/stockfish/` kizárva (binárisok, `postinstall`-ból generálódnak)

## Érintett fájlok

- `app/composables/useStockfish.ts` — Worker betöltés módosítása
- `package.json` — postinstall script
- `.gitignore` — public/stockfish/ kizárása
