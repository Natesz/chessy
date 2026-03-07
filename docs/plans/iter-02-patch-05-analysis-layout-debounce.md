# Patch 02-prd-patch-05: Layout ugráló elemzési panel + debounce

## Problémák

### 1. Elemzési panel magassága ugrált
Az elemzési sáv 3 állapot közt váltott eltérő magassággal:
- Nincs elemzés: csak a cím (~20px)
- Töltés: 3 pulsáló div (h-8 = 96px + gap-ok)
- 3 sor adat: 3 sor tartalom (~100px+)

Ez a history panel és az elválasztó vonal le-föl ugrálását okozta.

### 2. Felesleges Stockfish hívások navigálásnál
Gyors görgetésnél (`watch(currentFen)`) minden egyes közbülső pozícióra elindult egy elemzés.

## Megoldások

### ChessAnalysisLines.vue – mindig 3 slot
A komponens átírva: `v-for="i in 3"` mindig 3 sort renderel, `key="i"` (stabil, nem váltakozó):
- Ha van adat: score badge + moves
- Ha elemzés folyamatban: `animate-pulse` placeholder
- Ha nincs semmi: üres slot tartja a helyet (`min-h-[28px]`)

`shrink-0` a root `div`-en megakadályozza a zsugorodást a flex containerben.
Mellékhatásként a loading↔lines DOM key-váltás is eltűnt (bónusz stabilitás).

### chess.vue – 150ms debounce
```ts
let analyzeDebounce: ReturnType<typeof setTimeout> | null = null
watch(currentFen, (fen) => {
  if (analyzeDebounce) clearTimeout(analyzeDebounce)
  analyzeDebounce = setTimeout(() => analyze(fen), 150)
})
```
Gyors navigációnál csak az utolsó pozíció elemzése indul el.
Cleanup: `onUnmounted`-ben `clearTimeout`.

## Érintett fájlok
- `app/components/chess/ChessAnalysisLines.vue` – 3-slot stabil layout
- `app/pages/chess.vue` – debounce a watch-ban
