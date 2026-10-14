# Iteráció 06 – patch-03: Stockfish NNUE (18 lite) + kétlépcsős értékelés

## Probléma

Az edzés értékelései nagyon eltértek a Lichess elemzőtől (pl. +0.7 vs +1.6, −2.6 vs −6).

## Gyökérok

Böngészős próba (`info` kimenet): `info string classical evaluation enabled` – a `stockfish-nnue-16-single` build a NNUE hálót (`nn-5af11540bbfe.nnue`, 40 MB) nem töltötte be (a postinstall csak a JS+WASM-ot másolta), így a régi kézi kiértékeléssel futott. Ez az elemző és a játék oldalt is érintette.

## Lichess oldali alternatívák (megvizsgálva, elvetve)

- `/api/cloud-eval`: csak népszerű pozíciókra van adat (középjátéki állásra 404).
- Játszma szerver-elemzés (`evals=true` → `analysis`): csak a játszmák egy részénél létezik, és csak 1 változat → puzzle/onlymove gap nem számolható.

## Megoldás

| Fájl | Változás |
|------|----------|
| `package.json` | `stockfish` ^16 → ^18.0.8; postinstall: `bin/stockfish-18-lite-single.{js,wasm}` → `public/stockfish/` |
| `app/utils/uci.ts` | `STOCKFISH_WORKER_URL` konstans (18 lite single, beépített ~11 MB NNUE, nincs SharedArrayBuffer igény) |
| `app/composables/useStockfish.ts`, `useStockfishEvaluator.ts` | Worker URL a konstansból (explicit import – a futó dev szerver auto-import registry-je nem frissült) |
| `app/composables/useTrainingSession.ts` | Kétlépcsős értékelés: `SCREEN_DEPTH = 12` lazított határokkal (`SCREEN_MARGIN = 0.7`), majd `CONFIRM_DEPTH = 20` szigorú osztályozással |
| `CLAUDE.md` | Tech stack + worker betöltés frissítve |

Mérés (böngésző, egy szál): NNUE depth 20 ≈ 1.7 s (MultiPV 1).
