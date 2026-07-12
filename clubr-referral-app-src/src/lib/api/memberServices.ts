// Member profile — powers a host's manual vetting.
// Privacy guardrails: lifetime counts are aggregate (no club names leaked);
// the per-game list is filtered to games the VIEWER can already see (their own
// club + games shared with them), so a host can't surveil other clubs.

import { FT_CONTESTS } from '@/data/ftStore'
import { LL_GAMES } from '@/data/llStore'
import { CLUBS, USERS } from '@/data/store'
import { MOCK_LATENCY_MS } from '@/config/api'
import { FINISH_POINTS, type FTContest } from '@/types/ft'
import type { LLGame } from '@/types/ll'
import type { User } from '@/types'

const delay = (ms = MOCK_LATENCY_MS) => new Promise((r) => setTimeout(r, ms))
const isMember = (clubId: string, userId: string) => !!CLUBS.find((c) => c.id === clubId)?.members.some((m) => m.userId === userId && m.status === 'member')
const ord = (n: number) => (n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th')

function viewerCanSeeFT(c: FTContest, viewerId: string, isAdmin: boolean) {
  const base = isAdmin || isMember(c.clubId, viewerId) || c.hostId === viewerId || c.coHostIds.includes(viewerId)
  if (c.visibility !== 'private') return base
  return isAdmin || c.hostId === viewerId || c.coHostIds.includes(viewerId) || (c.accessUserIds ?? []).includes(viewerId)
}
function viewerCanSeeLL(g: LLGame, viewerId: string, isAdmin: boolean) {
  const base = isAdmin || isMember(g.clubId, viewerId) || g.hostId === viewerId || g.coHostIds.includes(viewerId)
  if (g.visibility !== 'private') return base
  return isAdmin || g.hostId === viewerId || g.coHostIds.includes(viewerId) || (g.accessUserIds ?? []).includes(viewerId)
}

export interface MemberGameSummary {
  id: string
  kind: 'ft' | 'll'
  title: string
  clubName: string
  status: string
  result: string
}

export interface MemberClubSummary { id: string; name: string; emoji: string }

export interface MemberProfile {
  user: User
  ftLifetime: number
  llLifetime: number
  games: MemberGameSummary[]
  canSeeContact: boolean // only a host/admin of a club the member is in
  /** Public clubs the member belongs to (names shown). */
  publicClubs: MemberClubSummary[]
  /** Count of PRIVATE clubs the member is in — shown as "Private clubs · N", never named. */
  privateClubCount: number
}

export async function getMemberProfile(targetId: string, viewerId: string, isAdmin = false): Promise<MemberProfile | null> {
  await delay()
  const user = USERS[targetId]
  if (!user) return null

  // An owner/admin sees contact for anyone in a club they manage — including a
  // PENDING applicant — so they can vet a join request with email/phone.
  const canSeeContact = isAdmin || CLUBS.some((c) =>
    c.members.some((m) => m.userId === viewerId && m.role === 'owner') &&
    c.members.some((m) => m.userId === targetId && (m.status === 'member' || m.status === 'pending')))

  // Clubs the member is in: public ones are named; private ones are shown only as a
  // count ("Private clubs · N") so we never reveal which private clubs they belong to.
  const targetClubs = CLUBS.filter((c) => c.members.some((m) => m.userId === targetId && m.status === 'member'))
  const publicClubs = targetClubs.filter((c) => c.visibility !== 'private').map((c) => ({ id: c.id, name: c.name, emoji: c.emoji }))
  const privateClubCount = targetClubs.filter((c) => c.visibility === 'private').length

  const ftLifetime = FT_CONTESTS.filter((c) => c.entries.some((e) => e.userId === targetId)).length
  const llLifetime = LL_GAMES.filter((g) => g.participants.some((p) => p.userId === targetId)).length
  const games: MemberGameSummary[] = []

  for (const c of FT_CONTESTS) {
    const e = c.entries.find((x) => x.userId === targetId)
    if (!e || !viewerCanSeeFT(c, viewerId, isAdmin)) continue
    let result: string
    if (c.status === 'settled' && c.finishingOrder) {
      const fo = c.finishingOrder
      const score = (es: typeof c.entries[number]) => es.picks.reduce((s, seat) => { const i = fo.indexOf(seat); return s + (i >= 0 ? FINISH_POINTS[i] : 0) }, 0)
      const ranked = [...c.entries].sort((a, b) => score(b) - score(a))
      const rank = ranked.findIndex((x) => x.userId === targetId) + 1
      result = `${rank}${ord(rank)} · ${score(e)} pts`
    } else result = c.status === 'open' ? (e.status === 'approved' ? 'entered' : 'pending') : 'locked'
    games.push({ id: c.id, kind: 'ft', title: c.ftName, clubName: c.clubName, status: c.status, result })
  }

  for (const g of LL_GAMES) {
    const p = g.participants.find((x) => x.userId === targetId)
    if (!p || !viewerCanSeeLL(g, viewerId, isAdmin)) continue
    const result = p.status === 'out' ? (p.finishPos === 1 ? 'won 🏆' : p.finishPos ? `${p.finishPos}${ord(p.finishPos)}` : 'out') : p.status === 'active' ? 'still in' : 'pending'
    games.push({ id: g.id, kind: 'll', title: g.title, clubName: g.clubName, status: g.status, result })
  }

  return { user, ftLifetime, llLifetime, games, canSeeContact, publicClubs, privateClubCount }
}
