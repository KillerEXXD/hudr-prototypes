import { cn } from '@/lib/utils/cn'

/**
 * Group-members emblem — a 3-person cluster: the front person bigger + bright gold, the two
 * behind (heads spread wide) in a deeper gold, with a dark hairline separating all three so
 * every figure reads even at 16px. Crafted SVG → crisp at any size. Used for every
 * group-member / entrant count.
 */
export function MembersIcon({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={cn('inline-block shrink-0', className)}
      style={{ width: size, height: size }}
    >
      {/* dark hairline separates the three figures so all read at small sizes */}
      <g stroke="#111115" strokeWidth="1.1">
        {/* two people behind — deeper gold, heads spread wide */}
        <g fill="#C58F1C">
          <circle cx="5.4" cy="7.2" r="2.7" />
          <path d="M5.4 10.4c-2.7 0-4.9 2.2-4.9 4.9 0 .3.2.5.5.5h8.8c.3 0 .5-.2.5-.5 0-2.7-2.2-4.9-4.9-4.9z" />
          <circle cx="18.6" cy="7.2" r="2.7" />
          <path d="M18.6 10.4c-2.7 0-4.9 2.2-4.9 4.9 0 .3.2.5.5.5h8.8c.3 0 .5-.2.5-.5 0-2.7-2.2-4.9-4.9-4.9z" />
        </g>
        {/* front person — bigger + bright gold */}
        <g fill="#F0B429">
          <circle cx="12" cy="9" r="3.5" />
          <path d="M12 13.2c-3.7 0-6.7 3-6.7 6.7 0 .4.3.6.7.6h12c.4 0 .7-.3.7-.6 0-3.7-3-6.7-6.7-6.7z" />
        </g>
      </g>
    </svg>
  )
}

/**
 * Total approved entrants/participants in a game — the members icon + count, shown on
 * EVERY game card in EVERY status (separate from the live alive/claimed/drafted stat).
 * The number is bumped a touch so it reads clearly next to the icon.
 */
export function EntrantCount({ count, iconSize = 20, className }: { count: number; iconSize?: number; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1', className)} title={`${count} ${count === 1 ? 'entrant' : 'entrants'}`}>
      <MembersIcon size={iconSize} />
      <span className="text-[15px] font-extrabold leading-none text-text-secondary">{count}</span>
    </span>
  )
}
