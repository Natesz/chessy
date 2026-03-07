# Patch 02-03 – `__vnode` null runtime hiba navigáció közben

**Iteráció:** 02
**Patch sorszám:** 03
**Státusz:** Kész

---

## Tünet

`Uncaught (in promise) TypeError: Cannot set properties of null (setting '__vnode')`

- Megjelenés: navigáció közben (← gomb, nyílbillentyű, egérgörgő), mellékág nélküli főágon is
- Nem determinisztikus: nem mindig ugyanannál a lépésnél, de ismételve előjön
- Reprodukció: 4 lépés lejátszása → visszatekerelés elejére → visszatekerelés negyedik lépésig → megismétlés
- Másodlagos tünet: hiba után az `Új elemzés` gomb nem üríti a history-t (Vue belső állapot korrupció)

---

## Gyökér ok – két egyidejű probléma

### 1. Key ütközés: `ChessAnalysisLines.vue`

A loading placeholder divek (Stockfish elemzés közben mutatott animált sorok) kulcsai:
```html
<div v-for="i in 3" :key="i" />   <!-- keys: 1, 2, 3 -->
```

Az elemzési eredmény divek kulcsai:
```html
<div v-for="line in lines" :key="line.multipv" />   <!-- keys: 1, 2, 3 -->
```

Mindkettő ugyanannak a szülő `<div>`-nek a gyermeke → egyazon keyed lista. Amikor a Stockfish visszatér az első eredménnyel, Vue a `patchKeyedChildren` algoritmusa az azonos kulcsú loading div-eket próbálja frissíteni az elemzési sorokká. Ez vnode-state inkonzisztenciát okoz.

### 2. Vegyes keyed/unkeyed gyermekelista: `ChessMoveHistory.vue`

A lépéspár `<div>`-jének gyermekei navigáció közben:
```
[flexDiv (nincs kulcs)] + [üres ChessMoveVariation v-for fragmentek]
```

Vue sablonfordítója a `v-for` jelenléte miatt `patchKeyedChildren`-t használ a szülő gyermekeinél – akkor is, ha a v-for üres. A `flexDiv` nem rendelkezik kulccsal. Ez vegyes keyed+unkeyed lista, amely undefined viselkedést okozhat a diff algoritmusban.

A két hiba együtt, a Stockfish Worker async `onmessage` callback-jeivel párosulva (ami Vue scheduler-en kívüli renderelési ciklust indít), non-determinisztikus vnode korrupciót okoz navigáció közben.

---

## Megoldás

### 1. `ChessAnalysisLines.vue` – key prefix

```html
<!-- ELŐTTE -->
<div v-for="i in 3" :key="i" ... />

<!-- UTÁNA -->
<div v-for="i in 3" :key="`loading-${i}`" ... />
```

A `loading-1`, `loading-2`, `loading-3` kulcsok nem ütköznek a `line.multipv` értékekkel (1, 2, 3).

### 2. `ChessMoveHistory.vue` – v-if guard az üres v-for-ok körül

```html
<!-- ELŐTTE: mindig rendereli a v-for fragmentet, kulcs nélküli flexDiv-vel együtt -->
<ChessMoveVariation v-for="..." :key="..." />

<!-- UTÁNA: csak akkor jelenik meg a v-for, ha van valódi mellékág -->
<template v-if="pair.whiteVarLines.length">
  <ChessMoveVariation v-for="..." :key="..." />
</template>
```

Ha nincs mellékág, a pair div-nek csak egy gyermeke van (a `flexDiv`), Vue egyszerű sequenciális diff-et használ `patchKeyedChildren` helyett.

---

## Érintett fájlok

| Fájl | Változás |
|------|---------|
| `app/components/chess/ChessAnalysisLines.vue` | Loading placeholder key-ek: `i` → `` `loading-${i}` `` |
| `app/components/chess/ChessMoveHistory.vue` | `v-if` guard a variáció v-for-ok köré |
