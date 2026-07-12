# ClubR — App Prototype

The working ClubR app: a **transparent scorekeeper** for a poker club's games —
**FT Fantasy (Stack Draft)** and **Last Longer**. Mobile‑first PWA, mock data,
built to be flipped onto real APIs with no component changes.

Live (behind the prototypes gate): **hudr-prototypes.vercel.app/clubr-demo/**

## Stack
Mirrors the Scout prototypes exactly: **React 19 + Vite + Tailwind v4 + HashRouter
+ @tanstack/react-query + lucide-react**, with the shared **6‑skin** theme system.

```
npm install      # or junction node_modules to ../scout-engine/node_modules
npm run dev       # local
npm run build     # -> dist/  (copied to ../clubr-demo/ for deploy)
```

## The mock → API swap (the important part)

All data access goes through **one layer**: `src/lib/api/*Services.ts`. Components
and hooks never touch the mock store directly.

```
components ─▶ hooks (src/hooks/*) ─▶ services (src/lib/api/*Services.ts) ─▶ mock store (src/data/*)
                                                  ▲
                                          THE SWAP SEAM
```

- **Today:** each service function reads/writes the in‑memory mock store with
  simulated latency (`MOCK_LATENCY_MS`).
- **To go live:** replace each service body with an `apiClient.get/post` call and
  set `VITE_USE_MOCK=false` + `VITE_API_BASE_URL` (see `src/config/api.ts`). The
  hooks, React Query keys, and every screen stay identical — delete `src/data/`.

Service modules: `services.ts` (clubs/auth/admin), `ftServices.ts` (FT Fantasy),
`llServices.ts` (Last Longer).

## Roles & the approval model

Three logins (mock auth, `src/contexts/AuthContext.tsx`): **Player · Club Host ·
App Admin**. Approval is **mandatory everywhere**:

- **Join a club** → request/invite → host admits → until then you're **read‑only**.
- **Enter an FT contest or a Last Longer** → request → host (or co‑host) admits →
  read‑only until approved.

Other game mechanics:
- **Paid** = a subtle green/grey toggle (no label) — host/co‑host edits, player sees
  it read‑only. Separate from "approved to play."
- **Per‑game co‑host** — host assigns one, scoped to that single game; co‑hosts can
  admit, toggle paid, and bust.
- **Self‑bust** — a Last Longer player can "Out" themselves.
- **Per‑game chat** — players in a game chat together (system lines mark joins/busts).

## Build phases
1. **Foundation** — auth, Discover, Clubs, join→approval→read‑only flow, Admin console.
2. **FT Fantasy (Stack Draft)** — ICM draft board, approval‑to‑enter, paid toggle,
   co‑host, chat, points‑per‑finish scoring.
3. **Last Longer** — live board (in/waiting/out), chip updates + stale pulse,
   self‑bust, host eliminations, chop, chat.
4. **Management & roles** — member management, host console.
5. **Polish & API‑readiness** — this README, empty/loading states.

## Try it
Gate code: **2716**. Then sign in as Player / Club Host / App Admin. Switch the 6
skins from the palette icon (top‑right). FT Fantasy & Last Longer data is seeded so
the approval, paid‑toggle, co‑host, chat, self‑bust, and scoring flows all work.
