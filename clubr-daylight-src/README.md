# Clubr · "Daylight" variant — the light, calendar-first redesign

A complete redesign on the verbatim `clubr/` foundation, and the **deliberate
break from every other variant**: the only **LIGHT** skin, and a different
organizing model — club life as a **recurring schedule**, not a feed.

## Two differentiators

### 1. Light, editorial, warm
Cream paper (`#F7F3EA`), deep ink text, a confident **forest-green** primary with
a **clay** secondary accent, **Fraunces serif** headlines + Inter body. Soft
shadows for depth (light UIs need shadow, not borders), white nav/header bars,
rounded paper cards. It reads like a well-set printed weekly, not a casino app —
the opposite of Felt/Arena's dark poker-luxe.

### 2. Calendar-first, and it scales 1 → N (a core requirement, app-wide)
The home is an **agenda**: your games bucketed by time — *Happening now · Today ·
This week · Coming up · Just wrapped*. Crucially, **the same layout works whether
you have one game or twenty**:

- Sections render **only when they have content** (`hooks/agenda.ts`), so there
  are **no empty modules, ever**.
- A brand-new member who joined one club via an invite link and has one game sees
  a **focused, full screen built around that single thread** — the agenda row for
  their game, their one club, and a *gentle* single next step — never a wall of
  empty sections or a "go discover everything" dump.
- A veteran with ten clubs sees the identical structure, now rich with a full
  week. Nothing about the design is a special "first-day mode"; the single-thread
  state is simply the natural floor of the same layout.

This directly answers the brief: keep a new user engaged by showing them their
**one good thread**, beautifully, instead of dumping the whole app on them — and
do it as a permanent property of the app, not an onboarding gimmick.

## Derived layer (no store reinvention)
- `hooks/agenda.ts` — buckets the player's threads by time into calendar sections;
  the mechanism for "full at 1, rich at N, never empty."
- Reuses the unified arena model (`lib/arena/*`, `hooks/arena.ts`) for the game
  shape, live state, and the persistent live bar.

Everything reads `u_player` / `c_aces` / `ll_*` / `sq_*` / `ct_*` unchanged.

## Run
```bash
cd clubr-daylight-src && npm install && npm run build   # → ../clubr-daylight/
```
`base:'/clubr-daylight/'`, `outDir:'../clubr-daylight'`. Tailwind v4 (CSS-first).

## Invariants honored
Seeds unchanged (Sam Rivers/900, Green Felt + River Rats, named games). 15 original
routes + role gates intact (`/host-ft` gates players, `/admin` gates non-admins).
Game money as Stakes; credit purchases are the allowed `$` carve-out. Opens as the
demo Player; LoginScreen via Sign out.

## Honest note
The calendar/agenda thinking is fully realized on the home (the surface that makes
or breaks the 1→N feel). The inner game-detail pages inherit the foundation's
screens, re-skinned light via the token system — legible and consistent, but their
per-game interactions (square picks, draft board, clock) are the foundation's, not
yet re-imagined. That's the next layer of work if this direction is chosen.
