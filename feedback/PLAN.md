# Research plan — Scout prototypes

## Goal
Decide which prototype direction to pursue and find the specific UX/UI/feature
issues to fix — across **features, usability, UI, trust, and value**.

## What we're testing
Four variants of the same poker opponent‑scouting app:
- **scout-engine** — full 4‑layer engine, dual Amateur/Pro mode, 6 skins
- **scout-crisp** — consolidated, plain‑English Amateur view
- **scout-stats** — stat → hands drill‑down focus
- **scout-sharp** — Pro‑first, evidence‑driven, sample‑size‑honest

## Who to recruit (this is the #1 success factor)
Poker stats are jargon. Generic usability panels are useless here. Recruit from
where poker players are: **poker Discords, r/poker, X/Twitter poker community,
staking groups**, and 2–3 **content creators / commentators** (the core ICP).

Segment and recruit ~5–8 per segment:
| Segment | Why |
|---|---|
| Recreational ("knows VPIP exists, not much more") | Tests the plain‑English value |
| Serious amateur / grinder | The realistic paying user |
| Pro / coach / content creator | The harshest, most informative critic |

## Methods (layered — qual for *why*, quant for *how much*)
| Phase | Method | n | Output |
|---|---|---|---|
| 1. Narrow | Unmoderated **preference test** across the 4 variants | 15–20 | Which direction, and why |
| 2. Depth | **Moderated think‑aloud** usability sessions (see `USABILITY_SCRIPT.md`) | 5–8 / segment | Task issues, the *why* |
| 3. Benchmark | **SUS + SEQ** survey per variant (see `SURVEY.md`) | 20+ | A 0–100 score to track over time |
| 4. Continuous | In‑app feedback button + PostHog autocapture/replay | all visitors | Passive signal at scale |

## What to measure
| Dimension | Instrument |
|---|---|
| Task success | % who complete each task in `TASKS.md` unaided |
| Effort per task | **SEQ** (1–7) right after each task |
| Overall usability | **SUS** (0–100; 68 = industry average) per variant |
| First impression / trust | 5‑second test + "does this look trustworthy?" 1–5 |
| Feature value | "most / least valuable feature", would‑you‑pay |
| Behaviour | PostHog funnels, heatmaps, drop‑off, rage‑clicks, replays |

## Decision rule
Pick the variant with the best **SUS + task success + qualitative enthusiasm**,
then fix the top issues by frequency × severity (NN/g severity 0–4).

## Watch‑outs
- **It's mock data** — tell testers "react to the experience, not the numbers."
- Pros *will* attack the **"Estimated"** sections in scout‑sharp — that's wanted signal.
- Don't deep‑test all 4; preference‑test first, then go deep on 1–2.
- Give **tasks, not tours** — set a goal and watch; never walk them through it.

## Rough timeline
Week 1: recruit + preference test → narrow. Week 2: moderated sessions + SUS.
Week 3: synthesize → prioritized fix list → re‑measure SUS after changes.
