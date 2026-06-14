import { useState } from 'react'
import { cn } from '@/lib/utils'

interface PlayerAvatarProps {
  initials: string
  color: string
  size?: 'sm' | 'md' | 'lg'
  photoUrl?: string | null
  className?: string
}

const sizes = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
}

export default function PlayerAvatar({ initials, color, size = 'md', photoUrl, className }: PlayerAvatarProps) {
  const [errored, setErrored] = useState(false)
  const showPhoto = !!photoUrl && !errored
  return (
    <div
      className={cn('relative flex items-center justify-center overflow-hidden rounded-full font-bold text-white', sizes[size], className)}
      style={{ backgroundColor: color }}
    >
      {/* Initials sit behind the photo — shown while it loads and as the fallback on error. */}
      {initials}
      {showPhoto && (
        <img
          src={photoUrl!}
          alt={initials}
          loading="lazy"
          onError={() => setErrored(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
    </div>
  )
}
