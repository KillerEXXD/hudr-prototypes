import { PROTOTYPE } from './analytics'

// =====================================================================
// Feature sections for the guided per-prototype review. Each becomes one
// step in the ReviewWizard (score 1–5 + liked + disliked). `tryPath` is a
// hash route the tester can open in a new tab to try the feature first.
// Prototype-aware: the Stats/AI/tournament surfaces differ across the four
// prototypes, so a few entries branch on PROTOTYPE.
// =====================================================================

export interface ReviewSection {
  key: string
  title: string
  blurb: string
  /** hash path (without the leading #) to deep-link the feature, opened in a new tab */
  tryPath?: string
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
    { key: 'first_impression', title: 'First impression', blurb: 'Before going deep — what is this app, who’s it for, and does it look trustworthy?' },
    { key: 'discover', title: 'Finding tournaments & players', blurb: 'The home / Discover screen and search — how easy was it to find a tournament or a player?', tryPath: '/' },
    { key: 'tournament', title: 'Tournament overview', blurb: tournamentBlurb, tryPath: '/tournament/t1' },
    { key: 'highlights', title: 'Highlights', blurb: 'The curated highlight hands for a tournament (the Highlights tab).', tryPath: '/tournament/t1' },
    { key: 'stats', title: 'Stats & the hands behind them', blurb: statsBlurb, tryPath: statsTry },
    { key: 'ai', title: 'Asking the AI', blurb: aiBlurb, tryPath: aiTry },
    { key: 'replays', title: 'Watching hands / replays', blurb: 'Opening a hand and watching it (YouTube clip / replayer) — the Watch button.', tryPath: '/tournament/t1' },
    { key: 'player_report', title: 'Player scouting report', blurb: 'The core: a player’s read — their leaks, how to beat them, and the evidence hands.', tryPath: '/player/p3' },
    { key: 'navigation', title: 'Finding your way around', blurb: 'Overall — was it easy to get where you wanted? Did anything confuse you?' },
    { key: 'design', title: 'Look & feel (UI)', blurb: 'The visual design — clean, cluttered, polished, dated?' },
    { key: 'trust', title: 'Do the reads feel trustworthy?', blurb: 'Did the stats and reads feel credible — would you actually act on them?' },
  ]
}
