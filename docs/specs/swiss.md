# Spec: Svájci rendszer lebonyolítás

## Cél
Helyi sakkversenyek lebonyolítása svájci párosítási rendszerrel.

## Tervezett funkciók
- Játékos lista kezelés (hozzáadás, törlés, szerkesztés)
- Automatikus svájci párosítás fordulatonként
- Eredmények rögzítése (1-0, 0-1, 1/2-1/2)
- Állástábla (pontszám, Buchholz)
- Verseny export (PDF / nyomtatható nézet)

## Elfogadási kritériumok
- Minimum 4, maximum 64 játékos
- Legalább 5 forduló kezelése
- Adatok Supabase-ben tárolva (perzisztens)
