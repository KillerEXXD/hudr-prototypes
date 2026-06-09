import { cn } from '@/lib/utils'

// Tiny playing-card chip for sample-hand boards. Card string like "Kd", "Th".
const SUIT = { s: { sym: '♠', red: false }, h: { sym: '♥', red: true }, d: { sym: '♦', red: true }, c: { sym: '♣', red: false } }

export default function MiniCard({ card, className }: { card: string; className?: string }) {
  const rank = card.slice(0, card.length - 1)
  const suit = card.slice(-1).toLowerCase() as keyof typeof SUIT
  const meta = SUIT[suit] ?? { sym: '?', red: false }
  return (
    <span
      className={cn(
        'inline-flex h-7 w-6 flex-col items-center justify-center rounded border border-border-light bg-white text-[11px] font-bold leading-none shadow-sm',
        meta.red ? 'text-red-600' : 'text-gray-900',
        className,
      )}
    >
      <span>{rank}</span>
      <span className="text-[10px]">{meta.sym}</span>
    </span>
  )
}
