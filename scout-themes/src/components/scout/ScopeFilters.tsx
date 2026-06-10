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
    <div className="flex items-center gap-2">
      <div className="w-16 shrink-0 text-[10px] font-medium uppercase tracking-wide text-text-muted">{label}</div>
      <div className="flex flex-1 gap-1 rounded-lg bg-bg-surface/50 p-0.5">
        {options.map((o) => (
          <button
            key={o.v}
            disabled={o.disabled}
            onClick={() => onChange(o.v)}
            className={cn(
              'flex-1 whitespace-nowrap rounded-md px-1 py-1.5 text-center text-xs font-medium transition-colors cursor-pointer',
              o.disabled && 'opacity-40 cursor-not-allowed',
              value === o.v
                ? 'bg-accent-blue text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary',
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function ScopeFilters({ filters, onChange, eventAvailable, showScope = true }: {
  filters: StatFilters
  onChange: (f: StatFilters) => void
  eventAvailable: boolean
  /** hide the event/career row (e.g. on a tournament, scope is fixed to that event). */
  showScope?: boolean
}) {
  const set = (patch: Partial<StatFilters>) => onChange({ ...filters, ...patch })
  return (
    <div className="space-y-2 rounded-xl border border-border bg-bg-card p-3">
      {showScope && (
        <PillGroup<Scope>
          label="Scope"
          value={filters.scope}
          onChange={(v) => set({ scope: v })}
          options={[
            { v: 'event', label: 'This event', disabled: !eventAvailable },
            { v: 'career', label: 'Career' },
          ]}
        />
      )}
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
