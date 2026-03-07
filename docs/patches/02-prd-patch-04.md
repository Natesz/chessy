# Patch 02-prd-patch-04: Stockfish stale üzenetek – __vnode null hiba gyökérok javítása

## Probléma

Gyors görgetésnél (egérgörgő navigáció) a `__vnode` null Vue runtime hiba jelent meg:

```
TypeError: Cannot set properties of null (setting '__vnode')
  at patchElement → patchKeyedChildren → ...
```

A hiba nem determinisztikus volt és csak gyors egymás utáni navigáció során (pl. 4-5 lépés visszagörgetés) volt reprodukálható.

## Gyökérok

A `sendAnalyze` gyors egymás utáni hívásainál:

1. Minden hívás `worker.postMessage('stop')`-ot küld az előző elemzésnek
2. Stockfish a `stop` parancsra `info` + `bestmove` üzenetekkel válaszol **aszinkron**
3. Ezek a stale üzenetek az előző pozíció adataival frissítik az `analysisLines`-t
4. Minden leállított elemzés `bestmove` üzenete `isAnalyzing.value = false`-t állított be, holott az új elemzés már futott

Eredmény: gyors váltakozás `isAnalyzing=true, lines=[]` (loading: 3 pulsáló div, key: `loading-1,2,3`) és `isAnalyzing=false, lines=[stale]` (line div, key: `1`) között. Ez a `ChessAnalysisLines`-ben lévő keyed children DOM patching-et megzavarta és Vue `__vnode` null hibát okozott.

## Megoldás

Generation counter `useStockfish.ts`-ben:

- `gosSent`: minden `go depth 15` parancs küldésekor inkrementálódik
- `bestmovesReceived`: minden `bestmove` válasz érkezésekor inkrementálódik
- **Info szűrés**: `if (bestmovesReceived !== gosSent - 1) return` – stale info üzenetek figyelmen kívül hagyása
- **Bestmove szűrés**: `isAnalyzing.value = false` csak akkor, ha `bestmovesReceived === gosSent` (azaz az utolsó/aktuális elemzés fejezte be magát)

Ez biztosítja, hogy csak a legújabb `go` parancshoz tartozó üzenetek frissítik a UI-t.

## Érintett fájlok

- `app/composables/useStockfish.ts` – generation counter hozzáadva
