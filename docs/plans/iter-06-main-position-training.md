# Iteráció 06 – Pozíció-értékelő edzés (`/training`)

## Összefoglaló

chessevaluationtraining.com-szerű edzőmód: valódi, erős játékosok Lichess-játszmáiból vett állás → „Ki áll jobban?” (Világos / Egyenlő / Sötét) → pont + link a Lichess-játszmához a pontos fél-lépésnél. Extra: megnyitás-szűrés, állítható előny-tartomány, puzzle-típusú és „egyensúly, de csak egy lépés tartja” állások.

## Adatfolyam

1. Megnyitás (preset vagy egyedi SAN) → UCI (`parseOpeningMoves`, chess.js).
2. Explorer random walk: `explorer.lichess.ovh/lichess?play=…&ratings=…&speeds=blitz,rapid,classical`; a megnyitás végétől 0–4 (üres megnyitásnál 4–10) további fél-lépés, játszmaszám szerint súlyozva (min. 20 játszma/lépés). Végpont `topGames` + `recentGames`.
3. `lichess.org/game/export/{id}` (JSON) → SAN lépéssor visszajátszása; jelöltek a `[max(minPly, walk+2), maxPly]` tartományban, opcionálisan csak nyugodt állás (nincs sakk, előző lépés nem ütés); max 2 jelölt / játszma.
4. `useStockfishEvaluator.evaluate(fen, depth, 3)` – saját worker, sorba állított `go depth N`.
5. `classifyPosition()` (`useTrainingSession.ts`), lépő fél szemszögű gap = best − second:
   - classic: `min ≤ |eval| ≤ max` → előnyben lévő fél (vagy Egyenlő, ha `|eval| < equalThreshold`)
   - puzzle: `gap ≥ G` és lépő előnye `≥ max(min, equalThreshold)` → lépő fél
   - onlymove: `gap ≥ G` és `|eval| < equalThreshold` → Egyenlő
   - mixed: puzzle → onlymove → classic sorrendben
6. Max 15 kiértékelt jelölt / feladvány, utána hibaüzenet („lazíts a szűrőkön”).
7. Előtöltés: 2 állás a háttérben; beállítás-váltás → `generation++`, stale eredmények eldobva.

## Lichess hozzáférés

- Az explorer API 2025 óta OAuth tokent kér (401 nélküle) → **OAuth2 PKCE** a böngészőben (`useLichessAuth.ts`), client_id = `ichessy` (Lichess nem kér regisztrációt), redirect `/<origin>/training`, scope nélkül. Token localStorage-ban (`chessy-lichess-auth`), 401 → automatikus kijelentkeztetés.
- `useLichessApi.ts`: minden kérés egy Promise-láncon sorban (Lichess előírás), 429 → 60 s várakozás + 1 újrapróbálás, explorer/game válaszok memóriában cache-elve.
- Lichess Open Database letöltés nincs – csak élő API hívások (projektszabály).

## Fájlok

| Fájl | Változás |
|------|----------|
| `app/pages/training.vue` | Új oldal: nem mozgatható `ChessBoard` (lépő fél felől) + jobb oldali panel (login / feladvány / beállítások / statisztika) |
| `app/components/chess/ChessTrainingPanel.vue` | Válaszgombok (1/2/3), eredmény, eval, megoldás-sorok kérésre, Lichess linkek (`/{id}[/black]#{ply}`, `/analysis/standard/{fen}`), Következő (Space) |
| `app/components/chess/ChessTrainingSettings.vue` | Megnyitás, mód, előny min/max (10 = nincs korlát), gap, egyenlő-küszöb, fél-lépés tartomány, min. rating, mélység, nyugodt állás |
| `app/components/chess/ChessTrainingStats.vue` | Pont, pontosság, sorozat, rekord; típusonként és megnyitásonként |
| `app/composables/useLichessAuth.ts` | PKCE login / callback / logout, singleton state |
| `app/composables/useLichessApi.ts` | `fetchExplorer`, `fetchGame`, szekvenciális queue, 429/401 kezelés |
| `app/composables/useStockfishEvaluator.ts` | Promise-alapú, sorba állított Stockfish értékelő (saját worker, `bound` info sorok kihagyva) |
| `app/composables/useTrainingSession.ts` | Generálási pipeline, osztályozás, előtöltés, válasz, statisztika + beállítások localStorage-ban |
| `app/utils/openings.ts` | `OPENING_PRESETS` (19 + „Bármilyen”), `parseOpeningMoves()` |
| `app/utils/uci.ts` | `uciMovesToSan`, `parseUciScore`, `evalToNumber` (matt = ±(100−n)), `formatEval` |
| `app/composables/useStockfish.ts` | Refaktor: a közös `uci.ts` helpereket használja (viselkedés változatlan) |
| `app/types/training.ts` | Training típusok |
| `app/components/AppNav.vue` | „Edzés” link |
| `tests/e2e/training.spec.ts` | Login kártya, nav link, mockolt explorer + game export → válasz → Lichess link + statisztika |
