# Moderated usability session — script

**Format:** 1:1, 30–45 min, screen‑share, recorded (with consent). **Think‑aloud.**
**Golden rule:** give a goal, then *shut up and watch*. Don't lead, don't rescue
unless they're truly stuck (then note it as a failure first).

---

## 0. Intro (3 min)
> "Thanks for helping. This is an early **prototype** — the data is fake placeholder
> numbers, so react to the *experience*, not whether a stat looks right. **We're
> testing the app, not you** — there are no wrong answers, and if something's
> confusing that's exactly what we need to hear.
>
> Please **think out loud** the whole time — say what you're looking at, what you
> expect to happen, and when something surprises or annoys you. Mind if I record
> the screen and audio?"

Get verbal consent. Confirm their poker background (segment).

## 1. First impression (2 min) — *before* they touch anything
Open the home/Discover screen. Don't let them click yet.
- "What is this app? Who's it for? What can you do here?"
- "What stands out? Does it look trustworthy?"
- (5‑second variant: show 5s, hide, ask what they remember.)

## 2. Tasks (20–25 min)
Run the scenarios in [`TASKS.md`](TASKS.md) for this person's segment, in order.
For each task:
1. Read the scenario aloud; let them work **unaided**.
2. Watch where they hesitate, mis‑click, backtrack, or give up.
3. If stuck >~60s, note it as a fail, then give the smallest nudge.
4. **After each task, ask the SEQ:** *"Overall, how easy or difficult was that?"*
   (1 = very difficult … 7 = very easy) — and "why that number?"

Prompts to keep them talking (never leading):
- "What are you expecting to happen here?"
- "What would you do next?"
- "You paused — what's going through your head?"

## 3. Reactions to specifics (5 min)
- The **leak → counter → real hand → Watch** flow: useful? trustworthy?
- (scout‑sharp) The **"Estimated"** tags on sizing/positions/showdown — what do
  you make of those vs the other numbers?
- The **AI** assistant — did you notice it? would you use it, or just read the page?
- The **sample‑size / `n=` / Reliable‑Tentative** treatment — clear? does it
  build or hurt trust?

## 4. Wrap‑up (5 min)
- "Most valuable thing here? Least valuable / would cut?"
- "One thing you'd change first?"
- "Would you use this for your own game? Would you pay for it — and how much?"
- (Comparative day) "You saw a few versions — which felt best, and why?"
- Hand them the **SUS** ([`SURVEY.md`](SURVEY.md)).

## Note‑taking columns
`Task | Completed? (Y/N/assisted) | SEQ | Where it broke | Verbatim quote | Severity (0–4)`

NN/g severity: 0 = not a problem · 1 = cosmetic · 2 = minor · 3 = major · 4 = catastrophe.
Prioritize fixes by **frequency × severity**.
