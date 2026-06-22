import { Search, UserPlus, Layers, Lock, Award, Coins, Timer, Trophy, Scissors, Hand, Dice5 } from 'lucide-react'
import type { HowStep } from '@/components/common/HowItWorks'
import type { GameType } from './types'

// =====================================================================
// Single source of truth for each game's "how it works" steps. Shared by
// the in-game How-it-works sheets (FT contest / Last Longer / Squares pages)
// AND the onboarding game cards (GameHowItWorksCards) + the /how-games-work
// help page — so the explainer never drifts between surfaces.
// =====================================================================

export const FT_STEPS: HowStep[] = [
  { icon: Search, title: 'Find a contest', body: 'Your club host opens an FT Fantasy contest on an upcoming streamed final table.' },
  { icon: UserPlus, title: 'Request to enter', body: 'Tap “Request to enter” — the host admits you, then you can draft.' },
  { icon: Layers, title: 'Draft your team', body: 'Pick 4 of the 9 finalists within your budget. Bigger chip stacks cost more (priced by ICM).' },
  { icon: Lock, title: 'Picks lock', body: 'Your draft locks 10 minutes before the final table starts — no changes after.' },
  { icon: Award, title: 'Watch & score', body: 'Each of your 4 players scores by where they finish — 1st 100 · 2nd 70 · 3rd 50 … 9th 3. Your score is the sum.' },
  { icon: Coins, title: 'Win the pool', body: 'Highest total wins. The pool is split per the host’s payout (e.g. Top 3 — 50/30/20), settled offline.' },
]

export const LL_STEPS: HowStep[] = [
  { icon: UserPlus, title: 'Join the game', body: 'Request to join your club’s live tournament — the host admits you and marks you paid.' },
  { icon: Timer, title: 'Play it out', body: 'Everyone starts together. As the night goes, the host updates chip counts and busts players as they’re eliminated.' },
  { icon: Trophy, title: 'Last one standing', body: 'The leaderboard auto-sorts by chips — active players up top, eliminated below with their finish place.' },
  { icon: Scissors, title: 'Deal or chop', body: 'Near the end, players can propose a chop. It only goes through on a unanimous vote.' },
  { icon: Coins, title: 'Split the pool', body: 'Pool = entry × players joined, paid by finish place per the host’s split. Settled offline — the app holds no cash.' },
]

export const SQUARES_STEPS: HowStep[] = [
  { icon: UserPlus, title: 'Join the board', body: 'Request to join — the host admits you, then you can grab squares.' },
  { icon: Hand, title: 'Claim your squares', body: 'Tap any empty square on the 10×10 grid to claim it. Grab as many as you like (tap yours again to release) before claiming closes.' },
  { icon: Dice5, title: 'Digits are drawn', body: 'When the host locks the board, each row & column gets a random 0–9 digit. They’re sealed until then — nobody can game it.' },
  { icon: Trophy, title: 'Scores pick winners', body: 'After each period (Q1/Q2/Q3/Final), the host enters the score. The square at the home & away last digits lights up — that owner wins the period.' },
  { icon: Coins, title: 'Split the pool', body: 'Pool = price per square × squares claimed, split by period (default 10/10/10/70). Settled offline — the app holds no cash.' },
]

/** Per-game steps + the accent used for the timeline dots/icons (literal classes for the JIT). */
export const GAME_EXPLAINER: Record<GameType, { steps: HowStep[]; dotBg: string; iconColor: string }> = {
  ft_fantasy:        { steps: FT_STEPS,      dotBg: 'bg-accent-purple',  iconColor: 'text-accent-purple' },
  last_longer:       { steps: LL_STEPS,      dotBg: 'bg-accent-amber',   iconColor: 'text-accent-amber' },
  football_squares:  { steps: SQUARES_STEPS, dotBg: 'bg-accent-emerald', iconColor: 'text-accent-emerald' },
}
