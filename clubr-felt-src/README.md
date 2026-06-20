# ClubrGO · "Felt" variant

A premium **poker-luxe** design treatment of the ClubrGO scorekeeper. Same product,
same routes, same data model as the reference `clubr/` app — one new, coherent
**dark felt + chip-gold** design language applied across every route.

This is a **Heavy variant** built per `clubr-variant-kit/BUILD_INSTRUCTIONS.md` §4:
the entire foundation (data, auth, types, hooks, lib, routing) is copied **verbatim**
from the reference `clubr/` app; only the visual layer is reskinned.

## Personality

Deep pine-felt surfaces (`#0B1410`), a single disciplined **chip-gold** accent
(`#E9C46A`), Space Grotesk display + Inter body + IBM Plex Mono for data. No neon,
no dollar signs. Tokens live in `tokens.json` and apply through the existing runtime
CSS-variable theme system. The variant is **locked to one skin** (THEME_LIST collapsed
to Felt, default forced, SkinPicker removed from the Me page).

## Run it

```bash
cd clubr-felt-src
npm install
npm run dev        # local dev
npm run build      # writes the deployable static site to ../clubr-felt/
```

Build config (`vite.config.ts`): `base: '/clubr-felt/'`, `build.outDir: '../clubr-felt'`,
`build.emptyOutDir: true`. So `npm run build` emits `../clubr-felt/index.html` + `assets/`,
served by the gallery at `/clubr-felt/`.

> **Tailwind v4** (CSS-first): wired via `@import "tailwindcss";` in `src/index.css`
> and the `@tailwindcss/vite` plugin. No `tailwind.config.ts` — expected for v4, and
> matches the reference app.

## Copied verbatim (foundation — NOT reinvented)

- `src/data/*` — store, llStore, squaresStore, ftStore, creditsStore, leaderboardStore.
  The `u_player` / `c_aces` / `ll_*` / `sq_*` / `ct_*` namespace is unchanged. Sam Rivers
  stays Sam Rivers (900 credits); Green Felt Club + River Rats are the joinable clubs;
  "Sunday Squares — Texans @ Colts" (Bayou City) and "Saturday Deep Stack Last Longer"
  (Aces High) are the seeded games.
- `src/contexts/AuthContext.tsx` + `src/lib/auth/actingRole.ts` — full role machinery
  (actAs, loginAs, applyActingRole) intact, so role-gating is identical to the reference.
- `src/contexts/ThemeContext.tsx`, `src/types/*`, `src/hooks/*`, `src/lib/**`,
  `src/App.tsx` route table (15 routes), `src/main.tsx`, `index.html`, `tsconfig*.json`.

## Redesigned (the creative work)

- `src/themes/themes.ts` — `felt` theme tokens replaced with the dark pine-felt +
  chip-gold palette; default forced to `felt`; list collapsed to one theme.
- `src/index.css` — `@theme` tokens reseeded to Felt; Space Grotesk on headings.
- `src/components/common/ui.tsx` — Avatar / Badge / Btn / Card / Section reskinned
  (gold primary button with dark ink, felt-shadow cards, gold badge tone, mono eyebrows).
- `src/components/layout/*` — gold logo + wordmark, gold bottom-nav active state.
- `src/pages/MePage.tsx` — SkinPicker removed (locked theme).
- FT money formatting (`lib/utils/ftFormat.ts`, FT create sheet) made dollar-blind so
  all game money renders as **Stakes**.

## Money: Stakes vs. credit purchases

All **in-game money** (pools, buy-ins, prizes, ICM equity) renders as dollar-blind
**"Stakes"**, never `$`. Two deliberate, documented exceptions remain:

- **Credit-purchase prices** on the Wallet (e.g. `$5 → 500 credits`) and the pricing
  survey — real money used to *buy credits*, which `intent.md` explicitly allows
  (credits are a facilitation fee, never a prize).
- **Event names** that contain a figure as a proper noun (e.g. *"DogHouse $150K
  H.W.M.S Main Event"*, *"Summer Poker Open — $1M GTD Main Event FT"*) — these are
  the real tournaments' titles, shown verbatim exactly as in the source screenshots.
  They are names, not money fields.

The reference's FT money fields (`prizePool` / `buyIn`) and ICM equity (`fmtCash`)
were displaying `$` — those are now dollar-blind Stakes.

## Default session

The deployed app opens **signed in as the demo Player (Sam Rivers)**, matching the
captured screenshots. The LoginScreen remains reachable via Sign out on the Me page.

## Layout

```
clubr-felt-src/          ← source (this folder)
├── package.json  vite.config.ts  tsconfig*.json  index.html
├── tokens.json   card.json   thumb.png (1200×630)   README.md
├── reference/ClubrFelt.jsx     # original design draft, kept as a spec
└── src/  (one file per route in src/pages/, foundation copied elsewhere)

clubr-felt/              ← built output (served at /clubr-felt/)
└── index.html  assets/  card.json  tokens.json  thumb.png
```
