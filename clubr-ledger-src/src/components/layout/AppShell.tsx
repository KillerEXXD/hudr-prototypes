import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { Header } from './Header'
import { BottomNav } from './BottomNav'
import FeedbackButton from '@/components/common/FeedbackButton'
import { SpendProvider } from '@/components/credits/SpendProvider'
import { Sheet, Btn } from '@/components/common/ui'
import { LiveBar } from '@/components/arena/ArenaCard'
import { useArena } from '@/hooks/arena'

/** Mobile-first phone-frame shell: header on top, scrolling content, sticky bottom nav. */
export function AppShell() {
  const location = useLocation()
  const navigate = useNavigate()
  // Set after a valid PRIVATE invite code: the club isn't disclosed, so we confirm
  // the request here rather than routing into the club.
  const { live } = useArena()
  const liveElsewhere = live.filter((g) => !location.pathname.endsWith(g.id))
  const inviteSent = (location.state as { inviteSent?: boolean } | null)?.inviteSent
  const dismiss = () => navigate('/', { replace: true, state: {} })

  return (
    <div className="flex min-h-screen justify-center bg-bg-primary">
      <div className="flex min-h-screen w-full max-w-md flex-col border-x border-border bg-bg-primary">
        <SpendProvider>
          <Header />
          <LiveBar games={liveElsewhere} />
          <main className="flex-1 px-4 pb-6 pt-3">
            <Outlet />
          </main>
          <BottomNav />
        </SpendProvider>
      </div>
      <FeedbackButton />

      <Sheet open={!!inviteSent} onClose={dismiss} title="Request sent">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-emerald/10 text-accent-emerald"><CheckCircle2 className="h-6 w-6" /></div>
          <p className="mt-3 text-sm text-text-secondary">Your request to join the club has been sent — the <span className="font-semibold text-text-primary">host will review it</span> and admit you. You'll get a notification when you're in.</p>
          <Btn className="mt-4 w-full" onClick={dismiss}>Back</Btn>
        </div>
      </Sheet>
    </div>
  )
}
