import { Search, Bell } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

export default function Header() {
  return (
    <header className={cn(
      'sticky top-0 z-40 flex items-center justify-between px-4 py-3',
      'bg-bg-primary/90 backdrop-blur-md border-b border-border'
    )}>
      <Link to="/" className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center text-white font-bold text-sm">
          H
        </div>
        <span className="font-semibold text-text-primary">HUDR</span>
      </Link>

      <div className="flex items-center gap-3">
        <Link to="/search" className="p-2 rounded-lg hover:bg-bg-surface transition-colors">
          <Search className="w-5 h-5 text-text-secondary" />
        </Link>
        <button className="p-2 rounded-lg hover:bg-bg-surface transition-colors relative">
          <Bell className="w-5 h-5 text-text-secondary" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent-red rounded-full" />
        </button>
      </div>
    </header>
  )
}
