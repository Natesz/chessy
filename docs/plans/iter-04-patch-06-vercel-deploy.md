# Iteráció 04 – patch-06: Vercel deployment

## Mi változott

### `nuxt.config.ts`
- `ssr: false` hozzáadva globálisan — az egész alkalmazás SPA módban fut
- Ez lehetővé teszi a `nuxt generate` használatát, ami statikus HTML/JS fájlokat generál a `.output/public/` mappába
- Nincs szükség serverless function-ökre vagy Node.js szerverre Vercelen

## Miért

A Chessy alkalmazás minden oldala korábban is `ssr: false`-szal futott (`definePageMeta`-n keresztül). A globális beállítás egyszerűsíti a konfigurációt és lehetővé teszi a tiszta statikus deploymentet.

## Vercel beállítás

1. Framework Preset: Nuxt.js
2. Build Command: `nuxt generate`
3. Output Directory: `.output/public`
4. Environment Variables (opcionális): `SUPABASE_URL`, `SUPABASE_ANON_KEY`

## Build ellenőrzés

A `nuxt generate` sikeresen lefutott, 7 route prerendelve:
- `/`, `/analysis`, `/chess`, `/play`, `/404.html`, `/200.html`, `/index.html`

A Stockfish WASM fájl Vite által hash-elt static asset-ként kerül a `_nuxt/` mappába (`stockfish-nnue-16-single.xOZcBp5o.js`).
