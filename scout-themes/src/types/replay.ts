import type { Card } from './hand';

export type ActionType =
  | 'fold'
  | 'check'
  | 'call'
  | 'bet'
  | 'raise'
  | 'all-in'
  | 'small-blind'
  | 'big-blind'
  | 'ante'
  | 'straddle'
  | 'show'
  | 'muck'
  | 'uncalled-bet'
  | 'win';

export type Street = 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';

export interface PlayerAction {
  playerId: string;
  action: ActionType;
  amount: number;
  timestamp: number;
}

export interface TablePosition {
  seatNumber: number; // 0-9 for up to 10 players
  x: number; // percentage position on table
  y: number; // percentage position on table
}

export interface ReplayPlayer {
  id: string;
  name: string;
  avatar?: string;
  level?: number; // Player level/rank for badge display
  countryCode?: string; // ISO 3166-1 alpha-2 country code (e.g., 'US', 'GB')
  seatNumber: number;
  startingStack: number;
  currentStack: number;
  holeCards?: [Card, Card];
  /** Mystery card status: 'hidden' = show card backs, 'revealed' = show actual cards */
  mysteryStatus?: 'hidden' | 'revealed' | null;
  position?: 'BTN' | 'SB' | 'BB' | 'UTG' | 'UTG+1' | 'UTG+2' | 'MP' | 'MP+1' | 'HJ' | 'CO';
  isActive: boolean; // still in hand
  isFolded: boolean;
  isAllIn: boolean;
  isDeadPosition?: boolean; // Dead SB or Dead BTN (0 starting stack)
  currentBet: number; // amount bet in current betting round
  totalBet: number; // total amount bet in hand
  hasStraddled?: boolean;
  lastAction?: ActionType;
}

export interface ReplayState {
  street: Street;
  pot: number;
  communityCards: Card[];
  players: ReplayPlayer[];
  actions: PlayerAction[];
  activePlayerIndex: number | null;
  winnerIds: string[];
  winnings: Record<string, number>;
  /** When true, show win amount in WIN badge (phase 3 of win animation) */
  showWinAmount?: boolean;
  /** When true, this is a runout step (all-in, no actions) - don't show action badges */
  isRunout?: boolean;
  /** When true, this is an all-in + call scenario - use static chip-style badges, no animation */
  isAllInCall?: boolean;
}

export interface ReplayStep {
  stepNumber: number;
  description: string; // e.g., "Kyle J. raises to 200"
  state: ReplayState;
  highlightedPlayerId?: string;
}

export interface HandReplay {
  handId: string;
  handNumber?: number;
  tournamentName?: string;
  gameType: 'NLH' | 'PLO' | 'PLO5'; // No Limit Hold'em, Pot Limit Omaha, etc
  blinds: {
    smallBlind: number;
    bigBlind: number;
    ante?: number;
  };
  initialPlayers: ReplayPlayer[];
  steps: ReplayStep[];
  createdAt: Date;
}

export interface ChipDenomination {
  value: number;
  color: string;
  textColor: string;
}

export const defaultChipDenominations: ChipDenomination[] = [
  { value: 100000, color: '#8B4513', textColor: '#FFFFFF' }, // Brown - 100K
  { value: 25000, color: '#FF1493', textColor: '#FFFFFF' }, // Pink - 25K
  { value: 10000, color: '#FFD700', textColor: '#000000' }, // Gold - 10K
  { value: 5000, color: '#800080', textColor: '#FFFFFF' }, // Purple - 5K
  { value: 1000, color: '#FFFF00', textColor: '#000000' }, // Yellow - 1K
  { value: 500, color: '#FFA500', textColor: '#000000' }, // Orange - 500
  { value: 100, color: '#000000', textColor: '#FFFFFF' }, // Black - 100
  { value: 25, color: '#00FF00', textColor: '#000000' }, // Green - 25
  { value: 10, color: '#0000FF', textColor: '#FFFFFF' }, // Blue - 10
  { value: 5, color: '#FF0000', textColor: '#FFFFFF' }, // Red - 5
  { value: 1, color: '#FFFFFF', textColor: '#000000' }, // White - 1
];

export function calculateChipBreakdown(
  amount: number,
  denominations: ChipDenomination[] = defaultChipDenominations
): { denomination: ChipDenomination; count: number }[] {
  const normalized = roundToCents(amount);
  if (normalized <= 0 || !Number.isFinite(normalized)) return [];

  const breakdown: { denomination: ChipDenomination; count: number }[] = [];
  const sorted = [...denominations].sort((a, b) => b.value - a.value);
  let remaining = normalized;
  const epsilon = 0.0001;

  for (const denom of sorted) {
    if (!Number.isFinite(denom.value) || denom.value <= 0) continue;
    const count = Math.floor((remaining + epsilon) / denom.value);
    if (count > 0) {
      breakdown.push({ denomination: denom, count });
      remaining = roundToCents(remaining - count * denom.value);
    }
  }

  if (remaining > epsilon) {
    const smallest = sorted[sorted.length - 1] ?? { value: 1, color: '#f97316', textColor: '#0f172a' };
    breakdown.push({
      denomination: { ...smallest, value: roundToCents(remaining) },
      count: 1,
    });
  }

  return breakdown;
}

function roundToCents(value: number): number {
  return Math.round(Math.max(0, value) * 100) / 100;
}
