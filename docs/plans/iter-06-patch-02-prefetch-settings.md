# Iteráció 06 – patch-02: Előtöltés a beállításokhoz igazítva + UI szövegek

## Probléma

- A háttérben 2 állás töltődött elő a keresés indításakor érvényes beállításokkal; ha a felhasználó közben módosított (megnyitás, mód, előny), a „Következő” még a régi beállítás szerinti állásokat hozta.
- A „(n/15)” számláló azt a félreértést keltette, hogy 15 állás töltődik le – valójában ez a max. kiértékelt jelölt, az első megfelelőnél megáll.
- Felesleges „Elemzés a Lichessen” link; a login szöveg „erős játékosok”-at említett (rating szűrő patch-01 óta nincs).

## Megoldás

| Fájl | Változás |
|------|----------|
| `app/composables/useTrainingSession.ts` | `PREFETCH = 1`; `watch(settings)` → 400 ms debounce után `invalidateQueue()`: `generation++`, queue ürítés, új `fillQueue()` (futó keresés a `finally`-ben új generációval újraindul, ready/answered állapotban is) |
| `app/components/chess/ChessTrainingPanel.vue` | Lichess elemző link + `analysisUrl` törölve, csak a játszma-link marad |
| `app/pages/training.vue` | Login szöveg: „Valódi Lichess-játszmákból kapsz állásokat” |
