# Patch 02-02 – ChessMoveVariation renderelési és runtime hibák

**Iteráció:** 02
**Patch sorszám:** 02
**Státusz:** Kész

---

## Javított hibák

### 1. ChessMoveVariation komponens nem töltődött be

**Tünet:** `[Vue warn]: Failed to resolve component: ChessMoveVariation` oldal betöltésekor; mellékágak egyáltalán nem jelentek meg.

**Ok:** A Nuxt auto-import nem vette fel az újonnan létrehozott `ChessMoveVariation.vue` fájlt futás közben (csak build/restart után indexeli az új komponenseket).

**Megoldás:** Explicit import hozzáadva `ChessMoveHistory.vue`-ban:
```typescript
import ChessMoveVariation from './ChessMoveVariation.vue'
```

---

### 2. Runtime error navigáció közben

**Tünet:** `TypeError: Cannot set properties of null (setting '__vnode')` – navigáció (← gomb, nyílbillentyű) közben jelent meg a konzolban.

**Ok:** A nem feloldott `ChessMoveVariation` komponens helyén Vue ismeretlen placeholder DOM elemeket hozott létre. Amikor `currentNode` változott és Vue újra akarta renderelni a history-t, ezek a null DOM elemek patching hibát okoztak.

**Megoldás:** Az explicit import (lásd #1) megszüntette a null DOM referenciákat, így a patching hiba is eltűnt.

---

### 3. Rekurzív önreferencia nem működött

**Tünet:** `ChessMoveVariation` nem tudta saját magát meghívni a sablonban (mélységi mellékágak nem renderelésdtek).

**Ok:** Nuxt környezetben az auto-import interferál a Vue SFC fájlnév-alapú önreferenciájával.

**Megoldás:** `defineOptions({ name: 'ChessMoveVariation' })` hozzáadva a komponenshez – explicit névadás biztosítja, hogy a rekurzív `<ChessMoveVariation />` hivatkozás feloldódjon.

---

### 4. `v-for` index-alapú kulcsok instabilitása

**Tünet:** Mellékág hozzáadásakor Vue rossz DOM elemeket recycolt, vizuális villogás / helytelen megjelenítés.

**Ok:** `ChessMoveVariation.vue` összetett ágblokk `v-for`-ja `idx` (index) kulcsot használt, ami lista módosulásakor inkonzisztens DOM diff-et okozhat.

**Megoldás:** Kulcs átállítva stabil node azonosítóra: `:key="vp.white?.id ?? vp.black!.id"`.

---

### 5. `idCounter` reset ID-ütközést okozott

**Tünet:** `Új elemzés` után az első új lépés ugyanazt a `'0'` ID-t kapta, mint a root node; `isActive` helytelen eredményt adhatott, navigáció zavaros volt.

**Ok:** `reset()` `idCounter = 0`-ra állította vissza, de a root node már a `'0'` ID-t foglalta el (a composable inicializálásakor jött létre).

**Megoldás:** `idCounter = 0` sor eltávolítva a `reset()`-ből – az ID-számláló monoton növekvő marad a teljes session alatt.

---

## Érintett fájlok

| Fájl | Változás |
|------|---------|
| `app/components/chess/ChessMoveHistory.vue` | Explicit import: `import ChessMoveVariation from './ChessMoveVariation.vue'` |
| `app/components/chess/ChessMoveVariation.vue` | `defineOptions({ name: 'ChessMoveVariation' })`; stabil `v-for` kulcsok |
| `app/composables/useChessHistory.ts` | `idCounter = 0` eltávolítva `reset()`-ből |
