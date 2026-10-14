# Iteráció 06 – patch-04: Puzzle-keresés javítás + ELO csúszka

## Probléma

1. Puzzle mód nem talált állást: Jobava London, 10–15. lépés, egyenlő < 1, gap ≥ 1, előny 1–5.5.
2. Kérés: ELO szerinti szűrés csúszkával, 100-as lépésekkel.

## Diagnózis (valódi TV-játszmákon mérve, ideiglenes naplózással)

- **Bug:** `screenSettings()` a gyors szűréshez az `equalThreshold`-ot *növelte* (+0.7). A puzzle feltétele `bestStm ≥ max(minAdvantage, equalThreshold)`, így szűréskor a puzzle alsó határa 1 → 1.7-re **szigorodott**; a jó jelöltek (pl. +1.39 vs −2.81) már a szűrésen kiestek.
- **Mintavétel:** játszmánként csak 2 véletlen állás, összesen max 15 → a ritka puzzle-állások jellemzően kimaradtak.

## Megoldás

| Fájl | Változás |
|------|----------|
| `app/composables/useTrainingSession.ts` | `classifyPosition(turn, lines, s, margin = 0)`: margin minden határt megengedő irányba tol (min −, max +, gap −, puzzle alsó határ −, onlymove küszöb +); `screenSettings` törölve. Játszmánként a szakasz **összes** állása gyors szűrés (depth 10), esélyesekből max 3 mély ellenőrzés (depth 20); `MAX_GAMES = 25`; MultiPV 3 → 2 (csak best vs second kell). ELO: `ELO_MIN = 800`/`ELO_CAP = 2800` (= nincs korlát), `ratingGroups()` → explorer `ratings` csoportok, `eloOk()` → két játékos átlaga a tartományban |
| `app/composables/useLichessApi.ts` | `EXPLORER_RATING_GROUPS`; `fetchExplorer(play, ratings)` |
| `app/types/training.ts` | `minElo`, `maxElo` |
| `app/components/chess/ChessTrainingSettings.vue` | Értékszám (átlag) min/max csúszka, `step="100"` |
| `app/components/chess/ChessTrainingPanel.vue` | Számláló: „játszma n/25” |

## Mérés

35 valódi Lichess TV-játszma, a felhasználó beállításaival: puzzle-állás 6.5 s és 3.5 s alatt (javítás előtt: 10 játszma után „nincs találat”).
