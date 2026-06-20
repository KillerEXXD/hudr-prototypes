# Clubr · "Rail" variant — the social-first redesign

A complete redesign on the verbatim `clubr/` foundation (data, auth, types, hooks,
routing copied as-is). Where Arena was live-first, **Rail is people-first.**

## Thesis
These are friend groups first, games second. The app that wins feels like the
group thread, not a tournament tool. So Rail's home leads with your **crews** as
living tiles — who's around, what's live, where you stand — and games live one tap
inside a crew, hottest crew first.

## What's new
- **Crew-first home** (`RailHomePage`) — your clubs as living surfaces, sorted by
  "heat" (needs-you > live > open). Each tile shows live count, what needs you,
  open games, and your net Stakes with that crew.
- **Crew pulse** (`hooks/crews.ts`) — DERIVED: groups the unified arena games +
  ledger by club into per-crew activity. No store touched.
- **Persistent live bar** (reused) — running games ride the top of the app.
- Reuses the derived arena layer (`lib/arena/*`, `hooks/arena.ts`) from the Arena
  redesign as its data spine.

## Visual identity
Warm charcoal + ember-coral, Plus Jakarta Sans throughout, rounded social tiles —
deliberately friendlier and less casino than the poker-luxe variants. Locked to
one skin.

## Run
```bash
cd clubr-rail-src && npm install && npm run build   # → ../clubr-rail/
```
`base:'/clubr-rail/'`, `outDir:'../clubr-rail'`. Tailwind v4 (CSS-first, no config file).

## Invariants honored
Seeds unchanged (Sam Rivers/900, Green Felt + River Rats, named games). 15 original
routes + role gates intact (`/host-ft` gates players, `/admin` gates non-admins).
Game money as Stakes; credit-purchase `$` is the allowed carve-out. Opens as the
demo Player; LoginScreen via Sign out.
