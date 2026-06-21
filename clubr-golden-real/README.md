# Clubr · "Golden - Real" variant — the reference-faithful, installable PWA

This variant ("Golden - Real" in the skin picker) reproduces the **canonical ClubrGo reference design** (the kit's
mobile screenshots) pixel-faithfully, built in the proper Heavy-variant structure
on the verbatim `clubr/` foundation, and shipped as a **mobile-first installable
PWA**.

## What this matches
The card anatomy, chips, and data placement from the reference screenshots:
- **Game-type badge** top-left (green SQUARES / amber LAST LONGER / purple FT
  FANTASY) + **status pill** top-right (Registration open / RUNNING / Completed).
- Club row, bold serif-display title, optional subtitle (teams).
- **Inline stat pills** with icons: gold `🎫 N buy-in`, green `◎ N pool`, then
  plain `· N/100 squares` / `· N in` / `· N entered`, and a green `⏱ Closes in …`.
- **Period / Join row**: `🏆 Q1 · Q2 · Q3 · Final` (squares) or winners line, with a
  `＋ Join` affordance.
- **Icon filter chips** (All / FTF / LL / Squares) as a horizontal scroll strip.

The literal reference wording is kept (`buy-in`, `pool`) per request; settled
money elsewhere renders as **Stakes**.

## Mobile-first installable PWA
- `vite-plugin-pwa` generates a **web app manifest** + **service worker** (Workbox)
  with offline precache and `autoUpdate`.
- **Maskable + standard icons** (192/512), `apple-touch-icon`, apple-mobile-web-app
  meta, `theme-color`, `viewport-fit=cover` for notch/home-bar safe areas.
- `display: standalone`, `orientation: portrait`, scoped to `/clubr-felt/`.
- Safe-area insets, hidden-scrollbar momentum strips, tap-scale feedback, no
  hover-dependent interactions.

After `npm run build`, the dist contains `manifest.webmanifest`, `sw.js`,
`registerSW.js`, `workbox-*.js`, and the icons — i.e. **Add to Home Screen**
installs a real standalone app.

## Run
```bash
cd clubr-felt-src && npm install && npm run build   # → ../clubr-felt/
```
`base:'/clubr-felt/'`, `outDir:'../clubr-felt'`. Tailwind v4 (CSS-first).

## Structure (the correct Heavy-variant shape)
Foundation copied verbatim (data, auth, types, hooks, lib, 15-route App, configs);
redesign confined to themes/index.css/ui primitives/the three game-card rows
(`SquaresRow`, `ContestRow`, `GameRow`), `StakePool`, and the games filters. The
original `ClubrFelt.jsx` design draft is kept in `reference/`.

## Invariants
Seeds unchanged (Sam Rivers/900, Green Felt + River Rats, "Sunday Squares — Texans
@ Colts" / Bayou City, "Saturday Deep Stack Last Longer" / Aces High). 15 original
routes + role gates intact. Opens as the demo Player; LoginScreen via Sign out.

## Honest scope note
The game-**card** anatomy (your screenshots) is matched across all three types,
plus filters and the Felt theme, and the PWA shell is real and installable. The
detail pages (squares grid, draft board, the clock) inherit the foundation's
screens re-skinned via the token system — consistent and legible, faithful in
palette and components, but not yet hand-tuned pixel-for-pixel against every one
of the 15 reference detail screenshots. That per-screen detail pass is the next
increment.

## In-game screens (JSX-language redesign)
- **FT Fantasy → Draft Board**: gold BUDGET LEFT / PICKS header, glowing gold meter,
  picked-token row, single-column ranked finalist list with gold-ring selected rows.
- **Last Longer → Standings**: ranked live leaderboard, gold leader, per-player
  chip-stack bars (alive up top, busted below).
- **Squares → Claim Grid**: pine-felt grid, gold winner cells with glow, gold-ringed
  owned cells, mono digit headers.
All bound to real app data (Stakes, real ICM prices), same JSX design language.
