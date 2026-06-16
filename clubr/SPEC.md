# ClubR — App Specification

The behavioural spec for the ClubR prototype. Pairs with the product‑level
`C:\Apps\ClubR\docs\CLUBR_PRODUCT_DEFINITION.md`. This file is the source of
truth for *how the app behaves*; update it as decisions change.

> **One line:** ClubR is the **transparent scorekeeper** for a poker club's games —
> **FT Fantasy (Stack Draft)** and **Last Longer**. The app tracks and proves the
> count and the result; it **awards nothing, holds nothing, and never touches the
> cash.** Clubs settle all stakes offline.
>
> **Platform direction:** ClubR is the **operating system for club side‑games** —
> FT Fantasy and Last Longer today, **Football Squares** next (§13) on the same rails.
> Each new game reuses clubs, approval, visibility, the paid toggle, sealed‑until‑lock,
> stakes buckets, chat, and offline settlement — so the marginal build cost is small and
> the legal posture (app‑touches‑no‑cash) is identical.

---

## 1. Roles & accounts
- **App Admin** — manages all clubs and all users (Admin console). Supplies the FT
  slate (players, stacks, prize pool); the app computes ICM. **Has ALL visibilities:**
  every club, the full roster of any club, all games (including private), and all
  contact details. **The one exception: FT picks are sealed until lock for everyone,
  admin included.** App Admins **oversee only — they never join a club or play a game**;
  their Clubs tab shows **all clubs** (see §16).
- **Club Host / Owner** — creates a club, holds the (premium) subscription, runs
  games, vets & admits members. Earns nothing — reputation only.
- **Player (Member)** — joins clubs, plays games.
- **Per‑game Co‑host** — a host assigns a co‑host **scoped to a single game**; the
  co‑host can admit, toggle paid, and bust in that game only.
- **Operator** *(Phase 1 = App Admin)* — enters each FT's chip stacks → the app
  computes ICM prices; enters the public finishing order to score. **HUDR replaces
  this in Phase 2.**

Login: phone + OTP (mock). The prototype seeds one account per role
(Player / Club Host / App Admin) + an invite‑link signup path.

## 2. Approval model (mandatory everywhere)
Approval is required to do anything beyond viewing:
- **Join a club** → request (or invite link) → **host admits after vetting**. Until
  approved you are **read‑only**.
- **Enter an FT contest or a Last Longer** → request → **host admits**. Read‑only
  until approved. **A host/co‑host who joins their own game is auto‑approved** (no
  self‑approval dance). **The host is NOT auto‑entered** — they host, and join as a
  player only if they choose.

## 3. Game visibility — Public / Private
- **Public (default):** all club members can **see** it and request to join. No
  invite needed.
- **Private = invite‑only:** only the **host‑selected members** can even *see* it
  (high‑stakes subset). Host sets the initial access list at creation **and can
  invite more members any time via an "Invite members" button** on the game (FT or
  LL). Card shows a **Private** badge.
- Visibility controls **who can view**; **approval is still required to join** for
  both (viewing ≠ joining). Inviting grants **view access** — the invited member can
  now see it and request to join; the host still admits.

## 4. FT Fantasy (Stack Draft)
- **Operator supplies** the FT: 9 players, chip stacks, prize pool, buy‑in, start
  time. The app **computes ICM prices**. The host **only reviews & hosts** it.
- **Host flow:** Fantasy tab → **Host a contest** → the **"Choose a Final Table"** screen — the
  operator slate (room, date, **real prize pool & buy‑in**, hours‑left) → open
  one to see **the 9 finalists with chip stacks + ICM prices** → **Host this FT** →
  choose club, **Stakes bucket** (presets 100/250/500 **or a custom value** — e.g. 150, 300),
  registration close + timezone, payouts, and **visibility**.
- **Stakes bucket = preset or custom.** Both create sheets (FT + LL) offer quick presets **and a
  "Custom" number input**, so a host can set any bucket (150, 300, …), not just the presets.
- **Player flow:** request to enter → host admits → **draft 4 of 9 within a 100k
  budget** (use‑it‑or‑lose‑it) → **picks lock 10 minutes before** the FT.
- **Picks visibility:** **sealed until the lock for EVERYONE — host and App Admin
  included** (you only ever see your own draft before lock). **After the lock, picks
  reveal to everyone** in the contest. Settled contests show the leaderboard with picks.
- **Scoring:** sum of **points‑per‑finish** across your 4 players; highest total
  takes the bucket. Top‑3 **50/30/20** (winner‑take‑all under 5 entries).
- **Scoring schedule is visible WHILE drafting** (not only at settlement): a collapsible
  **"How scoring works — points per finish"** panel on the contest page (open by default while
  the contest is open) lists **1st 100 · 2nd 70 · 3rd 50 · 4th 35 · 5th 25 · 6th 18 · 7th 12 ·
  8th 6 · 9th 3**, and the **draft board shows the same one‑line reminder**. Single source of
  truth = `FINISH_POINTS` (`ScoringSchedule.tsx`). *(Points rank the drafted players; the §15
  payout split divides the pool among entrants — two different things.)*
- **"How it works?" walkthrough.** A **"How it works"** pill by the FT Fantasy heading opens a
  **simple numbered step‑by‑step** (find a contest → request to enter → draft 4 → picks lock →
  watch & score → win the pool), in plain English for first‑timers (`HowItWorks.tsx`).
- **Prize pool shown is the REAL event's — informational only.** The contest pays
  its own **Stakes bucket**, settled **offline**. The app moves nothing.
- **Operator slate is host/admin-only.** Players **never** see it; the Host page
  (`/host-ft`) is guarded — a player who lands there is redirected home. The App
  Admin curates the slate via an **"Add a final table"** form (see §17).
- **Final Table details panel (everyone, every state).** Each contest page shows the
  full table: a **live YouTube stream** card (per-contest, live/replay), event facts
  (prize pool, buy-in, blind level, chips in play, avg stack), and the **9-player
  roster** — country flag, name, relative **chip-stack bar**, chips + BB, the **ICM
  price**, and **pick popularity** (revealed once picks unlock).
- **Picks render as player names** (first name + last initial, e.g. "Daniel N.")
  once revealed — never raw seat letters — and each entry shows its **budget spent**.
- **Settled result.** A **prize pool** line, a **winner spotlight** (or top-3 podium),
  and a **payout-aware leaderboard** (paid per the §15 split; points still rank the
  whole table). Completed contests are **listed by default** for everyone who
  entered/hosted (no collapse).

## 5. Last Longer
- The club's own live tournament (in‑person or online). Host creates it with
  **tournament name, location, format, stake**, and visibility.
- **Players self‑join** (public count, un‑hideable) → host admits.
- **Live board:** active (sorted by chips) / waiting / out. Players **self‑report
  chips** (stale‑pulse reminder). Eliminated players show **when they busted**
  ("52m ago").
- **Eliminations:** host/co‑host can OUT anyone; **a player can self‑bust ("I'm
  out")**; host decides disputes. Every host action is logged.
- **Chop:** host proposes → players agree → game settles.
- **Per‑game chat** among the players.
- **Auto-updates in chat.** The app posts **system chat lines** automatically: when
  the **chip lead changes** ("👑 … takes the chip lead — …") and on every
  **bust / elimination**. The **final bust auto-completes** the game and crowns the winner.

## 6. Paid status (the green/grey toggle)
- A subtle **green = paid / grey = unpaid** toggle, no heading.
- **Only the host/co‑host can see and set it** for the table. **A player sees only
  their own** paid status (read‑only) — never other players'.

## 7. Members, vetting & profiles
- **Signup requires Name, Email, and Phone (all mandatory)** — the host needs them
  to vet and admit. These are stored on the user and surfaced to the host.
- **Roster privacy:** the **full member list is host/admin only.** A regular member
  sees only **who the owner is** + the **total member count** — never the other
  members.
- A host vets manually before admitting, so they can drill into a member:
  - **Member profile (drill‑down page):** the host/admin taps a member (or a pending
    request) → their profile.
  - **Contact details (name / email / phone):** visible **only to a host/admin of a
    club the member is in** — never to peer members.
  - **Track record:** lifetime **FT Fantasy played** + **Last Longers played**
    counts. History list of games — **scoped to games the viewer can already see**
    (their own clubs); lifetime counts are aggregate and never leak other clubs'
    specifics.

## 8. Club join / share link
- Each club has an **invite code** and a **shareable link** (`#/?join=CODE`). A new
  user clicks it → lands on signup with the code prefilled → **requests to join** →
  **host admits after vetting**.

## 9. Information architecture (anti‑clutter)
- **Discover** = act‑on surface: **clubs you can JOIN** (not ones you're in) +
  **open/live** contests & games (no settled history). **Clubs in the user's city are
  surfaced first** under a "Near you in &lt;city&gt;" section. A **location** (city, e.g.
  "Houston, TX") is captured on the **user at signup** and on the **club at creation**,
  and shown on each club row.
- **Fantasy / Last Longer** = **active** games front‑and‑center, split **"You're
  hosting"** vs **"Playing in"**; **completed/your results** now show in an **always-visible "Completed (N)"**
  section (scoped to games you entered/hosted).
- **Clubs** = your clubs. **Me** = profile + the 6 skins (+ Host/Admin consoles).
- Cards: a single **status** badge top‑right; **Hosting / Entered / In / Private**
  on their own row.
- **First tab is role-aware:** **Player → Discover**, **Club Host → a Home dashboard**,
  **App Admin → the Admin console** (see §17).
- **Responsive:** nothing is hidden between mobile and desktop — the same features and
  labels render at every width (role chip, theme label, account switcher, etc.).

## 10. Pricing (from the product definition)
- **To host:** a **ClubR subscription** (premium; bundles HUDR in Phase 2).
- **To play:** **credits** per entry, or **free with a HUDR subscription** (Phase 2).
- Free trial: 1000 credits / 10 free games.

## 11. Legal posture
- The app **awards, holds, pools, and promises nothing.** No prize, no payout, no
  pools, no points awarded by the app.
- All cash is **offline and app‑blind.** The app shows counts/results in **"Stakes"**,
  never dollars. The **real prize pool** is shown for FT context only — informational.
- No peer‑to‑peer credit transfer.

## 12. Architecture / phasing
- **Stack:** React 19 + Vite + Tailwind v4 + HashRouter + React Query + 6‑skin theme
  system (mirrors the Scout prototypes).
- **Data:** everything goes through `src/lib/api/*Services.ts` (the swap seam). Mock
  store today (`src/data/`); flip `VITE_USE_MOCK=false` + set `VITE_API_BASE_URL` and
  replace service bodies with `apiClient` calls — no component/hook changes.
- **Phase 1 (this build):** standalone, operator enters FT data manually, free pilot.
- **Phase 2:** HUDR auto‑fills the FT data + finishing order; HUDR subscription perks;
  Telegram bot; payments.
- **Next game (queued):** **Football Squares** — see §13. Reuses the rails; net‑new is
  the 10×10 grid UI + random digit assignment + period scoring.

## 13. Football Squares (roadmap — queued build)
A **third club side‑game** on the same rails as FT Fantasy & Last Longer. Widely run in
poker rooms and bars, it **peaks at the Super Bowl** → a **seasonal acquisition hook**
(a reason for a club to install ClubR *that week*).

- **Pure chance** (10×10 grid, random digit assignment). Because there's no skill element,
  the **transparent‑scorekeeper / app‑touches‑no‑cash wall matters even more here**: the
  app assigns digits, reads the **public** score, and highlights winners — it **sells no
  square, holds no pot, awards nothing.** All cash is settled **offline**.
- **Host flow:** create a board → name the game/matchup → **stakes bucket** (reuse
  100/250/500) → **payout split per period** (default Q1/Q2/Q3 = 10% each, **Final = 70%**)
  → **visibility** (public/private, same as FT/LL).
- **Player flow:** request to claim square(s) → **host admits** → claim cells on the grid →
  **paid toggle** (green/grey, host‑only, same as everywhere) → **row/column digits are
  assigned and sealed at lock** (like FT picks) → reveal at lock.
- **Live:** host enters each period's score (self‑report, like Last Longer) → the app
  highlights the winning cell (home last digit × away last digit) → marks the period
  winner → settled offline.
- **Data:** public NFL/sports scores — **no HUDR dependency.** This is an **engagement +
  acquisition** play, not a data‑moat play. Position it as the **top‑of‑funnel hook**;
  HUDR/FT Fantasy remain the **retention + moat**.
- **Reuses:** clubs, approval model, visibility/invite, paid toggle, sealed‑until‑lock,
  stakes buckets, chat, offline settlement. **Net‑new:** the 10×10 grid UI, random digit
  assignment at lock, and period scoring.

## 14. Prototype feedback & analytics (testing instrumentation)
A floating **Feedback** launcher sits on every screen (mounted in `AppShell`,
pinned above the bottom nav), mirroring the Scout prototypes but scoped to ClubR:
- **Quick note (frictionless):** type a single note and **send instantly** — **no
  rating and no required name/email** (identity is attached only if already captured).
  Auto‑captures the current screen → PostHog `quick_note_submitted` (also mirrored to
  TournamentPro). The longer **guided review** stays one tap away.
- **Guided review (`ReviewWizard`):** identity first, then **one step per ClubR
  feature** — first impression, Discover, joining a club, FT Fantasy (Stack Draft),
  Last Longer, hosting, paid tracking & vetting, transparent scorekeeper,
  navigation, look & feel — each a 1–5 score + liked/disliked quick‑pick chips +
  free text (with a "try it" deep link), ending in overall **would‑use /
  would‑pay / NPS** → PostHog `prototype_review_submitted` (flattened
  `score_<key>`, `liked_<key>`, `dislikedtags_<key>`, …).
- Reviewer **identity is captured once and reused** across both forms, persisted
  to `localStorage` (`clubr-reviewer`).
- Every event is tagged `prototype: 'clubr'` / `surface: 'clubr-prototype'` so
  ClubR feedback is filterable in the shared PostHog project. **Public `phc_`
  key only** (never the personal `phx_` key).
- **Mirrored to TournamentPro:** in addition to PostHog, every submission is POSTed
  (fire-and-forget) to the `submit-feedback` edge function → stored in the
  `prototype_feedback` table → viewable in **TournamentPro Admin → Prototype Feedback**.
  So no feedback is ever lost, even if PostHog is unavailable. The same mirror is wired
  into the four HUDR Scout prototypes (`product: 'hudr'`).
- Files: `src/lib/analytics.ts`, `src/lib/reviewSections.ts`,
  `src/components/common/FeedbackButton.tsx`, `src/components/common/ReviewWizard.tsx`;
  initialized in `main.tsx`.

## 15. Game scheduling & payouts (FT Fantasy + Last Longer)
Both create flows share `ScheduleFields` + `PayoutEditor` (`components/common/GameSetup.tsx`,
pure helpers in `lib/gameSetup.ts`):
- **Registration close time + timezone are MANDATORY** at creation (a `datetime-local`
  picker + a timezone select: ET/CT/MT/PT/UTC). Create is disabled until both are set.
  Stored as `registrationClosesAt` (LL) / `locksAtTs` (FT) + `timezone`.
- **Payout structure** — default **Top 3 · 50/30/20**; one‑tap presets for **Winner‑takes‑all
  (100)** and **Top 2 · 60/40**; the host can edit each place's % and **add/remove places**.
  **Must sum to 100%** (live validity indicator); create is blocked otherwise. Stored as
  `payouts: number[]` (length 1 = winner‑takes‑all).
- **On the game card:** a `PayoutBadge` summarizes the split ("Winner takes all" / "2 winners ·
  60/40" / "Top 3 · 50/30/20"), and a **live ticking countdown** (`Countdown`) shows how long
  registration stays open — **green normally, red under 10 minutes, pulsing under 2**.

## 16. Roles, entry flow & navigation
- **App Admin is overseer‑only.** Admins **cannot join a club or participate in a game** —
  Join/Create (Clubs tab), Request‑to‑join (club page), and the FT **"Your entry"** / LL
  **"You"** participate sections are hidden for admins. Admins keep full management.
- **Admin sees ALL clubs.** The **Clubs tab lists every club** for an admin (titled "All
  Clubs"), not just ones they're in; the **Admin home** also lists all clubs + all users.
- **Member profiles reachable from every member list.** Tapping a member opens their profile
  from the **club roster**, **FT contest Entrants**, the **Last Longer leaderboard** (active /
  waiting / out), and **Admin → All users**. Host/co‑host can do this for their games; the
  **App Admin sees every member's full details** (contact, location, all games) from anywhere.
  Contact gating is unchanged (admin = all; host = members of a shared club).
- **Join from the list.** FT Fantasy & Last Longer **cards carry a "Request to enter / join"
  button**, so an eligible member can request **without opening the game**. Shows only for a
  club member who isn't the host and hasn't already joined; non‑members are pointed to join the
  club first. (Tapping it never navigates into the game.)
- **Entry CTA placement.** On the FT contest page the **"Your entry"** block (request‑to‑enter,
  then the draft) sits **above** the Final Table details — the join action is the first thing a
  player sees.
- **Stakes · players joined · pool** (`StakePool`) appear on **both the cards and the detail
  pages** for FT + LL: **buy‑in per entry**, **players joined**, and the **live pool** (buy‑in ×
  players joined).

## 17. Home dashboard & role‑aware navigation
- **The first bottom‑nav tab adapts to role:**
  - **Player → Discover** (unchanged) — browse clubs to join + open/live games. Players
    only ever see **host‑created contests**, never the operator FT slate.
  - **Club Host → a Home dashboard:** (1) **FTs you can host** — compact cards of the
    App‑Admin slate that open the Host page; (2) **Your club** — open/in‑progress FT
    Fantasy + Last Longer you run; (3) **Other clubs you're in** — open/in‑progress games
    in clubs where you're a member but not the host. Completed games stay on their tabs.
  - **App Admin → the Admin console** as home (all clubs + all users + the FT slate;
    the Back button is hidden when it's the home tab).
- **App Admin adds final tables** via an **"Add a final table"** form: event meta + the 9
  finalists by **name & chip stack**; the app **seats them A–I by stack** and
  **auto‑computes each ICM draft price from the stack** (concave ladder, ~13k–35k). A
  one‑tap **sample** fills a realistic table. The new FT appears immediately under hosts'
  **"FTs to host"**. **Players never see the slate**; the Host page (`/host-ft`) is guarded.
- **Entrants keep visibility:** a player can always see a contest/game they're **entered
  in**, even across clubs they're not a member of.
