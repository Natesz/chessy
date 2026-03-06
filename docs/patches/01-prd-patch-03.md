
# Chess App – 01-patch-03: Stockfish worker script betöltési hiba

---

## Tünet

```
[Stockfish] worker error: Event {isTrusted: true, type: 'error', target: Worker, ...}
```

Generic `Event` érkezik (nem `ErrorEvent`), nincs `message`, `filename`, `lineno`. Ez azt jelenti, hogy a **worker script maga sem töltődött be** – a JavaScript kód el sem indult a workerben.

---

## Gyökérok: COEP + `?url` kombináció blokkolja a script betöltését

### Részletek

`nuxt.config.ts`-ben minden route-ra be van állítva:
```
Cross-Origin-Embedder-Policy: require-corp
```

Ez azt jelenti, hogy a böngésző csak olyan erőforrásokat enged betölteni, amelyek rendelkeznek `Cross-Origin-Resource-Policy: same-origin` vagy `cross-origin` HTTP fejléccel.

Az előző patch (`?url` import) a Stockfish JS fájlt Vite `/@fs/` útvonalon keresztül szolgálja ki (pl. `/@fs/C:/Users/.../node_modules/stockfish/src/stockfish-nnue-16-single.js`). A Vite dev szerver ezen az útvonalon **nem ad hozzá `Cross-Origin-Resource-Policy` fejlécet** → COEP blokkolja a worker script betöltését → generic `Event` hiba, semmi más.

A `.wasm` fájl betöltése is ugyanígy blokkolódna, még ha a JS el is indulna.

### Miért volt a COEP beállítva?

A `routeRules` kommentje szerint: *"Required for stockfish multi-threaded WASM (SharedArrayBuffer)"*. Ez valóban szükséges a multi-threaded verzióhoz – de mi a **single-threaded** verziót használjuk (`stockfish-nnue-16-single.js`), aminek **nincs szüksége SharedArrayBuffer-re** és ezért COEP-re sem.

---

## Megoldás: két lépés

### 1. lépés – COEP fejléc eltávolítása (nem kell a single-threaded verzióhoz)

**`nuxt.config.ts`-ből töröld a `routeRules` blokkot:**
```ts
// Törlendő:
routeRules: {
  '/**': {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
},
```

Ez önmagában megoldhatja a problémát. Ha COEP nélkül a `?url` worker működik, nincs szükség a 2. lépésre.

### 2. lépés (ha az 1. lépés után is hiba van) – Stockfish fájlok a `public/` könyvtárba

A legmegbízhatóbb megoldás: a Stockfish fájlokat a `public/` könyvtárba másolni, ahol Nuxt/Vite közvetlenül, Vite-feldolgozás nélkül szolgálja ki őket.

**Másolandó fájlok:**
```
node_modules/stockfish/src/stockfish-nnue-16-single.js  →  public/stockfish/stockfish-nnue-16-single.js
node_modules/stockfish/src/stockfish-nnue-16-single.wasm → public/stockfish/stockfish-nnue-16-single.wasm
```

**`useStockfish.ts` módosítása** – töröld a `?url` importot, használj abszolút URL-t:
```ts
// Törlendő:
import stockfishUrl from 'stockfish/src/stockfish-nnue-16-single.js?url'

// Helyette:
worker = new Worker('/stockfish/stockfish-nnue-16-single.js', { type: 'classic' })
```

**Előnyök:**
- Nincs Vite transzformáció
- Azonos originről töltődik be → COEP sem blokkolja (ha mégis kellene)
- A `.wasm` fájl relatív útvonalon megtalálható a JS mellett
- Prod buildben is stabilan működik

**`package.json` – opcionális postinstall script** a copy automatizálásához:
```json
"scripts": {
  "postinstall": "node -e \"const fs=require('fs');fs.mkdirSync('public/stockfish',{recursive:true});['stockfish-nnue-16-single.js','stockfish-nnue-16-single.wasm'].forEach(f=>fs.copyFileSync('node_modules/stockfish/src/'+f,'public/stockfish/'+f))\""
}
```

---

## Javasolt sorrend

1. **Próbáld először az 1. lépést** (COEP törlése) – ez a legkevesebb változtatás
2. Ha még mindig nem működik, folytasd a 2. lépéssel (public copy)
3. Ha mindkettő megvan és működik, a `postinstall` script opcionálisan hozzáadható

---

## Érintett fájlok

| Fájl | Változtatás |
|------|-------------|
| `nuxt.config.ts` | `routeRules` blokk törlése |
| `useStockfish.ts` | `?url` import törlése, `/stockfish/...` URL (csak 2. lépésnél) |
| `public/stockfish/` | Új könyvtár + 2 fájl másolása (csak 2. lépésnél) |
| `package.json` | `postinstall` script (opcionális) |

---

## Elfogadási kritériumok

- [ ] Nincs `[Stockfish] worker error` a konzolban
- [ ] Az eval sáv a kezdőpozícióban `+0.0` közelében van
- [ ] Lépések után az eval frissül
- [ ] Matt előtti pozícióban `M[n]` jelenik meg
