import { fromSquares } from '@/lib/arena/unifiedGame'
import { FeltGameCard } from '@/components/felt/FeltGame'
import { useAuth } from '@/contexts/AuthContext'
import type { SquaresGameView } from '@/types/squares'
import type { MemberRole } from '@/types'

// Squares list item -> the ClubrGo JSX labelled-column card.
export function SquaresRow({ g }: { g: SquaresGameView; showType?: boolean; clubRole?: MemberRole }) {
  const { user } = useAuth()
  return <FeltGameCard g={fromSquares(g, user?.id ?? '')} />
}
