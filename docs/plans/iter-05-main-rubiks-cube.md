# Iteráció 05 – Rubik-kocka kirakó

## Összefoglaló

Új modul: interaktív 3D Rubik-kocka kirakó, `cubing.js` könyvtárral.

## Változtatott fájlok

| Fájl | Változás |
|------|----------|
| `app/pages/cube.vue` | Új oldal (ssr: false), RubiksCube komponens |
| `app/components/cube/RubiksCube.vue` | 3D kocka (`<twisty-player>`), keverés, timer, megoldás detektálás |
| `app/components/AppNav.vue` | "Kocka" tab hozzáadva |
| `nuxt.config.ts` | `twisty-player` custom element regisztráció (Vue compiler options) |
| `package.json` | `cubing` dependency hozzáadva |

## Technikai részletek

- **`cubing.js`** (`cubing` npm csomag): WCA közösség által fejlesztett Rubik-kocka könyvtár
- **`<twisty-player>`**: web component — 3D vizualizáció, drag-to-rotate, touch support
- **Scramble**: `cubing/scramble` modul, `randomScrambleForEvent('333')` — WCA-kompatibilis
- **Megoldás detektálás**: `experimentalModel.currentPattern` polling (500ms), `experimentalIsSolved()` check
- **Timer**: `setInterval` 10ms, formatted mm:ss.cc
- **ClientOnly**: `<twisty-player>` csak kliens oldalon renderelődik (nincs SSR)
- **Vue custom element**: `nuxt.config.ts`-ben `isCustomElement` compiler option regisztrálja a `twisty-player` taget
