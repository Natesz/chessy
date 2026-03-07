# Patch 02-01 – Mellékág megjelenítési hibák és hierarchikus nesting

**Iteráció:** 02
**Patch sorszám:** 01
**Státusz:** Tervezett

---

## Problémák és elvárások

### 1. Bug: Mellékágban a fekete lépés eltűnik

**Leírás:**
Ha az elemző módban visszanavigálsz egy korábbi pozícióba és új lépést teszel (ezzel új mellékágat nyitsz), a fehér lépés megjelenik a history-ban, de az azt követő fekete válasz már nem.

**Reprodukció:**
1. Lépések: `1. e4 e5 2. Hf3 Hc6` (főág)
2. Visszanavigálás `1. e4 e5` pozícióra
3. Fehér lép: `2. Hc3` → megjelenik
4. Fekete lép: `2... Hf6` → **nem jelenik meg**

**Elvárt viselkedés:**
A mellékág minden lépése – fehér és fekete egyaránt – megjelenik a history-ban, ugyanúgy ahogy a főágon.

**Valószínű ok:**
A `useChessHistory.ts` fa-struktúrában az új csomópont felvételekor a szülő-gyermek kapcsolat vagy az aktuális csomópont mutatója (currentNode) nem frissül helyesen fekete lépésnél mellékágban.

---

### 2. Layout: Mellékág behúzás iránya

**Jelenlegi viselkedés:**
A mellékágak középre tolódnak be, ami sok egymást követő mellékágnál hamar zsúfolttá válik, és a tartalom nehezen olvasható.

**Elvárt viselkedés:**
A mellékágak balra igazodnak (bal szélhez közelebb), és jobbra húzódnak beljebb szintenként. Ez a sakk PGN-olvasókban bevett elrendezés: a főág a bal szélen, minden egyes mellékágszint egy lépéssel jobbra tolva.

---

### 3. Mellékágak hierarchikus megjelenítése és betűméret

**Szabályrendszer szintenként:**

#### 1. szintű mellékág (főág alatt, első elágazás)
- Megjelenítés: **zárójelben, inline** a főág sorával azonos sorban
- Példa: `1. e4 e5 2. Hf3 (2. Hc3 Hf6) 2... Hc6`
- Ha ennél a szintnél nincs mélyebb mellékág, csak zárójel kell, külön sor nem

#### 2. szintű mellékág (mellékágon belüli elágazás)
- Ettől a szinttől a mellékág **új sorba kerül**, kissé jobbra behúzva az 1. szintűnél
- Az 1. szintű mellékág a zárójelezett formájában is megmarad, de alatta jelenik meg az új sor
- A 2. szintű mellékág szintén zárójelbe kerül, de már saját sorban

#### 3. szintű és mélyebb mellékágak
- Ugyanúgy, mint a 2. szintű: külön sorban, újabb behúzással jobbra
- A betűméret nem csökken tovább (lásd lent)

#### Betűméretek
| Szint | Méret |
|-------|-------|
| Főág | `text-sm` (alap) |
| 1. szintű mellékág | `text-xs` |
| 2. szintű mellékág | `text-[11px]` (vagy legkisebb olvasható) |
| 3. szint és mélyebb | ugyanakkora, mint 2. szintű |

---

## Érintett fájlok

| Fájl | Változás |
|------|---------|
| `app/components/chess/ChessMoveHistory.vue` | Megjelenítési logika, behúzás, betűméretek, zárójeles/soros nesting |
| `app/composables/useChessHistory.ts` | Bug fix: currentNode frissítés mellékágban fekete lépésnél |

---

## Elfogadási kritériumok

- [ ] Mellékágban a fekete lépés is megjelenik a history-ban
- [ ] A mellékágak bal oldali igazítással, jobbra növekvő behúzással jelennek meg
- [ ] Egyetlen mellékág szintje → inline zárójelben, nincs külön sor
- [ ] Ha a mellékágban újabb mellékág van → az első mellékág zárójeles formája megmarad, alatta új sorban jelenik meg a belső mellékág
- [ ] Betűméret: főág > 1. mellékág > 2.+ mellékág (de 2. és mélyebb azonos)
- [ ] Több egymást követő mellékág esetén sem csúszik szét az elrendezés
