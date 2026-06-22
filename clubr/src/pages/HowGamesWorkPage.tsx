import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { GameHowItWorksCards } from '@/components/onboarding/GameHowItWorksCards'

/**
 * "How the games work" help page — the same game cards shown on the cold-start
 * hub, reachable any time via the header "?" once a user is in. Has a back button.
 */
export function HowGamesWorkPage() {
  const navigate = useNavigate()
  return (
    <div className="animate-fade-up">
      <button onClick={() => navigate(-1)} className="mb-2 flex items-center gap-1 text-sm text-text-muted hover:text-text-secondary cursor-pointer">
        <ChevronLeft className="h-4 w-4" />Back
      </button>
      <h1 className="text-xl font-extrabold tracking-tight text-text-primary">How the games work</h1>
      <p className="mt-1 mb-3 text-sm text-text-secondary">Three ways to play with your club — tap any game to see how it works.</p>
      <GameHowItWorksCards onCreateClub={() => navigate('/clubs', { state: { create: true } })} />
    </div>
  )
}

export default HowGamesWorkPage
