import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Coins, AlertTriangle } from 'lucide-react'
import { Sheet, Btn } from '@/components/common/ui'
import { useAuth } from '@/contexts/AuthContext'
import { useWallet } from '@/hooks/credits'
import * as credits from '@/lib/api/creditsServices'
import type { CreditTxnKind } from '@/types/credits'

export interface SpendRequest {
  cost: number
  kind: CreditTxnKind
  label: string        // ledger line, e.g. 'Joined WSOP Main FT'
  title: string        // sheet heading, e.g. 'Join this contest'
  verb?: string        // confirm verb, e.g. 'Join' (default 'Confirm')
}

// Promise-based spend gate: `const ok = await spend({...})`. Opens a confirm
// sheet showing the cost + resulting balance; charges on confirm and resolves
// true, or routes to the wallet to buy more when the balance is short.
const SpendCtx = createContext<(r: SpendRequest) => Promise<boolean>>(async () => false)
export const useSpend = () => useContext(SpendCtx)

const fmt = (n: number) => n.toLocaleString('en-US')

export function SpendProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { data: wallet } = useWallet()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [req, setReq] = useState<SpendRequest | null>(null)
  const [busy, setBusy] = useState(false)
  const resolver = useRef<((v: boolean) => void) | null>(null)

  const requestSpend = useCallback((r: SpendRequest) => new Promise<boolean>((resolve) => { resolver.current = resolve; setReq(r) }), [])
  const finish = (v: boolean) => { resolver.current?.(v); resolver.current = null; setReq(null) }

  const balance = wallet?.balance ?? 0
  const enough = req ? balance >= req.cost : false

  async function onConfirm() {
    if (!req || !user) return
    setBusy(true)
    const res = await credits.spend(user.id, req.kind, req.label, req.cost)
    await qc.invalidateQueries({ queryKey: ['credits'] })
    setBusy(false)
    finish(res.ok)
  }

  return (
    <SpendCtx.Provider value={requestSpend}>
      {children}
      <Sheet open={!!req} onClose={() => finish(false)} title={req?.title ?? 'Confirm'}>
        {req && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-border bg-bg-surface/60 px-3 py-2.5">
              <Coins className="h-5 w-5 text-accent-amber" />
              <span className="text-sm text-text-secondary">This costs</span>
              <span className="ml-auto font-mono text-lg font-extrabold text-text-primary">{fmt(req.cost)} <span className="text-xs font-normal text-text-muted">cr</span></span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border bg-bg-card px-3 py-2 text-xs">
              <span className="text-text-muted">Your balance</span>
              <span className="font-mono font-semibold text-text-primary">{fmt(balance)} {enough && <span className="text-text-muted">→ {fmt(balance - req.cost)}</span>}</span>
            </div>
            {enough ? (
              <Btn className="w-full" disabled={busy} onClick={onConfirm}><Coins className="h-4 w-4" />{req.verb ?? 'Confirm'} · −{fmt(req.cost)} cr</Btn>
            ) : (
              <>
                <div className="flex items-start gap-2 rounded-xl border border-accent-red/30 bg-accent-red/10 px-3 py-2 text-xs text-text-secondary">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-accent-red" />
                  Not enough credits — you need <b className="text-text-primary">{fmt(req.cost - balance)}</b> more.
                </div>
                <Btn className="w-full" onClick={() => { finish(false); navigate('/wallet') }}><Coins className="h-4 w-4" />Buy credits</Btn>
              </>
            )}
            <p className="text-center text-[10px] text-text-muted">Credits are a facilitation fee — never a prize. Stakes are settled offline.</p>
          </div>
        )}
      </Sheet>
    </SpendCtx.Provider>
  )
}
