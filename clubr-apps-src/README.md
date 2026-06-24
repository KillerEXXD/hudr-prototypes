# Clubr · "Arena" variant — the live-first redesign

A redesign of the Clubr scorekeeper built on the same verbatim foundation as the
reference `clubr/` app (data, auth, types, hooks, routing copied as-is), with a
new **information architecture and a derived data layer** on top. Where the
previous "Felt" variant was a reskin, **Arena is a UX redesign**: it changes what
the app leads with and adds the surfaces a returning player actually wants.

## The thesis

A poker player opening this app has one of two intents: *"what's live that I'm
in"* or *"where do I stand with my crews."* The original home is a discovery feed
that serves neither directly. Arena restructures around **state, not catalog**.

### The four moves

1. **Live-first home** (`ArenaHomePage`) — leads with **"Needs you now"** (games
   awaiting your action), then **Live**, then **Coming up**, then your **ledger
   snapshot**, and only then discovery. The app looks different on a quiet Tuesday
   vs. a Friday with three games running. Empty state is direction, not a dead end.

2. **Persistent live bar** (`LiveBar` in `AppShell`) — when a game you're in is
   running, a dismissible bar rides the top of the app (a "call in progress"
   affordance) so you can browse without losing the thread. It hides itself on the
   game you're currently viewing.

3. **Unified game object** (`lib/arena/unifiedGame.ts` + `ArenaCard`) — FT Fantasy,
   Last Longer, and Squares are three data shapes but **one mental model**. A single
   card anatomy + one lifecycle rail (open → live → settled) + one set of verbs is
   applied to all three. You learn the app once. Unified detail routes
   (`/g/ft/:id`, `/g/ll/:id`, `/g/sq/:id`) are the entry points; the original
   manifest routes stay valid for parity.

4. **Relationship ledger** (`lib/arena/ledger.ts` + `LedgerPage` at `/ledger`) —
   the retention surface. A **derived**, dollar-blind tally of where you stand with
   each crew over time (played / cashes / wins / net Stakes / recent form),
   computed from settled results. No store holds head-to-head money — ClubR holds
   nothing — so this mirrors what the table would total on paper.

## Derived data layer (full-send, no store reinvention)

The redesign adds three files that **derive** from the existing stores — they add
no new mock entities and touch no store:

- `src/lib/arena/unifiedGame.ts` — projects FT/LL/Squares views into one
  `ArenaGame` (type, phase, your-relation, needs-you, progress, result).
- `src/lib/arena/ledger.ts` — builds the per-club ledger from settled outcomes.
- `src/hooks/arena.ts` — `useArena()` composes the three list hooks into the
  unified game list + ledger. Pure composition over existing hooks.

Everything reads `u_player` / `c_aces` / `ll_*` / `sq_*` / `ct_*` unchanged. Sam
Rivers is still Sam Rivers (900 credits); Green Felt Club + River Rats are still
joinable; the seeded games are unchanged.

## Visual layer

Dark pine-felt + chip-gold (the "Felt" poker-luxe palette), locked to one skin.
New signature cues: a **live ring** (breathing emerald edge on running games), a
**lifecycle rail**, and **gold = money/outcomes only** (net Stakes, your result,
the active state) — never decoration.

## Run it

```bash
cd clubr-arena-src
npm install
npm run dev        # local
npm run build      # writes the deployable static site to ../clubr-arena/
```

Build config (`vite.config.ts`): `base:'/clubr-arena/'`, `outDir:'../clubr-arena'`,
`emptyOutDir:true`. Tailwind v4 (CSS-first, no `tailwind.config.ts` — expected for
v4, matches the reference).

## Money as Stakes

All game money (pools, buy-ins, prizes, ICM equity, **the ledger net**) renders as
dollar-blind **Stakes**. The reference's FT prize/buy-in/ICM were showing `$`;
those are now Stakes. Remaining `$` are credit-purchase prices (real money buying
credits — the allowed carve-out) and event *names* shown verbatim from the
screenshots.

## Default session

Opens signed-in as the demo Player (Sam Rivers); LoginScreen reachable via Sign out.

## New / changed files

```
NEW   src/lib/arena/unifiedGame.ts    # unified ArenaGame adapter (derived)
NEW   src/lib/arena/ledger.ts         # relationship ledger (derived)
NEW   src/hooks/arena.ts              # useArena() — composes the above
NEW   src/components/arena/ArenaCard.tsx  # unified card + LiveBar + LifecycleRail
NEW   src/pages/ArenaHomePage.tsx     # live-first player home
NEW   src/pages/LedgerPage.tsx        # /ledger — full relationship ledger
EDIT  src/pages/HomePage.tsx          # players → ArenaHomePage
EDIT  src/components/layout/AppShell.tsx  # live bar
EDIT  src/App.tsx                     # + /ledger, /g/:type/:id unified routes
EDIT  themes/themes.ts, index.css, ui.tsx, LogoMark, BottomNav  # Felt skin, locked
reference/  ClubrFelt.jsx + REDESIGN-NOTES.md  # design rationale
```
