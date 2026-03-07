# Chess App – 01-patch-04: Eval bar fordított / csúszott értékelés

---

## Tünet

- Fehér lépése után az eval sötét előnyét mutatja (pl. `-0.3`)
- Sötét lépése után az eval fehér előnyét mutatja (pl. `+0.3`)
- Döntetlen közelében a hiba alig látszik (0 negáltja is 0)
- Nagy hiba esetén: fehér hibázik → eval fehér nagy előnyét mutatja (fordítva) → sötét lép → eval sötét nagy előnyét mutatja (most látszólag helyes, de egy lépéssel késő)

---

## Gyökérok: UCI score mindig a lépő fél szemszögéből értendő

### UCI protokoll szabálya

A Stockfish (UCI standard szerint) az értékelést **mindig a lépő fél szemszögéből** adja vissza:

- `score cp 30` ha **fehér lép** → fehérnek +0.30 előnye van ✓
- `score cp 30` ha **fekete lép** → feketének +0.30 előnye van (fehér szemszögből: **-0.30**)
- `score cp -30` ha **fekete lép** → feketének -0.30 (fehér szemszögből: **+0.30**)

A jelenlegi kód ezt nem veszi figyelembe – a `score cp` értéket mindig közvetlenül fehér előnyként jeleníti meg:

```ts
// useStockfish.ts – jelenlegi hibás kód
evalResult.value = {
  type: 'cp',
  value: parseInt(cpMatch[1]) / 100,  // ← nincs negálás, ha fekete lép
}
```

### Konkrét példa

1. Fehér lép e4 → most fekete következik
2. Stockfish elemzi a pozíciót, visszaad: `score cp -30`
   - Értelmezés: feketének -0.30 (fekete kissé hátrányban, fehérnek +0.30 előny)
3. Kód: `parseInt('-30') / 100 = -0.30` → kiírja: **-0.3** (sötét előnye)
4. Helyes lenne: **+0.3** (fehér előnye a kezdőállásban)

Matt esetén ugyanez a probléma:
- `score mate 4` ha fekete lép → fekete adhat mattot 4 lépésen belül → fehér szemszögből: **-M4**
- Jelenlegi kód kiírja: **M4** (fehér ad mattot) ← fordítva

---

## Javítás – `useStockfish.ts`

Az elemzett FEN-ből ki kell olvasni, hogy ki lép, és ha fekete, negálni kell az értéket.

### 1. `sendAnalyze`-ban mentsd el az elemzett szín:

```ts
let analyzingColor: 'w' | 'b' = 'w'

function sendAnalyze(fen: string) {
  analyzingColor = fen.split(' ')[1] as 'w' | 'b'  // FEN 2. mezője: 'w' vagy 'b'
  isAnalyzing.value = true
  worker!.postMessage('stop')
  worker!.postMessage(`position fen ${fen}`)
  worker!.postMessage('go depth 15')
}
```

### 2. `onmessage`-ben normalizáld fehér szemszögére:

```ts
// Szorzó: fehér lép → +1 (változatlan), fekete lép → -1 (negálás)
const colorMult = analyzingColor === 'b' ? -1 : 1

if (line.includes('score cp')) {
  const cpMatch = line.match(/score cp (-?\d+)/)
  const depthMatch = line.match(/depth (\d+)/)
  if (cpMatch) {
    evalResult.value = {
      type: 'cp',
      value: (parseInt(cpMatch[1]) / 100) * colorMult,  // ← normalizálva
      depth: parseInt(depthMatch?.[1] ?? '0'),
    }
  }
}
else if (line.includes('score mate')) {
  const mateMatch = line.match(/score mate (-?\d+)/)
  const depthMatch = line.match(/depth (\d+)/)
  if (mateMatch) {
    evalResult.value = {
      type: 'mate',
      value: parseInt(mateMatch[1]) * colorMult,  // ← normalizálva
      depth: parseInt(depthMatch?.[1] ?? '0'),
    }
  }
}
```

### Helyes viselkedés a javítás után

| Helyzet | Stockfish output | `analyzingColor` | Megjelenített érték |
|---------|-----------------|-----------------|---------------------|
| Kezdőállás, fehér lép | `score cp 20` | `w` | `+0.2` ✓ |
| e4 után, fekete lép | `score cp -30` | `b` | `+0.3` ✓ |
| Fekete nagy előnye, fehér lép | `score cp -300` | `w` | `-3.0` ✓ |
| Fekete adhat mattot, fehér lép | `score mate -4` | `w` | `-M4` ✓ |
| Fekete adhat mattot, fekete lép | `score mate 4` | `b` | `-M4` ✓ |

---

## Érintett fájl

| Fájl | Változtatás |
|------|-------------|
| `useStockfish.ts` | `analyzingColor` változó + `colorMult` szorzó a score cp/mate parsoláshoz |

---

## Elfogadási kritériumok

- [ ] Kezdőállásban az eval `+0.0` – `+0.3` közt van (fehér enyhe előnye)
- [ ] e4 után az eval továbbra is fehér enyhe előnyét mutatja
- [ ] Ha fehér nagy hibát vét, az eval azonnal sötét nagy előnyét mutatja
- [ ] Matt pozícióban `M[n]` a megfelelő színű félnek jelenik meg
- [ ] Döntetlen állásban az eval `0.0` körül van
