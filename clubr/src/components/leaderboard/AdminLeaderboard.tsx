import { useEffect, useState } from 'react'
import { Trophy } from 'lucide-react'
import { useLeaderboardConfig, useUpdateLeaderboardConfig } from '@/hooks/leaderboard'
import { Section, Card, Btn, Spinner } from '@/components/common/ui'
import { DEFAULT_LEADERBOARD, type LeaderboardConfig } from '@/types/leaderboard'

const FIELDS: { label: string; key: keyof LeaderboardConfig; hint?: string }[] = [
  { label: 'Scale (B)', key: 'base', hint: 'bigger numbers' },
  { label: 'Min field', key: 'minField', hint: 'players to count' },
  { label: 'Depth ÷', key: 'depthDivisor', hint: 'top 1/N scores' },
  { label: 'FT weight', key: 'ftWeight' },
  { label: 'Last Longer wt', key: 'llWeight' },
  { label: 'Squares weight', key: 'squaresWeight', hint: 'luck-discounted' },
]

// App-Admin "Leaderboard formula" — tune the global points curve. Mirrors AdminEconomy.
export function AdminLeaderboard() {
  const cfgQ = useLeaderboardConfig()
  const update = useUpdateLeaderboardConfig()
  const [cfg, setCfg] = useState<LeaderboardConfig>(DEFAULT_LEADERBOARD)

  useEffect(() => { if (cfgQ.data) setCfg(cfgQ.data) }, [cfgQ.data]) // eslint-disable-line

  const num = (v: string) => Math.max(0, Number(v.replace(/[^0-9.]/g, '')) || 0)

  return (
    <Section title="Leaderboard formula" action={<Trophy className="h-4 w-4 text-accent-amber" />}>
      {cfgQ.isLoading ? <Spinner /> : (
        <Card className="p-3">
          <p className="mb-2 text-[11px] leading-snug text-text-muted">
            <span className="font-mono text-text-secondary">points = round(B × √N ÷ √rank × weight)</span>, awarded to the
            top 1/depth of the field. Per-club, resets monthly. Applies platform-wide.
          </p>
          <div className="grid grid-cols-3 gap-2">
            {FIELDS.map(({ label, key, hint }) => (
              <label key={key} className="block">
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-text-muted">{label}</span>
                <input
                  type="number" step="0.1" min={0} value={cfg[key]}
                  onChange={(e) => setCfg((c) => ({ ...c, [key]: num(e.target.value) }))}
                  className="w-full rounded-lg border border-border bg-bg-surface px-2 py-1.5 text-center font-mono text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-amber"
                />
                {hint && <span className="mt-0.5 block text-[9px] text-text-muted">{hint}</span>}
              </label>
            ))}
          </div>
          <Btn size="sm" className="mt-2 w-full" disabled={update.isPending} onClick={() => update.mutate(cfg)}>Save formula</Btn>
        </Card>
      )}
    </Section>
  )
}
