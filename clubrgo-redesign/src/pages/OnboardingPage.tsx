import { Target, Spade, ShieldCheck, ArrowRight } from 'lucide-react'
import { useAuth, type Role } from '@/contexts/AuthContext'

const ROLES: { role: Role; label: string; sub: string; icon: typeof Target; cls: string }[] = [
  { role: 'player', label: 'Continue as Player', sub: 'Join clubs, draft & play', icon: Target, cls: 'from-accent-blue to-accent-violet' },
  { role: 'host', label: 'Continue as Club Host', sub: 'Create clubs, run games', icon: Spade, cls: 'from-accent-emerald to-accent-blue' },
  { role: 'admin', label: 'Continue as App Admin', sub: 'Oversee everything', icon: ShieldCheck, cls: 'from-accent-amber to-accent-red' },
]

export function OnboardingPage() {
  const { login } = useAuth()
  return (
    <div className="flex min-h-screen w-full flex-col items-center bg-bg-primary py-0 sm:py-6">
      <div className="relative flex h-[100svh] w-full max-w-[430px] flex-col overflow-hidden bg-bg-primary text-text-primary sm:h-[900px] sm:rounded-[2.2rem] sm:border sm:border-border sm:shadow-2xl">
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-accent-blue/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 top-40 h-72 w-72 rounded-full bg-accent-violet/20 blur-3xl" />

        <div className="animate-fade-up relative flex flex-1 flex-col justify-center px-6">
          <div className="mb-2 text-5xl">♣️</div>
          <h1 className="text-4xl font-black leading-none tracking-tight">Clubr<span className="text-accent-blue">GO</span></h1>
          <span className="mt-2 inline-flex items-center gap-1.5 self-start rounded-full border border-border bg-bg-surface px-2.5 py-1 text-[11px] font-bold text-text-secondary">
            <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-accent-violet to-accent-blue" />Nocturne · visual direction
          </span>
          <p className="mt-3 max-w-[18rem] text-base leading-snug text-text-secondary">
            Run fun side-games with your poker club — <span className="font-semibold text-text-primary">FT Fantasy, Last Longer & Squares</span> — all in one place.
          </p>
          <p className="mt-2 max-w-[18rem] text-sm text-text-muted">
            ClubrGo keeps score transparently and holds no cash. Stakes settle between players offline.
          </p>

          <div className="mt-8 flex flex-col gap-2.5">
            {ROLES.map((r) => (
              <button key={r.role} onClick={() => login(r.role)} className="group flex items-center gap-3 rounded-2xl border border-border bg-bg-card p-3 text-left transition hover:bg-bg-surface active:scale-[.99]">
                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${r.cls} text-white shadow-lg`}><r.icon className="h-5 w-5" /></span>
                <span className="flex-1">
                  <span className="block text-sm font-bold">{r.label}</span>
                  <span className="text-xs text-text-muted">{r.sub}</span>
                </span>
                <ArrowRight className="h-4 w-4 text-text-muted transition group-hover:translate-x-0.5 group-hover:text-text-secondary" />
              </button>
            ))}
          </div>
        </div>
        <div className="relative px-6 pb-8 text-center text-[11px] text-text-muted">Demo prototype · pick any role to explore</div>
      </div>
    </div>
  )
}
