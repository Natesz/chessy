# Spec: Puzzle tréner (Lichess puzzle API)

## Cél
Napi sakkfeladvány megoldás Lichess puzzle adatbázis alapján.

## Tervezett funkciók
- Véletlenszerű puzzle betöltés (Lichess puzzle API)
- Interaktív megoldás (drag-and-drop, helyes/helytelen visszajelzés)
- Nehézségi szint szűrő (rating alapján)
- Megoldott puzzle-ok számlálója (Supabase)

## Elfogadási kritériumok
- Offline fallback: lokálisan cachelt puzzle-ok
- Helyes megoldásnál zöld visszajelzés, hibánál piros + megoldás megjelenítése
