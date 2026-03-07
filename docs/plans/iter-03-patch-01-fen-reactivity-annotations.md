# 03-prd-patch-01: FEN reaktivitás + Annotáció megőrzés + Élő FEN/PGN panel

## Összefoglalás

Két bug javítás és egy új feature terv:
1. **Bug**: FEN betöltése nem frissítette a táblát (Vue reaktivitás hiba)
2. **Bug**: Jobb-klikkes körök/nyilak eltűntek Stockfish frissítésnél
3. **Feature**: Élő FEN és PGN megjelenítés a panelban (aktuális pozíció alapján)

---

## Bug 1 – FEN betöltés nem frissül ✅ Javítva

### Tünet
Ha a felhasználó a kezdőállásban volt (nem lépett még), és FEN-t töltött be, a tábla nem változott.

### Gyökérok
`useChessHistory.ts`-ben `currentNode = ref<MoveNode>(root)` — a Vue `ref()` mélyen reaktív proxyt hoz létre az objektumra. Amikor `reset(fen)` híváskor `root.fen = newFen`-t közvetlenül a nyers objektumon módosítottuk (nem a proxyn keresztül), a Vue reaktivitási rendszere nem értesült a változásról. Mivel `currentNode.value = root` szintén no-op volt (ugyanaz a proxy referencia), a `currentFen` computed nem számítódott újra.

### Megoldás
`currentNode` → `shallowRef<MoveNode>(root)` + `triggerRef(currentNode)` a `reset()` végén:
```ts
const currentNode = shallowRef<MoveNode>(root)

function reset(startFen?: string) {
  ...
  root.fen = fen
  root.moveNumber = parseInt(fenParts[5])
  root.color = fenParts[1] as 'w' | 'b'
  root.children = []
  treeVersion.value++
  currentNode.value = root
  triggerRef(currentNode) // kényszerített frissítés ha már root volt az aktuális node
}
```

`shallowRef` + `triggerRef`: Vue dokumentált megoldás arra az esetre, ha manuálisan módosítunk mély objektum-tulajdonságokat és kényszeríteni kell a reaktív frissítést.

---

## Bug 2 – Jobb-klikkes annotációk eltűnnek ✅ Javítva

### Tünet
A chessground alapból támogatja a jobb-klikkes rajzolást (kör = jobb kattintás, nyíl = jobb egérhúzás). Ezek eltűntek minden Stockfish elemzési frissítésnél.

### Gyökérok
`ChessBoard.vue` `syncCg()` függvénye: `drawable: { shapes: stockfishArrows }` felülírta az összes shape-et, beleértve a felhasználó által rajzolt alakzatokat is.

### Megoldás
`cg.state.drawable.shapes`-ből kiszűrjük a saját Stockfish nyilainkat (`arrow1`, `arrow2`, `arrow3`), és a felhasználó alakzatait megtartjuk:
```ts
const userShapes = cg.state.drawable.shapes.filter(
  s => !['arrow1', 'arrow2', 'arrow3'].includes(s.brush)
)
drawable: { shapes: [...userShapes, ...stockfishShapes], brushes }
```

---

## Feature – Élő FEN/PGN megjelenítés 📋 Tervezett

### Motiváció
A Lichess-en a FEN mező és a PGN szöveg folyamatosan frissül navigáció közben — ez az aktuális pozíciót tükrözi. Hasznos másoláshoz, megosztáshoz, és a PGN formátum megértéséhez.

### FEN megjelenítés

Egyszerű: `currentFen` értékét megjelenítjük a FEN input mezőben (readonly, de másolható):
```vue
<input :value="currentFen" readonly ... />
```

`ChessFenPgnLoader.vue`-ban:
- Ha `currentFen` prop megérkezik → a FEN input értéke ez lesz (readonly display mód)
- Ha a felhasználó szerkeszteni akar → kattintás/fókusz esetén szerkeszthetővé válik
- Alternatíva: két külön mező (display + input), vagy egyszerűen mindig szerkeszthető és a v-model-t felülírjuk

### PGN generálás

Új utility: `app/utils/pgn.ts`:
```ts
export function generatePgn(root: MoveNode): string
```

Algoritmus (rekurzív):
```
generatePgn(node, result = []):
  ha node.children[0] nincs → return

  white = node.children[0]
  ha white.color === 'w':
    result += `${white.moveNumber}. ${white.move.san}`
  else:
    result += `${white.moveNumber}... ${white.move.san}`

  // Mellékágak (node.children[1+])
  for each altChild in node.children.slice(1):
    result += ` (${generateSubLine(altChild)})`

  // Fekete lépés (ha van)
  if white.children[0]:
    black = white.children[0]
    result += ` ${black.move.san}`
    for each altBlackChild in white.children.slice(1):
      result += ` (${generateSubLine(altBlackChild)})`
    generatePgn(black, result)
```

**PGN formátum (Lichess-kompatibilis):**
```
1. e4 e5 2. Nf3 Nc6 (2... d6 3. d4 Nf6) (2... a6 3. Nxe5) 3. Nc3 Nf6
```

### ChessFenPgnLoader.vue módosítások

```
Új props:
  - currentFen: string    (aktuális pozíció FEN-je, parent adja)
  - currentPgn: string    (generált PGN string, parent adja)

Viselkedés:
  - FEN mező: :value="currentFen" → mindig frissül navigáció közben
  - PGN textarea: :value="currentPgn" → mindig frissül
  - Szerkesztés: ha a user kézzel ír bele, és Betöltést nyom → a beírt értékkel dolgoz
  - Másolás: Ctrl+A + Ctrl+C, vagy külön "Másolás" gomb (opcionális)
```

### chess.vue módosítások

```ts
const currentPgn = computed(() => generatePgn(root))
```

### Érintett fájlok

| Fájl | Változtatás |
|------|-------------|
| `app/utils/pgn.ts` | **ÚJ** — `generatePgn(root)` rekurzív PGN generátor |
| `app/components/chess/ChessFenPgnLoader.vue` | `currentFen` + `currentPgn` props; display mode |
| `app/components/chess/ChessLayout.vue` | `currentFen` + `currentPgn` prop átadás |
| `app/pages/chess.vue` | `currentPgn` computed |

---

## Melléklet – Lichess URL-alapú FEN (design note)

### Miért csinálja így a Lichess?

A Lichess az URL-be írja a FEN-t (pl. `lichess.org/analysis/standard/rnbqk.../b_KQkq_-_1_2`), és PGN fejlécbe is:
```
[Variant "From Position"]
[FEN "rnbqkbnr/..."]
```

**Okai:**
1. **Megoszthatóság**: bármely URL = egy konkrét állás, könyvjelzőzhető, linkelhető
2. **Böngészőhistory**: vissza gomb az előző pozícióhoz visz
3. **Deep link**: közvetlenül betölthető bármely állás URL-ből
4. A `[Variant "From Position"]` + `[FEN "..."]` PGN fejlécek a PGN szabvány szerint kötelezők, ha a parti nem az alapállásból indul

**A mi alkalmazásunknak**: bemutató/demo célra az URL-alapú FEN szükségtelen komplexitás. Elég a panelban megjeleníteni az aktuális FEN-t (másolható). URL szinkronizáció egy esetleges jövőbeli iterációban implementálható Nuxt `useRoute/useRouter` segítségével.
