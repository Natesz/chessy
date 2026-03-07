# iter-03-patch-03 — Lichess-stílusú engine nyíl: szín módosítás

## Összefoglaló
Az engine nyilak szürke (`#c0c0c0`) színéről Lichess-kékre (`#4A90E2`) változtak, finomhangolt opacity értékekkel.

## Érintett fájl
`app/components/chess/ChessBoard.vue` — `computeArrows()` függvény

## Változtatások

| Brush | Tulajdonság | Előtte | Utána |
|-------|-------------|--------|-------|
| arrow1 | color | `#c0c0c0` | `#4A90E2` |
| arrow1 | opacity | `0.9` | `0.8` |
| arrow2 | color | `#c0c0c0` | `#4A90E2` |
| arrow2 | opacity képlet | `ratio12 * 0.6 + 0.2` | `ratio12 * 0.55 + 0.2` |
| arrow3 | color | `#c0c0c0` | `#4A90E2` |
| arrow3 | opacity képlet | `ratio13 * 0.6 + 0.2` | `ratio13 * 0.55 + 0.2` |

A vastagság-logika (arrow1=18, arrow2≤12, arrow3≤10) változatlan maradt.

## Indok
A szürke szín vizuálisan nem volt meggyőző. A Lichess-kék (`#4A90E2`) jobban illeszkedik a Lichess-stílusú UI-hoz, és egyértelműbbé teszi az engine javaslatokat. Az opacity kicsit csökkent, mert a kék élénkebb szín — kisebb fedéssel is jól látható.
