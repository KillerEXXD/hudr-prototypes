const ROLES = [
  { label: 'Continue as Player', sub: 'Join clubs, draft & play', icon: '🎯', cls: 'from-sky-500 to-violet-500' },
  { label: 'Continue as Club Host', sub: 'Create clubs, run games', icon: '♣', cls: 'from-emerald-500 to-sky-500' },
  { label: 'Continue as App Admin', sub: 'Oversee everything', icon: '🛡️', cls: 'from-amber-500 to-rose-500' },
]

export function Onboarding({ onEnter }: { onEnter: () => void }) {
  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      {/* ambient glow */}
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-sky-600/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-40 h-72 w-72 rounded-full bg-violet-600/20 blur-3xl" />

      <div className="relative flex flex-1 flex-col justify-center px-6">
        <div className="mb-2 text-5xl">♣️</div>
        <h1 className="text-4xl font-black leading-none tracking-tight">Clubr<span className="text-sky-400">GO</span></h1>
        <span className="mt-2 inline-flex items-center gap-1.5 self-start rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-zinc-300"><span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-violet-400 to-sky-400" />Nocturne · visual direction</span>
        <p className="mt-3 max-w-[18rem] text-base leading-snug text-zinc-300">
          Run fun side-games with your poker club — <span className="font-semibold text-white">FT Fantasy, Last Longer & Squares</span> — all in one place.
        </p>
        <p className="mt-2 max-w-[18rem] text-sm text-zinc-500">
          ClubrGo keeps score transparently and holds no cash. Stakes settle between players offline.
        </p>

        <div className="mt-8 flex flex-col gap-2.5">
          {ROLES.map((r) => (
            <button key={r.label} onClick={onEnter} className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-left transition hover:bg-white/[0.08] active:scale-[.99]">
              <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${r.cls} text-lg shadow-lg`}>{r.icon}</span>
              <span className="flex-1">
                <span className="block text-sm font-bold">{r.label}</span>
                <span className="text-xs text-zinc-500">{r.sub}</span>
              </span>
              <span className="text-zinc-600 transition group-hover:translate-x-0.5 group-hover:text-zinc-300">→</span>
            </button>
          ))}
        </div>
      </div>

      <div className="relative px-6 pb-8 text-center text-[11px] text-zinc-600">
        Demo prototype · pick any role to explore
      </div>
    </div>
  )
}
