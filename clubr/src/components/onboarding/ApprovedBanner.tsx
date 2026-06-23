import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PartyPopper, X, ArrowRight } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useMyClubs } from '@/hooks'
import { useUnifiedGames } from '@/games/useUnifiedGames'
import { relationshipOf } from '@/games/gameRelationship'
import { gameTypeDef, type UnifiedGame } from '@/games/types'

/**
 * A transient "you've been approved" nudge at the top of Discover / Home — shown once
 * when you're freshly admitted to a club or approved into a game, with an Open CTA.
 * NOT a permanent banner.
 *
 * Detection is purely client-side (no backend) via a **snapshot diff**: a per-user
 * `localStorage` set remembers every club/game you've *already* been a confirmed
 * member of / playing in. A nudge fires only for an id that is **new** vs. that
 * snapshot — i.e. an actual approval transition — then the snapshot is updated.
 *   • **First run** on a device (no snapshot): we seed it with your current approvals
 *     and show nothing — so existing members are never congratulated, and a cache-wipe
 *     just re-seeds (never false-fires). For a brand-new user the snapshot is seeded
 *     empty while they're on the cold-start hub (this component mounts there too), so
 *     their *first* admit still counts as new.
 *   • It also clears immediately on **Open** (navigates) or **×** (dismiss).
 * Per-device by design — a transient welcome doesn't need cross-device sync. No
 * dependence on server timestamps, so a missing `joinedAt` can't silently break it.
 */
const KEY = (uid: string) => `clubr-known-approved:${uid}`

type Nudge = { id: string; kind: 'club' | 'game'; title: string; to: string }

function gameRoute(g: UnifiedGame): string {
  if (g.type === 'ft_fantasy') return `/fantasy/${g.id}`
  if (g.type === 'last_longer') return `/lastlonger/${g.id}`
  return `/squares/${g.id}`
}

export function ApprovedBanner() {
  const { user } = useAuth()
  const uid = user?.id ?? ''
  const clubs = useMyClubs()
  const { items, isLoading: gamesLoading } = useUnifiedGames()
  const navigate = useNavigate()
  // null = not computed yet; an array = the (capped) nudges to show this mount.
  const [nudges, setNudges] = useState<Nudge[] | null>(null)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  // Compute ONCE, when the footprint has loaded — so a refetch can't make it vanish
  // mid-view, and we never read empty data before it arrives.
  const loaded = !!uid && clubs.isSuccess && !gamesLoading
  useEffect(() => {
    if (nudges !== null || !loaded) return
    const current: Nudge[] = [
      ...(clubs.data ?? []).filter((c) => c.myStatus === 'member')
        .map((c) => ({ id: `club:${c.id}`, kind: 'club' as const, title: `${c.emoji} ${c.name}`, to: `/club/${c.id}` })),
      ...items.filter((g) => relationshipOf(g) === 'playing')
        .map((g) => ({ id: `game:${g.type}:${g.id}`, kind: 'game' as const, title: gameTypeDef(g.type)?.label ?? 'your game', to: gameRoute(g) })),
    ]
    const currentIds = current.map((c) => c.id)
    const raw = window.localStorage.getItem(KEY(uid))
    // First run on this device: seed the snapshot, congratulate nobody.
    if (raw === null) { window.localStorage.setItem(KEY(uid), JSON.stringify(currentIds)); setNudges([]); return }
    let known: string[] = []
    try { known = JSON.parse(raw) as string[] } catch { known = [] }
    const knownSet = new Set(known)
    const fresh = current.filter((c) => !knownSet.has(c.id)) // newly approved since last seen
    window.localStorage.setItem(KEY(uid), JSON.stringify(currentIds)) // advance the snapshot
    setNudges(fresh.slice(0, 2)) // at most two at once — don't bury the page
  }, [loaded, nudges, uid, clubs.data, items])

  const shown = (nudges ?? []).filter((n) => !dismissed.has(n.id))
  if (shown.length === 0) return null

  const dismiss = (id: string) => setDismissed((prev) => new Set(prev).add(id))

  return (
    <div className="mb-3 flex flex-col gap-2">
      {shown.map((n) => (
        <div key={n.id} className="flex items-center gap-3 rounded-2xl border border-accent-emerald/30 bg-accent-emerald/10 p-3 animate-fade-up">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-emerald/15 text-accent-emerald"><PartyPopper className="h-5 w-5" /></span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-text-primary">{n.kind === 'club' ? "You're in!" : "You're approved!"}</p>
            <p className="truncate text-xs text-text-muted">
              {n.kind === 'club'
                ? <>Welcome to <span className="font-semibold text-text-secondary">{n.title}</span> — the host admitted you.</>
                : <>Your <span className="font-semibold text-text-secondary">{n.title}</span> game is ready to play.</>}
            </p>
          </div>
          <button type="button" onClick={() => { dismiss(n.id); navigate(n.to) }} className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-accent-emerald px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-accent-emerald/90 cursor-pointer">
            {n.kind === 'club' ? 'Open club' : 'Open game'}<ArrowRight className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={() => dismiss(n.id)} aria-label="Dismiss" className="shrink-0 text-text-muted hover:text-text-secondary cursor-pointer"><X className="h-4 w-4" /></button>
        </div>
      ))}
    </div>
  )
}
