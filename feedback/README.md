# Scout prototypes — feedback kit

Everything needed to gather structured feedback on the four Scout prototypes
(`scout-engine`, `scout-crisp`, `scout-stats`, `scout-sharp`) and turn it into
improvements.

## How feedback is collected

| Channel | What it captures | Where it lands |
|---|---|---|
| **In‑app "Give feedback" button** | Ease rating (1–5), what to improve, what worked, optional email — auto‑tagged with the prototype + screen | PostHog event `feedback_submitted` |
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
