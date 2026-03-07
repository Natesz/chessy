# 03-prd-patch-02: Stockfish elemzés bug + Lichess-stílusú history

## Összefoglalás

1. **Bug**: FEN betöltés / Új elemzés után Stockfish nem elemez
2. **Feature**: Lichess-stílusú lépés history — mellékágak zárójelek nélkül, saját sorban

---

## Bug – Stockfish elemzés nem indul FEN/reset után ✅ Javítva

### Tünet
- FEN betöltése után az elemzés nem indult el
- "Új elemzés" gombra kattintva szintén nem indult el az elemzés

### Gyökérok

A `resetAnalysis()` függvény `worker.postMessage('stop')` üzenetet küldött. Ezután a hívó (`handleLoadFen`, `handleReset`) az `analyze()` → `sendAnalyze()` hívást ejtette meg, ami szintén `stop`-ot küld a `go infinite` előtt.

**Dupla `stop` → dupla `bestmove` válasz Stockfishtől:**

| # | Esemény | gosSent | bestmovesReceived | Hatás |
|---|---------|---------|-------------------|-------|
| 1 | `resetAnalysis()` stop | G | G-1 | stop elküldve |
| 2 | `sendAnalyze()`: `gosSent++` | G+1 | G-1 | új generáció |
| 3 | stop (sendAnalyze-ból) elküldve | G+1 | G-1 | — |
| 4 | bestmove (resetAnalysis stop-ra) | G+1 | G | G ≠ G+1 → ok |
| 5 | **bestmove (sendAnalyze stop-ra)** | G+1 | **G+1** | **G+1 === G+1 → isAnalyzing = false!** |
| 6 | info üzenetek (go infinite-ból) | G+1 | G+1 | `G+1 ≠ G` → **SZŰRVE, nem jelenik meg!** |

### Megoldás
`resetAnalysis()`-ból eltávolítva a `worker.postMessage('stop')`. A `sendAnalyze()` mindig küld egy `stop`-ot a `go infinite` előtt — ez elegendő az esetleg futó elemzés leállításához.

```ts
function resetAnalysis() {
  // NEM küldünk 'stop'-ot – dupla stop → dupla bestmove → szűrt info üzenetek
  analysisCache.clear()
  analysisLines.value = []
  evalResult.value = null
  isAnalyzing.value = false
}
```

---

## Feature – Lichess-stílusú lépéslista ✅ Implementálva

### Változás

**Előtte**: mellékágak zárójelben, a főág soraiba beágyazva:
```
1. e4 e5
2. Nf3 Nc6
   (2... d6 3. d4 Nf6)
   (2... a6 3. Nxe5 (3. Nc3 ...) 3... d6)
3. Nc3 Nf6
```

**Utána**: minden mellékág saját sorban, zárójelek nélkül; belső mellékágak zárójelben az adott soron belül:
```
1. e4 e5
2. Nf3 Nc6
   2... d6 3. d4 Nf6
   2... a6 3. Nxe5 (3. Nc3 Nf6 4. Nxe5 d6 5. Nf3) 3... d6 4. Nf3
   2... h6 3. Nc3 d6
3. Nc3 Nf6
```

### Technikai megvalósítás

**`ChessMoveVariation.vue`** — fragment root (Vue 3 többgyökerű template):
- Nincs külső `<div>` wrapper — a komponens inline elemeket renderel
- Nincs külső `(` és `)` karakter
- Belső mellékágak (sub-variations) megmaradnak zárójelben: `<span>(</span><ChessMoveVariation .../><span>)</span>`
- Eltávolítva az `isSimple` elágazás — egységes rendering minden mélységben

**`ChessMoveHistory.vue`** — minden mellékág-sor explicit `<div>` wrapperbe kerül:
```html
<div
  v-for="(varLine, i) in pair.whiteVarLines"
  class="pl-[29px] flex flex-wrap items-baseline gap-x-0.5 leading-5 py-0.5 text-xs text-gray-500 font-mono"
>
  <ChessMoveVariation ... />
</div>
```
- `pl-[29px]`: igazítás a főág lépésgombjai alá (moveNumber oszlop = `w-7` = 28px + 1px rés)
- `flex flex-wrap items-baseline`: az inline elemek sorba folynak, szükség esetén törnek
- `text-xs text-gray-500`: kisebb, halványabb szöveg a főágnál

### Érintett fájlok

| Fájl | Változtatás |
|------|-------------|
| `app/composables/useStockfish.ts` | `resetAnalysis()`: `stop` eltávolítva |
| `app/components/chess/ChessMoveVariation.vue` | Fragment root, nincs outer paren, egységes rendering |
| `app/components/chess/ChessMoveHistory.vue` | Row wrapper div minden mellékág-sornak |
