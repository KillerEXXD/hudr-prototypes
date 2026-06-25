import { MapPin, Crown, CheckCircle2, Clock } from 'lucide-react'
import { ClubEmblem } from '@/components/common/ClubEmblem'
import { cn } from '@/lib/utils/cn'

// Shared card used by every carousel variant in the lab, so comparisons differ
// ONLY by the carousel mechanics — not the card. Self-contained sample data.

export interface LabClub {
  id: string
  name: string
  location: string
  role: 'owner' | 'member' | 'waiting'
  memberCount: number
  memberColors: string[]
  logoUrl?: string
}

// Midjourney mascot emblems live in public/emblems and are served under the build base.
const mascot = (file: string) => `${import.meta.env.BASE_URL}emblems/${file}.webp`

// Only bright, friendly (not scary) mascots — gladiator, lion, eagle, dragon, bull, ram.
// The darker / snarling ones (bear, tiger, shark, wolf, gorilla, cobra) are kept in the
// pack but not used here.
export const LAB_CLUBS: LabClub[] = [
  { id: 'c_aces', name: 'Aces High', location: 'Houston, TX', role: 'owner', memberCount: 8, memberColors: ['#ef4444', '#3b82f6', '#10b981'], logoUrl: mascot('gladiator') },
  { id: 'c_grinders', name: 'The Grinders', location: 'Dallas, TX', role: 'member', memberCount: 14, memberColors: ['#f59e0b', '#8b5cf6', '#06b6d4'], logoUrl: mascot('lion') },
  { id: 'c_river', name: 'River Rats', location: 'Austin, TX', role: 'member', memberCount: 5, memberColors: ['#06b6d4', '#ec4899'], logoUrl: mascot('eagle') },
  { id: 'c_high', name: 'High Rollers', location: 'Las Vegas, NV', role: 'waiting', memberCount: 21, memberColors: ['#a855f7', '#22c55e', '#eab308'], logoUrl: mascot('dragon') },
  { id: 'c_bayou', name: 'Bayou City Poker Club', location: 'Houston, TX', role: 'owner', memberCount: 33, memberColors: ['#a855f7', '#ef4444', '#14b8a6'], logoUrl: mascot('bull') },
  { id: 'c_gulf', name: 'Gulf Coast Card Club', location: 'Galveston, TX', role: 'member', memberCount: 9, memberColors: ['#dc2626', '#2563eb', '#16a34a'], logoUrl: mascot('ram') },
]

function Pawn({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <circle cx="12" cy="6.2" r="3.1" />
      <path d="M8.6 10.2h6.8c0 2.2-1.1 3.4-1.7 4.8h-3.4c-.6-1.4-1.7-2.6-1.7-4.8Z" />
      <path d="M6.4 20c0-2.1 2.6-3.4 5.6-3.4s5.6 1.3 5.6 3.4Z" />
    </svg>
  )
}

function RolePill({ role }: { role: LabClub['role'] }) {
  const meta = role === 'waiting'
    ? { label: 'Waiting', Icon: Clock, cls: 'border-accent-amber/40 bg-accent-amber/15 text-accent-amber' }
    : role === 'owner'
      ? { label: 'Owner', Icon: Crown, cls: 'border-accent-gold/45 bg-accent-gold/15 text-accent-gold' }
      : { label: 'Member', Icon: CheckCircle2, cls: 'border-accent-emerald/40 bg-accent-emerald/15 text-accent-emerald' }
  const { label, Icon, cls } = meta
  return <span className={cn('inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-extrabold', cls)}><Icon className="h-3.5 w-3.5" />{label}</span>
}

// Members are shown as a COUNT only — no avatars/names. A single pawn + the number
// in a subtle pill keeps it clean and never implies we know who the members are.
function MemberCluster({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-bg-surface/60 px-2.5 py-1 text-xs font-semibold text-text-secondary">
      <Pawn className="h-3.5 w-3.5 text-text-muted" />{count} {count === 1 ? 'member' : 'members'}
    </span>
  )
}

export function ClubLabCard({ club }: { club: LabClub }) {
  return (
    <div className="flex w-full flex-col items-center gap-1.5 rounded-t-3xl rounded-b-2xl border border-border bg-bg-card p-5 text-center shadow-lg shadow-black/25">
      <ClubEmblem id={club.id} logoUrl={club.logoUrl} size={140} />
      <span className="mt-1 w-full truncate text-base font-extrabold tracking-tight text-text-primary">{club.name}</span>
      <RolePill role={club.role} />
      <span className="flex items-center gap-1 text-[11px] text-text-muted"><MapPin className="h-3 w-3 shrink-0" /><span className="truncate">{club.location}</span></span>
      <MemberCluster count={club.memberCount} />
    </div>
  )
}
