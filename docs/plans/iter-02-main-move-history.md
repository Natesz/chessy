# Chess App – Iteráció 02: Elemzői mód (lépés history + fa struktúra + navigáció)

---

## 0) Összefoglaló

Ez az iteráció az appot **elemzői eszközzé** alakítja. A hangsúly nem a játékon, hanem a pozíciók visszajátszásán, mellékágak vizsgálatán és a Stockfish értékelés nyilainak vizuális fejlesztésén van.

---

## 1) Új feature-ök

### 1.1 Lépés history panel (fa struktúra)

- A tábla jobb oldalán egy scrollozható panel jelenik meg a lépéslistával
- Lépések megszámozva: `1. e4 e5`, `2. Nf3 Nc6`, ...
- Fehér lépése **balra**, fekete lépése **jobbra**
- Minden sor = egy teljes lépéspár (ha van mindkettő)
- Az éppen aktív lépés vizuálisan kiemelve (pl. világos háttér)
- **Mellékágak:** kisebb betűmérettel, a szülő lépés alatt, behúzva jelennek meg
- A mellékág lépéseire kattintva oda lehet navigálni

### 1.2 Fa struktúra logika

```
Gyökér (kezdőállás)
└── 1.e4 [főág]
    └── e5 [főág]
        └── 2.Nf3 [főág]
            ├── Nc6 [főág – ez volt az első lépés]
            │   └── ...
            └── Nf6 [mellékág – visszatekertünk és mást léptünk]
```

- Az első lépés minden pozícióból = **főág** (`children[0]`)
- Ha visszatekertünk és mást léptünk = **mellékág** (`children[1]`, `children[2]`, ...)
- A `>>` gomb mindig a főág végére visz (root → children[0] → children[0] → ...)

### 1.3 Navigációs gombok

A history panel alján, az `Új elemzés` gombbal egy sorban (jobbra):

| Gomb | Funkció |
|------|---------|
| `<<` | Visszateker a kezdőállásba (gyökér) |
| `<` | Egy lépést vissza az aktuális ágon (szülő node) |
| `>` | Egy lépést előre (`children[0]` az aktuális node-ból) |
| `>>` | A főág végére ugrik (root → children[0] lánc vége) |

**Viselkedés:**
- `<` mellékágból kiléphet a főágra (szülőre megy, ami főági node lehet)
- `>` mellékágból **nem** ugrik főágra – csak az adott node `children[0]`-jára megy
- Ha nincs gyerek, `>` és `>>` nem csinál semmit

### 1.4 Billentyűzet navigáció

| Billentyű | Akció |
|-----------|-------|
| `→` (jobbra nyíl) | `>` (egy lépés előre) |
| `←` (balra nyíl) | `<` (egy lépés vissza) |
| `↑` (fel nyíl) | `<<` (kezdőállásba) |
| `↓` (le nyíl) | `>>` (főág vége) |

Globális keydown listener az oldalon (de ne aktiválódjon ha input mezőben van a fókusz).

### 1.5 Egérgörgő navigáció (csak ha a tábla felett van a kurzor)

| Görgetés | Akció |
|----------|-------|
| Fel | `<` (egy lépés vissza) |
| Le | `>` (egy lépés előre) |

A `ChessBoard.vue`-ban `@wheel.prevent` esemény, amit csak akkor kezel, ha `mouseenter` szerint a kurzor a táblán van.

---

## 2) Elemzői mód változások

### 2.1 Eltávolított elemek
- `Fekete` / `Fehér` feliratok a tábla mellett **eltávolítva**
- Eval bar `Fekete` / `Fehér` feliratai **eltávolítva**
- Sakk-matt / döntetlen **overlay eltávolítva** (nincs győztes elemző módban)

### 2.2 Matt esetén
- A király mezője **marad piros** (chessground `check` state aktív)
- Egyik figurával sem lehet lépni (chessground `movable.color: undefined`)
- Nincs overlay, nincs szöveg

### 2.3 Gomb átnevezés
- `Új játék` → **`Új elemzés`**
- Funkciója: visszaállítja a kezdőállást, törli a teljes fa struktúrát és az összes vonalat

---

## 3) Stockfish nyilak fejlesztése (multi-arrow thickness)

### 3.1 Logika

```ts
const gap = Math.abs(lines[0].score.value - lines[1]?.score.value ?? 99)

// Ha a gap >= 5: csak a legjobb nyíl jelenik meg
// Ha gap < 5: mindhárom nyíl megjelenik, vastagság arányos

const clampedGap = Math.max(0, Math.min(5, gap))
// ratio: 0 = gap=5 (nagyon vékony), 1 = gap=0 (majdnem ugyanolyan vastag)
const ratio = (5 - clampedGap) / 5

// Best arrow: mindig teljes vastagság
bestLineWidth = 12, bestOpacity = 0.85

// Second/third arrow:
secondLineWidth = Math.round(ratio * 10 + 2)  // 2-12 között
secondOpacity = ratio * 0.7 + 0.15            // 0.15-0.85 között

// Ha gap >= 5: second/third nem jelenik meg
```

### 3.2 Chessground custom brushes

Chessground `drawable.brushes` record dinamikusan állítandó be `cg.set()`-tel minden értékelés-frissítésnél:

```ts
cg.set({
  drawable: {
    brushes: {
      bestArrow:    { key: 'bestArrow',    color: '#15781B', opacity: 0.85, lineWidth: 12 },
      secondArrow:  { key: 'secondArrow',  color: '#15781B', opacity: computedOpacity2, lineWidth: computedWidth2 },
      thirdArrow:   { key: 'thirdArrow',   color: '#15781B', opacity: computedOpacity3, lineWidth: computedWidth3 },
    },
    shapes: [
      { orig: line1.bestMove.slice(0,2), dest: line1.bestMove.slice(2,4), brush: 'bestArrow' },
      ...(gap < 5 && line2 ? [{ ..., brush: 'secondArrow' }] : []),
      ...(gap < 5 && line3 ? [{ ..., brush: 'thirdArrow' }] : []),
    ]
  }
})
```

---

## 4) Architektúra változások

### 4.1 Új típus – `types/chess.ts`

```ts
export interface MoveNode {
  id: string                    // uuid vagy incrementális id
  fen: string                   // pozíció EZEN lépés UTÁN
  move: {
    from: string
    to: string
    san: string                 // pl. 'Nf3', 'O-O', 'e8=Q'
    promotion?: string
  } | null                      // null = gyökér (kezdőállás)
  parent: MoveNode | null
  children: MoveNode[]          // children[0] = főág folytatása
  moveNumber: number            // teljes lépésszám (1, 2, 3, ...)
  color: 'w' | 'b'             // ki lépett ide
}
```

### 4.2 Új composable – `useChessHistory.ts`

```ts
export function useChessHistory() {
  // Belső chess.js példány a lépésvalidációhoz és SAN generáláshoz
  // Fa gyökere (kezdőállás, move=null)
  const root: MoveNode
  const currentNode = ref<MoveNode>(root)

  // Számított értékek az aktuális pozícióból
  const currentFen = computed(() => currentNode.value.fen)
  const currentGameState = computed<GameState>(...)
  const currentLegalMoves = computed<Map<Key, Key[]>>(...)

  // Lépés hozzáadása az aktuális pozícióhoz
  // Ha már létezik ugyanez a lépés → navigál hozzá (nem duplikál)
  // Ha új lépés → létrehozza és navigál
  function addMove(from: string, to: string, promotion?: string): boolean

  // Navigáció
  function navigateBack(): void       // → parent
  function navigateForward(): void    // → children[0]
  function navigateToStart(): void    // → root
  function navigateToMainEnd(): void  // root → children[0] → ... végéig
  function navigateTo(node: MoveNode): void

  // Reset
  function reset(): void              // törli a fát, visszaáll root-ra

  return {
    root, currentNode, currentFen, currentGameState, currentLegalMoves,
    addMove, navigateBack, navigateForward, navigateToStart, navigateToMainEnd, navigateTo,
    reset,
  }
}
```

### 4.3 `useChessGame.ts` kivezetése

Az iteráció végén `useChessGame.ts` **helyébe lép** `useChessHistory.ts`. A `chess.vue` és minden referencia frissítendő.

---

## 5) Új és módosított fájlok

| Fájl | Típus | Változás |
|------|-------|----------|
| `app/types/chess.ts` | módosítás | `MoveNode` interfész hozzáadása |
| `app/composables/useChessHistory.ts` | **ÚJ** | fa struktúra, navigáció, chess.js integráció |
| `app/composables/useChessGame.ts` | törlés/merge | `useChessHistory`-ba olvad |
| `app/components/chess/ChessMoveHistory.vue` | **ÚJ** | lépéslista megjelenítése fa struktúrával |
| `app/components/chess/ChessNavControls.vue` | **ÚJ** | `<<` `<` `>` `>>` gombok |
| `app/components/chess/ChessBoard.vue` | módosítás | scroll wheel, multi-arrow brushes |
| `app/components/chess/ChessAnalysisLines.vue` | módosítás | kisebb UI finomítások ha szükséges |
| `app/components/chess/ChessLayout.vue` | módosítás | új layout: history panel integrálva |
| `app/components/chess/ChessStockfishEval.vue` | módosítás | Fekete/Fehér feliratok eltávolítása |
| `app/pages/chess.vue` | módosítás | billentyűzet listener, `useChessHistory` |

---

## 6) History panel layout

```
[ eval bar ] [ tábla (bal) ] [ history + nav (jobb) ]

Jobb panel:
┌─────────────────────────────┐
│  1.  e4          e5         │  ← főág
│  2.  Nf3         Nc6        │  ← főág (aktív kiemelve)
│        Nf6                  │  ← mellékág (kisebb, behúzva)
│  3.  Bb5                    │
│                             │
│  [Új elemzés]  [<<][<][>][>>]│
└─────────────────────────────┘
```

A history panel magassága = a tábla magassága, scrollozható ha sok lépés van.

---

## 7) Elfogadási kritériumok

- [ ] Lépések megjelennek a history panelben, megszámozva
- [ ] Visszatekert lépés kiemelve látszik a listában
- [ ] Mellékág kisebb betűvel jelenik meg a szülő lépés alatt
- [ ] `<<` `<` `>` `>>` gombok működnek
- [ ] Billentyűzet navigáció működik (nyíl gombok)
- [ ] Egérgörgő navigáció működik ha a kurzor a táblán van
- [ ] Matt esetén nincs overlay, a király piros marad, nem lehet lépni
- [ ] Nincs `Fekete`/`Fehér` felirat
- [ ] `Új elemzés` törli a fát és visszaállítja a kezdőállást
- [ ] Stockfish nyilak vastagsága arányos a score különbségekkel
- [ ] Ha a gap >= 5, csak a legjobb nyíl látszik
