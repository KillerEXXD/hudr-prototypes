# Scout Engine — Flow Analysis (4-Layer Poker Player Analysis Engine)

> Companion document to the prototype in this folder. Source spec:
> `Poker_Analysis_Build_Spec.docx`. Everything below maps the spec's five
> layers (Data Contract → Stat Engine → Player Typing → Exploit Matrix →
> Narrative) to (a) deterministic flow charts and (b) the prototype files that
> implement each step.
>
> **Architectural law (spec §0):** *Computation is deterministic and testable;
> only the prose is generated.* Layers 1–3 are pure functions of hand data.
> Layer 4 (LLM in production) only narrates numbers already computed — it can
> never invent a read, a stat value, or a counter-strategy.

---

## 0. End-to-end pipeline

```mermaid
flowchart LR
  HH["Hand histories<br/>(PokerStars text / JSON)"] --> L0
  subgraph DET["Deterministic · pure functions · unit-testable"]
    L0["Layer 0<br/>Data Contract<br/>normalized Hand model"]
    L1["Layer 1<br/>Stat Engine<br/>+ reliability tiers"]
    L2["Layer 2<br/>Player Typing<br/>archetype + confidence"]
    L3["Layer 3<br/>Exploit Matrix<br/>ranked Exploit[]"]
    L0 --> L1 --> L2
    L1 --> L3
    L2 --> L3
  end
  L1 --> PROFILE["Structured PlayerProfile (JSON)"]
  L2 --> PROFILE
  L3 --> PROFILE
  PROFILE --> L4["Layer 4 · LLM<br/>Narrative Synthesis"]
  L4 --> UI["UI · dual mode<br/>Plain English / Pro Stats"]
  PROFILE --> UI

  classDef det fill:#0e2a1f,stroke:#10b981,color:#d1fae5;
  classDef llm fill:#2a1f0e,stroke:#f59e0b,color:#fde68a;
  class L0,L1,L2,L3 det;
  class L4 llm;
```

**Build & test order (spec §7):** freeze Layer 0 → build parser → stat engine +
tiers → typer & exploit matrix → narrator last (the only place the system can be
wrong in an unbounded way).

| Layer | Prototype file | Real production home (TournamentPro / hudr-pwa) |
|------|----------------|--------------------------------------------------|
| 0 Data Contract | `src/data/*` (mock) | `pokerStarsParser.ts` + `HandAction` (exists ✅) |
| 1 Stat Engine | `src/engine/statDefs.ts`, `tiers.ts`, `profile.ts` | `services/stats/*Detector.ts` (exists; tiers MISSING) |
| 2 Player Typing | `src/engine/typing.ts` | **MISSING** — to build |
| 3 Exploit Matrix | `src/engine/exploits.ts` | partial in `HudrTendencyNotes.tsx` |
| 4 Narrative | `src/engine/narrative.ts` (deterministic stand-in) | `supabase/functions/ai-analysis` |

---

## 1. Layer 0 — Data Contract

```mermaid
flowchart TD
  A["Raw hand history"] --> B{Format?}
  B -->|PokerStars text| C["Format-specific parser"]
  B -->|Capture JSON| C
  C --> D["Normalized Hand model"]
  D --> E["players[]: seat → RELATIVE position<br/>BTN/SB/BB/CO/HJ/LJ/UTG"]
  D --> F["actions[]: street, type, amount,<br/>pot_before, to_call, stack_before,<br/>is_voluntary, facing(null/BET/RAISE/3BET/4BET)"]
  D --> G["board, showdown[]"]
  E --> H["Frozen contract — everything downstream<br/>operates ONLY on this model"]
  F --> H
  G --> H
```

Why relative position matters (spec §1.3): a player who opens 18% overall might
open 45% on the button and 9% UTG — the average hides the read. Every action
stores relative position so positional stats are computable.

---

## 2. Layer 1 — Stat Engine + Reliability Gating

```mermaid
flowchart TD
  A["Action stream (per player)"] --> B["Replay actions"]
  B --> C["For each stat: numerator / denominator<br/>VPIP, PFR, 3-Bet, Fold-to-3B, C-Bet,<br/>Fold-to-CBet, WTSD, W$SD, AF, AFq …"]
  C --> D["opportunities = the DENOMINATOR<br/>(faced-an-open, saw-flop, faced-a-3bet…)"]
  D --> E{"Tier by opportunities<br/>(per category)"}
  E -->|"preflop ≥30 / postflop ≥20"| R["RELIABLE<br/>use freely"]
  E -->|"10–29 / 8–19"| T["TENTATIVE<br/>show 'small sample', weight lightly"]
  E -->|"<10 / <8"| N["NOISE<br/>do NOT display · do NOT feed downstream"]
  R --> OUT["StatWithTier[]"]
  T --> OUT
  N --> OUT

  classDef ok fill:#0e2a1f,stroke:#10b981,color:#d1fae5;
  classDef warn fill:#2a1f0e,stroke:#f59e0b,color:#fde68a;
  classDef bad fill:#1c1c26,stroke:#6b6b82,color:#a1a1b5;
  class R ok; class T warn; class N bad;
```

> **The single most dangerous failure mode** is a stat off too few hands that
> looks like a read. Tiers are per-denominator, tracked independently —
> Fold-to-3Bet may need hundreds of hands to reach RELIABLE.
>
> Prototype: `tiers.ts` (`computeTier`), thresholds in `TIER_THRESHOLDS`;
> per-stat denominators modelled in `statDefs.ts` (`oppMultiplier`).

---

## 3. Layer 2 — Player Typing

```mermaid
flowchart TD
  A["StatWithTier[]"] --> B["Drop NOISE-tier stats"]
  B --> C["confidence = RELIABLE inputs / typing inputs<br/>(VPIP, PFR, gap, AFq, 3-Bet)"]
  C --> D{"≥ 3 RELIABLE inputs?"}
  D -->|no| U["UNCLASSIFIED<br/>(too thin)"]
  D -->|yes| E{"Match boundaries in order"}
  E -->|"VPIP≥40, PFR≥32, AFq≥60"| MAN["Maniac"]
  E -->|"VPIP≥28, AF<1.2, FoldCBet<40"| STA["Calling Station"]
  E -->|"VPIP 27–40, PFR 22–34, gap≤8, 3B≥8"| LAG["LAG"]
  E -->|"VPIP 18–26, PFR 15–22, gap≤6, AFq≥45"| TAG["TAG"]
  E -->|"VPIP≥30, gap≥10, AF<1.5"| FISH["Passive Fish"]
  E -->|"VPIP≤15, PFR≤12, FoldTo3B≥65"| NIT["Nit"]
  E -->|"no clean match"| U2["UNCLASSIFIED<br/>(don't force a label)"]

  classDef arch fill:#1a1430,stroke:#8b5cf6,color:#e9d5ff;
  class MAN,STA,LAG,TAG,FISH,NIT,U,U2 arch;
```

Boundaries are **explicit config** (`ARCHETYPE_BOUNDARIES` in `typing.ts`) so
they're tunable per tournament stage (stacks shrink, ranges widen). Output
carries a confidence score = fraction of typing inputs that are RELIABLE — a TAG
built on 3/5 reliable stats is weaker than one on 5/5, and that surfaces to the
narrative layer.

---

## 4. Layer 3 — Exploit Matrix

```mermaid
flowchart TD
  A["StatWithTier[]"] --> B{"For each leak rule"}
  B --> C{"trigger stat RELIABLE?"}
  C -->|no| SKIP["skip (gated out)"]
  C -->|yes| D{"predicate true?<br/>e.g. FoldToCBet>60"}
  D -->|no| SKIP
  D -->|yes| E["Build Exploit{<br/>leak_id, trigger_stat, trigger_value, tier,<br/>counter_text, confirmation_stat, severity}"]
  E --> F["severity = base + distance-past-threshold"]
  F --> G["Sort by severity desc"]
  G --> H["ranked Exploit[] → narrative + UI"]

  classDef amber fill:#2a1f0e,stroke:#f59e0b,color:#fde68a;
  class E,F,G,H amber;
```

This is the product's value: a deterministic lookup mapping each leak to a
specific counter-move **and** a confirmation stat that tells you whether the
exploit is working. ~10 rules ship in `EXPLOIT_RULES` (`exploits.ts`):
fold-to-cbet>60, fold-to-turn-cbet>55, fold-bb-to-steal>70, fold-to-3bet>65,
cbet-flop>75, station, WTSD>32 w/ low W$SD, check-raise>12, donk>8, 3bet<4.
`severity` ranks which leaks lead the report.

---

## 5. Layer 4 — Narrative Synthesis (only LLM layer in production)

```mermaid
flowchart TD
  P["Structured PlayerProfile JSON<br/>typing + ranked exploits + tiers<br/>(NEVER raw hands)"] --> G["Narrator"]
  G --> R1["Nickname + one-line summary"]
  G --> R2["Player type in plain words<br/>+ confidence caveat"]
  G --> R3["Top-3 exploits by severity<br/>each w/ concrete counter"]
  G --> R4["Sample hand per leak<br/>(real, not invented)"]
  G --> R5["One-paragraph game plan"]
  subgraph GUARD["Hard constraints"]
    H1["Every claim traces to a provided stat/exploit"]
    H2["TENTATIVE → hedged language"]
    H3["NOISE → omitted entirely"]
    H4["Low confidence → say so up front"]
  end
  G -.enforced by.-> GUARD

  classDef llm fill:#2a1f0e,stroke:#f59e0b,color:#fde68a;
  class G,R1,R2,R3,R4,R5 llm;
```

In this prototype the prose is generated **deterministically** from the profile
(`narrative.ts`) to demonstrate the constraint without an API call. In
production this becomes a Claude call whose input is the profile JSON only, with
a guardrail test that scans the output for any number not present in the input
(spec §6.3).

---

## 6. UX flow (dual-mode product)

```mermaid
flowchart TD
  FIND["Find — search<br/>Tournaments | Players"] -->|select tournament| TOUR
  FIND -->|select player| SCOUT
  subgraph TOUR["Tournament analysis"]
    R["Roster + status + archetype"]
    AIC["AI Chat (grounded in profiles)"]
    ST["Stats: Pro table / Plain read"]
  end
  R -->|tap player| SCOUT
  ST -->|tap player| SCOUT
  subgraph SCOUT["Player Scouting Report"]
    S1["Header: nickname + archetype + confidence"]
    S2["How they play (typing)"]
    S3["How to beat them (ranked exploits + counters + sample hands)"]
    S4["Game plan"]
    S5["Stats / positional (density varies by mode)"]
  end
  MODE["Global toggle:<br/>Plain English  ⇆  Pro Stats"] -.rewrites copy + density.-> TOUR
  MODE -.-> SCOUT
  MODE -.-> FIND
```

**Dual-mode mapping** (one global toggle, `ModeContext`):

| Element | Plain English | Pro Stats |
|--------|---------------|-----------|
| Archetype | "Tight & Aggressive" | `TAG`, boundary trace |
| Stats | friendly name + meaning, bar; NOISE hidden | label + value + **tier chip** + opportunities; all shown |
| Reliability | "Strong / early / first-impression read" | RELIABLE / TENTATIVE / NOISE + opp counts |
| Exploit | "fire a bet on the flop and take the pot" | counter + trigger stat + severity + confirmation stat |
| AI answer | plain target advice | stat-cited, severity-aware |

---

## 7. What exists today vs. what this prototype adds

| Capability | Real hudr-pwa / TournamentPro | Prototype |
|-----------|-------------------------------|-----------|
| Parser + normalized model (L0) | ✅ exists | mock data |
| ~22 stats (L1) | ✅ exists, PT4-validated | modelled |
| Reliability tiers (L1) | ❌ ad-hoc only | ✅ first-class (RELIABLE/TENTATIVE/NOISE) |
| Positional open% (L1) | ⚠️ captured, not aggregated | ✅ per-seat with tiers |
| Player typing (L2) | ❌ missing | ✅ boundary-based + confidence |
| Exploit matrix (L3) | ⚠️ hardcoded strings | ✅ structured, RELIABLE-gated, ranked |
| Scouting report (L4) | ⚠️ no counters/game-plan/sample hands | ✅ full report, dual-mode |
| Dual Plain/Pro mode | ❌ | ✅ global toggle |

The roadmap to port these into production (RPCs for tiers + positional, pure
`playerTyping.ts` / `exploitMatrix.ts` mirrored into `_shared`, a `profile`
sub-route on `ai-analysis`, and the scouting UI upgrade) is in the planning doc
at `~/.claude/plans/analyze-this-document-and-mellow-thunder.md`.
