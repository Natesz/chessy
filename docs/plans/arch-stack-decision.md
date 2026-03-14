# Architekturális döntés: Supabase + Vercel + Nuxt 4 stack

**Dátum:** 2026-03-07
**Típus:** Architekturális döntés (nem iteráció, nem patch)

---

## Döntés

A chessy projekt technológiai alapja:
- **Frontend:** Nuxt 4 (Vercel-re deployolva, serverless)
- **Backend/DB:** Supabase (PostgreSQL, ingyenes tier)
- **Auth:** Supabase Auth (ha szükséges)

Lichess-stílusú alternatív stack (Scala/MongoDB/bare metal) nem szükséges — más use case, más skála.

---

## Indok

| Szempont | Lichess | Chessy |
|----------|---------|--------|
| Napi forgalom | 4M+ játék | 1-10 felhasználó |
| Real-time igény | WebSocket, ms latency | nem szükséges |
| Infrastruktúra | Bare metal, JVM | Serverless, Vercel |
| DB | MongoDB (document) | PostgreSQL (relational, structured) |
| Skálázás | Horizontális, komplex | Supabase ingyenes tier elegendő |

A chessy egy personal tool, ahol a strukturált adat (puzzle progress, user settings, saved analyses) jól illeszkedik relációs modellbe. Serverless deployment (Vercel) elegendő a terheléshez.

---

## Tervezett DB modulok

| Modul | Tárolt adat | Supabase tábla |
|-------|-------------|----------------|
| Puzzle trainer | megoldott puzzle-ök, rating, streak | `puzzle_attempts` |
| Personal stats | saját játékok (AI ellen), eredmények | `games` |
| Opponent prep | mentett elemzések, jegyzetek | `opponent_notes` |
| User settings | board téma, preferenciák | `user_settings` |

---

## Fontos korlát

**Lichess puzzle DB (~4M rekord) NEM kerül Supabase-be.**

- Supabase ingyenes tier: 500MB limit
- Megoldás: Lichess Puzzle API on-demand hívás, csak user progress tárolva lokálisan

---

## Érintett fájlok

Jelenleg nincs Supabase-specifikus kód a projektben. Ez a döntés a jövőbeli modulok implementálásához ad irányvonalat.

Releváns spec fájlok:
- `docs/specs/analysis.md`
- `docs/specs/opponent-prep.md`
- `docs/specs/puzzle-trainer.md`
- `docs/specs/swiss.md`
