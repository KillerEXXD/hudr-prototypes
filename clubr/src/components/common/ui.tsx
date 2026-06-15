import { createPortal } from 'react-dom'
import { type ReactNode } from 'react'
import { X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

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
export function Badge({ children, tone = 'neutral', className }: { children: ReactNode; tone?: 'neutral' | 'blue' | 'green' | 'amber' | 'red' | 'purple'; className?: string }) {
  const tones: Record<string, string> = {
    neutral: 'bg-bg-surface text-text-secondary border-border',
    blue: 'bg-accent-blue/12 text-accent-blue border-accent-blue/30',
    green: 'bg-accent-emerald/12 text-accent-emerald border-accent-emerald/30',
    amber: 'bg-accent-amber/12 text-accent-amber border-accent-amber/30',
    red: 'bg-accent-red/12 text-accent-red border-accent-red/30',
    purple: 'bg-accent-purple/12 text-accent-purple border-accent-purple/30',
  }
  return <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold', tones[tone], className)}>{children}</span>
}

// ---- Card ----
export function Card({ children, className, onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={cn('rounded-2xl border border-border bg-bg-card p-4', onClick && 'cursor-pointer transition-colors hover:bg-bg-surface active:scale-[0.995]', className)}
    >
      {children}
    </div>
  )
}

// ---- Button ----
export function Btn({ children, onClick, variant = 'primary', size = 'md', disabled, className, type = 'button' }: {
  children: ReactNode; onClick?: () => void; variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; size?: 'sm' | 'md'; disabled?: boolean; className?: string; type?: 'button' | 'submit'
}) {
  const variants: Record<string, string> = {
    primary: 'bg-accent-blue text-white hover:brightness-110',
    secondary: 'bg-bg-surface text-text-primary border border-border hover:bg-bg-elevated',
    ghost: 'text-text-secondary hover:bg-bg-surface',
    danger: 'bg-accent-red/15 text-accent-red border border-accent-red/30 hover:bg-accent-red/25',
  }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-xl font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer',
        size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-sm',
        variants[variant],
        className,
      )}
    >
      {children}
    </button>
  )
}

// ---- Section header ----
export function Section({ title, action, children, className }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn('mt-5', className)}>
      <div className="mb-2 flex items-center justify-between px-0.5">
        <h2 className="text-sm font-bold uppercase tracking-wide text-text-muted">{title}</h2>
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
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-bg-surface cursor-pointer" aria-label="Close"><X className="h-4 w-4" /></button>
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
