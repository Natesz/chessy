# Spec: Ellenfél felkészülés (Lichess API)

## Cél
Adott Lichess felhasználónév alapján az ellenfél nyitási repertoárjának elemzése.

## Tervezett funkciók
- Lichess username megadása
- Az ellenfél leggyakoribb nyitásai fehérrel és feketével
- Leggyakrabban játszott folytatások vizualizálása a táblán
- Gyenge pontok azonosítása (alacsony nyerési arány egyes variációkban)

## Elfogadási kritériumok
- Lichess public API alapján dolgozik (nincs API kulcs szükséges)
- Eredmények cache-elve (ne hívjuk újra ugyanazt a felhasználót)
