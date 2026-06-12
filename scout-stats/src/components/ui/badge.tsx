import { type HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
  {
    variants: {
      variant: {
        default: 'bg-accent-blue/20 text-accent-blue',
        success: 'bg-accent-emerald/20 text-accent-emerald',
        warning: 'bg-accent-amber/20 text-accent-amber',
        danger: 'bg-accent-red/20 text-accent-red',
        purple: 'bg-accent-purple/20 text-accent-purple',
        muted: 'bg-bg-surface text-text-muted',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}
