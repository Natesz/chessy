# Patch 02-prd-patch-06: Position cache + depth növelés

## Problémák

1. Visszanavigálásnál minden pozíció újraelemzésre került, felesleges CPU-terheléssel
2. `go depth 15` pontatlan elemzést adott (SF16 single-thread ennél mélyebbre is képes)

## Megoldások

### Position cache (`useStockfish.ts`)

```ts
const analysisCache = new Map<string, { lines: AnalysisLine[], evalResult: EvalResult | null }>()
```

**Cache feltöltése**: `bestmove` érkezésekor, ha az elemzés teljesen lefutott (`bestmovesReceived === gosSent`) és van adat, a FEN-hez eltároljuk az `analysisLines` és `evalResult` aktuális értékét.

**Cache olvasása**: `analyze(fen)` hívásakor, ha `analysisCache.get(fen)` talál eredményt:
- azonnal beírja `analysisLines.value` és `evalResult.value`-ba
- `isAnalyzing.value = false`
- Stockfish nem indul el (return)

Eredmény: visszanavigálásnál az elemzés **azonnal** megjelenik, nincs újraszámítás.

### Depth növelés

`go depth 15` → `go depth 20`

A depth 20 SF16 single-thread-en ~2-5s komplex állásokban, de a cache miatt ez csak az első látogatásnál jelent várakozást.

## Érintett fájlok
- `app/composables/useStockfish.ts`
