// Mock "API" service layer — the single swappable seam (same idea as the ClubR
// app's lib/api/services). Returns Promises so the react-query hooks behave like
// real network reads; swap these bodies for fetch() to go live.
import type { Game, Finalist, AppNotification, Member, Standing } from '@/types'

const ok = <T>(data: T): Promise<T> => Promise.resolve(data)

const GAMES: Game[] = [
  { id: 'g1', type: 'll', club: 'Dallas Gladiators', clubEmoji: '🤠', title: '200k Dallas Tournament', stake: '250 buy-in', pool: '1,750 pool', joined: 7, closesIn: '12:08', status: 'open', sub: '4 winners · 50/25/20/5', relationship: 'playing' },
  { id: 'g2', type: 'ft', club: 'Houston Rockets', clubEmoji: '🚀', title: 'WSOP Main FT', stake: '250 buy-in', pool: '750 pool', joined: 3, closesIn: '13:32', status: 'open', sub: 'Top 3 · 50/30/20', relationship: 'hosting', private: true },
  { id: 'g3', type: 'sq', club: 'Austin Warriors', clubEmoji: '⚔️', title: 'Cowboys vs Eagles Squares', stake: '100 buy-in', pool: '900 pool', joined: 18, closesIn: '14:31', status: 'running', sub: 'Winner each quarter', relationship: 'playing' },
  { id: 'g4', type: 'ft', club: 'The Lodge', clubEmoji: '🏔️', title: 'Lodge Championship FT', stake: '500 buy-in', pool: '3,000 pool', joined: 6, closesIn: '—', status: 'completed', sub: 'Won by Seidel', relationship: 'playing' },
]

const FINALISTS: Finalist[] = [
  { seat: 'A', name: 'Erik Seidel', flag: '🇺🇸', bb: 172, price: 35000 },
  { seat: 'B', name: 'Tom Dwan', flag: '🇺🇸', bb: 137, price: 31000 },
  { seat: 'C', name: 'Stephen Chidwick', flag: '🇬🇧', bb: 118, price: 28000 },
  { seat: 'D', name: 'Jason Koon', flag: '🇺🇸', bb: 96, price: 24000 },
  { seat: 'E', name: 'Vanessa Selbst', flag: '🇺🇸', bb: 74, price: 21000 },
  { seat: 'F', name: 'Fedor Holz', flag: '🇩🇪', bb: 61, price: 18000 },
  { seat: 'G', name: 'Liv Boeree', flag: '🇬🇧', bb: 48, price: 16000 },
  { seat: 'H', name: 'Daniel Negreanu', flag: '🇨🇦', bb: 33, price: 14000 },
  { seat: 'I', name: 'Phil Ivey', flag: '🇺🇸', bb: 21, price: 13000 },
]

const NOTIFS: AppNotification[] = [
  { id: 'n1', type: 'club_req', body: 'Tilly S asked to join Houston Rockets.', ago: '1h', unread: true },
  { id: 'n2', type: 'game_req', body: 'Gabby B asked to join WSOP Main FT.', ago: '1h', unread: true },
  { id: 'n3', type: 'club_ok', body: "You're now a member of Dallas Gladiators.", ago: '2h', unread: true },
  { id: 'n4', type: 'game_ok', body: "You're in — Friday Night Last Longer.", ago: '2h', unread: true },
  { id: 'n5', type: 'club_req', body: 'Annie S asked to join Houston Rockets.', ago: '3h', unread: false },
  { id: 'n6', type: 'game_ok', body: "You're in — Sunday Squares.", ago: '4h', unread: false },
  { id: 'n7', type: 'club_ok', body: "You're now a member of Austin Warriors.", ago: '5h', unread: false },
  { id: 'n8', type: 'game_req', body: 'Vasco T asked to join 200k Dallas.', ago: '6h', unread: false },
  { id: 'n9', type: 'club_req', body: 'Sara R asked to join The Lodge.', ago: '8h', unread: false },
  { id: 'n10', type: 'club_ok', body: "You're now a member of The Lodge.", ago: '1d', unread: false },
  { id: 'n11', type: 'game_ok', body: "You're in — WSOP Main FT.", ago: '1d', unread: false },
  { id: 'n12', type: 'game_req', body: 'Tom D asked to join Lodge Championship.', ago: '2d', unread: false },
]

const MEMBERS: Member[] = [
  { name: 'Ravee S', color: 'bg-accent-blue', role: 'Host' },
  { name: 'Tom D', color: 'bg-accent-violet' },
  { name: 'Gabby B', color: 'bg-accent-red' },
  { name: 'Annie S', color: 'bg-accent-emerald' },
  { name: 'Sara R', color: 'bg-accent-amber' },
  { name: 'Vasco T', color: 'bg-fuchsia-500' },
]

const STANDINGS: Standing[] = [
  { rank: 1, name: 'Ravee S', team: 'Seidel · Holz · Koon · Ivey', pts: 263, you: true },
  { rank: 2, name: 'Gabby B', team: 'Dwan · Chidwick · Selbst · Boeree', pts: 218 },
  { rank: 3, name: 'Tom D', team: 'Negreanu · Ivey · Koon · Holz', pts: 191 },
  { rank: 4, name: 'Annie S', team: 'Selbst · Boeree · Dwan · Seidel', pts: 174 },
  { rank: 5, name: 'Sara R', team: 'Chidwick · Koon · Negreanu · Ivey', pts: 152 },
]

export const listGames = () => ok(GAMES)
export const getFinalists = () => ok(FINALISTS)
export const listNotifications = () => ok(NOTIFS)
export const getClubMembers = () => ok(MEMBERS)
export const getClubGames = () => ok(GAMES.filter((g) => g.club === 'Houston Rockets' || g.relationship !== 'available'))
export const getStandings = () => ok(STANDINGS)
export const getCredits = () => ok(1400)
