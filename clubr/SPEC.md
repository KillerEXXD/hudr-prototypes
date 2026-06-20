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

**Login is one front door: phone + OTP** (Twilio Verify live; mocked in the
prototype). There is **no pre‑verification sign‑up form** — name/email/city are
collected once, *after* verification, in onboarding. An **invite link**
(`/?join=CODE`) leads straight to that phone flow and **shows an invite banner**;
the code rides the URL and the join is applied automatically once signed in (the
single applier is `useApplyInviteOnLogin`, so a brand‑new user post‑onboarding and
an existing user who opens the link behave identically). The prototype seeds one
account per role (Player / Club Host / App Admin); it mocks the phone step.

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
- **Draft‑board budget UX:** a live **Spent / Available** meter with drafted‑seat **pips**
  (not a subtle "x/4" text). If you spend down so far that the cheapest open seat is
  unaffordable — i.e. you'd hit the 100k budget **before** filling all 4 seats — the meter
  turns **red** and a loud **"Out of budget — N seat(s) still open"** alert names the cheapest
  open seat and tells you to **remove a pricier pick and draft a cheaper one**. (`DraftBoard.tsx`.)
- **Scoring schedule is visible WHILE drafting** (not only at settlement): a collapsible
  **"How scoring works — points per finish"** panel on the contest page (open by default while
  the contest is open) lists **1st 100 · 2nd 70 · 3rd 50 · 4th 35 · 5th 25 · 6th 18 · 7th 12 ·
  8th 6 · 9th 3**. This panel is the **single place** the schedule is shown on the contest page
  (the old duplicate one‑line reminder on the draft board was removed). Single source of
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
  out")**; host decides disputes. Every host action is logged. **Both bust paths
  ask for confirmation first** (easy to mis‑tap). **Accidental busts are reversible:**
  the host/co‑host gets a **Reinstate** button on each eliminated row — the player
  returns to active (finish place + bust time cleared; they re‑enter chips); if the
  bust had auto‑completed the game, reinstate **reopens it** and reactivates the winner.
- **Chop:** host proposes → players agree → game settles.
- **Per‑game chat** among the players.
- **Auto-updates in chat.** The app posts **system chat lines** automatically for the
  whole lifecycle, each prefixed with a **distinct icon** so the table can scan the
  feed at a glance:
  - 🙋 join request · 🪑 host joins as a player
  - ✅ admitted · 🛡️ co‑host added · 📨 invited (private games)
  - 👑 chip lead changes ("👑 … takes the chip lead — …")
  - 💥 eliminated (with finishing position) · 🚪 self‑busted · ↩️ reinstated
  - ✂️ chop proposed · 🏆 winner crowned
  The **final bust auto-completes** the game and crowns the winner.

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
- **One front door, both audiences.** The `?join=CODE` is applied by a **single
  applier** once signed in (`useApplyInviteOnLogin`), so the link behaves identically
  for a **brand‑new** user (just finished phone‑OTP + onboarding) and an **existing**
  user (already has an account). It joins, strips the param, and routes to the club.
- **Outcome is explicit:**
  - **Already a member** (public) → a green *"You're already a member of &lt;club&gt;"* welcome banner on the club page.
  - **Not a member** (public) → a pending request is created and a green *"Request sent — pending
    approval. The host has been notified"* banner shows (the persistent amber
    "read‑only — awaiting approval" banner covers later visits).
  - **Private club code** → the club is **never disclosed** (non‑disclosure), so instead
    of the club page the user gets a generic **"Request sent"** confirmation (with a
    **Back** button) — the request is still recorded and the host still notified. The
    join‑by‑code API returns a third outcome `requested` (vs the full club, vs not‑found)
    so the client can confirm without leaking that a private club exists.
- **Logged‑in users are never re‑prompted to log in** — the invite applies to their
  current account. Re‑auth only happens if there's no session.
- **The host is notified.** A new join request (invite‑code **or** Discover) creates an
  in‑app **notification** for every club manager (owner + hosts); admitting a member
  notifies that member. See §8b.

## 8c. Game invite links (club‑gated)
- Each game (LL / Squares / FT) has a **shareable link** `#/?game=<type>:<id>`
  (`ll`/`sq`/`ft`) via a **Share game** button on the game page.
- Opening it runs the **whole decision tree server‑side** (`POST /clubs/apply-game-invite`),
  so the link "does everything." A signed‑in user is **never re‑prompted to log in**:
  | State | Outcome |
  |---|---|
  | Host/co‑host, or already in the game | Open the game ("you're in"). |
  | **Club member**, not in the game | **Request to join the game** → game host alerted → "Request sent." |
  | **Not a club member** (public club) | **Request to join the club** first; the game is **remembered as an intent** and **auto‑requested the moment the club admits them**. Club page shows "Request sent — you'll be entered into the game automatically once admitted." |
  | Club membership still **pending** | Club page, "awaiting approval." |
  | **Private club** | Non‑disclosure: a generic "Request sent" (club/game not revealed). |
  | Game missing / ended / bad link | "Game unavailable." |
- **Club‑members‑only** is enforced at the **backend** (LL/Squares/FT reject a
  non‑member join; hosts/co‑hosts/admins bypass) — not just in the UI.
- A game‑join request **notifies the game host** (`game_join_request`, deep‑links to
  the game). The deferred auto‑join is stored in `game_join_intents` and fulfilled by
  `approveMember` on club admit.

## 8b. Notifications (in‑app)
- A **bell** in the header shows an **unread badge**; tapping opens a sheet of
  notifications (newest first) with a per‑type icon and relative time. Tapping one
  **deep‑links to the club** and marks it read; **Mark all read** clears the badge.
- Types today: **`club_join_request`** (to managers) and **`club_join_approved`** (to the
  admitted member). Recipient‑scoped — you only ever see your own.
- Live app: a `notifications` table (recipient‑scoped RLS; rows written by the
  service‑role edge functions) + a `/notifications` endpoint (list + unread count,
  mark‑read, mark‑all). Prototype: a seeded mock inbox for the host account.

## 9. Information architecture (anti‑clutter)
- **Discover** = act‑on surface: **clubs you can JOIN** (not ones you're in) +
  **open/live** contests & games (no settled history). **Clubs in the user's city are
  surfaced first** under a "Near you in &lt;city&gt;" section. A **location** (city, e.g.
  "Houston, TX") is captured on the **user at signup** and on the **club at creation**,
  and shown on each club row. **Every city input uses one shared `CityField`** —
  onboarding, club create, profile edit, and the LL game location — backed by a **free
  server‑side geocoder proxy** (`/places-search` → OpenStreetMap Nominatim, no key;
  env‑switchable to LocationIQ), falling back to a bundled list on any error.
- **Fantasy / Last Longer** = **active** games front‑and‑center, split **"You're
  hosting"** vs **"Playing in"**; **completed/your results** now show in an **always-visible "Completed (N)"**
  section (scoped to games you entered/hosted).
- **Clubs** = your clubs, in **one** place, split **"Hosting"** (clubs you manage) vs
  **"Member"**. There is **no separate "Host Console"** on Me — it duplicated this list;
  a host's owned clubs already live here (linking to the same club page, with pending
  badges). **Me** = the single **account home**: profile + email + wallet + **the 6‑skin
  appearance picker** + (admin) the Admin console + (prototype) the demo account‑switcher.
- **One account surface.** The **header** carries only the logo, the role chip, the
  **credits coin chip** (§19, non‑admin) and the **avatar**, where the avatar is a
  **shortcut to the Me tab** (`navigate('/me')`) — *not* a second account panel. This
  follows the mobile convention (Instagram/LinkedIn): the bottom **Me** tab is the
  canonical profile; the avatar just jumps there. **Picking a skin applies it and
  immediately returns you to the page you came from** (`onSelect` → `navigate(-1)`).
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
- **Live updates (no refresh).** Every game page (LL, Squares, FT) updates for **all**
  viewers in real time — admissions, chip counts, busts, claims, scores, lock/settle,
  and chat appear within ~1s without a reload. Mechanism: **Supabase Realtime**
  `postgres_changes` on each game's parent + child tables (`ll_games`/`ll_participants`/
  `chat_messages`, `squares_games`/`cells`/`participants`/`periods`,
  `ft_contests`/`contest_entries`/`chat_messages`). A change is a *signal* — the client
  refetches the authoritative view through the API (it never renders the raw payload).
  **The realtime socket is authorized as the signed‑in user** (the session JWT is pushed
  to the socket, not just the REST layer) because these tables' RLS only grants SELECT to
  `authenticated`; an anon socket receives nothing. A single shared `useRealtimeGame`
  hook wires all three. (Prototype runs on the mock store, so this is real‑app behavior.)

## 13. Football Squares (built — live on the rails)
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
- **Player flow:** request to join → **host admits** → **tap an empty square to claim it**. Each
  claim **locks with your initials but is PENDING the host's approval** — you can **withdraw a
  pending square** any time; once the host **approves** it, it's **locked in** (no withdraw). Your
  panel shows **squares chosen + owed** (e.g. `3 × 100 = 300 Stakes`), split into locked / pending.
  **Row/column digits are sealed until lock** (like FT picks) → revealed at lock.
- **Per‑square approval (host).** Every claimed square needs the **host's OK**. The host gets a
  **"Square approvals · N pending"** queue (avatar · name · cell ref `R3·C7` · **Approve ✓ / Reject ✗**,
  plus **Approve all**) and can also **tap any amber (pending) square on the grid to approve it**.
  Pending squares **pulse amber**; approved go solid. **At lock, any still‑pending squares are
  auto‑approved.** The host's players list shows each player's **squares chosen + owed**.
- **Live:** host enters each period's score (self‑report, like Last Longer) → the app
  highlights the winning cell (home last digit × away last digit) → marks the period
  winner → settled offline.
- **Data:** public NFL/sports scores — **no HUDR dependency.** This is an **engagement +
  acquisition** play, not a data‑moat play. Position it as the **top‑of‑funnel hook**;
  HUDR/FT Fantasy remain the **retention + moat**.
- **Reuses:** clubs, approval model, visibility/invite, paid toggle, sealed‑until‑lock,
  stakes buckets, chat, offline settlement. **Net‑new:** the 10×10 grid UI, random digit
  assignment at lock, period scoring, and **per‑square host approval** (claim → pending →
  approve/lock; withdraw only while pending) with a host approval queue + squares‑chosen/owed.
- **Implementation (plugs into the §18 multi‑game platform):** registered as the
  `football_squares` game type in `games/types.ts` (green/`Grid3x3`, sheet‑create), merged
  into the unified Games feed via `useUnifiedGames` and rendered by `SquaresRow`. Stack:
  `types/squares.ts`, `data/squaresStore.ts`, `lib/api/squaresServices.ts`,
  `hooks/squares.ts`, `components/squares/{SquaresRow,CreateSquaresSheet}.tsx`, the
  `SquaresGamePage` grid detail (`/squares/:id`), and a `CreateSquaresSheet` entry in the
  shared "+ New game" chooser. **Grid detail:** 10×10 board with sealed `?` digit headers
  until the host locks (random shuffle → status `live`), tap‑to‑claim/release for admitted
  active players during registration, per‑period host score entry that lights up the winning
  cell (`rowDigits.indexOf(home%10)` × `colDigits.indexOf(away%10)`), `Final` completes the
  game, plus host admit/paid‑toggle controls — same envelope as FT/LL.
- **Grid legibility & owner readout:** claimed‑cell initials render in `text-text-primary`
  (high‑contrast in every skin — near‑white on dark cells, dark on the pale avatar tint),
  not the old muted token. Hovering/focusing any claimed square surfaces the **owner's full
  name** — a colour‑dot + name (+ `pending approval` / `won …` / `you`) in the board section
  header (instant, never clipped by the grid's horizontal scroll), plus the native `title`
  at the cursor. Works the same in the app build.

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

### Unified lifecycle badge (all three games)
All games share ONE status badge so the wording never drifts: **Registration open** →
**Live** (with a **pulsing red "live now" dot**) → **Completed**. Single source of truth:
`lib/gameStatus.ts` (`lifecycleBadge` + the `ftPhase` normalizer) rendered via
`components/common/StatusBadge.tsx`. FT internally maps `open/locked/settled` onto the same
three labels. The badge follows the game's **status** (server/host‑driven), not the countdown:
when the registration deadline elapses the badge stays **Registration open** and the
`CountdownBanner` reads **Awaiting host** for host‑started games (LL, Squares).

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
- **Switching demo account routes to that role's home** (`navigate('/')`): the account
  switcher always lands you on the role‑aware first tab — **Discover** for a Player, the
  **Home dashboard** for a Host/Admin — instead of leaving you stranded on the previous
  role's page.
- **App Admin adds final tables** via an **"Add a final table"** form: event meta + the 9
  finalists by **name & chip stack**; the app **seats them A–I by stack** and
  **auto‑computes each ICM draft price from the stack** (concave ladder, ~13k–35k). A
  one‑tap **sample** fills a realistic table. The new FT appears immediately under hosts'
  **"FTs to host"**. **Players never see the slate**; the Host page (`/host-ft`) is guarded.
- **Entrants keep visibility:** a player can always see a contest/game they're **entered
  in**, even across clubs they're not a member of.

## 18. Multi‑game platform IA (scales to N game types)
ClubR is a **multi‑game platform** (FT Fantasy, Last Longer, **Football Squares** next, more
later). Navigation is by **entity/activity, never by game type**:
- **Bottom nav = Home · Clubs · Games · Me** (4 fixed tabs). The old per‑game tabs (Fantasy, Last
  Longer) are **replaced by a single Games tab**; adding a game type adds a **filter chip + a card
  variant**, never a nav slot.
- **Game‑type registry:** every type is declared once in **`games/types.ts`** (`GAME_TYPES` — label,
  icon, colors, create route/sheet). **`useUnifiedGames()`** merges all types into one sorted feed.
  The Games tab, filter chips and "+ New game" chooser all **iterate the registry** — so a new type
  is a registry entry + a render case + a create flow, with no plumbing changes.
- **Lifecycle phases:** **Registration open → Running → Completed.** (The in‑play badge reads
  **"Running"**, not "Live" — "Live" misread as "registration open." Single source: `gameStatus.ts`.)
- **Relationship filter (pill):** every games list carries a **relationship pill** —
  **Available · Playing · Hosting** (Hosting is **host/admin‑only**; players see **Available ·
  Playing**). Default **Hosting** for hosts, **Playing** for players. It **composes** with the
  type‑filter chips. Buckets (a partition of actionable games): **Hosting** = you **host** it (the host
  only — **co‑hosts are NOT here**) · **Playing** = you joined it (approved entry) **OR you co‑host it**
  (a co‑host card shows a **"Co‑host"** badge, "+ Playing" if you also joined; a pending request stays
  Available) · **Available** = joinable now (Registration open, not yours, not joined). A **Running**
  game you neither host, co‑host nor play appears **nowhere** (no "All").
  Pure helper `relationshipOf` (hook‑free, unit‑tested) + `RelationshipPills`.
- **Games tab** (`/games`, `GamesPage.tsx`) = the unified, cross‑club feed; active games sliced by
  the **relationship pill** + type chips (lazy‑rendered), with a separate **Completed** section
  whose cards are tagged **"You hosted / You played."**
- **Host Home feed** (`HostHomePage`) = below the "FTs to host" slate, a **"Games"** section with
  the same relationship pill + type chips, **lazy‑rendered** (`<InfiniteList/>`), ordered
  Registration‑open → Running (closed dropped). Replaces the old 4‑item cap + two‑section split.
- **Club = container:** a club detail page renders a **single "Games" section** driven by the same
  `useUnifiedGames` (filtered to that club) + the shared `renderUnifiedGame` — **all types in one
  place** with a per‑type filter chip row (only the types actually present) and a host‑only
  **"+ New"** that opens the same chooser pinned to that club (`fixedClubId`). No more hard‑coded
  per‑type sub‑sections — a new game type appears here automatically. The Games tab is the
  cross‑club aggregation of the same items (each carries `clubId`).
- **One create entry:** a single **"+ New game"** → *"What do you want to host?"* type chooser →
  the chosen type's create flow (`NewGameSheet.tsx`). Hidden for App Admin (overseer‑only).
- Every card uses one envelope — **type badge · club · status · StakePool (buy‑in·joined·pool) ·
  PayoutBadge · Countdown · Join/Enter** — so a new game type reuses all of it.
- **Per‑type accent everywhere:** each registry entry carries literal accent classes
  (`iconBg`/`ring`/`chipActive`) — purple FT · amber LL · emerald Squares — used by the chooser,
  the active filter chips (Games tab + club section) and the card badges, so a type reads the same
  color across every surface.
- **"How it works" per type:** a reusable `HowItWorks` walkthrough (numbered, plain‑English, always
  ending on the scorekeeper/holds‑no‑cash note) is surfaced from each game's page — FT Fantasy (on
  its page), **Last Longer** and **Football Squares** (a "How it works" chip on the game detail).
- *(Transitional: the old `/fantasy` & `/lastlonger` list pages still resolve but are out of nav;
  they're folded away in a later phase.)*

## 19. Credit economy (coins)
**Credits are the real‑money facilitation fee for *acting* — not a prize, and not "Stakes."** Stakes
stay the **offline, club‑settled** pool the app never touches; credits gate **joining / creating /
hosting**. Credits are **non‑cash, non‑refundable to money, and non‑transferable between users**
(keeps the §11 legal posture).

- **Starting balance:** every new user begins with **1000 credits** (this replaces the old
  "first 10 games free" trial in §10).
- **Action costs (App‑Admin‑configurable; defaults):** **Join a game = 100** · **Create a club =
  200** · **Host a game = 100**. Joining a *club* (membership), browsing, viewing and chat are
  **free**. A host who also *plays* their own game pays **both** (host + join); co‑hosts pay nothing.
- **Charge & refund:**
  - **Join (player):** charged **at request**. **Auto‑refunded** if the host **declines** the
    request or the player **withdraws before lock**. Once **approved and the game locks**, the join
    fee is **final**.
  - **Create club (200) / Host a game (100):** charged on creation. Non‑refundable — **except** the
    host **cancels the game before lock**, which refunds the **host fee + every player's join fee**.
  - All refunds return **credits** (never cash), each with a ledger entry.
- **Awareness:** every spend shows a **confirm sheet first** ("Join costs **100 cr** · **1000 →
  900** · Confirm") and the **CTA shows its cost** ("Request to join · 100 cr", "Create a club · 200
  cr", "Host this game · 100 cr").
- **Out of credits:** the action is **blocked**; the sheet shows the shortfall + a **"Buy credits"**
  button → the package store.
- **Purchase packages (App‑Admin‑configured):** each `{ label, credits, priceUSD, active, sortOrder,
  bonus? }`. Seed store: **500/$5 · 1,200/$10 · 2,000/$15 · 5,000/$30**. Buying goes through a
  **checkout step**: in the prototype it's a **mock confirm that instantly tops up** the balance +
  ledger; the same step becomes a **real checkout** when payments are wired (Phase 2 — processor +
  attorney, §12).
- **Wallet & ledger:** the balance shows as a **coin chip in the header**; **Me → Wallet** holds the
  balance, the package store, and a **transaction history** (date · action · +/− · balance after).
- **Roles:** Player & Club Host have balances and spend per the table above. **App Admin has no
  balance** — they own an **"Economy" section in the Admin console** to set the three action costs
  and **CRUD the packages**.
- **Phase 2 (noted, not built):** the **ClubR subscription** + **HUDR‑subscription fee waiver**
  return as alternatives to credits once HUDR integrates (supersedes the §10 subscription wording —
  for now everything runs on credits).
- **Prototype seed:** new accounts = 1000 cr; demo **Player (Sam) = 1000** (+ a few ledger entries),
  **Club Host (Harper) = ~600** (shows spend), App Admin = N/A.

## 20. Club leaderboards (points)
**Each club has its OWN leaderboard — there is no app‑wide / cross‑club board.** Members earn
**Leaderboard Points (LP)** by how they finish in *that club's* games, awarded by a platform
algorithm. It lives as the **Leaderboard tab on the Club Detail page** — never a top‑level nav
destination (reinforces club scope).

**Club Detail page IA (tabbed):** a segmented control under the club header — **Games · Leaderboard ·
Members** — defaulting to Games. **Members is host/admin‑only** (players never see the roster; the
header already shows "N members · hosted by X", so there's no member list for non‑hosts). **Host
actions are a compact row under the club title** (above the tabs): an **Invite** button (opens a small
sheet with the code + copy) and **New game**. The **join‑request queue lives in the Members tab**,
which **badges the pending count** so new requests aren't missed. **On the My Clubs list**, a host's
club row with pending requests shows a prominent **amber "N waiting" pill** (accent‑toned, every skin)
that **expands inline to Approve/Reject** each applicant — approvals happen straight from the list,
no need to open the club. Both player and host club pages stay
a clean **header → (host actions) → tabs → content**. The **Games tab's content sits in a panel that
connects flush to the tab bar** (the bar's bottom border is the seam, corners squared to meet it).
Built from theme tokens (`bg-bg-card/40`, `border-border`) → subtle and correct in every skin. The
panel uses a **two‑level filter**:
- **Type** is a **dropdown in the "Games" header** (`All games · FT Fantasy · Last Longer · Squares`),
  **auto‑hidden when the club runs a single type** (nothing to choose).
- **Status pills** below: **Available · Playing · Running · Completed**, default **Available** (a
  **Hosting** pill is inserted before Running for the **host/admin only**, `club.canManage`). The club
  is the container for **all** its games, so these buckets together let a member reach every one.
  **Available** = games you can **join now** (each card keeps its inline **Join**). **Playing** = games
  you've joined. **Hosting** = games you run; each card shows whether you're **playing** and offers an
  inline **"Join as player"** when you aren't (the host's own join is auto‑approved). **Running** =
  **every live game in the club**, relationship‑agnostic — so a member can watch live games they neither
  host nor play (overlaps Playing/Hosting by design; uses the "live" red accent). **Completed** =
  finished games, **infinite‑scroll, newest first by `settledAt`**, rendered as **rich winner cards**:
  the **winner(s)**, the **prize pool** (stake × entrants) and **what each won** — FT podium/winner‑
  takes‑all, Last Longer winner or **chop split**, Squares **period winners**.

- **The formula (field‑scaled, top‑heavy):** `points = round(B × √N ÷ √rank × weight)`, where **N**
  = number of participants and **rank** = the player's finish (1 = best). `√N` makes a **bigger
  field worth more**; `1/√rank` makes **winning worth far more** than mid‑pack. Default **B = 10**.
- **Scoring depth:** only the **top third** of the field (`ceil(N / 3)`) scores; everyone below = 0.
- **Minimum field:** a game must have **≥ 4 participants** to count at all.
- **Every game type feeds the same board, equal field‑scaling:**
  - **FT Fantasy** — rank approved entrants by fantasy score (the existing FINISH_POINTS scoring).
  - **Last Longer** — rank by finish position (1 = winner). Field = everyone who played.
  - **Football Squares** — rank period‑winners by **weighted winnings** (Final 70% / each quarter
    10%), then **× 0.5** (chance‑discounted). Non‑winners score 0.
  - Tied finishers **split** the points of the positions they jointly occupy, evenly.
- **Seasons:** points accumulate per **calendar month** (`YYYY‑MM` from the game's completion date);
  the board **resets monthly** and past months stay viewable via a season selector. Default = current.
- **Ranking & tiebreak:** sorted by **total points**, then most **wins** (1st‑place finishes), then
  most **podiums** (top‑3). The viewer's own row is highlighted; tap any row → member profile.
- **"+N LP" on completed games:** every settled/completed game shows each finisher the LP they earned
  toward the club board (FT settled result rows + champion, LL eliminated rows, a "Leaderboard
  points" block on completed Squares) — computed with the **same** algorithm as the board.
- **Explainer:** a **"How points work"** sheet by the title spells out the rules and, first, that the
  board is **this club only**.
- **App‑Admin‑configurable (global):** one `LeaderboardConfig` — `base`, `minField`, `depthDivisor`,
  `ftWeight`, `llWeight`, `squaresWeight` — tuned in the Admin console (mirrors the §19 Economy card).
- **Prototype seed:** settled/completed games carry a `settledAt` date spread across recent months so
  the season selector has content (e.g. Aces High: June = a settled FT + a Last Longer, May = a WTA FT).

### 20.1 Who counts as "played" / the field (per game type)
- **FT Fantasy:** field = **approved entries** (`status === 'approved'`); pending requests don't count.
  Rank = entrants sorted by fantasy score desc (sum of FINISH_POINTS for drafted seats vs the
  `finishingOrder`). A no‑show who was approved but never drafted still counts in the field at score 0.
- **Last Longer:** field = participants with `status` **active or out** (not `pending`). Rank = `finishPos`.
- **Football Squares:** field = participants with `status === 'active'`. Only **period‑winners** are
  ranked (by summed period `pct`); everyone else scores 0 but still counts toward "games played."
- A member appears on the board once they've **played ≥ 1 counted game** that season (points may be 0).

### 20.2 Worked example (defaults B=10, top‑third, min 4)
- FT, N=6 → scoring depth `ceil(6/3)=2`: 1st **24**, 2nd **17**, 3rd+ **0**.
- LL, N=5 → depth 2: 1st **22**, 2nd **16**, 3rd+ **0**.
- Squares, N=5, ×0.5: top winner **11**, 2nd winner **8**.
- Aces High **June** board = `ct_j` (FT) + `ll_g` (LL): Harper **40** (1×🥇, 2 podiums), Mike **22**,
  Tom **17**, rest 0 — matches the "+N LP" shown on each game.

### 20.3 Graduation to the real app (make this turnkey)
The prototype keeps the algorithm in **pure, portable modules** so the only thing that changes at
graduation is *where it runs*:
- **Reference implementation to port verbatim:** `src/lib/leaderboard/points.ts` (curve, depth,
  min‑field, tie‑split) and `src/lib/leaderboard/award.ts` (per‑game → LP, one function per type).
  `src/lib/api/leaderboardServices.ts` is the aggregation (bucket by month → sum → rank → tiebreak).
- **Server‑side, per the prime directive (no business logic in the browser):** the LP math must run
  on the API. Two viable shapes — (a) a **`leaderboard` edge function** that computes standings
  on read (one round‑trip, `RETURNS JSONB`, visibility‑gated to club members), or (b) a
  **`season_standings`** table updated when a game settles. The client just renders what the API sends.
- **Data the backend needs:** every game needs a **completion timestamp** (`settled_at` on
  `ft_contests` / `ll_games` / squares) to bucket into a `YYYY‑MM` season — the prototype already
  added `settledAt`. Field size + per‑game rankings derive from existing result data.
- **"+N LP" on results:** the API should return each finisher's earned LP on the settled‑game payload
  (FT entry, LL participant, Squares winner) so result screens show the same number the board uses —
  never recomputed client‑side.
- **Config:** `LeaderboardConfig` (`base`, `minField`, `depthDivisor`, `ftWeight`, `llWeight`,
  `squaresWeight`) becomes a stored global row, edited in the Admin console, seeded with the defaults
  (10 / 4 / 3 / 1 / 1 / 0.5).
- **Scope invariant:** **per‑club only** — never a global/cross‑club board (matches the PRD §13 "out"
  list). The Club Detail **Leaderboard tab** is the only surface; not a nav destination.
- **Tests at graduation:** unit‑test `points.ts` (curve shape, depth cutoff, min‑field, Squares
  weighting, tie‑split) + a contract test on the standings endpoint — the app's CI test‑coupling gate
  will require them.

## 21. Private clubs (visibility)
A club is **public** (default) or **private**. Public clubs are discoverable; **private clubs are
fully hidden** — and a direct URL must never reveal whether a private club exists.

- **Create:** the create-club form has a **Public / Private** toggle (default Public). A private club
  gets a **long random 8-char invite code** (ambiguous chars dropped); public clubs keep a short,
  readable code (e.g. `ACES24`).
- **Discovery exclusion:** private clubs never appear in **Discover**, **search**, or **by-location**
  lists for anyone but the admin or an existing member (`listRecentClubs` filters them out).
- **Non-disclosure gate (the key rule):** opening `/#/club/<id>` for a private club you're not in
  returns the **same result as a club that doesn't exist** — both render an identical
  **"Private or unavailable" gate** (invite-code field only). No name / emoji / description /
  member-count / location / owner is ever shown. So existence can't be probed by URL. `getClub`
  returns `null` for both cases; the page shows the gate (never "Club not found").
- **Join (code → request → approve):** entering a code on the gate (or the Join sheet) **silently
  submits a request**; the response is **generic** ("if a club matches that code, your request was
  sent — you'll get access once the host admits you") for a private match **and** for no match alike,
  so a code never confirms a private club exists. A **public** match still reveals the club name.
  **Pending requesters stay gated** until the host admits them (revealed only on approval).
- **Private badge on club rows:** wherever you can see a private club (your clubs, admin console),
  its row shows a prominent **amber `🔒 Private` badge** next to the name (accent‑toned, legible in
  every skin). Public clubs show no badge.
- **Invite is copy-only for private:** the Invite sheet **masks the code** (`••••••••`) and offers
  only **Copy link** — the owner copies & sends, never reads/dictates the code.
- **Change later:** the host can toggle **Public ⇄ Private** in the Members tab; switching
  **regenerates the invite code** (a fresh random one when going private).
- **Member profiles:** a member's **public** clubs are listed by name; **private** clubs show only as
  a count — **"Private clubs · N"** (names never revealed) — and private-club games stay member-only.
- **App Admin** sees private clubs (admin console + can open them); the gate applies only to
  regular non-member users.
- **Prototype:** "High Rollers" (`c_highrollers`) is seeded private (8-char code) to demo the gate,
  discovery exclusion, and the "Private clubs · 1" chip on Tom's profile.
- **Graduation (real app):** add `visibility` to `clubs` + a `getClub` that returns null for
  private-non-member (identical to not-found); exclude private from discovery queries; make the
  code-join RPC reveal only public matches; mint long codes for private; gate is client-rendered.

## 22. Telegram channel per club (prototype: mock; real: bot + webhook)
A club host can connect a **Telegram broadcast channel**; **approved members** join it from
ClubR, gated on club approval. Built as a **mock** in the prototype (no real bot yet); the live
design is below.

**Flow (validated):**
- **Host connects a channel:** creates a **private broadcast channel** in Telegram with
  **"approve new members" ON**, adds **`@ClubRBot` as admin**, and links it in ClubR (Members tab →
  *Telegram channel*). ClubR stores the channel.
- **Member links Telegram once:** via a bot deep-link `t.me/ClubRBot?start=<nonce>` — ties their
  `telegram_user_id` to the ClubR account. **Required** (the bot must match the joiner to a member).
- **Join is gated on approval:** a *pending* member sees nothing. Once the **host approves** them, a
  **"Join our Telegram"** card appears: Connect Telegram (if needed) → join-request → the bot
  **approves** them because they're a **linked, approved member** of the club that owns the channel.
- **Auto-remove:** when a member leaves / is removed from the club, the bot **kicks** them from the channel.
- **Auto-posts:** the bot posts **new-game + results announcements + monthly leaderboard recaps**, each with a deep link back to ClubR.
- **Stray join-requests** (someone with the link who isn't a linked, approved member): the bot
  **declines**. For a **public** club it DMs a "Join {Club} on ClubR first" link; for a **private**
  club it stays **generic** (no club name/link) — preserving the §21 non-disclosure.

**Key constraint:** a Telegram bot **cannot silently force-add** a user to a channel — the user must
tap/join and the bot approves the request. So "auto-join" = **one-tap, bot-approved for approved members**.

**Opt-in at club creation → deferred guided setup (validated):** the **Create a club** sheet has a
single-screen **"Telegram channel for members"** toggle (with the member-benefit blurb). Telegram does
**not** let a bot create a channel, so choosing it doesn't auto-create one — instead the new club page
shows a host-only **"Finish Telegram setup"** card: (1) create a **private broadcast channel** — the
wizard suggests **naming it close to the club** (e.g. "*&lt;Club&gt; Alerts*") so members recognize it —
(2) add **`@ClubrAdminBot`** as admin, (3) tap connect — the bot then makes the approval invite link, stores the
channel, and manages approvals/removals/auto-posts. Once connected it collapses to a subtle "Telegram
channel connected" line and the member `TelegramJoinChip` lights up. **Channel type = broadcast.**
**Auto-posts = new games · results (winner, no settlement $) · monthly leaderboard recaps.** Data:
`Club.telegramSetupPending` (set when the host opts in, cleared on connect).

**Prototype (this build):** `telegramServices` mocks connect/disconnect channel, link account, and the
approval-gated join (auto-approves an approved+linked member). UI: the host *Telegram channel* panel and
the big member *Join our Telegram* card remain **hidden** behind `TELEGRAM_ENABLED` while the real bot is
wired. **Brought forward independently** is a subtle **`TelegramJoinChip`** — a small inline chip in the
**club header** (under the description), shown **only to an admitted member of a club that has a channel**
(self-hides otherwise). **One tap** mirrors the real bot deep-link (links the account *and* admits the
approved member in a single action); after joining it collapses to **"✓ Joined · Open ↗"** (Open launches
the channel). Theme-token styled (accent-blue / accent-emerald) → subtle in every skin. Aces High is
seeded with a channel.

**Graduation (real app):** one platform bot (`TELEGRAM_BOT_TOKEN` edge secret) · a `telegram-webhook`
edge function (handles `chat_join_request`, `/start <nonce>` linking, `my_chat_member`) · DB:
`clubs.telegram_chat_id`, `users.telegram_user_id`, short-lived `telegram_link_tokens` · the webhook
calls `approveChatJoinRequest` / `declineChatJoinRequest` / `banChatMember` / `sendMessage`.
