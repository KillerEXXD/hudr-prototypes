import type { StatFilters, Scope, TableSizeBucket, DepthBucket } from '@/engine'
import { cn } from '@/lib/utils'

// Filter bar: Scope (event/career) · Table size (≤4 / ≥5) · Depth (BB buckets).
// Every change re-queries stats → reliability tiers + scores recompute.

function PillGroup<T extends string>({ label, value, options, onChange }: {
  label: string
  value: T
  options: { v: T; label: string; disabled?: boolean }[]
  onChange: (v: T) => void
}) {
  return (
    <div>
      <div className="mb-1 text-[10px] font-medium uppercase tracking-wide text-text-muted">{label}</div>
      <div className="flex gap-1 overflow-x-auto no-scrollbar">
        {options.map((o) => (
          <button
            key={o.v}
            disabled={o.disabled}
            onClick={() => onChange(o.v)}
            className={cn(
              'shrink-0 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer',
              o.disabled && 'opacity-40 cursor-not-allowed',
              value === o.v
                ? 'border-accent-blue bg-accent-blue/15 text-accent-blue'
                : 'border-border bg-bg-surface/60 text-text-secondary hover:text-text-primary',
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function ScopeFilters({ filters, onChange, eventAvailable }: {
  filters: StatFilters
  onChange: (f: StatFilters) => void
  eventAvailable: boolean
}) {
  const set = (patch: Partial<StatFilters>) => onChange({ ...filters, ...patch })
  return (
    <div className="grid grid-cols-1 gap-3 rounded-xl border border-border bg-bg-card p-3 sm:grid-cols-3">
      <PillGroup<Scope>
        label="Scope"
        value={filters.scope}
        onChange={(v) => set({ scope: v })}
        options={[
          { v: 'event', label: 'This event', disabled: !eventAvailable },
          { v: 'career', label: 'Career' },
        ]}
      />
      <PillGroup<TableSizeBucket>
        label="Table size"
        value={filters.tableSize}
        onChange={(v) => set({ tableSize: v })}
        options={[
          { v: 'all', label: 'All' },
          { v: 'short', label: 'Short ≤4' },
          { v: 'full', label: 'Full ≥5' },
        ]}
      />
      <PillGroup<DepthBucket>
        label="Stack depth"
        value={filters.depth}
        onChange={(v) => set({ depth: v })}
        options={[
          { v: 'all', label: 'All' },
          { v: 'short', label: '<15bb' },
          { v: 'mid', label: '15–40' },
          { v: 'deep', label: '40+' },
        ]}
      />
    </div>
  )
}
