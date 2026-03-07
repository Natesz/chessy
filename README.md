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
- **Lépés history** – az összes lépés megjelenik számozva, a mellékágak zárójelben jelennek meg (egyszerű mellékág egy sorban, összetett blokkban), szintenként kisebb betűmérettel
- **Visszajátszás** – a history bármely pontjára lehet kattintani, nyílbillentyűkkel és egérgörgővel is navigálható
- **Elemzői mód** – matt esetén nincs zavaró felirat, a király piros marad

---

## Tervezett funkciók

- Ellenfél-felkészítő (korábbi partik elemzése)
- Puzzle trainer
- Személyes statisztika dashboard
- Versenyszervezés (svájci rendszer)
