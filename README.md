# Chessy

Személyes sakk-platform, amelyet egy üzleti/IT bemutatóra készítek. A cél: megmutatni, hogy AI-asszisztált, iteratív fejlesztéssel komplex alkalmazás hozható létre.

---

## Jelenlegi állapot

### Interaktív sakktábla és elemző eszköz

Az alkalmazás jelenleg egy teljes értékű sakktáblát tartalmaz, amelyen:

- **Figurák mozgathatók** – kattintással vagy húzással, csak szabályos lépések engedélyezettek
- **Automatikus pozícióelemzés** – minden lépés után a Stockfish motor kiértékeli az állást
- **Értékelési sáv** – vizuálisan mutatja, melyik félnek van előnye
- **Legjobb lépés jelzése** – nyilak mutatják a Stockfish által javasolt legjobb lépéseket a táblán, vastagsága arányos az értékelési különbséggel
- **Elemzési sorok** – 3 alternatív folytatás jelenik meg értékeléssel és lépésekkel
- **Lépés history** – az összes lépés megjelenik számozva; mellékágak Lichess-stílusban: saját sorban, zárójelek nélkül, belső elágazások zárójelben az adott soron belül
- **Visszajátszás** – a history bármely pontjára lehet kattintani, nyílbillentyűkkel és egérgörgővel is navigálható; gyors görgetésnél sem jelenik meg hibaüzenet
- **Elemzői mód** – matt esetén nincs zavaró felirat, a király piros marad

---

## Legújabb fejlesztések (Iteráció 03)

- **FEN betöltő**: bármilyen sakkállás beilleszthető szövegként (FEN formátum), az alkalmazás azonnal elemezni kezdi
- **PGN betöltő**: teljes parti beilleszthető mellékágakkal együtt, a lépésfa automatikusan felépül, navigálható
- **Figuraikonok**: az elemzési sorokban és a lépés historiban a betűjelölések helyett valódi sakkfigura szimbólumok jelennek meg (♔♕♖♗♘)
- **Élő FEN/PGN**: a jobb oldali panel folyamatosan mutatja az aktuális pozíció FEN-jét és a teljes parti PGN-jét — navigáció közben automatikusan frissül, másolható
- **Jobb-klikkes annotációk**: a táblán rajzolt körök és nyilak megmaradnak az elemzési frissítések során

---

## Responsive design (Iteráció 04 – patch-08)

- **Mobil és tablet támogatás** – az alkalmazás mostantól telefonon és tableten is használható; a sakktábla teljes szélességben jelenik meg, az elemzési panelek és a játékvezérlők alatta sorakoznak vertikálisan

---

## Vercel deployment fix (Iteráció 04 – patch-07)

- **Stockfish motor javítva Vercelen** – a sakkmotor korábban csak lokálisan futott, mert egy szükséges bináris fájl kimaradt az online verzióból; most a build automatikusan tartalmazza, így az elemzés és az AI elleni játék Vercelen is működik

---

## Legújabb javítások (Iteráció 04 – patch-05)

- **Elemzési nyilak javítva** – az elemzési nyilak most már megbízhatóan megjelennek a táblán; a javítás elkülöníti a pozíció- és nyíl-frissítést, így nincs versenyhelyzet a chessground belső animációs rendszerével

---

## Legújabb javítások (Iteráció 04 – patch-04)

- **Elemzési nyilak végleg javítva** – a chessground belső útvonal-optimalizáció miatt a nyilak korábban nem rajzolódtak újra; a dedikált API-ra váltással ez megoldódott

---

## Legújabb javítások (Iteráció 04 – patch-03)

- **Elemzési nyilak javítva** – a /analysis oldalon a Stockfish nyilak ismét megjelennek a táblán a legjobb lépésekre mutatva
- **Kattintásbug javítva** – a /play oldalon most a megfelelő figura jelölődik ki kattintásra
- **Játszmalap panel** – a lépéslista fix szélességű és helyes sorrendben jelenik meg; az első lépés előtt is látható a "JÁTSZMALAP" felirat

---

## Legújabb javítások (Iteráció 04 – patch-02)

- **Játék tábla mérete javítva** – a /play oldalon a sakktábla most megfelelő méretben jelenik meg
- **Lépés history a játék oldalon** – a tábla mellett folyamatosan látható a lépéslista; meccs végén PGN másolható
- **Elemzés megnyitása gomb** – meccs után egyetlen kattintással átlép az elemző módba, a parti automatikusan betöltődik

---

## Legújabb javítások (Iteráció 04 – patch-01)

- **Navigációs sáv és sötét háttér visszaállt** – egy technikai hiba miatt a fejlécmenü és a sötét téma nem jelent meg; ez kijavításra került
- **Elemzési nyilak jobban látszódnak** – a Stockfish nyilak átlátszósága kismértékben nőtt a sötét háttéren

---

## Legújabb fejlesztések (Iteráció 04)

- **Navigációs menü**: az oldal tetején megjelent egy menüsáv — Elemzés, Játék és (hamarosan) Puzzle módok között lehet váltani
- **Játék mód**: a /play oldalon lehet játszani a Stockfish motor ellen, vagy élő 1v1 játékot indítani megosztható link segítségével (Supabase alapú szinkronizálás)
- **Halványabb elemzési nyilak**: a Stockfish nyilak visszafogottabb, szürke-kék árnyalatot kaptak, kevésbé vonják el a figyelmet
- **Automatizált tesztek**: e2e tesztek kerültek a projektbe, amelyek ellenőrzik a FEN/PGN betöltést és a navigációt

---

## Tervezett funkciók

- Ellenfél-felkészítő (korábbi partik elemzése)
- Puzzle trainer
- Személyes statisztika dashboard
- Versenyszervezés (svájci rendszer)
