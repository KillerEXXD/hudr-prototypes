// Squares services — swap seam (mock store today, API later).
import { SQUARES_GAMES } from '@/data/squaresStore'
import { CLUBS, USERS } from '@/data/store'
import { MOCK_LATENCY_MS } from '@/config/api'
import { ECONOMY, refund } from '@/data/creditsStore'
import { emptyGrid, type SquaresGame, type SquaresGameView } from '@/types/squares'
import { type PrivateGate, type PrivateGameInfo } from '@/lib/api/privateGame'
import { computeSquaresPayouts } from '@/lib/squaresPayouts'

const delay = (ms = MOCK_LATENCY_MS) => new Promise((r) => setTimeout(r, ms))
const isMember = (clubId: string, userId: string) => !!CLUBS.find((c) => c.id === clubId)?.members.some((m) => m.userId === userId && m.status === 'member')

// Activity feed — system chat posted on lifecycle events (mirrors the live ClubrGO
// `squares` edge function). Board-level lines use a neutral "ClubR" author (userId '').
function disp(userId: string) { const u = USERS[userId]; return { name: u?.name ?? 'Guest', color: u?.avatarColor ?? '#6b7280' } }
function sysMsgSq(g: SquaresGame, userId: string, name: string, avatarColor: string, text: string) {
  g.chat.push({ id: `sm_${Date.now()}_${g.chat.length}`, userId, name, avatarColor, text, ts: 'now', kind: 'system' })
}
const SQ_SYS = { id: '', name: 'ClubR', color: '#10b981' }
const DIGITS_DRAWN_MSG = '🎲 Registration closed — the numbers are drawn. The board is live!'

function canView(g: SquaresGame, viewerId: string, isAdmin: boolean) {
  // A participant (roster or claimed a square) can always view the game they're in.
  const isParticipant = g.participants.some((p) => p.userId === viewerId) || g.cells.some((c) => c.userId === viewerId)
  const base = isAdmin || isMember(g.clubId, viewerId) || g.hostId === viewerId || g.coHostIds.includes(viewerId) || isParticipant
  if (g.visibility !== 'private') return base
  return isAdmin || g.hostId === viewerId || g.coHostIds.includes(viewerId) || (g.accessUserIds ?? []).includes(viewerId) || isParticipant
}
function toView(g: SquaresGame, userId: string, isAdmin: boolean): SquaresGameView {
  return {
    ...g,
    me: g.participants.find((p) => p.userId === userId) ?? null,
    canManage: isAdmin || g.hostId === userId || g.coHostIds.includes(userId),
    isMemberOfClub: isMember(g.clubId, userId),
    claimedCount: g.cells.filter((c) => c.userId).length,
    pendingCount: g.cells.filter((c) => c.userId && !c.approved).length,
  }
}

/** Host cancels the board with a reason. Voids it (no winners). */
export async function cancelSquares(gameId: string, reason: string): Promise<void> {
  await delay(150)
  const g = SQUARES_GAMES.find((x) => x.id === gameId)
  if (!g) return
  g.status = 'cancelled'; g.cancelReason = reason.trim() || undefined; g.cancelledAt = new Date().toISOString()
  const r = reason.trim(); const host = disp(g.hostId)
  sysMsgSq(g, g.hostId, host.name, host.color, `🚫 ${host.name} cancelled the game${r ? ` — ${r}` : ''}`)
}

export async function listSquares(userId: string, isAdmin = false): Promise<SquaresGameView[]> {
  await delay()
  return SQUARES_GAMES.filter((g) => canView(g, userId, isAdmin)).map((g) => toView(g, userId, isAdmin))
}
export async function getSquares(id: string, userId: string, isAdmin = false): Promise<SquaresGameView | PrivateGate | null> {
  await delay()
  const g = SQUARES_GAMES.find((x) => x.id === id)
  if (!g) return null
  if (!canView(g, userId, isAdmin)) return { private: { clubId: g.clubId, clubName: g.clubName, ownerName: CLUBS.find((x) => x.id === g.clubId)?.ownerName ?? 'the club owner' } satisfies PrivateGameInfo }
  return toView(g, userId, isAdmin)
}

/** The pool an unwon Final carries to a future game (Rollover rule) — its base plus
 *  any unwon earlier quarters that rolled onto it. `null` if the Final had a winner
 *  (or the game isn't a rollover source). */
function unwonFinalPool(g: SquaresGame): number | null {
  const payouts = computeSquaresPayouts(toView(g, '', false))
  const fin = payouts.perPeriod.find((p) => p.label === 'Final')
  return fin && fin.unclaimedTo === 'nextGame' ? fin.unclaimedAmount : null
}

/** Finished same-club games whose unwon Q4 pool the host can carry into a new game's
 *  Q4 (Rollover rule). Each pool is consumable once — excludes games already carried
 *  in (`rolledOverToGameId` set or referenced by another game's `rolledOverFrom`). */
export async function rolloverPools(clubId: string): Promise<{ id: string; title: string; homeTeam: string; awayTeam: string; amount: number }[]> {
  await delay(120)
  const consumed = new Set(SQUARES_GAMES.flatMap((g) => (g.rolledOverFrom ?? []).map((r) => r.gameId)))
  const out: { id: string; title: string; homeTeam: string; awayTeam: string; amount: number }[] = []
  for (const g of SQUARES_GAMES) {
    if (g.clubId !== clubId || g.status !== 'completed' || g.rolledOverToGameId || consumed.has(g.id)) continue
    const amount = unwonFinalPool(g)
    if (amount != null && amount > 0) out.push({ id: g.id, title: g.title, homeTeam: g.homeTeam, awayTeam: g.awayTeam, amount })
  }
  return out
}

export async function createSquares(clubId: string, hostId: string, input: { title: string; homeTeam: string; awayTeam: string; stake: number; visibility: 'public' | 'private'; accessUserIds: string[]; closesAt: string; timezone: string; periodPayouts: number[]; noWinnerRule?: 'rollover' | 'split' | 'refund' | 'charity'; charityName?: string; rolledOverFromGameIds?: string[] }): Promise<string> {
  await delay()
  const club = CLUBS.find((c) => c.id === clubId)
  const id = `sq_${Date.now()}`
  const labels = ['Q1', 'Q2', 'Q3', 'Final']
  // Resolve the carried-in unwon-Q4 pools → provenance entries, and mark each source
  // consumed so it can't be carried into a second game.
  const rule = input.noWinnerRule ?? 'rollover'
  const rolledOverFrom = (rule === 'rollover' ? (input.rolledOverFromGameIds ?? []) : [])
    .map((srcId) => {
      const src = SQUARES_GAMES.find((x) => x.id === srcId)
      const amount = src ? unwonFinalPool(src) : null
      if (!src || amount == null) return null
      src.rolledOverToGameId = id
      return { gameId: src.id, title: src.title, amount }
    })
    .filter((x): x is { gameId: string; title: string; amount: number } => x != null)
  SQUARES_GAMES.unshift({
    id, clubId, clubName: club?.name ?? 'Club', clubEmoji: club?.emoji ?? '🃏',
    title: input.title.trim() || 'Squares', homeTeam: input.homeTeam.trim() || 'Home', awayTeam: input.awayTeam.trim() || 'Away',
    visibility: input.visibility, accessUserIds: input.visibility === 'private' ? Array.from(new Set([hostId, ...input.accessUserIds])) : [],
    status: 'registration', registrationClosesAt: input.closesAt || undefined, timezone: input.timezone,
    stake: input.stake, hostId, coHostIds: [],
    cells: emptyGrid(), rowDigits: [], colDigits: [],
    periods: labels.map((label, i) => ({ label, pct: input.periodPayouts[i] ?? 0 })),
    participants: [], chat: [],
    noWinnerRule: rule,
    charityName: rule === 'charity' ? (input.charityName?.trim() || undefined) : undefined,
    rolledOverFrom: rolledOverFrom.length ? rolledOverFrom : undefined,
  })
  return id
}

export async function requestJoinSquares(gameId: string, userId: string): Promise<void> {
  await delay(150)
  const g = SQUARES_GAMES.find((x) => x.id === gameId); if (!g || g.participants.some((p) => p.userId === userId)) return
  const u = USERS[userId]
  const auto = g.hostId === userId || g.coHostIds.includes(userId)
  g.participants.push({ userId, name: u?.name ?? 'Guest', avatarColor: u?.avatarColor ?? '#6b7280', status: auto ? 'active' : 'pending', paid: false })
  const d = disp(userId); sysMsgSq(g, userId, d.name, d.color, auto ? `🪑 ${d.name} joined` : `🙋 ${d.name} requested to join`)
}
export async function approveSquares(gameId: string, userId: string): Promise<void> {
  await delay(150); const g = SQUARES_GAMES.find((x) => x.id === gameId); const p = g?.participants.find((x) => x.userId === userId)
  if (g && p) { p.status = 'active'; const d = disp(userId); sysMsgSq(g, userId, d.name, d.color, `✅ ${d.name} was admitted`) }
}
export async function declineSquares(gameId: string, userId: string): Promise<void> {
  await delay(150)
  const g = SQUARES_GAMES.find((x) => x.id === gameId)
  if (g) {
    if (g.participants.some((p) => p.userId === userId)) refund(userId, `Refund — declined from ${g.title}`, ECONOMY.joinGameCost)
    g.participants = g.participants.filter((p) => p.userId !== userId)
  }
}
export async function toggleSquaresPaid(gameId: string, userId: string): Promise<void> {
  await delay(120); const p = SQUARES_GAMES.find((x) => x.id === gameId)?.participants.find((x) => x.userId === userId); if (p) p.paid = !p.paid
}
export async function postChatSquares(gameId: string, userId: string, text: string): Promise<void> {
  await delay(80); const g = SQUARES_GAMES.find((x) => x.id === gameId); const u = USERS[userId]
  if (g && text.trim()) g.chat.push({ id: `sm_${Date.now()}`, userId, name: u?.name ?? '', avatarColor: u?.avatarColor ?? '#6b7280', text: text.trim(), ts: 'now' })
}

/** Toggle a square: claim an empty one (→ PENDING host approval), or withdraw one you own
 *  while it's still pending. Registration only, active players only. An APPROVED square is
 *  locked in — the player can no longer withdraw it. */
export async function claimSquare(gameId: string, userId: string, cellIdx: number): Promise<void> {
  await delay(100)
  const g = SQUARES_GAMES.find((x) => x.id === gameId); if (!g || g.status !== 'registration') return
  const me = g.participants.find((p) => p.userId === userId); if (!me || me.status !== 'active') return
  const cell = g.cells[cellIdx]
  if (cell.userId === userId) { if (!cell.approved) g.cells[cellIdx] = {} } // withdraw only while pending
  else if (!cell.userId) {
    const u = USERS[userId]; g.cells[cellIdx] = { userId, name: u?.name, avatarColor: u?.avatarColor, approved: false }
    const d = disp(userId); sysMsgSq(g, userId, d.name, d.color, `🎯 ${d.name} grabbed a square`)
    const n = g.cells.filter((c) => c.userId).length
    if (n === 25 || n === 50 || n === 75 || n === 100) sysMsgSq(g, SQ_SYS.id, SQ_SYS.name, SQ_SYS.color, n === 100 ? `🔥 The board's full — all 100 squares are gone!` : `🔥 ${n}% of the board's gone — ${n} squares filled`)
  }
}

/** Host approves a single pending square → locks it in (player can no longer withdraw). */
export async function approveSquareClaim(gameId: string, cellIdx: number): Promise<void> {
  await delay(100)
  const g = SQUARES_GAMES.find((x) => x.id === gameId); if (!g || g.status !== 'registration') return
  const cell = g.cells[cellIdx]; if (cell.userId) cell.approved = true
}
/** Host rejects a pending square → frees it back to empty. */
export async function rejectSquareClaim(gameId: string, cellIdx: number, _reason: string): Promise<void> {
  await delay(100)
  const g = SQUARES_GAMES.find((x) => x.id === gameId); if (!g || g.status !== 'registration') return
  const cell = g.cells[cellIdx]; if (cell.userId && !cell.approved) g.cells[cellIdx] = {}
}
/** Host approves every pending square at once. */
export async function approveAllSquares(gameId: string): Promise<void> {
  await delay(150)
  const g = SQUARES_GAMES.find((x) => x.id === gameId); if (!g || g.status !== 'registration') return
  g.cells.forEach((c) => { if (c.userId) c.approved = true })
}

function shuffleDigits(): number[] {
  const a = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]] }
  return a
}
/** Host locks registration → digits are randomly assigned (sealed before this) and the board goes live. */
export async function lockSquares(gameId: string): Promise<void> {
  await delay(200)
  const g = SQUARES_GAMES.find((x) => x.id === gameId); if (!g || g.status !== 'registration') return
  g.cells.forEach((c) => { if (c.userId) c.approved = true }) // any still-pending claims are accepted at lock
  g.rowDigits = shuffleDigits(); g.colDigits = shuffleDigits(); g.status = 'live'
  const host = disp(g.hostId)
  sysMsgSq(g, g.hostId, host.name, host.color, `🔒 ${host.name} locked the board`)
  sysMsgSq(g, SQ_SYS.id, SQ_SYS.name, SQ_SYS.color, DIGITS_DRAWN_MSG)
}
/** Host extends the registration deadline (absolute UTC ISO). Extend-only. */
export async function extendRegistration(gameId: string, closesAt: string): Promise<void> {
  await delay(120); const g = SQUARES_GAMES.find((x) => x.id === gameId); if (!g) return
  g.registrationClosesAt = closesAt
  const host = disp(g.hostId); sysMsgSq(g, g.hostId, host.name, host.color, `⏱️ ${host.name} extended registration`)
}
/** Host closes registration NOW (early) — digits assigned, board goes live. */
export async function closeRegistration(gameId: string): Promise<void> {
  await delay(200); const g = SQUARES_GAMES.find((x) => x.id === gameId); if (!g || g.status !== 'registration') return
  g.cells.forEach((c) => { if (c.userId) c.approved = true })
  g.rowDigits = shuffleDigits(); g.colDigits = shuffleDigits(); g.status = 'live'; g.registrationClosesAt = new Date().toISOString(); g.regClosedEarly = true
  const host = disp(g.hostId)
  sysMsgSq(g, g.hostId, host.name, host.color, `🔒 ${host.name} closed registration early`)
  sysMsgSq(g, SQ_SYS.id, SQ_SYS.name, SQ_SYS.color, DIGITS_DRAWN_MSG)
}
/** Host enters a period's score → the winning square + winner are computed. Final score completes the game. */
export async function setSquaresScore(gameId: string, label: string, home: number, away: number): Promise<void> {
  await delay(150)
  const g = SQUARES_GAMES.find((x) => x.id === gameId); if (!g || g.status !== 'live') return
  const period = g.periods.find((p) => p.label === label); if (!period) return
  period.homeScore = home; period.awayScore = away
  const r = g.rowDigits.indexOf(home % 10), c = g.colDigits.indexOf(away % 10)
  let winnerUserId: string | undefined
  if (r >= 0 && c >= 0) { period.winnerCell = r * 10 + c; winnerUserId = g.cells[r * 10 + c].userId; period.winnerUserId = winnerUserId }
  const sc = `${home}–${away}`
  if (label === 'Final') {
    g.status = 'completed'
    if (winnerUserId) { const d = disp(winnerUserId); sysMsgSq(g, winnerUserId, d.name, d.color, `🏆 Final ${sc} — ${d.name} takes it! 🎉`) }
    else sysMsgSq(g, SQ_SYS.id, SQ_SYS.name, SQ_SYS.color, `🏁 Final ${sc} — no winner on the board`)
  } else if (winnerUserId) {
    const d = disp(winnerUserId); sysMsgSq(g, winnerUserId, d.name, d.color, `🏈 ${label} ${sc} — 👑 ${d.name} wins the square!`)
  } else {
    sysMsgSq(g, SQ_SYS.id, SQ_SYS.name, SQ_SYS.color, `🏈 ${label} ${sc} — no winner this quarter`)
  }
}
