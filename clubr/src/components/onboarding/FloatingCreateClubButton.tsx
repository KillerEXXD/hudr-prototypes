import { Plus } from 'lucide-react'
import { FloatingPuck } from '@/components/common/FloatingPuck'

/**
 * The single Create-a-club CTA on the cold-start hub — a floating, pulsing puck
 * (see FloatingPuck): a "+" that hides while the page scrolls and reappears when it
 * settles, and expands to "Create club" on hover. Sits above the Feedback puck.
 */
export function FloatingCreateClubButton({ onClick }: { onClick: () => void }) {
  return (
    <FloatingPuck
      icon={Plus}
      label="Create club"
      ariaLabel="Create your own club"
      onClick={onClick}
      bottomClass="bottom-36"
      pulse
    />
  )
}
