# Chess App – 01-patch-02: Stockfish eval bar nem frissül

---

## Tünet

- Az eval sáv megjelenik, de `+0.0`-t mutat az egész játék alatt
- Lépések után nem változik az értékelés
- `isAnalyzing` loading pulzálás sem látható

Ez azt jelenti, hogy `evalResult` soha nem kap értéket → a worker vagy nem fut, vagy üzenetei nem érkeznek meg.

---

## Gyökérok 1 (kritikus): `vite.worker.format: 'es'` és `{ type: 'classic' }` konfliktus

### Részletek

`nuxt.config.ts`-ben:
```ts
vite: {
  worker: {
    format: 'es',   // ← Vite ES module formátumban bundle-öli a workert
  },
}
```

`useStockfish.ts`-ben:
```ts
worker = new Worker(
  new URL('stockfish/src/stockfish-nnue-16-single.js', import.meta.url),
  { type: 'classic' },   // ← klasszikus script-ként indítja
)
```

Amikor Vite meglátja a `new Worker(new URL('...', import.meta.url))` mintát, **felismeri és bundle-öli** a worker fájlt. A `vite.worker.format: 'es'` miatt az output ES module szintaxisú lesz (`import`/`export` utasításokkal). Azonban a Worker `{ type: 'classic' }` opcióval van létrehozva, ami azt mondja a böngészőnek: *ez klasszikus script*. Az ES module szintaxis egy classic workerben **szintaxishibát** okoz → a worker csendesen meghal, soha nem küld üzenetet vissza.

### Javítás – `nuxt.config.ts` + `useStockfish.ts`

A Vite worker bundling megkerülése `?url` suffixszel: ez azt mondja Vite-nak, hogy *ne bundle-ölje* a fájlt, csak adja vissza az elérési URL-t.

**`useStockfish.ts` elején:**
```ts
// ?url → Vite csak URL-t ad vissza, nem bundle-öli a fájlt
import stockfishUrl from 'stockfish/src/stockfish-nnue-16-single.js?url'
```

**`init()` függvényen belül:**
```ts
worker = new Worker(stockfishUrl, { type: 'classic' })
```

**`nuxt.config.ts`-ből töröld a `vite.worker` blokkot** (vagy hagyd üresen), mert a `?url` megkerüli a Vite worker bundlinget:
```ts
vite: {
  optimizeDeps: {
    exclude: ['stockfish'],
  },
  // worker.format már nem szükséges
},
```

---

## Gyökérok 2 (közepes): nincs `readyok` gate – a worker esetleg nem kész, mire az első `go depth 15` megérkezik

### Részletek

`init()` egymás után küldi:
```ts
worker.postMessage('uci')
worker.postMessage('isready')
```

Majd `chess.vue` `onMounted`-ban azonnal hívódik:
```ts
analyze(fen.value)  // → stop + position fen + go depth 15
```

A Web Worker üzenetsor garantálja a sorrendet, de a Stockfish WASM-nak betöltési ideje van. Ha a WASM inicializálás még nem fejeződött be mire az `uci` parancsot megkapja, az összes utána érkező parancsot figyelmen kívül hagyhatja.

UCI protokoll szerint a helyes sorrend:
1. `uci` küldése → várakozás `uciok`-ra
2. `isready` küldése → várakozás `readyok`-ra
3. **Csak ezután** szabad `position` / `go` parancsot küldeni

### Javítás – `useStockfish.ts`

Vezess be egy `isReady` flag-et és egy `pendingFen` queue-t:

```ts
let isReady = false
let pendingFen: string | null = null

// onmessage-ben:
if (line === 'readyok') {
  isReady = true
  if (pendingFen !== null) {
    sendAnalyze(pendingFen)
    pendingFen = null
  }
  return
}

// analyze() módosítása:
function analyze(fen: string) {
  if (!worker) init()
  if (!worker) return
  if (!isReady) {
    pendingFen = fen   // sor végére kerül, readyok után fut le
    return
  }
  sendAnalyze(fen)
}

// külön belső helper:
function sendAnalyze(fen: string) {
  isAnalyzing.value = true
  worker!.postMessage('stop')
  worker!.postMessage(`position fen ${fen}`)
  worker!.postMessage('go depth 15')
}
```

---

## Gyökérok 3 (kisebb): nincs `onerror` handler – a worker hibái néma csendben elnyelődnek

### Javítás – `useStockfish.ts`

`init()` belsejében, a `worker.onmessage` után:
```ts
worker.onerror = (e) => {
  console.error('[Stockfish] worker error:', e)
}
```

Ez nem fix, de a jövőbeli debuggolást jelentősen megkönnyíti.

---

## Összefoglaló – javítandó helyek

| Fájl | Változtatás | Prioritás |
|------|-------------|-----------|
| `useStockfish.ts` | `?url` import + `new Worker(stockfishUrl, ...)` | Kritikus |
| `nuxt.config.ts` | `vite.worker.format: 'es'` törlése | Kritikus |
| `useStockfish.ts` | `readyok` gate + `pendingFen` queue | Közepes |
| `useStockfish.ts` | `worker.onerror` handler | Kisebb |

---

## Elfogadási kritériumok (patch után)

- [ ] Az eval sáv a kezdőállásban `+0.0` közelében van (Stockfish fut)
- [ ] Minden lépés után az eval szám és a sáv frissül
- [ ] Matt előtti pozícióban `M[n]` jelenik meg
- [ ] `isAnalyzing` loading pulzálás látható analízis közben
- [ ] `Új játék` után az eval visszaáll és újraindul az analízis
