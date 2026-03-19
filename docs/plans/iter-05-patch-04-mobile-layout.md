# iter-05-patch-04: Mobile layout fix + hamburger menü

## Problémák

1. **Fehér csík jobbra (analysis + game)** — panelek `mx-2` margója + sakktábla `w-full` = overflow
2. **Chessground koordináták elcsúszva** — alap CSS `top: -20px` és `left: 24px` offset külső padding nélkül
3. **Nav linkek szétcsúsztak mobilon** — minden link mindig látható, nincs hamburger menü
4. **Navbar nem sticky** — scroll-nál eltűnt
5. **Fehér/Fekete feliratok feleslegesek** a Játék részen

## Megoldások

### Mobile overflow fix
- `default.vue`: `overflow-x-hidden` a gyökér div-en
- `ChessLayout.vue`, `ChessGame.vue`: eltávolítva `px-2 lg:px-0` és `mx-2 lg:mx-0`
- Minden elem teljes szélességű mobilon, panelek `rounded-none lg:rounded-lg`

### Chessground koordináta fix
- `ChessBoard.vue` CSS override: `coords.ranks { top: 0 }`, `coords.files { left: 0; bottom: 0 }`
- Koordináták a mezők szélén belül, nem kívül

### Hamburger menü
- `AppNav.vue`: desktop nav linkek `hidden lg:flex`, hamburger gomb `lg:hidden`
- Drawer: `fixed right-0 w-64 bg-gray-800 z-50`, kártya-szerű gombok
- Vue `<Transition>` slide-in animáció, overlay, route-váltáskor automatikusan zárul

### Egyéb
- "♟ Chessy" → "♟ iChessy", nem kattintható (`NuxtLink` → `span`)
- Sticky navbar: `sticky top-0 z-30`
- Fehér/Fekete feliratok eltávolítva a `ChessGame.vue`-ból

## Érintett fájlok

- `app/components/AppNav.vue`
- `app/components/chess/ChessBoard.vue`
- `app/components/chess/ChessLayout.vue`
- `app/components/chess/ChessGame.vue`
- `app/components/chess/ChessGameControls.vue`
- `app/components/chess/ChessFenPgnLoader.vue`
- `app/layouts/default.vue`
