# Arena — redesign rationale (UX notes)

## What the product actually is
Three things stacked: a **ledger people trust** (the pitch is "transparent
scorekeeper" — trust IS the product), a **live event companion** (the moments that
matter are a tournament running right now), and a **social ritual** (recurring
friend-group games; the app is plumbing for something offline).

Most poker apps optimize the live-companion and forget the ledger + the social
ritual — which are why anyone stays. Arena aims there.

## Problems in the original, and the fix
- **Home is a feed; feeds are the wrong shape here.** A player almost always has
  one of two intents (what's live that I'm in / where do I stand). → **Live-first
  home**, state over catalog.
- **"Stakes" is honest but cold.** Numbers float without meaning. → **Relationship
  ledger**: it's *your* number with *these* people.
- **Live state is buried in a list.** → **Persistent live bar** + live ring.
- **Game types are siloed** (three mental models). → **One unified game object**:
  same card, same lifecycle, same verbs; only the body changes per type.
- **Settlement is a footnote**, but it's the emotional peak. → lifecycle makes
  "settled" a first-class phase with the result surfaced on every card.

## Why "the detail page for every game" was the right centerpiece
The detail page is where a player *lives* during a session (an hour sweating an
FT, watching a Last Longer). Making all three share one spine means the player
learns the app once — that's what makes it feel "done": one mental model that
absorbs game-type #4 whenever it's built.

## On restraint
Gold means money + outcomes only (pots, your result, the active state), never
decoration. The boldness lives in two places — the live cue and the ledger — and
everything else stays quiet.

## The honest caveat
This is inferred from screenshots, not from watching a real crew on a Friday
night. Five user sessions would kill ~three of these assumptions and replace them
with better ones. The structure is built to absorb that: the derived layer
(`lib/arena/*`) is where the product logic lives, cleanly separable from the
verbatim foundation.
