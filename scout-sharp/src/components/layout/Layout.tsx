import { Outlet } from 'react-router-dom'
import Header from './Header'
import BottomNav from './BottomNav'

export default function Layout() {
  return (
    <div className="min-h-screen bg-bg-primary flex justify-center">
      <div className="w-full max-w-lg min-h-screen bg-bg-secondary relative pb-20">
        <Header />
        <main className="px-4 py-4">
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </div>
  )
}
