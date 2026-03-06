# Chess App – Projekt összefoglaló (kontextus fájl)

Ez a fájl a chess app tervezési döntéseit és jövőbeli irányát rögzíti.
Olvasd be új munkamenet elején, hogy legyen kontextus.

---

## Projekt célja

Egy személyes sakk-platform, amit egy üzleti/IT előadáson fogok bemutatni ~2 hónap múlva.
Célközönség: tesztelők, frontend fejlesztők, backend fejlesztők, menedzsment/üzleti oldal.

Miért sakk: személyesen érdekel, és elég komplex ahhoz, hogy komoly fejlesztési demo legyen.

---

## Tervezett modulok (teljes scope, nem egyszerre)

| Modul | Célközönség a demón | Prioritás |
|-------|--------------------|-----------|
| Interaktív tábla + Stockfish elemzés | Tesztelők (szabályvalidáció) | 1. iteráció |
| Ellenfél-felkészülés (Lichess API) | Backend fejlesztők | Később |
| Puzzle trainer (Lichess puzzle API) | Frontend, interaktivitás | Később |
| Személyes statisztika dashboard | Menedzsment, üzleti oldal | Később |
| Versenyszervezés (svájci rendszer) | Komplex logika demo | Később |
| Versenynaptár (chess.results.com scraping) | Valós adat integráció | Később |

---

## Tech stack

- **Nuxt 4** (srcDir = `app/`), TypeScript strict
- **Tailwind CSS** – layout és stílus
- **Pinia** – state management
- **Supabase** – backend (ingyenes tier, csak saját adatokhoz kell)
- **chessground** – interaktív sakktábla UI (Lichess-alapú, vanilla JS)
- **chess.js** – sakk szabálymotor (legális lépések, FEN, PGN)
- **Stockfish WASM** – pozícióelemző motor, böngészőben Web Worker-ként fut

---

## Kulcsdöntések

**Lichess API használat:** API hívásokkal, semmi tárolni való a Supabase-ben.
A Lichess Open Database (milliárd meccs, több száz GB) NEM kerül letöltésre/tárolásra.
Lekérdezések: játékos neve → partik, megnyitó statisztikák, pozíció explorer.

**Stockfish:** npm package-ként, WASM verzió, Web Worker-ben fut – nem blokkolja a UI-t.

**chessground + chess.js szétválasztás:**
- `chess.js`: a játék állapota, szabályok, FEN, lépésvalidáció
- `chessground`: csak megjelenítés + drag-and-drop UI, mindig `chess.js`-ből kapja a legális lépéseket

**Nem replikáljuk a MEKKK-et:** más projekt, más könyvtár, más Supabase projekt.

---

## Iteráció 1 – Elkészült / Tervezett

Lásd: `docs/01-prd-chess.md`

Scope:
- Interaktív sakktábla (chessground)
- Csak legális lépések (chess.js validáció)
- Stockfish értékelés (numerikus + vizuális sáv)
- "Új játék" reset

Nem tartalmaz: PGN import, legjobb lépés kiemelés, AI ellen játék

---

## Előadás kontextus

Az előadás egy bankban lesz, üzleti oldal + IT menedzsment + fejlesztők jelenlétében.
A demo célja: megmutatni, hogy AI-jal (context engineering + agent) komplex alkalmazás
készíthető iteratív PRD-alapú fejlesztéssel.

A chess app különösen erős demo a tesztelőknek:
- A sakk szabályrendszer jól ismert → könnyű ellenőrizni, hogy az app helyesen viselkedik-e
- A Stockfish integráció látványos és érthető
- A svájci párosítási algoritmus (később) komplex üzleti logikát demonstrál
