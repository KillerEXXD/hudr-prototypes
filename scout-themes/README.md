# Scout Engine — Prototype

A self-contained prototype of the **Poker Player Analysis Engine** (4 layers:
Stats → Typing → Exploits → Narrative) wrapped in a dual-mode product:
**Plain English** for casual players and **Pro Stats** for serious players.

> Prototype only — **no code in the real `hudr-pwa` is touched.** Mock data
> stands in for the deterministic stat engine that already exists in
> TournamentPro. See `FLOW_ANALYSIS.md` for the full layer-by-layer flow charts.

## Run

```bash
npm install
npm run dev
# open the printed URL, e.g. http://localhost:5173/scout-engine-demo/#/
```

## What to look at

| Screen | Route | Shows |
|--------|-------|-------|
| Find | `#/` | Search tournaments + players; pipeline strip; computed archetypes |
| Tournament | `#/tournament/t1` | Roster w/ status + archetype; **AI Chat** + **Stats** (dual-mode) |
| Scouting report | `#/player/p3` | Full 4-layer report; flip the global **Plain ⇆ Pro** toggle |

Good players to compare: **p3** (Hellmuth — unclassified, 2 fired exploits),
**p2** (Ivey — TAG, few leaks), **p9** (Seidel — 28 hands → most stats NOISE,
shows the sample-gating story).

## Engine (the interesting part)

`src/engine/`
- `tiers.ts` — RELIABLE / TENTATIVE / NOISE gating (Layer 1)
- `typing.ts` — archetype boundaries + confidence (Layer 2)
- `exploits.ts` — deterministic leak → counter matrix, RELIABLE-gated (Layer 3)
- `narrative.ts` — deterministic stand-in for the LLM narrator (Layer 4)
- `profile.ts` — runs all layers → one `PlayerProfile`
- `statDefs.ts` — stat catalog with plain + pro copy

Active UI: `src/App.tsx`, `src/contexts/ModeContext.tsx` (global toggle),
`src/components/layout/AppShell.tsx`, `src/components/scout/*`,
`src/components/common/*`, pages in `src/pages/{FindPage,TournamentPage,ScoutingPage}.tsx`.
(Other folders carried over from the scaffold fork are unused.)

## Design

Built to the **UI UX Pro Max** "Data-Dense Dashboard" system: dark theme,
Fira Sans / Fira Code, blue data + amber highlights, tier-colored reliability
chips. Tooling note: the 21st.dev Magic and Nano Banana MCPs were unavailable in
the authoring session (no API key / not connected), so components were
hand-built to the design-system spec.

## Stack

Vite 8 · React 19 · TypeScript · Tailwind v4 · react-router (HashRouter) ·
recharts · lucide-react. Forked from the `v-hudr-v2` prototype scaffold.
