import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { BottomNav } from './BottomNav'
import FeedbackButton from '@/components/common/FeedbackButton'
import { SpendProvider } from '@/components/credits/SpendProvider'

/** Mobile-first phone-frame shell: header on top, scrolling content, sticky bottom nav. */
export function AppShell() {
  return (
    <div className="flex min-h-screen justify-center bg-bg-primary">
      <div className="flex min-h-screen w-full max-w-md flex-col border-x border-border bg-bg-primary">
        <SpendProvider>
          <Header />
          <main className="flex-1 px-4 pb-6 pt-3">
            <Outlet />
          </main>
          <BottomNav />
        </SpendProvider>
      </div>
      <FeedbackButton />
    </div>
  )
}
