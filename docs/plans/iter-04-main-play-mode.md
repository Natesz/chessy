# Iteráció 04 – Top nav + Play mód + Playwright tesztek

**Dátum:** 2026-03-14
**Scope:** Nyílszín patch + Top nav + Playwright tesztek + Play mód (AI + 1v1 Supabase)

---

## Patch A – Nyílszín módosítás

**Érintett fájl:** `app/components/chess/ChessBoard.vue`

- Szín: `#4A90E2` → `#8899BB`
- arrow1 opacity: `0.8` → `0.65`
- arrow2 opacity képlet: `ratio * 0.55 + 0.2` → `ratio * 0.4 + 0.15`
- arrow3 opacity képlet: `ratio * 0.55 + 0.2` → `ratio * 0.35 + 0.15`

---

## 04-A – Top Navigation + Routing

**Új fájlok:**
- `app/layouts/default.vue` — AppNav + slot wrapper
- `app/components/AppNav.vue` — ♟ Chessy · Elemzés · Játék · Puzzle (disabled); aktív tab amber border
- `app/pages/index.vue` — redirect `/analysis`-ra
- `app/pages/analysis.vue` — `chess.vue` tartalma, h1 és outer div eltávolítva

**Módosított fájlok:**
- `app/pages/chess.vue` — redirect `/analysis`-ra (backward compat)

---

## 04-B – Playwright E2E tesztek

**CLAUDE.md módosítás:** `Nincsenek tesztek` → Playwright e2e megengedve (`tests/e2e/`)

**Új fájlok:**
- `playwright.config.ts` — Chromium, baseURL 3000, webServer nuxt dev, fullyParallel: false
- `tests/e2e/analysis.spec.ts` — PGN betöltés + gomb-navigáció
- `tests/e2e/navigation.spec.ts` — billentyű-navigáció, ArrowUp → root
- `tests/e2e/fen-pgn.spec.ts` — FEN betöltés + PGN Unicode figura szimbólumok

**data-testid attribútumok:**
| Attribútum | Fájl | Elem |
|------------|------|------|
| `fen-input` | `ChessFenPgnLoader.vue` | FEN input |
| `fen-load-btn` | `ChessFenPgnLoader.vue` | FEN betöltés gomb |
| `pgn-input` | `ChessFenPgnLoader.vue` | PGN textarea |
| `pgn-load-btn` | `ChessFenPgnLoader.vue` | PGN betöltés gomb |
| `move-history` | `ChessMoveHistory.vue` | Scrollable history div |
| `nav-start` | `ChessLayout.vue` | `«` gomb |
| `nav-back` | `ChessLayout.vue` | `‹` gomb |
| `nav-forward` | `ChessLayout.vue` | `›` gomb |

---

## 04-C – Play mód

**Új fájlok:**
- `app/types/game.ts` — GameRoom, PlayerToken, PlayerColor, RoomStatus típusok
- `app/composables/useStockfishPlayer.ts` — depth-limited AI move (getBestMove wrapper)
- `app/composables/useGameRoom.ts` — Supabase Realtime createRoom/joinRoom/sendMove/subscribe
- `app/components/chess/ChessGame.vue` — játék layout (tábla + controls); exposes `applyOpponentMove`, `fen`
- `app/components/chess/ChessGameControls.vue` — 3 fázis: setup/playing/finished
- `app/pages/play.vue` — play mód főoldal; AI flow + live room; invite URL kezelés

**Módosított fájlok:**
- `app/composables/useStockfish.ts` — `getBestMove(fen, depth): Promise<string>` hozzáadva
- `app/composables/useChessGame.ts` — `makeMove()` return: `boolean` → `string | false` (SAN)
- `app/components/chess/ChessBoard.vue` — `orientation`, `movableColor`, `showArrows` props
- `nuxt.config.ts` — `runtimeConfig.public.supabaseUrl/supabaseAnonKey`
- `CLAUDE.md` — Playwright engedélyezve

**Supabase games tábla:**
```sql
CREATE TABLE games (
  game_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fen         TEXT NOT NULL DEFAULT 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  pgn         TEXT NOT NULL DEFAULT '',
  white_token TEXT NOT NULL,
  black_token TEXT NOT NULL DEFAULT '',
  status      game_status NOT NULL DEFAULT 'waiting',
  result      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Megjegyzés:** Supabase 1v1 multiplayer használatához a `SUPABASE_URL` és `SUPABASE_ANON_KEY` env változókat be kell állítani, és a games táblát létre kell hozni a Supabase dashboardon.
