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
- `display: standalone`, `orientation: portrait`, scoped to `/clubr-golden-real/`.
- Safe-area insets, hidden-scrollbar momentum strips, tap-scale feedback, no
  hover-dependent interactions.

After `npm run build`, the dist contains `manifest.webmanifest`, `sw.js`,
`registerSW.js`, `workbox-*.js`, and the icons — i.e. **Add to Home Screen**
installs a real standalone app.

## Run
```bash
cd clubr-golden-real-src && npm install && npm run build   # → ../clubr-golden-real/
```
`base:'/clubr-golden-real/'`, `outDir:'../clubr-golden-real'`. Tailwind v4 (CSS-first).

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
