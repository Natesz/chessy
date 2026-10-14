# Iteráció 06 – patch-05: Kevesebb Lichess kérés (429 elkerülése)

## Probléma

Puzzle módban gyakran megjelent: „A Lichess lassításra kért – 1 perc szünet” (HTTP 429).

## Ok

`generateOne()` minden vizsgált játszmához új explorer random walkot indított (1 + 0–4 explorer kérés), és bár a csomópont mind a ~8 játszmáját letöltötte egy `_ids` hívással, ebből csak **egyet** használt fel. Puzzle módban (ritka találat, max 25 játszma) ez feladványonként akár 50–100+ gyors egymásutáni kérést jelentett.

## Megoldás

| Fájl | Változás |
|------|----------|
| `app/composables/useTrainingSession.ts` | Új `scanGame()` (egy játszma: gyors szűrés + mély ellenőrzés); a fő ciklus egy séta összes friss játszmáját (keverve) végignézi, mielőtt új explorer-sétát indítana; `MAX_WALKS = 12` felső korlát |
| `app/composables/useLichessApi.ts` | `enqueue()`: sorba állítás + min. `MIN_GAP_MS = 500` szünet két Lichess kérés között |

## Mérés (mock explorer, 35 valódi játszma, puzzle mód)

3 talált állás: explorer kérések 23 → 14, első állásig 10 → 2. Élesben (minden csomópont új játszmákat ad) a megtakarítás ~5–8×.
