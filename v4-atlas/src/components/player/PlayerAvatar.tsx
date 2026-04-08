import { cn } from '@/lib/utils'

interface PlayerAvatarProps {
  initials: string
  color: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
}

export default function PlayerAvatar({ initials, color, size = 'md', className }: PlayerAvatarProps) {
  return (
    <div
      className={cn('rounded-full flex items-center justify-center font-bold text-white', sizes[size], className)}
      style={{ backgroundColor: color }}
    >
      {initials}
    </div>
  )
}
