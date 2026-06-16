// =====================================================================
// Feature sections for the guided ClubR review. Each becomes one step in
// the ReviewWizard (score 1–5 + liked/disliked chips + free text).
// `tryPath` is a hash route the tester can open in a new tab to try first
// (ClubR auth persists in localStorage, so the new tab lands signed-in).
// `likedChips` / `dislikedChips` are tappable quick-picks (can also type).
// =====================================================================

export interface ReviewSection {
  key: string
  title: string
  blurb: string
  /** hash path (without the leading #) to deep-link the feature, opened in a new tab */
  tryPath?: string
  likedChips?: string[]
  dislikedChips?: string[]
  /** hide the 1–5 score row (e.g. open-ended idea steps) */
  hideScore?: boolean
  /** override the default step labels */
  scoreLabel?: string
  likedLabel?: string
  dislikedLabel?: string
}

export function getReviewSections(): ReviewSection[] {
  return [
    {
      key: 'first_impression', title: 'First impression',
      blurb: 'Before going deep — what is ClubR, who’s it for, and does it look trustworthy?',
      likedChips: ['Clear what it does', 'Looks trustworthy', 'Looks polished', 'I’d explore more'],
      dislikedChips: ['Confusing purpose', 'Looks cluttered', 'Not sure who it’s for', 'Looks unfinished'],
    },
    {
      key: 'discover', title: 'Discover — clubs & live games',
      blurb: 'The Discover screen — finding clubs you can join and the open / live games. Was it clear what to do next?',
      tryPath: '/',
      likedChips: ['Easy to find clubs', 'Clear what’s live', 'Good layout'],
      dislikedChips: ['Hard to find things', 'Too cluttered', 'Not sure what to tap'],
    },
    {
      key: 'clubs', title: 'Joining a club',
      blurb: 'Requesting to join a club and waiting for the host to admit you — you’re read-only until approved.',
      tryPath: '/clubs',
      likedChips: ['Join flow is clear', 'Approval makes sense', 'Felt secure'],
      dislikedChips: ['Confusing to join', 'Approval felt unclear', 'Couldn’t tell my status'],
    },
    {
      key: 'ft_fantasy', title: 'FT Fantasy (Stack Draft)',
      blurb: 'Drafting 4 of the 9 final-table players within a budget (ICM-priced), with picks sealed until the lock, then scoring.',
      tryPath: '/fantasy',
      likedChips: ['Draft is fun', 'Budget/ICM makes sense', 'Sealed picks feel fair', 'Scoring is clear'],
      dislikedChips: ['Draft confusing', 'Didn’t get the budget', 'Unclear when it locks', 'Scoring unclear'],
    },
    {
      key: 'last_longer', title: 'Last Longer',
      blurb: 'The club’s own live tournament — the live board, reporting your chips, busting yourself, and the chop.',
      tryPath: '/lastlonger',
      likedChips: ['Live board is clear', 'Self-bust is handy', 'Chop is useful', 'Easy to follow'],
      dislikedChips: ['Board confusing', 'Hard to update chips', 'Missed how to bust', 'Too fiddly'],
    },
    {
      key: 'chat', title: 'In-game chat',
      blurb: 'Each game has its own chat for the players. Did you use it? Was it easy to find, and useful for coordinating the game (or a bit of banter)?',
      tryPath: '/lastlonger',
      likedChips: ['Handy for coordinating', 'Easy to find', 'Good for banter', 'Keeps it in one place'],
      dislikedChips: ['Didn’t notice it', 'Hard to find', 'Felt unnecessary', 'Wanted notifications'],
    },
    {
      key: 'hosting', title: 'Hosting a game',
      blurb: 'As a host — creating an FT Fantasy contest from the slate or a Last Longer, admitting players, and managing the game.',
      tryPath: '/me',
      likedChips: ['Easy to create a game', 'Admitting players is clear', 'Host controls make sense'],
      dislikedChips: ['Hard to create', 'Too many steps', 'Couldn’t find host controls'],
    },
    {
      key: 'paid_vetting', title: 'Paid tracking & vetting',
      blurb: 'The subtle green / grey “paid” toggle, and reviewing a member’s details before admitting them (host-only).',
      tryPath: '/me',
      likedChips: ['Paid toggle is subtle & clear', 'Vetting info is enough', 'Right things are host-only'],
      dislikedChips: ['Paid toggle unclear', 'Not enough member info', 'Privacy felt off'],
    },
    {
      key: 'transparency', title: 'Transparent scorekeeper',
      blurb: 'ClubR tracks the count & result but holds no money — all stakes are settled offline between players. Does that model make sense and feel trustworthy?',
      likedChips: ['Makes sense', 'Feels trustworthy', 'Good that no cash is held'],
      dislikedChips: ['Confusing', 'Expected it to handle money', 'Unsure how settlement works'],
    },
    {
      key: 'navigation', title: 'Finding your way around',
      blurb: 'Overall — was it easy to get where you wanted (Discover, Clubs, Fantasy, Last Longer, Me)? Anything confusing?',
      likedChips: ['Easy to get around', 'Never got lost', 'Logical'],
      dislikedChips: ['Got lost', 'Too many taps', 'Confusing back/forward'],
    },
    {
      key: 'skins', title: 'Trying different skins',
      blurb: 'In Me, ClubR ships with several appearance skins — try switching between a few. Did you find them easily? Did changing the look make it more fun, and did one stand out as your favourite?',
      tryPath: '/me',
      likedChips: ['Love having skins', 'Easy to switch', 'Found a favourite', 'Makes it more fun', 'Fun to try them all'],
      dislikedChips: ['Couldn’t find the skins', 'Didn’t see the point', 'They all felt similar', 'Hard to switch', 'None felt right'],
    },
    {
      key: 'design', title: 'Look & feel (UI)',
      blurb: 'The overall visual design — clean, cluttered, polished, dated?',
      likedChips: ['Clean', 'Polished', 'Modern', 'Easy on the eyes'],
      dislikedChips: ['Cluttered', 'Dated', 'Low contrast / hard to read'],
    },
    {
      key: 'feature_ideas', title: 'What would make it better?',
      blurb: 'Help shape ClubR — what other features would enrich the experience and keep you coming back? Tap any that appeal, or add your own.',
      hideScore: true,
      likedLabel: 'Features you’d love to see',
      likedChips: ['Push notifications', 'Player stats & history', 'Leaderboards / seasons', 'Bigger group chat', 'Built-in payments', 'More game types', 'Achievements / badges', 'Calendar & reminders'],
      dislikedLabel: 'Anything missing, or that you’d change',
      dislikedChips: ['Better onboarding', 'Better search', 'Profile customization'],
    },
  ]
}
