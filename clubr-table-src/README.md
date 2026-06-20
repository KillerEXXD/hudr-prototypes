# Clubr · "Table" variant — the in-session redesign

A complete redesign on the verbatim `clubr/` foundation. The three prior variants
optimized for *between* sessions (Arena: what's live · Rail: your crews · Ledger:
your numbers). **Table optimizes for DURING the session.**

## Thesis
The app is used at the table, mid-game, one-handed. So when a game is live it
**takes over the screen** — oversized type, one glanceable number (who's left /
squares claimed / drafted), fat tap targets readable from across the felt, and one
obvious action. When nothing's live, it's a calm launchpad, not a feed.

## What's new
- **Session-mode home** (`TableHomePage`) — a full-width **live hero** with a
  64px headline number you read at arm's length, pot, and an "Open table" CTA;
  "Your move" actions as big rows; quiet-state launchpad when nothing's live.
- Big-touch primitives — larger button padding, 3xl card radii, bigger nav
  icons/targets — tuned for use without looking closely.
- Reuses the derived arena layer (`lib/arena/*`, `hooks/arena.ts`) for live/needs-you
  state; unified `/g/:type/:id` routes.

## Visual identity
Deep near-black felt + a single bright **signal-green**, Space Grotesk display +
JetBrains Mono — high-contrast and legible in a dim room. Locked to one skin.

## Run
```bash
cd clubr-table-src && npm install && npm run build   # → ../clubr-table/
```
`base:'/clubr-table/'`, `outDir:'../clubr-table'`. Tailwind v4 (CSS-first).

## Invariants honored
Seeds unchanged (Sam Rivers/900, Green Felt + River Rats, named games). 15 original
routes + role gates intact. Game money as Stakes; credit purchases are the allowed
`$` carve-out. Opens as the demo Player.
