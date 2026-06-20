import { Radio, Play, Trophy, Users, Coins, Layers, Flame, ChevronRight } from 'lucide-react'
import type { FTContestView } from '@/types/ft'
import { Badge, Section } from '@/components/common/ui'
import { cn } from '@/lib/utils/cn'
import { fmtK, fmtChips, playerFull } from '@/lib/utils/ftFormat'

// Read-only "everything we know about this final table" panel.
// Shown to players AND hosts in every contest state: the live broadcast,
// headline event facts, and the full ICM-priced player roster with stacks.
export function FinalTableDetails({ contest: c }: { contest: FTContestView }) {
  const players = [...c.players].sort((a, b) => (b.chips ?? b.bbStack) - (a.chips ?? a.bbStack))
  const leaderChips = players[0]?.chips ?? players[0]?.bbStack ?? 1
  const totalChips = players.reduce((s, p) => s + (p.chips ?? 0), 0)
  const avgBB = Math.round(players.reduce((s, p) => s + p.bbStack, 0) / players.length)

  // Pick popularity is sealed until the lock passes (same rule as the rest of the UI).
  const revealPicks = c.status !== 'open'
  const draftCount: Record<string, number> = {}
  if (revealPicks) {
    c.entries.filter((e) => e.status === 'approved').forEach((e) => e.picks.forEach((s) => { draftCount[s] = (draftCount[s] ?? 0) + 1 }))
  }
  const maxDrafts = Math.max(1, ...Object.values(draftCount))
  const myPicks = c.myEntry?.picks ?? []

  return (
    <Section title="The Final Table" action={<Badge tone="purple">{players.length}-handed</Badge>}>
      {/* ---- Live broadcast ---- */}
      {c.streamUrl && (
        <a
          href={c.streamUrl}
          target="_blank"
          rel="noreferrer"
          className="group relative mb-2 flex items-center gap-3 overflow-hidden rounded-2xl border border-accent-red/40 bg-gradient-to-br from-accent-red/25 via-accent-purple/15 to-bg-card px-3.5 py-3 transition-transform active:scale-[0.99]"
        >
          <span className="absolute inset-0 opacity-[0.07] [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:14px_14px]" />
          <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-red text-white shadow-lg shadow-accent-red/30 group-hover:brightness-110">
            <Play className="h-5 w-5 translate-x-0.5 fill-white" />
          </span>
          <div className="relative min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              {c.streamLive ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-accent-red px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-white">
                  <Radio className="h-2.5 w-2.5 animate-pulse" /> Live
                </span>
              ) : (
                <span className="rounded-full bg-bg-surface px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-text-muted">Replay</span>
              )}
              <span className="truncate text-sm font-extrabold text-text-primary">Watch on YouTube</span>
            </div>
            <p className="truncate text-[11px] text-text-secondary">{c.streamLive ? 'Streaming now' : 'On demand'} · {c.room ?? c.clubName} broadcast</p>
          </div>
          <ChevronRight className="relative h-4 w-4 shrink-0 text-text-muted group-hover:text-text-primary" />
        </a>
      )}

      {/* ---- Headline facts ---- */}
      <div className="mb-2 grid grid-cols-2 gap-2">
        <Fact icon={<Trophy className="h-3.5 w-3.5 text-accent-amber" />} label="Prize pool" value={c.prizePool ?? '—'} />
        <Fact icon={<Coins className="h-3.5 w-3.5 text-accent-emerald" />} label="Buy-in" value={c.buyIn ?? '—'} />
        <Fact icon={<Users className="h-3.5 w-3.5 text-accent-blue" />} label="Players left" value={`${players.length}`} />
        <Fact icon={<Layers className="h-3.5 w-3.5 text-accent-purple" />} label="Avg stack" value={`${avgBB} BB`} />
        <Fact icon={<Coins className="h-3.5 w-3.5 text-text-muted" />} label="Chips in play" value={fmtChips(totalChips)} />
        <Fact icon={<Flame className="h-3.5 w-3.5 text-accent-red" />} label="Level" value={c.level ?? '—'} />
      </div>

      {/* ---- Roster: stack · price · popularity ---- */}
      <div className="overflow-hidden rounded-2xl border border-border bg-bg-card">
        <div className="flex items-center gap-2 border-b border-border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-text-muted">
          <span className="w-4">#</span>
          <span className="flex-1">Player</span>
          <span className="w-16 text-right">Stack</span>
          <span className="w-12 text-right">Price</span>
        </div>
        {players.map((p, i) => {
          const mine = myPicks.includes(p.seat)
          const drafts = draftCount[p.seat] ?? 0
          const hot = revealPicks && drafts > 0 && drafts === maxDrafts
          const barPct = Math.max(6, Math.round(((p.chips ?? p.bbStack) / leaderChips) * 100))
          return (
            <div
              key={p.seat}
              className={cn(
                'flex items-center gap-2 px-3 py-2 transition-colors',
                i > 0 && 'border-t border-border/60',
                mine ? 'bg-accent-purple/10' : 'hover:bg-bg-surface/50',
              )}
            >
              <span className="w-4 text-center text-xs font-extrabold text-text-muted">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm leading-none">{p.country ?? '🃏'}</span>
                  <span className="truncate text-sm font-bold text-text-primary">{playerFull(p)}</span>
                  {mine && <Badge tone="purple">Yours</Badge>}
                  {hot && <Badge tone="amber"><Flame className="h-2.5 w-2.5" />Hot</Badge>}
                  {revealPicks && drafts > 0 && !hot && <span className="text-[10px] font-semibold text-text-muted">×{drafts}</span>}
                </div>
                {/* relative chip-stack bar */}
                <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-bg-surface">
                  <div
                    className={cn('h-full rounded-full', mine ? 'bg-accent-purple' : i === 0 ? 'bg-accent-emerald' : 'bg-accent-blue/70')}
                    style={{ width: `${barPct}%` }}
                  />
                </div>
              </div>
              <div className="w-16 text-right leading-tight">
                <div className="font-mono text-xs font-bold text-text-primary">{p.bbStack} BB</div>
                {p.chips != null && <div className="font-mono text-[9px] text-text-muted">{fmtChips(p.chips)}</div>}
              </div>
              <div className="w-12 text-right font-mono text-xs font-bold text-accent-purple">{fmtK(p.icmPrice)}</div>
            </div>
          )
        })}
      </div>
      <p className="mt-1.5 px-0.5 text-[10px] leading-snug text-text-muted">
        Stacks &amp; chip counts are live from the broadcast. <span className="text-accent-purple">Price</span> is the ICM draft cost.
      </p>
    </Section>
  )
}

function Fact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-bg-card px-2.5 py-1.5">
      {icon}
      <div className="min-w-0">
        <div className="text-[9px] font-bold uppercase tracking-wide text-text-muted">{label}</div>
        <div className="truncate text-xs font-bold text-text-primary">{value}</div>
      </div>
    </div>
  )
}
