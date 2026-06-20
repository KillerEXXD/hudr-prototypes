# Clubr · "Ledger" variant — the grinder stats-cockpit redesign

A complete redesign on the verbatim `clubr/` foundation. Where Arena was
live-first and Rail was people-first, **Ledger is numbers-first.**

## Thesis
Serious players live in their stats. The app that wins them opens to a cockpit:
net, cash rate, ROI by game type, a cumulative trend, per-crew standings — not a
feed. Action is present but secondary, a compact strip under the numbers.

## What's new
- **Stats-cockpit home** (`LedgerHomePage`) — hero net + cumulative-net sparkline,
  per-type ROI table, per-crew standings table, then an "Active now" strip.
- **Grinder stats** (`hooks/grindStats.ts`) — DERIVED: per-type performance, cash
  rate, wins, and the cumulative trend from settled results. No store touched.
- **Full ledger** at `/ledger` (the by-crew detail) + unified `/g/:type/:id` routes.
- Reuses the derived arena layer (`lib/arena/*`, `hooks/arena.ts`).

## Visual identity
Cool slate + a single electric-lime data accent, IBM Plex Sans + **mono tabular
numerals everywhere** (the `mono` theme flag), sharp small radii — a deliberate
data-tool aesthetic, the opposite of Rail's warmth. Locked to one skin.

## Run
```bash
cd clubr-grind-src && npm install && npm run build   # → ../clubr-ledger/
```
`base:'/clubr-ledger/'`, `outDir:'../clubr-ledger'`. Tailwind v4 (CSS-first).

## Invariants honored
Seeds unchanged (Sam Rivers/900, Green Felt + River Rats, named games). 15 original
routes + role gates intact. Game money as Stakes (incl. the stats net); credit
purchases are the allowed `$` carve-out. Opens as the demo Player.

> Source folder is `clubr-grind-src/`; it builds to `../clubr-ledger/` and the
> gallery serves it at `/clubr-ledger/`. (The "grind" folder name is just the
> working source dir; the variant ships as **Ledger**.)
