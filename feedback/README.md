# Scout prototypes — feedback kit

Everything needed to gather structured feedback on the four Scout prototypes
(`scout-engine`, `scout-crisp`, `scout-stats`, `scout-sharp`) and turn it into
improvements.

## How feedback is collected

| Channel | What it captures | Where it lands |
|---|---|---|
| **In‑app guided review** (the main one) | A ~12‑step, feature‑by‑feature scored review — score 1–5 + liked + disliked per feature, ending in would‑use / would‑pay / NPS | PostHog event `prototype_review_submitted` |
| **In‑app "Give feedback" button** | Quick note: ease rating (1–5), what to improve, what worked, optional email | PostHog event `feedback_submitted` |
| **PostHog autocapture** | Every click/tap, route change (`$pageview`) | PostHog (project 316669) |
| **PostHog session replay** | Full screen recordings of real sessions | PostHog → Replays |
| **Moderated usability sessions** | The *why* behind behaviour (think‑aloud) | Notes + the script below |
| **Survey (SUS + SEQ)** | Benchmarkable usability scores per variant | Google Form / Typeform |

Every prototype event carries two super‑properties so prototype traffic is
trivially separable from production: `prototype` (`engine`/`crisp`/`stats`/`sharp`)
and `surface = "scout-prototype"`.

## PostHog setup (one‑time)

1. **Filter prototype traffic:** in any insight, filter `surface = scout-prototype`.
   Break down by `prototype` to compare variants side‑by‑side.
2. **Funnel to build** (Insights → New funnel, filtered to `surface = scout-prototype`):
   `$pageview (screen=#/)` → `$pageview (screen contains /tournament/)` →
   `$pageview (screen contains /player/)` → autocaptured tap on a stat card →
   autocaptured "Watch". Break down by `prototype`.
3. **Feedback dashboard:** trend of `feedback_submitted`, average `ease`,
   and a table of the `improve` text. Break down by `prototype` + `screen`.
4. **Replays:** Replays → filter `surface = scout-prototype`; jump straight from a
   low `ease` feedback event to that person's recording.

## The guided review (main feedback channel)

Each prototype has a **"Take the 3‑min guided review"** flow — launched from the
floating Feedback button. It walks the tester through every feature area (Browse
tournaments, Tournament overview, Highlights, Stats & the hands behind them, Asking
the AI, Watching replays, the Player scouting report, plus Navigation / UI / Trust),
asking for a **1–5 score + what you liked + what you didn't** on each, then an
**overall** step (would‑use 1–5, would‑pay, NPS, free note). Each step has an
"↗ Open this feature to try it" deep link. Section list + deep links adapt per
prototype (e.g. sharp's Stats step points at the in‑report drill).

**Process:** give each tester **one** prototype link (different people → different
prototypes) and aggregate per prototype — avoids 60‑question fatigue.

### Event shape — `prototype_review_submitted`
One event per completed review, tagged `prototype` + `surface`, with flattened
properties so PostHog can average per‑feature scores:
`score_<key>`, `liked_<key>`, `disliked_<key>` for each feature
(`first_impression`, `discover`, `tournament`, `highlights`, `stats`, `ai`,
`replays`, `player_report`, `navigation`, `design`, `trust`), plus `would_use`
(1–5), `would_pay` (no/maybe/yes), `would_pay_amount`, `nps` (0–10), `overall_note`.

### Reviewing it
**Live (PostHog):** new insight filtered to `event = prototype_review_submitted`,
broken down by `prototype`:
- a **bar of average `score_*`** per feature (one series per feature) → see exactly
  which feature each prototype wins/loses on;
- **NPS** (promoters 9–10 minus detractors 0–6) and **would‑pay** distribution;
- a **table/events view** of the `liked_*` / `disliked_*` / `overall_note` text.

**Offline (consolidated per‑prototype markdown):**
```
POSTHOG_PERSONAL_KEY=phx_...  node feedback/pull-reviews.cjs
```
(`POSTHOG_PERSONAL_KEY` is the read‑only PostHog "Query Read" personal key — the
same one the `/posthog` command uses; it's a secret, so it's passed via env, never
committed.) Pulls all reviews via the PostHog query API and writes `feedback/reviews-<date>.md`
— one section per prototype with an average‑score table, NPS / would‑pay, and every
verbatim like/dislike. (Generated reports are git‑ignored.)

## The kit

| File | Use |
|---|---|
| [`PLAN.md`](PLAN.md) | The research plan — goals, who to recruit, sample sizes, method mix, what to measure |
| [`USABILITY_SCRIPT.md`](USABILITY_SCRIPT.md) | Moderated 1:1 session script (intro → tasks → wrap‑up) |
| [`TASKS.md`](TASKS.md) | Task scenarios mapped to the app's flows, by audience segment, with success criteria |
| [`SURVEY.md`](SURVEY.md) | Ready‑to‑paste SUS + SEQ + preference + willingness‑to‑pay |

## Suggested sequence

1. **Comparative preference test** (unmoderated, ~15–20 poker players) → narrow 4 variants to 1–2.
2. **Moderated usability sessions** (5–8 per segment) on the winner(s) → the *why*.
3. **SUS survey** per variant → a benchmark score you can re‑measure after changes.
4. **Leave the in‑app button + PostHog on** continuously → passive signal at scale.
