# iter-04-patch-01 — Layout wrapper és nyíl láthatóság javítás

**Dátum:** 2026-03-14
**Típus:** Patch

---

## Probléma

Iteráció 04 után három vizuális hiba:
1. Top nav nem látszott — `app/layouts/default.vue` megvan, de Nuxt csak `<NuxtLayout>` wrapperrel alkalmazza
2. Sötét háttér (`bg-gray-900`) nem érvényesült — szintén a hiányzó wrapper miatt
3. Stockfish nyilak elvesztek — opacity 0.65 túl halvány volt a sötét háttéren

---

## Változások

### `app/app.vue`
- `<NuxtPage />` → `<NuxtLayout><NuxtPage /></NuxtLayout>`
- Ez egyszerre javítja a top nav és háttérszín problémát

### `app/components/chess/ChessBoard.vue`
- `arrow1` opacity: `0.65` → `0.75`
- `arrow2` opacity képlet: `ratio12 * 0.4 + 0.15` → `ratio12 * 0.45 + 0.15`
- `arrow3` opacity képlet: `ratio13 * 0.35 + 0.15` → `ratio13 * 0.40 + 0.15`

---

## Érintett fájlok

| Fájl | Változás |
|------|----------|
| `app/app.vue` | `<NuxtLayout>` wrapper hozzáadva |
| `app/components/chess/ChessBoard.vue` | arrow1/2/3 opacity növelve |
