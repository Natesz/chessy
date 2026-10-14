# Iteráció 06 – patch-01: Játszma letöltés javítása + szűrők egyszerűsítése

## Hiba

Az edzés indításakor hibaüzenet. HAR alapján az explorer hívások rendben voltak (`play=e2e4,c7c6` → Caro-Kann szűrés helyes, a visszaadott játszmák mind ezzel a két lépéssel indulnak), de a játszma letöltése elbukott:

- `GET lichess.org/game/export/{id}` + `Authorization` fejléc → CORS preflight (OPTIONS) → **404**
- ugyanez auth fejléc nélkül → több játszmánál **401 „Login required”**

## Megoldás

| Fájl | Változás |
|------|----------|
| `app/composables/useLichessApi.ts` | Új `fetchGames(ids)`: `POST /api/games/export/_ids` (`Content-Type: text/plain`, auth fejléc nélkül → simple request, nincs preflight), ndjson válasz soronként cache-be; `fetchGame(id)` erre épül és `null`-t ad, ha nincs. Explorer hívásból `ratings`/`speeds` paraméter törölve. |
| `app/composables/useTrainingSession.ts` | Explorer csomópont összes friss játszmája egy hívással töltődik le; fix `ENGINE_DEPTH = 16`; `minRating` eltávolítva |
| `app/types/training.ts` | `minRating`, `depth` mező törölve |
| `app/components/chess/ChessTrainingSettings.vue` | Min. értékszám + gép mélység választó eltávolítva |
| `tests/e2e/training.spec.ts` | Mock: `POST /api/games/export/_ids` ndjson |
| `.gitignore` | `HAR/` (tokent tartalmazhat) |
