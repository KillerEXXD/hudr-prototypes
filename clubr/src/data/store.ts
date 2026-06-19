// =====================================================================
// In-memory mock database for the ClubR prototype.
//
// This is the ONLY place mock data lives. The services layer
// (src/lib/api/services.ts) reads and writes this store; components and
// hooks never touch it directly. To go live, the service bodies swap to
// real API calls and this file is deleted — nothing else changes.
// =====================================================================

import type { AppNotification, Club, User } from '@/types'

// ---- Accounts (one per login role) + extra people who populate clubs ----
export const USERS: Record<string, User> = {
  u_admin: { id: 'u_admin', name: 'Avery Admin', handle: 'avery', email: 'avery@clubr.app', location: 'Las Vegas, NV', role: 'admin', avatarColor: '#8b5cf6', emailVerified: true },
  u_host: { id: 'u_host', name: 'Harper Host', handle: 'harper', email: 'harper@aceshigh.club', location: 'Houston, TX', role: 'host', avatarColor: '#10b981', emailVerified: true },
  u_player: { id: 'u_player', name: 'Sam Rivers', handle: 'sam', email: 'sam@example.com', phone: '+1 (415) 555‑0182', location: 'Houston, TX', role: 'player', avatarColor: '#3b82f6', emailVerified: true },
  u_gary: { id: 'u_gary', name: 'Gary Grind', handle: 'gary', email: 'gary@grinders.club', phone: '+1 (312) 555‑0143', location: 'Dallas, TX', role: 'host', avatarColor: '#f59e0b' },
  u_rae: { id: 'u_rae', name: 'Rae Rivers', handle: 'rae', email: 'rae@riverrats.club', location: 'Austin, TX', role: 'host', avatarColor: '#06b6d4' },
  u_mike: { id: 'u_mike', name: 'Mike Jones', handle: 'mikej', email: 'mike@example.com', phone: '+1 (646) 555‑0110', location: 'Houston, TX', role: 'player', avatarColor: '#ef4444' },
  u_tom: { id: 'u_tom', name: 'Tom Wilson', handle: 'tomw', email: 'tom@example.com', phone: '+1 (702) 555‑0177', location: 'Dallas, TX', role: 'player', avatarColor: '#ec4899' },
  u_lena: { id: 'u_lena', name: 'Lena Park', handle: 'lena', email: 'lena@example.com', phone: '+1 (213) 555‑0199', location: 'Austin, TX', role: 'player', avatarColor: '#14b8a6' },
  u_jordan: { id: 'u_jordan', name: 'Jordan Lee', handle: 'jordan', email: 'jordan@example.com', phone: '+1 (305) 555‑0164', location: 'Houston, TX', role: 'player', avatarColor: '#f97316' },
  u_dustin: { id: 'u_dustin', name: 'Dustin Cole', handle: 'dustin', email: 'dustin@example.com', phone: '+1 (408) 555‑0125', location: 'Dallas, TX', role: 'player', avatarColor: '#a855f7' },
  u_cody: { id: 'u_cody', name: 'Cody Banks', handle: 'cody', email: 'cody@example.com', location: 'Austin, TX', role: 'player', avatarColor: '#eab308' },
  // ---- Demo clubs seeded from real TournamentPro venues (Bayou City Poker Club + Gulf Coast Card Club) ----
  u_cc_host: { id: 'u_cc_host', name: 'Marcus Reyes', handle: 'marcus', email: 'marcus@championsclub.example', location: 'Houston, TX', role: 'host', avatarColor: '#a855f7', emailVerified: true },
  u_tch_host: { id: 'u_tch_host', name: 'Diana Cole', handle: 'diana', email: 'diana@texascardhouse.example', location: 'Houston, TX', role: 'host', avatarColor: '#dc2626', emailVerified: true },
  // Bayou City Poker Club members — real Lone Star Poker Series $1M field (finishing order).
  u_cc_p1: { id: 'u_cc_p1', name: 'Joon Park', handle: 'joonpark', email: 'joon@example', location: 'Austin, TX', role: 'player', avatarColor: '#ef4444' },
  u_cc_p2: { id: 'u_cc_p2', name: 'Harry Wright', handle: 'harryw', email: 'harry@example', location: 'De Queen, AR', role: 'player', avatarColor: '#f97316' },
  u_cc_p3: { id: 'u_cc_p3', name: 'Kevin Kaylor', handle: 'kevink', email: 'kevin@example', location: 'Houston, TX', role: 'player', avatarColor: '#eab308' },
  u_cc_p4: { id: 'u_cc_p4', name: 'Michael Wang', handle: 'mwang', email: 'mwang@example', location: 'Livingston, NJ', role: 'player', avatarColor: '#22c55e' },
  u_cc_p5: { id: 'u_cc_p5', name: 'Shawn Rice', handle: 'shawnr', email: 'shawn@example', location: 'Lubbock, TX', role: 'player', avatarColor: '#14b8a6' },
  u_cc_p6: { id: 'u_cc_p6', name: 'Gabriel Andrade', handle: 'gabea', email: 'gabe@example', location: 'Houston, TX', role: 'player', avatarColor: '#06b6d4' },
  u_cc_p7: { id: 'u_cc_p7', name: 'Nick Shkolnik', handle: 'nicks', email: 'nick@example', location: 'Sun Valley, CA', role: 'player', avatarColor: '#3b82f6' },
  u_cc_p8: { id: 'u_cc_p8', name: 'Christopher Doan', handle: 'chrisd', email: 'chris@example', location: 'Hacienda Heights, CA', role: 'player', avatarColor: '#8b5cf6' },
  u_cc_p9: { id: 'u_cc_p9', name: 'Jared Hemingway', handle: 'jaredh', email: 'jaredh@example', location: 'Houston, TX', role: 'player', avatarColor: '#ec4899' },
  // Gulf Coast Card Club members — real Trailblazer $1M Main Event field (finishing order).
  u_tch_p1: { id: 'u_tch_p1', name: 'Travis Preng', handle: 'travisp', email: 'travis@example', location: 'Dallas, TX', role: 'player', avatarColor: '#ef4444' },
  u_tch_p2: { id: 'u_tch_p2', name: 'Young Ki Choi', handle: 'youngki', email: 'young@example', location: 'Dallas, TX', role: 'player', avatarColor: '#f97316' },
  u_tch_p3: { id: 'u_tch_p3', name: 'Paul Velasco', handle: 'paulv', email: 'paul@example', location: 'Houston, TX', role: 'player', avatarColor: '#eab308' },
  u_tch_p4: { id: 'u_tch_p4', name: 'Jared Ingles', handle: 'jaredi', email: 'jaredi@example', location: 'Austin, TX', role: 'player', avatarColor: '#22c55e' },
  u_tch_p5: { id: 'u_tch_p5', name: 'Mariona Canals Riba', handle: 'mariona', email: 'mariona@example', location: 'Barcelona, ES', role: 'player', avatarColor: '#14b8a6' },
  u_tch_p6: { id: 'u_tch_p6', name: 'Tyler Rawlinson', handle: 'tylerr', email: 'tyler@example', location: 'Dallas, TX', role: 'player', avatarColor: '#06b6d4' },
  u_tch_p7: { id: 'u_tch_p7', name: 'Brian Devany', handle: 'briand', email: 'brian@example', location: 'Houston, TX', role: 'player', avatarColor: '#3b82f6' },
  u_tch_p8: { id: 'u_tch_p8', name: 'Damien Dreyer', handle: 'damiend', email: 'damien@example', location: 'Austin, TX', role: 'player', avatarColor: '#8b5cf6' },
  u_tch_p9: { id: 'u_tch_p9', name: 'Andrew Todhunter', handle: 'andrewt', email: 'andrew@example', location: 'Dallas, TX', role: 'player', avatarColor: '#ec4899' },
}

const u = USERS
function member(id: string, role: 'owner' | 'host' | 'member', status: 'pending' | 'member', joinedAt: string) {
  return { userId: id, name: u[id].name, handle: u[id].handle, avatarColor: u[id].avatarColor, role, status, joinedAt }
}

// ---- Clubs (mutable — join requests + approvals change these) ----
export const CLUBS: Club[] = [
  {
    id: 'c_aces', name: 'Aces High', emoji: '🂡', color: '#ef4444',
    description: 'Friday night home game crew. Final-table fantasy + our weekly Last Longer.',
    location: 'Houston, TX',
    telegram: { link: 'https://t.me/+AcesHighDemo', title: 'Aces High 🂡 — announcements' },
    ownerId: 'u_host', ownerName: 'Harper Host', inviteCode: 'ACES24', createdAt: '2026-05-02',
    members: [
      member('u_host', 'owner', 'member', '2026-05-02'),
      member('u_mike', 'member', 'member', '2026-05-04'),
      member('u_tom', 'member', 'member', '2026-05-06'),
      member('u_player', 'member', 'member', '2026-06-15'),
      member('u_jordan', 'member', 'pending', '2026-06-13'),
      member('u_dustin', 'member', 'pending', '2026-06-14'),
    ],
  },
  {
    id: 'c_grinders', name: 'The Grinders', emoji: '♠️', color: '#10b981',
    description: 'Serious players, serious stacks. We run Stack Draft on every streamed FT.',
    location: 'Dallas, TX',
    ownerId: 'u_gary', ownerName: 'Gary Grind', inviteCode: 'GRIND7', createdAt: '2026-04-18',
    members: [
      member('u_gary', 'owner', 'member', '2026-04-18'),
      member('u_player', 'member', 'member', '2026-04-20'),
      member('u_lena', 'member', 'member', '2026-04-22'),
    ],
  },
  {
    id: 'c_river', name: 'River Rats', emoji: '🌊', color: '#06b6d4',
    description: 'Casual, friendly, no egos. Come for the Last Longer, stay for the chat.',
    location: 'Austin, TX',
    ownerId: 'u_rae', ownerName: 'Rae Rivers', inviteCode: 'RIVER1', createdAt: '2026-06-08',
    members: [
      member('u_rae', 'owner', 'member', '2026-06-08'),
      member('u_cody', 'member', 'member', '2026-06-09'),
    ],
  },
  {
    id: 'c_felt', name: 'Green Felt Club', emoji: '🟢', color: '#22c55e',
    description: 'Old-school felt, new-school tools. FT fantasy every weekend.',
    location: 'Dallas, TX',
    ownerId: 'u_gary', ownerName: 'Gary Grind', inviteCode: 'FELT99', createdAt: '2026-06-10',
    members: [member('u_gary', 'owner', 'member', '2026-06-10'), member('u_mike', 'member', 'member', '2026-06-11')],
  },
  {
    id: 'c_highrollers', name: 'High Rollers', emoji: '💎', color: '#a855f7',
    description: 'Big stakes, bigger swings. Invite only.',
    location: 'Austin, TX', visibility: 'private',
    ownerId: 'u_rae', ownerName: 'Rae Rivers', inviteCode: 'HRX7K2Q9', createdAt: '2026-06-11',
    members: [member('u_rae', 'owner', 'member', '2026-06-11'), member('u_tom', 'member', 'member', '2026-06-12')],
  },
  // ---- Demo: Bayou City Poker Club (real final-table data in its FT) ----
  {
    id: 'c_champions', name: 'Bayou City Poker Club', emoji: '🏆', color: '#a855f7',
    description: 'Houston’s home for big-field final tables. Fantasy the FT, run Last Longers & Squares.',
    location: 'Houston, TX',
    ownerId: 'u_cc_host', ownerName: 'Marcus Reyes', inviteCode: 'CHAMP1', createdAt: '2026-05-10',
    members: [
      member('u_cc_host', 'owner', 'member', '2026-05-10'),
      member('u_player', 'member', 'member', '2026-06-16'),
      member('u_cc_p1', 'member', 'member', '2026-05-12'),
      member('u_cc_p2', 'member', 'member', '2026-05-12'),
      member('u_cc_p3', 'member', 'member', '2026-05-13'),
      member('u_cc_p4', 'member', 'member', '2026-05-13'),
      member('u_cc_p5', 'member', 'member', '2026-05-14'),
      member('u_cc_p6', 'member', 'member', '2026-05-14'),
      member('u_cc_p7', 'member', 'member', '2026-05-15'),
      member('u_cc_p8', 'member', 'member', '2026-05-15'),
      member('u_cc_p9', 'member', 'member', '2026-05-16'),
      member('u_mike', 'member', 'member', '2026-05-20'),
      member('u_lena', 'member', 'pending', '2026-06-15'),
    ],
  },
  // ---- Demo: Gulf Coast Card Club (real final-table data in its FT) ----
  {
    id: 'c_tch', name: 'Gulf Coast Card Club', emoji: '🃏', color: '#dc2626',
    description: 'TCH Houston crew — final-table fantasy, weekly Last Longer, and Squares on game day.',
    location: 'Houston, TX',
    ownerId: 'u_tch_host', ownerName: 'Diana Cole', inviteCode: 'TCH777', createdAt: '2026-05-08',
    members: [
      member('u_tch_host', 'owner', 'member', '2026-05-08'),
      member('u_player', 'member', 'member', '2026-06-16'),
      member('u_tch_p1', 'member', 'member', '2026-05-09'),
      member('u_tch_p2', 'member', 'member', '2026-05-09'),
      member('u_tch_p3', 'member', 'member', '2026-05-10'),
      member('u_tch_p4', 'member', 'member', '2026-05-10'),
      member('u_tch_p5', 'member', 'member', '2026-05-11'),
      member('u_tch_p6', 'member', 'member', '2026-05-11'),
      member('u_tch_p7', 'member', 'member', '2026-05-12'),
      member('u_tch_p8', 'member', 'member', '2026-05-12'),
      member('u_tch_p9', 'member', 'member', '2026-05-13'),
      member('u_gary', 'member', 'member', '2026-05-18'),
      member('u_cody', 'member', 'pending', '2026-06-15'),
    ],
  },
]

// ---- Notifications (recipient-scoped; the header bell reads these) ----
// Seeded for the host account (Harper, owns Aces High) so the demo shows a
// couple of pending join requests + one approval the moment you sign in as host.
export const NOTIFICATIONS: AppNotification[] = [
  { id: 'ntf_1', type: 'club_join_request', clubId: 'c_aces', actorId: 'u_mike', actorName: 'Mike Jones', title: 'New join request', body: 'Mike Jones asked to join Aces High.', read: false, createdAt: '2026-06-18T18:40:00Z' },
  { id: 'ntf_2', type: 'club_join_request', clubId: 'c_aces', actorId: 'u_tom', actorName: 'Tom Wilson', title: 'New join request', body: 'Tom Wilson asked to join Aces High.', read: false, createdAt: '2026-06-18T14:05:00Z' },
  { id: 'ntf_3', type: 'club_join_approved', clubId: 'c_aces', actorId: 'u_host', actorName: 'Harper Host', title: "You're in!", body: "You're now a member of Aces High.", read: true, createdAt: '2026-06-15T09:30:00Z' },
]

// Counter for generated ids (avoids relying on wall-clock for uniqueness).
let _seq = 100
export function nextId(prefix: string): string {
  _seq += 1
  return `${prefix}_${_seq}`
}
