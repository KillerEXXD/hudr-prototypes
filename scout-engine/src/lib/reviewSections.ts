import { PROTOTYPE } from './analytics'

// =====================================================================
// Feature sections for the guided per-prototype review. Each becomes one
// step in the ReviewWizard (score 1–5 + liked/disliked chips + free text).
// `tryPath` is a hash route the tester can open in a new tab to try first.
// `likedChips` / `dislikedChips` are tappable quick-pick suggestions (the
// tester can also type). Prototype-aware where surfaces differ.
// =====================================================================

export interface ReviewSection {
  key: string
  title: string
  blurb: string
  /** hash path (without the leading #) to deep-link the feature, opened in a new tab */
  tryPath?: string
  /** quick-pick positive suggestions */
  likedChips?: string[]
  /** quick-pick negative suggestions */
  dislikedChips?: string[]
}

export function getReviewSections(): ReviewSection[] {
  const p = PROTOTYPE // 'engine' | 'crisp' | 'stats' | 'sharp' | 'scout'

  const statsTry = p === 'sharp' ? '/player/p3'
    : p === 'stats' ? '/tournament/t1/player/p3'
    : '/tournament/t1'
  const aiTry = p === 'sharp' ? '/player/p3' : '/ai'

  const tournamentBlurb = p === 'sharp'
    ? 'Open a tournament — the Results tab (final standings, prize money, watch the bust), plus Hands, Highlights and Stats.'
    : 'Open a tournament — the player roster, Hands, Highlights and the Stats table.'
  const statsBlurb = (p === 'sharp' || p === 'stats')
    ? 'A player’s stats — and tapping a stat to see the actual hands behind it.'
    : 'The per-player stats table for a tournament.'
  const aiBlurb = p === 'sharp'
    ? 'The “Ask AI” chat on a player report and on a tournament.'
    : 'The AI assistant — ask about a table or a specific player.'

  return [
    {
      key: 'first_impression', title: 'First impression',
      blurb: 'Before going deep — what is this app, who’s it for, and does it look trustworthy?',
      likedChips: ['Clear what it does', 'Looks trustworthy', 'Looks polished', 'I’d explore more'],
      dislikedChips: ['Confusing purpose', 'Looks cluttered', 'Not sure who it’s for', 'Looks unfinished'],
    },
    {
      key: 'discover', title: 'Finding tournaments & players',
      blurb: 'The home / Discover screen and search — how easy was it to find a tournament or a player?',
      tryPath: '/',
      likedChips: ['Easy to find things', 'Search works well', 'Good layout'],
      dislikedChips: ['Hard to find things', 'Search confusing', 'Too cluttered'],
    },
    {
      key: 'tournament', title: 'Tournament overview', blurb: tournamentBlurb, tryPath: '/tournament/t1',
      likedChips: ['Clear standings/results', 'Easy to navigate', 'Useful at a glance'],
      dislikedChips: ['Too many tabs', 'Confusing layout', 'Missing info I wanted'],
    },
    {
      key: 'highlights', title: 'Highlights',
      blurb: 'The curated highlight hands for a tournament (the Highlights tab).', tryPath: '/tournament/t1',
      likedChips: ['Fun to browse', 'Good picks', 'Clear what they are'],
      dislikedChips: ['Not interesting', 'Unclear what they are', 'Too few'],
    },
    {
      key: 'stats', title: 'Stats & the hands behind them', blurb: statsBlurb, tryPath: statsTry,
      likedChips: ['Love the hands-behind-a-stat', 'Easy to read', 'Sample sizes build trust'],
      dislikedChips: ['Too many numbers', 'Hard to find', 'Didn’t trust the numbers'],
    },
    {
      key: 'ai', title: 'Asking the AI', blurb: aiBlurb, tryPath: aiTry,
      likedChips: ['Answers were useful', 'Felt natural', 'Fast'],
      dislikedChips: ['Didn’t notice it', 'Answers felt canned', 'Didn’t trust it'],
    },
    {
      key: 'replays', title: 'Watching hands / replays',
      blurb: 'Opening a hand and watching it (YouTube clip / replayer) — the Watch button.', tryPath: '/tournament/t1',
      likedChips: ['Easy to watch', 'Replayer is nice', 'Loads fast'],
      dislikedChips: ['Hard to find the Watch button', 'Clunky', 'Didn’t work as expected'],
    },
    {
      key: 'player_report', title: 'Player scouting report',
      blurb: 'The core: a player’s read — their leaks, how to beat them, and the evidence hands.', tryPath: '/player/p3',
      likedChips: ['Leaks are actionable', 'Evidence hands are great', 'Easy to scan'],
      dislikedChips: ['Too long', 'Too much jargon', 'Didn’t trust the reads'],
    },
    {
      key: 'navigation', title: 'Finding your way around',
      blurb: 'Overall — was it easy to get where you wanted? Did anything confuse you?',
      likedChips: ['Easy to get around', 'Never got lost', 'Logical'],
      dislikedChips: ['Got lost', 'Too many taps', 'Confusing back/forward'],
    },
    {
      key: 'design', title: 'Look & feel (UI)',
      blurb: 'The visual design — clean, cluttered, polished, dated?',
      likedChips: ['Clean', 'Polished', 'Easy on the eyes'],
      dislikedChips: ['Cluttered', 'Dated', 'Low contrast / hard to read'],
    },
    {
      key: 'trust', title: 'Do the reads feel trustworthy?',
      blurb: 'Did the stats and reads feel credible — would you actually act on them?',
      likedChips: ['Felt credible', 'I’d act on it', 'Numbers add confidence'],
      dislikedChips: ['Felt made up', 'Not enough evidence', 'Too good to be true'],
    },
  ]
}
