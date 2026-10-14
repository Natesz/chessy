# Iteráció 06 – patch-06: Saját lépéssor magyar jelöléssel

## Kérés

Max. 10 lépés megadása magyar jelöléssel (pl. `1. d4, d5 2. Hc3, Hf6 3. Ff4, Ff5`), és csak az ezzel induló játszmákból válogasson az edzés. Király K, Vezér V, Bástya B, sánc 0-0 / 0-0-0.

## Megoldás

A meglévő „egyedi lépéssor” (explorer `play` paraméter → csak az ezzel induló játszmák) magyar jelölésre állítva.

| Fájl | Változás |
|------|----------|
| `app/utils/openings.ts` | `hungarianToSan()`: K→K, V→Q, B→R, F→B, H→N; `0-0`/`0-0-0` → `O-O`/`O-O-O`; átváltozás `e8V`/`e8=V` → `e8=Q`; `!?` jelek levágva. `parseOpeningMoves(text, notation)`: vessző/pontosvessző elválasztó, `'hu'` módban max. `MAX_CUSTOM_MOVES = 10` lépéspár; hibaüzenet az eredeti (magyar) lépéssel |
| `app/composables/useTrainingSession.ts` | Egyedi lépéssor `'hu'` jelöléssel parse-olva (presetek továbbra is angol SAN-nal belül) |
| `app/components/chess/ChessTrainingSettings.vue` | „Saját lépéssor…” opció, textarea, magyar jelölés súgó |
| `tests/e2e/training.spec.ts` | `Bf4` bástyaként → hiba; 11 lépés → hiba; sánc + F/H → explorer `play=e2e4,e7e5,g1f3,b8c6,f1c4,f8c5,e1g1,g8f6` |

Megjegyzés: a „B” magyarul bástya, angolul futó, ezért a mező csak magyar jelölést fogad (az angol `N` egyértelmű, az továbbra is működik).
