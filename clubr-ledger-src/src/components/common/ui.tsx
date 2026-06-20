import { createPortal } from 'react-dom'
import { type ReactNode } from 'react'
import { X, Loader2, Crown, Shield, Spade, Heart, Diamond, Club } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

// ---- Processing (CRUD activity indicator) ----
// The four card suits pop in sequence — our consistent "the app is working on it"
// signal for every create / update / delete / pick / admit. Scales from a tiny
// inline glyph inside a <Btn> up to a centered <ProcessingOverlay>.
const PROC_SUITS = [
  { Icon: Spade, cls: 'text-text-primary' },
  { Icon: Heart, cls: 'text-accent-red' },
  { Icon: Diamond, cls: 'text-accent-red' },
  { Icon: Club, cls: 'text-text-primary' },
] as const

export function Processing({ size = 16, label, count = 4, className }: { size?: number; label?: string; count?: number; className?: string }) {
  const suits = PROC_SUITS.slice(0, Math.max(1, Math.min(4, count)))
  return (
    <span role="status" aria-label={label ?? 'Processing'} className={cn('inline-flex items-center gap-0.5', className)}>
      {suits.map(({ Icon, cls }, i) => (
        <Icon
          key={i}
          aria-hidden
          fill="currentColor"
          strokeWidth={0}
          className={cn('clubr-suit shrink-0', cls)}
          style={{ width: size, height: size, animationDelay: `${i * 0.14}s` }}
        />
      ))}
      {label && <span className="ml-1.5 text-text-muted">{label}</span>}
    </span>
  )
}

// Card/section-level processing veil. Parent MUST be `relative`.
export function ProcessingOverlay({ label, className }: { label?: string; className?: string }) {
  return (
    <div className={cn('absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 rounded-[inherit] bg-bg-card/70 backdrop-blur-sm', className)}>
      <Processing size={22} />
      {label && <span className="text-xs font-semibold text-text-muted">{label}</span>}
    </div>
  )
}

// ---- Avatar ----
export function Avatar({ name, color, size = 36, emoji }: { name?: string; color?: string; size?: number; emoji?: string }) {
  const initials = (name ?? '?').split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase()
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white"
      style={{ width: size, height: size, background: color ?? '#6b7280', fontSize: size * 0.4 }}
    >
      {emoji ?? initials}
    </span>
  )
}

// ---- Badge / pill ----
export function Badge({ children, tone = 'neutral', className }: { children: ReactNode; tone?: 'neutral' | 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'dark' | 'gold'; className?: string }) {
  const tones: Record<string, string> = {
    neutral: 'bg-bg-surface text-text-secondary border-border',
    blue: 'bg-accent-blue/12 text-accent-blue border-accent-blue/30',
    green: 'bg-accent-emerald/12 text-accent-emerald border-accent-emerald/30',
    amber: 'bg-accent-amber/12 text-accent-amber border-accent-amber/30',
    red: 'bg-accent-red/12 text-accent-red border-accent-red/30',
    purple: 'bg-accent-purple/12 text-accent-purple border-accent-purple/30',
    gold: 'bg-accent-gold/15 text-accent-gold border-accent-gold/30',
    dark: 'bg-neutral-900 text-white border-neutral-700',
  }
  return <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold', tones[tone], className)}>{children}</span>
}

// ---- Club-role chip ----
// The signed-in player's standing in a game's club — owner / co-host / member.
// A quiet secondary chip (the type badge is the loud one). MemberRole 'host'
// reads as "Co-host"; the club's single 'owner' reads as "Owner".
const CLUB_ROLE = {
  owner: { label: 'Owner', Icon: Crown, cls: 'bg-accent-amber/15 text-accent-amber' },
  host: { label: 'Co-host', Icon: Shield, cls: 'bg-accent-blue/15 text-accent-blue' },
} as const
export function RoleChip({ role, className }: { role: 'owner' | 'host' | 'member'; className?: string }) {
  if (role === 'member') return null // default role — no chip
  const m = CLUB_ROLE[role]
  return <span className={cn('inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold', m.cls, className)}><m.Icon className="h-2.5 w-2.5" />{m.label}</span>
}

// ---- Card ----
export function Card({ children, className, onClick, id }: { children: ReactNode; className?: string; onClick?: () => void; id?: string }) {
  return (
    <div
      id={id}
      onClick={onClick}
      className={cn('rounded-lg border border-border bg-bg-card p-4', onClick && 'cursor-pointer transition-colors hover:bg-bg-surface active:scale-[0.995]', className)}
    >
      {children}
    </div>
  )
}

// ---- Button ----
// `loading` shows the suit <Processing> in place of the label and auto-disables —
// pass it the mutation's isPending so every CRUD button signals work consistently.
export function Btn({ children, onClick, variant = 'primary', size = 'md', disabled, loading, className, type = 'button' }: {
  children: ReactNode; onClick?: () => void; variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; size?: 'sm' | 'md'; disabled?: boolean; loading?: boolean; className?: string; type?: 'button' | 'submit'
}) {
  const variants: Record<string, string> = {
    primary: 'bg-accent-gold text-bg-primary hover:brightness-105 font-bold',
    secondary: 'bg-bg-surface text-text-primary border border-border hover:bg-bg-elevated',
    ghost: 'text-text-secondary hover:bg-bg-surface',
    danger: 'bg-accent-red/15 text-accent-red border border-accent-red/30 hover:bg-accent-red/25',
  }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-xl font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer',
        size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-sm',
        variants[variant],
        className,
      )}
    >
      {loading ? <Processing size={size === 'sm' ? 13 : 15} /> : children}
    </button>
  )
}

// ---- Section header ----
export function Section({ title, action, children, className }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn('mt-5', className)}>
      <div className="mb-2 flex items-center justify-between px-0.5">
        <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

// ---- Empty state ----
export function EmptyState({ icon, title, sub }: { icon?: ReactNode; title: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-bg-card/50 px-6 py-10 text-center">
      {icon && <div className="text-text-muted">{icon}</div>}
      <p className="text-sm font-semibold text-text-secondary">{title}</p>
      {sub && <p className="max-w-xs text-xs text-text-muted">{sub}</p>}
    </div>
  )
}

// ---- Spinner ----
export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-sm text-text-muted">
      <Loader2 className="h-4 w-4 animate-spin" /> {label ?? 'Loading…'}
    </div>
  )
}

// ---- Bottom sheet ----
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div className="animate-fade-up w-full max-w-md rounded-t-3xl border border-border bg-bg-card p-5 shadow-2xl sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-bold text-text-primary">{title}</h3>
          <button onClick={onClose} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-bg-surface text-text-secondary shadow-sm transition-colors hover:border-text-muted hover:bg-bg-card hover:text-text-primary cursor-pointer" aria-label="Close"><X className="h-[18px] w-[18px]" strokeWidth={2.5} /></button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}

// ---- Text input ----
export function Field({ label, value, onChange, placeholder, type = 'text', mono }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; mono?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-text-secondary">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn('w-full rounded-xl border border-border bg-bg-surface px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-blue', mono && 'font-mono tracking-widest uppercase')}
      />
    </label>
  )
}
